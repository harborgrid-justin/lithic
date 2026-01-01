import { NextRequest, NextResponse } from "next/server";
import { populationHealthService } from "@/lib/services/population-health-service";
import {
  CreateRegistryDto,
  UpdateRegistryDto,
  RegistryEnrollmentRequest,
} from "@/types/population-health";

/**
 * GET /api/population-health/registries
 * List all patient registries for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId") || "default-org";
    const condition = searchParams.get("condition");
    const status = searchParams.get("status");

    const registries =
      await populationHealthService.getRegistries(organizationId);

    let filteredRegistries = registries;

    if (condition) {
      filteredRegistries = filteredRegistries.filter(
        (r) => r.condition === condition,
      );
    }

    if (status) {
      filteredRegistries = filteredRegistries.filter(
        (r) => r.status === status,
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredRegistries,
      meta: {
        total: filteredRegistries.length,
      },
    });
  } catch (error) {
    console.error("Error fetching registries:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "REGISTRY_FETCH_ERROR",
          message: "Failed to fetch patient registries",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/population-health/registries
 * Create a new patient registry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const organizationId = body.organizationId || "default-org";
    const userId = body.userId || "system";

    const registryDto: CreateRegistryDto = {
      name: body.name,
      description: body.description,
      condition: body.condition,
      icdCodes: body.icdCodes || [],
      snomedCodes: body.snomedCodes || [],
      criteria: body.criteria || [],
      autoUpdate: body.autoUpdate !== undefined ? body.autoUpdate : false,
      updateFrequency: body.updateFrequency || "DAILY",
      careTeam: body.careTeam || [],
      tags: body.tags || [],
    };

    // Validate required fields
    if (!registryDto.name || !registryDto.condition) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Name and condition are required",
          },
        },
        { status: 400 },
      );
    }

    const registry = await populationHealthService.createRegistry(
      registryDto,
      organizationId,
      userId,
    );

    return NextResponse.json(
      {
        success: true,
        data: registry,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating registry:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "REGISTRY_CREATE_ERROR",
          message: "Failed to create patient registry",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/population-health/registries
 * Update an existing patient registry
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId || "system";

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Registry ID is required",
          },
        },
        { status: 400 },
      );
    }

    const updateDto: UpdateRegistryDto = {
      id: body.id,
      name: body.name,
      description: body.description,
      icdCodes: body.icdCodes,
      snomedCodes: body.snomedCodes,
      criteria: body.criteria,
      autoUpdate: body.autoUpdate,
      updateFrequency: body.updateFrequency,
      careTeam: body.careTeam,
      tags: body.tags,
    };

    const registry = await populationHealthService.updateRegistry(
      updateDto,
      userId,
    );

    return NextResponse.json({
      success: true,
      data: registry,
    });
  } catch (error) {
    console.error("Error updating registry:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "REGISTRY_UPDATE_ERROR",
          message: "Failed to update patient registry",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/population-health/registries
 * Delete a patient registry (soft delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const registryId = searchParams.get("id");

    if (!registryId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Registry ID is required",
          },
        },
        { status: 400 },
      );
    }

    await populationHealthService.deleteRegistry(registryId);

    return NextResponse.json({
      success: true,
      data: {
        message: "Registry deleted successfully",
      },
    });
  } catch (error) {
    console.error("Error deleting registry:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "REGISTRY_DELETE_ERROR",
          message: "Failed to delete patient registry",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 },
    );
  }
}
