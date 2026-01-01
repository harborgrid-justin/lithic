/**
 * CDS Hooks 2.0 Service Implementation
 * Service definition, hook types, and card generation
 */

import { z } from "zod";

/**
 * CDS Hooks Hook Types
 */
export enum HookType {
  PATIENT_VIEW = "patient-view",
  ORDER_SELECT = "order-select",
  ORDER_SIGN = "order-sign",
  ORDER_DISPATCH = "order-dispatch",
  APPOINTMENT_BOOK = "appointment-book",
  ENCOUNTER_START = "encounter-start",
  ENCOUNTER_DISCHARGE = "encounter-discharge",
}

/**
 * Card Indicator (visual priority)
 */
export enum CardIndicator {
  INFO = "info",
  WARNING = "warning",
  CRITICAL = "critical",
}

/**
 * Action Type
 */
export enum ActionType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
}

/**
 * CDS Hooks Service Definition
 */
export interface CDSService {
  hook: HookType | string;
  title?: string;
  description: string;
  id: string;
  prefetch?: Record<string, string>;
  usePrefetch?: boolean;
}

/**
 * CDS Hooks Discovery Response
 */
export interface CDSDiscoveryResponse {
  services: CDSService[];
}

/**
 * Hook Context (varies by hook type)
 */
export interface HookContext {
  userId: string;
  patientId?: string;
  encounterId?: string;
  medications?: unknown[];
  orders?: unknown[];
  draftOrders?: unknown[];
  selections?: string[];
  appointments?: unknown[];
  [key: string]: unknown;
}

/**
 * CDS Hooks Request
 */
export interface CDSHooksRequest {
  hook: string;
  hookInstance: string;
  fhirServer?: string;
  fhirAuthorization?: {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    subject: string;
  };
  context: HookContext;
  prefetch?: Record<string, unknown>;
}

/**
 * CDS Hooks Card
 */
export interface CDSCard {
  uuid?: string;
  summary: string;
  detail?: string;
  indicator: CardIndicator;
  source: {
    label: string;
    url?: string;
    icon?: string;
    topic?: {
      system: string;
      code: string;
      display?: string;
    };
  };
  suggestions?: CDSSuggestion[];
  selectionBehavior?: "at-most-one" | "any";
  overrideReasons?: CDSOverrideReason[];
  links?: CDSLink[];
}

/**
 * CDS Suggestion
 */
export interface CDSSuggestion {
  label: string;
  uuid?: string;
  isRecommended?: boolean;
  actions?: CDSAction[];
}

/**
 * CDS Action
 */
export interface CDSAction {
  type: ActionType;
  description: string;
  resource?: unknown; // FHIR resource
  resourceId?: string[];
}

/**
 * CDS Link
 */
export interface CDSLink {
  label: string;
  url: string;
  type: "absolute" | "smart";
  appContext?: string;
}

/**
 * CDS Override Reason
 */
export interface CDSOverrideReason {
  code: string;
  display: string;
  system?: string;
}

/**
 * CDS Hooks Response
 */
export interface CDSHooksResponse {
  cards: CDSCard[];
  systemActions?: CDSAction[];
}

/**
 * CDS Hooks Feedback
 */
export interface CDSFeedback {
  card: string; // Card UUID
  outcome: "accepted" | "overridden" | "ignored";
  acceptedSuggestions?: Array<{
    id: string;
  }>;
  overrideReasons?: CDSOverrideReason[];
  outcomeTimestamp: string;
}

/**
 * Prefetch Template Builder
 */
export class PrefetchTemplateBuilder {
  private templates: Record<string, string> = {};

  addTemplate(key: string, query: string): this {
    this.templates[key] = query;
    return this;
  }

  patientDemographics(): this {
    return this.addTemplate(
      "patient",
      "Patient/{{context.patientId}}"
    );
  }

  conditions(): this {
    return this.addTemplate(
      "conditions",
      "Condition?patient={{context.patientId}}"
    );
  }

  medications(): this {
    return this.addTemplate(
      "medications",
      "MedicationRequest?patient={{context.patientId}}&status=active"
    );
  }

  allergies(): this {
    return this.addTemplate(
      "allergies",
      "AllergyIntolerance?patient={{context.patientId}}"
    );
  }

  observations(): this {
    return this.addTemplate(
      "observations",
      "Observation?patient={{context.patientId}}&_sort=-date&_count=10"
    );
  }

  vitals(): this {
    return this.addTemplate(
      "vitals",
      "Observation?patient={{context.patientId}}&category=vital-signs&_sort=-date&_count=10"
    );
  }

  labs(): this {
    return this.addTemplate(
      "labs",
      "Observation?patient={{context.patientId}}&category=laboratory&_sort=-date&_count=10"
    );
  }

  encounters(): this {
    return this.addTemplate(
      "encounters",
      "Encounter?patient={{context.patientId}}&_sort=-date&_count=10"
    );
  }

  build(): Record<string, string> {
    return { ...this.templates };
  }
}

/**
 * Card Builder
 */
export class CardBuilder {
  private card: Partial<CDSCard> = {
    indicator: CardIndicator.INFO,
    source: {
      label: "Lithic CDS",
    },
  };

  setSummary(summary: string): this {
    this.card.summary = summary;
    return this;
  }

  setDetail(detail: string): this {
    this.card.detail = detail;
    return this;
  }

