import { NextRequest, NextResponse } from 'next/server';
import { authOptions, getServerSession } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import {
  getAuditHistory,
  getAuditAnalytics,
  generateComplianceReport,
  exportComplianceLogs,
} from '@/services/audit.service';

// GET /api/admin/audit - Get audit logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const hasPermission = await checkPermission({
      userId: session.user.id,
      resource: 'audit',
      action: 'read',
      organizationId: (session.user as any).organizationId,
    });

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || undefined;

    switch (action) {
      case 'analytics': {
        const startDate = searchParams.get('startDate')
          ? new Date(searchParams.get('startDate')!)
          : undefined;
        const endDate = searchParams.get('endDate')
          ? new Date(searchParams.get('endDate')!)
          : undefined;

        const analytics = await getAuditAnalytics({
          organizationId: (session.user as any).organizationId,
          startDate,
          endDate,
        });

        return NextResponse.json({
          success: true,
          data: analytics,
        });
      }

      case 'export': {
        const startDate = new Date(searchParams.get('startDate')!);
        const endDate = new Date(searchParams.get('endDate')!);
        const format = (searchParams.get('format') || 'json') as 'json' | 'csv';

        const exported = await exportComplianceLogs({
          organizationId: (session.user as any).organizationId,
          startDate,
          endDate,
          format,
        });

        return new NextResponse(exported, {
          headers: {
            'Content-Type': format === 'csv' ? 'text/csv' : 'application/json',
            'Content-Disposition': `attachment; filename="audit-logs-${startDate.toISOString()}-${endDate.toISOString()}.${format}"`,
          },
        });
      }

      default: {
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const userId = searchParams.get('userId') || undefined;
        const resource = searchParams.get('resource') || undefined;
        const actionFilter = searchParams.get('actionFilter') || undefined;
        const isPHIAccess = searchParams.get('isPHIAccess')
          ? searchParams.get('isPHIAccess') === 'true'
          : undefined;
        const startDate = searchParams.get('startDate')
          ? new Date(searchParams.get('startDate')!)
          : undefined;
        const endDate = searchParams.get('endDate')
          ? new Date(searchParams.get('endDate')!)
          : undefined;
        const searchTerm = searchParams.get('search') || undefined;

        const result = await getAuditHistory({
          organizationId: (session.user as any).organizationId,
          userId,
          resource,
          action: actionFilter,
          isPHIAccess,
          startDate,
          endDate,
          page,
          limit,
          searchTerm,
        });

        return NextResponse.json({
          success: true,
          data: result.logs,
          pagination: result.pagination,
        });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch audit logs';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/admin/audit - Generate compliance report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const hasPermission = await checkPermission({
      userId: session.user.id,
      resource: 'audit',
      action: 'admin',
      organizationId: (session.user as any).organizationId,
    });

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { startDate, endDate, reportType } = body;

    const report = await generateComplianceReport({
      organizationId: (session.user as any).organizationId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reportType: reportType || 'GENERAL',
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate report';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
