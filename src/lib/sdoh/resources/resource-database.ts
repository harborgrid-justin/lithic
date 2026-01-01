/**
 * Community Resource Database Management
 * 211 LA Taxonomy Compliant
 * SDOH & Care Coordination Specialist - Agent 7
 */

import { z } from "zod";

// ============================================================================
// 211 LA Taxonomy Types
// ============================================================================

export enum ResourceCategory {
  // Basic Needs
  FOOD = "FOOD",
  HOUSING = "HOUSING",
  CLOTHING = "CLOTHING",
  UTILITIES = "UTILITIES",
  HOUSEHOLD_GOODS = "HOUSEHOLD_GOODS",

  // Transportation
  TRANSPORTATION = "TRANSPORTATION",

  // Healthcare
  HEALTHCARE = "HEALTHCARE",
  MENTAL_HEALTH = "MENTAL_HEALTH",
  SUBSTANCE_ABUSE = "SUBSTANCE_ABUSE",
  DENTAL_CARE = "DENTAL_CARE",
  VISION_CARE = "VISION_CARE",

  // Financial
  FINANCIAL_ASSISTANCE = "FINANCIAL_ASSISTANCE",
  EMPLOYMENT = "EMPLOYMENT",
  INCOME_SUPPORT = "INCOME_SUPPORT",

  // Education
  EDUCATION = "EDUCATION",
  LITERACY = "LITERACY",
  CHILDCARE = "CHILDCARE",

  // Legal
  LEGAL_SERVICES = "LEGAL_SERVICES",
  IMMIGRATION = "IMMIGRATION",

  // Safety
  DOMESTIC_VIOLENCE = "DOMESTIC_VIOLENCE",
  EMERGENCY_SHELTER = "EMERGENCY_SHELTER",

  // Social Support
  SOCIAL_SERVICES = "SOCIAL_SERVICES",
  SUPPORT_GROUPS = "SUPPORT_GROUPS",
  DISABILITY_SERVICES = "DISABILITY_SERVICES",
  SENIOR_SERVICES = "SENIOR_SERVICES",
  VETERAN_SERVICES = "VETERAN_SERVICES",
}

export enum ServiceDeliveryMethod {
  IN_PERSON = "IN_PERSON",
  PHONE = "PHONE",
  VIDEO = "VIDEO",
  ONLINE = "ONLINE",
  MOBILE = "MOBILE",
  HOME_VISIT = "HOME_VISIT",
}

// ============================================================================
// Resource Types
// ============================================================================

export interface CommunityResource {
  id: string;
  organizationId: string;
  externalId?: string; // ID from external database (FindHelp, 211, etc.)

  // Basic Information
  name: string;
  description: string;
  shortDescription?: string;
  category: ResourceCategory;
  subcategories: string[];
  taxonomyCodes: string[]; // 211 LA Taxonomy codes

  // Contact Information
  contact: ResourceContact;
  locations: ResourceLocation[];

  // Service Details
  services: Service[];
  eligibility: EligibilityCriteria;
  applicationProcess: ApplicationProcess;

  // Availability
  hoursOfOperation: HoursOfOperation[];
  languages: string[];
  accessibility: AccessibilityFeatures;

  // Quality Metrics
  verified: boolean;
  verifiedDate?: Date;
  verifiedBy?: string;
  lastUpdated: Date;
  rating?: number;
  reviewCount?: number;

  // Integration
  website?: string;
  intakeFormUrl?: string;
  referralMethod: ReferralMethod;
  acceptsReferrals: boolean;
  closedLoopEnabled: boolean;

  // Status
  isActive: boolean;
  capacity?: ResourceCapacity;
  waitlistAvailable: boolean;

  // Metadata
  tags: string[];
  notes?: string;
  internalNotes?: string;
}

export interface ResourceContact {
  primaryPhone: string;
  alternatePhone?: string;
  fax?: string;
  email?: string;
  website?: string;
  hotline?: string;
  tty?: string;
  contactPerson?: string;
  socialMedia?: SocialMediaLinks;
}

