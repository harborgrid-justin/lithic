/**
 * RTL Wrapper Component
 * Enterprise Healthcare Platform - Lithic
 *
 * Wrapper component for handling RTL (right-to-left) layouts
 */

'use client';

import React, { useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { getRTLManager } from '@/lib/i18n/rtl-support';

interface RTLWrapperProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  applyToDocument?: boolean;
}

/**
 * RTLWrapper Component
 * Wraps content and applies RTL styles when needed
 */
export const RTLWrapper: React.FC<RTLWrapperProps> = ({
  children,
  className = '',
  as: Component = 'div',
  applyToDocument = false,
}) => {
  const { locale, direction } = useLocale();

  useEffect(() => {
    if (applyToDocument) {
      const rtlManager = getRTLManager(locale);
      rtlManager.applyToDocument();
    }
  }, [locale, applyToDocument]);

  return (
    <Component dir={direction} className={className}>
      {children}
    </Component>
  );
};

/**
 * RTL-aware flex container
 */
export const RTLFlex: React.FC<{
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
}> = ({ children, className = '', reverse = false }) => {
  const { direction } = useLocale();
  const isRTL = direction === 'rtl';

  const flexDirection = reverse
    ? isRTL
      ? 'flex-row'
      : 'flex-row-reverse'
    : isRTL
      ? 'flex-row-reverse'
      : 'flex-row';

  return <div className={`flex ${flexDirection} ${className}`}>{children}</div>;
};

/**
 * RTL-aware text alignment
 */
export const RTLText: React.FC<{
  children: React.ReactNode;
  align?: 'start' | 'end' | 'center';
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}> = ({ children, align = 'start', className = '', as: Component = 'div' }) => {
  const { direction } = useLocale();
  const isRTL = direction === 'rtl';

  let textAlign = '';
  if (align === 'start') {
    textAlign = isRTL ? 'text-right' : 'text-left';
  } else if (align === 'end') {
    textAlign = isRTL ? 'text-left' : 'text-right';
  } else {
    textAlign = 'text-center';
  }

  return <Component className={`${textAlign} ${className}`}>{children}</Component>;
};

/**
 * RTL-aware spacing component
 */
export const RTLSpacing: React.FC<{
  children: React.ReactNode;
  side: 'start' | 'end';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  type?: 'margin' | 'padding';
  className?: string;
}> = ({ children, side, size = 'md', type = 'margin', className = '' }) => {
  const { direction } = useLocale();
  const isRTL = direction === 'rtl';

  const sizeMap = {
    sm: '2',
    md: '4',
    lg: '6',
    xl: '8',
  };

  const actualSide = side === 'start' ? (isRTL ? 'r' : 'l') : isRTL ? 'l' : 'r';
  const prefix = type === 'margin' ? 'm' : 'p';
  const spacingClass = `${prefix}${actualSide}-${sizeMap[size]}`;

  return <div className={`${spacingClass} ${className}`}>{children}</div>;
};

/**
 * RTL-aware icon wrapper
 * Mirrors icons that should be flipped in RTL
 */
export const RTLIcon: React.FC<{
  children: React.ReactNode;
  mirror?: boolean;
  className?: string;
}> = ({ children, mirror = true, className = '' }) => {
  const { direction } = useLocale();
  const isRTL = direction === 'rtl';

  const mirrorClass = mirror && isRTL ? 'scale-x-[-1]' : '';

  return <span className={`inline-block ${mirrorClass} ${className}`}>{children}</span>;
};

export default RTLWrapper;
