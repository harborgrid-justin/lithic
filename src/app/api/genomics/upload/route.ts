/**
 * VCF File Upload API Route
 * Handles VCF file uploads for genomic analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { VCFParser } from '@/lib/genomics/vcf/parser';
import { VCFValidator } from '@/lib/genomics/vcf/validator';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const patientId = formData.get('patientId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Check file extension
    if (!file.name.endsWith('.vcf') && !file.name.endsWith('.vcf.gz')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only VCF files are supported.' },
        { status: 400 }
      );
    }

    // Check file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 500MB.' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    // Validate VCF format
    const formatValidation = VCFValidator.validateFormat(content);
    if (!formatValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Invalid VCF format',
          details: formatValidation.errors,
        },
        { status: 400 }
      );
    }

    // Parse VCF file
    const vcf = VCFParser.parse(content);

    // Validate VCF content
    const validation = VCFValidator.validate(vcf);

    // Generate analysis ID
    const analysisId = `GEN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // In production, save to database
    // await saveVCFData(analysisId, patientId, vcf);

    return NextResponse.json({
      success: true,
      analysisId,
      patientId,
      fileName: file.name,
      fileSize: file.size,
      stats: vcf.stats,
      validation: {
        isValid: validation.isValid,
        errors: validation.errors.length,
        warnings: validation.warnings.length,
      },
      samples: vcf.header.samples,
      variantCount: vcf.variants.length,
    });
  } catch (error) {
    console.error('VCF upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process VCF file',
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

  // In production, retrieve from database
  // const analysis = await getAnalysisById(analysisId);

  return NextResponse.json({
    analysisId,
    status: 'completed',
    // Additional analysis data would be returned here
  });
}
