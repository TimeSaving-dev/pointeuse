#!/bin/bash

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "Docker n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérifier que Docker Compose est installé
if ! docker compose version &> /dev/null; then
    echo "Docker Compose n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Arrêter les containers existants si nécessaire
echo "Arrêt des containers existants..."
docker compose -f compose.prod.yml down

# Lancer les containers en mode détaché
echo "Démarrage de l'application en mode production avec HTTPS..."
docker compose -f compose.prod.yml up -d

echo "L'application est disponible à l'adresse https://localhost"
echo "Note: Comme le certificat est auto-signé, vous devrez accepter l'avertissement de sécurité dans votre navigateur." 