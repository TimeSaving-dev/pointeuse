# Données de test pour le tableau de bord administrateur

Ce dossier contient un module de données de test pour faciliter le développement et les tests de l'interface d'administration sans avoir à se connecter à une API ou utiliser des données réelles.

## Utilisation des données de test

Les données de test sont activées en définissant la variable d'environnement `NEXT_PUBLIC_USE_TEST_DATA` à `"true"`.

### Pendant le développement

1. Créez un fichier `.env.local` à la racine du projet s'il n'existe pas déjà
2. Ajoutez la ligne suivante:
   ```
   NEXT_PUBLIC_USE_TEST_DATA="true"
   ```
3. Redémarrez le serveur de développement

### Pendant les tests

Les données de test peuvent également être activées pour les tests automatisés:

```bash
NEXT_PUBLIC_USE_TEST_DATA="true" npm run test
```

## Structure des données de test

Le fichier `testData.ts` génère un jeu de données aléatoires couvrant:

- Plusieurs utilisateurs
- Activités sur plusieurs années
- Journées complètes et incomplètes
- Pauses et temps de travail réalistes
- Variations dans les périodes pour tester l'agrégation

## Comment cela fonctionne

1. La fonction `shouldUseTestData()` vérifie si la variable d'environnement est définie
2. Si elle est activée, la fonction `getTestData()` génère un ensemble complet de données de test
3. Ces données sont utilisées à la place de l'appel API dans le dashboard administrateur

## Important: Désactivation en production

**Les données de test doivent toujours être désactivées en production.**

Assurez-vous que:
1. La variable `NEXT_PUBLIC_USE_TEST_DATA` n'est pas définie dans votre environnement de production
2. Le fichier `.env.local` n'est pas commité dans le dépôt (il est déjà dans `.gitignore`)
3. Vous n'incluez pas cette variable dans vos déploiements

## Personnalisation des données de test

Pour modifier le comportement des données de test, vous pouvez éditer les paramètres dans `testData.ts`:

- Ajuster le nombre d'utilisateurs de test
- Modifier la période couverte par les données
- Changer les plages horaires pour les arrivées/départs
- Personnaliser les durées de pause 