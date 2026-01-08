/**
 * Documents API Route - Lithic Healthcare Platform v0.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import DocumentManager from '@/lib/documents/document-manager';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const patientId = searchParams.get('patientId') || undefined;
    const types = searchParams.get('types')?.split(',') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const manager = new DocumentManager(
      session.user.organizationId,
      session.user.id
    );

    const result = await manager.searchDocuments({
      query,
      patientId,
      types: types as any,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Document search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const optionsStr = formData.get('options') as string;
    const options = JSON.parse(optionsStr);

    const manager = new DocumentManager(
      session.user.organizationId,
      session.user.id
    );

    const document = await manager.createDocument(options, file, {});

    return NextResponse.json(document);
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
