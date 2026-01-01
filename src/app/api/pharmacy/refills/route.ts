/**
 * Refills API Route
 * Handle prescription refill requests
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock refill requests database
const refillRequests: any[] = [];
let refillIdCounter = 1000;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');

    let filtered = [...refillRequests];

    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }

    if (patientId) {
      filtered = filtered.filter(r => r.prescription?.patientId === patientId);
    }

    // Sort by request date, newest first
    filtered.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching refill requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch refill requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prescriptionId, requestedBy } = await request.json();

    // Check refill eligibility
    // In production, fetch actual prescription data
    const canRefill = true; // Mock eligibility check
    const tooSoonDate = null;

    if (!canRefill) {
      return NextResponse.json(
        {
          error: 'Refill not eligible',
          reason: 'Too soon to refill',
          nextEligibleDate: tooSoonDate,
        },
        { status: 400 }
      );
    }

    const refillRequest = {
      id: `refill_${refillIdCounter++}`,
      prescriptionId,
      prescription: null, // In production, populate with actual prescription
      requestedBy,
      requestDate: new Date().toISOString(),
      status: 'pending',
    };

    refillRequests.push(refillRequest);

    return NextResponse.json(refillRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating refill request:', error);
    return NextResponse.json(
      { error: 'Failed to create refill request' },
      { status: 500 }
    );
  }
}
