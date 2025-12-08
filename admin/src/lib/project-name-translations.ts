// Gemini-translated project names (Arabic to English)
// These are high-quality translations of RERA project names
// Loaded dynamically from /translations.json (3000+ entries)

import { containsArabic, transliterateArabicToEnglish } from './arabic-transliteration';

// Cache for loaded translations
let translationsCache: Record<string, string> | null = null;
let loadingPromise: Promise<Record<string, string>> | null = null;

/**
 * Load translations from public JSON file
 * Returns cached translations if already loaded
 */
export async function loadTranslations(): Promise<Record<string, string>> {
  if (translationsCache) {
    return translationsCache;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = fetch('/translations.json')
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load translations: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      translationsCache = data;
      return data;
    })
    .catch((err) => {
      console.error('Error loading translations:', err);
      translationsCache = {};
      return {};
    });

  return loadingPromise;
}

/**
 * Translate an Arabic project name to English using Gemini translations
 * Returns null if no translation found (does NOT fall back to transliteration)
 * Note: This is synchronous and requires translations to be pre-loaded
 */
export function translateProjectName(
  arabicName: string,
  translations: Record<string, string>
): string | null {
  if (!arabicName) {
    return arabicName;
  }

  // If not Arabic, return as-is
  if (!containsArabic(arabicName)) {
    return arabicName;
  }

  // Try exact match first
  if (translations[arabicName]) {
    return translations[arabicName];
  }

  // Try trimmed match
  const trimmed = arabicName.trim();
  if (translations[trimmed]) {
    return translations[trimmed];
  }

  // Try normalized whitespace match
  const normalized = arabicName.replace(/\s+/g, ' ').trim();
  if (translations[normalized]) {
    return translations[normalized];
  }

  // No translation found - return null to indicate missing translation
  return null;
}

/**
 * Check if we have a proper Gemini translation for this name
 */
export function hasGeminiTranslation(
  arabicName: string,
  translations: Record<string, string>
): boolean {
  if (!arabicName || !translations) return false;
  const trimmed = arabicName.trim();
  const normalized = arabicName.replace(/\s+/g, ' ').trim();
  return !!(translations[arabicName] || translations[trimmed] || translations[normalized]);
}

/**
 * Get translation statistics
 */
export function getTranslationStats(translations: Record<string, string>): { total: number } {
  return {
    total: Object.keys(translations).length,
  };
}

/**
 * Find Arabic values that don't have Gemini translations
 * Returns an array of unique untranslated Arabic strings
 */
export function findUntranslatedArabic(
  values: string[],
  translations: Record<string, string>
): string[] {
  const untranslated = new Set<string>();

  for (const value of values) {
    if (value && containsArabic(value)) {
      const translated = translateProjectName(value, translations);
      if (translated === null) {
        untranslated.add(value);
      }
    }
  }

  return Array.from(untranslated);
}
