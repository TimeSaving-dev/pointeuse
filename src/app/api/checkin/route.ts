import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Clé API OpenCage 
const OPENCAGE_API_KEY = 'acf16ce087b7418e8f68cd640a207853';

// Générer un identifiant unique pour chaque requête
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Fonction pour obtenir l'adresse à partir des coordonnées
async function getAddressFromCoordinates(latitude: number, longitude: number) {
  try {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPENCAGE_API_KEY}&language=fr&pretty=1`
    );
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Récupérer l'adresse formatée
      const formattedAddress = data.results[0].formatted;
      console.log(`Adresse trouvée: ${formattedAddress}`);
      return formattedAddress;
    } else {
      console.log("Aucune adresse trouvée pour ces coordonnées");
      return null;
    }
  } catch (error) {
    console.error("Erreur lors de la conversion des coordonnées en adresse:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  console.log(`[${requestId}] DÉBUT TRAITEMENT CHECK-IN - ${new Date().toISOString()}`);

  try {
    // Pour le MVP: récupérer userId directement du body
    const { 
      latitude, 
      longitude, 
      accuracy, 
      altitude,
      altitudeAccuracy,
      heading,
      speed,
      timestamp,
      userId 
    } = await request.json();

    console.log(`[${requestId}] Données reçues: userId=${userId}, latitude=${latitude}, longitude=${longitude}`);

    if (!userId) {
      console.log(`[${requestId}] ERREUR: ID utilisateur manquant`);
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    // Utiliser directement l'ID fourni dans la requête si ce n'est pas "anonymous"
    // Cela permet aux utilisateurs authentifiés d'utiliser leur vrai ID
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

    // Vérifier les check-ins récents pour éviter les doublons
    const lastMinute = new Date(new Date().getTime() - 60 * 1000); // 60 secondes en arrière
    const recentCheckins = await prisma.checkIn.findMany({
      where: { 
        userId: userIdToUse,
        timestamp: {
          gte: lastMinute
        }
      },
      orderBy: { timestamp: 'desc' },
    });

    if (recentCheckins.length > 0) {
      console.log(`[${requestId}] ALERTE DOUBLON: Check-in récent trouvé pour cet utilisateur dans la dernière minute`);
      console.log(`[${requestId}] Check-in récent: id=${recentCheckins[0].id}, timestamp=${recentCheckins[0].timestamp}, isReturn=${recentCheckins[0].isReturn}`);
      
      // Retourner le check-in existant plutôt que d'en créer un nouveau
      console.log(`[${requestId}] PRÉVENTION DOUBLON: Retour du check-in existant au lieu d'en créer un nouveau`);
      
      // Déterminer le message approprié en fonction du dernier check-in
      const message = recentCheckins[0].isReturn ? "Vous avez déjà repris votre travail" : "Vous êtes déjà pointé";
      
      console.log(`[${requestId}] FIN TRAITEMENT CHECK-IN - Doublon évité - ${new Date().toISOString()}`);
      
      return NextResponse.json({ 
        success: true, 
        message,
        checkIn: recentCheckins[0],
        isDuplicate: true,
        address: recentCheckins[0].address
      });
    }

    // Vérifier si l'utilisateur a une pause active (dernière action = pause sans check-in après)
    const lastPause = await prisma.pause.findFirst({
      where: { userId: userIdToUse },
      orderBy: { timestamp: 'desc' },
    });

    console.log(`[${requestId}] Dernière pause trouvée:`, lastPause ? 
      `id=${lastPause.id}, timestamp=${lastPause.timestamp}` : 
      'Aucune pause trouvée');

    const lastCheckin = await prisma.checkIn.findFirst({
      where: { userId: userIdToUse },
      orderBy: { timestamp: 'desc' },
    });

    console.log(`[${requestId}] Dernier check-in trouvé:`, lastCheckin ? 
      `id=${lastCheckin.id}, timestamp=${lastCheckin.timestamp}, isReturn=${lastCheckin.isReturn}` : 
      'Aucun check-in trouvé');

    // Déterminer si l'utilisateur est en pause
    const isUserOnBreak = Boolean(lastPause && (!lastCheckin || lastPause.timestamp > lastCheckin.timestamp));
    
    console.log(`[${requestId}] L'utilisateur est-il en pause? ${isUserOnBreak ? 'OUI' : 'NON'}`);
    
    // Si l'utilisateur est en pause, refuser le check-in et demander de scanner le QR code de pause
    if (isUserOnBreak) {
      console.log(`[${requestId}] REFUS CHECK-IN: L'utilisateur est actuellement en pause`);
      console.log(`[${requestId}] FIN TRAITEMENT CHECK-IN - Refusé - ${new Date().toISOString()}`);
      
      return NextResponse.json(
        { 
          error: "Vous êtes actuellement en pause", 
          message: "Pour reprendre votre travail, veuillez scanner le QR code PAUSE",
          userIsOnBreak: true,
          success: false
        },
        { status: 400 }
      );
    }

    // Si tout est ok, continuer avec le check-in normal (ce code était auparavant après la détermination de isReturn)
    // Déterminer si c'est un retour de pause - maintenant toujours false car on bloque les check-ins pendant les pauses
    const isReturn = false;
    
    console.log(`[${requestId}] Ce check-in est-il un retour de pause? ${isReturn ? 'OUI' : 'NON'}`);
    
    if (isReturn) {
      console.log(`[${requestId}] DÉTAIL RETOUR DE PAUSE:`);
      console.log(`[${requestId}] - Dernière pause: ${lastPause?.timestamp}`);
      console.log(`[${requestId}] - Dernier check-in: ${lastCheckin?.timestamp || 'Aucun'}`);
      if (lastPause && lastCheckin) {
        const pauseTime = new Date(lastPause.timestamp).getTime();
        const checkinTime = new Date(lastCheckin.timestamp).getTime();
        console.log(`[${requestId}] - Différence de temps: ${(pauseTime - checkinTime) / 1000} secondes`);
        console.log(`[${requestId}] - La pause est ${pauseTime > checkinTime ? 'après' : 'avant'} le dernier check-in`);
      }
    }

    // Obtenir l'adresse si les coordonnées sont fournies
    let address = null;
    if (latitude && longitude) {
      address = await getAddressFromCoordinates(latitude, longitude);
      console.log(`[${requestId}] Adresse obtenue: ${address || 'Non disponible'}`);
    }

    // Créer l'enregistrement de check-in
    try {
      console.log(`[${requestId}] CRÉATION CHECK-IN - Début`);
      
      // Créer l'enregistrement de check-in avec la relation explicite
      const checkIn = await prisma.checkIn.create({
        data: {
          latitude: latitude || null,
          longitude: longitude || null,
          accuracy: accuracy || null,
          address: address,
          isReturn: isReturn, // Assure que c'est un booléen
          user: {
            connect: { id: userIdToUse }
          }
        },
      });

      console.log(`[${requestId}] CHECK-IN CRÉÉ AVEC SUCCÈS - id=${checkIn.id}, timestamp=${checkIn.timestamp}, isReturn=${checkIn.isReturn}`);

      // Déterminer le message approprié
      const message = isReturn ? "Vous avez repris votre travail" : "Bonne journée";

      console.log(`[${requestId}] FIN TRAITEMENT CHECK-IN - Succès - ${new Date().toISOString()}`);
      
      return NextResponse.json({ 
        success: true, 
        message,
        checkIn,
        address
      });
    } catch (error) {
      console.error(`[${requestId}] ERREUR lors de la création du check-in:`, error);
      
      // Si l'utilisateur n'existe pas, créer un utilisateur démo et réessayer
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        console.log(`[${requestId}] Tentative avec un utilisateur démo après erreur P2025`);
        const demoUser = await getOrCreateDemoUser();
        
        const checkIn = await prisma.checkIn.create({
          data: {
            latitude: latitude || null,
            longitude: longitude || null,
            accuracy: accuracy || null,
            address: address,
            isReturn: isReturn,
            user: {
              connect: { id: demoUser.id }
            }
          },
        });
        
        console.log(`[${requestId}] CHECK-IN CRÉÉ AVEC UTILISATEUR DÉMO - id=${checkIn.id}`);
        
        const message = isReturn ? "Vous avez repris votre travail" : "Bonne journée";
        
        console.log(`[${requestId}] FIN TRAITEMENT CHECK-IN - Succès avec utilisateur démo - ${new Date().toISOString()}`);
        
        return NextResponse.json({ 
          success: true, 
          message,
          checkIn,
          address
        });
      } else {
        throw error;  // Relancer l'erreur si ce n'est pas une erreur d'utilisateur non trouvé
      }
    }
  } catch (error) {
    console.error(`[${requestId}] ERREUR CRITIQUE lors du check-in:`, error);
    console.log(`[${requestId}] FIN TRAITEMENT CHECK-IN - Échec - ${new Date().toISOString()}`);
    
    return NextResponse.json(
      { error: "Une erreur est survenue lors du check-in" },
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