/**
 * Workflow Instances API
 * Endpoints for managing workflow instances
 */

import { NextRequest, NextResponse } from "next/server";
import { WorkflowInstanceStatus } from "@/types/workflow";
import { workflowEngine } from "@/lib/workflow/engine";

/**
 * GET /api/workflow/instances
 * List workflow instances
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // In production, this would query from database
    // For now, returning empty array as instances are in-memory
    const instances: any[] = [];

    return NextResponse.json({
      success: true,
      data: instances,
      meta: {
        total: instances.length,
        limit,
        offset,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch workflow instances",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflow/instances
 * Start a new workflow instance
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowDefinitionId, context, variables } = body;

    if (!workflowDefinitionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Workflow definition ID is required",
          },
        },
        { status: 400 }
      );
    }

    // In production, fetch workflow definition from database
    const workflowDefinition = {
      id: workflowDefinitionId,
      // ... other properties would be loaded from DB
    };

    const instance = await workflowEngine.startWorkflow(
      workflowDefinition as any,
      context,
      variables
    );

    return NextResponse.json(
      {
        success: true,
        data: instance,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "WORKFLOW_ERROR",
          message: error instanceof Error ? error.message : "Failed to start workflow",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workflow/instances
 * Update a workflow instance
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...data } = body;

    switch (action) {
      case "cancel":
        await workflowEngine.cancelWorkflow(id, data.reason);
        break;

      case "complete_task":
        await workflowEngine.completeTask(id, data.nodeId, data.output);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_ACTION",
              message: "Invalid action specified",
            },
          },
          { status: 400 }
        );
    }

    const instance = workflowEngine.getInstance(id);

    return NextResponse.json({
      success: true,
      data: instance,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "WORKFLOW_ERROR",
          message: error instanceof Error ? error.message : "Failed to update workflow instance",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workflow/instances/[id]/executions
 * Get node executions for a workflow instance
 */
export async function GET_EXECUTIONS(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const instanceId = params.id;
    const executions = workflowEngine.getNodeExecutions(instanceId);

    return NextResponse.json({
      success: true,
      data: executions,
      meta: {
        total: executions.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch node executions",
        },
      },
      { status: 500 }
    );
  }
}
