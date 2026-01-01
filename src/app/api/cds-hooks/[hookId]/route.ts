/**
 * CDS Hooks Individual Service Endpoint
 * Handles hook invocations for specific services
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCDSRequest,
  CardBuilder,
  SuggestionBuilder,
  CardIndicator,
  ActionType,
  type CDSHooksRequest,
  type CDSHooksResponse,
} from "@/lib/cds-hooks/service";

/**
 * POST /api/cds-hooks/:hookId - Invoke CDS Hook
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { hookId: string } }
): Promise<NextResponse> {
  try {
    const hookId = params.hookId;
    const body = await request.json();

    // Validate request
    if (!validateCDSRequest(body)) {
      return NextResponse.json(
        {
          error: "Invalid CDS Hooks request format",
        },
        { status: 400 }
      );
    }

    const cdsRequest = body as CDSHooksRequest;

    // Route to appropriate hook handler
    const response = await handleHook(hookId, cdsRequest);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(`CDS hook ${params.hookId} error:`, error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle different hook types
 */
async function handleHook(
  hookId: string,
  request: CDSHooksRequest
): Promise<CDSHooksResponse> {
  switch (hookId) {
    case "patient-view-risk-assessment":
      return handlePatientViewRiskAssessment(request);

    case "patient-view-care-gaps":
      return handlePatientViewCareGaps(request);

    case "patient-view-medication-reconciliation":
      return handleMedicationReconciliation(request);

    case "order-select-drug-interaction":
      return handleDrugInteraction(request);

    case "order-select-duplicate-therapy":
      return handleDuplicateTherapy(request);

    case "order-select-contraindication":
      return handleContraindication(request);

    case "order-sign-prior-auth":
      return handlePriorAuth(request);

    case "order-sign-dosage-check":
      return handleDosageCheck(request);

    case "encounter-start-screening":
      return handleScreening(request);

    case "encounter-discharge-followup":
      return handleDischargeFollowup(request);

    case "appointment-book-eligibility":
      return handleAppointmentEligibility(request);

    default:
      return { cards: [] };
  }
}

/**
 * Patient View: Risk Assessment
 */
async function handlePatientViewRiskAssessment(
  request: CDSHooksRequest
): Promise<CDSHooksResponse> {
  const cards = [];

  // Mock risk assessment logic
  const patientId = request.context.patientId;
  if (!patientId) {
    return { cards: [] };
  }

  // Example: High-risk patient alert
  const riskCard = new CardBuilder()
    .setSummary("High-Risk Patient Alert")
    .setDetail(
      "This patient has multiple chronic conditions and requires enhanced care coordination."
    )
    .setIndicator(CardIndicator.WARNING)
    .setSource("Risk Stratification Engine", "https://example.com/risk-engine")
    .addLink({
      label: "View Risk Assessment Details",
      url: "https://example.com/risk-assessment",
      type: "absolute",
    })
    .build();

  cards.push(riskCard);

  return { cards };
}

/**
 * Patient View: Care Gaps
 */
async function handlePatientViewCareGaps(
  request: CDSHooksRequest
): Promise<CDSHooksResponse> {
  const cards = [];

  // Mock care gaps logic
  const gapCard = new CardBuilder()
    .setSummary("Quality Measure: Annual Diabetes HbA1c Due")
    .setDetail(
      "Patient has not had HbA1c test in the past 12 months. Consider ordering during this visit."
    )
    .setIndicator(CardIndicator.INFO)
    .setSource("Quality Measures Engine")
    .addSuggestion(
      new SuggestionBuilder()
        .setLabel("Order HbA1c Test")
        .setRecommended(true)
        .addCreateAction("Create HbA1c lab order", {
          resourceType: "ServiceRequest",
          status: "draft",
          intent: "order",
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "4548-4",
                display: "Hemoglobin A1c/Hemoglobin.total in Blood",
              },
            ],
          },
          subject: {
            reference: `Patient/${request.context.patientId}`,
          },
        })
        .build()
    )
    .build();

  cards.push(gapCard);

  return { cards };
}

/**
 * Patient View: Medication Reconciliation
 */
