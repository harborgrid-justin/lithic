/**
 * Dashboard API Routes
 * CRUD operations for dashboards
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DashboardLayoutSchema } from '@/lib/dashboards/engine/dashboard-builder';

// Mock database - in production, this would use Prisma/database
const dashboards = new Map<string, any>();

// ============================================================================
// GET /api/dashboards
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');

    // Get all dashboards
    let results = Array.from(dashboards.values());

    // Filter by category
    if (category) {
      results = results.filter(d => d.category === category);
    }

    // Filter by user permissions
    if (userId) {
      results = results.filter(d => {
        if (!d.permissions) return true;
        if (d.permissions.users?.includes(userId)) return true;
        // Check role-based access here
        return false;
      });
    }

    // Sort by updated date
    results.sort((a, b) => {
      const aDate = new Date(a.metadata.updatedAt).getTime();
      const bDate = new Date(b.metadata.updatedAt).getTime();
      return bDate - aDate;
    });

    return NextResponse.json({
      dashboards: results,
      total: results.length,
    });
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboards' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/dashboards
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dashboard
    const dashboard = DashboardLayoutSchema.parse(body);

    // Check if dashboard already exists
    if (dashboards.has(dashboard.id)) {
      return NextResponse.json(
        { error: 'Dashboard already exists' },
        { status: 409 }
      );
    }

    // Save dashboard
    dashboards.set(dashboard.id, dashboard);

    return NextResponse.json(
      {
        dashboard,
        message: 'Dashboard created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid dashboard data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard' },
      { status: 500 }
    );
  }
}
