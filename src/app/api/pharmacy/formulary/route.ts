/**
 * Formulary API Route
 * Handle formulary search and management
 */

import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

// Mock formulary database
const formulary: any[] = [
  {
    id: "form_001",
    drugId: "drug_001",
    drug: {
      id: "drug_001",
      ndc: "00378-1805-10",
      name: "Lisinopril",
      genericName: "Lisinopril",
      strength: "10mg",
      dosageForm: "Tablet",
    },
    tier: 1,
    status: "preferred",
    priorAuthRequired: false,
    stepTherapyRequired: false,
    effectiveDate: "2025-01-01",
  },
  {
    id: "form_002",
    drugId: "drug_002",
    drug: {
      id: "drug_002",
      ndc: "00002-3227-30",
      name: "Prozac",
      genericName: "Fluoxetine",
      brandName: "Prozac",
      strength: "20mg",
      dosageForm: "Capsule",
    },
    tier: 2,
    status: "non-preferred",
    priorAuthRequired: false,
    stepTherapyRequired: true,
    alternatives: ["drug_003"], // Generic fluoxetine
    effectiveDate: "2025-01-01",
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const tier = searchParams.get("tier");
    const status = searchParams.get("status");
    const priorAuth = searchParams.get("priorAuth");

    let filtered = [...formulary];

    if (query) {
      const queryLower = query.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.drug.name.toLowerCase().includes(queryLower) ||
          entry.drug.genericName.toLowerCase().includes(queryLower) ||
          entry.drug.brandName?.toLowerCase().includes(queryLower) ||
          entry.drug.ndc.includes(query),
      );
    }

    if (tier) {
      filtered = filtered.filter((entry) => entry.tier === parseInt(tier));
    }

    if (status) {
      filtered = filtered.filter((entry) => entry.status === status);
    }

    if (priorAuth !== null) {
      const requiresAuth = priorAuth === "true";
      filtered = filtered.filter(
        (entry) => entry.priorAuthRequired === requiresAuth,
      );
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error searching formulary:", error);
    return NextResponse.json(
      { error: "Failed to search formulary" },
      { status: 500 },
    );
  }
}
