import { NextRequest, NextResponse } from "next/server";
import { organizationService } from "@/lib/services/organization-service";
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from "@/types/enterprise";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const parentId = searchParams.get("parentId");
    const includeHierarchy = searchParams.get("hierarchy") === "true";

    // Get specific organization
    if (id) {
      if (includeHierarchy) {
        const hierarchy =
          await organizationService.getOrganizationHierarchy(id);
        return NextResponse.json({
          success: true,
          data: hierarchy,
        });
      } else {
        const organization = await organizationService.getOrganization(id);
        if (!organization) {
          return NextResponse.json(
            {
              success: false,
              error: { code: "NOT_FOUND", message: "Organization not found" },
            },
            { status: 404 },
          );
        }
        return NextResponse.json({
          success: true,
          data: organization,
        });
      }
    }

    // Get organizations by parent
    if (parentId !== null) {
      const organizations = await organizationService.getOrganizationsByParent(
        parentId === "null" ? null : parentId,
      );
      return NextResponse.json({
        success: true,
        data: organizations,
      });
    }

    // Get all root organizations
    const rootOrganizations =
      await organizationService.getOrganizationsByParent(null);
    return NextResponse.json({
      success: true,
      data: rootOrganizations,
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch organizations",
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: CreateOrganizationDto = await request.json();

    // Validate required fields
    if (!data.name || !data.type || !data.npi || !data.taxId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing required fields",
          },
        },
        { status: 400 },
      );
    }

    // Get user ID from session (mock for now)
    const userId = "current-user-id";

    const organization = await organizationService.createOrganization(
      data,
      userId,
    );

    return NextResponse.json(
      {
        success: true,
        data: organization,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create organization",
        },
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data: UpdateOrganizationDto = await request.json();

    if (!data.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Organization ID is required",
          },
        },
        { status: 400 },
      );
    }

    const userId = "current-user-id";
    const organization = await organizationService.updateOrganization(
      data,
      userId,
    );

    return NextResponse.json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    console.error("Error updating organization:", error);

    if (error.message === "Organization not found") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: error.message,
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update organization",
        },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Organization ID is required",
          },
        },
        { status: 400 },
      );
    }

    const userId = "current-user-id";
    await organizationService.deleteOrganization(id, userId);

    return NextResponse.json({
      success: true,
      data: { message: "Organization deleted successfully" },
    });
  } catch (error: any) {
    console.error("Error deleting organization:", error);

    if (error.message === "Organization not found") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: error.message,
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete organization",
        },
      },
      { status: 500 },
    );
  }
}
