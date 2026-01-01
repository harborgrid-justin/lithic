import { NextRequest, NextResponse } from 'next/server';
import { EligibilityResponse } from '@/types/billing';

// POST /api/billing/eligibility - Check insurance eligibility (270/271 transaction)
export async function POST(request: NextRequest) {
  try {
    const { patientId, insuranceId } = await request.json();

    if (!patientId || !insuranceId) {
      return NextResponse.json(
        { error: 'Patient ID and Insurance ID are required' },
        { status: 400 }
      );
    }

    // In a real implementation, this would call an external eligibility verification service
    // (e.g., Change Healthcare, Availity, etc.) using EDI 270/271 transactions

    // Mock eligibility response
    const eligibilityResponse: EligibilityResponse = {
      patientId,
      insuranceId,
      isEligible: true,
      effectiveDate: '2024-01-01',
      terminationDate: '2024-12-31',
      copay: 25,
      deductible: 1500,
      deductibleRemaining: 800,
      outOfPocketMax: 5000,
      outOfPocketRemaining: 3200,
      benefits: [
        {
          serviceType: 'Primary Care Visit',
          coverageLevel: 'Individual',
          inNetworkCoverage: 90,
          outOfNetworkCoverage: 70,
          limitations: 'Requires copay of $25',
        },
        {
          serviceType: 'Specialist Visit',
          coverageLevel: 'Individual',
          inNetworkCoverage: 80,
          outOfNetworkCoverage: 60,
          limitations: 'Requires copay of $50',
        },
        {
          serviceType: 'Preventive Care',
          coverageLevel: 'Individual',
          inNetworkCoverage: 100,
          outOfNetworkCoverage: 80,
          limitations: 'No copay for annual physical',
        },
        {
          serviceType: 'Emergency Room',
          coverageLevel: 'Individual',
          inNetworkCoverage: 90,
          outOfNetworkCoverage: 90,
          limitations: 'Subject to deductible',
        },
      ],
      checkedAt: new Date().toISOString(),
    };

    return NextResponse.json(eligibilityResponse);
  } catch (error) {
    console.error('Error checking eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to check eligibility' },
      { status: 500 }
    );
  }
}
