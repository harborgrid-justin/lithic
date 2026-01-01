import { NextRequest, NextResponse } from "next/server";
import { EDI835Data, ERA } from "@/types/billing";
import { db } from "@/lib/db";

// POST /api/billing/era - Process Electronic Remittance Advice (EDI 835)
export async function POST(request: NextRequest) {
  try {
    const { eraData } = await request.json();

    // In a real implementation, this would parse the EDI 835 file format
    // For now, we'll accept JSON data in the EDI835Data format

    let parsedERA: EDI835Data;

    try {
      // If eraData is a string (actual EDI file), parse it
      // Otherwise, assume it's already parsed JSON
      parsedERA = typeof eraData === "string" ? JSON.parse(eraData) : eraData;
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid ERA data format" },
        { status: 400 },
      );
    }

    // Process ERA and update claims
    for (const eraClaimDetail of parsedERA.claims) {
      // Find the corresponding claim
      const claims = await db.claims.findAll();
      const claim = claims.find(
        (c) => c.claimNumber === eraClaimDetail.claimNumber,
      );

      if (claim) {
        // Update claim with payment information
        const updates: any = {
          allowedAmount: eraClaimDetail.allowedAmount,
          paidAmount: (claim.paidAmount || 0) + eraClaimDetail.paidAmount,
          patientResponsibility: eraClaimDetail.patientResponsibility,
          responseDate: parsedERA.checkDate,
        };

        // Determine claim status based on payment
        if (
          eraClaimDetail.paidAmount === 0 &&
          eraClaimDetail.adjustments.some((a) => a.type === "denial")
        ) {
          updates.status = "denied";

          // Create a denial record
          await db.denials.create({
            claimId: claim.id,
            claimNumber: claim.claimNumber,
            patientName: claim.patientName,
            denialDate: parsedERA.checkDate,
            denialReason: "other",
            denialDetails:
              eraClaimDetail.remarks?.join("; ") || "Payment denied",
            deniedAmount: eraClaimDetail.chargedAmount,
            status: "pending",
            priority: "medium",
          });
        } else if (eraClaimDetail.paidAmount >= eraClaimDetail.allowedAmount) {
          updates.status = "paid";
        } else if (eraClaimDetail.paidAmount > 0) {
          updates.status = "partially_paid";
        }

        await db.claims.update(claim.id, updates);

        // Create payment record
        if (eraClaimDetail.paidAmount > 0) {
          await db.payments.create({
            claimId: claim.id,
            patientId: claim.patientId,
            patientName: claim.patientName,
            amount: eraClaimDetail.paidAmount,
            paymentMethod: "insurance",
            paymentDate: parsedERA.checkDate,
            referenceNumber: parsedERA.checkNumber,
            notes: `ERA Payment - Check #${parsedERA.checkNumber}`,
            postedBy: "system",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "ERA processed successfully",
      claimsProcessed: parsedERA.claims.length,
      totalAmount: parsedERA.checkAmount,
    });
  } catch (error) {
    console.error("Error processing ERA:", error);
    return NextResponse.json(
      { error: "Failed to process ERA" },
      { status: 500 },
    );
  }
}

// GET /api/billing/era - List all ERAs
export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would fetch from a database
    // For now, return empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching ERAs:", error);
    return NextResponse.json(
      { error: "Failed to fetch ERAs" },
      { status: 500 },
    );
  }
}
