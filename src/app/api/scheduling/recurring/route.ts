import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.recurrenceRule) {
      return NextResponse.json({ error: 'Recurrence rule required' }, { status: 400 });
    }

    // Generate recurring appointments based on the rule
    const { frequency, interval, endDate, occurrences } = body.recurrenceRule;

    const appointments = [];
    const baseStartTime = new Date(body.startTime);
    let currentDate = new Date(baseStartTime);
    let count = 0;
    const maxOccurrences = occurrences || 52; // Default to 1 year for weekly

    while (count < maxOccurrences) {
      if (endDate && currentDate > new Date(endDate)) {
        break;
      }

      const appointment = {
        id: Math.random().toString(36).substr(2, 9),
        ...body,
        startTime: currentDate.toISOString(),
        endTime: new Date(currentDate.getTime() + body.duration * 60000).toISOString(),
        isRecurring: true,
        recurringSeriesId: `series-${Date.now()}`,
      };

      appointments.push(appointment);

      // Calculate next occurrence
      if (frequency === 'daily') {
        currentDate = new Date(currentDate.getTime() + interval * 24 * 60 * 60 * 1000);
      } else if (frequency === 'weekly') {
        currentDate = new Date(currentDate.getTime() + interval * 7 * 24 * 60 * 60 * 1000);
      } else if (frequency === 'biweekly') {
        currentDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      } else if (frequency === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + interval);
      } else if (frequency === 'yearly') {
        currentDate.setFullYear(currentDate.getFullYear() + interval);
      }

      count++;
    }

    const series = {
      id: `series-${Date.now()}`,
      templateAppointmentId: appointments[0]?.id,
      recurrenceRule: body.recurrenceRule,
      appointments,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(series, { status: 201 });
  } catch (error) {
    console.error('Error creating recurring appointments:', error);
    return NextResponse.json(
      { error: 'Failed to create recurring appointments' },
      { status: 500 }
    );
  }
}
