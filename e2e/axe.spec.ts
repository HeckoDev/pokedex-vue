import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockBackend } from './helpers/mock-backend';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const scan = async (page: import('@playwright/test').Page, root?: string) => {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (root) builder = builder.include(root);
  const { violations } = await builder.analyze();
  return violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) - ${v.nodes[0]?.target.join(' ')}`);
};

test.describe('Pokédex - Automated accessibility (axe-core)', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page, { authenticated: true });
    await page.goto('/');
    await page.waitForSelector('[data-testid="pokemon-card"]');
  });

  test('home page has no WCAG 2.x A/AA violations', async ({ page }) => {
    expect(await scan(page)).toEqual([]);
  });

  test('Pokémon modal has no WCAG 2.x A/AA violations', async ({ page }) => {
    await page.locator('[data-testid="pokemon-card"] button.card-open').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await scan(page, '[role="dialog"]')).toEqual([]);
  });

  test('teams dialog has no WCAG 2.x A/AA violations', async ({ page }) => {
    await page.locator('header').getByRole('button', { name: 'Mes équipes' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await scan(page, '[role="dialog"]')).toEqual([]);
  });
});
