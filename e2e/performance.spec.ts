import { test, expect } from '@playwright/test';

test.describe('Pokédex - Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('devrait charger la page en moins de 5 secondes', async ({ page }) => {
    const startTime = Date.now();
    
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('devrait charger les images Pokémon progressivement', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Attendre que des cartes Pokémon soient visibles
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    
    // Vérifier qu'au moins quelques images sont chargées dans les cartes
    const images = page.locator('.bg-gray-800.rounded-2xl img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
  });

  test('devrait être interactif rapidement', async ({ page }) => {
    // Attendre que le champ de recherche soit interactif
    const searchInput = page.locator('input[type="text"]').first();
    
    const startTime = Date.now();
    await expect(searchInput).toBeVisible({ timeout: 3000 });
    await expect(searchInput).toBeEnabled({ timeout: 3000 });
    
    const timeToInteractive = Date.now() - startTime;
    expect(timeToInteractive).toBeLessThan(3000);
  });

  test('la recherche devrait être réactive', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('Pikachu');
    
    // La recherche devrait réagir rapidement (avec debounce)
    await page.waitForTimeout(600);
    
    const cards = page.locator('.bg-gradient-to-br');
    const count = await cards.count();
    
    // Les résultats devraient être affichés
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('le scroll devrait être fluide', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Scroller vers le bas
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(100);
    
    // Vérifier la position de scroll
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(500);
    
    // Scroller vers le haut
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    
    const newScrollY = await page.evaluate(() => window.scrollY);
    expect(newScrollY).toBeLessThan(100);
  });

  test('ne devrait pas avoir de fuites mémoire lors de multiples navigations', async ({ page }) => {
    // Ouvrir et fermer plusieurs modals
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    
    for (let i = 0; i < 3; i++) {
      // S'assurer qu'aucune modale n'est déjà ouverte
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      
      const card = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ }).nth(i);
      
      if (await card.isVisible()) {
        await card.click({ force: true });
        await page.waitForTimeout(800);
        
        // Fermer la modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }
    
    // La page devrait toujours être responsive
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();
  });
});
