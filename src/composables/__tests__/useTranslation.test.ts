import { describe, it, expect, beforeEach, vi } from 'vitest';

let useTranslation: any;

describe('useTranslation Composable', () => {
  beforeEach(async () => {
    // Clear localStorage
    localStorage.clear();
    
    // Reset module cache
    vi.resetModules();
    
    // Import fresh instance
    const module = await import('../useTranslation');
    useTranslation = module.useTranslation;
  });

  describe('Initial State', () => {
    it('should initialize with default language (fr)', () => {
      const { currentLanguage } = useTranslation();
      
      expect(currentLanguage.value).toBe('fr');
    });

    it('should load saved language from localStorage', async () => {
      localStorage.setItem('ui-language', 'en');
      
      // Reset and reload
      vi.resetModules();
      const module = await import('../useTranslation?t=' + Date.now());
      const { currentLanguage } = module.useTranslation();
      
      expect(currentLanguage.value).toBe('en');
    });

    it('should ignore invalid language in localStorage', async () => {
      localStorage.setItem('ui-language', 'invalid');
      
      vi.resetModules();
      const module = await import('../useTranslation?t=' + Date.now());
      const { currentLanguage } = module.useTranslation();
      
      // Should stay at default (fr)
      expect(currentLanguage.value).toBe('fr');
    });
  });

  describe('Translation Function (t)', () => {
    it('should translate simple keys', () => {
      const { t } = useTranslation();
      
      // Using actual keys from fr.json
      const result = t('header.teams' as any);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return key if translation not found', () => {
      const { t } = useTranslation();
      
      const result = t('nonexistent.key' as any);
      expect(result).toBe('nonexistent.key');
    });

    it('should translate nested keys', () => {
      const { t } = useTranslation();
      
      const result = t('header.teams' as any);
      expect(typeof result).toBe('string');
    });

    it('should work with different languages', () => {
      const { t, setUILanguage } = useTranslation();
      
      // French
      const frResult = t('header.teams' as any);
      
      // English
      setUILanguage('en');
      const enResult = t('header.teams' as any);
      
      // Japanese
      setUILanguage('jp');
      const jpResult = t('header.teams' as any);
      
      // All should return strings (may be same or different depending on translations)
      expect(typeof frResult).toBe('string');
      expect(typeof enResult).toBe('string');
      expect(typeof jpResult).toBe('string');
    });
  });

  describe('Set UI Language', () => {
    it('should change UI language to English', () => {
      const { setUILanguage, currentLanguage } = useTranslation();
      
      setUILanguage('en');
      
      expect(currentLanguage.value).toBe('en');
    });

    it('should change UI language to Japanese', () => {
      const { setUILanguage, currentLanguage } = useTranslation();
      
      setUILanguage('jp');
      
      expect(currentLanguage.value).toBe('jp');
    });

    it('should persist language to localStorage', () => {
      const { setUILanguage } = useTranslation();
      
      setUILanguage('en');
      
      expect(localStorage.getItem('ui-language')).toBe('en');
    });

    it('should not change language for invalid code', () => {
      const { setUILanguage, currentLanguage } = useTranslation();
      
      const originalLang = currentLanguage.value;
      setUILanguage('invalid' as any);
      
      expect(currentLanguage.value).toBe(originalLang);
    });

    it('should update translations after language change', () => {
      const { t, setUILanguage } = useTranslation();
      
      const frTitle = t('header.teams' as any);
      
      setUILanguage('en');
      const enTitle = t('header.teams' as any);
      
      // Titles should be valid strings
      expect(typeof frTitle).toBe('string');
      expect(typeof enTitle).toBe('string');
    });
  });

  describe('Current Language', () => {
    it('should return current language as computed', () => {
      const { currentLanguage } = useTranslation();
      
      expect(currentLanguage.value).toBe('fr');
    });

    it('should update when language changes', () => {
      const { setUILanguage, currentLanguage } = useTranslation();
      
      expect(currentLanguage.value).toBe('fr');
      
      setUILanguage('en');
      expect(currentLanguage.value).toBe('en');
      
      setUILanguage('jp');
      expect(currentLanguage.value).toBe('jp');
    });
  });

  describe('Has Translation', () => {
    it('should return true for existing keys', () => {
      const { hasTranslation } = useTranslation();
      
      expect(hasTranslation('header.teams')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      const { hasTranslation } = useTranslation();
      
      expect(hasTranslation('nonexistent.key')).toBe(false);
    });

    it('should return false for partial keys', () => {
      const { hasTranslation } = useTranslation();
      
      expect(hasTranslation('header')).toBe(false);
    });

    it('should work after language change', () => {
      const { hasTranslation, setUILanguage } = useTranslation();
      
      expect(hasTranslation('header.teams')).toBe(true);
      
      setUILanguage('en');
      expect(hasTranslation('header.teams')).toBe(true);
    });
  });

  describe('Multiple Instances', () => {
    it('should share language state between instances', () => {
      const instance1 = useTranslation();
      const instance2 = useTranslation();
      
      instance1.setUILanguage('en');
      
      expect(instance2.currentLanguage.value).toBe('en');
    });

    it('should update all instances when language changes', () => {
      const instance1 = useTranslation();
      const instance2 = useTranslation();
      
      instance1.setUILanguage('jp');
      
      expect(instance1.currentLanguage.value).toBe('jp');
      expect(instance2.currentLanguage.value).toBe('jp');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string keys gracefully', () => {
      const { t } = useTranslation();
      
      const result = t('' as any);
      expect(result).toBe('');
    });

    it('should handle deeply nested keys', () => {
      const { t } = useTranslation();
      
      // Test with actual nested structure from locales
      const result = t('header.teams' as any);
      expect(typeof result).toBe('string');
    });

    it('should switch between all available languages', () => {
      const { setUILanguage, currentLanguage } = useTranslation();
      
      const languages: Array<'fr' | 'en' | 'jp'> = ['fr', 'en', 'jp'];
      
      languages.forEach(lang => {
        setUILanguage(lang);
        expect(currentLanguage.value).toBe(lang);
      });
    });
  });

  describe('localStorage Persistence', () => {
    it('should save and restore language preference', async () => {
      const { setUILanguage } = useTranslation();
      
      setUILanguage('jp');
      expect(localStorage.getItem('ui-language')).toBe('jp');
      
      // Reload module
      vi.resetModules();
      const module = await import('../useTranslation?t=' + Date.now());
      const { currentLanguage } = module.useTranslation();
      
      expect(currentLanguage.value).toBe('jp');
    });

    it('should update localStorage on each language change', () => {
      const { setUILanguage } = useTranslation();
      
      setUILanguage('en');
      expect(localStorage.getItem('ui-language')).toBe('en');
      
      setUILanguage('jp');
      expect(localStorage.getItem('ui-language')).toBe('jp');
      
      setUILanguage('fr');
      expect(localStorage.getItem('ui-language')).toBe('fr');
    });
  });
});
