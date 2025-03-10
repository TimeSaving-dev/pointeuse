import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(`Récupération des notifications pour l'admin ID: ${userId}`);
    
    // Récupérer les notifications non lues
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Nombre de notifications trouvées: ${notifications.length}`);
    notifications.forEach((notif, idx) => {
      console.log(`Notification ${idx+1}: ID=${notif.id}, Type=${notif.type}, RelatedId=${notif.relatedId}, Read=${notif.read}`);
    });

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}

// Marquer une notification comme lue
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { notificationId } = await request.json();
    if (!notificationId) {
      return NextResponse.json(
        { error: "ID de notification requis" },
        { status: 400 }
      );
    }

    // Marquer la notification comme lue
    await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notification marquée comme lue",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la notification:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour de la notification" },
      { status: 500 }
    );
  }
}

// Nettoyer les notifications
export async function PATCH(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { action } = await request.json();
    
    if (action === "reset_counter") {
      // Récupérer les IDs de tous les utilisateurs avec statut APPROVED ou REJECTED
      // const processedUsers = await prisma.user.findMany({
      //   where: {
      //     OR: [
      //       { accountStatus: "APPROVED" },
      //       { accountStatus: "REJECTED" }
      //     ]
      //   },
      //   select: { id: true }
      // });
      
      // const processedUserIds = processedUsers.map(user => user.id);
      // console.log(`Utilisateurs traités trouvés: ${processedUserIds.length}`);
      
      // Marquer toutes les notifications liées à ces utilisateurs comme lues
      const result = await prisma.notification.updateMany({
        where: {
          // relatedId: { in: processedUserIds },
          // type: "user_registration",
          read: false
        },
        data: { read: true }
      });
      
      console.log(`Notifications mises à jour: ${result.count}`);
      
      return NextResponse.json({
        success: true,
        message: `${result.count} notifications ont été mises à jour`,
        updatedCount: result.count
      });
    }
    
    return NextResponse.json(
      { error: "Action non valide" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour des notifications:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour des notifications" },
      { status: 500 }
    );
  }
} 