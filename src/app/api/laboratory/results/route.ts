import { NextRequest, NextResponse } from 'next/server';
import { LabResult, ResultStatus } from '@/types/laboratory';

// Mock database
let results: LabResult[] = [
  {
    id: '1',
    orderId: '1',
    orderNumber: 'ORD-2026001-001',
    patientId: 'PT001',
    patientName: 'John Doe',
    patientMRN: 'MRN001234',
    testId: 'WBC',
    testName: 'White Blood Cell Count',
    loincCode: '6690-2',
    value: 7.5,
    valueType: 'NUMERIC',
    unit: '10^9/L',
    referenceRange: '4.5-11.0 10^9/L',
    flag: 'NORMAL',
    status: 'FINAL',
    isCritical: false,
    performedBy: 'Tech001',
    performedAt: new Date(),
    verifiedBy: 'Dr. Lab',
    verifiedAt: new Date(),
    methodology: 'Automated hematology analyzer',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status') as ResultStatus | null;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let filteredResults = [...results];

    if (orderId) {
      filteredResults = filteredResults.filter(result => result.orderId === orderId);
    }

    if (patientId) {
      filteredResults = filteredResults.filter(result => result.patientId === patientId);
    }

    if (status) {
      filteredResults = filteredResults.filter(result => result.status === status);
    }

    if (dateFrom && filteredResults[0]?.performedAt) {
      const fromDate = new Date(dateFrom);
      filteredResults = filteredResults.filter(result => 
        result.performedAt && new Date(result.performedAt) >= fromDate
      );
    }

    if (dateTo && filteredResults[0]?.performedAt) {
      const toDate = new Date(dateTo);
      filteredResults = filteredResults.filter(result => 
        result.performedAt && new Date(result.performedAt) <= toDate
      );
    }

    return NextResponse.json(filteredResults);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newResult: LabResult = {
      id: `${results.length + 1}`,
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    results.push(newResult);

    return NextResponse.json(newResult, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create result' },
      { status: 500 }
    );
  }
}
