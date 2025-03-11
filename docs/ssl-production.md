# Configuration SSL pour la production

Ce guide explique comment configurer des certificats SSL valides pour votre environnement de production en utilisant Let's Encrypt.

## Prérequis

- Un nom de domaine pointant vers votre serveur
- Un serveur accessible sur Internet
- Docker et Docker Compose installés

## Instructions pour Let's Encrypt avec Certbot

1. **Modifier la configuration Nginx**

   Remplacez le contenu de `nginx/default.conf` par celui-ci (en remplaçant `votre-domaine.com` par votre vrai domaine) :

   ```nginx
   server {
       listen 80;
       server_name votre-domaine.com;
       
       # Pour la validation Let's Encrypt
       location /.well-known/acme-challenge/ {
           root /var/www/certbot;
       }
       
       # Rediriger HTTP vers HTTPS
       location / {
           return 301 https://$host$request_uri;
       }
   }

   server {
       listen 443 ssl;
       server_name votre-domaine.com;

       # Certificats Let's Encrypt
       ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
       
       # Paramètres SSL recommandés
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_prefer_server_ciphers on;
       ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
       ssl_session_timeout 1d;
       ssl_session_cache shared:SSL:10m;
       ssl_stapling on;
       ssl_stapling_verify on;
       
       # Proxy vers l'application Next.js
       location / {
           proxy_pass http://pointeuse_web:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

2. **Ajouter Certbot au fichier Docker Compose**

   Modifiez `compose.prod.yml` pour ajouter le service Certbot :

   ```yaml
   services:
     # ... autres services ...
     
     certbot:
       image: certbot/certbot
       volumes:
         - ./certbot/conf:/etc/letsencrypt
         - ./certbot/www:/var/www/certbot
       entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h; done;'"
       depends_on:
         - nginx
   ```

3. **Créer les répertoires nécessaires**

   ```bash
   mkdir -p certbot/conf
   mkdir -p certbot/www
   ```

4. **Obtenir le certificat initial**

   ```bash
   docker run -it --rm \
     -v $(pwd)/certbot/conf:/etc/letsencrypt \
     -v $(pwd)/certbot/www:/var/www/certbot \
     certbot/certbot certonly --webroot \
     --webroot-path=/var/www/certbot \
     --email votre-email@example.com \
     --agree-tos \
     --no-eff-email \
     -d votre-domaine.com
   ```

5. **Mettre à jour votre fichier .env**

   ```
   NEXTAUTH_URL="https://votre-domaine-ou-ip-publique"
   NEXTAUTH_SECRET="votre-secret-nextauth-super-securise"
   JWT_SECRET="votre-secret-jwt-super-securise"
   SECURE_COOKIES="true"

   # WEB
   WEB_HOST_PORT=3000
   ```

6. **Démarrer les services avec Docker Compose**

   ```bash
   docker compose -f compose.prod.yml up -d
   ```

## Renouvellement automatique des certificats

Les certificats Let's Encrypt expirent après 90 jours. Le service Certbot que nous avons configuré tentera automatiquement de renouveler les certificats tous les 12 heures, mais uniquement si l'expiration est proche.

## Vérification de la configuration SSL

Vous pouvez vérifier la qualité de votre configuration SSL en utilisant [SSL Labs](https://www.ssllabs.com/ssltest/) en entrant votre nom de domaine. 