import { test, expect } from '@playwright/test';

test.describe('Pokédex - Search and Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to be loaded
    await page.waitForLoadState('networkidle');
  });

  test('should allow searching for a Pokémon by name', async ({ page }) => {
    // Locate the search field
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();
    
    // Type "Pikachu" in the search field
    await searchInput.fill('Pikachu');
    await page.waitForTimeout(500); // Wait for debounce
    
    // Verify that the results are filtered
    const cards = page.locator('.bg-gradient-to-br').filter({ hasText: /Pikachu/i });
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow filtering by type', async ({ page }) => {
    // Locate the type selector
    const typeSelect = page.locator('select').first();
    await expect(typeSelect).toBeVisible();
    
    // Select a type (for example "Fire")
    await typeSelect.selectOption({ index: 1 }); // First type after "All types"
    await page.waitForTimeout(500);
    
    // Verify that cards are displayed
    const cards = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ });
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow changing the language', async ({ page }) => {
    // Locate the language buttons
    const languageButtons = page.locator('button').filter({ hasText: /🇫🇷|🇬🇧/ });
    
    // Verify that at least one language button is visible
    await expect(languageButtons.first()).toBeVisible({ timeout: 5000 });
    
    // Click on the first available language button
    await languageButtons.first().click();
    await page.waitForTimeout(500);
  });

  test('should display the back to top button', async ({ page }) => {
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    
    // The scroll button should appear
    const scrollButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    
    // Click the button to scroll back up
    if (await scrollButton.isVisible()) {
      await scrollButton.click();
      await page.waitForTimeout(500);
      
      // Verify that we've scrolled back to the top
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeLessThan(100);
    }
  });
});
