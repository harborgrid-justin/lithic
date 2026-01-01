/**
 * CDS Hooks Discovery Endpoint
 * Returns available CDS Hooks services
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createPatientViewService,
  createOrderSelectService,
  createService,
  HookType,
  type CDSDiscoveryResponse,
  PrefetchTemplateBuilder,
} from "@/lib/cds-hooks/service";

/**
 * GET /api/cds-hooks/discovery - CDS Hooks discovery endpoint
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Define available CDS services
    const services: CDSDiscoveryResponse["services"] = [
      // Patient View Services
      createPatientViewService(
        "patient-view-risk-assessment",
        "Displays patient risk assessment and alerts on patient chart view"
      ),
      createPatientViewService(
        "patient-view-care-gaps",
        "Identifies care gaps and quality measures for the patient"
      ),
      createService(
        "patient-view-medication-reconciliation",
        HookType.PATIENT_VIEW,
        "Suggests medication reconciliation when discrepancies are detected",
        {
          title: "Medication Reconciliation",
          prefetch: new PrefetchTemplateBuilder()
            .patientDemographics()
            .medications()
            .allergies()
            .build(),
          usePrefetch: true,
        }
      ),

      // Order Select Services
      createOrderSelectService(
        "order-select-drug-interaction",
        "Checks for drug-drug interactions when ordering medications"
      ),
      createOrderSelectService(
        "order-select-duplicate-therapy",
        "Identifies duplicate therapy when ordering medications"
      ),
      createService(
        "order-select-contraindication",
        HookType.ORDER_SELECT,
        "Checks for contraindications based on patient conditions and allergies",
        {
          title: "Contraindication Check",
          prefetch: new PrefetchTemplateBuilder()
            .patientDemographics()
            .conditions()
            .allergies()
            .medications()
            .labs()
            .build(),
          usePrefetch: true,
        }
      ),

      // Order Sign Services
      createService(
        "order-sign-prior-auth",
        HookType.ORDER_SIGN,
        "Checks if prior authorization is required for the order",
        {
          title: "Prior Authorization Check",
          prefetch: new PrefetchTemplateBuilder()
            .patientDemographics()
            .build(),
          usePrefetch: true,
        }
      ),
      createService(
        "order-sign-dosage-check",
        HookType.ORDER_SIGN,
        "Validates medication dosage based on patient characteristics",
        {
          title: "Dosage Validation",
          prefetch: new PrefetchTemplateBuilder()
            .patientDemographics()
            .vitals()
            .labs()
            .build(),
          usePrefetch: true,
        }
      ),

      // Encounter Services
      createService(
        "encounter-start-screening",
        HookType.ENCOUNTER_START,
        "Suggests appropriate screening and preventive care at encounter start",
        {
          title: "Preventive Care Screening",
          prefetch: new PrefetchTemplateBuilder()
            .patientDemographics()
            .conditions()
            .observations()
            .build(),
          usePrefetch: true,
        }
      ),
      createService(
        "encounter-discharge-followup",
        HookType.ENCOUNTER_DISCHARGE,
        "Recommends follow-up appointments and care plans at discharge",
        {
          title: "Discharge Planning",
          prefetch: new PrefetchTemplateBuilder()
            .patientDemographics()
            .conditions()
            .medications()
            .build(),
          usePrefetch: true,
        }
      ),

      // Appointment Services
      createService(
        "appointment-book-eligibility",
        HookType.APPOINTMENT_BOOK,
        "Checks insurance eligibility and scheduling requirements",
        {
          title: "Appointment Eligibility",
          prefetch: new PrefetchTemplateBuilder()
            .patientDemographics()
            .build(),
          usePrefetch: true,
        }
      ),
    ];

    const response: CDSDiscoveryResponse = {
      services,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("CDS discovery error:", error);
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
 * OPTIONS /api/cds-hooks/discovery - CORS preflight
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
