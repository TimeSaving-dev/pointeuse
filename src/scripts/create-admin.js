// Script pour créer un utilisateur administrateur par défaut
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Vérifier si l'administrateur existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });

    if (existingAdmin) {
      console.log('L\'utilisateur administrateur existe déjà.');
      return;
    }

    // Créer l'administrateur
    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Administrateur',
        isAdmin: true,
        isActive: true,
        accountStatus: 'APPROVED',
        position: 'Administrateur',
        hourlyRate: 'N/A',
      },
    });

    console.log(`Utilisateur administrateur créé avec l'ID: ${admin.id}`);
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 