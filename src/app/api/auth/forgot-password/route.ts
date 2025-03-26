import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail, generatePasswordResetEmail } from "@/lib/mail-utils";

// Durée de validité du token en heures
const TOKEN_EXPIRY_HOURS = 24;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validation de base
    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Pour des raisons de sécurité, nous retournons toujours un message de succès
    // même si l'utilisateur n'existe pas, pour éviter la divulgation d'informations
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Si un compte est associé à cette adresse, un email vous a été envoyé.",
      });
    }

    // Générer un token aléatoire
    const token = crypto.randomBytes(32).toString("hex");
    
    // Calculer la date d'expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    // Supprimer les anciens tokens non utilisés pour cet email
    await prisma.passwordReset.deleteMany({
      where: {
        email,
        used: false,
      },
    });

    // Créer un nouvel enregistrement de réinitialisation
    await prisma.passwordReset.create({
      data: {
        email,
        token,
        expiresAt,
        used: false,
      },
    });

    // Construire le lien de réinitialisation
    const baseUrl = process.env.NEXTAUTH_URL || request.headers.get("origin") || "http://localhost";
    const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;

    // Envoyer l'email de réinitialisation
    const emailOptions = generatePasswordResetEmail(email, resetLink);
    await sendEmail(emailOptions);

    // En mode développement, inclure le lien dans la réponse pour faciliter les tests
    const response: any = {
      success: true,
      message: "Si un compte est associé à cette adresse, un email vous a été envoyé.",
    };
    
    if (process.env.NODE_ENV === "development") {
      response.resetLink = resetLink;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur lors de la demande de réinitialisation:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la demande de réinitialisation" },
      { status: 500 }
    );
  }
} 