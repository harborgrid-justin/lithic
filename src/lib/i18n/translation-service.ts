/**
 * Translation Service
 * Enterprise Healthcare Platform - Lithic
 *
 * Core translation service with:
 * - ICU message format support
 * - Pluralization
 * - Variable interpolation
 * - Nested key resolution
 * - Fallback handling
 * - Translation memory
 */

import type {
  SupportedLocale,
  TranslationNamespace,
  TranslationOptions,
  TranslationKeys,
  FlattenedTranslations,
  ICUMessageValues,
  PluralCategory,
} from '@/types/i18n';
import {
  i18nConfig,
  getLocaleConfig,
  getFallbackChain,
} from './i18n-config';
import { TranslationNotFoundError, NamespaceNotLoadedError } from '@/types/i18n';

/**
 * Translation Service Class
 * Manages translation resources and provides translation functions
 */
export class TranslationService {
  private translations: Map<
    string,
    Map<TranslationNamespace, FlattenedTranslations>
  >;
  private loadedNamespaces: Map<string, Set<TranslationNamespace>>;
  private currentLocale: SupportedLocale;
  private cache: Map<string, string>;
  private cacheEnabled: boolean;

  constructor(initialLocale: SupportedLocale = i18nConfig.defaultLocale) {
    this.translations = new Map();
    this.loadedNamespaces = new Map();
    this.currentLocale = initialLocale;
    this.cache = new Map();
    this.cacheEnabled = i18nConfig.cacheTranslations;
  }

  /**
   * Set the current locale
   */
  setLocale(locale: SupportedLocale): void {
    this.currentLocale = locale;
    this.clearCache();
  }

  /**
   * Get the current locale
   */
  getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  /**
   * Load translations for a namespace
   */
  loadTranslations(
    locale: SupportedLocale,
    namespace: TranslationNamespace,
    translations: TranslationKeys
  ): void {
    // Flatten nested translations
    const flattened = this.flattenTranslations(translations);

    // Store translations
    if (!this.translations.has(locale)) {
      this.translations.set(locale, new Map());
    }
    this.translations.get(locale)!.set(namespace, flattened);

    // Mark namespace as loaded
    if (!this.loadedNamespaces.has(locale)) {
      this.loadedNamespaces.set(locale, new Set());
    }
    this.loadedNamespaces.get(locale)!.add(namespace);

    this.clearCache();
  }

  /**
   * Check if a namespace is loaded
   */
  isNamespaceLoaded(
    locale: SupportedLocale,
    namespace: TranslationNamespace
  ): boolean {
    return this.loadedNamespaces.get(locale)?.has(namespace) || false;
  }

  /**
   * Get loaded namespaces for a locale
   */
  getLoadedNamespaces(locale: SupportedLocale): TranslationNamespace[] {
    return Array.from(this.loadedNamespaces.get(locale) || []);
  }

