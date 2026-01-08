/**
 * RTL (Right-to-Left) Support
 * Enterprise Healthcare Platform - Lithic
 *
 * Utilities for supporting RTL languages (Arabic, Hebrew, etc.)
 */

import type { SupportedLocale, RTLConfiguration, TextDirection } from '@/types/i18n';
import { isRTL, getTextDirection } from './i18n-config';

/**
 * RTL Manager Class
 */
export class RTLManager {
  private locale: SupportedLocale;
  private direction: TextDirection;

  constructor(locale: SupportedLocale) {
    this.locale = locale;
    this.direction = getTextDirection(locale);
  }

  /**
   * Check if current locale is RTL
   */
  isRTL(): boolean {
    return this.direction === 'rtl';
  }

  /**
   * Get text direction
   */
  getDirection(): TextDirection {
    return this.direction;
  }

  /**
   * Update locale
   */
  setLocale(locale: SupportedLocale): void {
    this.locale = locale;
    this.direction = getTextDirection(locale);
  }

  /**
   * Apply RTL to document
   */
  applyToDocument(): void {
    if (typeof document === 'undefined') return;

    const html = document.documentElement;
    html.setAttribute('dir', this.direction);
    html.setAttribute('lang', this.locale);

    // Update body class for CSS targeting
    document.body.classList.remove('ltr', 'rtl');
    document.body.classList.add(this.direction);
  }

  /**
   * Get RTL-aware flex direction
   */
  getFlexDirection(baseDirection: 'row' | 'column'): string {
    if (baseDirection === 'column') return baseDirection;
    return this.isRTL() ? 'row-reverse' : 'row';
  }

  /**
   * Get RTL-aware text alignment
   */
  getTextAlign(baseAlign: 'left' | 'right' | 'center'): string {
    if (baseAlign === 'center') return 'center';
    if (this.isRTL()) {
      return baseAlign === 'left' ? 'right' : 'left';
    }
    return baseAlign;
  }

  /**
   * Get RTL-aware padding/margin
   */
  getSpacing(
    side: 'left' | 'right' | 'top' | 'bottom',
    value: string | number
  ): Record<string, string | number> {
    if (side === 'top' || side === 'bottom') {
      return { [side]: value };
    }

    if (this.isRTL()) {
      const oppositeSide = side === 'left' ? 'right' : 'left';
      return { [oppositeSide]: value };
    }

    return { [side]: value };
  }

  /**
   * Get RTL-aware position
   */
  getPosition(
    side: 'left' | 'right' | 'top' | 'bottom',
    value: string | number
  ): Record<string, string | number> {
    return this.getSpacing(side, value);
  }

  /**
   * Mirror icon for RTL
   */
  shouldMirrorIcon(iconName: string): boolean {
    // Icons that should be mirrored in RTL
    const mirrorableIcons = [
      'arrow-left',
      'arrow-right',
      'chevron-left',
      'chevron-right',
      'angle-left',
      'angle-right',
      'caret-left',
      'caret-right',
      'forward',
      'backward',
      'undo',
      'redo',
      'enter',
      'exit',
      'logout',
      'signin',
    ];

    return this.isRTL() && mirrorableIcons.some((name) => iconName.includes(name));
  }

  /**
   * Get RTL configuration
   */
  getConfiguration(): RTLConfiguration {
    return {
      enabled: this.isRTL(),
      locale: this.locale,
      mirrorIcons: true,
      adjustSpacing: true,
      customStyles: this.getCustomStyles(),
    };
  }

  /**
   * Get custom RTL styles
   */
  private getCustomStyles(): Record<string, string> {
    if (!this.isRTL()) return {};

    return {
      direction: 'rtl',
      textAlign: 'right',
    };
  }

  /**
   * Transform CSS class for RTL
   */
  transformClass(className: string): string {
    if (!this.isRTL()) return className;

    const rtlTransforms: Record<string, string> = {
      'text-left': 'text-right',
      'text-right': 'text-left',
      'float-left': 'float-right',
      'float-right': 'float-left',
      'ml-': 'mr-',
      'mr-': 'ml-',
      'pl-': 'pr-',
      'pr-': 'pl-',
      'rounded-l': 'rounded-r',
      'rounded-r': 'rounded-l',
      'border-l': 'border-r',
      'border-r': 'border-l',
      'left-': 'right-',
      'right-': 'left-',
    };

    let transformed = className;
    for (const [ltr, rtl] of Object.entries(rtlTransforms)) {
      if (transformed.includes(ltr)) {
        transformed = transformed.replace(new RegExp(ltr, 'g'), rtl);
      }
    }

    return transformed;
  }

  /**
   * Get Tailwind RTL utility classes
   */
  getTailwindUtilities(): Record<string, string> {
    if (!this.isRTL()) {
      return {
        'text-start': 'text-left',
        'text-end': 'text-right',
        'start-0': 'left-0',
        'end-0': 'right-0',
        'ms-auto': 'ml-auto',
        'me-auto': 'mr-auto',
      };
    }

    return {
      'text-start': 'text-right',
      'text-end': 'text-left',
      'start-0': 'right-0',
      'end-0': 'left-0',
      'ms-auto': 'mr-auto',
      'me-auto': 'ml-auto',
    };
  }
}

/**
 * RTL-aware CSS utility functions
 */
