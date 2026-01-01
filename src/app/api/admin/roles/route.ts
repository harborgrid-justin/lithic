import { NextRequest, NextResponse } from 'next/server';
import { authOptions, getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkPermission, createRole, updateRolePermissions } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

// GET /api/admin/roles - List all roles
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
      resource: 'role',
      action: 'read',
      organizationId: (session.user as any).organizationId,
    });

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const roles = await prisma.role.findMany({
      where: {
        organizationId: (session.user as any).organizationId,
      },
      include: {
        users: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: roles.map((role) => ({
        ...role,
        userCount: role.users.length,
        users: undefined, // Remove users array from response
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch roles';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/admin/roles - Create new role
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
      resource: 'role',
      action: 'write',
      organizationId: (session.user as any).organizationId,
    });

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const roleSchema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      permissions: z.array(
        z.object({
          resource: z.string(),
          action: z.string(),
          scope: z.enum(['OWN', 'DEPARTMENT', 'ORGANIZATION', 'ALL']),
          conditions: z.any().optional(),
        })
      ),
    });

    const validatedData = roleSchema.parse(body);

    // Note: createRole function needs to be adapted for the current schema
    // For now, create role directly
    const role = await prisma.role.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || '',
        organizationId: (session.user as any).organizationId,
        permissions: validatedData.permissions,
        isSystemRole: false,
        color: '#6366F1',
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
    });

    // Log creation
    await logAudit({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'Role',
      resourceId: role.id,
      description: `Role created: ${role.name}`,
      metadata: { name: role.name, permissions: validatedData.permissions },
      organizationId: (session.user as any).organizationId,
    });

    return NextResponse.json(
      {
        success: true,
        data: role,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to create role';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

// PATCH /api/admin/roles/[id] - Update role (would need separate file)
// DELETE /api/admin/roles/[id] - Delete role (would need separate file)
