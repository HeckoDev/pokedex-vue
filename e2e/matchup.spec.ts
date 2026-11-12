import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Pokédex - Weaknesses and resistances page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/faiblesses');
    await expect(page.getByRole('heading', { name: 'Faiblesses et résistances', level: 2 })).toBeVisible();
  });

  test('is reachable from the header navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('header');
    await page.locator('header nav').first().getByRole('link', { name: 'Faiblesses' }).click();
    await expect(page).toHaveURL(/#\/faiblesses$/);
    await expect(page.getByRole('heading', { name: 'Faiblesses et résistances', level: 2 })).toBeVisible();
  });

  test('finds a Pokémon in any language and shows the multipliers', async ({ page }) => {
    await page.getByLabel('Rechercher un Pokémon').fill('charizard');
    await page.getByTestId('suggestions').getByRole('button', { name: /Dracaufeu/ }).click();

    await expect(page.getByTestId('selected-pokemon')).toContainText('Dracaufeu');
    await expect(page.getByTestId('group-4')).toContainText('Roche');
    await expect(page.getByTestId('group-4')).toContainText('×4');
    await expect(page.getByTestId('group-0')).toContainText('Sol');
    await expect(page.getByTestId('group-0.25')).toContainText('Plante');
  });

  test('opens the Pokémon modal from the selected Pokémon', async ({ page }) => {
    await page.getByLabel('Rechercher un Pokémon').fill('pikachu');
    await page.getByTestId('suggestions').getByRole('button', { name: /Pikachu/ }).first().click();

    await page.getByRole('button', { name: /Voir la fiche de Pikachu/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('computes dual types, keeping at most two selected', async ({ page }) => {
    for (const type of ['Feu', 'Vol', 'Eau']) {
      await page.getByRole('button', { name: type, exact: true }).click();
    }
    // Feu was dropped: the result is now Vol / Eau
    await expect(page.getByRole('button', { name: 'Feu', exact: true })).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('heading', { name: 'Dégâts subis par Vol / Eau' })).toBeVisible();
    await expect(page.getByTestId('group-4')).toContainText('Électrik');
  });

  test('splits results into weaknesses, neutral and resistances panels', async ({ page }) => {
    await page.getByRole('button', { name: 'Plante', exact: true }).click();
    await page.getByRole('button', { name: 'Glace', exact: true }).click();
    await expect(page.getByTestId('panel-weak')).toContainText('Feu');
    await expect(page.getByTestId('panel-neutral')).toContainText('Normal');
    await expect(page.getByTestId('panel-resist')).toContainText('Eau');
    await expect(page.getByTestId('panel-weak')).not.toContainText('Eau');
  });

  test('lists the Pokémon of the selected types and selects one', async ({ page }) => {
    await page.getByRole('button', { name: 'Feu', exact: true }).click();
    await page.getByRole('button', { name: 'Vol', exact: true }).click();

    const list = page.getByLabel(/Pokémon de ce type/);
    await expect(list.locator('option', { hasText: 'Dracaufeu' })).toHaveCount(1);
    await list.selectOption({ label: '#6 Dracaufeu' });

    await expect(page.getByTestId('selected-pokemon')).toContainText('Dracaufeu');
    await expect(page.getByTestId('group-4')).toContainText('Roche');
  });

  test('removing the selected Pokémon clears the results', async ({ page }) => {
    await page.getByLabel('Rechercher un Pokémon').fill('bulbizarre');
    await page.getByTestId('suggestions').getByRole('button', { name: /Bulbizarre/ }).first().click();
    await page.getByRole('button', { name: /Retirer Bulbizarre/ }).click();
    await expect(page.getByText('Sélectionne un Pokémon ou un type pour commencer.')).toBeVisible();
  });

  test('navigation updates the title and moves focus to the content', async ({ page }) => {
    await expect(page).toHaveTitle(/Faiblesses/);
    await page.locator('header nav').first().getByRole('link', { name: 'Pokédex' }).click();
    await expect(page).toHaveTitle('Pokédex');
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('is fully usable with the keyboard', async ({ page }) => {
    const search = page.getByLabel('Rechercher un Pokémon');
    await search.fill('salameche');
    await expect(page.getByTestId('matchup-status')).toContainText('Pokémon trouvé');
    await search.press('Tab');
    await expect(page.getByTestId('suggestions').getByRole('button').first()).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('selected-pokemon')).toContainText('Salamèche');
    await expect(page.getByTestId('matchup-status')).toContainText('Dégâts subis par Salamèche');

    const fire = page.getByRole('button', { name: 'Feu', exact: true });
    await fire.focus();
    await page.keyboard.press('Space');
    await expect(fire).toHaveAttribute('aria-pressed', 'true');
  });

  test('has no WCAG 2.x A/AA violations with a Pokémon selected from the list', async ({ page }) => {
    await page.getByRole('button', { name: 'Feu', exact: true }).click();
    await page.getByLabel(/Pokémon de ce type/).selectOption({ label: '#4 Salamèche' });
    await expect(page.getByTestId('selected-pokemon')).toBeVisible();
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
  });

  test('has no WCAG 2.x A/AA violations', async ({ page }) => {
    await page.getByRole('button', { name: 'Feu', exact: true }).click();
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
  });
});
