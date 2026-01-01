import { NextRequest, NextResponse } from "next/server";
import { authOptions, getServerSession } from "@/lib/auth";
import { checkPermission, isAdmin } from "@/lib/permissions";
import {
  getOrganization,
  updateOrganizationSettings,
  getOrganizationStats,
} from "@/services/organization.service";
import { z } from "zod";

// GET /api/admin/organizations - Get organization details
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "stats") {
      const stats = await getOrganizationStats(
        (session.user as any).organizationId,
      );

      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    const organization = await getOrganization(
      (session.user as any).organizationId,
    );

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: organization,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch organization";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/organizations - Update organization settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(session.user.id);

    if (!userIsAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();

    const settingsSchema = z.object({
      mfaRequired: z.boolean().optional(),
      sessionTimeout: z.number().optional(),
      passwordPolicy: z
        .object({
          minLength: z.number().optional(),
          requireUppercase: z.boolean().optional(),
          requireLowercase: z.boolean().optional(),
          requireNumbers: z.boolean().optional(),
          requireSpecialChars: z.boolean().optional(),
          expiryDays: z.number().optional(),
        })
        .optional(),
      ipWhitelist: z.array(z.string()).optional(),
    });

    const validatedData = settingsSchema.parse(body);

    const organization = await updateOrganizationSettings(
      (session.user as any).organizationId,
      validatedData,
      session.user.id,
    );

    return NextResponse.json({
      success: true,
      data: organization,
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
      error instanceof Error ? error.message : "Failed to update organization";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
