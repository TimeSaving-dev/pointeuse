import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Clé API OpenCage 
const OPENCAGE_API_KEY = 'acf16ce087b7418e8f68cd640a207853';

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
  try {
    // Pour le MVP: récupérer userId directement du body
    const { 
      latitude, 
      longitude, 
      // Suppression des variables non utilisées en les commentant
      // accuracy, 
      // altitude, 
      // altitudeAccuracy, 
      // heading, 
      // speed, 
      // timestamp,
      userId
    } = await request.json();

    if (!userId) {
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
      console.log("Utilisation d'un utilisateur de démonstration pour le checkout:", userIdToUse);
    } else {
      console.log("Utilisation de l'ID utilisateur fourni pour le checkout:", userIdToUse);
      
      // Vérifier si l'utilisateur existe
      const userExists = await prisma.user.findUnique({
        where: { id: userIdToUse },
        select: { id: true }
      });
      
      if (!userExists) {
        console.error("L'utilisateur spécifié n'existe pas - ID:", userIdToUse);
        return NextResponse.json(
          { error: "Utilisateur non trouvé. Veuillez vous reconnecter." },
          { status: 404 }
        );
      }
    }

    // Vérifier si l'utilisateur a déjà fait un check-in aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const hasCheckedInToday = await prisma.checkIn.findFirst({
      where: {
        userId: userIdToUse,
        timestamp: {
          gte: today,
        },
      },
    });

    if (!hasCheckedInToday) {
      return NextResponse.json(
        { error: "Vous devez d'abord faire un check-in avant de faire un check-out" },
        { status: 400 }
      );
    }

    // Obtenir l'adresse si les coordonnées sont fournies
    let address = null;
    if (latitude && longitude) {
      address = await getAddressFromCoordinates(latitude, longitude);
    }

    try {
      // Créer l'enregistrement de check-out avec la relation explicite
      const checkout = await prisma.checkout.create({
        data: {
          latitude: latitude || null,
          longitude: longitude || null,
          address: address,
          user: {
            connect: { id: userIdToUse }
          }
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: "Fin de journée enregistrée",
        checkout,
        address
      });
    } catch (error) {
      console.error("Erreur lors de la création du check-out:", error);
      
      // Si l'utilisateur n'existe pas, créer un utilisateur démo et réessayer
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        const demoUser = await getOrCreateDemoUser();
        
        const checkout = await prisma.checkout.create({
          data: {
            latitude: latitude || null,
            longitude: longitude || null,
            address: address,
            user: {
              connect: { id: demoUser.id }
            }
          },
        });
        
        return NextResponse.json({ 
          success: true, 
          message: "Fin de journée enregistrée",
          checkout,
          address
        });
      } else {
        throw error;  // Relancer l'erreur si ce n'est pas une erreur d'utilisateur non trouvé
      }
    }
  } catch (error) {
    console.error("Erreur lors du check-out:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du check-out" },
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