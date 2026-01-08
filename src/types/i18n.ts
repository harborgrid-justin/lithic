/**
 * Internationalization (i18n) Type Definitions
 * Enterprise Healthcare Platform - Lithic
 *
 * Comprehensive type system for multilingual support including:
 * - Translation management
 * - Locale configuration
 * - RTL support
 * - Clinical terminology
 * - ICU message format
 */

// Supported Locales
export type SupportedLocale = 'en' | 'es' | 'fr' | 'zh' | 'ar' | 'de' | 'ja' | 'ko' | 'pt' | 'ru';

// Language Direction
export type TextDirection = 'ltr' | 'rtl';

// Translation Namespace
export type TranslationNamespace =
  | 'common'
  | 'clinical'
  | 'patient'
  | 'provider'
  | 'admin'
  | 'billing'
  | 'scheduling'
  | 'medications'
  | 'lab'
  | 'imaging'
  | 'reporting'
  | 'compliance'
  | 'errors'
  | 'validation';

// ICU Message Format Types
export type ICUMessageValue = string | number | boolean | Date | null | undefined;

export interface ICUMessageValues {
  [key: string]: ICUMessageValue;
}

// Pluralization Rules
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

export interface PluralRule {
  (count: number): PluralCategory;
}

// Locale Configuration
export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  direction: TextDirection;
  dateFormat: string;
  timeFormat: string;
  dateTimeFormat: string;
  numberFormat: Intl.NumberFormatOptions;
  currencyFormat: Intl.NumberFormatOptions;
  percentFormat: Intl.NumberFormatOptions;
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  pluralRule: PluralRule;
  enabled: boolean;
}

// Translation Keys (Nested Object Type)
export type TranslationKeys = {
  [key: string]: string | TranslationKeys;
};

// Flattened Translation Keys
export type FlattenedTranslations = {
  [key: string]: string;
};

// Translation Resource
export interface TranslationResource {
  namespace: TranslationNamespace;
  locale: SupportedLocale;
  translations: TranslationKeys;
  metadata?: TranslationMetadata;
}

// Translation Metadata
export interface TranslationMetadata {
  version: string;
  lastUpdated: Date;
  translator?: string;
  reviewedBy?: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  coverage: number; // Percentage of translated keys
}

// Translation Options
export interface TranslationOptions {
  defaultValue?: string;
  count?: number;
  context?: string;
  values?: ICUMessageValues;
  fallback?: boolean;
  escapeHtml?: boolean;
}

// Translation Function Type
export type TranslationFunction = (
  key: string,
  options?: TranslationOptions
) => string;

// Namespace Translation Function
export type NamespacedTranslationFunction = (
  namespace: TranslationNamespace,
  key: string,
  options?: TranslationOptions
) => string;

// Date Formatting Options
export interface DateFormattingOptions {
  format?: 'short' | 'medium' | 'long' | 'full' | 'relative' | string;
  includeTime?: boolean;
  timezone?: string;
  relativeThreshold?: number; // Days
}

// Number Formatting Options
export interface NumberFormattingOptions {
  style?: 'decimal' | 'currency' | 'percent' | 'unit';
  currency?: string;
  unit?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
}

// Medical Unit Formatting
export interface MedicalUnitFormattingOptions extends NumberFormattingOptions {
  unitType?: 'weight' | 'volume' | 'dosage' | 'concentration' | 'temperature';
  unitSystem?: 'metric' | 'imperial';
}

// Clinical Term
export interface ClinicalTerm {
  code: string;
  system: 'ICD-10' | 'SNOMED' | 'LOINC' | 'RxNorm' | 'CPT' | 'HCPCS' | 'Custom';
  display: string;
  definition?: string;
  synonyms?: string[];
  locale: SupportedLocale;
  context?: string;
}

// Clinical Terminology Mapping
export interface ClinicalTerminologyMapping {
  standardCode: string;
  standardSystem: string;
  localizations: {
    [locale in SupportedLocale]?: {
      display: string;
      synonyms?: string[];
      notes?: string;
    };
  };
}

// Translation Memory Entry
export interface TranslationMemoryEntry {
  id: string;
  sourceLocale: SupportedLocale;
  targetLocale: SupportedLocale;
  sourceText: string;
  targetText: string;
  context?: string;
  namespace?: TranslationNamespace;
  quality: number; // 0-100
  usageCount: number;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Translation Suggestion
export interface TranslationSuggestion {
  text: string;
  source: 'memory' | 'machine' | 'dictionary' | 'context';
  confidence: number; // 0-1
  metadata?: Record<string, unknown>;
}

// Language Detection Result
export interface LanguageDetectionResult {
  locale: SupportedLocale;
  confidence: number; // 0-1
  source: 'browser' | 'cookie' | 'header' | 'path' | 'user-preference' | 'geolocation' | 'default';
  alternatives?: Array<{
    locale: SupportedLocale;
    confidence: number;
  }>;
}

// I18n Context State
export interface I18nContextState {
  currentLocale: SupportedLocale;
  availableLocales: SupportedLocale[];
  direction: TextDirection;
  isLoading: boolean;
  loadedNamespaces: Set<TranslationNamespace>;
  fallbackLocale: SupportedLocale;
}

// I18n Context Actions
export interface I18nContextActions {
  changeLocale: (locale: SupportedLocale) => Promise<void>;
  loadNamespace: (namespace: TranslationNamespace) => Promise<void>;
  preloadLocale: (locale: SupportedLocale) => Promise<void>;
  clearCache: () => void;
  t: TranslationFunction;
  tn: NamespacedTranslationFunction;
}

// I18n Provider Props
export interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: SupportedLocale;
  fallbackLocale?: SupportedLocale;
  detectLanguage?: boolean;
  loadingComponent?: React.ReactNode;
}

