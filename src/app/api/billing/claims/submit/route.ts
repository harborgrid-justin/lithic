import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EDI837Data } from "@/types/billing";

// POST /api/billing/claims/submit - Submit a claim (generate EDI 837)
export async function POST(request: NextRequest) {
  try {
    const { claimId } = await request.json();

    const claim = await db.claims.findById(claimId);

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Validate claim is ready for submission
    if (claim.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft claims can be submitted" },
        { status: 400 },
      );
    }

    if (!claim.codes || claim.codes.length === 0) {
      return NextResponse.json(
        { error: "Claim must have at least one procedure code" },
        { status: 400 },
      );
    }

    if (!claim.diagnosis || claim.diagnosis.length === 0) {
      return NextResponse.json(
        { error: "Claim must have at least one diagnosis code" },
        { status: 400 },
      );
    }

    // Generate EDI 837 data
    const edi837Data: EDI837Data = {
      interchangeControlNumber: `ICN${Date.now()}`,
      submitterId: "SUBMITTER_ID",
      receiverId: claim.insuranceId,
      transactionSetControlNumber: `TSC${Date.now()}`,
      claim: claim,
      subscriber: {
        memberId: "MEMBER_ID", // Should come from insurance record
        name: claim.patientName,
        dateOfBirth: "1980-01-01", // Should come from patient record
        gender: "M", // Should come from patient record
        address: "123 Main St", // Should come from patient record
      },
      provider: {
        npi: "1234567890", // Should come from provider record
        taxId: "12-3456789", // Should come from provider record
        name: claim.providerName,
        address: "456 Healthcare Ave", // Should come from provider record
      },
    };

    // Update claim status to submitted
    const updatedClaim = await db.claims.update(claimId, {
      status: "submitted",
      submissionDate: new Date().toISOString(),
    });

    return NextResponse.json({
      claim: updatedClaim,
      edi837: edi837Data,
      message: "Claim submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting claim:", error);
    return NextResponse.json(
      { error: "Failed to submit claim" },
      { status: 500 },
    );
  }
}