  /**
   * Translate a key
   */
  translate(
    key: string,
    options: TranslationOptions = {},
    namespace: TranslationNamespace = 'common'
  ): string {
    const {
      defaultValue,
      count,
      context,
      values,
      fallback = true,
      escapeHtml = false,
    } = options;

    // Generate cache key
    const cacheKey = this.generateCacheKey(
      this.currentLocale,
      namespace,
      key,
      options
    );

    // Check cache
    if (this.cacheEnabled && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Build the full key with context if provided
    const fullKey = context ? `${key}_${context}` : key;

    // Try to get translation with fallback chain
    let translation = this.getTranslationWithFallback(
      this.currentLocale,
      namespace,
      fullKey,
      fallback
    );

    // If still not found, try without context
    if (!translation && context) {
      translation = this.getTranslationWithFallback(
        this.currentLocale,
        namespace,
        key,
        fallback
      );
    }

    // Use default value if provided
    if (!translation) {
      if (defaultValue) {
        translation = defaultValue;
      } else {
        // Return key as fallback
        translation = key;
      }
    }

    // Process ICU message format
    if (translation) {
      translation = this.processICUMessage(translation, {
        count,
        ...values,
      });
    }

    // Escape HTML if needed
    if (escapeHtml) {
      translation = this.escapeHtml(translation);
    }

    // Cache the result
    if (this.cacheEnabled) {
      this.cache.set(cacheKey, translation);
    }

    return translation;
  }

  /**
   * Get translation with fallback chain
   */
  private getTranslationWithFallback(
    locale: SupportedLocale,
    namespace: TranslationNamespace,
    key: string,
    useFallback: boolean
  ): string | null {
    // Try current locale
    const translation = this.getTranslation(locale, namespace, key);
    if (translation) {
      return translation;
    }

    // Try fallback chain if enabled
    if (useFallback) {
      const fallbackLocales = getFallbackChain(locale).slice(1); // Skip current locale
      for (const fallbackLocale of fallbackLocales) {
        const fallbackTranslation = this.getTranslation(
          fallbackLocale,
          namespace,
          key
        );
        if (fallbackTranslation) {
          return fallbackTranslation;
        }
      }
    }

    return null;
  }

  /**
   * Get translation from storage
   */
  private getTranslation(
    locale: SupportedLocale,
    namespace: TranslationNamespace,
    key: string
  ): string | null {
    const namespaceTranslations = this.translations.get(locale)?.get(namespace);
    return namespaceTranslations?.[key] || null;
  }

  /**
   * Process ICU message format
   * Supports: {variable}, {count, plural, ...}, {gender, select, ...}
   */
  private processICUMessage(
    message: string,
    values?: ICUMessageValues
  ): string {
    if (!values) {
      return message;
    }

    let result = message;

    // Simple variable interpolation: {variable}
    result = result.replace(/\{(\w+)\}/g, (match, key) => {
      const value = values[key];
      return value !== undefined && value !== null ? String(value) : match;
    });

    // Plural format: {count, plural, one {# item} other {# items}}
    result = result.replace(
      /\{(\w+),\s*plural,\s*(.+?)\}/g,
      (match, key, rules) => {
        const count = Number(values[key]);
        if (isNaN(count)) return match;

        const category = this.getPluralCategory(count);
        const ruleMatch = new RegExp(`${category}\\s*\\{([^}]+)\\}`).exec(rules);

        if (ruleMatch) {
          return ruleMatch[1].replace(/#/g, String(count));
        }

        // Try 'other' as fallback
        const otherMatch = /other\s*\{([^}]+)\}/.exec(rules);
        if (otherMatch) {
          return otherMatch[1].replace(/#/g, String(count));
        }

        return match;
      }
    );

    // Select format: {gender, select, male {He} female {She} other {They}}
    result = result.replace(
      /\{(\w+),\s*select,\s*(.+?)\}/g,
      (match, key, options) => {
        const value = String(values[key] || '');
        const optionMatch = new RegExp(`${value}\\s*\\{([^}]+)\\}`).exec(
          options
        );

        if (optionMatch) {
          return optionMatch[1];
        }

        // Try 'other' as fallback
        const otherMatch = /other\s*\{([^}]+)\}/.exec(options);
        if (otherMatch) {
          return otherMatch[1];
        }

        return match;
      }
    );

    return result;
  }

  /**
   * Get plural category for a count
   */
  private getPluralCategory(count: number): PluralCategory {
    const localeConfig = getLocaleConfig(this.currentLocale);
    return localeConfig.pluralRule(count);
  }

  /**
   * Flatten nested translation object
   */
  private flattenTranslations(
    obj: TranslationKeys,
    prefix = ''
  ): FlattenedTranslations {
    const result: FlattenedTranslations = {};

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'string') {
        result[fullKey] = value;
      } else if (typeof value === 'object' && value !== null) {
        Object.assign(result, this.flattenTranslations(value, fullKey));
      }
    }

