import { test, expect } from '@playwright/test';
import { mockBackend } from './helpers/mock-backend';

test.describe('Pokédex - Teams (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page, { authenticated: true });
    await page.goto('/');
    await page.waitForSelector('[data-testid="pokemon-card"]');
    await page.locator('header').getByRole('button', { name: 'Mes équipes' }).first().click();
  });

  test('shows the empty state', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: /Mes Équipes/ });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Vous n'avez pas encore d'équipes")).toBeVisible();
  });

  test('creates a team and adds a Pokémon at position 1', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: /Mes Équipes/ });

    await test.step('Create the team', async () => {
      await dialog.getByRole('button', { name: '+ Créer une équipe' }).click();
      await dialog.getByPlaceholder("Nom de l'équipe").fill('Team Rocket');
      await dialog.getByRole('button', { name: 'Créer une équipe', exact: true }).click();
      await expect(dialog.getByRole('heading', { name: 'Team Rocket' })).toBeVisible();
      await expect(dialog.getByText('0/6')).toBeVisible();
    });

    await test.step('Add a Pokémon', async () => {
      await dialog.getByRole('button', { name: /Ajouter .*1/ }).first().click();
      await page.getByRole('button', { name: /#1$/ }).first().click();
      await expect(dialog.getByText('1/6')).toBeVisible();
    });
  });

  test('deletes a team after confirmation', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: /Mes Équipes/ });
    await dialog.getByRole('button', { name: '+ Créer une équipe' }).click();
    await dialog.getByPlaceholder("Nom de l'équipe").fill('Temporary');
    await dialog.getByRole('button', { name: 'Créer une équipe', exact: true }).click();
    await expect(dialog.getByRole('heading', { name: 'Temporary' })).toBeVisible();

    page.once('dialog', (confirm) => confirm.accept());
    await dialog.getByRole('button', { name: /Temporary/ }).click();

    await expect(dialog.getByText("Vous n'avez pas encore d'équipes")).toBeVisible();
  });
});
