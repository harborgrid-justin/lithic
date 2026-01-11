/**
 * Variants API Route
 * Handles variant search and retrieval
 */

import { NextRequest, NextResponse } from "next/server";
import type { Variant, SearchVariantParams } from "@/types/genomics";
import { GenomicsService } from "@/lib/genomics/genomics-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params: SearchVariantParams = {
      gene: searchParams.get("gene") || undefined,
      chromosome: searchParams.get("chromosome") || undefined,
      position: searchParams.get("position") ? parseInt(searchParams.get("position")!) : undefined,
      variantType: searchParams.get("variantType") as any,
      classification: searchParams.get("classification") as any,
      hgvs: searchParams.get("hgvs") || undefined,
      dbSnpId: searchParams.get("dbSnpId") || undefined,
    };

    const variants = await GenomicsService.searchVariants(params);

    return NextResponse.json(variants);
  } catch (error) {
    console.error("Error searching variants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
