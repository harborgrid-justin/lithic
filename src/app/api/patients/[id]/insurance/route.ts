import { NextRequest, NextResponse } from 'next/server';
import { Insurance, EligibilityResponse } from '@/types/patient';
import { auditLogger } from '@/lib/audit-logger';

// Mock database
const insuranceDb: Insurance[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const insurance = insuranceDb.filter(i => i.patientId === params.id);
    
    // Sort by type priority (primary, secondary, tertiary)
    const typePriority = { primary: 1, secondary: 2, tertiary: 3 };
    insurance.sort((a, b) => typePriority[a.type] - typePriority[b.type]);
    
    return NextResponse.json(insurance);
  } catch (error) {
    console.error('Error fetching insurance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insurance' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    const newInsurance: Insurance = {
      id: crypto.randomUUID?.() || Math.random().toString(36),
      patientId: params.id,
      ...data,
      verified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    insuranceDb.push(newInsurance);

    // Audit log
    await auditLogger.log({
      resourceType: 'insurance',
      resourceId: newInsurance.id,
      action: 'create',
      actor: {
        userId: 'current-user-id',
        username: 'current-user',
        role: 'clinician',
      },
      metadata: {
        patientId: params.id,
        insuranceType: newInsurance.type,
        provider: newInsurance.provider,
      },
      timestamp: new Date().toISOString(),
      ipAddress: request.ip,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(newInsurance, { status: 201 });
  } catch (error) {
    console.error('Error creating insurance:', error);
    return NextResponse.json(
      { error: 'Failed to create insurance' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const insuranceIndex = insuranceDb.findIndex(i => i.id === data.id);

    if (insuranceIndex === -1) {
      return NextResponse.json(
        { error: 'Insurance not found' },
        { status: 404 }
      );
    }

    const updatedInsurance: Insurance = {
      ...insuranceDb[insuranceIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    insuranceDb[insuranceIndex] = updatedInsurance;

    // Audit log
    await auditLogger.log({
      resourceType: 'insurance',
      resourceId: updatedInsurance.id,
      action: 'update',
      actor: {
        userId: 'current-user-id',
        username: 'current-user',
        role: 'clinician',
      },
      changes: { before: insuranceDb[insuranceIndex], after: updatedInsurance },
      timestamp: new Date().toISOString(),
      ipAddress: request.ip,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(updatedInsurance);
  } catch (error) {
    console.error('Error updating insurance:', error);
    return NextResponse.json(
      { error: 'Failed to update insurance' },
      { status: 500 }
    );
  }
}
