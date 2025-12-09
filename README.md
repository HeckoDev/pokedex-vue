# 🔴 Pokédex Vue.js

Un Pokédex moderne et interactif créé avec Vue.js 3, TypeScript, Vite et Tailwind CSS.

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=flat&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat&logo=tailwind-css&logoColor=white)

## ✨ Fonctionnalités

- 🔍 **Recherche avancée** - Trouvez vos Pokémon par nom
- 🏷️ **Filtrage par type** - Filtrez par type (Feu, Eau, Plante, etc.)
- 🌍 **Multi-langue** - Français, English, 日本語
- ✨ **Mode Shiny** - Affichez les versions chromatiques
- 📚 **Groupement par génération** - Organisé par région (Kanto, Johto, etc.)
- 🎯 **Fiches détaillées** - Statistiques, talents, évolutions
- 📱 **Design responsive** - Optimisé mobile, tablette et desktop
- 🎨 **Interface moderne** - Animations fluides et design épuré
- ⬆️ **Scroll to top** - Bouton flottant pour remonter facilement
- ⚡ **Performance optimisée** - Chargement rapide avec Vite
- 🔐 **Authentification locale** - Système de comptes avec hashage SHA-256
- ⭐ **Favoris personnalisés** - Sauvegardez vos Pokémon préférés
- 👥 **Gestion d'équipes** - Créez jusqu'à 3 équipes de 6 Pokémon

## 🚀 Installation

```bash
# Cloner le repository
git clone https://github.com/votre-username/pokedex-vue.git

# Aller dans le dossier
cd pokedex-vue

# Installer les dépendances
npm install
```

## 🏃 Démarrage

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 🏗️ Build de production

```bash
npm run build
```

## 📦 Aperçu de la production

```bash
npm run preview
```

## 🛠️ Technologies utilisées

- **Vue.js 3** - Framework progressif JavaScript
- **TypeScript** - Typage statique pour JavaScript
- **Vite** - Build tool ultra-rapide
- **Tailwind CSS** - Framework CSS utility-first
- **Composition API** - API moderne de Vue.js
- **GitHub Actions** - CI/CD et déploiement automatique

## 📁 Structure du projet

```
src/
├── components/        # Composants Vue
│   ├── PokemonCard.vue     # Carte individuelle
│   ├── PokemonList.vue     # Liste avec filtres
│   └── PokemonModal.vue    # Fiche détaillée
├── composables/       # Composables (logique réutilisable)
│   └── usePokemon.ts       # Gestion des Pokémon
├── data/             # Données JSON
│   └── pokedex.json        # Base de données Pokémon
├── types/            # Types TypeScript
│   └── pokemon.ts          # Interfaces
├── utils/            # Utilitaires
│   └── typeColors.ts       # Couleurs des types
├── App.vue           # Composant principal
├── main.ts           # Point d'entrée
└── style.css         # Styles globaux
```

## 🎮 Utilisation

1. **Rechercher** - Tapez le nom d'un Pokémon dans la barre de recherche
2. **Filtrer** - Sélectionnez un type pour afficher uniquement ces Pokémon
3. **Changer de langue** - Cliquez sur 🇫🇷 🇬🇧 ou 🇯🇵
4. **Mode Shiny** - Activez le mode pour voir les versions chromatiques
5. **Voir les détails** - Cliquez sur une carte pour ouvrir la fiche complète

## 📄 Licence

MIT

## ⚠️ Architecture et Stockage

### Fonctionnement sans backend
Cette application fonctionne entièrement côté client **sans serveur backend**. Les données sont stockées localement dans le navigateur via `localStorage`.

### 🔒 Sécurité
- **Mots de passe hashés** : SHA-256 avec salt unique par utilisateur
- **Validation stricte** : Email, username et mot de passe validés
- **Protection XSS** : Sanitization de toutes les entrées utilisateur
- Voir [SECURITY.md](./SECURITY.md) pour les détails complets

### Limitations
- ❌ **Pas de synchronisation** entre appareils ou navigateurs
- ❌ **Données locales** : Perdues si cache navigateur effacé
- ⚠️ **Limite de stockage** : ~5-10 MB selon navigateur
- ⚠️ **Données visibles** : Accessibles via DevTools (hashage pour mots de passe uniquement)

### Export/Import des données
Pour sauvegarder ou transférer vos données, consultez la section "Export/Import" dans [SECURITY.md](./SECURITY.md).

## 🙏 Crédits

- Données Pokémon : [TyraDex](https://github.com/Yarkis01/TyraDex)
- Sprites : The Pokémon Company
