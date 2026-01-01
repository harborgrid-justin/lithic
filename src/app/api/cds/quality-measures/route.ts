/**
 * Quality Measures API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { qualityMeasuresEngine } from '@/lib/algorithms/cds';
import type { PatientMeasureData } from '@/lib/algorithms/cds';

interface CalculateMeasuresRequest {
  patientData: PatientMeasureData;
  measureIds?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { patientData, measureIds }: CalculateMeasuresRequest = await request.json();

    if (!patientData) {
      return NextResponse.json(
        { error: 'Patient data is required' },
        { status: 400 }
      );
    }

    let results;
    if (measureIds && measureIds.length > 0) {
      // Calculate specific measures
      results = await Promise.all(
        measureIds.map(id => qualityMeasuresEngine.calculateMeasure(id, patientData))
      );
    } else {
      // Calculate all measures
      results = await qualityMeasuresEngine.calculateAllMeasures(patientData);
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error('Quality Measures Calculation Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate quality measures', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const measures = qualityMeasuresEngine.getMeasures();
    return NextResponse.json({ measures }, { status: 200 });
  } catch (error) {
    console.error('Get Measures Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve quality measures' },
      { status: 500 }
    );
  }
}
