/**
 * Dosing Calculator API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { dosingCalculator } from '@/lib/algorithms/cds';
import type {
  MedicationDosingParams,
  PatientDemographics,
  RenalFunction,
  HepaticFunction,
} from '@/lib/algorithms/cds';

interface DosingCalculationRequest {
  medication: MedicationDosingParams;
  patient: PatientDemographics;
  renal?: RenalFunction;
  hepatic?: HepaticFunction;
}

export async function POST(request: NextRequest) {
  try {
    const { medication, patient, renal, hepatic }: DosingCalculationRequest =
      await request.json();

    if (!medication || !patient) {
      return NextResponse.json(
        { error: 'Medication parameters and patient demographics are required' },
        { status: 400 }
      );
    }

    const result = dosingCalculator.calculateDose(medication, patient, renal, hepatic);

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error('Dosing Calculation Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate dose', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
