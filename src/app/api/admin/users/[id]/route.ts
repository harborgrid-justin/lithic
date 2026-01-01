import { NextRequest, NextResponse } from "next/server";
import { authOptions, getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";
import { logAudit, trackChanges } from "@/lib/audit";
import { z } from "zod";

// GET /api/admin/users/[id] - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const hasPermission = await checkPermission({
      userId: session.user.id,
      resource: "user",
      action: "read",
      organizationId: (session.user as any).organizationId,
    });

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        organization: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Check organization match
    if (user.organizationId !== (session.user as any).organizationId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch user";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const hasPermission = await checkPermission({
      userId: session.user.id,
      resource: "user",
      action: "write",
      organizationId: (session.user as any).organizationId,
    });

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();

    const updateSchema = z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      title: z.string().optional(),
      status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "LOCKED"]).optional(),
      npi: z.string().optional(),
    });

    const validatedData = updateSchema.parse(body);

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Check organization match
    if (currentUser.organizationId !== (session.user as any).organizationId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updatedBy: session.user.id,
      },
    });

    // Track changes for audit
    const changes = trackChanges(currentUser, updatedUser);

    // Log update
    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      resource: "User",
      resourceId: params.id,
      description: `User updated: ${updatedUser.email}`,
      changes,
      organizationId: (session.user as any).organizationId,
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}

// DELETE /api/admin/users/[id] - Deactivate user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const hasPermission = await checkPermission({
      userId: session.user.id,
      resource: "user",
      action: "delete",
      organizationId: (session.user as any).organizationId,
    });

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Check organization match
    if (user.organizationId !== (session.user as any).organizationId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // Soft delete
    const deletedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        status: "INACTIVE",
        deletedAt: new Date(),
        updatedBy: session.user.id,
      },
    });

    // Revoke all sessions
    await prisma.session.updateMany({
      where: { userId: params.id, status: "active" },
      data: {
        status: "revoked",
        logoutAt: new Date(),
        logoutReason: "User deactivated",
      },
    });

    // Log deletion
    await logAudit({
      userId: session.user.id,
      action: "DELETE",
      resource: "User",
      resourceId: params.id,
      description: `User deactivated: ${user.email}`,
      organizationId: (session.user as any).organizationId,
    });

    return NextResponse.json({
      success: true,
      data: deletedUser,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
