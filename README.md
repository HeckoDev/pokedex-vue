# 🔴 Pokédex Vue.js

Pokédex interactif construit avec Vue 3, TypeScript, Vite et Tailwind CSS, alimenté par [PokéAPI](https://pokeapi.co).

🔗 **Démo** : https://heckodev.github.io/pokedex-vue/

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=flat&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat&logo=tailwind-css&logoColor=white)

## ✨ Fonctionnalités

- 🔍 Recherche par nom, filtres par type, génération, Méga, Gigamax et formes régionales
- 🎯 Fiche détaillée : stats, talents, évolutions, formes, cri du Pokémon
- ⚖️ Comparaison de deux Pokémon
- 🛡️ Page Faiblesses (table des types)
- 🌍 Français, English, 日本語
- ✨ Mode shiny
- ⭐ Favoris et 👥 équipes (stockés localement)
- 🎬 Pokéball 3D (three.js) pendant les chargements
- 📱 Responsive, installable et utilisable hors-ligne (PWA)
- ♿ Accessibilité WCAG AA, police OpenDyslexic, respect de `prefers-reduced-motion`

## 🚀 Démarrage

```bash
git clone https://github.com/HeckoDev/pokedex-vue.git
cd pokedex-vue
npm install
npm run dev        # http://localhost:5173
```

## 🧰 Commandes

| Commande | Rôle |
|---|---|
| `npm run build` | Typecheck + build de production |
| `npm run preview` | Aperçu du build |
| `npm run lint` | ESLint |
| `npm run test:run` | Tests unitaires (Vitest) |
| `npm run test:coverage` | Tests + couverture |
| `npm run test:e2e` | Tests end-to-end (Playwright, avec axe) |

## 🏗️ Architecture

Application 100 % cliente, sans backend :

- La liste (1025+ Pokémon) vient d'un JSON embarqué : démarrage instantané.
- À l'ouverture d'une fiche, PokéAPI enrichit les données (évolutions, formes, cri), avec cache.
- Favoris, équipes et comptes sont dans le `localStorage` (mots de passe hachés SHA-256 avec sel) : pas de synchronisation entre appareils.

```
src/
├── components/   Composants Vue (liste, carte, modales, spinner)
├── composables/  Logique réutilisable (usePokemon, useTranslation, useAuth…)
├── services/     Accès PokéAPI et transformation des données
├── utils/        Filtres, comparaison, table des types, sécurité…
├── views/        Pages (liste, faiblesses)
├── data/         Données locales
└── locales/      Traductions fr / en / jp
```

## 🛠️ Stack

Vue 3 (Composition API) · TypeScript · Vite · Tailwind CSS · vue-router · three.js · Vitest · Playwright · ESLint · GitHub Actions (CI et déploiement GitHub Pages)

## 🙏 Crédits

- Données : [PokéAPI](https://pokeapi.co) et [TyraDex](https://github.com/Yarkis01/TyraDex)
- Sprites et cris : The Pokémon Company
- Police : [OpenDyslexic](https://opendyslexic.org/)

## 📄 Licence

MIT
