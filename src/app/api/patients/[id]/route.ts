import { NextRequest, NextResponse } from 'next/server';
import { Patient } from '@/types/patient';
import { auditLogger } from '@/lib/audit-logger';

// Mock database - in production, replace with actual database
// This should be shared with the main route
const patientsDb: Patient[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patient = patientsDb.find(p => p.id === params.id);

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Audit log
    await auditLogger.logPatientAccess(
      patient.id,
      {
        userId: 'current-user-id',
        username: 'current-user',
        role: 'clinician',
      },
      {
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientIndex = patientsDb.findIndex(p => p.id === params.id);

    if (patientIndex === -1) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    const updates = await request.json();
    const oldPatient = { ...patientsDb[patientIndex] };
    
    // Update patient
    const updatedPatient: Patient = {
      ...patientsDb[patientIndex],
      ...updates,
      id: params.id, // Ensure ID cannot be changed
      mrn: patientsDb[patientIndex].mrn, // Ensure MRN cannot be changed
      updatedAt: new Date().toISOString(),
      updatedBy: 'current-user-id',
    };

    patientsDb[patientIndex] = updatedPatient;

    // Audit log
    await auditLogger.logPatientModification(
      updatedPatient.id,
      'update',
      {
        userId: 'current-user-id',
        username: 'current-user',
        role: 'clinician',
      },
      { before: oldPatient, after: updatedPatient },
      {
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientIndex = patientsDb.findIndex(p => p.id === params.id);

    if (patientIndex === -1) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    const deletedPatient = patientsDb[patientIndex];
    
    // Soft delete - mark as inactive instead of removing
    patientsDb[patientIndex] = {
      ...deletedPatient,
      status: 'inactive',
      updatedAt: new Date().toISOString(),
      updatedBy: 'current-user-id',
    };

    // Audit log
    await auditLogger.logPatientModification(
      deletedPatient.id,
      'delete',
      {
        userId: 'current-user-id',
        username: 'current-user',
        role: 'clinician',
      },
      { patient: deletedPatient },
      {
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { error: 'Failed to delete patient' },
      { status: 500 }
    );
  }
}