export interface SocialMediaLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
}

export interface ResourceLocation {
  id: string;
  isPrimary: boolean;
  name?: string;
  address: Address;
  coordinates?: Coordinates;
  serviceArea?: ServiceArea;
  accessibility: AccessibilityFeatures;
  publicTransportation?: string[];
  parkingAvailable: boolean;
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ServiceArea {
  type: "city" | "county" | "state" | "zip_codes" | "radius";
  values: string[];
  radius?: number; // in miles
  radiusCenter?: Coordinates;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: ResourceCategory;
  deliveryMethods: ServiceDeliveryMethod[];
  cost: ServiceCost;
  duration?: string;
  frequency?: string;
  capacity?: number;
  languages: string[];
}

export interface ServiceCost {
  type: "free" | "sliding_scale" | "insurance" | "fee" | "varies";
  amount?: number;
  description?: string;
  insuranceAccepted?: string[];
  paymentMethods?: string[];
}

export interface EligibilityCriteria {
  ageMin?: number;
  ageMax?: number;
  gender?: string[];
  income?: IncomeRequirement;
  geographic?: string[];
  insurance?: string[];
  citizenship?: string[];
  otherRequirements?: string[];
  documentation?: string[];
  disqualifiers?: string[];
}

export interface IncomeRequirement {
  type: "fpl" | "ami" | "absolute";
  percentage?: number; // e.g., 200 for 200% FPL
  maxIncome?: number;
  householdSizeConsidered: boolean;
}

export interface ApplicationProcess {
  method: "walk_in" | "phone" | "online" | "referral_only" | "appointment";
  steps: string[];
  requiredDocuments: string[];
  processingTime?: string;
  intakeFormUrl?: string;
  appointmentRequired: boolean;
  selfReferralAllowed: boolean;
}

export interface HoursOfOperation {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  openTime: string; // HH:MM format
  closeTime: string; // HH:MM format
  isClosed: boolean;
  notes?: string;
}

export interface AccessibilityFeatures {
  wheelchairAccessible: boolean;
  adaCompliant: boolean;
  interpreterAvailable: boolean;
  signLanguageAvailable: boolean;
  ttyAvailable: boolean;
  features: string[];
}

export enum ReferralMethod {
  EMAIL = "EMAIL",
  FAX = "FAX",
  PHONE = "PHONE",
  ONLINE_FORM = "ONLINE_FORM",
  API = "API",
  MANUAL = "MANUAL",
}

export interface ResourceCapacity {
  total?: number;
  available?: number;
  lastUpdated: Date;
  status: "available" | "limited" | "full" | "waitlist";
}

// ============================================================================
// Resource Search & Filtering
// ============================================================================

export interface ResourceSearchCriteria {
  // What
  categories?: ResourceCategory[];
  subcategories?: string[];
  keywords?: string;
  taxonomyCodes?: string[];

  // Where
  location?: Coordinates;
  radius?: number; // in miles
  zipCode?: string;
  city?: string;
  county?: string;
  state?: string;

  // Who
  age?: number;
  income?: number;
  householdSize?: number;
  insurance?: string;
  languages?: string[];

  // When
  needsImmediateHelp?: boolean;
  availableNow?: boolean;

  // How
  deliveryMethods?: ServiceDeliveryMethod[];
  acceptsWalkIns?: boolean;
  acceptsReferrals?: boolean;

  // Filters
  verifiedOnly?: boolean;
  activeOnly?: boolean;
  closedLoopOnly?: boolean;
  freeOnly?: boolean;
  hasCapacity?: boolean;

  // Sorting
  sortBy?: "distance" | "name" | "rating" | "recent";
  sortOrder?: "asc" | "desc";

