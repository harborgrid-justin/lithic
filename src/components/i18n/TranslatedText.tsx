/**
 * Translated Text Component
 * Enterprise Healthcare Platform - Lithic
 *
 * Component for rendering translated text with optional formatting
 */

'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationNamespace, TranslationOptions } from '@/types/i18n';

interface TranslatedTextProps extends TranslationOptions {
  translationKey: string;
  namespace?: TranslationNamespace;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children?: React.ReactNode;
}

/**
 * TranslatedText Component
 * Renders translated text with optional HTML element wrapper
 */
export const TranslatedText: React.FC<TranslatedTextProps> = ({
  translationKey,
  namespace = 'common',
  as: Component = 'span',
  className,
  defaultValue,
  count,
  context,
  values,
  fallback,
  escapeHtml,
  children,
}) => {
  const { tn } = useTranslation();

  const translatedText = tn(namespace, translationKey, {
    defaultValue,
    count,
    context,
    values,
    fallback,
    escapeHtml,
  });

  return (
    <Component className={className}>
      {translatedText}
      {children}
    </Component>
  );
};

/**
 * Shorthand component for common translations
 */
export const T: React.FC<Omit<TranslatedTextProps, 'namespace'>> = (props) => (
  <TranslatedText {...props} namespace="common" />
);

/**
 * Clinical terminology component
 */
export const ClinicalText: React.FC<Omit<TranslatedTextProps, 'namespace'>> = (props) => (
  <TranslatedText {...props} namespace="clinical" />
);

export default TranslatedText;
