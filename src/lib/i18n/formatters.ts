/**
 * Locale Formatters
 * Enterprise Healthcare Platform - Lithic
 *
 * Comprehensive formatting utilities for:
 * - Dates and times
 * - Numbers and currencies
 * - Medical units and measurements
 * - Healthcare-specific values
 */

import { format, formatDistance, formatRelative, parseISO } from 'date-fns';
import { enUS, es, fr, zhCN, ar, de, ja, ko, ptBR, ru } from 'date-fns/locale';
import type {
  SupportedLocale,
  DateFormattingOptions,
  NumberFormattingOptions,
  MedicalUnitFormattingOptions,
  HealthcareNumberFormats,
  MedicalDosageFormat,
} from '@/types/i18n';
import { getLocaleConfig } from './i18n-config';

// Date-fns locale mapping
const dateFnsLocales: Record<SupportedLocale, Locale> = {
  en: enUS,
  es: es,
  fr: fr,
  zh: zhCN,
  ar: ar,
  de: de,
  ja: ja,
  ko: ko,
  pt: ptBR,
  ru: ru,
};

/**
 * Date Formatter Class
 */
export class DateFormatter {
  constructor(private locale: SupportedLocale) {}

  /**
   * Format a date according to locale
   */
  format(
    date: Date | string,
    options: DateFormattingOptions = {}
  ): string {
    const {
      format: formatStr,
      includeTime = false,
      timezone,
      relativeThreshold = 7,
    } = options;

    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      const dateFnsLocale = dateFnsLocales[this.locale];
      const config = getLocaleConfig(this.locale);

      // Handle relative formatting
      if (formatStr === 'relative') {
        const now = new Date();
        const daysDiff = Math.abs(
          (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff <= relativeThreshold) {
          return formatRelative(dateObj, now, { locale: dateFnsLocale });
        }
      }

      // Handle predefined formats
      let pattern: string;
      switch (formatStr) {
        case 'short':
          pattern = config.dateFormat;
          break;
        case 'medium':
          pattern = 'PPP';
          break;
        case 'long':
          pattern = 'PPPP';
          break;
        case 'full':
          pattern = includeTime ? config.dateTimeFormat : 'PPPP';
          break;
        default:
          pattern = formatStr || (includeTime ? config.dateTimeFormat : config.dateFormat);
      }

      return format(dateObj, pattern, { locale: dateFnsLocale });
    } catch (error) {
      console.error('Date formatting error:', error);
      return String(date);
    }
  }

  /**
   * Format date range
   */
  formatRange(
    startDate: Date | string,
    endDate: Date | string,
    options: DateFormattingOptions = {}
  ): string {
    const start = this.format(startDate, options);
    const end = this.format(endDate, options);
    return `${start} - ${end}`;
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelative(date: Date | string, baseDate?: Date): string {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      const base = baseDate || new Date();
      const dateFnsLocale = dateFnsLocales[this.locale];

      return formatDistance(dateObj, base, {
        addSuffix: true,
        locale: dateFnsLocale,
      });
    } catch (error) {
      console.error('Relative date formatting error:', error);
      return String(date);
    }
  }

  /**
   * Format time only
   */
  formatTime(date: Date | string): string {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      const config = getLocaleConfig(this.locale);
      const dateFnsLocale = dateFnsLocales[this.locale];

      return format(dateObj, config.timeFormat, { locale: dateFnsLocale });
    } catch (error) {
      console.error('Time formatting error:', error);
      return String(date);
    }
  }

  /**
   * Format date for input fields
   */
  formatForInput(date: Date | string): string {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Input date formatting error:', error);
      return '';
    }
  }

  /**
   * Format datetime for input fields
   */
  formatDateTimeForInput(date: Date | string): string {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, "yyyy-MM-dd'T'HH:mm");
    } catch (error) {
      console.error('Input datetime formatting error:', error);
      return '';
    }
  }
}

/**
 * Number Formatter Class
 */
export class NumberFormatter {
  constructor(private locale: SupportedLocale) {}

