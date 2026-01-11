/**
 * Localized Number Component
 * Enterprise Healthcare Platform - Lithic
 *
 * Component for rendering numbers formatted according to locale
 */

'use client';

import React from 'react';
import { useLocale } from '@/hooks/useLocale';
import type { NumberFormattingOptions, MedicalUnitFormattingOptions } from '@/types/i18n';

interface LocalizedNumberProps extends NumberFormattingOptions {
  value: number;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

/**
 * LocalizedNumber Component
 * Renders numbers formatted according to the current locale
 */
export const LocalizedNumber: React.FC<LocalizedNumberProps> = ({
  value,
  as: Component = 'span',
  className,
  style,
  currency,
  unit,
  minimumFractionDigits,
  maximumFractionDigits,
  notation,
}) => {
  const { formatNumber } = useLocale();

  const formattedNumber = formatNumber(value, {
    style,
    currency,
    unit,
    minimumFractionDigits,
    maximumFractionDigits,
    notation,
  });

  return <Component className={className}>{formattedNumber}</Component>;
};

/**
 * Currency component
 */
export const Currency: React.FC<{
  value: number;
  currency?: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}> = ({ value, currency, as = 'span', className }) => {
  const { formatCurrency } = useLocale();
  const Component = as;

  return <Component className={className}>{formatCurrency(value, currency)}</Component>;
};

/**
 * Percentage component
 */
export const Percentage: React.FC<{
  value: number;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}> = ({ value, as = 'span', className }) => {
  const { formatPercent } = useLocale();
  const Component = as;

  return <Component className={className}>{formatPercent(value)}</Component>;
};

/**
 * Medical Unit component
 */
export const MedicalUnit: React.FC<{
  value: number;
  options: MedicalUnitFormattingOptions;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}> = ({ value, options, as = 'span', className }) => {
  const { formatMedicalUnit } = useLocale();
  const Component = as;

  return <Component className={className}>{formatMedicalUnit(value, options)}</Component>;
};

/**
 * Blood Pressure component
 */
export const BloodPressure: React.FC<{
  systolic: number;
  diastolic: number;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}> = ({ systolic, diastolic, as = 'span', className }) => {
  const Component = as;
  return (
    <Component className={className}>
      {Math.round(systolic)}/{Math.round(diastolic)} mmHg
    </Component>
  );
};

/**
 * Heart Rate component
 */
export const HeartRate: React.FC<{
  bpm: number;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}> = ({ bpm, as = 'span', className }) => {
  const Component = as;
  return (
    <Component className={className}>
      {Math.round(bpm)} bpm
    </Component>
  );
};

/**
 * Temperature component
 */
export const Temperature: React.FC<{
  value: number;
  unit?: 'C' | 'F';
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}> = ({ value, unit = 'C', as = 'span', className }) => {
  const { formatNumber } = useLocale();
  const Component = as;

  const formattedValue = formatNumber(value, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <Component className={className}>
      {formattedValue}°{unit}
    </Component>
  );
};

export default LocalizedNumber;
