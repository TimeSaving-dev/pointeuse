import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    // Validation de base
    if (!token || !password) {
      return NextResponse.json(
        { error: "Token et mot de passe requis" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    // Trouver l'enregistrement de réinitialisation
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
    });

    // Vérifier si le token existe
    if (!passwordReset) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 404 }
      );
    }

    // Vérifier si le token a déjà été utilisé
    if (passwordReset.used) {
      return NextResponse.json(
        { error: "Ce lien a déjà été utilisé" },
        { status: 400 }
      );
    }

    // Vérifier si le token n'a pas expiré
    const now = new Date();
    if (passwordReset.expiresAt < now) {
      return NextResponse.json(
        { error: "Ce lien a expiré" },
        { status: 400 }
      );
    }

    // Trouver l'utilisateur correspondant
    const user = await prisma.user.findUnique({
      where: { email: passwordReset.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Utiliser une transaction pour garantir l'atomicité des opérations
    await prisma.$transaction([
      // Mettre à jour le mot de passe de l'utilisateur
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      
      // Marquer le token comme utilisé
      prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du mot de passe:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la réinitialisation du mot de passe" },
      { status: 500 }
    );
  }
} 