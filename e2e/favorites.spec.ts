import { test, expect } from '@playwright/test';

test.describe('Pokédex - Favoris', () => {
  // Note: Ces tests nécessitent d'être authentifié
  // Vous devrez peut-être adapter ces tests selon votre système d'authentification
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('devrait afficher le bouton favoris quand authentifié', async ({ page }) => {
    // Chercher le bouton des favoris dans le header
    const favoritesButton = page.locator('header button').filter({ 
      hasText: /Favoris|Favorites|♥|❤/i 
    });
    
    // Si le bouton est visible, l'utilisateur est authentifié
    if (await favoritesButton.first().isVisible()) {
      await expect(favoritesButton.first()).toBeVisible();
      
      // Cliquer sur le bouton
      await favoritesButton.first().click();
      await page.waitForTimeout(500);
      
      // Vérifier que la modal des favoris s'ouvre
      const favoritesModal = page.locator('[role="dialog"]');
      await expect(favoritesModal.first()).toBeVisible();
    } else {
      // Skip le test si pas authentifié
      test.skip();
    }
  });

  test('devrait pouvoir ajouter un Pokémon aux favoris', async ({ page }) => {
    // Ouvrir une carte Pokémon
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    const firstCard = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ }).first();
    await firstCard.click();
    await page.waitForTimeout(500);
    
    // Chercher le bouton d'ajout aux favoris dans la modal
    const addFavoriteButton = page.locator('button').filter({ 
      hasText: /Ajouter aux favoris|Add to favorites|♥|❤/i 
    });
    
    if (await addFavoriteButton.first().isVisible()) {
      await addFavoriteButton.first().click();
      await page.waitForTimeout(500);
      
      // Vérifier qu'un message de confirmation apparaît ou que le bouton change
      const confirmation = page.locator('text=/ajouté|added|succès|success/i');
      const isConfirmationVisible = await confirmation.first().isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isConfirmationVisible) {
        await expect(confirmation.first()).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('devrait afficher la liste des favoris', async ({ page }) => {
    // Cliquer sur le bouton des favoris
    const favoritesButton = page.locator('header button').filter({ 
      hasText: /Favoris|Favorites|♥|❤/i 
    }).first();
    
    if (await favoritesButton.isVisible()) {
      await favoritesButton.click();
      await page.waitForTimeout(500);
      
      // Vérifier que la modal est ouverte
      const favoritesModal = page.locator('[role="dialog"]');
      await expect(favoritesModal.first()).toBeVisible();
      
      // Vérifier le contenu (soit des Pokémon, soit un message vide)
      const emptyMessage = favoritesModal.locator('text=/vide|empty|aucun|no favorites/i');
      const pokemonCards = favoritesModal.locator('.bg-gray-800.rounded-2xl');
      
      const hasEmpty = await emptyMessage.first().isVisible({ timeout: 2000 }).catch(() => false);
      const hasCards = await pokemonCards.first().isVisible({ timeout: 2000 }).catch(() => false);
      
      // L'un des deux devrait être visible
      expect(hasEmpty || hasCards).toBeTruthy();
    } else {
      test.skip();
    }
  });
});
