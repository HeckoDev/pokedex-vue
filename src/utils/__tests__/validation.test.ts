import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateUsername } from '../validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com',
        'user_name@example.org',
        'test123@test-domain.com',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject email with only spaces', () => {
      const result = validateEmail('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid email format');
      });
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'StrongPass123',
        'MyP@ssw0rd',
        'Secure1234',
        'Test1ngPass',
        'Abcdefgh1',
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject empty password', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should reject short passwords', () => {
      const result = validatePassword('Short1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Password must contain at least 8 characters');
    });

    it('should require at least one uppercase letter', () => {
      const result = validatePassword('lowercase123');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Password must contain at least one uppercase letter');
    });

    it('should require at least one lowercase letter', () => {
      const result = validatePassword('UPPERCASE123');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Password must contain at least one lowercase letter');
    });

    it('should require at least one digit', () => {
      const result = validatePassword('NoDigitsHere');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Password must contain at least one digit');
    });

    it('should accept password with exactly 8 characters', () => {
      const result = validatePassword('Abcdef12');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateUsername', () => {
    it('should accept valid usernames', () => {
      const validUsernames = [
        'validuser',
        'user123',
        'user_name',
        'user-name',
        'User123',
        'test_user-123',
        'abc',
        'a'.repeat(20),
      ];

      validUsernames.forEach(username => {
        const result = validateUsername(username);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject empty username', () => {
      const result = validateUsername('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Username is required');
    });

    it('should reject username with only spaces', () => {
      const result = validateUsername('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Username is required');
    });

    it('should reject usernames that are too short', () => {
      const result = validateUsername('ab');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid username (3-20 alphanumeric characters, dashes and underscores allowed)');
    });

    it('should reject usernames that are too long', () => {
      const result = validateUsername('a'.repeat(21));
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid username (3-20 alphanumeric characters, dashes and underscores allowed)');
    });

    it('should reject usernames with special characters', () => {
      const invalidUsernames = [
        'user@name',
        'user name',
        'user#123',
        'user!',
        'user$123',
        'user%test',
        'user&name',
        'user*123',
      ];

      invalidUsernames.forEach(username => {
        const result = validateUsername(username);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid username (3-20 alphanumeric characters, dashes and underscores allowed)');
      });
    });

    it('should accept usernames with dashes and underscores', () => {
      const validUsernames = [
        'user-name',
        'user_name',
        'user-123_test',
        'test_123-user',
      ];

      validUsernames.forEach(username => {
        const result = validateUsername(username);
        expect(result.valid).toBe(true);
      });
    });
  });
});
