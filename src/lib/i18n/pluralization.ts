/**
 * Pluralization Rules
 * Enterprise Healthcare Platform - Lithic
 *
 * Language-specific pluralization rules following CLDR standards
 */

import type { SupportedLocale, PluralCategory } from '@/types/i18n';

/**
 * Pluralization Rule Function Type
 */
type PluralizationRule = (count: number) => PluralCategory;

/**
 * English Pluralization
 * Rules: one (1), other (0, 2-999...)
 */
const englishPlural: PluralizationRule = (count: number): PluralCategory => {
  if (count === 0) return 'zero';
  if (count === 1) return 'one';
  return 'other';
};

/**
 * Spanish Pluralization
 * Rules: one (1), other (0, 2-999...)
 */
const spanishPlural: PluralizationRule = (count: number): PluralCategory => {
  if (count === 0) return 'zero';
  if (count === 1) return 'one';
  return 'other';
};

/**
 * French Pluralization
 * Rules: one (0, 1), other (2-999...)
 */
const frenchPlural: PluralizationRule = (count: number): PluralCategory => {
  if (count === 0) return 'zero';
  if (count <= 1) return 'one';
  return 'other';
};

/**
 * Arabic Pluralization
 * Rules: zero (0), one (1), two (2), few (3-10), many (11-99), other (100+)
 */
const arabicPlural: PluralizationRule = (count: number): PluralCategory => {
  if (count === 0) return 'zero';
  if (count === 1) return 'one';
  if (count === 2) return 'two';

  const mod100 = count % 100;
  if (mod100 >= 3 && mod100 <= 10) return 'few';
  if (mod100 >= 11 && mod100 <= 99) return 'many';

  return 'other';
};

/**
 * Chinese Pluralization
 * No plural distinction in Chinese
 */
const chinesePlural: PluralizationRule = (): PluralCategory => {
  return 'other';
};

/**
 * German Pluralization
 * Rules: one (1), other (0, 2-999...)
 */
const germanPlural: PluralizationRule = (count: number): PluralCategory => {
  if (count === 1) return 'one';
  return 'other';
};

/**
 * Japanese Pluralization
 * No plural distinction in Japanese
 */
const japanesePlural: PluralizationRule = (): PluralCategory => {
  return 'other';
};

/**
 * Korean Pluralization
 * No plural distinction in Korean
 */
const koreanPlural: PluralizationRule = (): PluralCategory => {
  return 'other';
};

/**
 * Portuguese Pluralization
 * Rules: one (1), other (0, 2-999...)
 */
const portuguesePlural: PluralizationRule = (count: number): PluralCategory => {
  if (count === 0) return 'zero';
  if (count === 1) return 'one';
  return 'other';
};

/**
 * Russian Pluralization
 * Complex rules based on last digit and last two digits
 */
const russianPlural: PluralizationRule = (count: number): PluralCategory => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (count === 0) return 'zero';
  if (mod10 === 1 && mod100 !== 11) return 'one';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'few';
  return 'many';
};

/**
 * Pluralization Rules Map
 */
export const pluralizationRules: Record<SupportedLocale, PluralizationRule> = {
  en: englishPlural,
  es: spanishPlural,
  fr: frenchPlural,
  ar: arabicPlural,
  zh: chinesePlural,
  de: germanPlural,
  ja: japanesePlural,
  ko: koreanPlural,
  pt: portuguesePlural,
  ru: russianPlural,
};

/**
 * Get plural category for a count in a specific locale
 */
export const getPluralCategory = (
  count: number,
  locale: SupportedLocale
): PluralCategory => {
  const rule = pluralizationRules[locale] || englishPlural;
  return rule(count);
};

/**
 * Pluralize a word based on count
 * This is a helper for simple cases where you have singular/plural forms
 */
export const pluralize = (
  count: number,
  singular: string,
  plural: string,
  locale: SupportedLocale = 'en'
): string => {
  const category = getPluralCategory(count, locale);
  return category === 'one' ? singular : plural;
};

/**
 * Pluralize with full ICU format support
 */
