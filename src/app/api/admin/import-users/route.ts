import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth-utils';
import { parse } from 'csv-parse/sync';
import { AccountStatus } from '@prisma/client';

// Type pour le mapping entre les colonnes CSV et les champs utilisateur
interface CSVColumnMapping {
  csvHeader: string;
  userField: string;
  required: boolean;
  example: string;
}

// Valeurs valides pour les statuts et rôles (selon l'énumération du schéma Prisma)
const VALID_STATUSES = [AccountStatus.PENDING, AccountStatus.APPROVED, AccountStatus.REJECTED];
const VALID_ROLES = ['true', 'false'];

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et l'autorisation
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    
    // Récupérer les données du formulaire
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mappingStr = formData.get('mapping') as string;
    
    if (!file || !mappingStr) {
      return NextResponse.json({ error: 'Fichier ou mapping manquant' }, { status: 400 });
    }
    
    const mapping = JSON.parse(mappingStr) as CSVColumnMapping[];
    
    // Lire le contenu du fichier
    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer).toString('utf-8');
    
    // Détecter le délimiteur (point-virgule ou virgule)
    const delimiter = fileContent.includes(';') ? ';' : ',';
    
    // Parser le CSV avec le délimiteur détecté
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: delimiter
    });
    
    // Résultats à retourner
    const results = {
      total: records.length,
      created: 0,
      errors: 0,
      errorDetails: [] as { row: number; errors: string[] }[]
    };
    
    // Vérifier que les champs requis sont présents dans le mapping
    const missingRequiredFields = [];
    
    const requiredFields = [
      { id: 'name', label: 'Nom complet' },
      { id: 'email', label: 'Email' }
    ];
    
    for (const field of requiredFields) {
      if (!mapping.some(m => m.userField === field.id)) {
        missingRequiredFields.push(field.label);
      }
    }
    
    if (missingRequiredFields.length > 0) {
      return NextResponse.json({
        error: `Les champs obligatoires suivants ne sont pas mappés: ${missingRequiredFields.join(', ')}`
      }, { status: 400 });
    }
    
    // Traiter chaque enregistrement
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 pour tenir compte de l'en-tête (ligne 1) et de l'index 0-based
      const rowErrors = [];
      
      // Extraire les données selon le mapping
      const userData: Record<string, any> = {
        accountStatus: AccountStatus.PENDING, // Valeur par défaut
        isAdmin: 'false',      // Valeur par défaut
      };
      
      for (const mapItem of mapping) {
        if (mapItem.userField) {
          userData[mapItem.userField] = record[mapItem.csvHeader] || '';
        }
      }
      
      // Validation basique des données
      if (!userData.email) {
        rowErrors.push('Email manquant');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        rowErrors.push('Format d\'email invalide');
      }
      
      if (!userData.name) {
        rowErrors.push('Nom manquant');
      }
      
      // Valider le statut si fourni
      if (userData.accountStatus && userData.accountStatus !== AccountStatus.PENDING) {
        if (!Object.values(AccountStatus).includes(userData.accountStatus as AccountStatus)) {
          rowErrors.push(`Statut '${userData.accountStatus}' non valide. Valeurs autorisées: PENDING, APPROVED, REJECTED`);
          userData.accountStatus = AccountStatus.PENDING; // Réinitialiser au défaut
        }
      }
      
      // Valider isAdmin si fourni
      if (userData.isAdmin && userData.isAdmin !== 'false') {
        if (userData.isAdmin !== 'true' && userData.isAdmin !== 'false') {
          rowErrors.push(`Valeur isAdmin '${userData.isAdmin}' non valide. Valeurs autorisées: true, false`);
          userData.isAdmin = 'false'; // Réinitialiser au défaut
        }
      }
      
      // Si des erreurs sont trouvées, passer à l'enregistrement suivant
      if (rowErrors.length > 0) {
        results.errors++;
        results.errorDetails.push({ row: rowNumber, errors: rowErrors });
        continue;
      }
      
      try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });
        
        if (existingUser) {
          results.errors++;
          results.errorDetails.push({
            row: rowNumber,
            errors: ['Un utilisateur avec cet email existe déjà']
          });
          continue;
        }
        
        // Hashage du mot de passe s'il est fourni
        if (userData.password) {
          userData.password = await hashPassword(userData.password);
        } else {
          // Générer un mot de passe aléatoire si non fourni
          const randomPassword = Math.random().toString(36).slice(-8);
          userData.password = await hashPassword(randomPassword);
          // Dans un système réel, vous enverriez un email avec le mot de passe temporaire
        }
        
        // Créer l'utilisateur
        await prisma.user.create({
          data: {
            name: userData.name,
            email: userData.email,
            password: userData.password,
            company: userData.company || null,
            isAdmin: userData.isAdmin === 'true',  // Convertir la chaîne en booléen
            accountStatus: (userData.accountStatus as AccountStatus) || AccountStatus.PENDING,
            position: userData.position || null,
            hourlyRate: userData.hourlyRate || null,
          }
        });
        
        results.created++;
      } catch (error) {
        console.error(`Erreur lors de la création de l'utilisateur à la ligne ${rowNumber}:`, error);
        results.errors++;
        results.errorDetails.push({
          row: rowNumber,
          errors: ['Erreur lors de la création de l\'utilisateur']
        });
      }
    }
    
    // Générer les notifications pour l'admin (nouvelles demandes d'inscription)
    if (results.created > 0) {
      try {
        await prisma.notification.create({
          data: {
            title: 'Nouvelles demandes de compte',
            message: `${results.created} nouveaux utilisateurs importés.`,
            type: 'USER_REGISTRATION',
            read: false,
            userId: session.user.id
          }
        });
      } catch (error) {
        console.error('Erreur lors de la création de la notification:', error);
      }
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Erreur lors de l\'importation des utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de l\'importation' },
      { status: 500 }
    );
  }
} 