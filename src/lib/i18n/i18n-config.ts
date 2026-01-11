/**
 * i18n Configuration
 * Enterprise Healthcare Platform - Lithic
 *
 * Central configuration for internationalization including:
 * - Supported locales and their settings
 * - Default formatting options
 * - Namespace definitions
 * - Fallback chains
 */

import type {
  LocaleConfig,
  SupportedLocale,
  TranslationNamespace,
  PluralCategory,
} from '@/types/i18n';

// Plural Rules for Different Languages
const pluralRules = {
  en: (count: number): PluralCategory => {
    if (count === 0) return 'zero';
    if (count === 1) return 'one';
    return 'other';
  },
  es: (count: number): PluralCategory => {
    if (count === 0) return 'zero';
    if (count === 1) return 'one';
    return 'other';
  },
  fr: (count: number): PluralCategory => {
    if (count === 0) return 'zero';
    if (count <= 1) return 'one';
    return 'other';
  },
  zh: (count: number): PluralCategory => {
    // Chinese has no plural distinction
    return 'other';
  },
  ar: (count: number): PluralCategory => {
    // Arabic has complex plural rules
    if (count === 0) return 'zero';
    if (count === 1) return 'one';
    if (count === 2) return 'two';
    if (count % 100 >= 3 && count % 100 <= 10) return 'few';
    if (count % 100 >= 11 && count % 100 <= 99) return 'many';
    return 'other';
  },
  de: (count: number): PluralCategory => {
    if (count === 1) return 'one';
    return 'other';
  },
  ja: (count: number): PluralCategory => {
    // Japanese has no plural distinction
    return 'other';
  },
  ko: (count: number): PluralCategory => {
    // Korean has no plural distinction
    return 'other';
  },
  pt: (count: number): PluralCategory => {
    if (count === 0) return 'zero';
    if (count === 1) return 'one';
    return 'other';
  },
  ru: (count: number): PluralCategory => {
    // Russian plural rules
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (mod10 === 1 && mod100 !== 11) return 'one';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'few';
    return 'many';
  },
};

