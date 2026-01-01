import { NextRequest, NextResponse } from 'next/server';

// Mock database - replace with actual database in production
let worklistItems: any[] = [
  {
    id: 'WL-001',
    orderId: 'ORD-001',
    accessionNumber: 'ACC-2026-001',
    patientName: 'Johnson, Sarah',
    patientMRN: 'MRN-12345',
    patientDOB: '1985-03-15',
    patientSex: 'F',
    modality: 'CT',
    procedure: 'CT Chest with Contrast',
    scheduledDate: '2026-01-01',
    scheduledTime: '10:00:00',
    status: 'COMPLETED',
    priority: 'STAT',
    location: 'CT Room 1',
    technologist: 'Tech Smith',
    notes: 'Patient allergic to iodine contrast - use alternative',
    contrast: true,
    pregnancyStatus: 'NEGATIVE',
    transportRequired: false,
  },
  {
    id: 'WL-002',
    orderId: 'ORD-002',
    accessionNumber: 'ACC-2026-002',
    patientName: 'Davis, Michael',
    patientMRN: 'MRN-67890',
    patientDOB: '1972-08-22',
    patientSex: 'M',
    modality: 'MR',
    procedure: 'MRI Brain without Contrast',
    scheduledDate: '2026-01-02',
    scheduledTime: '10:00:00',
    status: 'SCHEDULED',
    priority: 'ROUTINE',
    location: 'MRI Suite 1',
    notes: '',
    contrast: false,
    pregnancyStatus: 'UNKNOWN',
    transportRequired: false,
  },
  {
    id: 'WL-003',
    orderId: 'ORD-003',
    accessionNumber: 'ACC-2026-003',
    patientName: 'Martinez, Elena',
    patientMRN: 'MRN-11223',
    patientDOB: '1990-05-10',
    patientSex: 'F',
    modality: 'XR',
    procedure: 'X-Ray Left Hand, 2 Views',
    scheduledDate: '2026-01-01',
    scheduledTime: '11:00:00',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    location: 'X-Ray Room 2',
    technologist: 'Tech Johnson',
    notes: 'Trauma patient',
    contrast: false,
    pregnancyStatus: 'NEGATIVE',
    transportRequired: false,
  },
  {
    id: 'WL-004',
    accessionNumber: 'ACC-2026-004',
    patientName: 'Brown, Robert',
    patientMRN: 'MRN-44556',
    patientDOB: '1968-11-30',
    patientSex: 'M',
    modality: 'US',
    procedure: 'Ultrasound Abdomen Complete',
    scheduledDate: '2026-01-01',
    scheduledTime: '14:00:00',
    status: 'CHECKED_IN',
    priority: 'ROUTINE',
    location: 'Ultrasound Room 1',
    notes: 'NPO since midnight',
    contrast: false,
    pregnancyStatus: 'UNKNOWN',
    transportRequired: false,
  },
  {
    id: 'WL-005',
    accessionNumber: 'ACC-2026-005',
    patientName: 'Williams, Jennifer',
    patientMRN: 'MRN-77889',
    patientDOB: '1995-02-14',
    patientSex: 'F',
    modality: 'XR',
    procedure: 'Chest X-Ray, 2 Views',
    scheduledDate: '2026-01-01',
    scheduledTime: '15:30:00',
    status: 'SCHEDULED',
    priority: 'ROUTINE',
    location: 'X-Ray Room 1',
    notes: '',
    contrast: false,
    pregnancyStatus: 'UNKNOWN',
    transportRequired: true,
    isolationPrecautions: 'Contact precautions - MRSA',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    let filteredItems = [...worklistItems];

    // Apply filters
    const modality = searchParams.get('modality');
    if (modality) {
      filteredItems = filteredItems.filter(item => item.modality === modality);
    }

    const date = searchParams.get('date');
    if (date) {
      filteredItems = filteredItems.filter(item => item.scheduledDate === date);
    }

    const status = searchParams.get('status');
    if (status) {
      filteredItems = filteredItems.filter(item => item.status === status);
    }

    const technologist = searchParams.get('technologist');
    if (technologist) {
      filteredItems = filteredItems.filter(item => item.technologist === technologist);
    }

    const priority = searchParams.get('priority');
    if (priority) {
      filteredItems = filteredItems.filter(item => item.priority === priority);
    }

    // Sort by scheduled time
    filteredItems.sort((a, b) => {
      const timeA = a.scheduledTime || '00:00:00';
      const timeB = b.scheduledTime || '00:00:00';
      return timeA.localeCompare(timeB);
    });

    return NextResponse.json(filteredItems);
  } catch (error) {
    console.error('Error fetching worklist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worklist' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newItem = {
      id: `WL-${String(worklistItems.length + 1).padStart(3, '0')}`,
      ...body,
      status: body.status || 'SCHEDULED',
    };

    worklistItems.push(newItem);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error creating worklist item:', error);
    return NextResponse.json(
      { error: 'Failed to create worklist item' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    const itemIndex = worklistItems.findIndex(item => item.id === id);

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Worklist item not found' },
        { status: 404 }
      );
    }

    worklistItems[itemIndex] = {
      ...worklistItems[itemIndex],
      ...updates,
    };

    return NextResponse.json(worklistItems[itemIndex]);
  } catch (error) {
    console.error('Error updating worklist item:', error);
    return NextResponse.json(
      { error: 'Failed to update worklist item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter required' },
        { status: 400 }
      );
    }

    const itemIndex = worklistItems.findIndex(item => item.id === id);

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Worklist item not found' },
        { status: 404 }
      );
    }

    worklistItems.splice(itemIndex, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting worklist item:', error);
    return NextResponse.json(
      { error: 'Failed to delete worklist item' },
      { status: 500 }
    );
  }
}
