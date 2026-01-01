/**
 * Genomic Report Generation API Route
 * Generates comprehensive clinical reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { VCFParser } from '@/lib/genomics/vcf/parser';
import { VariantAnnotator } from '@/lib/genomics/vcf/annotator';
import { StarAlleleCaller } from '@/lib/genomics/pgx/star-allele-caller';
import { CPICEngine } from '@/lib/genomics/pgx/cpic-engine';
import { PolygenicRiskCalculator } from '@/lib/genomics/risk/polygenic-risk';
import { HereditaryCancerPanel } from '@/lib/genomics/risk/cancer-panel';
import { CardiacGeneticPanel } from '@/lib/genomics/risk/cardiac-panel';
import { GenomicReportGenerator } from '@/lib/genomics/reporting/report-generator';
import { PatientSummaryGenerator } from '@/lib/genomics/reporting/patient-summary';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      analysisId,
      patientId,
      vcfContent,
      sampleName,
      reportType = 'comprehensive',
      format = 'json',
    } = body;

    if (!analysisId || !patientId || !vcfContent) {
      return NextResponse.json(
        { error: 'Analysis ID, patient ID, and VCF content are required' },
        { status: 400 }
      );
    }

    // Parse VCF
    const vcf = VCFParser.parse(vcfContent);
    const sample = sampleName || vcf.header.samples[0] || 'SAMPLE';

    // Patient info
    const patientInfo = {
      id: patientId,
      // In production, fetch from database
    };

    // Specimen info
    const specimenInfo = {
      id: `SPEC-${analysisId}`,
      type: 'Blood',
      collectionDate: new Date().toISOString(),
    };

    // Annotate variants
    const annotator = new VariantAnnotator();
    const annotations = await annotator.annotateBatch(vcf.variants);

    // Star alleles
    const starAlleles = StarAlleleCaller.callAllGenes(vcf.variants, sample);

    // CPIC recommendations
    const cpicRecommendations = CPICEngine.getActionableRecommendations(
      CPICEngine.getRecommendations(
        CPICEngine.getSupportedDrugs().map((d) => d.toLowerCase()),
        starAlleles
      )
    );

    // Polygenic risk
    const polygenicRisk = PolygenicRiskCalculator.calculateAllPRS(vcf.variants, sample);

    // Cancer risk
    const cancerRisk = HereditaryCancerPanel.analyzeCancerRisk(
      vcf.variants,
      annotations,
      sample
    );

    // Cardiac risk
    const cardiacRisk = CardiacGeneticPanel.analyzeCardiacRisk(
      vcf.variants,
      annotations,
      sample
    );

    let report;
    let patientSummary;

    if (reportType === 'comprehensive') {
      report = GenomicReportGenerator.generateComprehensiveReport(
        patientInfo,
        specimenInfo,
        vcf.variants,
        annotations,
        starAlleles,
        cpicRecommendations,
        polygenicRisk,
        cancerRisk,
        cardiacRisk
      );
    } else if (reportType === 'pharmacogenomics') {
      report = GenomicReportGenerator.generatePGxReport(
        patientInfo,
        specimenInfo,
        starAlleles,
        cpicRecommendations
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid report type' },
        { status: 400 }
      );
    }

    // Generate patient summary
    patientSummary = PatientSummaryGenerator.generateSummary(
      report,
      cpicRecommendations,
      polygenicRisk
    );

    // Format output
    let output: any = { report, patientSummary };

    if (format === 'text') {
      output = {
        report: GenomicReportGenerator.exportText(report),
        patientSummary: PatientSummaryGenerator.exportText(patientSummary),
      };
    } else if (format === 'html') {
      output = {
        patientSummary: PatientSummaryGenerator.exportHTML(patientSummary),
      };
    }

    // In production, save report to database
    // await saveReport(report.reportId, report, patientSummary);

    return NextResponse.json({
      success: true,
      reportId: report.reportId,
      reportType: report.reportType,
      format,
      ...output,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get('reportId');
  const format = searchParams.get('format') || 'json';

  if (!reportId) {
    return NextResponse.json(
      { error: 'Report ID is required' },
      { status: 400 }
    );
  }

  try {
    // In production, retrieve from database
    // const report = await getReport(reportId);
    // const patientSummary = await getPatientSummary(reportId);

    // Mock response
    return NextResponse.json({
      reportId,
      status: 'available',
      format,
    });
  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get('reportId');

  if (!reportId) {
    return NextResponse.json(
      { error: 'Report ID is required' },
      { status: 400 }
    );
  }

  try {
    // In production, delete from database
    // await deleteReport(reportId);

    return NextResponse.json({
      success: true,
      reportId,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Delete report error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
