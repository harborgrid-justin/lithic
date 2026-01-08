/**
 * SDOH Referrals API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { referralManager } from "@/lib/sdoh/referral-manager";
import type { CreateReferralDto } from "@/types/sdoh";

export async function POST(request: NextRequest) {
  try {
    const body: CreateReferralDto = await request.json();

    // Create referral
    const referral = await referralManager.createReferral({
      ...body,
      organizationId: "org_1",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: "current-user",
      updatedBy: "current-user",
      referredBy: "current-user",
      referredDate: new Date(),
    });

    // Save to database (simulated)
    // await db.referrals.create(referral);

    return NextResponse.json(
      { success: true, referral },
      { status: 201 }
    );
  } catch (error) {
    console.error("Referral creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create referral" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");

    // Fetch referrals from database (simulated)
    const referrals: any[] = [];

    return NextResponse.json({
      success: true,
      referrals,
      total: referrals.length,
    });
  } catch (error) {
    console.error("Referral fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}
