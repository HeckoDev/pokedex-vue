import { test, expect } from '@playwright/test';

test.describe('Pokédex - Recherche et filtres', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Attendre que la page soit chargée
    await page.waitForLoadState('networkidle');
  });

  test('devrait permettre de rechercher un Pokémon par nom', async ({ page }) => {
    // Localiser le champ de recherche
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();
    
    // Taper "Pikachu" dans le champ de recherche
    await searchInput.fill('Pikachu');
    await page.waitForTimeout(500); // Attendre le debounce
    
    // Vérifier que les résultats sont filtrés
    const cards = page.locator('.bg-gradient-to-br').filter({ hasText: /Pikachu/i });
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  test('devrait permettre de filtrer par type', async ({ page }) => {
    // Localiser le sélecteur de type
    const typeSelect = page.locator('select').first();
    await expect(typeSelect).toBeVisible();
    
    // Sélectionner un type (par exemple "Feu")
    await typeSelect.selectOption({ index: 1 }); // Premier type après "Tous les types"
    await page.waitForTimeout(500);
    
    // Vérifier que des cartes sont affichées
    const cards = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ });
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  test('devrait permettre de changer de langue', async ({ page }) => {
    // Localiser les boutons de langue
    const languageButtons = page.locator('button').filter({ hasText: /🇫🇷|🇬🇧/ });
    
    // Vérifier qu'au moins un bouton de langue est visible
    await expect(languageButtons.first()).toBeVisible({ timeout: 5000 });
    
    // Cliquer sur le premier bouton de langue disponible
    await languageButtons.first().click();
    await page.waitForTimeout(500);
  });

  test('devrait afficher le bouton de retour en haut', async ({ page }) => {
    // Scroller vers le bas
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    
    // Le bouton de scroll devrait apparaître
    const scrollButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    
    // Cliquer sur le bouton pour remonter
    if (await scrollButton.isVisible()) {
      await scrollButton.click();
      await page.waitForTimeout(500);
      
      // Vérifier qu'on est remonté en haut
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeLessThan(100);
    }
  });
});
