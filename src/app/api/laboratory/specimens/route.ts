import { NextRequest, NextResponse } from 'next/server';
import { Specimen, SpecimenStatus } from '@/types/laboratory';

// Mock database
let specimens: Specimen[] = [
  {
    id: '1',
    accessionNumber: '260101-0001',
    barcode: 'SP1735689600001',
    type: 'BLOOD',
    status: 'RECEIVED',
    patientId: 'PT001',
    patientName: 'John Doe',
    collectedBy: 'Nurse Jane',
    collectedAt: new Date(),
    receivedAt: new Date(),
    volume: 5,
    volumeUnit: 'mL',
    container: 'Lavender top (EDTA) tube',
    orderId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as SpecimenStatus | null;
    const patientId = searchParams.get('patientId');
    const orderId = searchParams.get('orderId');

    let filteredSpecimens = [...specimens];

    if (status) {
      filteredSpecimens = filteredSpecimens.filter(s => s.status === status);
    }

    if (patientId) {
      filteredSpecimens = filteredSpecimens.filter(s => s.patientId === patientId);
    }

    if (orderId) {
      filteredSpecimens = filteredSpecimens.filter(s => s.orderId === orderId);
    }

    return NextResponse.json(filteredSpecimens);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch specimens' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    const newSpecimen: Specimen = {
      id: `${specimens.length + 1}`,
      accessionNumber: `${year}${month}${day}-${random}`,
      barcode: `SP${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    specimens.push(newSpecimen);

    return NextResponse.json(newSpecimen, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create specimen' },
      { status: 500 }
    );
  }
}
