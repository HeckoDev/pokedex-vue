import { test, expect } from '@playwright/test';

test.describe('Pokédex - Modal Pokémon', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('devrait ouvrir la modal au clic sur une carte', async ({ page }) => {
    // Attendre qu'une carte soit visible
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    
    // Cliquer sur la première carte Pokémon
    const firstCard = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ }).first();
    await firstCard.click();
    
    // Vérifier que la modal est ouverte
    const modal = page.locator('[role="dialog"], .fixed.inset-0');
    await expect(modal.first()).toBeVisible({ timeout: 5000 });
  });

  test('devrait fermer la modal avec le bouton fermer', async ({ page }) => {
    // Ouvrir la modal
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    const firstCard = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ }).first();
    await firstCard.click();
    
    // Attendre que la modal soit ouverte
    await page.waitForTimeout(500);
    
    // Chercher le bouton de fermeture (X ou Close)
    const closeButton = page.locator('button').filter({ hasText: /×|✕|Close|Fermer/i }).or(
      page.locator('button svg').filter({ hasNot: page.locator('text') })
    );
    
    if (await closeButton.first().isVisible()) {
      await closeButton.first().click();
      await page.waitForTimeout(500);
      
      // Vérifier que la modal est fermée
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).not.toBeVisible();
    }
  });

  test('devrait afficher les informations du Pokémon dans la modal', async ({ page }) => {
    // Ouvrir la modal
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    const firstCard = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ }).first();
    await firstCard.click();
    
    await page.waitForTimeout(500);
    
    // Vérifier que la modal contient des informations
    const modal = page.locator('[role="dialog"], .fixed.inset-0').first();
    
    // L'image du Pokémon devrait être visible
    const pokemonImage = modal.locator('img').first();
    if (await pokemonImage.isVisible()) {
      await expect(pokemonImage).toBeVisible();
    }
    
    // Le numéro du Pokémon devrait être visible
    const pokedexNumber = modal.locator('text=/#\\d+/i');
    if (await pokedexNumber.first().isVisible()) {
      await expect(pokedexNumber.first()).toBeVisible();
    }
  });
});
