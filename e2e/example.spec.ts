import { test, expect } from '@playwright/test';

test.describe('Pokédex - Page principale', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('devrait afficher le titre de la page', async ({ page }) => {
    await expect(page).toHaveTitle(/Pokédex/);
  });

  test('devrait afficher le header avec le logo et le titre', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Vérifier le logo SVG
    const logo = header.locator('svg').first();
    await expect(logo).toBeVisible();
    
    // Vérifier le titre dans le header
    const title = header.locator('h1');
    await expect(title).toHaveText('Pokédex');
  });

  test('devrait afficher les cartes Pokémon après chargement', async ({ page }) => {
    // Attendre que les cartes soient chargées
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    
    // Vérifier qu'au moins une carte est visible
    const cards = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ });
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });
});