    return result;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(
    locale: SupportedLocale,
    namespace: TranslationNamespace,
    key: string,
    options: TranslationOptions
  ): string {
    const parts = [locale, namespace, key];

    if (options.context) parts.push(`ctx:${options.context}`);
    if (options.count !== undefined) parts.push(`cnt:${options.count}`);
    if (options.values) {
      parts.push(`vals:${JSON.stringify(options.values)}`);
    }

    return parts.join('|');
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Escape HTML in string
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char] || char);
  }

  /**
   * Get all translations for a namespace
   */
  getNamespaceTranslations(
    locale: SupportedLocale,
    namespace: TranslationNamespace
  ): FlattenedTranslations | null {
    return this.translations.get(locale)?.get(namespace) || null;
  }

  /**
   * Check if translation exists
   */
  hasTranslation(
    key: string,
    namespace: TranslationNamespace = 'common',
    locale: SupportedLocale = this.currentLocale
  ): boolean {
    return this.getTranslation(locale, namespace, key) !== null;
  }

  /**
   * Get missing translations
   */
  getMissingTranslations(
    namespace: TranslationNamespace,
    referenceLocale: SupportedLocale = i18nConfig.defaultLocale
  ): Record<SupportedLocale, string[]> {
    const missing: Record<string, string[]> = {};
    const referenceTranslations = this.translations
      .get(referenceLocale)
      ?.get(namespace);

    if (!referenceTranslations) {
      return missing as Record<SupportedLocale, string[]>;
    }

    const referenceKeys = Object.keys(referenceTranslations);

    for (const locale of i18nConfig.supportedLocales) {
      if (locale === referenceLocale) continue;

      const localeTranslations = this.translations.get(locale)?.get(namespace);
      if (!localeTranslations) {
        missing[locale] = referenceKeys;
        continue;
      }

      const missingKeys = referenceKeys.filter(
        (key) => !localeTranslations[key]
      );
      if (missingKeys.length > 0) {
        missing[locale] = missingKeys;
      }
    }

    return missing as Record<SupportedLocale, string[]>;
  }

  /**
   * Get translation coverage percentage
   */
  getCoverage(
    namespace: TranslationNamespace,
    locale: SupportedLocale,
    referenceLocale: SupportedLocale = i18nConfig.defaultLocale
  ): number {
    const referenceTranslations = this.translations
      .get(referenceLocale)
      ?.get(namespace);
    const localeTranslations = this.translations.get(locale)?.get(namespace);

    if (!referenceTranslations) return 0;
    if (!localeTranslations) return 0;

    const referenceCount = Object.keys(referenceTranslations).length;
    const localeCount = Object.keys(localeTranslations).length;

    return referenceCount > 0 ? (localeCount / referenceCount) * 100 : 0;
  }

  /**
   * Bulk translate multiple keys
   */
  translateBulk(
    keys: string[],
    namespace: TranslationNamespace = 'common',
    options: TranslationOptions = {}
  ): Record<string, string> {
    const result: Record<string, string> = {};

    for (const key of keys) {
      result[key] = this.translate(key, options, namespace);
    }

    return result;
  }

  /**
   * Export translations for a locale
   */
  exportTranslations(locale: SupportedLocale): Record<string, unknown> {
    const localeTranslations = this.translations.get(locale);
    if (!localeTranslations) return {};

    const result: Record<string, unknown> = {};
    for (const [namespace, translations] of localeTranslations) {
      result[namespace] = translations;
    }

    return result;
  }

  /**
   * Import translations from an object
   */
  importTranslations(
    locale: SupportedLocale,
    data: Record<TranslationNamespace, TranslationKeys>
  ): void {
    for (const [namespace, translations] of Object.entries(data)) {
      this.loadTranslations(
        locale,
        namespace as TranslationNamespace,
        translations
      );
    }
  }
}

// Singleton instance
let translationServiceInstance: TranslationService | null = null;

/**
 * Get the translation service singleton
 */
export const getTranslationService = (
  locale?: SupportedLocale
): TranslationService => {
  if (!translationServiceInstance) {
    translationServiceInstance = new TranslationService(locale);
  } else if (locale && translationServiceInstance.getLocale() !== locale) {
    translationServiceInstance.setLocale(locale);
  }
  return translationServiceInstance;
};

/**
 * Reset the translation service (useful for testing)
 */
export const resetTranslationService = (): void => {
  translationServiceInstance = null;
};

export default TranslationService;
