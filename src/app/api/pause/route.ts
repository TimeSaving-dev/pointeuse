import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Générer un identifiant unique pour chaque requête
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  console.log(`[${requestId}] DÉBUT TRAITEMENT PAUSE - ${new Date().toISOString()}`);

  try {
    // Pour le MVP: récupérer userId directement du body
    const { 
      userId,
      reason,
      checkForBreak,
      returnFromBreak
    } = await request.json();

    console.log(`[${requestId}] Données reçues: userId=${userId}, raison=${reason}, checkForBreak=${checkForBreak}, returnFromBreak=${returnFromBreak}`);

    if (!userId) {
      console.log(`[${requestId}] ERREUR: ID utilisateur manquant`);
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    // Utiliser directement l'ID fourni dans la requête si ce n'est pas "anonymous"
    let userIdToUse = userId;
    
    // Ne créer un utilisateur démo que si l'ID est explicitement "anonymous" ou "demo-user"
    if (userId === "anonymous" || userId === "demo-user") {
      const demoUser = await getOrCreateDemoUser();
      userIdToUse = demoUser.id;
      console.log(`[${requestId}] Utilisation d'un utilisateur de démonstration: ${userIdToUse}`);
    } else {
      console.log(`[${requestId}] Utilisation du vrai ID utilisateur: ${userIdToUse}`);
      
      // Vérifier si l'utilisateur existe
      const userExists = await prisma.user.findUnique({
        where: { id: userIdToUse },
        select: { id: true }
      });
      
      if (!userExists) {
        console.error(`[${requestId}] ERREUR: Utilisateur non trouvé - ID: ${userIdToUse}`);
        return NextResponse.json(
          { error: "Utilisateur non trouvé. Veuillez vous reconnecter." },
          { status: 404 }
        );
      }
    }
    
    // Vérifier qu'il existe un check-in (l'utilisateur doit être pointé pour pouvoir faire une pause)
    const lastCheckin = await prisma.checkIn.findFirst({
      where: { userId: userIdToUse },
      orderBy: { timestamp: 'desc' },
    });
    
    console.log(`[${requestId}] Dernier check-in trouvé:`, lastCheckin ? 
      `id=${lastCheckin.id}, timestamp=${lastCheckin.timestamp}, isReturn=${lastCheckin.isReturn}` : 
      'Aucun check-in trouvé');
    
    if (!lastCheckin) {
      console.log(`[${requestId}] ERREUR: Aucun check-in trouvé, impossible de faire une pause`);
      return NextResponse.json(
        { error: "Vous devez d'abord pointer votre arrivée avant de prendre une pause" },
        { status: 400 }
      );
    }
    
    // Récupérer la dernière pause
    const lastPause = await prisma.pause.findFirst({
      where: { userId: userIdToUse },
      orderBy: { timestamp: 'desc' },
    });
    
    console.log(`[${requestId}] Dernière pause trouvée:`, lastPause ? 
      `id=${lastPause.id}, timestamp=${lastPause.timestamp}` : 
      'Aucune pause trouvée');

    // Vérifier si l'utilisateur est actuellement en pause
    const pauseDate = lastPause ? new Date(lastPause.timestamp) : null;
    const checkinDate = lastCheckin ? new Date(lastCheckin.timestamp) : null;
    const isUserOnBreak = pauseDate && checkinDate && pauseDate > checkinDate;

    console.log(`[${requestId}] L'utilisateur est-il en pause? ${isUserOnBreak ? 'OUI' : 'NON'}`);

    // Si on demande uniquement à vérifier l'état de pause
    if (checkForBreak) {
      console.log(`[${requestId}] Vérification de l'état de pause uniquement`);
      
      if (isUserOnBreak && lastPause) {
        // Calculer la durée de la pause
        const now = new Date();
        const pauseStart = new Date(lastPause.timestamp);
        const durationMs = now.getTime() - pauseStart.getTime();
        
        // Formater la durée
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        const durationText = `${minutes} min ${seconds} sec`;
        
        // Formater l'heure de début
        const startTimeText = pauseStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        console.log(`[${requestId}] L'utilisateur est en pause depuis ${durationText}`);
        
        return NextResponse.json({
          userIsOnBreak: true,
          pauseStartTime: startTimeText,
          breakDuration: durationText,
          pauseId: lastPause.id,
          success: true
        });
      }
      
      return NextResponse.json({
        userIsOnBreak: false,
        success: true
      });
    }

    // Si on demande explicitement un retour de pause
    if (returnFromBreak) {
      console.log(`[${requestId}] Traitement d'un retour de pause explicite`);
      
      if (!isUserOnBreak) {
        console.log(`[${requestId}] ERREUR: L'utilisateur n'est pas en pause, impossible de faire un retour`);
        return NextResponse.json(
          { error: "Vous n'êtes pas actuellement en pause" },
          { status: 400 }
        );
      }
      
      // Créer un check-in de retour
      const checkIn = await prisma.checkIn.create({
        data: {
          isReturn: true,
          user: {
            connect: { id: userIdToUse }
          }
        },
      });
      
      console.log(`[${requestId}] CHECK-IN DE RETOUR CRÉÉ - id=${checkIn.id}, timestamp=${checkIn.timestamp}`);
      console.log(`[${requestId}] FIN TRAITEMENT RETOUR DE PAUSE - Succès - ${new Date().toISOString()}`);
      
      return NextResponse.json({
        success: true,
        message: "Vous avez repris votre travail",
        checkIn,
        isReturnFromPause: true
      });
    }

    // Vérifier les pauses récentes pour éviter les doublons
    const lastMinute = new Date(new Date().getTime() - 60 * 1000); // 60 secondes en arrière
    const recentPauses = await prisma.pause.findMany({
      where: { 
        userId: userIdToUse,
        timestamp: {
          gte: lastMinute
        }
      },
      orderBy: { timestamp: 'desc' },
    });

    if (recentPauses.length > 0) {
      console.log(`[${requestId}] ALERTE DOUBLON: Pause récente trouvée pour cet utilisateur dans la dernière minute`);
      console.log(`[${requestId}] Pause récente: id=${recentPauses[0].id}, timestamp=${recentPauses[0].timestamp}`);
      
      // Retourner la pause existante plutôt que d'en créer une nouvelle
      console.log(`[${requestId}] PRÉVENTION DOUBLON: Retour de la pause existante au lieu d'en créer une nouvelle`);
      
      console.log(`[${requestId}] FIN TRAITEMENT PAUSE - Doublon évité - ${new Date().toISOString()}`);
      
      return NextResponse.json({ 
        success: true, 
        message: "Vous êtes déjà en pause",
        pause: recentPauses[0],
        isDuplicate: true
      });
    }
    
    // Si l'utilisateur est en pause, on traite comme un retour de pause
    if (isUserOnBreak) {
      console.log(`[${requestId}] RETOUR DE PAUSE détecté - Création d'un check-in de retour`);
      
      try {
        // Créer un check-in de retour 
        const checkIn = await prisma.checkIn.create({
          data: {
            isReturn: true,
            user: {
              connect: { id: userIdToUse }
            }
          },
        });

        console.log(`[${requestId}] CHECK-IN DE RETOUR CRÉÉ - id=${checkIn.id}, timestamp=${checkIn.timestamp}`);
        console.log(`[${requestId}] FIN TRAITEMENT PAUSE (RETOUR) - Succès - ${new Date().toISOString()}`);
        
        return NextResponse.json({ 
          success: true, 
          message: "Vous avez repris votre travail",
          checkIn,
          isReturnFromPause: true
        });
      } catch (error) {
        console.error(`[${requestId}] ERREUR lors de la création du check-in de retour:`, error);
        return NextResponse.json(
          { error: "Une erreur est survenue lors de l'enregistrement du retour de pause" },
          { status: 500 }
        );
      }
    }

    console.log(`[${requestId}] CRÉATION PAUSE - Début`);
    
    // Créer l'enregistrement de pause
    const pause = await prisma.pause.create({
      data: {
        reason: reason,
        user: {
          connect: { id: userIdToUse }
        }
      },
    });

    console.log(`[${requestId}] PAUSE CRÉÉE AVEC SUCCÈS - id=${pause.id}, timestamp=${pause.timestamp}, raison=${reason || "Non spécifié"}`);
    console.log(`[${requestId}] FIN TRAITEMENT PAUSE - Succès - ${new Date().toISOString()}`);

    return NextResponse.json({ 
      success: true, 
      message: "Bonne pause !",
      pause
    });
  } catch (error) {
    console.error(`[${requestId}] ERREUR CRITIQUE lors de la pause:`, error);
    console.log(`[${requestId}] FIN TRAITEMENT PAUSE - Échec - ${new Date().toISOString()}`);
    
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'enregistrement de la pause" },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour obtenir ou créer un utilisateur de démonstration
async function getOrCreateDemoUser() {
  // Chercher l'utilisateur de démo existant
  let demoUser = await prisma.user.findFirst({
    where: { email: "demo@example.com" }
  });

  // Si l'utilisateur n'existe pas, le créer
  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        email: "demo@example.com",
        name: "Utilisateur de démonstration",
        password: "demo-password", // Ne sera jamais utilisé pour la connexion
        isActive: true,
        accountStatus: "APPROVED",
        isAdmin: false
      }
    });
  }

  return demoUser;
} 