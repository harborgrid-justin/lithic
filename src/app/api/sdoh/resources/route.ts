/**
 * SDOH Resources API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { resourceDirectory } from "@/lib/sdoh/resource-directory";
import type { ResourceSearchParams, CreateResourceDto } from "@/types/sdoh";

export async function POST(request: NextRequest) {
  try {
    const body: CreateResourceDto = await request.json();

    // Create resource in database (simulated)
    const resource = {
      id: `res_${Date.now()}`,
      ...body,
      organizationId: "org_1",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: "current-user",
      updatedBy: "current-user",
      status: "ACTIVE" as const,
      qualityRating: null,
      reviewCount: 0,
      lastVerified: new Date(),
      externalIds: {},
      tags: [],
      socialMedia: {},
    };

    return NextResponse.json(
      { success: true, resource },
      { status: 201 }
    );
  } catch (error) {
    console.error("Resource creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create resource" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");
    const category = searchParams.get("category");

    // Fetch resources from database (simulated)
    const resources: any[] = [];

    return NextResponse.json({
      success: true,
      resources,
      total: resources.length,
    });
  } catch (error) {
    console.error("Resource fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}
