/**
 * Pharmacogenomics API Route
 * Analyzes star alleles and provides drug recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { VCFParser } from '@/lib/genomics/vcf/parser';
import { StarAlleleCaller } from '@/lib/genomics/pgx/star-allele-caller';
import { CPICEngine } from '@/lib/genomics/pgx/cpic-engine';
import { PGxDrugDatabase } from '@/lib/genomics/pgx/drug-database';
import { CDSIntegration } from '@/lib/genomics/pgx/cds-integration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysisId, vcfContent, sampleName, drugs = [] } = body;

    if (!analysisId || !vcfContent) {
      return NextResponse.json(
        { error: 'Analysis ID and VCF content are required' },
        { status: 400 }
      );
    }

    // Parse VCF
    const vcf = VCFParser.parse(vcfContent);
    const sample = sampleName || vcf.header.samples[0] || 'SAMPLE';

    // Call star alleles for all pharmacogenes
    const starAlleleCalls = StarAlleleCaller.callAllGenes(vcf.variants, sample);

    // Get CPIC recommendations
    const cpicRecommendations = drugs.length > 0
      ? CPICEngine.getRecommendations(drugs, starAlleleCalls)
      : [];

    // Get all drugs with guidelines for these genes
    const genesFound = starAlleleCalls.map((call) => call.gene);
    const relevantDrugs: any[] = [];
    for (const gene of genesFound) {
      const drugsForGene = CPICEngine.getDrugsByGene(gene);
      relevantDrugs.push(...drugsForGene);
    }

    // Get actionable recommendations
    const actionable = CPICEngine.getActionableRecommendations(cpicRecommendations);

    // Prioritize recommendations
    const prioritized = CPICEngine.prioritizeRecommendations(cpicRecommendations);

    // Generate CDS alerts if drugs are specified
    const cdsAlerts = drugs.length > 0
      ? await Promise.all(
          drugs.map((drug) =>
            CDSIntegration.processDrugOrder(
              {
                patientId: analysisId,
                drugName: drug,
              },
              {
                patientId: analysisId,
                starAlleleCalls,
                lastUpdated: new Date().toISOString(),
              },
              cpicRecommendations
            )
          )
        )
      : [];

    // Flatten alerts
    const allAlerts = cdsAlerts.flat();

    // Summary statistics
    const summary = {
      totalGenes: starAlleleCalls.length,
      actionableGenes: starAlleleCalls.filter((call) => call.metabolizerStatus !== 'normal').length,
      drugsAnalyzed: drugs.length,
      recommendationsFound: cpicRecommendations.length,
      actionableRecommendations: actionable.length,
      criticalAlerts: allAlerts.filter((a) => a.indicator === 'critical').length,
    };

    return NextResponse.json({
      success: true,
      analysisId,
      sampleName: sample,
      summary,
      starAlleles: starAlleleCalls,
      recommendations: prioritized,
      actionable,
      relevantDrugs: relevantDrugs.slice(0, 20),
      alerts: allAlerts,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('PGx analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze pharmacogenomics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const analysisId = searchParams.get('analysisId');
  const gene = searchParams.get('gene');
  const drug = searchParams.get('drug');

  try {
    // Get drug information
    if (drug) {
      const drugInfo = PGxDrugDatabase.getDrug(drug);
      if (drugInfo) {
        return NextResponse.json({
          drug: drugInfo,
          guideline: CPICEngine.getGuideline(drug),
        });
      } else {
        return NextResponse.json(
          { error: 'Drug not found' },
          { status: 404 }
        );
      }
    }

    // Get drugs by gene
    if (gene) {
      const drugs = PGxDrugDatabase.getDrugsByGene(gene);
      const guidelines = CPICEngine.getDrugsByGene(gene);

      return NextResponse.json({
        gene,
        drugs,
        guidelines,
      });
    }

    // Get all supported drugs and genes
    if (!analysisId) {
      return NextResponse.json({
        supportedDrugs: PGxDrugDatabase.getAllDrugs().map((d) => ({
          name: d.name,
          genes: d.genes.map((g) => g.gene),
          cpicGuideline: d.cpicGuideline,
        })),
        supportedGenes: StarAlleleCaller.getSupportedGenes(),
      });
    }

    // Get analysis results
    // In production, retrieve from database
    // const results = await getPGxResults(analysisId);

    return NextResponse.json({
      analysisId,
      status: 'completed',
    });
  } catch (error) {
    console.error('Get PGx error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve PGx data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
