import { describe, it, expect } from 'vitest';
import { getTypeLabel, pickLocalizedEntry, toApiLanguage } from '../pokemonI18n';

describe('pokemonI18n', () => {
  it('maps the app language codes to PokeAPI codes', () => {
    expect(toApiLanguage('jp')).toBe('ja');
    expect(toApiLanguage('fr')).toBe('fr');
  });

  it('translates French type names and keeps unknown ones', () => {
    expect(getTypeLabel('Feu', 'en')).toBe('Fire');
    expect(getTypeLabel('Feu', 'jp')).toBe('ほのお');
    expect(getTypeLabel('Unknown', 'en')).toBe('Unknown');
  });

  it('falls back to English then French when the language is missing', () => {
    const entries = [
      { language: { name: 'fr' }, v: 'fr' },
      { language: { name: 'en' }, v: 'en' },
    ];
    expect(pickLocalizedEntry(entries, 'jp')?.v).toBe('en');
    expect(pickLocalizedEntry(entries.slice(0, 1), 'jp')?.v).toBe('fr');
    expect(pickLocalizedEntry([{ language: { name: 'ja-hrkt' }, v: 'kana' }], 'jp')?.v).toBe('kana');
    expect(pickLocalizedEntry(undefined, 'en')).toBeUndefined();
  });
});

describe('pickFlavorText', () => {
  const entries = ['x', 'y', 'omega-ruby'].map((v) => ({ language: { name: 'en' }, version: { name: v }, v }));
  it('gives Mega X and Mega Y different entries', async () => {
    const { pickFlavorText, getFormVersions } = await import('../pokemonI18n');
    expect(pickFlavorText(entries, 'en', getFormVersions('mega', undefined, 'charizard-mega-x'))?.v).toBe('x');
    expect(pickFlavorText(entries, 'en', getFormVersions('mega', undefined, 'charizard-mega-y'))?.v).toBe('y');
  });
});
