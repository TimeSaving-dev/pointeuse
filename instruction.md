# Aperçu du projet
Vous devez construire une application de gestion des présences basée sur le scan de QR codes. L’application est destinée aux utilisateurs qui, via leur smartphone ou un lecteur de QR code, pourront enregistrer leur début de journée, prendre des pauses et clôturer leur journée. Trois QR codes dédiés permettront de déclencher ces actions, et chaque scan redirigera l’utilisateur vers une page de confirmation avec un message personnalisé (ex. « Bonne journée », « Bonne pause », « Fin de journée enregistrée »). L’authentification est gérée via NextAuth avec JWT, et les données seront enregistrées dans une base PostgreSQL via Prisma.

# Fonctionnalités principales

Scans et Transitions (QR Codes)

QR Code Check-In
Début de journée :
Lors du premier scan du jour, l’utilisateur lance son check-in.
La page de confirmation affichera un message de bienvenue (« Bonne journée »).
Une requête est envoyée à l’endpoint POST /api/checkin qui vérifie la session utilisateur, récupère (si possible) la géolocalisation via l’API Geolocation native du navigateur (avec gestion des permissions) et enregistre l’événement dans la table CheckIn.
Reprise après une pause :
Après avoir scanné le QR Code Pause, l’utilisateur revient en scannant à nouveau le QR Code Check-In.
Le système doit détecter qu’un enregistrement de pause a été effectué juste avant (ou qu’un état « pause » est actif) et interpréter ce nouveau scan comme la reprise de travail.
La page de confirmation doit alors indiquer « Vous avez repris votre travail » et enregistrer un nouvel événement dans CheckIn pour marquer la reprise.
QR Code Pause
Lorsque l’utilisateur souhaite prendre une pause (par exemple, une pause café), il scanne le QR Code Pause.
La page de confirmation affichera « Bonne pause ».
L’endpoint POST /api/pause est appelé, qui vérifie la session et enregistre l’instant du début de la pause dans la table Pause.
QR Code Check-Out
En fin de journée, l’utilisateur scanne le QR Code Check-Out.
La page de confirmation affiche « Fin de journée enregistrée ».
Une requête vers l’endpoint POST /api/checkout est effectuée, enregistrant la fin de la journée dans la table Checkout.
Gestion des Transitions entre Check-In et Pause

Logique côté serveur :
Le backend doit être capable de distinguer un check-in initial d’un check-in de reprise.
Pour cela, il pourra consulter l’historique des actions de l’utilisateur. Par exemple, si la dernière action enregistrée est une pause sans reprise ultérieure, le scan du QR Code Check-In sera traité comme une reprise.
Cette logique permet d’enregistrer correctement la séquence des événements et d’éviter la création d’enregistrements redondants ou incohérents.
Feedback utilisateur :
Chaque page de confirmation doit afficher un message contextuel adapté (ex. « Bonne journée » pour un début, « Vous avez repris votre travail » après une pause, etc.) afin d’assurer une bonne expérience utilisateur.
Authentification et Sécurité

Utiliser NextAuth avec JWT pour vérifier que chaque requête API (check-in, pause, check-out) provient d’un utilisateur authentifié.
Mettre en place un middleware (basé sur Redis) pour le rate limiting sur les endpoints sensibles afin d’éviter les abus (ex. plus d’une action par minute par utilisateur).
Enrichissement des données

Géolocalisation côté client :
Utilisez l’API Geolocation native du navigateur (navigator.geolocation.getCurrentPosition()) pour récupérer latitude, longitude et précision.
Gérer les cas d’erreur (utilisateur refuse la géolocalisation) et proposer éventuellement une saisie manuelle de l’adresse si nécessaire.
Stockage des événements :
Les événements (check-in, pause, check-out) sont enregistrés dans des tables dédiées avec Prisma dans PostgreSQL.
La gestion de l’historique permettra de reconstituer la journée de travail pour chaque utilisateur.
Interface Administrateur

Un tableau de bord admin permet d’exporter les enregistrements en CSV via une requête SQL qui joint les tables User, CheckIn, Pause et Checkout.
Possibilité de corriger manuellement les enregistrements via des endpoints dédiés (exemple de correction d’un timestamp).
Import CSV pour ajouter de nouveaux utilisateurs en masse, avec gestion du hachage des mots de passe.
# Modèles de Données (Prisma)

prisma
Copier
model User {
  id          String    @id @default(uuid())
  email       String    @unique
  password    String
  isActive    Boolean   @default(false)
  createdAt   DateTime  @default(now())
  checkIns    CheckIn[]
  pauses      Pause[]
  checkouts   Checkout[]
}

