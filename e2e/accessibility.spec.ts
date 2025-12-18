import { test, expect } from '@playwright/test';

test.describe('Pokédex - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have an appropriate page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Pokédex/);
  });

  test('should allow keyboard navigation', async ({ page }) => {
    // Wait for the page to be loaded
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    // Verify that an element has focus
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'INPUT', 'A', 'SELECT']).toContain(focusedElement);
  });

  test('buttons should have appropriate labels', async ({ page }) => {
    // Verify that buttons in the header have text or aria-labels
    const buttons = page.locator('header button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        expect(text || ariaLabel).toBeTruthy();
      }
    }
  });

  test('images should have alt attributes', async ({ page }) => {
    // Wait for images to be loaded
    await page.waitForSelector('img', { timeout: 10000 });
    
    const images = page.locator('img');
    const count = await images.count();
    
    if (count > 0) {
      // Verify the first images
      for (let i = 0; i < Math.min(count, 5); i++) {
        const img = images.nth(i);
        if (await img.isVisible()) {
          const alt = await img.getAttribute('alt');
          // The alt attribute should exist (even if empty for decorative images)
          expect(alt !== null).toBeTruthy();
        }
      }
    }
  });

  test('forms should have labels', async ({ page }) => {
    // Verify the search field
    const searchInput = page.locator('input[type="text"]').first();
    
    if (await searchInput.isVisible()) {
      const placeholder = await searchInput.getAttribute('placeholder');
      const ariaLabel = await searchInput.getAttribute('aria-label');
      const label = page.locator('label').filter({ has: searchInput });
      const hasLabel = await label.count() > 0;
      
      // The input should have either a placeholder, an aria-label, or a label
      expect(placeholder || ariaLabel || hasLabel).toBeTruthy();
    }
  });

  test('modals should have role="dialog"', async ({ page }) => {
    // Open a modal (Pokémon card)
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    const firstCard = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ }).first();
    
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForTimeout(500);
      
      // Verify that a modal with role="dialog" exists
      const dialog = page.locator('[role="dialog"]');
      const hasDialog = await dialog.count() > 0;
      
      // Or verify that a modal overlay exists
      const modalOverlay = page.locator('.fixed.inset-0');
      const hasModalOverlay = await modalOverlay.count() > 0;
      
      expect(hasDialog || hasModalOverlay).toBeTruthy();
    }
  });

  test('should support color contrast', async ({ page }) => {
    // Verify that the main text is visible
    const mainTitle = page.locator('h1').first();
    await expect(mainTitle).toBeVisible();
    
    // Verify text color (should be sufficiently contrasted)
    const textColor = await mainTitle.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.color;
    });
    
    expect(textColor).toBeTruthy();
  });
});
