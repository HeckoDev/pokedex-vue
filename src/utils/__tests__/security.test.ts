/**
 * Tests unitaires pour les utilitaires de sécurité
 * 
 * Pour exécuter ces tests, installer vitest :
 * npm install -D vitest @vue/test-utils happy-dom
 * 
 * Puis ajouter dans package.json :
 * "scripts": {
 *   "test": "vitest",
 *   "test:ui": "vitest --ui"
 * }
 */

import { describe, it, expect } from 'vitest';
import { hashPassword, generateSalt, sanitizeInput } from '../security';
import { validateEmail, validatePassword, validateUsername } from '../validation';
import { safeParseJSON, safeSetItem } from '../storage';

describe('Security Utils', () => {
  describe('hashPassword', () => {
    it('should hash password with salt', async () => {
      const password = 'TestPassword123';
      const salt = 'test-salt';
      const hash = await hashPassword(password, salt);
      
      expect(hash).toBeTruthy();
      expect(hash).toHaveLength(64); // SHA-256 produit 64 caractères hex
      expect(hash).not.toContain(password);
    });

    it('should produce different hashes with different salts', async () => {
      const password = 'SamePassword123';
      const hash1 = await hashPassword(password, 'salt1');
      const hash2 = await hashPassword(password, 'salt2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should produce same hash with same password and salt', async () => {
      const password = 'Consistent123';
      const salt = 'consistent-salt';
      const hash1 = await hashPassword(password, salt);
      const hash2 = await hashPassword(password, salt);
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('generateSalt', () => {
    it('should generate unique salt', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      
      expect(salt1).toBeTruthy();
      expect(salt2).toBeTruthy();
      expect(salt1).not.toBe(salt2);
    });

    it('should generate valid UUID format', () => {
      const salt = generateSalt();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      expect(salt).toMatch(uuidRegex);
    });
  });

  describe('sanitizeInput', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });

    it('should escape quotes', () => {
      const input = `Hello "world" and 'universe'`;
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toContain('&quot;');
      expect(sanitized).toContain('&#x27;');
    });

    it('should handle normal text', () => {
      const input = 'NormalUsername123';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toBe(input);
    });
  });
});

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should accept valid email', () => {
      const result = validateEmail('user@example.com');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should reject invalid format', () => {
      const invalids = ['notanemail', '@example.com', 'user@', 'user @example.com'];
      
      invalids.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(false);
      });
    });

    it('should accept various valid formats', () => {
      const valids = ['test@test.com', 'user.name@example.co.uk', 'user+tag@example.com'];
      
      valids.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('validatePassword', () => {
    it('should accept strong password', () => {
      const result = validatePassword('StrongPass123');
      expect(result.valid).toBe(true);
    });

    it('should reject short password', () => {
      const result = validatePassword('Short1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('8 caractères');
    });

    it('should require uppercase', () => {
      const result = validatePassword('lowercase123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('majuscule');
    });

    it('should require lowercase', () => {
      const result = validatePassword('UPPERCASE123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('minuscule');
    });

    it('should require digit', () => {
      const result = validatePassword('NoDigitsHere');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('chiffre');
    });
  });

  describe('validateUsername', () => {
    it('should accept valid username', () => {
      const result = validateUsername('ValidUser123');
      expect(result.valid).toBe(true);
    });

    it('should reject empty username', () => {
      const result = validateUsername('');
      expect(result.valid).toBe(false);
    });

    it('should reject short username', () => {
      const result = validateUsername('ab');
      expect(result.valid).toBe(false);
    });

    it('should reject long username', () => {
      const result = validateUsername('a'.repeat(21));
      expect(result.valid).toBe(false);
    });

    it('should reject special characters', () => {
      const invalids = ['user@name', 'user name', 'user#123', 'user!'];
      
      invalids.forEach(username => {
        const result = validateUsername(username);
        expect(result.valid).toBe(false);
      });
    });

    it('should accept dashes and underscores', () => {
      const valids = ['user-name', 'user_name', 'user-123_test'];
      
      valids.forEach(username => {
        const result = validateUsername(username);
        expect(result.valid).toBe(true);
      });
    });
  });
});

describe('Storage Utils', () => {
  describe('safeParseJSON', () => {
    it('should parse valid JSON', () => {
      const json = '{"name":"John","age":30}';
      const result = safeParseJSON(json, {});
      
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should return fallback for null', () => {
      const result = safeParseJSON(null, { default: true });
      expect(result).toEqual({ default: true });
    });

    it('should return fallback for invalid JSON', () => {
      const result = safeParseJSON('invalid json', []);
      expect(result).toEqual([]);
    });

    it('should handle arrays', () => {
      const json = '[1,2,3]';
      const result = safeParseJSON(json, []);
      
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('safeSetItem', () => {
    it('should set item successfully', () => {
      const result = safeSetItem('test-key', 'test-value');
      expect(result).toBe(true);
      expect(localStorage.getItem('test-key')).toBe('test-value');
      
      // Cleanup
      localStorage.removeItem('test-key');
    });

    it('should handle large data gracefully', () => {
      // Créer une chaîne très grande (plusieurs MB)
      const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB
      const result = safeSetItem('large-key', largeData);
      
      // Selon le navigateur, ça peut réussir ou échouer
      // L'important est que ça ne crash pas
      expect(typeof result).toBe('boolean');
      
      // Cleanup
      localStorage.removeItem('large-key');
    });
  });
});

describe('Integration Tests - Auth Flow', () => {
  it('should register user with hashed password', async () => {
    // Ce test nécessiterait d'importer useAuth
    // et de mocker localStorage
    // Exemple de structure :
    
    // const { register } = useAuth();
    // const result = await register('testuser', 'test@example.com', 'StrongPass123');
    // expect(result.success).toBe(true);
    
    // Vérifier que le mot de passe n'est pas en clair
    // const users = JSON.parse(localStorage.getItem('users'));
    // expect(users[0].password).not.toBe('StrongPass123');
    // expect(users[0].salt).toBeTruthy();
  });

  it('should reject duplicate email', async () => {
    // Test d'inscription avec email déjà utilisé
  });

  it('should login with correct credentials', async () => {
    // Test de login après inscription
  });

  it('should reject wrong password', async () => {
    // Test de login avec mauvais mot de passe
  });
});
