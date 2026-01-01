import { NextRequest, NextResponse } from 'next/server';
import { authOptions, getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkPermission } from '@/lib/permissions';
import { registerUser } from '@/services/auth.service';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permission
    const hasPermission = await checkPermission({
      userId: session.user.id,
      resource: 'user',
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const where: any = {
      organizationId: (session.user as any).organizationId,
    };

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch users';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permission
    const hasPermission = await checkPermission({
      userId: session.user.id,
      resource: 'user',
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

    const userSchema = z.object({
      email: z.string().email(),
      password: z.string().min(12),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      roleId: z.string().optional(),
      title: z.string().optional(),
      npi: z.string().optional(),
    });

    const validatedData = userSchema.parse(body);

    const user = await registerUser({
      ...validatedData,
      organizationId: (session.user as any).organizationId,
    });

    return NextResponse.json(
      {
        success: true,
        data: user,
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

    const message = error instanceof Error ? error.message : 'Failed to create user';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
