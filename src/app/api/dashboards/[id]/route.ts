/**
 * Individual Dashboard API Routes
 * GET, PUT, DELETE operations for specific dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DashboardLayoutSchema } from '@/lib/dashboards/engine/dashboard-builder';

// Mock database
const dashboards = new Map<string, any>();

// ============================================================================
// GET /api/dashboards/[id]
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const dashboard = dashboards.get(id);

    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ dashboard });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/dashboards/[id]
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate dashboard
    const dashboard = DashboardLayoutSchema.parse(body);

    // Check if IDs match
    if (dashboard.id !== id) {
      return NextResponse.json(
        { error: 'Dashboard ID mismatch' },
        { status: 400 }
      );
    }

    // Update dashboard
    dashboards.set(id, dashboard);

    return NextResponse.json({
      dashboard,
      message: 'Dashboard updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid dashboard data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to update dashboard' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/dashboards/[id]
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!dashboards.has(id)) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      );
    }

    dashboards.delete(id);

    return NextResponse.json({
      message: 'Dashboard deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to delete dashboard' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/dashboards/[id]
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const dashboard = dashboards.get(id);

    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      );
    }

    // Merge updates
    const updated = {
      ...dashboard,
      ...body,
      metadata: {
        ...dashboard.metadata,
        updatedAt: new Date().toISOString(),
        version: dashboard.metadata.version + 1,
      },
    };

    // Validate
    const validated = DashboardLayoutSchema.parse(updated);

    dashboards.set(id, validated);

    return NextResponse.json({
      dashboard: validated,
      message: 'Dashboard updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid dashboard data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error patching dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to update dashboard' },
      { status: 500 }
    );
  }
}
