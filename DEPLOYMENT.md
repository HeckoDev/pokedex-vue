# 📦 Guide de Déploiement GitHub

## Étape 1 : Créer un repository sur GitHub

1. Allez sur [GitHub](https://github.com) et connectez-vous
2. Cliquez sur le bouton **"New"** (ou **"+"** → **"New repository"**)
3. Remplissez les informations :
   - **Repository name** : `pokedex-vue`
   - **Description** : `Un Pokédex moderne avec Vue.js 3, TypeScript et Tailwind CSS`
   - Laissez **Public** sélectionné
   - **NE PAS** cocher "Add a README file" (on en a déjà un)
4. Cliquez sur **"Create repository"**

## Étape 2 : Lier votre projet au repository

```bash
# Ajouter le remote (remplacez YOUR_USERNAME par votre nom d'utilisateur GitHub)
git remote add origin https://github.com/YOUR_USERNAME/pokedex-vue.git

# Pousser le code
git push -u origin main
```

## Étape 3 : Activer GitHub Pages

1. Sur votre repository GitHub, allez dans **Settings**
2. Dans le menu de gauche, cliquez sur **Pages**
3. Sous **"Source"**, sélectionnez :
   - **Source** : `GitHub Actions`
4. Sauvegardez

## Étape 4 : Configurer le déploiement

Le déploiement est déjà configuré ! Le workflow GitHub Actions (`.github/workflows/deploy.yml`) va :

- ✅ S'exécuter automatiquement à chaque push sur `main`
- 📦 Installer les dépendances
- 🏗️ Builder le projet
- 🚀 Déployer sur GitHub Pages

## Étape 5 : Vérifier le déploiement

1. Allez dans l'onglet **Actions** de votre repository
2. Vous verrez le workflow "Deploy to GitHub Pages" en cours d'exécution
3. Une fois terminé (✅), votre site sera disponible à :
   ```
   https://YOUR_USERNAME.github.io/pokedex-vue/
   ```

## 🔄 Mises à jour futures

Pour publier des modifications :

```bash
# Faire vos modifications...

# Ajouter les fichiers modifiés
git add .

# Commiter
git commit -m "Description de vos modifications"

# Pousser vers GitHub
git push
```

Le déploiement se fera automatiquement ! 🎉

## ⚙️ Configuration importante

Le fichier `vite.config.ts` est déjà configuré avec :

```typescript
base: process.env.NODE_ENV === "production" ? "/pokedex-vue/" : "/";
```

⚠️ **Important** : Si vous changez le nom de votre repository, vous devez modifier cette ligne dans `vite.config.ts` :

- Remplacez `/pokedex-vue/` par `/VOTRE-NOM-DE-REPO/`

## 🐛 Résolution de problèmes

**Le site ne s'affiche pas ?**

- Vérifiez que GitHub Pages est activé dans Settings → Pages
- Vérifiez que le workflow dans Actions s'est terminé sans erreur
- Attendez 2-3 minutes après le déploiement

**Les images ne se chargent pas ?**

- Vérifiez que le `base` dans `vite.config.ts` correspond au nom de votre repository

**Erreur dans le workflow ?**

- Vérifiez les logs dans l'onglet Actions
- Assurez-vous que `package.json` contient bien le script `build`

## 📝 Commandes Git utiles

```bash
# Voir le statut
git status

# Voir l'historique
git log --oneline

# Voir les remotes
git remote -v

# Annuler les modifications non commitées
git restore .
```
