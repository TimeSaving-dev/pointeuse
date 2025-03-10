import { prisma } from '../lib/prisma.js';

async function main() {
  try {
    // Créer un utilisateur de démo
    const demoUser = await prisma.user.upsert({
      where: { id: "demo-user-id" },
      update: {},
      create: {
        id: "demo-user-id",
        email: "demo@example.com",
        password: "demo-password",
        name: "Utilisateur Demo",
        isActive: true,
      },
    });

    console.log("Utilisateur de démo créé:", demoUser);
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur de démo:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 