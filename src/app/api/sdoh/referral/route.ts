/**
 * SDOH Referral Management API Endpoints
 * SDOH & Care Coordination Specialist - Agent 7
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ReferralEngine,
  CreateReferralSchema,
  UpdateReferralSchema,
  ReferralPriority,
} from "@/lib/sdoh/referrals/referral-engine";

// Initialize referral engine (in production, integrate with database)
const referralEngine = new ReferralEngine();

// ============================================================================
// POST /api/sdoh/referral - Create Referral
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate and create referral
    const validatedData = CreateReferralSchema.parse(body);

    const referral = referralEngine.createReferral({
      ...validatedData,
      urgency: validatedData.urgency || ReferralPriority.ROUTINE,
    });

    // Send referral automatically if specified
    if (body.autoSend) {
      referralEngine.sendReferral(referral.id, validatedData.referringProviderId);
    }

    return NextResponse.json({
      success: true,
      data: {
        referral,
        message: body.autoSend ? "Referral created and sent" : "Referral created",
      },
    });
  } catch (error) {
    console.error("Referral creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid referral data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create referral" },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/sdoh/referral - Get Referrals
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referralId = searchParams.get("id");
    const patientId = searchParams.get("patientId");
    const organizationId = searchParams.get("organizationId");
    const status = searchParams.get("status");

    if (referralId) {
      // Get specific referral
      const referral = referralEngine.getReferral(referralId);

      if (!referral) {
        return NextResponse.json(
          { error: "Referral not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: referral,
      });
    }

    let referrals = [];

    if (patientId) {
      referrals = referralEngine.getPatientReferrals(patientId);
    } else if (organizationId) {
      referrals = referralEngine.getOrganizationReferrals(organizationId);
    } else if (status) {
      referrals = referralEngine.getReferralsByStatus(status as any);
    }

    return NextResponse.json({
      success: true,
      data: {
        referrals,
        total: referrals.length,
      },
    });
  } catch (error) {
    console.error("Referral retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve referrals" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/sdoh/referral - Update Referral
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = UpdateReferralSchema.parse(body);

    const referral = referralEngine.updateReferralStatus(validatedData);

    return NextResponse.json({
      success: true,
      data: referral,
    });
  } catch (error) {
    console.error("Referral update error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid update data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update referral" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/sdoh/referral/[action] - Referral Actions
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const schema = z.object({
      action: z.enum(["send", "accept", "reject", "complete", "cancel"]),
      referralId: z.string(),
      userId: z.string(),
      reason: z.string().optional(),
      outcome: z
        .object({
          serviceProvided: z.boolean(),
          needMet: z.boolean(),
          outcomeNotes: z.string(),
          patientSatisfaction: z.number().min(1).max(5).optional(),
        })
        .optional(),
    });

    const { action, referralId, userId, reason, outcome } = schema.parse(body);

    let referral;

    switch (action) {
      case "send":
        referral = referralEngine.sendReferral(referralId, userId);
        break;
      case "accept":
        referral = referralEngine.acceptReferral(referralId, userId);
        break;
      case "reject":
        if (!reason) {
          return NextResponse.json(
            { error: "Reason required for rejection" },
            { status: 400 }
          );
        }
        referral = referralEngine.rejectReferral(referralId, userId, reason);
        break;
      case "complete":
        if (!outcome) {
          return NextResponse.json(
            { error: "Outcome data required for completion" },
            { status: 400 }
          );
        }
        referral = referralEngine.completeReferral(referralId, userId, outcome);
        break;
      case "cancel":
        if (!reason) {
          return NextResponse.json(
            { error: "Reason required for cancellation" },
            { status: 400 }
          );
        }
        referral = referralEngine.cancelReferral(referralId, userId, reason);
        break;
    }

    return NextResponse.json({
      success: true,
      data: referral,
    });
  } catch (error) {
    console.error("Referral action error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid action data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to perform referral action" },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/sdoh/referral/analytics - Get Referral Analytics
// ============================================================================

export async function OPTIONS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    const analytics = referralEngine.getAnalytics(organizationId || undefined);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Analytics retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve analytics" },
      { status: 500 }
    );
  }
}
