# Kult

Kult organise une liste de contenus culturels à lire, regarder ou terminer. Il classe les contenus à traiter selon une priorité calculée et conserve un historique des contenus terminés.

Le nom affiché dans l’application, les favoris et les métadonnées d’installation web est **Kult** ; le nom technique npm est `kult`. Le manifeste est dans `public/manifest.json`, l’icône de l’application dans `public/kult.svg` et le logo des paramètres dans `public/gaspo_logo.svg`.

Les icônes utilisent un canevas de 512 × 512, un fond noir opaque et des formes gris-blanc `#D9D9D9`. Les PNG `public/kult-192.png` et `kult-512.png` sont les exports standard ; `kult-maskable-512.png` (Android) et `kult-apple-touch-icon.png` (Apple, 180 × 180) appliquent la même marge de 10 % par côté, avec un symbole à 80 % de sa taille d’origine. Ils dérivent du SVG et sont référencés par le manifeste et les métadonnées Apple. Après modification du SVG, régénérer ces exports.

## Fonctionnalités

- Types Book, Movie, Series et Other par défaut ; création, renommage, réorganisation et suppression des types avec réaffectation des contenus.
- Titre, auteur ou créateur, date de publication, dates d’ajout et de fin, mots-clés et notes.
- Statuts Backlog, Ongoing et Completed, avec réouverture d’un contenu terminé vers Backlog ou Ongoing.
- Notes de 1 à 5 pour la priorité, la motivation et la longueur ; formule pondérée intégrant aussi fraîcheur et ancienneté.
- Accueil filtré par type ; historique avec recherche sur titre, auteur et mots-clés, filtres et tri.
- Statistiques par période, export CSV et paramètres de formule et d’affichage.
- Thèmes clair et sombre persistants, stockage local ou Firebase.

## Écrans

| URL | Écran |
| --- | --- |
| `/home` | Home : contenus en attente ou en cours et ajout |
| `/history` | History : contenus terminés, recherche et réouverture |
| `/stats` | Statistics |
| `/settings` | Settings : types, formule, affichage, thème, compte et export |

La racine `/` redirige vers l’accueil. La connexion s’affiche lorsqu’aucune session n’est active. Les écrans secondaires sont chargés à la demande.

## Stack et organisation

React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, React Router, Lucide et Firebase Authentication / Firestore. Les graphiques sont des composants HTML/CSS propres à Kult.

- [src/pages/](src/pages/) : écrans de l’application.
- [src/providers/](src/providers/) : contexte et fournisseurs locaux/Firebase.
- [src/components/ContentItemModal.tsx](src/components/ContentItemModal.tsx) : création et édition d’un contenu.
- [src/utils/formula.ts](src/utils/formula.ts) : calcul de la priorité effective.
- [src/types.ts](src/types.ts) : modèles, types par défaut et poids initiaux.
- [src/styles/](src/styles/) : imports des styles partagés et styles propres à l’application.

## Installation

Environnement de référence : Node.js 24 et npm. Exécuter les commandes depuis ce dépôt.

```bash
npm ci
npm run dev
```

Le serveur de développement écoute sur le port 3000. Ouvrir `http://localhost:3000`.

## Configuration et données

Sans configuration Firebase complète, Kult utilise des fournisseurs locaux et une session de développement. Avec Firebase, les données sont rattachées au compte connecté.

Le mode local conserve ses données dans le `localStorage` du navigateur, sans synchronisation entre appareils. Sa session de développement n’est pas une authentification distante. Changer de mode de stockage ne transfère pas automatiquement ces données.

Pour utiliser Firebase, copier [.env.example](.env.example) vers `.env.local` et renseigner la configuration de l’application web :

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Activer l’authentification email/mot de passe et Firestore dans le projet Firebase concerné. Ces variables sont lues par Vite au démarrage et lors du build : redémarrer le serveur ou reconstruire après une modification. Conserver les fichiers d’environnement locaux hors Git.

## Commandes et validation

| Commande | Rôle |
| --- | --- |
| `npm ci` | Installer les versions du lockfile, y compris l’archive UI locale |
| `npm run dev` | Lancer le serveur de développement sur le port 3000 |
| `npm run lint` | Vérifier les types avec `tsc --noEmit` |
| `npm run check:ui` | Vérifier l’archive UI, son empreinte, le lockfile et les réexports |
| `npm run build` | Exécuter `prebuild` puis générer le site statique dans `dist/` |
| `npm run preview` | Prévisualiser le dernier build localement |

Aucun script `npm test` n’est défini actuellement ; les contrôles disponibles sont le typage, la vérification du package UI et le build.

## Classement

La priorité effective combine la priorité, la motivation, la préférence pour les contenus courts, la fraîcheur depuis l’ajout et l’ancienneté du backlog. Les pondérations se règlent dans les paramètres. Le score est calculé dans `src/utils/formula.ts` et affiché avec une décimale.

L’export disponible dans les paramètres est un CSV. L’application ne propose actuellement pas de restauration de sauvegarde JSON.

## Interface partagée

L’application utilise `@3gaspo/app-ui`, actuellement en version 0.1.8, pour la navigation, les titres, dialogues, formulaires, commandes, retours d’état et formats visibles. L’interface utilise Inter et des thèmes clair et sombre communs. Les dates affichées utilisent `en-GB` et les heures le format 24 h ; les formats de stockage et d’export restent propres à l’application.

L’archive est incluse dans [vendor/](vendor/) et référencée par `package.json` et `package-lock.json`. Ce dépôt est installable et déployable seul : aucun accès au dépôt source voisin `app-ui` ni à un registre privé n’est nécessaire. Relancer `npm ci` après un pull qui change les dépendances. La vérification du package partagé s’exécute automatiquement avant le build.

## Déploiement

Le site statique est servi par Firebase Hosting depuis `dist/`. [firebase.json](firebase.json) redirige les routes de l’application vers `index.html` et déclare aussi les règles et index Firestore.

Après avoir authentifié la CLI Firebase et sélectionné le bon projet :

```bash
git pull
npm ci
npm run build
firebase deploy --only hosting
```

Ajouter `--project ID_DU_PROJET` si aucun projet n’est sélectionné. Un `firebase deploy` sans restriction peut aussi publier les règles et index Firestore déclarés. Un retour à une version conservée dans l’historique Firebase Hosting restaure le site, pas les données.
