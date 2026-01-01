/**
 * Genetic Risk Assessment API Route
 * Calculates polygenic risk, cancer risk, and cardiac risk
 */

import { NextRequest, NextResponse } from 'next/server';
import { VCFParser } from '@/lib/genomics/vcf/parser';
import { VariantAnnotator } from '@/lib/genomics/vcf/annotator';
import { PolygenicRiskCalculator } from '@/lib/genomics/risk/polygenic-risk';
import { HereditaryCancerPanel } from '@/lib/genomics/risk/cancer-panel';
import { CardiacGeneticPanel } from '@/lib/genomics/risk/cardiac-panel';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      analysisId,
      vcfContent,
      sampleName,
      riskTypes = ['polygenic', 'cancer', 'cardiac'],
    } = body;

    if (!analysisId || !vcfContent) {
      return NextResponse.json(
        { error: 'Analysis ID and VCF content are required' },
        { status: 400 }
      );
    }

    // Parse VCF
    const vcf = VCFParser.parse(vcfContent);
    const sample = sampleName || vcf.header.samples[0] || 'SAMPLE';

    // Annotate variants for risk assessment
    const annotator = new VariantAnnotator();
    const annotations = await annotator.annotateBatch(vcf.variants);

    const results: any = {};

    // Polygenic risk scores
    if (riskTypes.includes('polygenic')) {
      const polygenicRisk = PolygenicRiskCalculator.calculateAllPRS(vcf.variants, sample);
      const highRiskConditions = PolygenicRiskCalculator.getHighRiskConditions(polygenicRisk);

      results.polygenic = {
        scores: polygenicRisk,
        highRisk: highRiskConditions,
        summary: {
          totalConditions: polygenicRisk.length,
          highRiskCount: highRiskConditions.length,
          averagePercentile:
            polygenicRisk.reduce((sum, p) => sum + p.percentile, 0) / polygenicRisk.length || 0,
        },
      };
    }

    // Cancer risk assessment
    if (riskTypes.includes('cancer')) {
      const cancerRisk = HereditaryCancerPanel.analyzeCancerRisk(
        vcf.variants,
        annotations,
        sample
      );
      const highRiskCancer = HereditaryCancerPanel.getHighRiskAssessments(cancerRisk);

      results.cancer = {
        assessments: cancerRisk,
        highRisk: highRiskCancer,
        summary: {
          genesAnalyzed: cancerRisk.length,
          highRiskGenes: highRiskCancer.length,
          pathogenicVariants: cancerRisk.reduce(
            (sum, r) => sum + r.pathogenicVariants.length,
            0
          ),
          likelyPathogenicVariants: cancerRisk.reduce(
            (sum, r) => sum + r.likelyPathogenicVariants.length,
            0
          ),
        },
      };
    }

    // Cardiac risk assessment
    if (riskTypes.includes('cardiac')) {
      const cardiacRisk = CardiacGeneticPanel.analyzeCardiacRisk(
        vcf.variants,
        annotations,
        sample
      );
      const highRiskCardiac = CardiacGeneticPanel.getHighRiskAssessments(cardiacRisk);

      results.cardiac = {
        assessments: cardiacRisk,
        highRisk: highRiskCardiac,
        summary: {
          genesAnalyzed: cardiacRisk.length,
          highRiskGenes: highRiskCardiac.length,
          pathogenicVariants: cardiacRisk.reduce(
            (sum, r) => sum + r.pathogenicVariants.length,
            0
          ),
          familyScreeningRecommended: cardiacRisk.some((r) => r.familyScreening),
        },
      };
    }

    // Overall risk summary
    const overallSummary = {
      totalHighRiskFindings:
        (results.polygenic?.highRisk?.length || 0) +
        (results.cancer?.highRisk?.length || 0) +
        (results.cardiac?.highRisk?.length || 0),
      requiresGeneticCounseling:
        (results.cancer?.highRisk?.length || 0) > 0 ||
        (results.cardiac?.highRisk?.length || 0) > 0,
      requiresFamilyScreening: results.cardiac?.summary?.familyScreeningRecommended || false,
    };

    return NextResponse.json({
      success: true,
      analysisId,
      sampleName: sample,
      overallSummary,
      ...results,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Risk assessment error:', error);
    return NextResponse.json(
      {
        error: 'Failed to assess genetic risk',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const analysisId = searchParams.get('analysisId');
  const type = searchParams.get('type');

  try {
    // Get available conditions/genes
    if (!analysisId) {
      const info: any = {};

      if (!type || type === 'polygenic') {
        info.polygenicConditions = PolygenicRiskCalculator.getAvailableConditions();
      }

      if (!type || type === 'cancer') {
        info.cancerGenes = HereditaryCancerPanel.getCancerGenes();
      }

      if (!type || type === 'cardiac') {
        info.cardiacGenes = CardiacGeneticPanel.getCardiacGenes();
      }

      return NextResponse.json(info);
    }

    // Get analysis results
    // In production, retrieve from database
    // const results = await getRiskAssessment(analysisId);

    return NextResponse.json({
      analysisId,
      status: 'completed',
    });
  } catch (error) {
    console.error('Get risk assessment error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve risk assessment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
