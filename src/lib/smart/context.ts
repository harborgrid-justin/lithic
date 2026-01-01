/**
 * SMART on FHIR v2 Launch Context
 * Manages launch context parameters including patient, encounter, and user context
 */

import { z } from "zod";

/**
 * SMART Launch Context
 */
export interface SMARTLaunchContext {
  // Core context
  patient?: string;
  encounter?: string;
  user?: string;

  // Additional context
  location?: string;
  organization?: string;
  resource?: string;
  intent?: string;

  // UI context
  need_patient_banner?: boolean;
  smart_style_url?: string;

  // Metadata
  tenant?: string;
  fhirBaseUrl?: string;
}

/**
 * EHR Launch Context Token
 */
export interface LaunchContextToken {
  id: string;
  context: SMARTLaunchContext;
  clientId: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

/**
 * Patient Context
 */
export interface PatientContext {
  id: string;
  reference: string;
  display?: string;
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  name?: string;
  birthDate?: string;
  gender?: string;
}

/**
 * Encounter Context
 */
export interface EncounterContext {
  id: string;
  reference: string;
  display?: string;
  status?: string;
  class?: {
    system: string;
    code: string;
    display?: string;
  };
  type?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  }>;
  serviceProvider?: {
    reference: string;
    display?: string;
  };
  period?: {
    start?: string;
    end?: string;
  };
}

/**
 * User Context (Practitioner or Person)
 */
export interface UserContext {
  id: string;
  reference: string;
  resourceType: "Practitioner" | "Person" | "Patient" | "RelatedPerson";
  display?: string;
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  name?: string;
  role?: string[];
}

/**
 * Location Context
 */
export interface LocationContext {
  id: string;
  reference: string;
  display?: string;
  name?: string;
  type?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  }>;
}

/**
 * Organization Context
 */
export interface OrganizationContext {
  id: string;
  reference: string;
  display?: string;
  name?: string;
  identifier?: Array<{
    system: string;
    value: string;
  }>;
}

/**
 * Intent values per SMART specification
 */
export enum LaunchIntent {
  RECONCILE_MEDICATIONS = "reconcile-medications",
  ORDER_REVIEW = "order-review",
  ORDER_SIGN = "order-sign",
  PROBLEM_REVIEW = "problem-review",
  CARE_PLAN_REVIEW = "care-plan-review",
}

/**
 * SMART Style URL for app styling
 */
export interface SMARTStyle {
  color_background?: string;
  color_error?: string;
  color_highlight?: string;
  color_modal_backdrop?: string;
  color_success?: string;
  color_text?: string;
  dim_border?: string;
  dim_border_radius?: string;
  dim_font_size?: string;
  dim_spacing_size?: string;
  font_family_body?: string;
  font_family_heading?: string;
}

/**
 * Create launch context token
 */
export function createLaunchContextToken(
  clientId: string,
  context: SMARTLaunchContext,
  expiresIn: number = 300 // 5 minutes default
): LaunchContextToken {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresIn * 1000);

  return {
    id: generateLaunchToken(),
    context,
    clientId,
    createdAt: now,
    expiresAt,
    used: false,
  };
}

/**
 * Generate launch token
 */
