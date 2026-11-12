import { test, expect } from '@playwright/test';
import { mockBackend } from './helpers/mock-backend';

test.describe('Pokédex - Favorites (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page, { authenticated: true });
    await page.goto('/');
    await page.waitForSelector('[data-testid="pokemon-card"]');
  });

  test('adds a favorite from a card, lists it, then removes it', async ({ page }) => {
    const card = page.locator('[data-testid="pokemon-card"]').first();

    await test.step('Add the first Pokémon to favorites', async () => {
      const addButton = card.getByRole('button', { name: /aux favoris/ });
      await addButton.click();
      await expect(card.getByRole('button', { name: /Retirer .* des favoris/ })).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('It appears in the favorites dialog', async () => {
      await page.locator('header').getByRole('button', { name: 'Favoris' }).first().click();
      const dialog = page.getByRole('dialog', { name: 'Mes Pokémon Favoris' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('button', { name: /^Retirer .* des favoris$/ })).toHaveCount(1);
    });

    await test.step('Removing it empties the list', async () => {
      const dialog = page.getByRole('dialog', { name: 'Mes Pokémon Favoris' });
      await dialog.getByRole('button', { name: /^Retirer .* des favoris$/ }).click();
      await expect(dialog.getByText("Vous n'avez pas encore de favoris")).toBeVisible();
    });
  });

  test('shows the empty state when there is no favorite', async ({ page }) => {
    await page.locator('header').getByRole('button', { name: 'Favoris' }).first().click();
    await expect(page.getByText("Vous n'avez pas encore de favoris")).toBeVisible();
  });
});
