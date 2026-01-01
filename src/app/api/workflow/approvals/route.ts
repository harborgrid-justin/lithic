/**
 * Approvals API
 * Endpoints for managing approval requests
 */

import { NextRequest, NextResponse } from "next/server";
import { ApprovalStatus } from "@/types/workflow";
import { approvalManager } from "@/lib/workflow/approvals";

/**
 * GET /api/workflow/approvals
 * List approval requests
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type"); // "pending" | "history"

    let approvals;

    if (type === "pending" && userId) {
      approvals = approvalManager.getPendingApprovals(userId);
    } else if (type === "history" && userId) {
      approvals = approvalManager.getApprovalHistory(userId);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "User ID and type are required",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: approvals,
      meta: {
        total: approvals.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch approvals",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflow/approvals
 * Create an approval request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const approval = await approvalManager.createApprovalRequest({
      ...body,
      organizationId: body.organizationId || "default",
    });

    return NextResponse.json(
      {
        success: true,
        data: approval,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error instanceof Error ? error.message : "Invalid approval request",
        },
      },
      { status: 400 }
    );
  }
}

/**
 * PATCH /api/workflow/approvals
 * Approve or reject an approval request
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, userId, ...data } = body;

    let approval;

    switch (action) {
      case "approve":
        approval = await approvalManager.approve(
          id,
          userId,
          data.comments,
          data.signature
        );
        break;

      case "reject":
        approval = await approvalManager.reject(
          id,
          userId,
          data.reason,
          data.comments
        );
        break;

      case "comment":
        await approvalManager.addComment(id, userId, data.text, data.isInternal);
        // Fetch updated approval
        approval = approvalManager.getPendingApprovals(userId).find((a) => a.id === id);
        break;

      case "cancel":
        approval = await approvalManager.cancelRequest(id, userId, data.reason);
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
      data: approval,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to process approval",
        },
      },
      { status: 500 }
    );
  }
}