export const pluralizeICU = (
  count: number,
  forms: Partial<Record<PluralCategory, string>>,
  locale: SupportedLocale = 'en'
): string => {
  const category = getPluralCategory(count, locale);

  // Try exact match first
  if (forms[category]) {
    return forms[category]!.replace(/#/g, String(count));
  }

  // Fall back to 'other'
  if (forms.other) {
    return forms.other.replace(/#/g, String(count));
  }

  // Fall back to first available form
  const firstForm = Object.values(forms)[0];
  return firstForm ? firstForm.replace(/#/g, String(count)) : String(count);
};

/**
 * Healthcare-specific pluralization helpers
 */
export const healthcarePluralizers = {
  /**
   * Pluralize patient/patients
   */
  patients: (count: number, locale: SupportedLocale = 'en'): string => {
    const forms: Record<SupportedLocale, Partial<Record<PluralCategory, string>>> = {
      en: { one: '# patient', other: '# patients' },
      es: { one: '# paciente', other: '# pacientes' },
      fr: { one: '# patient', other: '# patients' },
      zh: { other: '# 患者' },
      ar: {
        zero: 'لا مرضى',
        one: 'مريض واحد',
        two: 'مريضان',
        few: '# مرضى',
        many: '# مريضًا',
        other: '# مريض',
      },
      de: { one: '# Patient', other: '# Patienten' },
      ja: { other: '# 患者' },
      ko: { other: '# 환자' },
      pt: { one: '# paciente', other: '# pacientes' },
      ru: { one: '# пациент', few: '# пациента', many: '# пациентов', other: '# пациентов' },
    };
    return pluralizeICU(count, forms[locale] || forms.en, locale);
  },

  /**
   * Pluralize appointment/appointments
   */
  appointments: (count: number, locale: SupportedLocale = 'en'): string => {
    const forms: Record<SupportedLocale, Partial<Record<PluralCategory, string>>> = {
      en: { one: '# appointment', other: '# appointments' },
      es: { one: '# cita', other: '# citas' },
      fr: { one: '# rendez-vous', other: '# rendez-vous' },
      zh: { other: '# 预约' },
      ar: {
        zero: 'لا مواعيد',
        one: 'موعد واحد',
        two: 'موعدان',
        few: '# مواعيد',
        many: '# موعدًا',
        other: '# موعد',
      },
      de: { one: '# Termin', other: '# Termine' },
      ja: { other: '# 予約' },
      ko: { other: '# 예약' },
      pt: { one: '# consulta', other: '# consultas' },
      ru: { one: '# встреча', few: '# встречи', many: '# встреч', other: '# встреч' },
    };
    return pluralizeICU(count, forms[locale] || forms.en, locale);
  },

  /**
   * Pluralize medication/medications
   */
  medications: (count: number, locale: SupportedLocale = 'en'): string => {
    const forms: Record<SupportedLocale, Partial<Record<PluralCategory, string>>> = {
      en: { one: '# medication', other: '# medications' },
      es: { one: '# medicamento', other: '# medicamentos' },
      fr: { one: '# médicament', other: '# médicaments' },
      zh: { other: '# 药物' },
      ar: {
        zero: 'لا أدوية',
        one: 'دواء واحد',
        two: 'دواءان',
        few: '# أدوية',
        many: '# دواءً',
        other: '# دواء',
      },
      de: { one: '# Medikament', other: '# Medikamente' },
      ja: { other: '# 薬' },
      ko: { other: '# 약물' },
      pt: { one: '# medicamento', other: '# medicamentos' },
      ru: { one: '# лекарство', few: '# лекарства', many: '# лекарств', other: '# лекарств' },
    };
    return pluralizeICU(count, forms[locale] || forms.en, locale);
  },

  /**
   * Pluralize day/days
   */
  days: (count: number, locale: SupportedLocale = 'en'): string => {
    const forms: Record<SupportedLocale, Partial<Record<PluralCategory, string>>> = {
      en: { one: '# day', other: '# days' },
      es: { one: '# día', other: '# días' },
      fr: { one: '# jour', other: '# jours' },
      zh: { other: '# 天' },
      ar: {
        zero: 'لا أيام',
        one: 'يوم واحد',
        two: 'يومان',
        few: '# أيام',
        many: '# يومًا',
        other: '# يوم',
      },
      de: { one: '# Tag', other: '# Tage' },
      ja: { other: '# 日' },
      ko: { other: '# 일' },
      pt: { one: '# dia', other: '# dias' },
      ru: { one: '# день', few: '# дня', many: '# дней', other: '# дней' },
    };
    return pluralizeICU(count, forms[locale] || forms.en, locale);
  },

  /**
   * Pluralize hour/hours
   */
  hours: (count: number, locale: SupportedLocale = 'en'): string => {
    const forms: Record<SupportedLocale, Partial<Record<PluralCategory, string>>> = {
      en: { one: '# hour', other: '# hours' },
      es: { one: '# hora', other: '# horas' },
      fr: { one: '# heure', other: '# heures' },
      zh: { other: '# 小时' },
      ar: {
        zero: 'لا ساعات',
        one: 'ساعة واحدة',
        two: 'ساعتان',
        few: '# ساعات',
        many: '# ساعة',
        other: '# ساعة',
      },
      de: { one: '# Stunde', other: '# Stunden' },
      ja: { other: '# 時間' },
      ko: { other: '# 시간' },
      pt: { one: '# hora', other: '# horas' },
      ru: { one: '# час', few: '# часа', many: '# часов', other: '# часов' },
    };
    return pluralizeICU(count, forms[locale] || forms.en, locale);
  },

  /**
   * Pluralize result/results
   */
  results: (count: number, locale: SupportedLocale = 'en'): string => {
    const forms: Record<SupportedLocale, Partial<Record<PluralCategory, string>>> = {
      en: { one: '# result', other: '# results' },
      es: { one: '# resultado', other: '# resultados' },
      fr: { one: '# résultat', other: '# résultats' },
      zh: { other: '# 结果' },
      ar: {
        zero: 'لا نتائج',
        one: 'نتيجة واحدة',
        two: 'نتيجتان',
        few: '# نتائج',
        many: '# نتيجة',
        other: '# نتيجة',
      },
      de: { one: '# Ergebnis', other: '# Ergebnisse' },
      ja: { other: '# 結果' },
      ko: { other: '# 결과' },
      pt: { one: '# resultado', other: '# resultados' },
      ru: { one: '# результат', few: '# результата', many: '# результатов', other: '# результатов' },
    };
    return pluralizeICU(count, forms[locale] || forms.en, locale);
  },
};

export default {
  pluralizationRules,
  getPluralCategory,
  pluralize,
  pluralizeICU,
  healthcarePluralizers,
};
