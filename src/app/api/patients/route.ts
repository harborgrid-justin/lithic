import { NextRequest, NextResponse } from 'next/server';
import { Patient } from '@/types/patient';
import { mrnGenerator } from '@/lib/mrn-generator';
import { auditLogger } from '@/lib/audit-logger';

// Mock database - in production, replace with actual database
let patients: Patient[] = [];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const query = searchParams.get('query') || '';
    const status = searchParams.get('status');

    // Filter patients
    let filteredPatients = patients;

    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredPatients = filteredPatients.filter(p => 
        p.firstName.toLowerCase().includes(lowerQuery) ||
        p.lastName.toLowerCase().includes(lowerQuery) ||
        p.mrn.toLowerCase().includes(lowerQuery) ||
        p.email?.toLowerCase().includes(lowerQuery) ||
        p.phone?.includes(lowerQuery)
      );
    }

    if (status) {
      filteredPatients = filteredPatients.filter(p => p.status === status);
    }

    // Pagination
    const total = filteredPatients.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedPatients = filteredPatients.slice(start, end);

    // Audit log
    await auditLogger.logPatientSearch(
      { query, status, page, limit },
      total,
      {
        userId: 'current-user-id', // Replace with actual user from session
        username: 'current-user',
        role: 'clinician',
      },
      {
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json({
      patients: paginatedPatients,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Generate MRN
    const mrn = mrnGenerator.generate();

    // Create patient
    const now = new Date().toISOString();
    const newPatient: Patient = {
      id: crypto.randomUUID?.() || Math.random().toString(36),
      mrn,
      ...data,
      createdAt: now,
      updatedAt: now,
      createdBy: 'current-user-id', // Replace with actual user from session
      updatedBy: 'current-user-id',
    };

    // Add to database
    patients.push(newPatient);

    // Audit log
    await auditLogger.logPatientModification(
      newPatient.id,
      'create',
      {
        userId: 'current-user-id',
        username: 'current-user',
        role: 'clinician',
      },
      { patient: newPatient },
      {
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json(newPatient, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}
