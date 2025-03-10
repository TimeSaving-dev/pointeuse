import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Pour le MVP: récupérer userId directement du body
    const { userId } = await request.json();

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
      console.log("Utilisation d'un utilisateur de démonstration pour la pause:", userIdToUse);
    } else {
      console.log("Utilisation de l'ID utilisateur fourni pour la pause:", userIdToUse);
      
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
        { error: "Vous devez d'abord faire un check-in avant de prendre une pause" },
        { status: 400 }
      );
    }

    try {
      // Créer l'enregistrement de pause avec la relation explicite
      const pause = await prisma.pause.create({
        data: {
          user: {
            connect: { id: userIdToUse }
          }
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: "Bonne pause",
        pause 
      });
    } catch (error) {
      console.error("Erreur lors de la création de la pause:", error);
      
      // Si l'utilisateur n'existe pas, créer un utilisateur démo et réessayer
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        const demoUser = await getOrCreateDemoUser();
        
        const pause = await prisma.pause.create({
          data: {
            user: {
              connect: { id: demoUser.id }
            }
          },
        });
        
        return NextResponse.json({ 
          success: true, 
          message: "Bonne pause",
          pause 
        });
      } else {
        throw error;  // Relancer l'erreur si ce n'est pas une erreur d'utilisateur non trouvé
      }
    }
  } catch (error) {
    console.error("Erreur lors de la pause:", error);
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