  setIndicator(indicator: CardIndicator): this {
    this.card.indicator = indicator;
    return this;
  }

  setSource(label: string, url?: string, icon?: string): this {
    this.card.source = { label, url, icon };
    return this;
  }

  addSuggestion(suggestion: CDSSuggestion): this {
    if (!this.card.suggestions) {
      this.card.suggestions = [];
    }
    this.card.suggestions.push(suggestion);
    return this;
  }

  addLink(link: CDSLink): this {
    if (!this.card.links) {
      this.card.links = [];
    }
    this.card.links.push(link);
    return this;
  }

  addOverrideReason(reason: CDSOverrideReason): this {
    if (!this.card.overrideReasons) {
      this.card.overrideReasons = [];
    }
    this.card.overrideReasons.push(reason);
    return this;
  }

  setSelectionBehavior(behavior: "at-most-one" | "any"): this {
    this.card.selectionBehavior = behavior;
    return this;
  }

  build(): CDSCard {
    if (!this.card.summary) {
      throw new Error("Card summary is required");
    }
    return this.card as CDSCard;
  }
}

/**
 * Suggestion Builder
 */
export class SuggestionBuilder {
  private suggestion: Partial<CDSSuggestion> = {};

  setLabel(label: string): this {
    this.suggestion.label = label;
    return this;
  }

  setRecommended(recommended: boolean): this {
    this.suggestion.isRecommended = recommended;
    return this;
  }

  addAction(action: CDSAction): this {
    if (!this.suggestion.actions) {
      this.suggestion.actions = [];
    }
    this.suggestion.actions.push(action);
    return this;
  }

  addCreateAction(description: string, resource: unknown): this {
    return this.addAction({
      type: ActionType.CREATE,
      description,
      resource,
    });
  }

  addUpdateAction(description: string, resource: unknown): this {
    return this.addAction({
      type: ActionType.UPDATE,
      description,
      resource,
    });
  }

  addDeleteAction(description: string, resourceId: string[]): this {
    return this.addAction({
      type: ActionType.DELETE,
      description,
      resourceId,
    });
  }

  build(): CDSSuggestion {
    if (!this.suggestion.label) {
      throw new Error("Suggestion label is required");
    }
    return this.suggestion as CDSSuggestion;
  }
}

/**
 * Create a CDS service definition
 */
export function createService(
  id: string,
  hook: HookType | string,
  description: string,
  options?: {
    title?: string;
    prefetch?: Record<string, string>;
    usePrefetch?: boolean;
  }
): CDSService {
  return {
    id,
    hook,
    description,
    title: options?.title,
    prefetch: options?.prefetch,
    usePrefetch: options?.usePrefetch,
  };
}

/**
 * Create a patient-view service
 */
export function createPatientViewService(
  id: string,
  description: string,
  includePrefetch: boolean = true
): CDSService {
  const prefetch = includePrefetch
    ? new PrefetchTemplateBuilder()
        .patientDemographics()
        .conditions()
        .medications()
        .allergies()
        .vitals()
        .build()
    : undefined;

  return createService(id, HookType.PATIENT_VIEW, description, {
    title: "Patient View CDS",
    prefetch,
    usePrefetch: includePrefetch,
  });
}

/**
 * Create an order-select service
 */
export function createOrderSelectService(
  id: string,
  description: string,
  includePrefetch: boolean = true
): CDSService {
  const prefetch = includePrefetch
    ? new PrefetchTemplateBuilder()
        .patientDemographics()
        .conditions()
        .medications()
        .allergies()
        .labs()
        .build()
    : undefined;

  return createService(id, HookType.ORDER_SELECT, description, {
    title: "Order Select CDS",
    prefetch,
    usePrefetch: includePrefetch,
  });
}

/**
 * Validate CDS Hooks request
 */
export function validateCDSRequest(request: unknown): boolean {
  try {
    CDSRequestSchema.parse(request);
    return true;
  } catch (error) {
    console.error("CDS request validation error:", error);
    return false;
  }
}

/**
 * Validation schemas
 */
export const CDSRequestSchema = z.object({
  hook: z.string(),
  hookInstance: z.string(),
  fhirServer: z.string().url().optional(),
  fhirAuthorization: z
    .object({
      access_token: z.string(),
      token_type: z.string(),
      expires_in: z.number(),
      scope: z.string(),
      subject: z.string(),
    })
    .optional(),
  context: z.record(z.unknown()),
  prefetch: z.record(z.unknown()).optional(),
});

export const CDSCardSchema = z.object({
  uuid: z.string().optional(),
  summary: z.string(),
  detail: z.string().optional(),
  indicator: z.nativeEnum(CardIndicator),
  source: z.object({
    label: z.string(),
    url: z.string().url().optional(),
    icon: z.string().url().optional(),
    topic: z
      .object({
        system: z.string(),
        code: z.string(),
        display: z.string().optional(),
      })
      .optional(),
  }),
  suggestions: z.array(z.any()).optional(),
  selectionBehavior: z.enum(["at-most-one", "any"]).optional(),
  overrideReasons: z.array(z.any()).optional(),
  links: z.array(z.any()).optional(),
});

export const CDSResponseSchema = z.object({
  cards: z.array(CDSCardSchema),
  systemActions: z.array(z.any()).optional(),
});
