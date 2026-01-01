/**
 * Widget Data API Route
 * Fetch data for dashboard widgets
 */

import { NextRequest, NextResponse } from 'next/server';
import { dataConnector } from '@/lib/dashboards/engine/data-connector';

// Mock data generators
const generateMockData = (type: string) => {
  switch (type) {
    case 'revenue':
      return Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
        revenue: Math.floor(Math.random() * 1000000) + 500000,
        target: 800000,
      }));

    case 'kpi':
      return {
        value: Math.floor(Math.random() * 100),
        previousValue: Math.floor(Math.random() * 100),
        trend: Math.random() > 0.5 ? 'up' : 'down',
        change: Math.floor(Math.random() * 20) - 10,
      };

    case 'patient-volume':
      return Array.from({ length: 30 }, (_, i) => ({
        date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
        admissions: Math.floor(Math.random() * 50) + 20,
        discharges: Math.floor(Math.random() * 50) + 20,
        census: Math.floor(Math.random() * 200) + 150,
      }));

    case 'department-performance':
      return [
        { department: 'Emergency', score: 85, target: 90 },
        { department: 'Surgery', score: 92, target: 90 },
        { department: 'ICU', score: 88, target: 90 },
        { department: 'Cardiology', score: 94, target: 90 },
        { department: 'Oncology', score: 91, target: 90 },
      ];

    case 'payer-mix':
      return [
        { payer: 'Medicare', percentage: 45, amount: 4500000 },
        { payer: 'Medicaid', percentage: 20, amount: 2000000 },
        { payer: 'Commercial', percentage: 30, amount: 3000000 },
        { payer: 'Self-Pay', percentage: 5, amount: 500000 },
      ];

    default:
      return [];
  }
};

// ============================================================================
// POST /api/dashboards/widgets
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { widgetId, dataSource, filters, config } = body;

    // In production, this would fetch from actual data sources
    let data;

    if (dataSource.type === 'api' && dataSource.endpoint) {
      try {
        data = await dataConnector.fetchFromAPI(
          dataSource.endpoint,
          {
            method: 'POST',
            body: JSON.stringify({ filters, config }),
          }
        );
      } catch (error) {
        // Fallback to mock data if API fails
        console.error('API fetch failed, using mock data:', error);
        data = generateMockData(config?.mockType || 'kpi');
      }
    } else if (dataSource.type === 'static') {
      data = dataSource.data || generateMockData(config?.mockType || 'kpi');
    } else {
      // Generate mock data based on widget type
      data = generateMockData(config?.mockType || 'kpi');
    }

    return NextResponse.json({
      widgetId,
      data,
      timestamp: new Date().toISOString(),
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching widget data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget data' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/dashboards/widgets
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const widgetId = searchParams.get('widgetId');
    const type = searchParams.get('type') || 'kpi';

    if (!widgetId) {
      return NextResponse.json(
        { error: 'Widget ID is required' },
        { status: 400 }
      );
    }

    // Generate mock data
    const data = generateMockData(type);

    return NextResponse.json({
      widgetId,
      data,
      timestamp: new Date().toISOString(),
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching widget data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget data' },
      { status: 500 }
    );
  }
}
