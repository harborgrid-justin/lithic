/**
 * E-Signature API Route - Lithic Healthcare Platform v0.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import SignatureService from '@/lib/esignature/signature-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status')?.split(',');

    const service = new SignatureService(
      session.user.organizationId,
      session.user.id
    );

    const requests = await service.getSignatureRequests({
      status: status as any,
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Get signature requests error:', error);
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

    const body = await request.json();

    const service = new SignatureService(
      session.user.organizationId,
      session.user.id
    );

    const signatureRequest = await service.createSignatureRequest(body);

    return NextResponse.json(signatureRequest);
  } catch (error) {
    console.error('Create signature request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
