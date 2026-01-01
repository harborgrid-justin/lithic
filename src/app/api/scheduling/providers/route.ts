import { NextRequest, NextResponse } from "next/server";

// Mock providers data - replace with actual database queries
const mockProviders = [
  {
    id: "pr1",
    name: "Dr. Sarah Johnson",
    specialty: "Family Medicine",
    email: "sarah.johnson@example.com",
    phone: "(555) 123-4567",
    department: "Primary Care",
    color: "#3B82F6",
    availability: [
      {
        id: "av1",
        providerId: "pr1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
      },
      {
        id: "av2",
        providerId: "pr1",
        dayOfWeek: 2,
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
      },
      {
        id: "av3",
        providerId: "pr1",
        dayOfWeek: 3,
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
      },
    ],
  },
  {
    id: "pr2",
    name: "Dr. Michael Chen",
    specialty: "Internal Medicine",
    email: "michael.chen@example.com",
    phone: "(555) 234-5678",
    department: "Primary Care",
    color: "#10B981",
    availability: [
      {
        id: "av4",
        providerId: "pr2",
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "16:00",
        isActive: true,
      },
      {
        id: "av5",
        providerId: "pr2",
        dayOfWeek: 3,
        startTime: "08:00",
        endTime: "16:00",
        isActive: true,
      },
      {
        id: "av6",
        providerId: "pr2",
        dayOfWeek: 5,
        startTime: "08:00",
        endTime: "16:00",
        isActive: true,
      },
    ],
  },
  {
    id: "pr3",
    name: "Dr. Emily Rodriguez",
    specialty: "Pediatrics",
    email: "emily.rodriguez@example.com",
    phone: "(555) 345-6789",
    department: "Pediatrics",
    color: "#F59E0B",
    availability: [
      {
        id: "av7",
        providerId: "pr3",
        dayOfWeek: 2,
        startTime: "10:00",
        endTime: "18:00",
        isActive: true,
      },
      {
        id: "av8",
        providerId: "pr3",
        dayOfWeek: 4,
        startTime: "10:00",
        endTime: "18:00",
        isActive: true,
      },
    ],
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q");

    let filtered = [...mockProviders];

    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(
        (provider) =>
          provider.name.toLowerCase().includes(query) ||
          provider.specialty.toLowerCase().includes(query) ||
          provider.department.toLowerCase().includes(query),
      );
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newProvider = {
      id: Math.random().toString(36).substr(2, 9),
      ...body,
      availability: [],
    };

    mockProviders.push(newProvider);

    return NextResponse.json(newProvider, { status: 201 });
  } catch (error) {
    console.error("Error creating provider:", error);
    return NextResponse.json(
      { error: "Failed to create provider" },
      { status: 500 },
    );
  }
}
