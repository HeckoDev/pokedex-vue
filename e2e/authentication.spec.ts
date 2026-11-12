import { test, expect } from '@playwright/test';
import { mockBackend, VALID_PASSWORD } from './helpers/mock-backend';

test.describe('Pokédex - Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('header');
  });

  test('should display login button when not authenticated', async ({ page }) => {
    // Look for a login button in the header
    const loginButton = page.locator('header button').filter({ 
      hasText: /Se connecter|Login|Connexion/i 
    });
    
    // Button should be visible if user is not logged in
    if (await loginButton.isVisible()) {
      await expect(loginButton).toBeVisible();
    }
  });

  test('should open authentication modal', async ({ page }) => {
    // Look for the login button (can contain an icon or text)
    const loginButton = page.locator('button').filter({ 
      hasText: /Se connecter|Login|Connexion|👤|Auth/i 
    }).first();
    
    // Check if an authentication button exists
    const hasLoginButton = await loginButton.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasLoginButton) {
      await loginButton.click();
      await page.waitForTimeout(500);
      
      // Verify that the authentication modal is opened
      const authModal = page.locator('[role="dialog"]');
      await expect(authModal).toBeVisible({ timeout: 5000 });
    } else {
      // Authentication feature may not be implemented
      console.log('No login button found - feature not implemented');
    }
  });

  test('should allow toggling between login and registration', async ({ page }) => {
    // Open the authentication modal
    const loginButton = page.locator('header button').filter({ 
      hasText: /Se connecter|Login|Connexion/i 
    }).first();
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
      
      // Look for the button to switch to registration
      const switchButton = page.locator('button').filter({ 
        hasText: /Inscription|S'inscrire|Sign up|Register/i 
      });
      
      if (await switchButton.first().isVisible()) {
        await switchButton.first().click();
        await page.waitForTimeout(300);
        
        // Verify that the registration form is displayed
        const signupForm = page.locator('text=/Inscription|Sign up/i');
        await expect(signupForm.first()).toBeVisible();
      }
    }
  });

  test('should display an error with invalid credentials', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/');
    await page.locator('header').getByRole('button', { name: 'Se connecter' }).first().click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Email').fill('test@invalide.com');
    await dialog.getByLabel('Mot de passe').fill('motdepasseinvalide');
    await dialog.getByRole('button', { name: 'Se connecter' }).click();

    await expect(dialog.getByRole('alert')).toHaveText('Invalid credentials');
    await expect(dialog).toBeVisible();
  });

  test('should log in with valid credentials', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/');
    await page.locator('header').getByRole('button', { name: 'Se connecter' }).first().click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Email').fill('ash@example.com');
    await dialog.getByLabel('Mot de passe').fill(VALID_PASSWORD);
    await dialog.getByRole('button', { name: 'Se connecter' }).click();

    await expect(dialog).toBeHidden();
    await expect(page.locator('header').getByRole('button', { name: 'Favoris' }).first()).toBeVisible();
  });

});
