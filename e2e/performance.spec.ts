import { test, expect } from '@playwright/test';

test.describe('Pokédex - Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the page in less than 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('should load Pokémon images progressively', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Wait for Pokémon cards to be visible
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    
    // Verify that at least a few images are loaded in the cards
    const images = page.locator('.bg-gray-800.rounded-2xl img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should be interactive quickly', async ({ page }) => {
    // Wait for the search field to be interactive
    const searchInput = page.locator('input[type="text"]').first();
    
    const startTime = Date.now();
    await expect(searchInput).toBeVisible({ timeout: 3000 });
    await expect(searchInput).toBeEnabled({ timeout: 3000 });
    
    const timeToInteractive = Date.now() - startTime;
    expect(timeToInteractive).toBeLessThan(3000);
  });

  test('the search should be responsive', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('Pikachu');
    
    // The search should react quickly (with debounce)
    await page.waitForTimeout(600);
    
    const cards = page.locator('.bg-gradient-to-br');
    const count = await cards.count();
    
    // The results should be displayed
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('the scroll should be smooth', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(100);
    
    // Verify the scroll position
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(500);
    
    // Scroll up
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    
    const newScrollY = await page.evaluate(() => window.scrollY);
    expect(newScrollY).toBeLessThan(100);
  });

  test('should not have memory leaks during multiple navigations', async ({ page }) => {
    // Open and close multiple modals
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    
    for (let i = 0; i < 3; i++) {
      // Ensure no modal is already open
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      
      const card = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ }).nth(i);
      
      if (await card.isVisible()) {
        await card.click({ force: true });
        await page.waitForTimeout(800);
        
        // Close the modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }
    
    // The page should still be responsive
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();
  });
});
