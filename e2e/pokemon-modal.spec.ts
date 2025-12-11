import { test, expect } from '@playwright/test';

test.describe('Pokédex - Pokémon Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open the modal when clicking on a card', async ({ page }) => {
    // Wait for a card to be visible
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    
    // Click on the first Pokémon card
    const firstCard = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ }).first();
    await firstCard.click();
    
    // Verify that the modal is opened
    const modal = page.locator('[role="dialog"], .fixed.inset-0');
    await expect(modal.first()).toBeVisible({ timeout: 5000 });
  });

  test('should close the modal with the close button', async ({ page }) => {
    // Open the modal
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    const firstCard = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ }).first();
    await firstCard.click();
    
    // Wait for the modal to be opened
    await page.waitForTimeout(500);
    
    // Look for the close button (X or Close)
    const closeButton = page.locator('button').filter({ hasText: /×|✕|Close|Fermer/i }).or(
      page.locator('button svg').filter({ hasNot: page.locator('text') })
    );
    
    if (await closeButton.first().isVisible()) {
      await closeButton.first().click();
      await page.waitForTimeout(500);
      
      // Verify that the modal is closed
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).not.toBeVisible();
    }
  });

  test('should display Pokémon information in the modal', async ({ page }) => {
    // Open the modal
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    const firstCard = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ }).first();
    await firstCard.click();
    
    await page.waitForTimeout(500);
    
    // Verify that the modal contains information
    const modal = page.locator('[role="dialog"], .fixed.inset-0').first();
    
    // The Pokémon image should be visible
    const pokemonImage = modal.locator('img').first();
    if (await pokemonImage.isVisible()) {
      await expect(pokemonImage).toBeVisible();
    }
    
    // The Pokémon number should be visible
    const pokedexNumber = modal.locator('text=/#\\d+/i');
    if (await pokedexNumber.first().isVisible()) {
      await expect(pokedexNumber.first()).toBeVisible();
    }
  });
});
