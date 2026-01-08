/**
 * Translation Loader
 * Enterprise Healthcare Platform - Lithic
 *
 * Handles dynamic loading of translation files with:
 * - Lazy loading
 * - Caching
 * - Error handling
 * - Retry logic
 */

import type {
  SupportedLocale,
  TranslationNamespace,
  TranslationKeys,
  TranslationLoaderOptions,
  TranslationLoaderResult,
} from '@/types/i18n';
import { i18nConfig } from './i18n-config';

/**
 * Translation Loader Class
 */
export class TranslationLoader {
  private cache: Map<string, { data: TranslationKeys; timestamp: number }>;
  private loading: Map<string, Promise<TranslationKeys>>;
  private cacheTTL: number;

  constructor() {
    this.cache = new Map();
    this.loading = new Map();
    this.cacheTTL = i18nConfig.translationCacheTTL;
  }

  /**
   * Load translations for a namespace
   */
  async load(options: TranslationLoaderOptions): Promise<TranslationLoaderResult> {
    const { locale, namespace, cache = true, timeout = i18nConfig.loadTimeout } = options;
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(locale, namespace);

    try {
      // Check cache first
      if (cache && this.isCacheValid(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        return {
          success: true,
          translations: cached.data,
          cached: true,
          loadTime: 0,
        };
      }

      // Check if already loading
      if (this.loading.has(cacheKey)) {
        const translations = await this.loading.get(cacheKey)!;
        return {
          success: true,
          translations,
          cached: false,
          loadTime: Date.now() - startTime,
        };
      }

      // Start loading
      const loadPromise = this.loadTranslationFile(locale, namespace, timeout);
      this.loading.set(cacheKey, loadPromise);

      const translations = await loadPromise;

      // Cache the result
      if (cache) {
        this.cache.set(cacheKey, {
          data: translations,
          timestamp: Date.now(),
        });
      }

      // Remove from loading map
      this.loading.delete(cacheKey);

      return {
        success: true,
        translations,
        cached: false,
        loadTime: Date.now() - startTime,
      };
    } catch (error) {
      this.loading.delete(cacheKey);

      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
        cached: false,
        loadTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Load translation file from disk/API
   */
  private async loadTranslationFile(
    locale: SupportedLocale,
    namespace: TranslationNamespace,
    timeout: number
  ): Promise<TranslationKeys> {
    // Try loading from static files first
    try {
      const translations = await this.loadFromStatic(locale, namespace, timeout);
      return translations;
    } catch (staticError) {
      console.warn(`Failed to load static translations for ${locale}/${namespace}:`, staticError);

      // Fallback to API
      try {
        const translations = await this.loadFromAPI(locale, namespace, timeout);
        return translations;
      } catch (apiError) {
        console.error(`Failed to load translations from API for ${locale}/${namespace}:`, apiError);
        throw apiError;
      }
    }
  }

  /**
   * Load from static JSON files
   */
  private async loadFromStatic(
    locale: SupportedLocale,
    namespace: TranslationNamespace,
    timeout: number
  ): Promise<TranslationKeys> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Dynamic import of JSON file
      const module = await import(
        `@/locales/${locale}/${namespace}.json`
      ).catch((error) => {
        throw new Error(`Translation file not found: ${locale}/${namespace}.json`);
      });

      clearTimeout(timeoutId);
      return module.default || module;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Load from API endpoint
   */
  private async loadFromAPI(
    locale: SupportedLocale,
    namespace: TranslationNamespace,
    timeout: number
  ): Promise<TranslationKeys> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(
        `/api/i18n/translations?locale=${locale}&namespace=${namespace}`,
        {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.translations) {
        throw new Error('Invalid API response format');
      }

      return data.translations;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Preload translations for faster access
   */
  async preload(
    locale: SupportedLocale,
    namespaces: TranslationNamespace[]
  ): Promise<void> {
    const loadPromises = namespaces.map((namespace) =>
      this.load({ locale, namespace, cache: true })
    );

    await Promise.allSettled(loadPromises);
  }

  /**
   * Preload multiple locales
   */
  async preloadLocales(
    locales: SupportedLocale[],
    namespaces: TranslationNamespace[]
  ): Promise<void> {
    const loadPromises = locales.flatMap((locale) =>
      namespaces.map((namespace) => this.load({ locale, namespace, cache: true }))
    );

    await Promise.allSettled(loadPromises);
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;

    const age = Date.now() - cached.timestamp;
    return age < this.cacheTTL;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(locale: SupportedLocale, namespace: TranslationNamespace): string {
    return `${locale}:${namespace}`;
  }

  /**
   * Clear cache for a specific locale/namespace
   */
  clearCache(locale?: SupportedLocale, namespace?: TranslationNamespace): void {
    if (locale && namespace) {
      const key = this.getCacheKey(locale, namespace);
      this.cache.delete(key);
    } else if (locale) {
      // Clear all namespaces for a locale
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${locale}:`)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: Array<{ key: string; age: number; size: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      size: JSON.stringify(value.data).length,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }

  /**
   * Manually add to cache
   */
  addToCache(
    locale: SupportedLocale,
    namespace: TranslationNamespace,
    translations: TranslationKeys
  ): void {
    const key = this.getCacheKey(locale, namespace);
    this.cache.set(key, {
      data: translations,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if namespace is cached
   */
  isCached(locale: SupportedLocale, namespace: TranslationNamespace): boolean {
    const key = this.getCacheKey(locale, namespace);
    return this.isCacheValid(key);
  }

  /**
   * Get from cache
   */
  getFromCache(
    locale: SupportedLocale,
    namespace: TranslationNamespace
  ): TranslationKeys | null {
    const key = this.getCacheKey(locale, namespace);
    if (!this.isCacheValid(key)) return null;

    return this.cache.get(key)!.data;
  }

  /**
   * Load with retry logic
   */
  async loadWithRetry(
    options: TranslationLoaderOptions,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<TranslationLoaderResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.load(options);
        if (result.success) {
          return result;
        }
        lastError = result.error || null;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
      }

      if (attempt < maxRetries - 1) {
        await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
      }
    }

    return {
      success: false,
      error: lastError || new Error('Failed after retries'),
      cached: false,
    };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate translations structure
   */
  validateTranslations(translations: unknown): translations is TranslationKeys {
    if (typeof translations !== 'object' || translations === null) {
      return false;
    }

    // Check if all values are strings or nested objects
    const validate = (obj: Record<string, unknown>): boolean => {
      for (const value of Object.values(obj)) {
        if (typeof value === 'string') {
          continue;
        } else if (typeof value === 'object' && value !== null) {
          if (!validate(value as Record<string, unknown>)) {
            return false;
          }
        } else {
          return false;
        }
      }
      return true;
    };

    return validate(translations as Record<string, unknown>);
  }

  /**
   * Merge translations
   */
  mergeTranslations(...sources: TranslationKeys[]): TranslationKeys {
    const result: TranslationKeys = {};

    for (const source of sources) {
      this.deepMerge(result, source);
    }

    return result;
  }

  /**
   * Deep merge helper
   */
  private deepMerge(target: TranslationKeys, source: TranslationKeys): void {
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (typeof target[key] !== 'object' || target[key] === null) {
          target[key] = {};
        }
        this.deepMerge(target[key] as TranslationKeys, value);
      } else {
        target[key] = value;
      }
    }
  }
}

// Singleton instance
let translationLoaderInstance: TranslationLoader | null = null;

/**
 * Get translation loader singleton
 */
export const getTranslationLoader = (): TranslationLoader => {
  if (!translationLoaderInstance) {
    translationLoaderInstance = new TranslationLoader();
  }
  return translationLoaderInstance;
};

/**
 * Helper to load namespace
 */
export const loadNamespace = async (
  locale: SupportedLocale,
  namespace: TranslationNamespace
): Promise<TranslationKeys> => {
  const loader = getTranslationLoader();
  const result = await loader.load({ locale, namespace });

  if (!result.success) {
    throw result.error || new Error('Failed to load translations');
  }

  return result.translations!;
};

/**
 * Helper to preload namespaces
 */
export const preloadNamespaces = async (
  locale: SupportedLocale,
  namespaces: TranslationNamespace[]
): Promise<void> => {
  const loader = getTranslationLoader();
  await loader.preload(locale, namespaces);
};

export default TranslationLoader;
