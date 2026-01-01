import { NextRequest, NextResponse } from "next/server";
import { CDSEvaluationRequest, CDSEvaluationResult } from "@/types/cds";
import { cdsEngine } from "@/lib/cds/engine";
import { drugInteractionChecker } from "@/lib/cds/rules/drug-interactions";
import { drugAllergyChecker } from "@/lib/cds/rules/drug-allergy";
import { duplicateOrderDetector } from "@/lib/cds/rules/duplicate-orders";
import { ageDosingChecker } from "@/lib/cds/rules/age-dosing";
import { diagnosisAlertGenerator } from "@/lib/cds/rules/diagnosis-alerts";
import { alertManager } from "@/lib/cds/alerts";

/**
 * POST /api/cds/evaluate
 * Evaluate CDS rules for a patient context
 */
export async function POST(request: NextRequest) {
  try {
    const evaluationRequest: CDSEvaluationRequest = await request.json();

    // Validate request
    if (!evaluationRequest.patientId || !evaluationRequest.context) {
      return NextResponse.json(
        { error: "Invalid evaluation request" },
        { status: 400 },
      );
    }

    // Load CDS rules (in production, load from database)
    // For now, using built-in rule checkers
    const rules: any[] = []; // Load rules from database
    cdsEngine.loadRules(rules);

    // Evaluate core engine
    const coreResult = await cdsEngine.evaluate(evaluationRequest);

    // Run specialized checkers
    const context = evaluationRequest.context;
    const alerts = [...coreResult.alerts];
    const suggestions = [...coreResult.suggestions];

    // Drug-drug interactions
    if (context.activeMedications.length > 0) {
      const interactions = drugInteractionChecker.checkInteractions(
        [], // New medications would come from the trigger
        context.activeMedications,
      );
      // Convert interactions to alerts (implementation detail)
    }

    // Drug-allergy checking
    if (context.allergies.length > 0 && context.activeMedications.length > 0) {
      const allergyConflicts = drugAllergyChecker.checkAllergies(
        context.activeMedications,
        context.allergies,
      );
      // Convert to alerts
    }

    // Duplicate order detection
    if (context.activeMedications.length > 0) {
      const duplicates = duplicateOrderDetector.detectDuplicates(
        [], // New medications
        context.activeMedications,
      );
      // Convert to alerts
    }

    // Age-based dosing
    if (context.patientAge !== null && context.patientAge !== undefined) {
      const ageAlerts = ageDosingChecker.checkAgeDosing(
        context.activeMedications,
        context,
      );
      // Convert to CDS alerts
    }

    // Diagnosis-based alerts
    if (context.diagnoses.length > 0) {
      const diagnosisAlerts = diagnosisAlertGenerator.generateAlerts(
        context.diagnoses,
        context,
      );
      // Convert to suggestions
    }

    // Process alerts through alert manager to prevent fatigue
    const processedAlerts = alertManager.processAlerts(
      alerts,
      evaluationRequest.patientId,
      evaluationRequest.encounterId || null,
    );

    const result: CDSEvaluationResult = {
      ...coreResult,
      alerts: processedAlerts,
      suggestions,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("CDS Evaluation error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate CDS rules" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/cds/evaluate/metrics
 * Get alert fatigue metrics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : new Date();
    const providerId = searchParams.get("providerId") || undefined;

    const metrics = alertManager.getAlertFatigueMetrics(
      startDate,
      endDate,
      providerId,
    );

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error("Failed to get metrics:", error);
    return NextResponse.json(
      { error: "Failed to retrieve metrics" },
      { status: 500 },
    );
  }
}
