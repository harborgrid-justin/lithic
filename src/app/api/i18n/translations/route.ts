/**
 * Translations API Route
 * Enterprise Healthcare Platform - Lithic
 *
 * API endpoint for fetching translations dynamically
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  SupportedLocale,
  TranslationNamespace,
  TranslationsAPIResponse,
  TranslationKeys,
} from '@/types/i18n';
import { isLocaleSupported } from '@/lib/i18n/i18n-config';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * GET /api/i18n/translations
 * Fetch translations for a specific locale and namespace
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') as SupportedLocale | null;
    const namespace = searchParams.get('namespace') as TranslationNamespace | null;
    const keys = searchParams.get('keys')?.split(',');

    // Validate locale
    if (!locale || !isLocaleSupported(locale)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or missing locale parameter',
        },
        { status: 400 }
      );
    }

    // Validate namespace
    if (!namespace) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing namespace parameter',
        },
        { status: 400 }
      );
    }

    // Load translation file
    const translationPath = join(
      process.cwd(),
      'src',
      'locales',
      locale,
      `${namespace}.json`
    );

    let translations: TranslationKeys;
    try {
      const fileContent = await readFile(translationPath, 'utf-8');
      translations = JSON.parse(fileContent);
    } catch (error) {
      // If file not found, try to fall back to English
      if (locale !== 'en') {
        try {
          const fallbackPath = join(
            process.cwd(),
            'src',
            'locales',
            'en',
            `${namespace}.json`
          );
          const fallbackContent = await readFile(fallbackPath, 'utf-8');
          translations = JSON.parse(fallbackContent);
        } catch (fallbackError) {
          return NextResponse.json(
            {
              success: false,
              error: `Translation file not found: ${locale}/${namespace}`,
            },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `Translation file not found: ${locale}/${namespace}`,
          },
          { status: 404 }
        );
      }
    }

    // Filter keys if requested
    let filteredTranslations = translations;
    if (keys && keys.length > 0) {
      filteredTranslations = {};
      for (const key of keys) {
        if (key in translations) {
          filteredTranslations[key] = translations[key];
        }
      }
    }

    // Flatten translations for response
    const flattenedTranslations = flattenTranslations(filteredTranslations);

    const response: TranslationsAPIResponse = {
      success: true,
      locale,
      namespace,
      translations: flattenedTranslations,
      metadata: {
        count: Object.keys(flattenedTranslations).length,
        cached: false,
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Translations API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper to flatten nested translations
 */
function flattenTranslations(
  obj: TranslationKeys,
  prefix = ''
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      result[fullKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenTranslations(value, fullKey));
    }
  }

  return result;
}

/**
 * POST /api/i18n/translations
 * Bulk fetch translations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locale, namespaces } = body;

    if (!locale || !isLocaleSupported(locale)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or missing locale',
        },
        { status: 400 }
      );
    }

    if (!namespaces || !Array.isArray(namespaces)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid namespaces array',
        },
        { status: 400 }
      );
    }

    const results: Record<string, TranslationKeys> = {};

    for (const namespace of namespaces) {
      try {
        const translationPath = join(
          process.cwd(),
          'src',
          'locales',
          locale,
          `${namespace}.json`
        );
        const fileContent = await readFile(translationPath, 'utf-8');
        results[namespace] = JSON.parse(fileContent);
      } catch (error) {
        console.warn(`Failed to load ${locale}/${namespace}:`, error);
        // Continue with other namespaces
      }
    }

    return NextResponse.json(
      {
        success: true,
        locale,
        translations: results,
        metadata: {
          count: Object.keys(results).length,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );
  } catch (error) {
    console.error('Bulk translations API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
