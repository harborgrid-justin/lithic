/**
 * Localized Date Component
 * Enterprise Healthcare Platform - Lithic
 *
 * Component for rendering dates formatted according to locale
 */

'use client';

import React from 'react';
import { useLocale } from '@/hooks/useLocale';
import type { DateFormattingOptions } from '@/types/i18n';

interface LocalizedDateProps extends DateFormattingOptions {
  date: Date | string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  showTime?: boolean;
  relative?: boolean;
}

/**
 * LocalizedDate Component
 * Renders dates formatted according to the current locale
 */
export const LocalizedDate: React.FC<LocalizedDateProps> = ({
  date,
  as: Component = 'time',
  className,
  format,
  includeTime = false,
  timezone,
  relativeThreshold,
  showTime,
  relative = false,
}) => {
  const { formatDate } = useLocale();

  const formattedDate = formatDate(date, {
    format: relative ? 'relative' : format,
    includeTime: includeTime || showTime,
    timezone,
    relativeThreshold,
  });

  // Get ISO string for datetime attribute
  const isoDate = typeof date === 'string' ? date : date.toISOString();

  return (
    <Component className={className} dateTime={isoDate} title={isoDate}>
      {formattedDate}
    </Component>
  );
};

/**
 * Relative date component (e.g., "2 hours ago")
 */
export const RelativeDate: React.FC<
  Omit<LocalizedDateProps, 'relative' | 'format'>
> = (props) => <LocalizedDate {...props} relative={true} />;

/**
 * Date with time component
 */
export const DateTime: React.FC<Omit<LocalizedDateProps, 'includeTime'>> = (
  props
) => <LocalizedDate {...props} includeTime={true} />;

export default LocalizedDate;