// Locale Configurations
export const localeConfigs: Record<SupportedLocale, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'hh:mm a',
    dateTimeFormat: 'MM/dd/yyyy hh:mm a',
    numberFormat: {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    currencyFormat: {
      style: 'currency',
      currency: 'USD',
    },
    percentFormat: {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    firstDayOfWeek: 0, // Sunday
    pluralRule: pluralRules.en,
    enabled: true,
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'dd/MM/yyyy HH:mm',
    numberFormat: {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    currencyFormat: {
      style: 'currency',
      currency: 'USD',
    },
    percentFormat: {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    firstDayOfWeek: 1, // Monday
    pluralRule: pluralRules.es,
    enabled: true,
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'dd/MM/yyyy HH:mm',
    numberFormat: {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    currencyFormat: {
      style: 'currency',
      currency: 'EUR',
    },
    percentFormat: {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    firstDayOfWeek: 1, // Monday
    pluralRule: pluralRules.fr,
    enabled: true,
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    direction: 'ltr',
    dateFormat: 'yyyy年MM月dd日',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'yyyy年MM月dd日 HH:mm',
    numberFormat: {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    currencyFormat: {
      style: 'currency',
      currency: 'CNY',
    },
    percentFormat: {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    firstDayOfWeek: 1, // Monday
    pluralRule: pluralRules.zh,
    enabled: true,
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'dd/MM/yyyy HH:mm',
    numberFormat: {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    currencyFormat: {
      style: 'currency',
      currency: 'SAR',
    },
    percentFormat: {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    firstDayOfWeek: 6, // Saturday
    pluralRule: pluralRules.ar,
    enabled: true,
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    dateFormat: 'dd.MM.yyyy',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'dd.MM.yyyy HH:mm',
    numberFormat: {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    currencyFormat: {
      style: 'currency',
      currency: 'EUR',
    },
    percentFormat: {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    firstDayOfWeek: 1, // Monday
    pluralRule: pluralRules.de,
    enabled: true,
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    direction: 'ltr',
    dateFormat: 'yyyy年MM月dd日',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'yyyy年MM月dd日 HH:mm',
    numberFormat: {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    currencyFormat: {
      style: 'currency',
      currency: 'JPY',
    },
    percentFormat: {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    firstDayOfWeek: 0, // Sunday
    pluralRule: pluralRules.ja,
    enabled: true,
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    direction: 'ltr',
    dateFormat: 'yyyy년 MM월 dd일',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'yyyy년 MM월 dd일 HH:mm',
    numberFormat: {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    currencyFormat: {
      style: 'currency',
      currency: 'KRW',
    },
    percentFormat: {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    firstDayOfWeek: 0, // Sunday
    pluralRule: pluralRules.ko,
    enabled: true,
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'dd/MM/yyyy HH:mm',
    numberFormat: {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    currencyFormat: {
      style: 'currency',
      currency: 'BRL',
    },
    percentFormat: {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    firstDayOfWeek: 0, // Sunday
    pluralRule: pluralRules.pt,
    enabled: true,
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    direction: 'ltr',
    dateFormat: 'dd.MM.yyyy',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'dd.MM.yyyy HH:mm',
    numberFormat: {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    currencyFormat: {
      style: 'currency',
      currency: 'RUB',
    },
    percentFormat: {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    firstDayOfWeek: 1, // Monday
    pluralRule: pluralRules.ru,
    enabled: true,
  },
};

// Default Configuration
export const i18nConfig = {
  defaultLocale: 'en' as SupportedLocale,
  fallbackLocale: 'en' as SupportedLocale,
  supportedLocales: Object.keys(localeConfigs) as SupportedLocale[],
  enabledLocales: Object.entries(localeConfigs)
    .filter(([, config]) => config.enabled)
    .map(([code]) => code as SupportedLocale),
  localeCookie: 'lithic-locale',
  localeHeader: 'accept-language',
  localeStorageKey: 'lithic-i18n-locale',
  enableLocaleDetection: true,
  enablePathLocale: false, // Set to true to use /en/dashboard style routing
  cacheTranslations: true,
  translationCacheTTL: 3600000, // 1 hour in milliseconds
  loadTimeout: 5000, // 5 seconds
};

// Translation Namespaces
export const namespaces: TranslationNamespace[] = [
  'common',
  'clinical',
  'patient',
  'provider',
  'admin',
  'billing',
  'scheduling',
  'medications',
  'lab',
  'imaging',
  'reporting',
  'compliance',
  'errors',
  'validation',
];

// Fallback Chain Configuration
export const fallbackChain: Record<SupportedLocale, SupportedLocale[]> = {
  en: ['en'],
  es: ['es', 'en'],
  fr: ['fr', 'en'],
  zh: ['zh', 'en'],
  ar: ['ar', 'en'],
  de: ['de', 'en'],
  ja: ['ja', 'en'],
  ko: ['ko', 'en'],
  pt: ['pt', 'es', 'en'],
  ru: ['ru', 'en'],
};

// RTL Locales
export const rtlLocales: SupportedLocale[] = ['ar'];

// Helper Functions
export const isRTL = (locale: SupportedLocale): boolean => {
  return rtlLocales.includes(locale);
};

export const getLocaleConfig = (locale: SupportedLocale): LocaleConfig => {
  return localeConfigs[locale] || localeConfigs[i18nConfig.defaultLocale];
};

export const getSupportedLocales = (): LocaleConfig[] => {
  return i18nConfig.enabledLocales.map((locale) => localeConfigs[locale]);
};

export const isLocaleSupported = (locale: string): locale is SupportedLocale => {
  return i18nConfig.supportedLocales.includes(locale as SupportedLocale);
};

export const getFallbackChain = (locale: SupportedLocale): SupportedLocale[] => {
  return fallbackChain[locale] || [i18nConfig.fallbackLocale];
};

export const getTextDirection = (locale: SupportedLocale): 'ltr' | 'rtl' => {
  return localeConfigs[locale]?.direction || 'ltr';
};

// Export all configurations
export default {
  i18nConfig,
  localeConfigs,
  namespaces,
  fallbackChain,
  rtlLocales,
  isRTL,
  getLocaleConfig,
  getSupportedLocales,
  isLocaleSupported,
  getFallbackChain,
  getTextDirection,
};