model CheckIn {
  id          String   @id @default(uuid())
  userId      String
  latitude    Float
  longitude   Float
  address     String?  // Saisie manuelle possible
  timestamp   DateTime @default(now())
  accuracy    Float?
}

model Pause {
  id          String   @id @default(uuid())
  userId      String
  timestamp   DateTime @default(now())
}

model Checkout {
  id          String   @id @default(uuid())
  userId      String
  latitude    Float
  longitude   Float
  timestamp   DateTime @default(now())
}
# Endpoints API

Check-In (POST /api/checkin)

Vérification de la session via NextAuth.
Récupération de la position via l’API Geolocation du navigateur (passée dans la requête depuis le client).
Vérification de l’historique de l’utilisateur pour déterminer s’il s’agit d’un check-in initial ou d’une reprise après pause.
Enregistrement dans prisma.checkIn.create().
Renvoi d’une réponse avec le message approprié.
Pause (POST /api/pause)

Vérification de la session.
Enregistrement de l’heure de début de pause dans prisma.pause.create().
Réponse confirmant que la pause a été prise en compte.
Checkout (POST /api/checkout)

Vérification de la session.
Enregistrement dans prisma.checkout.create().
Renvoi d’une réponse confirmant la fin de journée.
# Workflow d’Authentification et Sécurité

NextAuth Configuration
Intégrez NextAuth en configurant le JWT pour stocker l’ID utilisateur, par exemple :

typescript
Copier
// auth.ts
export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.userId = user.id;
      return token;
    }
  }
};
Middleware pour Rate Limiting
Protégez vos endpoints sensibles avec un middleware basé sur Redis :

typescript
Copier
// middleware.ts
export const config = {
  matcher: '/api/(checkin|pause|checkout)'
};

export async function middleware(req: NextRequest) {
  const ip = req.ip;
  const key = `rate-limit:${ip}`;
  
  if (await redis.get(key) > 100) {
    return new Response('Too many requests', { status: 429 });
  }
  await redis.incr(key);
  await redis.expire(key, 60);
}
# Interface Client

QR Codes et Navigation

La page d’accueil ou l’interface mobile affichera les trois QR codes (Check-In, Pause, Check-Out).
Chaque QR code contient l’URL correspondant à l’action (ex. /api/checkin, /api/pause, /api/checkout).
Après scan, l’utilisateur est redirigé vers une page de confirmation qui affiche le message correspondant (ex. « Bonne journée » ou « Vous avez repris votre travail » pour le check-in, « Bonne pause » pour la pause, etc.).
Gestion de la Géolocalisation côté Client

Utilisez navigator.geolocation.getCurrentPosition() pour obtenir les coordonnées.
Si la géolocalisation est autorisée, envoyez ces données dans la requête POST vers l’endpoint correspondant.
Gérer les erreurs et proposer, en cas de refus, une saisie manuelle de l’adresse si nécessaire.
# Interface Administrateur

Export CSV

Créez un endpoint /api/export qui exécute une requête SQL pour joindre les tables et exporter les enregistrements (User, CheckIn, Pause, Checkout).
L’interface d’admin (par exemple en React avec React-Admin) intègre un bouton déclenchant cet export et le téléchargement du fichier CSV.
Correction Manuelle et Import CSV

Implémentez des endpoints pour permettre à l’admin de corriger les enregistrements (ex. /api/admin/correct/[id]) et d’importer des utilisateurs via CSV (/api/admin/import-users).
# Consignes de Développement et Architecture

Structure du Projet

Tous les composants réutilisables doivent être dans /components (ex. ExampleComponent.tsx).
Toutes les pages vont dans /app en utilisant le routeur de Next.js (v14).
La logique de récupération de données s’effectue côté serveur et est passée en props aux composants clients.
Appels API et Variables d’Environnement

Tous les appels aux API externes (ici, la géolocalisation est gérée côté client) et la gestion des secrets (ex. pour NextAuth) doivent être sécurisés via des variables d’environnement stockées dans .env.local (qui sera dans le .gitignore).
TypeScript, Gestion d’Erreurs et Logging

Utilisez des interfaces TypeScript pour toutes les structures de données.
Implémentez une gestion robuste des erreurs côté client et serveur (try/catch) et loggez les erreurs avec Winston et Sentry.
NextAuth et Sécurité

Assurez-vous que chaque requête aux endpoints sensibles vérifie l’authentification.
Ne jamais exposer de clés sensibles côté client.
Tests et Documentation

Documentez chaque endpoint et composant, et mettez en place des tests unitaires et d’intégration pour garantir la stabilité du système.
