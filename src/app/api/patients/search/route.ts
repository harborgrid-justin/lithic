import { NextRequest, NextResponse } from 'next/server';
import { Patient } from '@/types/patient';
import { auditLogger } from '@/lib/audit-logger';

// Mock database
const patientsDb: Patient[] = [];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters = {
      query: searchParams.get('query'),
      mrn: searchParams.get('mrn'),
      firstName: searchParams.get('firstName'),
      lastName: searchParams.get('lastName'),
      dateOfBirth: searchParams.get('dateOfBirth'),
      phone: searchParams.get('phone'),
      email: searchParams.get('email'),
      ssn: searchParams.get('ssn'),
      status: searchParams.get('status'),
    };

    let results = patientsDb;

    // Apply filters
    if (filters.mrn) {
      results = results.filter(p => p.mrn === filters.mrn);
    }

    if (filters.firstName) {
      const firstName = filters.firstName.toLowerCase();
      results = results.filter(p => p.firstName.toLowerCase().includes(firstName));
    }

    if (filters.lastName) {
      const lastName = filters.lastName.toLowerCase();
      results = results.filter(p => p.lastName.toLowerCase().includes(lastName));
    }

    if (filters.dateOfBirth) {
      results = results.filter(p => p.dateOfBirth === filters.dateOfBirth);
    }

    if (filters.phone) {
      const phone = filters.phone.replace(/\D/g, '');
      results = results.filter(p => 
        p.phone?.replace(/\D/g, '').includes(phone)
      );
    }

    if (filters.email) {
      const email = filters.email.toLowerCase();
      results = results.filter(p => 
        p.email?.toLowerCase().includes(email)
      );
    }

    if (filters.status) {
      results = results.filter(p => p.status === filters.status);
    }

    if (filters.query) {
      const query = filters.query.toLowerCase();
      results = results.filter(p =>
        p.firstName.toLowerCase().includes(query) ||
        p.lastName.toLowerCase().includes(query) ||
        p.mrn.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.phone?.includes(query)
      );
    }

    // Audit log
    await auditLogger.logPatientSearch(
      filters,
      results.length,
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

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching patients:', error);
    return NextResponse.json(
      { error: 'Failed to search patients' },
      { status: 500 }
    );
  }
}
