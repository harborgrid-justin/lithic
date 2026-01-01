/**
 * Sepsis Assessment API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { sepsisPredictionEngine } from '@/lib/algorithms/cds';
import type { VitalSigns, SepsisLabValues } from '@/lib/algorithms/cds';

interface SepsisAssessmentRequest {
  vitals: VitalSigns;
  labs: SepsisLabValues;
  historicalTrends?: VitalSigns[];
}

export async function POST(request: NextRequest) {
  try {
    const { vitals, labs, historicalTrends }: SepsisAssessmentRequest = await request.json();

    if (!vitals) {
      return NextResponse.json(
        { error: 'Vital signs are required' },
        { status: 400 }
      );
    }

    const assessment = await sepsisPredictionEngine.assessSepsis(
      vitals,
      labs || {},
      historicalTrends
    );

    return NextResponse.json({ assessment }, { status: 200 });
  } catch (error) {
    console.error('Sepsis Assessment Error:', error);
    return NextResponse.json(
      { error: 'Failed to assess sepsis risk', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
