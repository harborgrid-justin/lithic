/**
 * Allergy Check API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { allergyAlertSystem } from '@/lib/algorithms/cds';
import type { OrderedMedication, PatientAllergy } from '@/lib/algorithms/cds';

interface AllergyCheckRequest {
  medication: OrderedMedication;
  patientAllergies: PatientAllergy[];
}

export async function POST(request: NextRequest) {
  try {
    const { medication, patientAllergies }: AllergyCheckRequest = await request.json();

    if (!medication || !patientAllergies) {
      return NextResponse.json(
        { error: 'Medication and patient allergies are required' },
        { status: 400 }
      );
    }

    const alerts = await allergyAlertSystem.checkAllergies(
      medication,
      patientAllergies
    );

    return NextResponse.json({ alerts }, { status: 200 });
  } catch (error) {
    console.error('Allergy Check Error:', error);
    return NextResponse.json(
      { error: 'Failed to check allergies', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