  /**
   * Format a number according to locale
   */
  format(
    value: number,
    options: NumberFormattingOptions = {}
  ): string {
    const {
      style = 'decimal',
      currency,
      unit,
      minimumFractionDigits,
      maximumFractionDigits,
      notation = 'standard',
    } = options;

    try {
      const config = getLocaleConfig(this.locale);

      const formatOptions: Intl.NumberFormatOptions = {
        style,
        notation,
        minimumFractionDigits:
          minimumFractionDigits ?? config.numberFormat.minimumFractionDigits,
        maximumFractionDigits:
          maximumFractionDigits ?? config.numberFormat.maximumFractionDigits,
      };

      if (style === 'currency') {
        formatOptions.currency = currency || config.currencyFormat.currency;
      }

      if (style === 'unit' && unit) {
        formatOptions.unit = unit;
      }

      return new Intl.NumberFormat(this.locale, formatOptions).format(value);
    } catch (error) {
      console.error('Number formatting error:', error);
      return String(value);
    }
  }

  /**
   * Format currency
   */
  formatCurrency(value: number, currency?: string): string {
    return this.format(value, { style: 'currency', currency });
  }

  /**
   * Format percentage
   */
  formatPercent(value: number): string {
    return this.format(value, { style: 'percent' });
  }

  /**
   * Format with compact notation (e.g., 1.2K, 3.4M)
   */
  formatCompact(value: number): string {
    return this.format(value, { notation: 'compact' });
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${this.format(size, { maximumFractionDigits: 2 })} ${units[unitIndex]}`;
  }

  /**
   * Format ordinal number (1st, 2nd, 3rd, etc.)
   */
  formatOrdinal(value: number): string {
    // This is English-specific, would need localization for other languages
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = value % 100;
    const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
    return `${value}${suffix}`;
  }
}

/**
 * Medical Unit Formatter Class
 */
export class MedicalUnitFormatter {
  constructor(
    private locale: SupportedLocale,
    private numberFormatter: NumberFormatter
  ) {}

  /**
   * Format medical measurement with unit
   */
  format(value: number, options: MedicalUnitFormattingOptions): string {
    const { unitType, unitSystem = 'metric', unit } = options;

    try {
      let displayValue = value;
      let displayUnit = unit;

      // Convert based on unit type and system
      if (unitType && !unit) {
        const conversion = this.getUnitConversion(unitType, unitSystem);
        displayUnit = conversion.unit;
        displayValue = value * conversion.factor;
      }

      const formattedNumber = this.numberFormatter.format(
        displayValue,
        options
      );
      return `${formattedNumber} ${displayUnit || ''}`.trim();
    } catch (error) {
      console.error('Medical unit formatting error:', error);
      return `${value} ${unit || ''}`.trim();
    }
  }

  /**
   * Get unit conversion factor and display unit
   */
  private getUnitConversion(
    unitType: string,
    system: 'metric' | 'imperial'
  ): { factor: number; unit: string } {
    const conversions: Record<
      string,
      Record<'metric' | 'imperial', { factor: number; unit: string }>
    > = {
      weight: {
        metric: { factor: 1, unit: 'kg' },
        imperial: { factor: 2.20462, unit: 'lb' },
      },
      height: {
        metric: { factor: 1, unit: 'cm' },
        imperial: { factor: 0.393701, unit: 'in' },
      },
      temperature: {
        metric: { factor: 1, unit: '°C' },
        imperial: { factor: 1.8, unit: '°F' }, // Plus 32, handled separately
      },
      volume: {
        metric: { factor: 1, unit: 'mL' },
        imperial: { factor: 0.033814, unit: 'fl oz' },
      },
    };

    return (
      conversions[unitType]?.[system] || { factor: 1, unit: '' }
    );
  }

  /**
   * Format blood pressure
   */
  formatBloodPressure(systolic: number, diastolic: number): string {
    return `${Math.round(systolic)}/${Math.round(diastolic)} mmHg`;
  }

  /**
   * Format heart rate
   */
  formatHeartRate(bpm: number): string {
    return `${Math.round(bpm)} bpm`;
  }

  /**
   * Format temperature
   */
  formatTemperature(value: number, unit: 'C' | 'F' = 'C'): string {
    const formatted = this.numberFormatter.format(value, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `${formatted}°${unit}`;
  }

  /**
   * Format glucose level
   */
  formatGlucose(value: number, unit: 'mg/dL' | 'mmol/L' = 'mg/dL'): string {
    const decimals = unit === 'mmol/L' ? 1 : 0;
    const formatted = this.numberFormatter.format(value, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${formatted} ${unit}`;
  }

