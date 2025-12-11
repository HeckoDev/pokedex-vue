# Tests E2E Playwright - Pokédex Vue

## 📋 Vue d'ensemble

Cette suite de tests Playwright couvre les fonctionnalités principales de l'application Pokédex Vue.

## 🗂️ Structure des tests

```
e2e/
├── example.spec.ts          # Tests de base de la page principale
├── search-filters.spec.ts   # Tests de recherche et filtres
├── pokemon-modal.spec.ts    # Tests de la modal Pokémon
├── authentication.spec.ts   # Tests d'authentification
├── favorites.spec.ts        # Tests des favoris
├── teams.spec.ts            # Tests des équipes
├── responsive.spec.ts       # Tests responsive design
├── accessibility.spec.ts    # Tests d'accessibilité
└── performance.spec.ts      # Tests de performance
```

## 🚀 Commandes

### Exécuter tous les tests
```bash
npm run test:e2e
```

### Exécuter les tests avec l'interface UI
```bash
npm run test:e2e:ui
```

### Exécuter les tests en mode debug
```bash
npm run test:e2e:debug
```

### Exécuter un fichier de test spécifique
```bash
npx playwright test e2e/search-filters.spec.ts
```

### Exécuter les tests sur un navigateur spécifique
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Générer un rapport HTML
```bash
npx playwright show-report
```

## 📝 Description des tests

### 1. **example.spec.ts** - Tests de base
- Vérification du titre de la page
- Affichage du header et du logo
- Chargement des cartes Pokémon

### 2. **search-filters.spec.ts** - Recherche et filtres
- Recherche par nom de Pokémon
- Filtrage par type
- Changement de langue
- Bouton de retour en haut

### 3. **pokemon-modal.spec.ts** - Modal Pokémon
- Ouverture de la modal au clic
- Fermeture de la modal
- Affichage des informations du Pokémon

### 4. **authentication.spec.ts** - Authentification
- Affichage du bouton de connexion
- Ouverture de la modal d'authentification
- Basculement entre connexion et inscription
- Gestion des erreurs d'authentification

### 5. **favorites.spec.ts** - Favoris
- Affichage du bouton favoris (authentifié)
- Ajout d'un Pokémon aux favoris
- Affichage de la liste des favoris

### 6. **teams.spec.ts** - Équipes
- Affichage du bouton des équipes (authentifié)
- Affichage de la liste des équipes
- Création d'une nouvelle équipe
- Ajout d'un Pokémon à une équipe

### 7. **responsive.spec.ts** - Design responsive
- Tests sur mobile (375x667)
- Tests sur tablette (768x1024)
- Tests sur desktop (1920x1080)
- Adaptation des filtres

### 8. **accessibility.spec.ts** - Accessibilité
- Titre de page approprié
- Navigation au clavier
- Labels des boutons
- Attributs alt des images
- Labels des formulaires
- Role des modals
- Contraste des couleurs

### 9. **performance.spec.ts** - Performance
- Temps de chargement de la page
- Chargement progressif des images
- Temps d'interactivité
- Réactivité de la recherche
- Fluidité du scroll
- Gestion de la mémoire

## 🔧 Configuration

La configuration des tests se trouve dans `playwright.config.ts` :

- **Base URL**: http://localhost:5173
- **Navigateurs**: Chromium, Firefox, WebKit
- **Serveur de dev**: Démarré automatiquement avant les tests
- **Rapport**: HTML (généré dans `playwright-report/`)
- **Résultats**: Stockés dans `test-results/`

## 📊 Rapports

Après l'exécution des tests, un rapport HTML est généré automatiquement. Pour le visualiser :

```bash
npx playwright show-report
```

## 🐛 Débogage

### Mode debug interactif
```bash
npm run test:e2e:debug
```

### Exécuter avec headed browsers
```bash
npx playwright test --headed
```

### Trace viewer
Si un test échoue, les traces sont automatiquement collectées. Pour les visualiser :

```bash
npx playwright show-trace test-results/*/trace.zip
```

## 📌 Notes importantes

1. **Tests d'authentification** : Certains tests (favoris, équipes) nécessitent d'être authentifié. Ils sont automatiquement ignorés (skip) si l'utilisateur n'est pas connecté.

2. **Timing** : Des `waitForTimeout` sont utilisés pour attendre les animations et transitions. Ajustez-les si nécessaire selon votre environnement.

3. **Sélecteurs** : Les tests utilisent des sélecteurs CSS et de texte. Si vous modifiez les classes CSS ou le texte, pensez à mettre à jour les tests.

4. **CI/CD** : Les tests sont configurés pour s'exécuter automatiquement en CI avec :
   - `forbidOnly`: Empêche les tests `.only` en CI
   - `retries`: 2 tentatives en cas d'échec en CI
   - `workers`: Exécution séquentielle en CI

## 🤝 Contribution

Pour ajouter de nouveaux tests :

1. Créez un nouveau fichier `*.spec.ts` dans le dossier `e2e/`
2. Utilisez `test.describe()` pour regrouper les tests
3. Utilisez `test.beforeEach()` pour les configurations communes
4. Documentez les nouveaux tests dans ce README

## 📚 Resources

- [Documentation Playwright](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
