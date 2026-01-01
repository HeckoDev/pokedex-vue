import { describe, it, expect } from 'vitest';
import {
  typeColors,
  typeGradientColors,
  getTypeColor,
  getTypeGradient,
} from '../typeColors';

describe('typeColors utility', () => {
  describe('typeColors', () => {
    it('should have colors for all standard types', () => {
      const expectedTypes = [
        'Normal', 'Plante', 'Feu', 'Eau', 'Électrik', 'Glace',
        'Combat', 'Poison', 'Sol', 'Vol', 'Psy', 'Insecte',
        'Roche', 'Spectre', 'Dragon', 'Ténèbres', 'Acier', 'Fée',
      ];

      expectedTypes.forEach(type => {
        expect(typeColors[type]).toBeDefined();
        expect(typeof typeColors[type]).toBe('string');
        expect(typeColors[type]).toContain('bg-');
      });
    });

    it('should return bg-gray-600 for getTypeColor with unknown type', () => {
      expect(getTypeColor('UnknownType')).toBe('bg-gray-600');
    });

    it('should return correct color for known type', () => {
      expect(getTypeColor('Feu')).toBe('bg-red-600');
      expect(getTypeColor('Eau')).toBe('bg-blue-600');
      expect(getTypeColor('Plante')).toBe('bg-green-600');
    });
  });

  describe('typeGradientColors', () => {
    it('should have gradient colors for all standard types', () => {
      const expectedTypes = [
        'Normal', 'Plante', 'Feu', 'Eau', 'Électrik', 'Glace',
        'Combat', 'Poison', 'Sol', 'Vol', 'Psy', 'Insecte',
        'Roche', 'Spectre', 'Dragon', 'Ténèbres', 'Acier', 'Fée',
      ];

      expectedTypes.forEach(type => {
        expect(typeGradientColors[type]).toBeDefined();
        expect(typeGradientColors[type]).toHaveProperty('from');
        expect(typeGradientColors[type]).toHaveProperty('to');
        expect(typeGradientColors[type].from).toContain('from-');
        expect(typeGradientColors[type].to).toContain('to-');
      });
    });
  });

  describe('getTypeGradient', () => {
    it('should return single gradient for one type', () => {
      const gradient = getTypeGradient('Feu');
      expect(gradient).toContain('from-');
      expect(gradient).toContain('to-');
    });

    it('should combine gradients for two types', () => {
      const gradient = getTypeGradient('Feu', 'Vol');
      expect(gradient).toContain('from-');
      expect(gradient).toContain('to-');
    });

    it('should handle unknown primary type', () => {
      const gradient = getTypeGradient('UnknownType');
      expect(gradient).toContain('from-purple-600');
      expect(gradient).toContain('to-pink-600');
    });

    it('should handle unknown secondary type', () => {
      const gradient = getTypeGradient('Feu', 'UnknownType');
      expect(gradient).toContain('from-red-500');
      expect(gradient).toContain('to-pink-600');
    });

    it('should return correct gradients for known types', () => {
      expect(getTypeGradient('Feu')).toBe('from-red-500 to-orange-600');
      expect(getTypeGradient('Eau')).toBe('from-blue-500 to-cyan-600');
      expect(getTypeGradient('Plante')).toBe('from-green-500 to-green-600');
    });

    it('should combine different type gradients', () => {
      const gradient = getTypeGradient('Feu', 'Vol');
      expect(gradient).toContain('from-red-500');
      expect(gradient).toContain('to-sky-500');
    });
  });

  describe('color format validation', () => {
    it('should use valid Tailwind color classes', () => {
      Object.values(typeColors).forEach(color => {
        expect(color).toMatch(/^bg-\w+-\d+$/);
      });
    });

    it('should use valid Tailwind gradient classes', () => {
      Object.values(typeGradientColors).forEach(gradient => {
        expect(gradient.from).toMatch(/^from-\w+-\d+$/);
        expect(gradient.to).toMatch(/^to-\w+-\d+$/);
      });
    });
  });
});
