/**
 * Utilities for localStorage management
 */

/**
 * Safely parse a JSON string from localStorage
 */
export function safeParseJSON<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  
  try {
    const parsed = JSON.parse(json);
    return parsed as T;
  } catch (error) {
    console.error('JSON parsing error:', error);
    return fallback;
  }
}

/**
 * Safely save to localStorage
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (
      e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      console.error('localStorage full - storage quota exceeded');
      // Note: Error handling should be done at the composable level with user-facing notifications
    } else {
      console.error('localStorage error:', e);
    }
    return false;
  }
}