// Translation Loader Options
export interface TranslationLoaderOptions {
  locale: SupportedLocale;
  namespace: TranslationNamespace;
  cache?: boolean;
  timeout?: number;
}

// Translation Loader Result
export interface TranslationLoaderResult {
  success: boolean;
  translations?: TranslationKeys;
  error?: Error;
  cached?: boolean;
  loadTime?: number;
}

// RTL Configuration
export interface RTLConfiguration {
  enabled: boolean;
  locale: SupportedLocale;
  mirrorIcons?: boolean;
  adjustSpacing?: boolean;
  customStyles?: Record<string, string>;
}

// Locale Switcher Options
export interface LocaleSwitcherOptions {
  showFlags?: boolean;
  showNativeName?: boolean;
  showLabel?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'dropdown' | 'menu' | 'inline' | 'modal';
  filterLocales?: SupportedLocale[];
}

// Translation Extraction Configuration
export interface TranslationExtractionConfig {
  sourceDirectories: string[];
  outputDirectory: string;
  namespaces: TranslationNamespace[];
  locales: SupportedLocale[];
  keyStyle: 'nested' | 'flat' | 'auto';
  includeLineNumbers?: boolean;
  includeContext?: boolean;
}

// Translation Validation Result
export interface TranslationValidationResult {
  valid: boolean;
  errors: Array<{
    key: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    locale?: SupportedLocale;
    namespace?: TranslationNamespace;
  }>;
  warnings: Array<{
    key: string;
    message: string;
    suggestion?: string;
  }>;
  coverage: {
    [locale in SupportedLocale]?: number;
  };
}

// Translation Import/Export Format
export interface TranslationExportFormat {
  version: string;
  exportDate: Date;
  locales: SupportedLocale[];
  namespaces: TranslationNamespace[];
  translations: {
    [locale: string]: {
      [namespace: string]: TranslationKeys;
    };
  };
  metadata?: {
    totalKeys: number;
    translatedKeys: number;
    missingKeys: string[];
  };
}

// Medical Dosage Formatting
export interface MedicalDosageFormat {
  value: number;
  unit: string;
  route?: string;
  frequency?: string;
  locale: SupportedLocale;
}

// Healthcare-Specific Number Formats
export interface HealthcareNumberFormats {
  bloodPressure: (systolic: number, diastolic: number) => string;
  heartRate: (bpm: number) => string;
  temperature: (value: number, unit: 'C' | 'F') => string;
  weight: (value: number, unit: 'kg' | 'lb') => string;
  height: (value: number, unit: 'cm' | 'in') => string;
  glucose: (value: number, unit: 'mg/dL' | 'mmol/L') => string;
  labResult: (value: number, unit: string, normalRange?: [number, number]) => string;
}

// Error Types
export class TranslationError extends Error {
  constructor(
    message: string,
    public code: string,
    public locale?: SupportedLocale,
    public namespace?: TranslationNamespace,
    public key?: string
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}

export class LocaleNotSupportedError extends TranslationError {
  constructor(locale: string) {
    super(
      `Locale "${locale}" is not supported`,
      'LOCALE_NOT_SUPPORTED',
      locale as SupportedLocale
    );
    this.name = 'LocaleNotSupportedError';
  }
}

export class TranslationNotFoundError extends TranslationError {
  constructor(key: string, locale: SupportedLocale, namespace?: TranslationNamespace) {
    super(
      `Translation not found for key "${key}" in locale "${locale}"${namespace ? ` (namespace: ${namespace})` : ''}`,
      'TRANSLATION_NOT_FOUND',
      locale,
      namespace,
      key
    );
    this.name = 'TranslationNotFoundError';
  }
}

export class NamespaceNotLoadedError extends TranslationError {
  constructor(namespace: TranslationNamespace, locale: SupportedLocale) {
    super(
      `Namespace "${namespace}" not loaded for locale "${locale}"`,
      'NAMESPACE_NOT_LOADED',
      locale,
      namespace
    );
    this.name = 'NamespaceNotLoadedError';
  }
}

// Hook Return Types
export interface UseTranslationReturn {
  t: TranslationFunction;
  tn: NamespacedTranslationFunction;
  locale: SupportedLocale;
  direction: TextDirection;
  isLoading: boolean;
  ready: boolean;
}

export interface UseLocaleReturn {
  locale: SupportedLocale;
  locales: LocaleConfig[];
  direction: TextDirection;
  changeLocale: (locale: SupportedLocale) => Promise<void>;
  formatDate: (date: Date | string, options?: DateFormattingOptions) => string;
  formatNumber: (value: number, options?: NumberFormattingOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatPercent: (value: number) => string;
  formatMedicalUnit: (value: number, options: MedicalUnitFormattingOptions) => string;
}

// API Types
export interface TranslationsAPIRequest {
  locale?: SupportedLocale;
  namespace?: TranslationNamespace;
  keys?: string[];
}

export interface TranslationsAPIResponse {
  success: boolean;
  locale: SupportedLocale;
  namespace?: TranslationNamespace;
  translations: FlattenedTranslations;
  metadata?: {
    count: number;
    cached: boolean;
    timestamp: string;
  };
}

// Middleware Types
export interface I18nMiddlewareConfig {
  defaultLocale: SupportedLocale;
  locales: SupportedLocale[];
  localeDetection?: boolean;
  localeCookie?: string;
  localeHeader?: string;
  pathLocale?: boolean;
  excludePaths?: string[];
}

export interface I18nMiddlewareContext {
  locale: SupportedLocale;
  detectedLocale?: SupportedLocale;
  requestedLocale?: SupportedLocale;
  shouldRedirect: boolean;
  redirectUrl?: string;
}
