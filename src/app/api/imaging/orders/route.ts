import { NextRequest, NextResponse } from 'next/server';

// Mock database - replace with actual database in production
let orders: any[] = [
  {
    id: 'ORD-001',
    patientId: 'PAT-001',
    patientName: 'Johnson, Sarah',
    patientMRN: 'MRN-12345',
    orderDate: '2026-01-01T08:00:00Z',
    modality: 'CT',
    bodyPart: 'Chest',
    procedure: 'CT Chest with Contrast',
    procedureCode: '71260',
    clinicalIndication: 'Suspected pulmonary embolism',
    orderingPhysician: 'Dr. Smith',
    priority: 'STAT',
    status: 'PENDING',
    contrast: true,
    transportRequired: false,
    pregnancyStatus: 'NEGATIVE',
    allergies: ['Iodine contrast'],
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'ORD-002',
    patientId: 'PAT-002',
    patientName: 'Davis, Michael',
    patientMRN: 'MRN-67890',
    orderDate: '2026-01-01T09:00:00Z',
    modality: 'MR',
    bodyPart: 'Brain',
    procedure: 'MRI Brain without Contrast',
    procedureCode: '70551',
    clinicalIndication: 'Chronic headaches',
    orderingPhysician: 'Dr. Johnson',
    priority: 'ROUTINE',
    status: 'SCHEDULED',
    scheduledDate: '2026-01-02T10:00:00Z',
    contrast: false,
    transportRequired: false,
    pregnancyStatus: 'UNKNOWN',
    allergies: [],
    createdAt: '2026-01-01T09:00:00Z',
    updatedAt: '2026-01-01T09:00:00Z',
  },
  {
    id: 'ORD-003',
    patientId: 'PAT-003',
    patientName: 'Martinez, Elena',
    patientMRN: 'MRN-11223',
    orderDate: '2026-01-01T10:00:00Z',
    modality: 'XR',
    bodyPart: 'Left Hand',
    procedure: 'X-Ray Left Hand, 2 Views',
    procedureCode: '73120',
    clinicalIndication: 'Trauma, rule out fracture',
    orderingPhysician: 'Dr. Lee',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    contrast: false,
    transportRequired: false,
    allergies: [],
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:30:00Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    let filteredOrders = [...orders];

    // Apply filters
    const status = searchParams.get('status');
    if (status) {
      filteredOrders = filteredOrders.filter(o => o.status === status);
    }

    const patientId = searchParams.get('patientId');
    if (patientId) {
      filteredOrders = filteredOrders.filter(o => o.patientId === patientId);
    }

    const modality = searchParams.get('modality');
    if (modality) {
      filteredOrders = filteredOrders.filter(o => o.modality === modality);
    }

    const priority = searchParams.get('priority');
    if (priority) {
      filteredOrders = filteredOrders.filter(o => o.priority === priority);
    }

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
      filteredOrders = filteredOrders.filter(o => {
        const orderDate = new Date(o.orderDate);
        return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
      });
    }

    return NextResponse.json(filteredOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newOrder = {
      id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
      ...body,
      status: body.status || 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.push(newOrder);

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