  // Pagination
  limit?: number;
  offset?: number;
}

export interface ResourceSearchResult {
  resource: CommunityResource;
  distance?: number; // in miles
  matchScore: number; // 0-100
  matchReasons: string[];
  eligibilityMatch: EligibilityMatch;
  availability: AvailabilityStatus;
}

export interface EligibilityMatch {
  eligible: boolean;
  reasons: string[];
  missingInfo: string[];
  potentialBarriers: string[];
}

export interface AvailabilityStatus {
  available: boolean;
  nextAvailableTime?: Date;
  waitlistEstimate?: string;
  capacity?: ResourceCapacity;
}

// ============================================================================
// Resource Management Functions
// ============================================================================

export class ResourceDatabase {
  private resources: Map<string, CommunityResource> = new Map();

  /**
   * Add resource to database
   */
  addResource(resource: CommunityResource): void {
    this.resources.set(resource.id, resource);
  }

  /**
   * Update resource
   */
  updateResource(id: string, updates: Partial<CommunityResource>): void {
    const resource = this.resources.get(id);
    if (resource) {
      this.resources.set(id, { ...resource, ...updates, lastUpdated: new Date() });
    }
  }

  /**
   * Delete resource
   */
  deleteResource(id: string): void {
    this.resources.delete(id);
  }

  /**
   * Get resource by ID
   */
  getResource(id: string): CommunityResource | undefined {
    return this.resources.get(id);
  }

  /**
   * Get all resources
   */
  getAllResources(): CommunityResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * Get resources by category
   */
  getResourcesByCategory(category: ResourceCategory): CommunityResource[] {
    return Array.from(this.resources.values()).filter(
      (r) => r.category === category && r.isActive
    );
  }

  /**
   * Search resources by keywords
   */
  searchByKeywords(keywords: string): CommunityResource[] {
    const terms = keywords.toLowerCase().split(/\s+/);
    return Array.from(this.resources.values()).filter((resource) => {
      const searchText = `
        ${resource.name}
        ${resource.description}
        ${resource.subcategories.join(" ")}
        ${resource.tags.join(" ")}
      `.toLowerCase();

      return terms.every((term) => searchText.includes(term));
    });
  }

  /**
   * Verify resource
   */
  verifyResource(id: string, verifiedBy: string): void {
    const resource = this.resources.get(id);
    if (resource) {
      this.resources.set(id, {
        ...resource,
        verified: true,
        verifiedDate: new Date(),
        verifiedBy,
        lastUpdated: new Date(),
      });
    }
  }

  /**
   * Update resource capacity
   */
  updateCapacity(id: string, capacity: ResourceCapacity): void {
    const resource = this.resources.get(id);
    if (resource) {
      this.resources.set(id, {
        ...resource,
        capacity,
        lastUpdated: new Date(),
      });
    }
  }

  /**
   * Get resources needing verification
   */
  getResourcesNeedingVerification(daysOld: number = 90): CommunityResource[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return Array.from(this.resources.values()).filter(
      (resource) =>
        !resource.verified ||
        !resource.verifiedDate ||
        resource.verifiedDate < cutoffDate
    );
  }

  /**
   * Export resources to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(Array.from(this.resources.values()), null, 2);
  }

  /**
   * Import resources from JSON
   */
  importFromJSON(json: string): void {
    const resources: CommunityResource[] = JSON.parse(json);
    resources.forEach((resource) => {
      this.resources.set(resource.id, resource);
    });
  }
}

// ============================================================================
// Distance Calculation
// ============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
      Math.cos(toRad(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const AddressSchema = z.object({
  street1: z.string(),
  street2: z.string().optional(),
  city: z.string(),
  state: z.string().length(2),
  zipCode: z.string(),
  county: z.string().optional(),
});

export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const ResourceSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(10),
  category: z.nativeEnum(ResourceCategory),
  subcategories: z.array(z.string()),
  contact: z.object({
    primaryPhone: z.string(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
  }),
  locations: z.array(
    z.object({
      isPrimary: z.boolean(),
      address: AddressSchema,
      coordinates: CoordinatesSchema.optional(),
    })
  ),
  isActive: z.boolean().default(true),
});

export type ResourceInput = z.infer<typeof ResourceSchema>;
