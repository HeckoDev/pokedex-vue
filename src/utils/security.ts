/**
 * Utilitaires de sécurité pour l'application Pokédex
 */

/**
 * Hash un mot de passe avec SHA-256 et un salt
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Génère un salt aléatoire
 */
export function generateSalt(): string {
  return crypto.randomUUID();
}

/**
 * Sanitize une entrée utilisateur pour prévenir les attaques XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
