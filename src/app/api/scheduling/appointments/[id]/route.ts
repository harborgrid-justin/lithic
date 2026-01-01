import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Mock appointment data - replace with actual database query
    const appointment = {
      id,
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
    };

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    // Update appointment - replace with actual database update
    const updatedAppointment = {
      id,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Delete appointment - replace with actual database deletion
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
  }
}
