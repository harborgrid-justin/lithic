import { NextRequest, NextResponse } from 'next/server';

// Mock resources data
const mockResources = [
  {
    id: 'r1',
    name: 'Exam Room 101',
    type: 'room',
    description: 'Standard examination room',
    location: 'Building A, Floor 1',
    capacity: 1,
    isAvailable: true,
    availability: [
      {
        id: 'ra1',
        resourceId: 'r1',
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '18:00',
        isActive: true,
      },
    ],
  },
  {
    id: 'r2',
    name: 'Procedure Room 201',
    type: 'room',
    description: 'Minor procedures and surgeries',
    location: 'Building A, Floor 2',
    capacity: 2,
    isAvailable: true,
    availability: [],
  },
  {
    id: 'r3',
    name: 'Ultrasound Machine',
    type: 'equipment',
    description: 'Portable ultrasound unit',
    location: 'Imaging Department',
    isAvailable: true,
    availability: [],
  },
];

export async function GET() {
  try {
    return NextResponse.json(mockResources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newResource = {
      id: Math.random().toString(36).substr(2, 9),
      ...body,
      availability: [],
    };

    mockResources.push(newResource);

    return NextResponse.json(newResource, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}
