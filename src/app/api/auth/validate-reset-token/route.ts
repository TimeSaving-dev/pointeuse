import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les paramètres de la requête
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      );
    }

    // Chercher le token dans la base de données
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

    // Le token est valide
    return NextResponse.json({
      success: true,
      message: "Token valide",
    });
  } catch (error) {
    console.error("Erreur lors de la validation du token:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la validation du token" },
      { status: 500 }
    );
  }
} 