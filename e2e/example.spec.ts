import { test, expect } from '@playwright/test';

test.describe('Pokédex - Main Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Pokédex/);
  });

  test('should display the header with logo and title', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Verify the SVG logo
    const logo = header.locator('svg').first();
    await expect(logo).toBeVisible();
    
    // Verify the title in the header
    const title = header.locator('h1');
    await expect(title).toHaveText('Pokédex');
  });

  test('should display Pokémon cards after loading', async ({ page }) => {
    // Wait for cards to be loaded
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    
    // Verify that at least one card is visible
    const cards = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ });
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });
});
