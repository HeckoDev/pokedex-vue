/**
 * Utilitaires de validation pour les formulaires
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valide un format d'email
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { valid: false, error: "L'email est requis" };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: "Format d'email invalide" };
  }
  return { valid: true };
}

/**
 * Valide la force d'un mot de passe
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.length === 0) {
    return { valid: false, error: "Le mot de passe est requis" };
  }
  if (password.length < 8) {
    return { valid: false, error: "Le mot de passe doit contenir au moins 8 caractères" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Le mot de passe doit contenir au moins une majuscule" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Le mot de passe doit contenir au moins une minuscule" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Le mot de passe doit contenir au moins un chiffre" };
  }
  return { valid: true };
}

/**
 * Valide un nom d'utilisateur
 */
export function validateUsername(username: string): ValidationResult {
  if (!username || username.trim() === '') {
    return { valid: false, error: "Le nom d'utilisateur est requis" };
  }
  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, error: "Nom d'utilisateur invalide (3-20 caractères alphanumériques, tirets et underscores autorisés)" };
  }
  return { valid: true };
}
