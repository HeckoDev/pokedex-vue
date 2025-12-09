/**
 * Utilitaires pour la gestion du localStorage
 */

/**
 * Parse de manière sécurisée une chaîne JSON depuis localStorage
 */
export function safeParseJSON<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  
  try {
    const parsed = JSON.parse(json);
    return parsed as T;
  } catch (error) {
    console.error('Erreur de parsing JSON:', error);
    return fallback;
  }
}

/**
 * Sauvegarde de manière sécurisée dans localStorage
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
      console.error('localStorage plein');
      alert('Espace de stockage saturé. Veuillez libérer de l\'espace ou supprimer des données.');
    } else {
      console.error('Erreur localStorage:', e);
    }
    return false;
  }
}
