# 🔴 Pokédex Vue.js

A modern and interactive Pokédex built with Vue.js 3, TypeScript, Vite, Tailwind CSS, and PokeAPI.

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=flat&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat&logo=tailwind-css&logoColor=white)

## ✨ Features

- 🔍 **Advanced Search** - Find Pokémon by name
- 🏷️ **Type Filtering** - Filter by type (Fire, Water, Grass, etc.)
- 🌍 **Multi-language** - Français, English, 日本語 with complete i18n system
- ✨ **Shiny Mode** - Display shiny versions
- 📚 **Generation Grouping** - Organized by region (Kanto, Johto, etc.)
- 🎯 **Detailed Cards** - Stats, abilities, evolutions
- 🔄 **Evolution Chains** - Navigate through pre-evolutions and next evolutions
- 🌎 **Regional Forms** - View Alola, Galar, Hisui, and Paldea variants
- 💎 **Mega Evolutions** - Display Mega-X, Mega-Y forms with accurate data
- ⚡ **Gigantamax Forms** - View Gigantamax variants
- 🌐 **PokeAPI Integration** - Real-time data from official PokeAPI
- 📱 **Responsive Design** - Mobile hamburger menu + tablet/desktop optimization
- 🎨 **Modern Interface** - Smooth animations and clean design
- ⬆️ **Scroll to Top** - Floating button for easy navigation
- ⚡ **Optimized Performance** - Instant load from local data, API enrichment on-demand
- 🔐 **Local Authentication** - Account system with SHA-256 hashing
- ⭐ **Personal Favorites** - Save your favorite Pokémon
- 👥 **Team Management** - Create up to 3 teams of 6 Pokémon
- 🎯 **Strict TypeScript** - Strict types for i18n and autocompletion
- ♿ **OpenDyslexic Font** - Font specially designed for improved readability

## 🚀 Performance Architecture

### Hybrid Loading Strategy
The application uses an optimized hybrid approach:

1. **Instant Startup** - Load 1025+ Pokémon from local JSON instantly (no API calls)
2. **On-Demand Enrichment** - When opening a Pokémon detail modal:
   - Fetch complete data from PokeAPI
   - Load evolution chains
   - Detect and display available forms (regional, mega, gigamax)
3. **Form Switching** - Each form selection triggers a specific API call:
   - Regional forms: `/pokemon/{name}-{region}`
   - Mega evolutions: `/pokemon/{name}-mega-{x/y}`
   - Gigantamax: `/pokemon/{name}-gmax`
4. **Smart Caching** - All API responses are cached to avoid duplicate requests

This architecture provides:
- ⚡ **Zero wait time** on application startup
- 📊 **Accurate data** from official PokeAPI
- 🔄 **Real evolution chains** with navigation
- 🌍 **All forms** with their specific types, stats, and sprites
- 💾 **Reduced API calls** through intelligent caching

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

## 🛠️ Technologies

