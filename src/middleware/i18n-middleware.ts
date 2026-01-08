/**
 * i18n Middleware
 * Enterprise Healthcare Platform - Lithic
 *
 * Middleware for handling locale detection and routing
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  SupportedLocale,
  I18nMiddlewareConfig,
  I18nMiddlewareContext,
} from '@/types/i18n';
import { i18nConfig, isLocaleSupported } from '@/lib/i18n/i18n-config';

/**
 * Default i18n middleware configuration
 */
const defaultConfig: I18nMiddlewareConfig = {
  defaultLocale: i18nConfig.defaultLocale,
  locales: i18nConfig.enabledLocales,
  localeDetection: i18nConfig.enableLocaleDetection,
  localeCookie: i18nConfig.localeCookie,
  localeHeader: i18nConfig.localeHeader,
  pathLocale: i18nConfig.enablePathLocale,
  excludePaths: [
    '/api',
    '/_next',
    '/static',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ],
};

/**
 * i18n Middleware factory
 * Creates middleware function with custom configuration
 */
export function createI18nMiddleware(
  config: Partial<I18nMiddlewareConfig> = {}
) {
  const finalConfig = { ...defaultConfig, ...config };

  return async function i18nMiddleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip excluded paths
    if (
      finalConfig.excludePaths?.some(
        (path) => pathname.startsWith(path) || pathname === path
      )
    ) {
      return NextResponse.next();
    }

    // Detect locale
    const context = detectLocale(request, finalConfig);

    // Handle path-based locale routing
    if (finalConfig.pathLocale) {
      return handlePathLocale(request, context, finalConfig);
    }

    // Set locale headers for non-path-based routing
    const response = NextResponse.next();

    // Set locale cookie if detection changed it
    if (context.detectedLocale && context.detectedLocale !== context.locale) {
      response.cookies.set(finalConfig.localeCookie!, context.locale, {
        maxAge: 31536000, // 1 year
        path: '/',
        sameSite: 'lax',
      });
    }

    // Set locale header for server components
    response.headers.set('x-locale', context.locale);

    return response;
  };
}

/**
 * Detect locale from request
 */
function detectLocale(
  request: NextRequest,
  config: I18nMiddlewareConfig
): I18nMiddlewareContext {
  const { pathname } = request.nextUrl;
  let detectedLocale: SupportedLocale | undefined;
  let requestedLocale: SupportedLocale | undefined;

  // 1. Check path for locale
  if (config.pathLocale) {
    const pathLocale = getLocaleFromPath(pathname, config.locales);
    if (pathLocale) {
      requestedLocale = pathLocale;
      detectedLocale = pathLocale;
    }
  }

  // 2. Check cookie
  if (!detectedLocale && config.localeCookie) {
    const cookieLocale = request.cookies.get(config.localeCookie)?.value;
    if (cookieLocale && isLocaleSupported(cookieLocale)) {
      detectedLocale = cookieLocale as SupportedLocale;
    }
  }

  // 3. Check Accept-Language header
  if (!detectedLocale && config.localeDetection && config.localeHeader) {
    const acceptLanguage = request.headers.get(config.localeHeader);
    if (acceptLanguage) {
      const headerLocale = parseAcceptLanguage(acceptLanguage, config.locales);
      if (headerLocale) {
        detectedLocale = headerLocale;
      }
    }
  }

  // 4. Use default locale
  const locale = detectedLocale || config.defaultLocale;

  return {
    locale,
    detectedLocale,
    requestedLocale,
    shouldRedirect: false,
  };
}

/**
 * Handle path-based locale routing
 */
function handlePathLocale(
  request: NextRequest,
  context: I18nMiddlewareContext,
  config: I18nMiddlewareConfig
): NextResponse {
  const { pathname } = request.nextUrl;
  const pathLocale = getLocaleFromPath(pathname, config.locales);

  // If path has locale, validate it
  if (pathLocale) {
    if (isLocaleSupported(pathLocale)) {
      const response = NextResponse.next();
      response.headers.set('x-locale', pathLocale);
      return response;
    } else {
      // Invalid locale in path, redirect to default
      const newPathname = `/${config.defaultLocale}${pathname}`;
      return NextResponse.redirect(new URL(newPathname, request.url));
    }
  }

  // No locale in path, add detected locale
  const locale = context.locale;
  const newPathname = `/${locale}${pathname}`;
  return NextResponse.redirect(new URL(newPathname, request.url));
}

/**
 * Extract locale from pathname
 */
function getLocaleFromPath(
  pathname: string,
  locales: SupportedLocale[]
): SupportedLocale | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const potentialLocale = segments[0];
  return locales.find((l) => l === potentialLocale) || null;
}

/**
 * Parse Accept-Language header
 */
function parseAcceptLanguage(
  header: string,
  supportedLocales: SupportedLocale[]
): SupportedLocale | null {
  const languages = header
    .split(',')
    .map((lang) => {
      const [locale, qValue] = lang.trim().split(';');
      const quality = qValue ? parseFloat(qValue.split('=')[1] || '1') : 1;
      return { locale: locale?.toLowerCase().split('-')[0] || '', quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { locale } of languages) {
    if (supportedLocales.includes(locale as SupportedLocale)) {
      return locale as SupportedLocale;
    }
  }

  return null;
}

/**
 * Default i18n middleware instance
 */
export const i18nMiddleware = createI18nMiddleware();

export default i18nMiddleware;
