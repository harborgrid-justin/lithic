/**
 * SDOH Resource Search API Endpoints
 * SDOH & Care Coordination Specialist - Agent 7
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ResourceMatcher } from "@/lib/sdoh/resources/matcher";
import { ResourceDatabase, ResourceCategory } from "@/lib/sdoh/resources/resource-database";
import type { ResourceSearchCriteria } from "@/lib/sdoh/resources/resource-database";

// Initialize resource database (in production, load from database)
const resourceDb = new ResourceDatabase();

// ============================================================================
// POST /api/sdoh/resources/search - Search for Resources
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate search criteria
    const schema = z.object({
      categories: z.array(z.nativeEnum(ResourceCategory)).optional(),
      keywords: z.string().optional(),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }).optional(),
      radius: z.number().optional(),
      zipCode: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      languages: z.array(z.string()).optional(),
      age: z.number().optional(),
      income: z.number().optional(),
      householdSize: z.number().optional(),
      verifiedOnly: z.boolean().optional(),
      freeOnly: z.boolean().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    });

    const criteria: ResourceSearchCriteria = schema.parse(body);

    // Get all resources from database
    const allResources = resourceDb.getAllResources();

    // Perform matching
    const matcher = new ResourceMatcher(allResources);
    const results = matcher.findMatches(criteria);

    return NextResponse.json({
      success: true,
      data: {
        results,
        total: results.length,
        offset: criteria.offset || 0,
        limit: criteria.limit || 20,
      },
    });
  } catch (error) {
    console.error("Resource search error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid search criteria", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to search resources" },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/sdoh/resources - Get Resource Details
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("id");
    const category = searchParams.get("category");

    if (resourceId) {
      // Get specific resource
      const resource = resourceDb.getResource(resourceId);

      if (!resource) {
        return NextResponse.json(
          { error: "Resource not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: resource,
      });
    }

    if (category) {
      // Get resources by category
      const resources = resourceDb.getResourcesByCategory(
        category as ResourceCategory
      );

      return NextResponse.json({
        success: true,
        data: {
          resources,
          total: resources.length,
        },
      });
    }

    // Get all resources
    const resources = resourceDb.getAllResources();

    return NextResponse.json({
      success: true,
      data: {
        resources: resources.slice(0, 50), // Limit to 50
        total: resources.length,
      },
    });
  } catch (error) {
    console.error("Resource retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve resources" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/sdoh/resources - Update Resource
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const schema = z.object({
      resourceId: z.string(),
      updates: z.object({
        isActive: z.boolean().optional(),
        verified: z.boolean().optional(),
        verifiedBy: z.string().optional(),
        capacity: z.object({
          total: z.number().optional(),
          available: z.number().optional(),
          status: z.enum(["available", "limited", "full", "waitlist"]),
          lastUpdated: z.date(),
        }).optional(),
      }),
    });

    const { resourceId, updates } = schema.parse(body);

    // Update resource
    resourceDb.updateResource(resourceId, updates);

    return NextResponse.json({
      success: true,
      data: {
        resourceId,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Resource update error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/sdoh/resources - Delete Resource
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("id");

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID required" },
        { status: 400 }
      );
    }

    resourceDb.deleteResource(resourceId);

    return NextResponse.json({
      success: true,
      data: {
        resourceId,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Resource deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    );
  }
}
