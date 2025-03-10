import { prisma } from '../lib/prisma.js';
import bcrypt from "bcryptjs";

async function main() {
  try {
    // Créer les tables dans la base de données
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // Créer un utilisateur de test
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const user = await prisma.user.upsert({
      where: { email: "test@example.com" },
      update: {},
      create: {
        email: "test@example.com",
        password: hashedPassword,
        name: "Utilisateur Test",
        isActive: true,
      },
    });

    console.log("Base de données initialisée avec succès");
    console.log("Utilisateur de test créé:", user);
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base de données:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 