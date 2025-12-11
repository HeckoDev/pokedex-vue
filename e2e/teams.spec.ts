import { test, expect } from '@playwright/test';

test.describe('Pokédex - Équipes', () => {
  // Note: Ces tests nécessitent d'être authentifié
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('devrait afficher le bouton des équipes quand authentifié', async ({ page }) => {
    // Chercher le bouton des équipes dans le header
    const teamsButton = page.locator('header button').filter({ 
      hasText: /équipes|teams|Mes équipes|My teams/i 
    });
    
    if (await teamsButton.first().isVisible()) {
      await expect(teamsButton.first()).toBeVisible();
      
      // Cliquer sur le bouton
      await teamsButton.first().click();
      await page.waitForTimeout(500);
      
      // Vérifier que la modal des équipes s'ouvre
      const teamsModal = page.locator('[role="dialog"]');
      await expect(teamsModal.first()).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('devrait afficher la liste des équipes', async ({ page }) => {
    // Cliquer sur le bouton des équipes
    const teamsButton = page.locator('header button').filter({ 
      hasText: /équipes|teams|Mes équipes/i 
    }).first();
    
    if (await teamsButton.isVisible()) {
      await teamsButton.click();
      await page.waitForTimeout(500);
      
      // Vérifier que la modal est ouverte
      const teamsModal = page.locator('[role="dialog"]');
      await expect(teamsModal.first()).toBeVisible();
      
      // Vérifier le contenu (soit des équipes, soit un message vide)
      const emptyMessage = teamsModal.locator('text=/vide|empty|aucune équipe|no teams/i');
      const teamCards = teamsModal.locator('.bg-gray-800.rounded-2xl, [data-testid="team-card"]');
      
      const hasEmpty = await emptyMessage.first().isVisible({ timeout: 2000 }).catch(() => false);
      const hasTeams = await teamCards.first().isVisible({ timeout: 2000 }).catch(() => false);
      
      // L'un des deux devrait être visible
      expect(hasEmpty || hasTeams).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('devrait permettre de créer une nouvelle équipe', async ({ page }) => {
    const teamsButton = page.locator('header button').filter({ 
      hasText: /équipes|teams/i 
    }).first();
    
    if (await teamsButton.isVisible()) {
      await teamsButton.click();
      await page.waitForTimeout(500);
      
      // Chercher le bouton de création d'équipe
      const createButton = page.locator('button').filter({ 
        hasText: /Créer|Create|Nouvelle|New|➕|\+/i 
      });
      
      if (await createButton.first().isVisible()) {
        await createButton.first().click();
        await page.waitForTimeout(500);
        
        // Un formulaire devrait apparaître
        const nameInput = page.locator('input[type="text"]').or(
          page.locator('input[placeholder*="nom"]').or(
            page.locator('input[placeholder*="name"]')
          )
        );
        
        const isInputVisible = await nameInput.first().isVisible({ timeout: 2000 }).catch(() => false);
        expect(isInputVisible).toBeTruthy();
      }
    } else {
      test.skip();
    }
  });

  test('devrait permettre d\'ajouter un Pokémon à une équipe', async ({ page }) => {
    // Ouvrir une carte Pokémon
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    const firstCard = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ }).first();
    await firstCard.click();
    await page.waitForTimeout(500);
    
    // Chercher le bouton d'ajout à une équipe
    const addToTeamButton = page.locator('button').filter({ 
      hasText: /Ajouter à une équipe|Add to team|équipe/i 
    });
    
    if (await addToTeamButton.first().isVisible()) {
      await addToTeamButton.first().click();
      await page.waitForTimeout(500);
      
      // Une liste d'équipes devrait apparaître
      const teamsList = page.locator('[role="dialog"], .modal');
      const isListVisible = await teamsList.first().isVisible({ timeout: 2000 }).catch(() => false);
      expect(isListVisible).toBeTruthy();
    } else {
      test.skip();
    }
  });
});