async function handleMedicationReconciliation(
  request: CDSHooksRequest
): Promise<CDSHooksResponse> {
  // Mock implementation
  return { cards: [] };
}

/**
 * Order Select: Drug Interaction
 */
async function handleDrugInteraction(
  request: CDSHooksRequest
): Promise<CDSHooksResponse> {
  const cards = [];

  // Mock drug interaction check
  const interactionCard = new CardBuilder()
    .setSummary("Potential Drug-Drug Interaction Detected")
    .setDetail(
      "The selected medication may interact with patient's current medications. Review alternatives or adjust dosage."
    )
    .setIndicator(CardIndicator.CRITICAL)
    .setSource("Drug Interaction Database")
    .addOverrideReason({
      code: "benefit-outweighs-risk",
      display: "Benefit outweighs risk",
    })
    .addOverrideReason({
      code: "patient-previously-tolerated",
      display: "Patient has previously tolerated this combination",
    })
    .addLink({
      label: "View Interaction Details",
      url: "https://example.com/interactions",
      type: "absolute",
    })
    .build();

  cards.push(interactionCard);

  return { cards };
}

/**
 * Order Select: Duplicate Therapy
 */
async function handleDuplicateTherapy(
  request: CDSHooksRequest
): Promise<CDSHooksResponse> {
  // Mock implementation
  return { cards: [] };
}

/**
 * Order Select: Contraindication
 */
async function handleContraindication(
  request: CDSHooksRequest
): Promise<CDSHooksResponse> {
  // Mock implementation
  return { cards: [] };
}

/**
 * Order Sign: Prior Authorization
 */
async function handlePriorAuth(
  request: CDSHooksRequest
): Promise<CDSHooksResponse> {
  const cards = [];

  // Mock prior auth check
  const priorAuthCard = new CardBuilder()
    .setSummary("Prior Authorization Required")
    .setDetail(
      "This medication requires prior authorization from the patient's insurance. Start the authorization process now."
    )
    .setIndicator(CardIndicator.WARNING)
    .setSource("Prior Auth Service")
    .addLink({
      label: "Start Prior Authorization",
      url: "https://example.com/prior-auth",
      type: "absolute",
    })
    .build();

  cards.push(priorAuthCard);

  return { cards };
}

/**
 * Order Sign: Dosage Check
 */
async function handleDosageCheck(
  request: CDSHooksRequest
): Promise<CDSHooksResponse> {
  // Mock implementation
  return { cards: [] };
}

/**
 * Encounter Start: Screening
 */
async function handleScreening(
  request: CDSHooksRequest
): Promise<CDSHooksResponse> {
  const cards = [];

  // Mock screening recommendation
  const screeningCard = new CardBuilder()
    .setSummary("Preventive Screening Due: Colorectal Cancer")
    .setDetail(
      "Patient is age 55 and has not had colorectal cancer screening. USPSTF recommends screening for adults age 50-75."
    )
    .setIndicator(CardIndicator.INFO)
    .setSource("Preventive Care Guidelines")
    .addSuggestion(
      new SuggestionBuilder()
        .setLabel("Order Colonoscopy")
        .setRecommended(true)
        .addCreateAction("Create colonoscopy order", {
          resourceType: "ServiceRequest",
          status: "draft",
          intent: "order",
          code: {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "73761001",
                display: "Colonoscopy",
              },
            ],
          },
          subject: {
            reference: `Patient/${request.context.patientId}`,
          },
        })
        .build()
    )
    .build();

  cards.push(screeningCard);

  return { cards };
}

/**
 * Encounter Discharge: Follow-up
 */
async function handleDischargeFollowup(
  request: CDSHooksRequest
): Promise<CDSHooksResponse> {
  // Mock implementation
  return { cards: [] };
}

/**
 * Appointment Book: Eligibility
 */
async function handleAppointmentEligibility(
  request: CDSHooksRequest
): Promise<CDSHooksResponse> {
  // Mock implementation
  return { cards: [] };
}

/**
 * OPTIONS /api/cds-hooks/:hookId - CORS preflight
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
