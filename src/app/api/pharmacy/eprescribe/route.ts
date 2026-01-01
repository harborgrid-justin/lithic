/**
 * E-Prescribing API Route
 * Handle NCPDP e-prescribing messages
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock e-prescribe messages database
const ePrescribeMessages: any[] = [
  {
    id: 'eprx_001',
    messageType: 'NEWRX',
    direction: 'inbound',
    ncpdpMessageId: 'NCPDP-' + Date.now(),
    prescriptionId: null,
    prescriberId: 'prov_001',
    pharmacyNCPDP: '1234567',
    patientId: 'pat_001',
    messageData: {
      medication: {
        drugName: 'Lisinopril 10mg Tablet',
        ndc: '00378-1805-10',
        quantity: 30,
        daysSupply: 30,
        refills: 5,
        sig: 'Take 1 tablet by mouth once daily',
      },
      patient: {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1970-01-01',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
      },
      prescriber: {
        firstName: 'Jane',
        lastName: 'Smith',
        npi: '1234567890',
        dea: 'BS1234563',
        phone: '555-123-4567',
      },
    },
    status: 'received',
    receivedAt: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const messageType = searchParams.get('messageType');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let filtered = [...ePrescribeMessages];

    if (messageType) {
      filtered = filtered.filter(msg => msg.messageType === messageType);
    }

    if (status) {
      filtered = filtered.filter(msg => msg.status === status);
    }

    if (startDate) {
      filtered = filtered.filter(msg =>
        new Date(msg.receivedAt || msg.sentAt) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(msg =>
        new Date(msg.receivedAt || msg.sentAt) <= new Date(endDate)
      );
    }

    // Sort by received/sent date, newest first
    filtered.sort((a, b) => {
      const dateA = new Date(a.receivedAt || a.sentAt || 0);
      const dateB = new Date(b.receivedAt || b.sentAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching e-prescribe messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch e-prescribe messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const message = {
      id: `eprx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ncpdpMessageId: `NCPDP-${Date.now()}`,
      direction: 'outbound',
      status: 'sent',
      sentAt: new Date().toISOString(),
      ...data,
    };

    ePrescribeMessages.push(message);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating e-prescribe message:', error);
    return NextResponse.json(
      { error: 'Failed to create e-prescribe message' },
      { status: 500 }
    );
  }
}