  /**
   * Format lab result with normal range
   */
  formatLabResult(
    value: number,
    unit: string,
    normalRange?: [number, number]
  ): string {
    const formatted = this.format(value, { unit });

    if (normalRange) {
      const [min, max] = normalRange;
      const status =
        value < min ? ' (Low)' : value > max ? ' (High)' : ' (Normal)';
      return `${formatted}${status}`;
    }

    return formatted;
  }

  /**
   * Format medication dosage
   */
  formatDosage(dosage: MedicalDosageFormat): string {
    const { value, unit, route, frequency } = dosage;

    const formatted = this.format(value, { unit });
    const parts = [formatted];

    if (route) parts.push(route);
    if (frequency) parts.push(frequency);

    return parts.join(' ');
  }

  /**
   * Format BMI
   */
  formatBMI(bmi: number): string {
    const formatted = this.numberFormatter.format(bmi, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

    let category = '';
    if (bmi < 18.5) category = ' (Underweight)';
    else if (bmi < 25) category = ' (Normal)';
    else if (bmi < 30) category = ' (Overweight)';
    else category = ' (Obese)';

    return `${formatted}${category}`;
  }

  /**
   * Format SpO2 (oxygen saturation)
   */
  formatSpO2(value: number): string {
    return `${Math.round(value)}%`;
  }

  /**
   * Format respiratory rate
   */
  formatRespiratoryRate(rate: number): string {
    return `${Math.round(rate)} breaths/min`;
  }
}

/**
 * Locale Formatter - Main class combining all formatters
 */
export class LocaleFormatter {
  public date: DateFormatter;
  public number: NumberFormatter;
  public medical: MedicalUnitFormatter;

  constructor(private locale: SupportedLocale) {
    this.date = new DateFormatter(locale);
    this.number = new NumberFormatter(locale);
    this.medical = new MedicalUnitFormatter(locale, this.number);
  }

  /**
   * Change locale
   */
  setLocale(locale: SupportedLocale): void {
    this.locale = locale;
    this.date = new DateFormatter(locale);
    this.number = new NumberFormatter(locale);
    this.medical = new MedicalUnitFormatter(locale, this.number);
  }

  /**
   * Get current locale
   */
  getLocale(): SupportedLocale {
    return this.locale;
  }

  /**
   * Get healthcare-specific formatters
   */
  getHealthcareFormatters(): HealthcareNumberFormats {
    return {
      bloodPressure: (systolic, diastolic) =>
        this.medical.formatBloodPressure(systolic, diastolic),
      heartRate: (bpm) => this.medical.formatHeartRate(bpm),
      temperature: (value, unit) => this.medical.formatTemperature(value, unit),
      weight: (value, unit) =>
        this.medical.format(value, { unitType: 'weight', unit }),
      height: (value, unit) =>
        this.medical.format(value, { unitType: 'height', unit }),
      glucose: (value, unit) => this.medical.formatGlucose(value, unit),
      labResult: (value, unit, normalRange) =>
        this.medical.formatLabResult(value, unit, normalRange),
    };
  }
}

// Singleton instance
let localeFormatterInstance: LocaleFormatter | null = null;

/**
 * Get the locale formatter singleton
 */
export const getLocaleFormatter = (
  locale?: SupportedLocale
): LocaleFormatter => {
  if (!localeFormatterInstance) {
    localeFormatterInstance = new LocaleFormatter(
      locale || 'en'
    );
  } else if (locale && localeFormatterInstance.getLocale() !== locale) {
    localeFormatterInstance.setLocale(locale);
  }
  return localeFormatterInstance;
};

export default LocaleFormatter;
