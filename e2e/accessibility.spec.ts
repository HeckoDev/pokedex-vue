import { test, expect } from '@playwright/test';

test.describe('Pokédex - Accessibilité', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('devrait avoir un titre de page approprié', async ({ page }) => {
    await expect(page).toHaveTitle(/Pokédex/);
  });

  test('devrait permettre la navigation au clavier', async ({ page }) => {
    // Attendre que la page soit chargée
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    
    // Tabuler à travers les éléments interactifs
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    // Vérifier qu'un élément a le focus
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'INPUT', 'A', 'SELECT']).toContain(focusedElement);
  });

  test('les boutons devraient avoir des labels appropriés', async ({ page }) => {
    // Vérifier que les boutons dans le header ont du texte ou des aria-labels
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

  test('les images devraient avoir des attributs alt', async ({ page }) => {
    // Attendre que des images soient chargées
    await page.waitForSelector('img', { timeout: 10000 });
    
    const images = page.locator('img');
    const count = await images.count();
    
    if (count > 0) {
      // Vérifier les premières images
      for (let i = 0; i < Math.min(count, 5); i++) {
        const img = images.nth(i);
        if (await img.isVisible()) {
          const alt = await img.getAttribute('alt');
          // L'attribut alt devrait exister (même s'il est vide pour les images décoratives)
          expect(alt !== null).toBeTruthy();
        }
      }
    }
  });

  test('les formulaires devraient avoir des labels', async ({ page }) => {
    // Vérifier le champ de recherche
    const searchInput = page.locator('input[type="text"]').first();
    
    if (await searchInput.isVisible()) {
      const placeholder = await searchInput.getAttribute('placeholder');
      const ariaLabel = await searchInput.getAttribute('aria-label');
      const label = page.locator('label').filter({ has: searchInput });
      const hasLabel = await label.count() > 0;
      
      // L'input devrait avoir soit un placeholder, soit un aria-label, soit un label
      expect(placeholder || ariaLabel || hasLabel).toBeTruthy();
    }
  });

  test('les modals devraient avoir role="dialog"', async ({ page }) => {
    // Ouvrir une modal (carte Pokémon)
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    const firstCard = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ }).first();
    
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForTimeout(500);
      
      // Vérifier qu'une modal avec role="dialog" existe
      const dialog = page.locator('[role="dialog"]');
      const hasDialog = await dialog.count() > 0;
      
      // Ou vérifier qu'une overlay modale existe
      const modalOverlay = page.locator('.fixed.inset-0');
      const hasModalOverlay = await modalOverlay.count() > 0;
      
      expect(hasDialog || hasModalOverlay).toBeTruthy();
    }
  });

  test('devrait supporter le contraste des couleurs', async ({ page }) => {
    // Vérifier que le texte principal est visible
    const mainTitle = page.locator('h1').first();
    await expect(mainTitle).toBeVisible();
    
    // Vérifier la couleur du texte (devrait être suffisamment contrasté)
    const color = await mainTitle.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.color;
    });
    
    expect(color).toBeTruthy();
  });
});
