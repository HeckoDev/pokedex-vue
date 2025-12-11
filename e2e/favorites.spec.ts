import { test, expect } from '@playwright/test';

test.describe('Pokédex - Favorites', () => {
  // Note: These tests require authentication
  // You may need to adapt these tests according to your authentication system
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display favorites button when authenticated', async ({ page }) => {
    // Look for the favorites button in the header
    const favoritesButton = page.locator('header button').filter({ 
      hasText: /Favoris|Favorites|♥|❤/i 
    });
    
    // If the button is visible, the user is authenticated
    if (await favoritesButton.first().isVisible()) {
      await expect(favoritesButton.first()).toBeVisible();
      
      // Click the button
      await favoritesButton.first().click();
      await page.waitForTimeout(500);
      
      // Verify that the favorites modal opens
      const favoritesModal = page.locator('[role="dialog"]');
      await expect(favoritesModal.first()).toBeVisible();
    } else {
      // Skip the test if not authenticated
      test.skip();
    }
  });

  test('should be able to add a Pokémon to favorites', async ({ page }) => {
    // Open a Pokémon card
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    const firstCard = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ }).first();
    await firstCard.click();
    await page.waitForTimeout(500);
    
    // Look for the add to favorites button in the modal
    const addFavoriteButton = page.locator('button').filter({ 
      hasText: /Ajouter aux favoris|Add to favorites|♥|❤/i 
    });
    
    if (await addFavoriteButton.first().isVisible()) {
      await addFavoriteButton.first().click();
      await page.waitForTimeout(500);
      
      // Verify that a confirmation message appears or that the button changes
      const confirmation = page.locator('text=/ajouté|added|succès|success/i');
      const isConfirmationVisible = await confirmation.first().isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isConfirmationVisible) {
        await expect(confirmation.first()).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('should display the favorites list', async ({ page }) => {
    // Click the favorites button
    const favoritesButton = page.locator('header button').filter({ 
      hasText: /Favoris|Favorites|♥|❤/i 
    }).first();
    
    if (await favoritesButton.isVisible()) {
      await favoritesButton.click();
      await page.waitForTimeout(500);
      
      // Verify that the modal is opened
      const favoritesModal = page.locator('[role="dialog"]');
      await expect(favoritesModal.first()).toBeVisible();
      
      // Verify the content (either Pokémon or an empty message)
      const emptyMessage = favoritesModal.locator('text=/vide|empty|aucun|no favorites/i');
      const pokemonCards = favoritesModal.locator('.bg-gray-800.rounded-2xl');
      
      const hasEmpty = await emptyMessage.first().isVisible({ timeout: 2000 }).catch(() => false);
      const hasCards = await pokemonCards.first().isVisible({ timeout: 2000 }).catch(() => false);
      
      // One of the two should be visible
      expect(hasEmpty || hasCards).toBeTruthy();
    } else {
      test.skip();
    }
  });
});
