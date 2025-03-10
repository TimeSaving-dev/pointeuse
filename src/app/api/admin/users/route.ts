import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { hashPassword } from "@/lib/auth-utils";

// Récupérer tous les utilisateurs
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    // Récupérer les paramètres de requête
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    
    // Construire la requête
    const whereClause: any = {};
    if (status) {
      whereClause.accountStatus = status.toUpperCase();
    }

    // Récupérer les utilisateurs
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        accountStatus: true,
        createdAt: true,
        isAdmin: true,
        position: true,
        hourlyRate: true,
        company: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}

// Mettre à jour le statut d'un utilisateur
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

    const { userId, accountStatus } = await request.json();
    
    if (!userId || !accountStatus) {
      return NextResponse.json(
        { error: "ID utilisateur et statut requis" },
        { status: 400 }
      );
    }

    // Vérifier que le statut est valide
    if (!["PENDING", "APPROVED", "REJECTED"].includes(accountStatus)) {
      return NextResponse.json(
        { error: "Statut invalide" },
        { status: 400 }
      );
    }

    // Utiliser une transaction pour garantir l'atomicité des opérations
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour l'utilisateur
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { accountStatus },
        select: {
          id: true,
          name: true,
          email: true,
          accountStatus: true,
        },
      });
      
      // 2. Marquer toutes les notifications liées comme lues
      const notificationsUpdate = await tx.notification.updateMany({
        where: {
          relatedId: userId,
          type: "user_registration",
          read: false,
        },
        data: {
          read: true,
        },
      });
      
      console.log(`Notifications mises à jour: ${notificationsUpdate.count} pour l'utilisateur ${userId}`);
      
      return {
        user: updatedUser,
        notificationsUpdated: notificationsUpdate.count
      };
    });

    return NextResponse.json({
      success: true,
      user: result.user,
      notificationsUpdated: result.notificationsUpdated,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), { 
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const data: { userId: string; action: 'APPROVE' | 'REJECT' } = await request.json();
    // ... existing code ...
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    );
  }
}

// Créer un nouvel utilisateur
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

    // Récupérer les données du corps de la requête
    const { name, email, password, position, hourlyRate, company, accountStatus, isAdmin } = await request.json();
    
    // Validation des données
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'email est déjà utilisé
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // Vérifier que le statut est valide
    if (accountStatus && !["PENDING", "APPROVED", "REJECTED"].includes(accountStatus)) {
      return NextResponse.json(
        { error: "Statut invalide" },
        { status: 400 }
      );
    }

    // Hacher le mot de passe
    const hashedPassword = await hashPassword(password);

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
        position: position || null,
        hourlyRate: hourlyRate || null,
        company: company || null,
        accountStatus: accountStatus || "APPROVED",
        isAdmin: isAdmin || false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        hourlyRate: true,
        company: true,
        accountStatus: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: newUser,
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
} 