export function generateLaunchToken(): string {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Validate launch context
 */
export function validateLaunchContext(context: SMARTLaunchContext): boolean {
  try {
    LaunchContextSchema.parse(context);
    return true;
  } catch (error) {
    console.error("Launch context validation error:", error);
    return false;
  }
}

/**
 * Extract patient context from FHIR Patient resource
 */
export function extractPatientContext(patientResource: unknown): PatientContext | null {
  try {
    const patient = patientResource as {
      id: string;
      identifier?: Array<{ system: string; value: string }>;
      name?: Array<{ given?: string[]; family?: string }>;
      birthDate?: string;
      gender?: string;
    };

    if (!patient.id) {
      return null;
    }

    const name = patient.name?.[0];
    const displayName = name
      ? `${name.given?.join(" ") || ""} ${name.family || ""}`.trim()
      : undefined;

    return {
      id: patient.id,
      reference: `Patient/${patient.id}`,
      display: displayName,
      identifier: patient.identifier,
      name: displayName,
      birthDate: patient.birthDate,
      gender: patient.gender,
    };
  } catch (error) {
    console.error("Error extracting patient context:", error);
    return null;
  }
}

/**
 * Extract encounter context from FHIR Encounter resource
 */
export function extractEncounterContext(encounterResource: unknown): EncounterContext | null {
  try {
    const encounter = encounterResource as {
      id: string;
      status?: string;
      class?: { system: string; code: string; display?: string };
      type?: Array<{
        coding: Array<{
          system: string;
          code: string;
          display?: string;
        }>;
      }>;
      serviceProvider?: { reference: string; display?: string };
      period?: { start?: string; end?: string };
    };

    if (!encounter.id) {
      return null;
    }

    return {
      id: encounter.id,
      reference: `Encounter/${encounter.id}`,
      status: encounter.status,
      class: encounter.class,
      type: encounter.type,
      serviceProvider: encounter.serviceProvider,
      period: encounter.period,
    };
  } catch (error) {
    console.error("Error extracting encounter context:", error);
    return null;
  }
}

/**
 * Extract user context from FHIR Practitioner/Person resource
 */
export function extractUserContext(userResource: unknown): UserContext | null {
  try {
    const user = userResource as {
      id: string;
      resourceType: string;
      identifier?: Array<{ system: string; value: string }>;
      name?: Array<{ given?: string[]; family?: string; text?: string }>;
    };

    if (!user.id || !user.resourceType) {
      return null;
    }

    const name = user.name?.[0];
    const displayName =
      name?.text || `${name?.given?.join(" ") || ""} ${name?.family || ""}`.trim();

    return {
      id: user.id,
      reference: `${user.resourceType}/${user.id}`,
      resourceType: user.resourceType as "Practitioner" | "Person" | "Patient" | "RelatedPerson",
      display: displayName,
      identifier: user.identifier,
      name: displayName,
    };
  } catch (error) {
    console.error("Error extracting user context:", error);
    return null;
  }
}

/**
 * Merge launch contexts
 */
export function mergeLaunchContexts(
  existing: SMARTLaunchContext,
  additional: Partial<SMARTLaunchContext>
): SMARTLaunchContext {
  return {
    ...existing,
    ...additional,
  };
}

/**
 * Check if context contains patient
 */
export function hasPatientContext(context: SMARTLaunchContext): boolean {
  return !!context.patient;
}

/**
 * Check if context contains encounter
 */
export function hasEncounterContext(context: SMARTLaunchContext): boolean {
  return !!context.encounter;
}

/**
 * Check if context contains user
 */
export function hasUserContext(context: SMARTLaunchContext): boolean {
  return !!context.user;
}

/**
 * Get context banner requirements
 */
export function needsPatientBanner(context: SMARTLaunchContext): boolean {
  return context.need_patient_banner === true;
}

/**
 * Parse SMART style URL
 */
export async function fetchSMARTStyle(styleUrl: string): Promise<SMARTStyle | null> {
  try {
    const response = await fetch(styleUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch SMART style");
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching SMART style:", error);
    return null;
  }
}

/**
 * Validation schemas
 */
export const LaunchContextSchema = z.object({
  patient: z.string().optional(),
  encounter: z.string().optional(),
  user: z.string().optional(),
  location: z.string().optional(),
  organization: z.string().optional(),
  resource: z.string().optional(),
  intent: z.string().optional(),
  need_patient_banner: z.boolean().optional(),
  smart_style_url: z.string().url().optional(),
  tenant: z.string().optional(),
  fhirBaseUrl: z.string().url().optional(),
});

export const PatientContextSchema = z.object({
  id: z.string(),
  reference: z.string(),
  display: z.string().optional(),
  identifier: z
    .array(
      z.object({
        system: z.string(),
        value: z.string(),
      })
    )
    .optional(),
  name: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
});

export const EncounterContextSchema = z.object({
  id: z.string(),
  reference: z.string(),
  display: z.string().optional(),
  status: z.string().optional(),
  class: z
    .object({
      system: z.string(),
      code: z.string(),
      display: z.string().optional(),
    })
    .optional(),
  type: z
    .array(
      z.object({
        coding: z.array(
          z.object({
            system: z.string(),
            code: z.string(),
            display: z.string().optional(),
          })
        ),
      })
    )
    .optional(),
  serviceProvider: z
    .object({
      reference: z.string(),
      display: z.string().optional(),
    })
    .optional(),
  period: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
});

export const UserContextSchema = z.object({
  id: z.string(),
  reference: z.string(),
  resourceType: z.enum(["Practitioner", "Person", "Patient", "RelatedPerson"]),
  display: z.string().optional(),
  identifier: z
    .array(
      z.object({
        system: z.string(),
        value: z.string(),
      })
    )
    .optional(),
  name: z.string().optional(),
  role: z.array(z.string()).optional(),
});

export const SMARTStyleSchema = z.object({
  color_background: z.string().optional(),
  color_error: z.string().optional(),
  color_highlight: z.string().optional(),
  color_modal_backdrop: z.string().optional(),
  color_success: z.string().optional(),
  color_text: z.string().optional(),
  dim_border: z.string().optional(),
  dim_border_radius: z.string().optional(),
  dim_font_size: z.string().optional(),
  dim_spacing_size: z.string().optional(),
  font_family_body: z.string().optional(),
  font_family_heading: z.string().optional(),
});
