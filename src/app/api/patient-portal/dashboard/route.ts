/**
 * Patient Portal Dashboard API
 * GET /api/patient-portal/dashboard - Get patient health summary and dashboard data
 */

import { NextRequest, NextResponse } from "next/server";
import type { HealthSummary } from "@/types/patient-portal";

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement authentication middleware
    // const session = await getServerSession();
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 },
      );
    }

    // Mock data - Replace with actual database queries
    const healthSummary: HealthSummary = {
      patientId,
      vitals: [
        {
          type: "BLOOD_PRESSURE_SYSTOLIC",
          currentValue: 125,
          unit: "mmHg",
          trend: "stable",
          status: "NORMAL",
          lastRecorded: new Date("2026-01-01"),
          history: [
            { value: 128, recordedAt: new Date("2025-12-15") },
            { value: 122, recordedAt: new Date("2025-12-01") },
            { value: 125, recordedAt: new Date("2026-01-01") },
          ],
        },
        {
          type: "HEART_RATE",
          currentValue: 72,
          unit: "bpm",
          trend: "stable",
          status: "NORMAL",
          lastRecorded: new Date("2026-01-01"),
          history: [
            { value: 75, recordedAt: new Date("2025-12-15") },
            { value: 70, recordedAt: new Date("2025-12-01") },
            { value: 72, recordedAt: new Date("2026-01-01") },
          ],
        },
        {
          type: "WEIGHT",
          currentValue: 165,
          unit: "lbs",
          trend: "declining",
          status: "NORMAL",
          lastRecorded: new Date("2026-01-01"),
          history: [
            { value: 170, recordedAt: new Date("2025-12-15") },
            { value: 167, recordedAt: new Date("2025-12-01") },
            { value: 165, recordedAt: new Date("2026-01-01") },
          ],
        },
      ],
      chronicConditions: [
        {
          id: "1",
          condition: "Type 2 Diabetes",
          icdCode: "E11.9",
          diagnosedDate: new Date("2020-03-15"),
          status: "MANAGED",
          severity: "MODERATE",
          managementPlan: "Diet control, exercise, and metformin 500mg twice daily",
        },
      ],
      recentDiagnoses: [
        {
          id: "1",
          condition: "Acute Bronchitis",
          icdCode: "J20.9",
          diagnosedDate: new Date("2025-12-20"),
          diagnosedBy: "Dr. Sarah Johnson",
          status: "Active",
          notes: "Prescribed antibiotics and rest",
        },
      ],
      activeMedications: [
        {
          id: "1",
          name: "Metformin 500mg",
          dosage: "500mg",
          frequency: "Twice daily",
          prescribedBy: "Dr. Michael Chen",
          prescribedDate: new Date("2020-03-15"),
          refillsRemaining: 3,
          nextRefillDate: new Date("2026-02-01"),
          status: "ACTIVE",
        },
        {
          id: "2",
          name: "Lisinopril 10mg",
          dosage: "10mg",
          frequency: "Once daily",
          prescribedBy: "Dr. Michael Chen",
          prescribedDate: new Date("2021-06-10"),
          refillsRemaining: 2,
          nextRefillDate: new Date("2026-01-15"),
          status: "ACTIVE",
        },
      ],
      allergies: [
        {
          id: "1",
          allergen: "Penicillin",
          reaction: "Hives, difficulty breathing",
          severity: "Severe",
          status: "Active",
        },
      ],
      immunizations: [
        {
          id: "1",
          vaccine: "Influenza",
          administeredDate: new Date("2025-10-15"),
          nextDueDate: new Date("2026-10-15"),
        },
        {
          id: "2",
          vaccine: "COVID-19 Booster",
          administeredDate: new Date("2025-09-01"),
          nextDueDate: null,
        },
      ],
      upcomingAppointments: [
        {
          id: "1",
          type: "Follow-up",
          provider: "Dr. Michael Chen",
          providerSpecialty: "Internal Medicine",
          date: new Date("2026-01-15"),
          time: "10:30 AM",
          duration: 30,
          location: "Main Clinic - Room 205",
          status: "CONFIRMED",
          canCheckIn: false,
          canCancel: true,
          canReschedule: true,
          telehealth: false,
        },
      ],
      recentTestResults: [
        {
          id: "1",
          testName: "Hemoglobin A1c",
          testType: "Laboratory",
          orderedDate: new Date("2025-12-01"),
          resultDate: new Date("2025-12-03"),
          status: "FINAL",
          hasAbnormal: false,
          provider: "Dr. Michael Chen",
        },
        {
          id: "2",
          testName: "Lipid Panel",
          testType: "Laboratory",
          orderedDate: new Date("2025-12-01"),
          resultDate: new Date("2025-12-03"),
          status: "FINAL",
          hasAbnormal: true,
          provider: "Dr. Michael Chen",
        },
      ],
      careGaps: [
        {
          id: "1",
          category: "SCREENING",
          title: "Colorectal Cancer Screening Due",
          description:
            "You are due for a colonoscopy as part of routine colorectal cancer screening",
          priority: "HIGH",
          dueDate: new Date("2026-03-01"),
          recommendedAction: "Schedule a colonoscopy appointment",
        },
        {
          id: "2",
          category: "PREVENTIVE_CARE",
          title: "Annual Wellness Visit",
          description: "Your annual wellness visit is coming up",
          priority: "MEDIUM",
          dueDate: new Date("2026-02-15"),
          recommendedAction: "Schedule your annual physical exam",
        },
      ],
      healthScore: {
        overall: 78,
        cardiovascular: 75,
        metabolic: 72,
        mental: 85,
        lifestyle: 80,
        calculatedDate: new Date("2026-01-01"),
        factors: [
          {
            name: "Regular Exercise",
            impact: "positive",
            description: "You exercise 3-4 times per week",
          },
          {
            name: "Cholesterol Levels",
            impact: "negative",
            description: "Your LDL cholesterol is slightly elevated",
          },
          {
            name: "Blood Pressure",
            impact: "positive",
            description: "Your blood pressure is well controlled",
          },
        ],
      },
      recommendations: [
        {
          id: "1",
          category: "Lifestyle",
          title: "Increase Physical Activity",
          description:
            "Try to add 30 minutes of moderate activity to your daily routine",
          priority: "Medium",
          actionable: true,
          actionUrl: "/patient/health-tools",
          actionLabel: "View Exercise Plans",
        },
        {
          id: "2",
          category: "Screening",
          title: "Schedule Colonoscopy",
          description: "You are due for colorectal cancer screening",
          priority: "High",
          actionable: true,
          actionUrl: "/patient/appointments",
          actionLabel: "Schedule Now",
        },
      ],
    };

    return NextResponse.json({
      success: true,
      data: healthSummary,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
