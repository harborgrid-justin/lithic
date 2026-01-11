/**
 * Trials API Route
 * Lithic Healthcare Platform v0.5
 */

import { NextRequest, NextResponse } from "next/server";
import { trialRegistry } from "@/lib/research/trial-registry";
import { TrialSearchParams } from "@/types/research";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId") || "";

    const params: TrialSearchParams = {
      query: searchParams.get("query") || undefined,
      phase: searchParams.get("phase")?.split(",") as any,
      status: searchParams.get("status")?.split(",") as any,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const result = await trialRegistry.searchTrials(params, organizationId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch trials" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const userId = "user_123"; // Would get from session

    const trial = await trialRegistry.registerTrial(data, userId);

    return NextResponse.json(trial, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create trial" },
      { status: 400 }
    );
  }
}
