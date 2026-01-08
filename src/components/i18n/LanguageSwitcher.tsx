/**
 * Language Switcher Component
 * Enterprise Healthcare Platform - Lithic
 *
 * UI component for switching between supported languages
 */

'use client';

import React, { useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useTranslation } from '@/hooks/useTranslation';
import type { LocaleSwitcherOptions, SupportedLocale } from '@/types/i18n';
import { Check, ChevronDown, Globe } from 'lucide-react';

interface LanguageSwitcherProps extends Partial<LocaleSwitcherOptions> {
  className?: string;
}

/**
 * Language Switcher Component
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  showFlags = false,
  showNativeName = true,
  showLabel = true,
  variant = 'dropdown',
  filterLocales,
  className = '',
}) => {
  const { locale: currentLocale, locales, changeLocale } = useLocale();
  const { t, isLoading } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Filter locales if needed
  const availableLocales = filterLocales
    ? locales.filter((l) => filterLocales.includes(l.code))
    : locales;

  const currentLocaleConfig = locales.find((l) => l.code === currentLocale);

  const handleLocaleChange = async (locale: SupportedLocale) => {
    setIsOpen(false);
    await changeLocale(locale);
  };

  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-block text-left ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          aria-label={t('accessibility.select_language')}
        >
          <Globe className="h-4 w-4" />
          {showLabel && (
            <span>
              {showNativeName
                ? currentLocaleConfig?.nativeName
                : currentLocaleConfig?.name}
            </span>
          )}
          <ChevronDown className="h-4 w-4" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Dropdown */}
            <div className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1" role="menu">
                {availableLocales.map((localeConfig) => (
                  <button
                    key={localeConfig.code}
                    onClick={() => handleLocaleChange(localeConfig.code)}
                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      localeConfig.code === currentLocale
                        ? 'bg-gray-50 text-blue-600'
                        : 'text-gray-700'
                    }`}
                    role="menuitem"
                  >
                    <span className="flex items-center gap-2">
                      {showNativeName ? localeConfig.nativeName : localeConfig.name}
                    </span>
                    {localeConfig.code === currentLocale && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {availableLocales.map((localeConfig) => (
          <button
            key={localeConfig.code}
            onClick={() => handleLocaleChange(localeConfig.code)}
            disabled={isLoading}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              localeConfig.code === currentLocale
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            {showNativeName ? localeConfig.nativeName : localeConfig.name}
          </button>
        ))}
      </div>
    );
  }

  return null;
};

export default LanguageSwitcher;
