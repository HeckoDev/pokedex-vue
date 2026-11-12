import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const cards = (page: Page) => page.locator('[data-testid="pokemon-card"]');
const pick = (page: Page, name: string) =>
  cards(page).filter({ hasText: name }).first().getByRole('button', { name: /pour la comparaison/ });

test.describe('Pokémon comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(cards(page).first()).toBeVisible();
    await page.getByTestId('compare-toggle').click();
  });

  test('the launch button only appears once two Pokémon are selected', async ({ page }) => {
    await expect(page.getByTestId('compare-launch')).toHaveCount(0);
    await pick(page, 'Dracaufeu').click();
    await expect(page.getByTestId('compare-launch')).toHaveCount(0);
    await expect(page.getByTestId('compare-status')).toHaveText('1/2 sélectionnés');
    await pick(page, 'Mewtwo').click();
    await expect(page.getByTestId('compare-launch')).toBeVisible();
    await expect(page.getByTestId('compare-status')).toHaveText('Comparer ces 2 Pokémon');
  });

  test('clicking a card selects it instead of opening its sheet', async ({ page }) => {
    await pick(page, 'Dracaufeu').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(pick(page, 'Dracaufeu')).toHaveAttribute('aria-pressed', 'true');
    await pick(page, 'Dracaufeu').click();
    await expect(pick(page, 'Dracaufeu')).toHaveAttribute('aria-pressed', 'false');
  });

  test('a third selection replaces the oldest one', async ({ page }) => {
    await pick(page, 'Bulbizarre').click();
    await pick(page, 'Herbizarre').click();
    await pick(page, 'Salamèche').click();
    await expect(pick(page, 'Bulbizarre')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('[data-testid="compare-check"]')).toHaveCount(2);
  });

  test('shows both Pokémon, highlights the higher stat and closes with Escape', async ({ page }) => {
    await pick(page, 'Dracaufeu').click();
    await pick(page, 'Mewtwo').click();
    await page.getByTestId('compare-launch').click();

    const dialog = page.getByRole('dialog', { name: 'Comparaison' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Dracaufeu' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Mewtwo' })).toBeVisible();

    // Mewtwo (106 base HP) beats Charizard (78): its cell is the winner
    const hp = dialog.getByTestId('compare-row-hp').locator('td');
    await expect(hp.nth(0)).toHaveAttribute('data-winner', 'false');
    await expect(hp.nth(1)).toHaveAttribute('data-winner', 'true');
    await expect(hp.nth(1)).toContainText('valeur la plus élevée');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('leaving compare mode clears the selection', async ({ page }) => {
    await pick(page, 'Dracaufeu').click();
    await page.getByTestId('compare-toggle').click();
    await expect(page.locator('[data-testid="compare-check"]')).toHaveCount(0);
    await expect(page.getByTestId('compare-launch')).toHaveCount(0);
  });

  test('the comparison has no WCAG 2.x A/AA violations', async ({ page }) => {
    await pick(page, 'Dracaufeu').click();
    await pick(page, 'Mewtwo').click();
    await page.getByTestId('compare-launch').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .include('[role="dialog"]')
      .analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
  });
});
