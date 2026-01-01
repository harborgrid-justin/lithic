import { NextRequest, NextResponse } from 'next/server';

// Mock database - in production, this would use a real database
const mockReports = [
  {
    id: 'report-1',
    name: 'Monthly Quality Report',
    description: 'Comprehensive quality metrics report',
    type: 'quality',
    category: 'monthly',
    query: {
      metrics: ['readmission_rate', 'patient_satisfaction', 'infection_rate'],
      dimensions: ['department'],
    },
    format: 'pdf',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'admin',
    tags: ['quality', 'monthly'],
  },
];

/**
 * GET /api/analytics/reports
 * Get all reports with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let reports = [...mockReports];

    // Apply filters
    if (type) {
      reports = reports.filter(r => r.type === type);
    }

    if (status) {
      reports = reports.filter(r => r.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      reports = reports.filter(r =>
        r.name.toLowerCase().includes(searchLower) ||
        r.description?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/reports
 * Create a new report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newReport = {
      id: `report-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockReports.push(newReport);

    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
