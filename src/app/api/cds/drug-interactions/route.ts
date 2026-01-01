/**
 * Drug Interaction Checker API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { drugInteractionChecker } from '@/lib/algorithms/cds';
import type { Medication } from '@/lib/algorithms/cds';

interface DrugInteractionRequest {
  medications: Medication[];
}

export async function POST(request: NextRequest) {
  try {
    const { medications }: DrugInteractionRequest = await request.json();

    if (!medications || !Array.isArray(medications) || medications.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 medications required for interaction checking' },
        { status: 400 }
      );
    }

    const interactions = await drugInteractionChecker.checkInteractions(medications);

    return NextResponse.json({ interactions }, { status: 200 });
  } catch (error) {
    console.error('Drug Interaction Check Error:', error);
    return NextResponse.json(
      { error: 'Failed to check drug interactions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
