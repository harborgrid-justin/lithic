/**
 * useTranslation Hook
 * Enterprise Healthcare Platform - Lithic
 *
 * React hook for accessing translation functions
 */

'use client';

import { useContext } from 'react';
import { I18nContext } from '@/providers/I18nProvider';
import type { UseTranslationReturn } from '@/types/i18n';

/**
 * useTranslation hook
 * Provides access to translation functions and locale information
 */
export const useTranslation = (): UseTranslationReturn => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }

  const { state, actions } = context;

  return {
    t: actions.t,
    tn: actions.tn,
    locale: state.currentLocale,
    direction: state.direction,
    isLoading: state.isLoading,
    ready: !state.isLoading && state.loadedNamespaces.size > 0,
  };
};

export default useTranslation;
