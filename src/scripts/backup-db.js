// Script pour sauvegarder la base de données
const fs = require('fs');
const path = require('path');

// Chemin vers la base de données SQLite
const DB_PATH = path.join(__dirname, '../../prisma/dev.db');
// Répertoire de sauvegarde
const BACKUP_DIR = path.join(__dirname, '../../backups');

// Créer le répertoire de sauvegarde s'il n'existe pas
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Répertoire de sauvegarde créé: ${BACKUP_DIR}`);
}

// Nom du fichier de sauvegarde avec horodatage
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}.db`);

try {
  // Vérifier si le fichier DB existe
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Erreur: La base de données n'existe pas à ${DB_PATH}`);
    process.exit(1);
  }

  // Copier le fichier de base de données
  fs.copyFileSync(DB_PATH, backupPath);
  console.log(`Sauvegarde créée avec succès: ${backupPath}`);

  // Supprimer les anciennes sauvegardes (garder les 5 dernières)
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('backup-') && file.endsWith('.db'))
    .map(file => path.join(BACKUP_DIR, file))
    .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());

  if (backups.length > 5) {
    backups.slice(5).forEach(file => {
      fs.unlinkSync(file);
      console.log(`Ancienne sauvegarde supprimée: ${file}`);
    });
  }
} catch (error) {
  console.error(`Erreur lors de la sauvegarde: ${error.message}`);
  process.exit(1);
} 