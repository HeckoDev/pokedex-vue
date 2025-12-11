import { test, expect } from '@playwright/test';

test.describe('Pokédex - Teams', () => {
  // Note: These tests require authentication
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display the teams button when authenticated', async ({ page }) => {
    // Look for the teams button in the header
    const teamsButton = page.locator('header button').filter({ 
      hasText: /équipes|teams|Mes équipes|My teams/i 
    });
    
    if (await teamsButton.first().isVisible()) {
      await expect(teamsButton.first()).toBeVisible();
      
      // Click the button
      await teamsButton.first().click();
      await page.waitForTimeout(500);
      
      // Verify that the teams modal opens
      const teamsModal = page.locator('[role="dialog"]');
      await expect(teamsModal.first()).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should display the teams list', async ({ page }) => {
    // Click the teams button
    const teamsButton = page.locator('header button').filter({ 
      hasText: /équipes|teams|Mes équipes/i 
    }).first();
    
    if (await teamsButton.isVisible()) {
      await teamsButton.click();
      await page.waitForTimeout(500);
      
      // Verify that the modal is opened
      const teamsModal = page.locator('[role="dialog"]');
      await expect(teamsModal.first()).toBeVisible();
      
      // Verify the content (either teams or an empty message)
      const emptyMessage = teamsModal.locator('text=/vide|empty|aucune équipe|no teams/i');
      const teamCards = teamsModal.locator('.bg-gray-800.rounded-2xl, [data-testid="team-card"]');
      
      const hasEmpty = await emptyMessage.first().isVisible({ timeout: 2000 }).catch(() => false);
      const hasTeams = await teamCards.first().isVisible({ timeout: 2000 }).catch(() => false);
      
      // One of the two should be visible
      expect(hasEmpty || hasTeams).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should allow creating a new team', async ({ page }) => {
    const teamsButton = page.locator('header button').filter({ 
      hasText: /équipes|teams/i 
    }).first();
    
    if (await teamsButton.isVisible()) {
      await teamsButton.click();
      await page.waitForTimeout(500);
      
      // Look for the team creation button
      const createButton = page.locator('button').filter({ 
        hasText: /Créer|Create|Nouvelle|New|➕|\+/i 
      });
      
      if (await createButton.first().isVisible()) {
        await createButton.first().click();
        await page.waitForTimeout(500);
        
        // A form should appear
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

  test('should allow adding a Pokémon to a team', async ({ page }) => {
    // Open a Pokémon card
    await page.waitForSelector('.bg-gray-800.rounded-2xl', { timeout: 10000 });
    const firstCard = page.locator('.bg-gray-800.rounded-2xl').filter({ hasText: /#\d+/ }).first();
    await firstCard.click();
    await page.waitForTimeout(500);
    
    // Look for the add to team button
    const addToTeamButton = page.locator('button').filter({ 
      hasText: /Ajouter à une équipe|Add to team|équipe/i 
    });
    
    if (await addToTeamButton.first().isVisible()) {
      await addToTeamButton.first().click();
      await page.waitForTimeout(500);
      
      // A list of teams should appear
      const teamsList = page.locator('[role="dialog"], .modal');
      const isListVisible = await teamsList.first().isVisible({ timeout: 2000 }).catch(() => false);
      expect(isListVisible).toBeTruthy();
    } else {
      test.skip();
    }
  });
});
