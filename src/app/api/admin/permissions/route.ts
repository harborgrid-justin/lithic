import { NextRequest, NextResponse } from "next/server";
import { authOptions, getServerSession } from "@/lib/auth";
import {
  checkPermission,
  getPermissionMatrix,
  assignRole,
  grantAccess,
} from "@/lib/permissions";
import { z } from "zod";

// GET /api/admin/permissions - Get permission matrix
export async function GET(request: NextRequest) {
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
      resource: "permission",
      action: "read",
      organizationId: (session.user as any).organizationId,
    });

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const matrix = await getPermissionMatrix(
      (session.user as any).organizationId,
    );

    return NextResponse.json({
      success: true,
      data: matrix,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch permissions";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

// POST /api/admin/permissions - Grant permission or assign role
export async function POST(request: NextRequest) {
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
      resource: "permission",
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
    const { type } = body;

    if (type === "assign-role") {
      const schema = z.object({
        userId: z.string(),
        roleId: z.string(),
      });

      const { userId, roleId } = schema.parse(body);

      const result = await assignRole(userId, roleId);

      return NextResponse.json({
        success: true,
        data: result,
      });
    } else if (type === "grant-access") {
      const schema = z.object({
        userId: z.string(),
        resource: z.string(),
        resourceId: z.string(),
        action: z.string(),
        expiresAt: z.string().transform((val) => new Date(val)),
        reason: z.string().optional(),
      });

      const data = schema.parse(body);

      const result = await grantAccess({
        ...data,
        grantedBy: session.user.id,
      });

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid permission type" },
      { status: 400 },
    );
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
      error instanceof Error ? error.message : "Failed to grant permission";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
