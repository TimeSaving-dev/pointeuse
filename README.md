# QR Code Pointeuse

Application de gestion des présences basée sur le scan de QR codes. Cette application permet aux utilisateurs d'enregistrer leur début de journée, prendre des pauses et clôturer leur journée via le scan de QR codes dédiés.

## Fonctionnalités

- Authentification des utilisateurs via NextAuth
- Génération de QR codes pour les actions de check-in, pause et check-out
- Enregistrement des événements dans une base de données PostgreSQL
- Géolocalisation pour les check-in et check-out
- Interface utilisateur simple et intuitive

## Prérequis

- Node.js 18+ et npm
- PostgreSQL

## Installation

1. Clonez ce dépôt:
```bash
git clone <url-du-depot>
cd qr_code_pointeuse
```

2. Installez les dépendances:
```bash
npm install
```

3. Configurez les variables d'environnement:
   - Copiez le fichier `.env` et ajustez les valeurs selon votre environnement

4. Créez la base de données et les tables:
```bash
npx prisma migrate dev --name init
```

5. Initialisez la base de données avec un utilisateur de test:
```bash
npx ts-node src/scripts/seed.ts
```

## Démarrage

1. Lancez l'application en mode développement:
```bash
npm run dev
```

2. Accédez à l'application dans votre navigateur:
```
http://localhost:3000
```

3. Connectez-vous avec les identifiants de test:
   - Email: test@example.com
   - Mot de passe: password123

## Utilisation

1. Après connexion, vous accédez au tableau de bord qui affiche les trois QR codes.
2. Scannez le QR code correspondant à l'action souhaitée:
   - **Check-in**: Pour enregistrer votre arrivée ou retour de pause
   - **Pause**: Pour enregistrer une pause
   - **Check-out**: Pour enregistrer votre départ

## Structure du projet

- `/src/app`: Pages et routes de l'application
- `/src/components`: Composants réutilisables
- `/src/lib`: Utilitaires et configurations
- `/prisma`: Schéma de base de données et migrations

## Technologies utilisées

- Next.js 14 avec App Router
- NextAuth pour l'authentification
- Prisma ORM pour la gestion de la base de données
- PostgreSQL comme base de données
- QRCode.js pour la génération des QR codes
- TypeScript pour le typage statique