- **Vue.js 3** - Progressive JavaScript framework
- **TypeScript** - Static typing for JavaScript
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Composition API** - Modern Vue.js API
- **PokeAPI** - Official Pokémon data API (https://pokeapi.co)
- **GitHub Actions** - CI/CD and automatic deployment
- **OpenDyslexic** - Accessibility font for dyslexia
Project Structure

```
src/
├── components/        # Vue components
│   ├── AppHeader.vue       # Header with responsive menu
│   ├── PokemonCard.vue     # Individual card
│   ├── PokemonList.vue     # List with filters
│   ├── PokemonModal.vue    # Detailed modal with forms
│   ├── AuthModal.vue       # Authentication
│   ├── FavoritesModal.vue  # Favorites management
│   └── TeamsModal.vue      # Team management
├── composables/       # Composables (reusable logic)
│   ├── usePokemon.ts       # Pokémon management
│   ├── useAuth.ts          # Authentication
│   ├── useFavorites.ts     # Favorites
│   ├── useTeams.ts         # Teams
│   └── useTranslation.ts   # i18n system
├── services/         # API services
│   ├── pokeapi.ts          # PokeAPI integration with cache
│   └── pokeapi-transform.ts # Data transformation
├── locales/          # i18n translations
│   ├── fr.json            # French
│   ├── en.json            # English
│   └── jp.json            # Japanese
├── data/             # JSON data
│   └── pokedex.json        # Local Pokémon database (1025+)
├── types/            # TypeScript types
│   └── pokemon.ts          # Interfaces
├── utils/            # Utilities
│   ├── typeColors.ts       # Type colors
│   ├── security.ts         # Security functions
│   ├── storage.ts          # LocalStorage
│   └── validation.ts       # Validation
├── App.vue           # Main component
├── main.ts           # Entry point
└── style.css         # Global styles
└── style.css         # Styles globaux + OpenDyslexic

public/
└── fonts/            # Polices d'accessibilité
    ├── OpenDyslexic-Regular.otf
    └──sage

1. **Search** - Type a Pokémon name in the search bar
2. **Filter** - Select a type to display only those Pokémon
3. **Change Language** - Click on 🇫🇷 🇬🇧 or 🇯🇵 (interface changes automatically)
4. **Shiny Mode** - Enable to see shiny versions
5. **View Details** - Click on a card to open the detailed modal
6. **Navigation** - Use evolution arrows to navigate through evolution chains
7. **Switch Forms** - Click form buttons to view regional, mega, or gigantamax variants
8. **Mobile Menu** - Use the hamburger button (☰) on mobile/tabletnge automatiquement)
4. **Mode Shiny** - Activez le mode pour voir les versions chromatiques
5. **Voir les détails** - Cliquez sur une carte pour ouvrir la fiche complète
6. **Menu mobile** - Utilisez le bouton hamburger (☰) sur mobile/tablette

## 📚 Internationalization Guide](./docs/INTERNATIONALIZATION.md) - Complete i18n system
- [🎯 Best Practices](./docs/BEST_PRACTICES.md) - Code conventions and architecture
- [✨ Recent Improvements](./docs/IMPROVEMENTS.md) - Detailed changelog
- [♿ Accessibility](./docs/ACCESSIBILITY.md) - Accessibility guide and OpenDyslexic font
- [🧪 Testing](./docs/TESTING.md) - Testing strategy and coverage
- [🔒 Security](./SECURITY.md) - Security guide and best practicaillé
- [♿ Accessibilité](./docs/ACCESSIBILITY.md) - Guide d'accessibilité et police OpenDyslexic
- [🔒 Sécurité](./SECURITY.md) - Guide de sécurité et bonnes pratiques

## 📄 Licence

MIT
& Storage

### Client-Side Architecture
This application runs entirely client-side **without a backend server**. User data (favorites, teams, accounts) is stored locally in the browser via `localStorage`. Pokémon data comes from:
- **Local JSON** (pokedex.json) - Instant load of 1025+ Pokémon at startup
- **PokeAPI** - Real-time enrichment for detailed views, evolutions, and forms

### 🔒 Security
- **Hashed Passwords**: SHA-256 with unique salt per user
- **Strict Validation**: Email, username, and password validated
- **XSS Protection**: Sanitization of all user inputs
- See [SECURITY.md](./SECURITY.md) for complete details

### Limitations
- ❌ **No Synchronization** between devices or browsers
- ❌ **Local Data**: Lost if browser cache is cleared
- ⚠️ **Storage Limit**: ~5-10 MB depending on browser
- ⚠️ **Data Visible**: Accessible via DevTools (password hashing only)

### Data Export/Import
To backup or transfer your data, see the "Export/Import" section in
Pour sauedits

- Pokémon Data: [PokeAPI](https://pokeapi.co) (official API) + [TyraDex](https://github.com/Yarkis01/TyraDex) (local data)
- Sprites: The Pokémon Company
- OpenDyslexic Font: [OpenDyslexic Project](https://opendyslexic.org/)

## 🔧 API Integration

### PokeAPI Usage
The application integrates with [PokeAPI v2](https://pokeapi.co/docs/v2) for:
- Complete Pokémon details (types, stats, height, weight)
- Evolution chains with pre-evolutions and next evolutions
- Mega-evolutions (Mega, Mega-X, Mega-Y)
- Regional forms (Alola, Galar, Hisui, Paldea)
- Gigantamax forms
- Species information (localized names, generation, genus)

### Caching Strategy
All API responses are cached in memory using a `Map` to avoid duplicate requests during the same session. The cache improves performance and reduces API load.

### Rate Limiting
The application implements batch loading with delays to respect PokeAPI rate limits and ensure smooth operation.
- Sprites : The Pokémon Company
- Police OpenDyslexic : [OpenDyslexic Project](https://opendyslexic.org/)
