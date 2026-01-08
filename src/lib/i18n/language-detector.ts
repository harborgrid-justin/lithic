/**
 * Language Detector
 * Enterprise Healthcare Platform - Lithic
 *
 * Detects user's preferred language from multiple sources:
 * - User preferences (database)
 * - Cookie
 * - Browser settings
 * - Accept-Language header
 * - URL path
 * - Geolocation (optional)
 */

import type {
  SupportedLocale,
  LanguageDetectionResult,
} from '@/types/i18n';
import { i18nConfig, isLocaleSupported } from './i18n-config';

/**
 * Language Detector Class
 */
export class LanguageDetector {
  private cookieName: string;
  private storageKey: string;

  constructor() {
    this.cookieName = i18nConfig.localeCookie;
    this.storageKey = i18nConfig.localeStorageKey;
  }

  /**
   * Detect language from all available sources
   */
  detect(): LanguageDetectionResult {
    // Priority order:
    // 1. User preference (from localStorage/database)
    // 2. Cookie
    // 3. Browser language
    // 4. Default locale

    const userPreference = this.detectFromUserPreference();
    if (userPreference) {
      return userPreference;
    }

    const cookieLocale = this.detectFromCookie();
    if (cookieLocale) {
      return cookieLocale;
    }

    const browserLocale = this.detectFromBrowser();
    if (browserLocale) {
      return browserLocale;
    }

    return {
      locale: i18nConfig.defaultLocale,
      confidence: 1.0,
      source: 'default',
    };
  }

