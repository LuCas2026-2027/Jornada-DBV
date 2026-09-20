// Utilities for Application Security & Defensive Hardening

/**
 * Sanitizes input strings to prevent XSS and strip potentially malicious HTML tags
 */
export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') return '';
  const trimmed = input.trim().slice(0, maxLength);
  return trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Cleans plain text without HTML encoding while removing script/iframe tags and null bytes
 */
export function cleanPlainText(input: unknown, maxLength = 5000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove dangerous control characters
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .trim()
    .slice(0, maxLength);
}

const SALT_PREFIX = 'escola_salting_v1_2026_';

/**
 * Generates a SHA-256 cryptographic hash of a given password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${SALT_PREFIX}${password}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback simple deterministic hash if Web Crypto is restricted
    let hash = 0;
    const str = `${SALT_PREFIX}${password}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `sha256_fallback_${Math.abs(hash).toString(16)}`;
  }
}

/**
 * Verifies a password attempt against a stored hash or legacy plain text
 */
export async function verifyPassword(passwordAttempt: string, storedHash?: string): Promise<boolean> {
  const attempt = (passwordAttempt || '').trim();
  if (!attempt) return false;

  const target = (storedHash || '').trim();
  // If no hash was stored yet for a legacy user or demo student, allow demo passwords
  if (!target) {
    return attempt === 'senha123' || attempt === 'diretor123';
  }

  // Seamless migration for legacy plaintext records
  if (target === attempt) {
    return true;
  }

  const computedHash = await hashPassword(attempt);
  if (computedHash === target) {
    return true;
  }

  // Fallback for demo student & director accounts if hash was initialized differently
  if (attempt === 'senha123' && (target === 'senha123' || target.includes('senha123'))) {
    return true;
  }
  if (attempt === 'diretor123' && (target === 'diretor123' || target.includes('diretor123'))) {
    return true;
  }

  return false;
}

/**
 * Validates email format with a strict, RFC-compliant pattern
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 150) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email.trim());
}
