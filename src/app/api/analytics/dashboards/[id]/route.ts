import { NextRequest, NextResponse } from "next/server";

// Mock database - in production, this would use a real database
const mockDashboards: Record<string, any> = {
  "dash-1": {
    id: "dash-1",
    name: "Executive Dashboard",
    description: "High-level overview of key metrics",
    type: "custom",
    widgets: [
      {
        id: "widget-1",
        type: "kpi",
        title: "Total Revenue",
        dataSource: "financial",
        config: { metrics: ["total_revenue"] },
      },
    ],
    layout: [{ widgetId: "widget-1", x: 0, y: 0, w: 3, h: 1 }],
    filters: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "admin",
    shared: true,
    tags: ["executive", "overview"],
  },
};

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/analytics/dashboards/[id]
 * Get a specific dashboard by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const dashboard = mockDashboards[id];

    if (!dashboard) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/analytics/dashboards/[id]
 * Update a dashboard
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!mockDashboards[id]) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 },
      );
    }

    const updatedDashboard = {
      ...mockDashboards[id],
      ...body,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    mockDashboards[id] = updatedDashboard;

    return NextResponse.json(updatedDashboard);
  } catch (error) {
    console.error("Error updating dashboard:", error);
    return NextResponse.json(
      { error: "Failed to update dashboard" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/analytics/dashboards/[id]
 * Delete a dashboard
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!mockDashboards[id]) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 },
      );
    }

    delete mockDashboards[id];

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting dashboard:", error);
    return NextResponse.json(
      { error: "Failed to delete dashboard" },
      { status: 500 },
    );
  }
}
