import { describe, it, expect, beforeEach } from 'vitest';
import { safeParseJSON, safeSetItem } from '../storage';

describe('Storage Utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('safeParseJSON', () => {
    it('should parse valid JSON string', () => {
      const json = '{"name":"John","age":30}';
      const result = safeParseJSON(json, {});
      
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should parse valid JSON array', () => {
      const json = '[1,2,3,4,5]';
      const result = safeParseJSON(json, []);
      
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return fallback for null input', () => {
      const result = safeParseJSON(null, { default: true });
      expect(result).toEqual({ default: true });
    });

    it('should return fallback for undefined input', () => {
      const result = safeParseJSON(undefined as any, { default: true });
      expect(result).toEqual({ default: true });
    });

    it('should return fallback for invalid JSON', () => {
      const invalidJSON = 'invalid json {';
      const fallback = { error: true };
      const result = safeParseJSON(invalidJSON, fallback);
      
      expect(result).toEqual(fallback);
    });

    it('should return fallback for empty string', () => {
      const result = safeParseJSON('', []);
      expect(result).toEqual([]);
    });

    it('should handle nested objects', () => {
      const json = '{"user":{"name":"John","address":{"city":"Paris"}}}';
      const result = safeParseJSON(json, {});
      
      expect(result).toEqual({
        user: {
          name: 'John',
          address: {
            city: 'Paris'
          }
        }
      });
    });

    it('should handle arrays of objects', () => {
      const json = '[{"id":1,"name":"Item1"},{"id":2,"name":"Item2"}]';
      const result = safeParseJSON(json, []);
      
      expect(result).toEqual([
        { id: 1, name: 'Item1' },
        { id: 2, name: 'Item2' }
      ]);
    });

    it('should preserve type with generic', () => {
      interface User {
        name: string;
        age: number;
      }
      
      const json = '{"name":"Alice","age":25}';
      const result = safeParseJSON<User>(json, { name: '', age: 0 });
      
      expect(result.name).toBe('Alice');
      expect(result.age).toBe(25);
    });
  });

  describe('safeSetItem', () => {
    it('should set item successfully', () => {
      const result = safeSetItem('test-key', 'test-value');
      
      expect(result).toBe(true);
      expect(localStorage.getItem('test-key')).toBe('test-value');
    });

    it('should set complex JSON string', () => {
      const data = JSON.stringify({ name: 'Test', value: 123 });
      const result = safeSetItem('complex-key', data);
      
      expect(result).toBe(true);
      expect(localStorage.getItem('complex-key')).toBe(data);
    });

    it('should overwrite existing key', () => {
      safeSetItem('key', 'value1');
      expect(localStorage.getItem('key')).toBe('value1');
      
      safeSetItem('key', 'value2');
      expect(localStorage.getItem('key')).toBe('value2');
    });

    it('should handle empty string value', () => {
      const result = safeSetItem('empty-key', '""');
      
      expect(result).toBe(true);
      expect(localStorage.getItem('empty-key')).toBe('""');
    });

    it('should handle multiple items', () => {
      safeSetItem('key1', 'value1');
      safeSetItem('key2', 'value2');
      safeSetItem('key3', 'value3');
      
      expect(localStorage.getItem('key1')).toBe('value1');
      expect(localStorage.getItem('key2')).toBe('value2');
      expect(localStorage.getItem('key3')).toBe('value3');
    });

    it('should work with large data', () => {
      const largeData = 'x'.repeat(1000);
      const result = safeSetItem('large-key', largeData);
      
      expect(result).toBe(true);
      expect(localStorage.getItem('large-key')).toBe(largeData);
    });

    it('should handle QuotaExceededError', () => {
      // Mock localStorage to throw QuotaExceededError
      const originalSetItem = localStorage.setItem;
      const alertMock = vi.fn();
      globalThis.alert = alertMock;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');
      Object.defineProperty(quotaError, 'name', { value: 'QuotaExceededError' });
      
      localStorage.setItem = vi.fn(() => {
        throw quotaError;
      });
      
      const result = safeSetItem('test-key', 'test-value');
      
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('localStorage full');
      expect(alertMock).toHaveBeenCalled();
      
      // Restore
      localStorage.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });

    it('should handle NS_ERROR_DOM_QUOTA_REACHED error', () => {
      // Mock localStorage to throw NS_ERROR_DOM_QUOTA_REACHED (Firefox)
      const originalSetItem = localStorage.setItem;
      const alertMock = vi.fn();
      globalThis.alert = alertMock;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const quotaError = new DOMException('NS_ERROR_DOM_QUOTA_REACHED', 'NS_ERROR_DOM_QUOTA_REACHED');
      Object.defineProperty(quotaError, 'name', { value: 'NS_ERROR_DOM_QUOTA_REACHED' });
      
      localStorage.setItem = vi.fn(() => {
        throw quotaError;
      });
      
      const result = safeSetItem('test-key', 'test-value');
      
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('localStorage full');
      expect(alertMock).toHaveBeenCalled();
      
      // Restore
      localStorage.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });

    it('should handle other localStorage errors', () => {
      // Mock localStorage to throw generic error
      const originalSetItem = localStorage.setItem;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const genericError = new Error('Some other error');
      
      localStorage.setItem = vi.fn(() => {
        throw genericError;
      });
      
      const result = safeSetItem('test-key', 'test-value');
      
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('localStorage error:', genericError);
      
      // Restore
      localStorage.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });

  });

  describe('Integration - safeParseJSON and safeSetItem', () => {
    it('should store and retrieve object correctly', () => {
      const data = { id: 1, name: 'Test', active: true };
      const jsonString = JSON.stringify(data);
      
      safeSetItem('test-object', jsonString);
      const retrieved = safeParseJSON(localStorage.getItem('test-object'), {});
      
      expect(retrieved).toEqual(data);
    });

    it('should store and retrieve array correctly', () => {
      const data = [1, 2, 3, 4, 5];
      const jsonString = JSON.stringify(data);
      
      safeSetItem('test-array', jsonString);
      const retrieved = safeParseJSON(localStorage.getItem('test-array'), []);
      
      expect(retrieved).toEqual(data);
    });
  });
});
