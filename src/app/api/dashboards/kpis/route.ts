/**
 * KPI Calculation API Route
 * Calculate and return KPI metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateAllFinancialKPIs } from '@/lib/dashboards/kpis/financial';
import { calculateAllClinicalKPIs } from '@/lib/dashboards/kpis/clinical';
import { calculateAllOperationalKPIs } from '@/lib/dashboards/kpis/operational';
import { calculateAllPatientExperienceKPIs } from '@/lib/dashboards/kpis/patient-experience';

// Mock data generators
const generateFinancialMockData = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
    facility: 'Main Hospital',
    revenue: Math.floor(Math.random() * 500000) + 300000,
    collections: Math.floor(Math.random() * 450000) + 280000,
    charges: Math.floor(Math.random() * 600000) + 400000,
    adjustments: Math.floor(Math.random() * 100000) + 50000,
    writeOffs: Math.floor(Math.random() * 50000) + 20000,
    ar: Math.floor(Math.random() * 5000000) + 3000000,
    daysInAR: Math.floor(Math.random() * 20) + 40,
    payerMix: {
      'Medicare': Math.floor(Math.random() * 200000) + 100000,
      'Medicaid': Math.floor(Math.random() * 100000) + 50000,
      'Commercial': Math.floor(Math.random() * 150000) + 100000,
      'Self-Pay': Math.floor(Math.random() * 50000) + 20000,
    },
  }));
};

const generateClinicalMockData = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
    facility: 'Main Hospital',
    admissions: Math.floor(Math.random() * 30) + 40,
    discharges: Math.floor(Math.random() * 30) + 38,
    censusCount: Math.floor(Math.random() * 50) + 180,
    pressureUlcers: Math.floor(Math.random() * 2),
    fallsWithInjury: Math.floor(Math.random() * 2),
    medicationErrors: Math.floor(Math.random() * 3),
    hospitalAcquiredInfections: Math.floor(Math.random() * 2),
    readmissions30Day: Math.floor(Math.random() * 5) + 3,
    totalDischarges: Math.floor(Math.random() * 30) + 38,
    observedMortality: Math.floor(Math.random() * 2),
    expectedMortality: Math.floor(Math.random() * 2) + 1,
    hcahpsScore: Math.floor(Math.random() * 20) + 70,
    sepsisBundleCompliance: Math.floor(Math.random() * 15) + 85,
    strokeCareCompliance: Math.floor(Math.random() * 15) + 80,
    miCareCompliance: Math.floor(Math.random() * 10) + 90,
  }));
};

const generateOperationalMockData = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
    facility: 'Main Hospital',
    edVisits: Math.floor(Math.random() * 50) + 100,
    admissions: Math.floor(Math.random() * 30) + 40,
    discharges: Math.floor(Math.random() * 30) + 38,
    transfers: Math.floor(Math.random() * 10) + 5,
    surgeries: Math.floor(Math.random() * 20) + 25,
    outpatientVisits: Math.floor(Math.random() * 100) + 150,
    edWaitTime: Math.floor(Math.random() * 30) + 25,
    edLengthOfStay: Math.floor(Math.random() * 60) + 180,
    surgeryWaitTime: Math.floor(Math.random() * 5000) + 10000,
    appointmentWaitTime: Math.floor(Math.random() * 5) + 5,
    licensedBeds: 250,
    staffedBeds: 230,
    occupiedBeds: Math.floor(Math.random() * 40) + 180,
    availableBeds: Math.floor(Math.random() * 30) + 20,
    erCapacity: 30,
    erOccupancy: Math.floor(Math.random() * 10) + 20,
    nursesScheduled: 100,
    nursesWorked: Math.floor(Math.random() * 10) + 95,
    patientDays: Math.floor(Math.random() * 50) + 180,
    nursingHours: Math.floor(Math.random() * 200) + 1600,
    avgLengthOfStay: Math.floor(Math.random() * 2) + 4,
    turnoverTime: Math.floor(Math.random() * 20) + 30,
    dischargeBy11AM: Math.floor(Math.random() * 15) + 10,
  }));
};

const generatePatientExperienceMockData = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
    facility: 'Main Hospital',
    surveysCompleted: Math.floor(Math.random() * 30) + 50,
    surveysSent: Math.floor(Math.random() * 50) + 150,
    communicationWithNurses: Math.floor(Math.random() * 15) + 75,
    communicationWithDoctors: Math.floor(Math.random() * 15) + 78,
    responsivenessOfStaff: Math.floor(Math.random() * 20) + 65,
    painManagement: Math.floor(Math.random() * 15) + 75,
    communicationAboutMedicines: Math.floor(Math.random() * 15) + 70,
    cleanlinessOfEnvironment: Math.floor(Math.random() * 15) + 80,
    quietnessOfEnvironment: Math.floor(Math.random() * 20) + 60,
    dischargeInformation: Math.floor(Math.random() * 15) + 75,
    overallRating: Math.floor(Math.random() * 20) + 70,
    wouldRecommend: Math.floor(Math.random() * 20) + 68,
    promoters: Math.floor(Math.random() * 30) + 35,
    passives: Math.floor(Math.random() * 20) + 20,
    detractors: Math.floor(Math.random() * 10) + 5,
    complaints: Math.floor(Math.random() * 5) + 2,
    complaintsClosed: Math.floor(Math.random() * 5) + 2,
    avgResolutionTime: Math.floor(Math.random() * 48) + 72,
    phoneAnswerTime: Math.floor(Math.random() * 30) + 20,
    appointmentSchedulingTime: Math.floor(Math.random() * 5) + 5,
    appointmentAvailability: Math.floor(Math.random() * 10) + 7,
    portalActivations: Math.floor(Math.random() * 20) + 30,
    portalLogins: Math.floor(Math.random() * 100) + 150,
    mobileAppUsage: Math.floor(Math.random() * 200) + 300,
  }));
};

// ============================================================================
// POST /api/dashboards/kpis
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, dateRange, filters } = body;

    let kpis: any[] = [];

    switch (category) {
      case 'financial':
        const financialData = generateFinancialMockData();
        kpis = calculateAllFinancialKPIs(financialData);
        break;

      case 'clinical':
        const clinicalData = generateClinicalMockData();
        kpis = calculateAllClinicalKPIs(clinicalData);
        break;

      case 'operational':
        const operationalData = generateOperationalMockData();
        kpis = calculateAllOperationalKPIs(operationalData);
        break;

      case 'patient-experience':
        const patientExperienceData = generatePatientExperienceMockData();
        kpis = calculateAllPatientExperienceKPIs(patientExperienceData);
        break;

      case 'all':
        kpis = [
          ...calculateAllFinancialKPIs(generateFinancialMockData()),
          ...calculateAllClinicalKPIs(generateClinicalMockData()),
          ...calculateAllOperationalKPIs(generateOperationalMockData()),
          ...calculateAllPatientExperienceKPIs(generatePatientExperienceMockData()),
        ];
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      kpis,
      category,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error calculating KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to calculate KPIs' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/dashboards/kpis
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || 'all';

    let kpis: any[] = [];

    switch (category) {
      case 'financial':
        kpis = calculateAllFinancialKPIs(generateFinancialMockData());
        break;

      case 'clinical':
        kpis = calculateAllClinicalKPIs(generateClinicalMockData());
        break;

      case 'operational':
        kpis = calculateAllOperationalKPIs(generateOperationalMockData());
        break;

      case 'patient-experience':
        kpis = calculateAllPatientExperienceKPIs(generatePatientExperienceMockData());
        break;

      case 'all':
        kpis = [
          ...calculateAllFinancialKPIs(generateFinancialMockData()),
          ...calculateAllClinicalKPIs(generateClinicalMockData()),
          ...calculateAllOperationalKPIs(generateOperationalMockData()),
          ...calculateAllPatientExperienceKPIs(generatePatientExperienceMockData()),
        ];
        break;
    }

    return NextResponse.json({
      kpis,
      category,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error calculating KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to calculate KPIs' },
      { status: 500 }
    );
  }
}
