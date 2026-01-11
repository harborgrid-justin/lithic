/**
 * I18n Provider
 * Enterprise Healthcare Platform - Lithic
 *
 * Context provider for internationalization
 */

'use client';

import React, { createContext, useEffect, useState, useCallback, useMemo } from 'react';
import type {
  SupportedLocale,
  TranslationNamespace,
  I18nContextState,
  I18nContextActions,
  I18nProviderProps,
  TranslationFunction,
  NamespacedTranslationFunction,
  TranslationOptions,
} from '@/types/i18n';
import { i18nConfig, getTextDirection } from '@/lib/i18n/i18n-config';
import { getTranslationService } from '@/lib/i18n/translation-service';
import { getLanguageDetector } from '@/lib/i18n/language-detector';
import { getTranslationLoader } from '@/lib/i18n/translation-loader';
import { getRTLManager } from '@/lib/i18n/rtl-support';

// Context type
interface I18nContextValue {
  state: I18nContextState;
  actions: I18nContextActions;
}

// Create context
export const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * I18n Provider Component
 */
export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  initialLocale,
  fallbackLocale = i18nConfig.fallbackLocale,
  detectLanguage = true,
  loadingComponent,
}) => {
  // Initialize services
  const translationService = useMemo(() => getTranslationService(), []);
  const languageDetector = useMemo(() => getLanguageDetector(), []);
  const translationLoader = useMemo(() => getTranslationLoader(), []);
  const rtlManager = useMemo(() => getRTLManager(), []);

  // Detect initial locale
  const detectedLocale = useMemo(() => {
    if (initialLocale) return initialLocale;
    if (detectLanguage) {
      const detection = languageDetector.detect();
      return detection.locale;
    }
    return i18nConfig.defaultLocale;
  }, [initialLocale, detectLanguage, languageDetector]);

  // State
  const [state, setState] = useState<I18nContextState>({
    currentLocale: detectedLocale,
    availableLocales: i18nConfig.enabledLocales,
    direction: getTextDirection(detectedLocale),
    isLoading: true,
    loadedNamespaces: new Set(),
    fallbackLocale,
  });

  /**
   * Load namespace
   */
  const loadNamespace = useCallback(
    async (namespace: TranslationNamespace) => {
      if (state.loadedNamespaces.has(namespace)) {
        return; // Already loaded
      }

      try {
        const result = await translationLoader.load({
          locale: state.currentLocale,
          namespace,
        });

        if (result.success && result.translations) {
          translationService.loadTranslations(
            state.currentLocale,
            namespace,
            result.translations
          );

          setState((prev) => ({
            ...prev,
            loadedNamespaces: new Set([...prev.loadedNamespaces, namespace]),
          }));
        }
      } catch (error) {
        console.error(`Failed to load namespace ${namespace}:`, error);
      }
    },
    [state.currentLocale, state.loadedNamespaces, translationLoader, translationService]
  );

  /**
   * Change locale
   */
  const changeLocale = useCallback(
    async (locale: SupportedLocale) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        // Load common namespace for new locale
        const result = await translationLoader.load({
          locale,
          namespace: 'common',
        });

        if (result.success && result.translations) {
          translationService.setLocale(locale);
          translationService.loadTranslations(locale, 'common', result.translations);

          // Update RTL manager
          rtlManager.setLocale(locale);
          rtlManager.applyToDocument();

          // Save preference
          languageDetector.saveUserPreference(locale);
          languageDetector.setCookie(locale);

          setState({
            currentLocale: locale,
            availableLocales: i18nConfig.enabledLocales,
            direction: getTextDirection(locale),
            isLoading: false,
            loadedNamespaces: new Set(['common']),
            fallbackLocale,
          });
        }
      } catch (error) {
        console.error(`Failed to change locale to ${locale}:`, error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [translationService, translationLoader, languageDetector, rtlManager, fallbackLocale]
  );

  /**
   * Preload locale
   */
  const preloadLocale = useCallback(
    async (locale: SupportedLocale) => {
      try {
        await translationLoader.preload(locale, ['common']);
      } catch (error) {
        console.error(`Failed to preload locale ${locale}:`, error);
      }
    },
    [translationLoader]
  );

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    translationService.clearCache();
    translationLoader.clearCache();
  }, [translationService, translationLoader]);

  /**
   * Translation function
   */
  const t: TranslationFunction = useCallback(
    (key: string, options?: TranslationOptions) => {
      return translationService.translate(key, options, 'common');
    },
    [translationService]
  );

  /**
   * Namespaced translation function
   */
  const tn: NamespacedTranslationFunction = useCallback(
    (namespace: TranslationNamespace, key: string, options?: TranslationOptions) => {
      return translationService.translate(key, options, namespace);
    },
    [translationService]
  );

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load common namespace
        await loadNamespace('common');

        // Apply RTL settings
        rtlManager.setLocale(state.currentLocale);
        rtlManager.applyToDocument();

        setState((prev) => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Context value
  const contextValue = useMemo<I18nContextValue>(
    () => ({
      state,
      actions: {
        changeLocale,
        loadNamespace,
        preloadLocale,
        clearCache,
        t,
        tn,
      },
    }),
    [state, changeLocale, loadNamespace, preloadLocale, clearCache, t, tn]
  );

  // Show loading component while initializing
  if (state.isLoading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};

export default I18nProvider;
