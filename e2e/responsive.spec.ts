import { test, expect } from '@playwright/test';

test.describe('Pokédex - Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('devrait s\'afficher correctement sur mobile', async ({ page }) => {
    // Définir la taille de viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Vérifier que le header est visible
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Vérifier que les cartes sont visibles
    await page.waitForSelector('.bg-gradient-to-br', { timeout: 10000 });
    const cards = page.locator('.bg-gradient-to-br').filter({ hasText: /#\d+/ });
    await expect(cards.first()).toBeVisible();
  });

  test('devrait s\'afficher correctement sur tablette', async ({ page }) => {
    // Définir la taille de viewport tablette
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Vérifier que le contenu est visible
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Vérifier que les cartes sont visibles
    await page.waitForSelector('.bg-gradient-to-br', { timeout: 10000 });
    const cards = page.locator('.bg-gradient-to-br').filter({ hasText: /#\d+/ });
    await expect(cards.first()).toBeVisible();
  });

  test('devrait s\'afficher correctement sur desktop', async ({ page }) => {
    // Définir la taille de viewport desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    // Vérifier que le header est visible
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Vérifier que plusieurs cartes sont visibles en même temps
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    const cards = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ });
    const count = await cards.count();
    expect(count).toBeGreaterThan(1);
  });

  test('devrait adapter les filtres en responsive', async ({ page }) => {
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
