import { NextRequest, NextResponse } from 'next/server';
import { addDays, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const resourceId = searchParams.get('resourceId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const duration = parseInt(searchParams.get('duration') || '30');

    if (!date && (!startDate || !endDate)) {
      return NextResponse.json({ error: 'Date or date range required' }, { status: 400 });
    }

    // Mock availability data - replace with actual database queries
    const generateSlots = (date: string) => {
      const slots = [];
      const baseDate = new Date(date);

      for (let hour = 9; hour < 17; hour++) {
        const start = new Date(baseDate);
        start.setHours(hour, 0, 0, 0);

        const end = new Date(start);
        end.setMinutes(duration);

        slots.push({
          start: start.toISOString(),
          end: end.toISOString(),
          isAvailable: Math.random() > 0.3, // 70% availability rate
          providerId,
          resourceId,
        });
      }

      return slots;
    };

    if (date) {
      const slots = generateSlots(date);
      return NextResponse.json(slots);
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const slotsRange: Record<string, any[]> = {};

      let currentDate = start;
      while (currentDate <= end) {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        slotsRange[dateKey] = generateSlots(dateKey);
        currentDate = addDays(currentDate, 1);
      }

      return NextResponse.json(slotsRange);
    }

    return NextResponse.json({});
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
