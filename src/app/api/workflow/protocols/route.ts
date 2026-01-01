/**
 * Care Protocols API
 * Endpoints for managing care protocols
 */

import { NextRequest, NextResponse } from "next/server";
import { ProtocolStatus, ProtocolCategory } from "@/types/workflow";
import { careProtocolManager } from "@/lib/workflow/care-protocols";

/**
 * GET /api/workflow/protocols
 * List care protocols
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const condition = searchParams.get("condition");
    const icd10 = searchParams.get("icd10");

    let protocols: any[] = [];

    if (condition) {
      protocols = careProtocolManager.getProtocolsByCondition(condition);
    } else if (icd10) {
      protocols = careProtocolManager.getProtocolsByICD10(icd10);
    } else {
      protocols = careProtocolManager.getActiveExecutions();
    }

    return NextResponse.json({
      success: true,
      data: protocols,
      meta: {
        total: protocols.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch protocols",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflow/protocols
 * Create a new care protocol
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const protocol = await careProtocolManager.createProtocol({
      ...body,
      organizationId: body.organizationId || "default",
      createdBy: body.createdBy || "system",
    });

    return NextResponse.json(
      {
        success: true,
        data: protocol,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error instanceof Error ? error.message : "Invalid protocol data",
        },
      },
      { status: 400 }
    );
  }
}

/**
 * PATCH /api/workflow/protocols
 * Update protocol or execution
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type, action, ...data } = body;

    if (type === "execution") {
      let execution;

      switch (action) {
        case "complete_step":
          execution = await careProtocolManager.completeStep(id, data.stepId, {
            userId: data.userId,
            isVariance: data.isVariance || false,
            varianceType: data.varianceType,
            varianceReason: data.varianceReason,
          });
          break;

        case "record_variance":
          await careProtocolManager.recordVariance(id, {
            stepId: data.stepId,
            type: data.varianceType,
            reason: data.reason,
            documentedBy: data.userId,
            approved: false,
          });
          break;

        case "record_outcome":
          await careProtocolManager.recordOutcome(id, {
            outcomeId: data.outcomeId,
            value: data.value,
            achievedTarget: data.achievedTarget,
            measuredBy: data.userId,
            notes: data.notes,
          });
          break;

        case "complete":
          execution = await careProtocolManager.completeExecution(id, data.userId);
          break;

        case "discontinue":
          execution = await careProtocolManager.discontinueExecution(
            id,
            data.reason,
            data.userId
          );
          break;

        case "hold":
          execution = await careProtocolManager.holdExecution(
            id,
            data.reason,
            data.userId
          );
          break;

        case "resume":
          execution = await careProtocolManager.resumeExecution(id, data.userId);
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

      return NextResponse.json({
        success: true,
        data: execution,
      });
    } else {
      // Protocol activation
      if (action === "activate") {
        const protocol = await careProtocolManager.activateProtocol(id, data.userId);
        return NextResponse.json({
          success: true,
          data: protocol,
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TYPE",
            message: "Invalid type specified",
          },
        },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PROTOCOL_ERROR",
          message: error instanceof Error ? error.message : "Failed to update protocol",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflow/protocols/start
 * Start a protocol execution
 */
export async function POST_START(request: NextRequest) {
  try {
    const body = await request.json();
    const { protocolId, patientId, encounterId, userId, workflowDefinition } = body;

    const execution = await careProtocolManager.startProtocolExecution(protocolId, {
      userId,
      patientId,
      encounterId,
      organizationId: body.organizationId || "default",
      workflowDefinition,
    });

    return NextResponse.json(
      {
        success: true,
        data: execution,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PROTOCOL_ERROR",
          message: error instanceof Error ? error.message : "Failed to start protocol",
        },
      },
      { status: 500 }
    );
  }
}
