import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Claim } from "@/types/billing";
import { generateClaimNumber } from "@/lib/billing-utils";

// GET /api/billing/claims - List all claims
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const patientId = searchParams.get("patientId");

    let claims = await db.claims.findAll();

    // Apply filters
    if (status) {
      claims = claims.filter((c) => c.status === status);
    }
    if (patientId) {
      claims = claims.filter((c) => c.patientId === patientId);
    }

    return NextResponse.json(claims);
  } catch (error) {
    console.error("Error fetching claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 },
    );
  }
}

// POST /api/billing/claims - Create a new claim
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const claimData: Omit<Claim, "id" | "createdAt" | "updatedAt"> = {
      claimNumber: generateClaimNumber(),
      status: "draft",
      totalAmount: 0,
      ...body,
    };

    // Calculate total amount from codes
    if (claimData.codes && claimData.codes.length > 0) {
      claimData.totalAmount = claimData.codes.reduce(
        (sum, code) => sum + code.totalPrice,
        0,
      );
    }

    const claim = await db.claims.create(claimData);

    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    console.error("Error creating claim:", error);
    return NextResponse.json(
      { error: "Failed to create claim" },
      { status: 500 },
    );
  }
}
