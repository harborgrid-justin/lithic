import { NextRequest, NextResponse } from 'next/server';

// Mock database - in production, this would use a real database
const mockDashboards = [
  {
    id: 'dash-1',
    name: 'Executive Dashboard',
    description: 'High-level overview of key metrics',
    type: 'custom',
    widgets: [],
    layout: [],
    filters: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'admin',
    shared: true,
    tags: ['executive', 'overview'],
  },
];

/**
 * GET /api/analytics/dashboards
 * Get all dashboards with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const shared = searchParams.get('shared');

    let dashboards = [...mockDashboards];

    // Apply filters
    if (type) {
      dashboards = dashboards.filter(d => d.type === type);
    }

    if (shared !== null) {
      dashboards = dashboards.filter(d => d.shared === (shared === 'true'));
    }

    return NextResponse.json(dashboards);
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboards' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/dashboards
 * Create a new dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newDashboard = {
      id: `dash-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockDashboards.push(newDashboard);

    return NextResponse.json(newDashboard, { status: 201 });
  } catch (error) {
    console.error('Error creating dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard' },
      { status: 500 }
    );
  }
}
