import { NextRequest, NextResponse } from "next/server";
import {
  KPIValue,
  HEALTHCARE_KPIS,
  calculateKPI,
  checkKPIAlert,
  generateKPIDashboardSummary,
  calculateCompositeScore,
} from "@/lib/analytics/kpi-engine";
import {
  aggregateTimeSeries,
  calculateYoYComparison,
} from "@/lib/analytics/aggregations";

/**
 * GET /api/analytics/executive
 * Executive analytics endpoint
 * Returns KPIs, trends, and executive dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    // Validate date range
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 },
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 },
      );
    }

    // In production, fetch actual data from database
    // For now, we'll generate mock data based on KPI definitions
    const kpis: KPIValue[] = [];
    const alerts: any[] = [];

    // Generate KPI values for demonstration
    // Financial KPIs
    kpis.push(
      calculateKPI(
        HEALTHCARE_KPIS.revenue_per_patient,
        {
          total_revenue: 560000,
          total_patients: 2250,
        },
        235,
      ),
    );

    kpis.push(
      calculateKPI(
        HEALTHCARE_KPIS.collection_rate,
        {
          collections: 520000,
          charges: 560000,
        },
        91.8,
      ),
    );

    kpis.push(
      calculateKPI(
        HEALTHCARE_KPIS.days_in_ar,
        {
          accounts_receivable: 890000,
          charges: 560000,
          days: 30,
        },
        42,
      ),
    );

    kpis.push(
      calculateKPI(
        HEALTHCARE_KPIS.claim_denial_rate,
        {
          denied_claims: 45,
          total_claims: 750,
        },
        6.8,
      ),
    );

    // Operational KPIs
    kpis.push(
      calculateKPI(
        HEALTHCARE_KPIS.patient_wait_time,
        {
          wait_times: 40500,
          patient_count: 2250,
        },
        19,
      ),
    );

    kpis.push(
      calculateKPI(
        HEALTHCARE_KPIS.appointment_no_show_rate,
        {
          no_shows: 120,
          total_appointments: 2450,
        },
        5.2,
      ),
    );

    kpis.push(
      calculateKPI(
        HEALTHCARE_KPIS.bed_occupancy_rate,
        {
          occupied_beds: 85,
          total_beds: 100,
        },
        82,
      ),
    );

    kpis.push(
      calculateKPI(
        HEALTHCARE_KPIS.average_length_of_stay,
        {
          length_of_stays: 11250,
          patient_count: 2500,
        },
        4.8,
      ),
    );

    // Clinical KPIs
    kpis.push(
      calculateKPI(
        HEALTHCARE_KPIS.readmission_rate,
        {
          readmissions_30d: 82,
          total_discharges: 950,
        },
        9.2,
      ),
    );

    kpis.push(
      calculateKPI(
        HEALTHCARE_KPIS.medication_error_rate,
        {
          medication_errors: 18,
          patient_days: 8500,
        },
        2.8,
      ),
    );

    // Quality KPIs
    kpis.push(
      calculateKPI(
        HEALTHCARE_KPIS.patient_satisfaction_score,
        {
          satisfaction_scores: 10350,
          response_count: 2250,
        },
        4.4,
      ),
    );

    // Productivity KPIs
    kpis.push(
      calculateKPI(
        HEALTHCARE_KPIS.provider_productivity,
        {
          total_encounters: 6750,
          provider_count: 15,
          working_days: 22,
        },
        19.5,
      ),
    );

    // Check for alerts
    kpis.forEach((kpi) => {
      const definition = HEALTHCARE_KPIS[kpi.kpiId];
      const alert = checkKPIAlert(kpi, definition);
      if (alert) {
        alerts.push(alert);
      }
    });

    // Generate dashboard summary
    const summary = generateKPIDashboardSummary(kpis);

    // Calculate composite score
    const compositeScore = calculateCompositeScore(kpis);

    // Generate trend data for charts
    const revenueData = [];
    const patientVolumeData = [];
    const baseDate = new Date(start);

    for (let i = 0; i < 6; i++) {
      const month = new Date(baseDate);
      month.setMonth(month.getMonth() + i);

      revenueData.push({
        period: month.toLocaleString("default", { month: "short" }),
        revenue: 450000 + i * 15000 + (Math.random() - 0.5) * 20000,
        target: 420000 + i * 20000,
      });

      patientVolumeData.push({
        period: month.toLocaleString("default", { month: "short" }),
        volume: 1850 + i * 50 + Math.floor((Math.random() - 0.5) * 100),
      });
    }

    // Department performance
    const departmentPerformance = [
      {
        id: "1",
        department: "Cardiology",
        revenue: 280000,
        patients: 450,
        growth: 8.5,
      },
      {
        id: "2",
        department: "Orthopedics",
        revenue: 320000,
        patients: 380,
        growth: 12.3,
      },
      {
        id: "3",
        department: "Emergency",
        revenue: 420000,
        patients: 850,
        growth: 5.2,
      },
      {
        id: "4",
        department: "Primary Care",
        revenue: 180000,
        patients: 920,
        growth: 3.8,
      },
      {
        id: "5",
        department: "Radiology",
        revenue: 250000,
        patients: 680,
        growth: 7.1,
      },
    ];

    // Quality metrics
    const qualityMetrics = [
      { metric: "Patient Satisfaction", score: 92, change: 2.3 },
      { metric: "Clinical Quality", score: 88, change: 1.5 },
      { metric: "Safety", score: 95, change: 0.8 },
      { metric: "Efficiency", score: 85, change: 4.2 },
      { metric: "Staff Engagement", score: 90, change: -1.2 },
    ];

    // Strategic insights
    const insights = [
      {
        id: "1",
        category: "revenue",
        severity: "positive",
        title: "Revenue Performance",
        description:
          "Overall revenue trending upward with strong growth in outpatient services.",
        recommendation:
          "Consider expanding capacity in high-performing departments.",
        impact: "high",
      },
      {
        id: "2",
        category: "operational",
        severity: "positive",
        title: "Operational Efficiency",
        description: "Patient wait times have improved by 15% this quarter.",
        recommendation:
          "Continue focus on process optimization and staff training.",
        impact: "medium",
      },
      {
        id: "3",
        category: "quality",
        severity: "warning",
        title: "Quality Metrics",
        description: "Patient satisfaction scores remain strong.",
        recommendation:
          "Readmission rates require attention in cardiology and orthopedics departments.",
        impact: "medium",
      },
      {
        id: "4",
        category: "financial",
        severity: "warning",
        title: "Financial Health",
        description: "Days in A/R trending slightly above target.",
        recommendation:
          "Recommend enhanced focus on claims processing and denial management.",
        impact: "high",
      },
    ];

    return NextResponse.json({
      success: true,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      kpis,
      alerts,
      summary,
      compositeScore,
      charts: {
        revenue: revenueData,
        patientVolume: patientVolumeData,
        departmentPerformance,
        qualityMetrics,
      },
      insights,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalKPIs: kpis.length,
        criticalAlerts: alerts.filter((a) => a.severity === "critical").length,
        overallHealth: summary.overallHealth,
      },
    });
  } catch (error) {
    console.error("Error in executive analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to generate executive analytics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/analytics/executive
 * Calculate custom KPI or generate custom report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kpiId, rawData, customFormula } = body;

    if (!kpiId && !customFormula) {
      return NextResponse.json(
        { error: "Either kpiId or customFormula is required" },
        { status: 400 },
      );
    }

    if (kpiId) {
      // Calculate predefined KPI
      const definition = HEALTHCARE_KPIS[kpiId];
      if (!definition) {
        return NextResponse.json(
          { error: `KPI definition not found for: ${kpiId}` },
          { status: 404 },
        );
      }

      if (!rawData) {
        return NextResponse.json(
          { error: "rawData is required for KPI calculation" },
          { status: 400 },
        );
      }

      const kpiValue = calculateKPI(definition, rawData);
      const alert = checkKPIAlert(kpiValue, definition);

      return NextResponse.json({
        success: true,
        kpi: kpiValue,
        alert,
        definition,
      });
    }

    // Custom formula calculation would go here
    return NextResponse.json(
      { error: "Custom formula calculation not yet implemented" },
      { status: 501 },
    );
  } catch (error) {
    console.error("Error in executive analytics POST:", error);
    return NextResponse.json(
      {
        error: "Failed to calculate KPI",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
