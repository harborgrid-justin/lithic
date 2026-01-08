/**
 * useLocale Hook
 * Enterprise Healthcare Platform - Lithic
 *
 * React hook for locale management and formatting
 */

'use client';

import { useContext, useMemo } from 'react';
import { I18nContext } from '@/providers/I18nProvider';
import { getLocaleFormatter } from '@/lib/i18n/formatters';
import { getSupportedLocales } from '@/lib/i18n/i18n-config';
import type { UseLocaleReturn } from '@/types/i18n';

/**
 * useLocale hook
 * Provides locale management and formatting utilities
 */
export const useLocale = (): UseLocaleReturn => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useLocale must be used within an I18nProvider');
  }

  const { state, actions } = context;

  // Create formatter instance
  const formatter = useMemo(() => {
    return getLocaleFormatter(state.currentLocale);
  }, [state.currentLocale]);

  return {
    locale: state.currentLocale,
    locales: getSupportedLocales(),
    direction: state.direction,
    changeLocale: actions.changeLocale,
    formatDate: (date, options) => formatter.date.format(date, options),
    formatNumber: (value, options) => formatter.number.format(value, options),
    formatCurrency: (value, currency) => formatter.number.formatCurrency(value, currency),
    formatPercent: (value) => formatter.number.formatPercent(value),
    formatMedicalUnit: (value, options) => formatter.medical.format(value, options),
  };
};

export default useLocale;