export const rtlCSS = {
  /**
   * Get margin/padding start
   */
  marginStart: (value: string, isRTL: boolean): Record<string, string> => {
    return isRTL ? { marginRight: value } : { marginLeft: value };
  },

  marginEnd: (value: string, isRTL: boolean): Record<string, string> => {
    return isRTL ? { marginLeft: value } : { marginRight: value };
  },

  paddingStart: (value: string, isRTL: boolean): Record<string, string> => {
    return isRTL ? { paddingRight: value } : { paddingLeft: value };
  },

  paddingEnd: (value: string, isRTL: boolean): Record<string, string> => {
    return isRTL ? { paddingLeft: value } : { paddingRight: value };
  },

  /**
   * Get border start/end
   */
  borderStart: (value: string, isRTL: boolean): Record<string, string> => {
    return isRTL ? { borderRight: value } : { borderLeft: value };
  },

  borderEnd: (value: string, isRTL: boolean): Record<string, string> => {
    return isRTL ? { borderLeft: value } : { borderRight: value };
  },

  /**
   * Get position start/end
   */
  start: (value: string, isRTL: boolean): Record<string, string> => {
    return isRTL ? { right: value } : { left: value };
  },

  end: (value: string, isRTL: boolean): Record<string, string> => {
    return isRTL ? { left: value } : { right: value };
  },

  /**
   * Get text alignment
   */
  textAlign: (align: 'start' | 'end' | 'center', isRTL: boolean): Record<string, string> => {
    if (align === 'center') return { textAlign: 'center' };
    if (align === 'start') {
      return { textAlign: isRTL ? 'right' : 'left' };
    }
    return { textAlign: isRTL ? 'left' : 'right' };
  },

  /**
   * Get flex direction
   */
  flexDirection: (
    direction: 'row' | 'row-reverse' | 'column' | 'column-reverse',
    isRTL: boolean
  ): Record<string, string> => {
    if (direction.includes('column')) {
      return { flexDirection: direction };
    }
    if (isRTL) {
      return { flexDirection: direction === 'row' ? 'row-reverse' : 'row' };
    }
    return { flexDirection: direction };
  },
};

/**
 * RTL-aware class name builder
 */
export const rtlClassName = (
  baseClass: string,
  rtlClass: string,
  isRTL: boolean
): string => {
  return isRTL ? rtlClass : baseClass;
};

/**
 * Conditional RTL class
 */
export const withRTL = (
  className: string,
  locale: SupportedLocale
): string => {
  const rtlActive = isRTL(locale);
  const manager = new RTLManager(locale);
  return manager.transformClass(className);
};

/**
 * Get logical property value
 * Converts physical properties (left/right) to logical ones (start/end)
 */
export const getLogicalProperty = (
  property: string,
  value: string | number,
  isRTLMode: boolean
): Record<string, string | number> => {
  const propertyMap: Record<
    string,
    (val: string | number, rtl: boolean) => Record<string, string | number>
  > = {
    marginLeft: (val, rtl) => (rtl ? { marginRight: val } : { marginLeft: val }),
    marginRight: (val, rtl) => (rtl ? { marginLeft: val } : { marginRight: val }),
    paddingLeft: (val, rtl) => (rtl ? { paddingRight: val } : { paddingLeft: val }),
    paddingRight: (val, rtl) => (rtl ? { paddingLeft: val } : { paddingRight: val }),
    left: (val, rtl) => (rtl ? { right: val } : { left: val }),
    right: (val, rtl) => (rtl ? { left: val } : { right: val }),
    borderLeft: (val, rtl) => (rtl ? { borderRight: val } : { borderLeft: val }),
    borderRight: (val, rtl) => (rtl ? { borderLeft: val } : { borderRight: val }),
  };

  const transformer = propertyMap[property];
  if (transformer) {
    return transformer(value, isRTLMode);
  }

  return { [property]: value };
};

/**
 * Healthcare-specific RTL adjustments
 */
export const healthcareRTL = {
  /**
   * Format patient name for RTL
   */
  formatPatientName: (
    firstName: string,
    lastName: string,
    isRTL: boolean
  ): string => {
    return isRTL ? `${lastName} ${firstName}` : `${firstName} ${lastName}`;
  },

  /**
   * Format medical record number
   */
  formatMRN: (mrn: string, isRTL: boolean): string => {
    // MRNs are typically kept in LTR format even in RTL contexts
    return `\u202A${mrn}\u202C`; // LTR embedding
  },

  /**
   * Format medication instructions
   */
  formatInstructions: (instructions: string, isRTL: boolean): string => {
    // Ensure proper BiDi handling for mixed content
    return isRTL ? `\u202B${instructions}\u202C` : instructions;
  },

  /**
   * Get chart layout direction
   */
  getChartLayout: (isRTL: boolean): { reverse: boolean; mirror: boolean } => {
    return {
      reverse: isRTL,
      mirror: isRTL,
    };
  },
};

// Singleton instance
let rtlManagerInstance: RTLManager | null = null;

/**
 * Get RTL manager singleton
 */
export const getRTLManager = (locale?: SupportedLocale): RTLManager => {
  if (!rtlManagerInstance) {
    rtlManagerInstance = new RTLManager(locale || 'en');
  } else if (locale) {
    rtlManagerInstance.setLocale(locale);
  }
  return rtlManagerInstance;
};

export default RTLManager;
