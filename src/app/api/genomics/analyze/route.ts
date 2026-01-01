/**
 * Genomic Analysis API Route
 * Performs comprehensive variant analysis and annotation
 */

import { NextRequest, NextResponse } from 'next/server';
import { VCFParser } from '@/lib/genomics/vcf/parser';
import { VariantAnnotator } from '@/lib/genomics/vcf/annotator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysisId, vcfContent, sampleName, analysisType = 'comprehensive' } = body;

    if (!analysisId || !vcfContent) {
      return NextResponse.json(
        { error: 'Analysis ID and VCF content are required' },
        { status: 400 }
      );
    }

    // Parse VCF
    const vcf = VCFParser.parse(vcfContent);

    // Determine sample name
    const sample = sampleName || vcf.header.samples[0] || 'SAMPLE';

    // Annotate variants
    const annotator = new VariantAnnotator();
    const annotations = await annotator.annotateBatch(vcf.variants);

    // Filter by clinical significance
    const pathogenic = VariantAnnotator.filterByClinicalSignificance(annotations, [
      'pathogenic',
    ]);
    const likelyPathogenic = VariantAnnotator.filterByClinicalSignificance(annotations, [
      'likely_pathogenic',
    ]);
    const vus = VariantAnnotator.filterByClinicalSignificance(annotations, [
      'uncertain_significance',
    ]);

    // Filter rare variants
    const rareVariants = VariantAnnotator.filterRareVariants(annotations, 0.01);

    // Get actionable variants
    const actionable = VariantAnnotator.filterByACMG(annotations, [
      'pathogenic',
      'likely_pathogenic',
    ]);

    // Calculate summary statistics
    const summary = {
      totalVariants: vcf.variants.length,
      pathogenicCount: pathogenic.length,
      likelyPathogenicCount: likelyPathogenic.length,
      vusCount: vus.length,
      rareVariantsCount: rareVariants.length,
      actionableCount: actionable.length,
      qualityMetrics: {
        averageQuality: vcf.stats.qualityDistribution,
        passRate: vcf.stats.passVariants / vcf.stats.totalVariants,
        tiTvRatio: vcf.stats.tiTvRatio,
      },
    };

    // In production, save results to database
    // await saveAnalysisResults(analysisId, { annotations, summary });

    return NextResponse.json({
      success: true,
      analysisId,
      sampleName: sample,
      summary,
      pathogenic: pathogenic.slice(0, 50), // Limit to first 50
      likelyPathogenic: likelyPathogenic.slice(0, 50),
      vus: vus.slice(0, 100),
      actionable: actionable.slice(0, 50),
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze variants',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const analysisId = searchParams.get('analysisId');

  if (!analysisId) {
    return NextResponse.json(
      { error: 'Analysis ID is required' },
      { status: 400 }
    );
  }

  try {
    // In production, retrieve from database
    // const results = await getAnalysisResults(analysisId);

    return NextResponse.json({
      analysisId,
      status: 'completed',
      // Analysis results would be returned here
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
