import { test, expect, type Page } from '@playwright/test';

const cards = (page: Page) => page.locator('[data-testid="pokemon-card"]');

async function applyFilters(page: Page, choices: string[]) {
  await page.getByRole('button', { name: /Filtres avancés/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Filtres avancés' });
  for (const name of choices) {
    await dialog.getByRole('button', { name, exact: true }).click();
  }
  await dialog.getByRole('button', { name: 'Appliquer' }).click();
  await expect(dialog).toBeHidden();
}

test.describe('Advanced filters - forms, rarity, stage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(cards(page).first()).toBeVisible();
  });

  test('Gigamax keeps only Pokémon with a Gigamax form', async ({ page }) => {
    await applyFilters(page, ['Gigamax']);
    await expect(cards(page).filter({ hasText: 'Dracaufeu' })).toHaveCount(1);
    await expect(cards(page).filter({ hasText: 'Mewtwo' })).toHaveCount(0);
    expect(await cards(page).count()).toBeLessThan(60);
  });

  test('Méga and a regional form are OR-ed within the forms group', async ({ page }) => {
    await applyFilters(page, ['Méga', 'Alola']);
    await expect(cards(page).filter({ hasText: 'Dracaufeu' })).toHaveCount(1);
    await expect(cards(page).filter({ hasText: 'Rattata' }).first()).toBeVisible();
    await expect(cards(page).filter({ hasText: 'Pikachu' })).toHaveCount(0);
  });

  test('Légendaire combined with a stage uses AND between groups', async ({ page }) => {
    await applyFilters(page, ['Légendaire', 'Sans évolution']);
    await expect(cards(page).filter({ hasText: 'Mewtwo' })).toHaveCount(1);
    await expect(cards(page).filter({ hasText: 'Mew' }).filter({ hasNotText: 'Mewtwo' })).toHaveCount(0);
  });

  test('the dialog reflects applied filters when reopened and resets them', async ({ page }) => {
    await applyFilters(page, ['Gigamax']);
    await page.getByRole('button', { name: /Filtres avancés/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Filtres avancés' });
    await expect(dialog.getByRole('button', { name: 'Gigamax', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await dialog.getByRole('button', { name: 'Réinitialiser' }).click();
    await dialog.getByRole('button', { name: 'Appliquer' }).click();
    await expect(cards(page).filter({ hasText: 'Mewtwo' })).toHaveCount(1);
  });
});

test.describe('Advanced filters - form shown in the list', () => {
  test('cards show the selected form with a badge and its own sprite', async ({ page }) => {
    await page.goto('/');
    await expect(cards(page).first()).toBeVisible();
    await applyFilters(page, ['Gigamax']);
    const card = cards(page).filter({ hasText: 'Dracaufeu' });
    await expect(card.getByTestId('card-form-badge')).toHaveText('Gigamax');
    await expect(card.locator('img')).toHaveAttribute('src', /gmax/);
  });

  test('every card shows the Mega badge when filtering on Méga', async ({ page }) => {
    await page.goto('/');
    await expect(cards(page).first()).toBeVisible();
    await applyFilters(page, ['Méga']);
    await expect(cards(page).filter({ hasText: 'Méganium' })).toHaveCount(1);
    await expect(page.getByTestId('card-form-badge')).toHaveCount(await cards(page).count());
  });

  test('regional filter shows the regional artwork', async ({ page }) => {
    await page.goto('/');
    await expect(cards(page).first()).toBeVisible();
    await applyFilters(page, ['Alola']);
    const card = cards(page).filter({ hasText: 'Rattata' }).first();
    await expect(card.getByTestId('card-form-badge')).toHaveText('Alola');
    await expect(card.locator('img')).toHaveAttribute('src', /official-artwork\/10091\.png/);
  });
});

test.describe('Advanced filters - modal opens on the filtered form', () => {
  test('Gigamax filter opens the modal on the Gigamax form', async ({ page }) => {
    await page.goto('/');
    await expect(cards(page).first()).toBeVisible();
    await applyFilters(page, ['Gigamax']);
    await cards(page).filter({ hasText: 'Dracaufeu' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: 'Forme Gigamax', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('without a form filter the modal opens on the normal form', async ({ page }) => {
    await page.goto('/');
    await cards(page).filter({ hasText: 'Dracaufeu' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: 'Forme Gigamax', exact: true })).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('Pokémon cry', () => {
  test('plays on opening and can be replayed from the modal', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__played = [];
      HTMLMediaElement.prototype.play = function () {
        (window as any).__played.push(this.src);
        return Promise.resolve();
      };
    });
    await page.goto('/');
    await cards(page).filter({ hasText: 'Pikachu' }).first().click();

    const button = page.getByRole('button', { name: 'Écouter le cri' });
    await expect(button).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as any).__played.length)).toBe(1);

    await button.click();
    await expect.poll(() => page.evaluate(() => (window as any).__played.length)).toBe(2);
    const played: string[] = await page.evaluate(() => (window as any).__played);
    expect(played[0]).toMatch(/\.ogg$/);
  });
});
