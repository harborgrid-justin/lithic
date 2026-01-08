/**
 * Advanced Search API Route - Lithic Healthcare Platform v0.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import AdvancedSearchEngine from '@/lib/search/advanced-search';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query, entityTypes, filters, ...options } = body;

    const searchEngine = new AdvancedSearchEngine(
      session.user.organizationId,
      session.user.id
    );

    const results = await searchEngine.search(query, {
      entityTypes,
      filters,
      ...options,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
