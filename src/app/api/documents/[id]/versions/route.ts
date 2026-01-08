/**
 * Document Versions API Route - Lithic Healthcare Platform v0.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import VersionControlService from '@/lib/documents/version-control';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const versionControl = new VersionControlService(
      session.user.organizationId,
      session.user.id
    );

    const versions = await versionControl.getVersions(params.id);

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Get versions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const changeDescription = formData.get('changeDescription') as string;

    const versionControl = new VersionControlService(
      session.user.organizationId,
      session.user.id
    );

    const version = await versionControl.createVersion(
      params.id,
      file,
      changeDescription
    );

    return NextResponse.json(version);
  } catch (error) {
    console.error('Create version error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
