import { test, expect } from '@playwright/test';

test.describe('Pokédex - Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display correctly on mobile', async ({ page }) => {
    // Set mobile viewport size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Verify that the header is visible
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Verify that cards are visible
    await page.waitForSelector('.bg-gradient-to-br', { timeout: 10000 });
    const cards = page.locator('.bg-gradient-to-br').filter({ hasText: /#\d+/ });
    await expect(cards.first()).toBeVisible();
  });

  test('should display correctly on tablet', async ({ page }) => {
    // Set tablet viewport size
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Verify that the content is visible
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Verify that cards are visible
    await page.waitForSelector('.bg-gradient-to-br', { timeout: 10000 });
    const cards = page.locator('.bg-gradient-to-br').filter({ hasText: /#\d+/ });
    await expect(cards.first()).toBeVisible();
  });

  test('should display correctly on desktop', async ({ page }) => {
    // Set desktop viewport size
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    // Verify that the header is visible
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Verify that multiple cards are visible at the same time
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    const cards = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ });
    const count = await cards.count();
    expect(count).toBeGreaterThan(1);
  });

  test('should adapt filters in responsive mode', async ({ page }) => {
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const searchInput = page.locator('input[type="text"]').first();
    const typeSelect = page.locator('select').first();
    
    await expect(searchInput).toBeVisible();
    await expect(typeSelect).toBeVisible();
    
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    await expect(searchInput).toBeVisible();
    await expect(typeSelect).toBeVisible();
  });
});
