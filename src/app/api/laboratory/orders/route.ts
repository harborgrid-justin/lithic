import { NextRequest, NextResponse } from 'next/server';
import { LabOrder, OrderStatus } from '@/types/laboratory';

// Mock database - in production, replace with actual database
let orders: LabOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-2026001-001',
    patientId: 'PT001',
    patientName: 'John Doe',
    patientDOB: new Date('1980-05-15'),
    patientGender: 'M',
    patientMRN: 'MRN001234',
    orderingPhysician: 'Dr. Sarah Smith',
    orderingPhysicianNPI: '1234567890',
    status: 'PENDING',
    priority: 'ROUTINE',
    tests: ['6690-2', '718-7', '777-3'],
    panels: ['CBC'],
    diagnosis: 'Annual physical examination',
    diagnosisCodes: ['Z00.00'],
    specimenType: 'BLOOD',
    orderDate: new Date(),
    department: 'Hematology',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as OrderStatus | null;
    const patientId = searchParams.get('patientId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let filteredOrders = [...orders];

    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }

    if (patientId) {
      filteredOrders = filteredOrders.filter(order => order.patientId === patientId);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredOrders = filteredOrders.filter(order => new Date(order.orderDate) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      filteredOrders = filteredOrders.filter(order => new Date(order.orderDate) <= toDate);
    }

    return NextResponse.json(filteredOrders);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newOrder: LabOrder = {
      id: `${orders.length + 1}`,
      orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    orders.push(newOrder);

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
