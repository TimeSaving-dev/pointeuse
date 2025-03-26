import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AccountStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { name, email, company, password } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont obligatoires" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    let isAdmin = false;
    let accountStatus: AccountStatus = "PENDING";
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      isAdmin = true;
      accountStatus = "APPROVED";
    }


    // Créer le nouvel utilisateur
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        company,
        password: hashedPassword,
        isActive: true,
        isAdmin: isAdmin,
        accountStatus: accountStatus
      },
    });

    // Pour chaque administrateur, créer une notification
    if (!isAdmin) {
      // Créer une notification pour les administrateurs
      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
      });

      console.log(`Création de notifications pour ${admins.length} administrateurs`);

      if (admins.length > 0) {
        await Promise.all(
          admins.map((admin) =>
            prisma.notification.create({
              data: {
                userId: admin.id,
                title: "⚠️ Nouvel utilisateur en attente",
                message: `${name} (${email}) attend votre approbation pour accéder à la plateforme.`,
                type: "user_registration",
                relatedId: newUser.id,
                read: false, // S'assurer que c'est explicitement non lu
              },
            })
          )
        );
        
        console.log(`Notifications créées avec succès pour le nouvel utilisateur ${newUser.id}`);
      }
    }
    

    // Retourner les informations utilisateur (sans le mot de passe)
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
      message: "Inscription réussie! Votre compte est en attente d'approbation par un administrateur.",
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription" },
      { status: 500 }
    );
  }
} 