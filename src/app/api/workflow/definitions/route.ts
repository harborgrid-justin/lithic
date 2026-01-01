/**
 * Workflow Definitions API
 * Endpoints for managing workflow definitions
 */

import { NextRequest, NextResponse } from "next/server";
import { WorkflowDefinition, WorkflowStatus } from "@/types/workflow";

// In production, these would interact with a database
const workflowDefinitions: WorkflowDefinition[] = [];

/**
 * GET /api/workflow/definitions
 * List all workflow definitions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    let filtered = workflowDefinitions;

    if (status) {
      filtered = filtered.filter((w) => w.status === status);
    }

    if (category) {
      filtered = filtered.filter((w) => w.category === category);
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      meta: {
        total: filtered.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch workflow definitions",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflow/definitions
 * Create a new workflow definition
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const workflow: WorkflowDefinition = {
      id: `wf-${Date.now()}`,
      ...body,
      status: body.status || WorkflowStatus.DRAFT,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    workflowDefinitions.push(workflow);

    return NextResponse.json(
      {
        success: true,
        data: workflow,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid workflow definition",
        },
      },
      { status: 400 }
    );
  }
}

/**
 * PUT /api/workflow/definitions
 * Update a workflow definition
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    const index = workflowDefinitions.findIndex((w) => w.id === id);
    if (index === -1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Workflow definition not found",
          },
        },
        { status: 404 }
      );
    }

    workflowDefinitions[index] = {
      ...workflowDefinitions[index],
      ...updates,
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: workflowDefinitions[index],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update workflow definition",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflow/definitions
 * Delete a workflow definition
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Workflow ID is required",
          },
        },
        { status: 400 }
      );
    }

    const index = workflowDefinitions.findIndex((w) => w.id === id);
    if (index === -1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Workflow definition not found",
          },
        },
        { status: 404 }
      );
    }

    workflowDefinitions.splice(index, 1);

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete workflow definition",
        },
      },
      { status: 500 }
    );
  }
}