  /**
   * Detect from user preference (localStorage)
   */
  private detectFromUserPreference(): LanguageDetectionResult | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored && isLocaleSupported(stored)) {
        return {
          locale: stored as SupportedLocale,
          confidence: 1.0,
          source: 'user-preference',
        };
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }

    return null;
  }

  /**
   * Detect from cookie
   */
  private detectFromCookie(): LanguageDetectionResult | null {
    if (typeof document === 'undefined') return null;

    try {
      const cookies = document.cookie.split(';');
      const localeCookie = cookies.find((cookie) =>
        cookie.trim().startsWith(`${this.cookieName}=`)
      );

      if (localeCookie) {
        const locale = localeCookie.split('=')[1]?.trim();
        if (locale && isLocaleSupported(locale)) {
          return {
            locale: locale as SupportedLocale,
            confidence: 0.9,
            source: 'cookie',
          };
        }
      }
    } catch (error) {
      console.warn('Failed to read cookie:', error);
    }

    return null;
  }

  /**
   * Detect from browser navigator
   */
  private detectFromBrowser(): LanguageDetectionResult | null {
    if (typeof navigator === 'undefined') return null;

    try {
      const browserLanguages = navigator.languages || [navigator.language];
      const alternatives: Array<{
        locale: SupportedLocale;
        confidence: number;
      }> = [];

      for (let i = 0; i < browserLanguages.length; i++) {
        const lang = browserLanguages[i];
        if (!lang) continue;

        const locale = this.normalizeLocale(lang);
        if (locale && isLocaleSupported(locale)) {
          const confidence = Math.max(0.8 - i * 0.1, 0.3);

          if (i === 0) {
            return {
              locale: locale as SupportedLocale,
              confidence,
              source: 'browser',
              alternatives: alternatives.length > 0 ? alternatives : undefined,
            };
          } else {
            alternatives.push({
              locale: locale as SupportedLocale,
              confidence,
            });
          }
        }
      }

      if (alternatives.length > 0) {
        const best = alternatives[0];
        return {
          locale: best!.locale,
          confidence: best!.confidence,
          source: 'browser',
          alternatives: alternatives.slice(1),
        };
      }
    } catch (error) {
      console.warn('Failed to detect browser language:', error);
    }

    return null;
  }

  /**
   * Detect from Accept-Language header (server-side)
   */
  detectFromHeader(acceptLanguageHeader: string): LanguageDetectionResult | null {
    if (!acceptLanguageHeader) return null;

    try {
      // Parse Accept-Language header
      // Format: "en-US,en;q=0.9,es;q=0.8"
      const languages = acceptLanguageHeader
        .split(',')
        .map((lang) => {
          const [locale, qValue] = lang.trim().split(';');
          const quality = qValue ? parseFloat(qValue.split('=')[1] || '1') : 1;
          return { locale: locale || '', quality };
        })
        .sort((a, b) => b.quality - a.quality);

      const alternatives: Array<{
        locale: SupportedLocale;
        confidence: number;
      }> = [];

      for (const { locale, quality } of languages) {
        const normalized = this.normalizeLocale(locale);
        if (normalized && isLocaleSupported(normalized)) {
          const confidence = quality;

          if (alternatives.length === 0) {
            return {
              locale: normalized as SupportedLocale,
              confidence,
              source: 'header',
              alternatives: alternatives.length > 0 ? alternatives : undefined,
            };
          } else {
            alternatives.push({
              locale: normalized as SupportedLocale,
              confidence,
            });
          }
        }
      }

      if (alternatives.length > 0) {
        const best = alternatives[0];
        return {
          locale: best!.locale,
          confidence: best!.confidence,
          source: 'header',
          alternatives: alternatives.slice(1),
        };
      }
    } catch (error) {
      console.warn('Failed to parse Accept-Language header:', error);
    }

    return null;
  }

  /**
   * Detect from URL path
   * Example: /en/dashboard -> 'en'
   */
  detectFromPath(pathname: string): LanguageDetectionResult | null {
    if (!pathname) return null;

    try {
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        const potentialLocale = segments[0];
        if (potentialLocale && isLocaleSupported(potentialLocale)) {
          return {
            locale: potentialLocale as SupportedLocale,
            confidence: 1.0,
            source: 'path',
          };
        }
      }
    } catch (error) {
      console.warn('Failed to detect locale from path:', error);
    }

    return null;
  }

  /**
   * Normalize locale string
   * Examples: 'en-US' -> 'en', 'zh-CN' -> 'zh'
   */
  private normalizeLocale(locale: string): string | null {
    if (!locale) return null;

    // Convert to lowercase and take the first part
    const normalized = locale.toLowerCase().split('-')[0];

    return normalized || null;
  }

  /**
   * Save user preference
   */
  saveUserPreference(locale: SupportedLocale): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.storageKey, locale);
    } catch (error) {
      console.warn('Failed to save user preference:', error);
    }
  }

  /**
   * Set locale cookie
   */
  setCookie(
    locale: SupportedLocale,
    maxAge: number = 31536000 // 1 year in seconds
  ): void {
    if (typeof document === 'undefined') return;

    try {
      document.cookie = `${this.cookieName}=${locale}; max-age=${maxAge}; path=/; SameSite=Lax`;
    } catch (error) {
      console.warn('Failed to set cookie:', error);
    }
  }

  /**
   * Clear user preference
   */
  clearUserPreference(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear user preference:', error);
    }
  }

  /**
   * Clear cookie
   */
  clearCookie(): void {
    if (typeof document === 'undefined') return;

    try {
      document.cookie = `${this.cookieName}=; max-age=0; path=/`;
    } catch (error) {
      console.warn('Failed to clear cookie:', error);
    }
  }

  /**
   * Detect with custom priority
   */
  detectWithPriority(
    sources: Array<
      'user-preference' | 'cookie' | 'browser' | 'header' | 'path'
    >,
    headerValue?: string,
    pathname?: string
  ): LanguageDetectionResult {
    for (const source of sources) {
      let result: LanguageDetectionResult | null = null;

      switch (source) {
        case 'user-preference':
          result = this.detectFromUserPreference();
          break;
        case 'cookie':
          result = this.detectFromCookie();
          break;
        case 'browser':
          result = this.detectFromBrowser();
          break;
        case 'header':
          if (headerValue) {
            result = this.detectFromHeader(headerValue);
          }
          break;
        case 'path':
          if (pathname) {
            result = this.detectFromPath(pathname);
          }
          break;
      }

      if (result) {
        return result;
      }
    }

    return {
      locale: i18nConfig.defaultLocale,
      confidence: 1.0,
      source: 'default',
    };
  }
}

// Singleton instance
let languageDetectorInstance: LanguageDetector | null = null;

/**
 * Get the language detector singleton
 */
export const getLanguageDetector = (): LanguageDetector => {
  if (!languageDetectorInstance) {
    languageDetectorInstance = new LanguageDetector();
  }
  return languageDetectorInstance;
};

export default LanguageDetector;
