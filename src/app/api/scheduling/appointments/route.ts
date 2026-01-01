import { NextRequest, NextResponse } from 'next/server';

// Mock data - replace with actual database queries
const mockAppointments = [
  {
    id: '1',
    patientId: 'p1',
    providerId: 'pr1',
    type: 'consultation',
    status: 'scheduled',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 30 * 60000).toISOString(),
    duration: 30,
    title: 'Initial Consultation',
    isRecurring: false,
    remindersSent: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const patientId = searchParams.get('patientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Filter appointments based on query params
    let filtered = [...mockAppointments];

    if (providerId) {
      filtered = filtered.filter((apt) => apt.providerId === providerId);
    }
    if (patientId) {
      filtered = filtered.filter((apt) => apt.patientId === patientId);
    }
    if (status) {
      filtered = filtered.filter((apt) => apt.status === status);
    }
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.startTime);
        return aptDate >= start && aptDate <= end;
      });
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.patientId || !body.providerId || !body.startTime || !body.duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create new appointment
    const newAppointment = {
      id: Math.random().toString(36).substr(2, 9),
      ...body,
      status: 'scheduled',
      endTime: new Date(
        new Date(body.startTime).getTime() + body.duration * 60000
      ).toISOString(),
      isRecurring: body.isRecurring || false,
      remindersSent: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user',
    };

    mockAppointments.push(newAppointment);

    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}
