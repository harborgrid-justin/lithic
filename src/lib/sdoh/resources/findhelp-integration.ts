/**
 * FindHelp (Aunt Bertha) API Integration
 * 211 Database Integration
 * SDOH & Care Coordination Specialist - Agent 7
 */

import { z } from "zod";
import {
  type CommunityResource,
  type ResourceLocation,
  type Service,
  type EligibilityCriteria,
  type HoursOfOperation,
  ResourceCategory,
  ServiceDeliveryMethod,
  ReferralMethod,
} from "./resource-database";

// ============================================================================
// FindHelp API Types
// ============================================================================

export interface FindHelpConfig {
  apiKey: string;
  apiUrl: string;
  organizationId: string;
  environment: "production" | "sandbox";
}

export interface FindHelpSearchRequest {
  location: {
    latitude: number;
    longitude: number;
  } | {
    zipCode: string;
  };
  radius?: number; // in miles
  categories?: string[];
  searchTerms?: string;
  page?: number;
  perPage?: number;
}

export interface FindHelpSearchResponse {
  results: FindHelpResource[];
  totalResults: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface FindHelpResource {
  id: string;
  name: string;
  description: string;
  url: string;
  organization: {
    id: string;
    name: string;
    description?: string;
  };
  categories: FindHelpCategory[];
  services: FindHelpService[];
  locations: FindHelpLocation[];
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  eligibility?: string[];
  requiredDocuments?: string[];
  applicationProcess?: string;
  languages?: string[];
  accessibility?: string[];
  lastVerified?: string;
  rating?: number;
  reviewCount?: number;
}

export interface FindHelpCategory {
  id: string;
  name: string;
  taxonomyCode?: string;
  parentId?: string;
}

export interface FindHelpService {
  id: string;
  name: string;
  description?: string;
  fee?: string;
}

export interface FindHelpLocation {
  id: string;
  name?: string;
  address: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    county?: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  phone?: string;
  hours?: string[];
  accessibility?: string[];
  publicTransit?: string[];
}

// ============================================================================
// 211 API Types
// ============================================================================

export interface TwoOneOneConfig {
  apiKey: string;
  apiUrl: string;
  providerId: string;
}

export interface TwoOneOneSearchRequest {
  searchString?: string;
  taxonomyCode?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  city?: string;
  state?: string;
  zipCode?: string;
  page?: number;
  pageSize?: number;
}

export interface TwoOneOneResource {
  id: string;
  agencyId: string;
  agencyName: string;
  name: string;
  description: string;
  url?: string;
  taxonomyCodes: string[];
  taxonomyTerms: string[];
  addresses: TwoOneOneAddress[];
  phones: TwoOneOnePhone[];
  emails: string[];
  hours: string[];
  eligibility?: string;
  applicationProcess?: string;
  documents?: string;
  fees?: string;
  languages: string[];
  accessibility: string[];
  lastVerified?: string;
}

export interface TwoOneOneAddress {
  type: string;
  street1: string;
  street2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface TwoOneOnePhone {
  type: string;
  number: string;
  extension?: string;
}

// ============================================================================
// FindHelp API Client
// ============================================================================

export class FindHelpClient {
  private config: FindHelpConfig;

  constructor(config: FindHelpConfig) {
    this.config = config;
  }

  /**
   * Search for resources using FindHelp API
   */
  async searchResources(
    request: FindHelpSearchRequest
  ): Promise<FindHelpSearchResponse> {
    const url = new URL(`${this.config.apiUrl}/search`);

    // Add location parameters
    if ("latitude" in request.location) {
      url.searchParams.append("lat", request.location.latitude.toString());
      url.searchParams.append("lng", request.location.longitude.toString());
    } else if ("zipCode" in request.location) {
      url.searchParams.append("zip", request.location.zipCode);
    }

    // Add optional parameters
    if (request.radius) {
      url.searchParams.append("radius", request.radius.toString());
    }
    if (request.categories) {
      url.searchParams.append("categories", request.categories.join(","));
    }
    if (request.searchTerms) {
      url.searchParams.append("search", request.searchTerms);
    }
    if (request.page) {
      url.searchParams.append("page", request.page.toString());
    }
    if (request.perPage) {
      url.searchParams.append("per_page", request.perPage.toString());
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`FindHelp API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get detailed resource information
   */
  async getResource(resourceId: string): Promise<FindHelpResource> {
    const url = `${this.config.apiUrl}/resources/${resourceId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`FindHelp API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a referral in FindHelp
   */
  async createReferral(referral: {
    resourceId: string;
    patientInfo: {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
    };
    notes?: string;
  }): Promise<{ referralId: string; status: string }> {
    const url = `${this.config.apiUrl}/referrals`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organization_id: this.config.organizationId,
        resource_id: referral.resourceId,
        patient: referral.patientInfo,
        notes: referral.notes,
      }),
    });

    if (!response.ok) {
      throw new Error(`FindHelp API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get referral status
   */
  async getReferralStatus(referralId: string): Promise<{
    id: string;
    status: string;
    statusUpdates: Array<{
      status: string;
      timestamp: string;
      notes?: string;
    }>;
  }> {
    const url = `${this.config.apiUrl}/referrals/${referralId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`FindHelp API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Convert FindHelp resource to internal format
   */
  convertToInternalFormat(
    findHelpResource: FindHelpResource,
    organizationId: string
  ): CommunityResource {
    return {
      id: `findhelp_${findHelpResource.id}`,
      organizationId,
      externalId: findHelpResource.id,
      name: findHelpResource.name,
      description: findHelpResource.description,
      shortDescription: findHelpResource.description.substring(0, 200),
      category: this.mapCategory(findHelpResource.categories[0]?.name),
      subcategories: findHelpResource.categories.map((c) => c.name),
      taxonomyCodes: findHelpResource.categories
        .map((c) => c.taxonomyCode)
        .filter((code): code is string => !!code),
      contact: {
        primaryPhone: findHelpResource.contact.phone || "",
        email: findHelpResource.contact.email,
        website: findHelpResource.contact.website || findHelpResource.url,
      },
      locations: findHelpResource.locations.map((loc, index) =>
        this.convertLocation(loc, index === 0)
      ),
      services: findHelpResource.services.map((svc) => this.convertService(svc)),
      eligibility: this.convertEligibility(findHelpResource.eligibility),
      applicationProcess: {
        method: "walk_in",
        steps: findHelpResource.applicationProcess
          ? [findHelpResource.applicationProcess]
          : [],
        requiredDocuments: findHelpResource.requiredDocuments || [],
        appointmentRequired: false,
        selfReferralAllowed: true,
      },
      hoursOfOperation: [],
      languages: findHelpResource.languages || ["English"],
      accessibility: {
        wheelchairAccessible: false,
        adaCompliant: false,
        interpreterAvailable: false,
        signLanguageAvailable: false,
        ttyAvailable: false,
        features: findHelpResource.accessibility || [],
      },
      verified: !!findHelpResource.lastVerified,
      verifiedDate: findHelpResource.lastVerified
        ? new Date(findHelpResource.lastVerified)
        : undefined,
      lastUpdated: new Date(),
      rating: findHelpResource.rating,
      reviewCount: findHelpResource.reviewCount,
      website: findHelpResource.url,
      referralMethod: ReferralMethod.API,
      acceptsReferrals: true,
      closedLoopEnabled: true,
      isActive: true,
      waitlistAvailable: false,
      tags: findHelpResource.categories.map((c) => c.name),
    };
  }

  private mapCategory(categoryName: string): ResourceCategory {
    const categoryMap: Record<string, ResourceCategory> = {
      food: ResourceCategory.FOOD,
      "food pantries": ResourceCategory.FOOD,
      housing: ResourceCategory.HOUSING,
      shelter: ResourceCategory.EMERGENCY_SHELTER,
      transportation: ResourceCategory.TRANSPORTATION,
      healthcare: ResourceCategory.HEALTHCARE,
      "mental health": ResourceCategory.MENTAL_HEALTH,
      "substance abuse": ResourceCategory.SUBSTANCE_ABUSE,
      employment: ResourceCategory.EMPLOYMENT,
      education: ResourceCategory.EDUCATION,
      legal: ResourceCategory.LEGAL_SERVICES,
      "domestic violence": ResourceCategory.DOMESTIC_VIOLENCE,
      childcare: ResourceCategory.CHILDCARE,
      utilities: ResourceCategory.UTILITIES,
    };

    const normalized = categoryName.toLowerCase();
    return categoryMap[normalized] || ResourceCategory.SOCIAL_SERVICES;
  }

  private convertLocation(
    location: FindHelpLocation,
    isPrimary: boolean
  ): ResourceLocation {
    return {
      id: location.id,
      isPrimary,
      name: location.name,
      address: {
        street1: location.address.street1,
        street2: location.address.street2,
        city: location.address.city,
        state: location.address.state,
        zipCode: location.address.zipCode,
        county: location.address.county,
      },
      coordinates: location.coordinates
        ? {
            latitude: location.coordinates.latitude,
            longitude: location.coordinates.longitude,
          }
        : undefined,
      accessibility: {
        wheelchairAccessible: false,
        adaCompliant: false,
        interpreterAvailable: false,
        signLanguageAvailable: false,
        ttyAvailable: false,
        features: location.accessibility || [],
      },
      publicTransportation: location.publicTransit,
      parkingAvailable: false,
    };
  }

  private convertService(service: FindHelpService): Service {
    return {
      id: service.id,
      name: service.name,
      description: service.description || "",
      category: ResourceCategory.SOCIAL_SERVICES,
      deliveryMethods: [ServiceDeliveryMethod.IN_PERSON],
      cost: {
        type: service.fee ? "varies" : "free",
        description: service.fee,
      },
      languages: ["English"],
    };
  }

  private convertEligibility(
    eligibilityArray?: string[]
  ): EligibilityCriteria {
    return {
      otherRequirements: eligibilityArray || [],
    };
  }
}

// ============================================================================
// 211 API Client
// ============================================================================

export class TwoOneOneClient {
  private config: TwoOneOneConfig;

  constructor(config: TwoOneOneConfig) {
    this.config = config;
  }

  /**
   * Search 211 database
   */
  async searchResources(
    request: TwoOneOneSearchRequest
  ): Promise<TwoOneOneResource[]> {
    const url = new URL(`${this.config.apiUrl}/Search`);

    // Add search parameters
    if (request.searchString) {
      url.searchParams.append("SearchString", request.searchString);
    }
    if (request.taxonomyCode) {
      url.searchParams.append("TaxonomyCode", request.taxonomyCode);
    }
    if (request.latitude && request.longitude) {
      url.searchParams.append("Latitude", request.latitude.toString());
      url.searchParams.append("Longitude", request.longitude.toString());
    }
    if (request.radius) {
      url.searchParams.append("Radius", request.radius.toString());
    }
    if (request.city) {
      url.searchParams.append("City", request.city);
    }
    if (request.state) {
      url.searchParams.append("State", request.state);
    }
    if (request.zipCode) {
      url.searchParams.append("ZipCode", request.zipCode);
    }
    if (request.page) {
      url.searchParams.append("Page", request.page.toString());
    }
    if (request.pageSize) {
      url.searchParams.append("PageSize", request.pageSize.toString());
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-API-Key": this.config.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`211 API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.Resources || [];
  }

  /**
   * Get resource details from 211
   */
  async getResource(resourceId: string): Promise<TwoOneOneResource> {
    const url = `${this.config.apiUrl}/Resources/${resourceId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": this.config.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`211 API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Convert 211 resource to internal format
   */
  convertToInternalFormat(
    twoOneOneResource: TwoOneOneResource,
    organizationId: string
  ): CommunityResource {
    const primaryAddress = twoOneOneResource.addresses[0];
    const primaryPhone = twoOneOneResource.phones.find(
      (p) => p.type === "Main"
    ) || twoOneOneResource.phones[0];

    return {
      id: `211_${twoOneOneResource.id}`,
      organizationId,
      externalId: twoOneOneResource.id,
      name: twoOneOneResource.name,
      description: twoOneOneResource.description,
      shortDescription: twoOneOneResource.description.substring(0, 200),
      category: this.mapTaxonomyToCategory(
        twoOneOneResource.taxonomyCodes[0]
      ),
      subcategories: twoOneOneResource.taxonomyTerms,
      taxonomyCodes: twoOneOneResource.taxonomyCodes,
      contact: {
        primaryPhone: primaryPhone?.number || "",
        email: twoOneOneResource.emails[0],
        website: twoOneOneResource.url,
      },
      locations: twoOneOneResource.addresses.map((addr, index) =>
        this.convert211Address(addr, index === 0)
      ),
      services: [],
      eligibility: {
        otherRequirements: twoOneOneResource.eligibility
          ? [twoOneOneResource.eligibility]
          : [],
      },
      applicationProcess: {
        method: "phone",
        steps: twoOneOneResource.applicationProcess
          ? [twoOneOneResource.applicationProcess]
          : [],
        requiredDocuments: twoOneOneResource.documents
          ? [twoOneOneResource.documents]
          : [],
        appointmentRequired: false,
        selfReferralAllowed: true,
      },
      hoursOfOperation: [],
      languages: twoOneOneResource.languages,
      accessibility: {
        wheelchairAccessible: false,
        adaCompliant: false,
        interpreterAvailable: false,
        signLanguageAvailable: false,
        ttyAvailable: false,
        features: twoOneOneResource.accessibility,
      },
      verified: !!twoOneOneResource.lastVerified,
      verifiedDate: twoOneOneResource.lastVerified
        ? new Date(twoOneOneResource.lastVerified)
        : undefined,
      lastUpdated: new Date(),
      website: twoOneOneResource.url,
      referralMethod: ReferralMethod.PHONE,
      acceptsReferrals: true,
      closedLoopEnabled: false,
      isActive: true,
      waitlistAvailable: false,
      tags: twoOneOneResource.taxonomyTerms,
    };
  }

  private mapTaxonomyToCategory(taxonomyCode: string): ResourceCategory {
    // 211 LA Taxonomy code mapping
    const codePrefix = taxonomyCode.substring(0, 2);

    const taxonomyMap: Record<string, ResourceCategory> = {
      BD: ResourceCategory.FOOD, // Food/Meals
      BH: ResourceCategory.HOUSING, // Housing
      BL: ResourceCategory.CLOTHING, // Clothing
      BM: ResourceCategory.HOUSEHOLD_GOODS, // Household Goods
      BT: ResourceCategory.TRANSPORTATION, // Transportation
      LH: ResourceCategory.HEALTHCARE, // Health Care
      MH: ResourceCategory.MENTAL_HEALTH, // Mental Health
      SA: ResourceCategory.SUBSTANCE_ABUSE, // Substance Abuse
      PH: ResourceCategory.EMPLOYMENT, // Employment/Training
      LN: ResourceCategory.LEGAL_SERVICES, // Legal Services
      PV: ResourceCategory.DOMESTIC_VIOLENCE, // Victim Services
    };

    return taxonomyMap[codePrefix] || ResourceCategory.SOCIAL_SERVICES;
  }

  private convert211Address(
    address: TwoOneOneAddress,
    isPrimary: boolean
  ): ResourceLocation {
    return {
      id: `addr_${Math.random().toString(36).substr(2, 9)}`,
      isPrimary,
      address: {
        street1: address.street1,
        street2: address.street2,
        city: address.city,
        state: address.stateProvince,
        zipCode: address.postalCode,
      },
      coordinates:
        address.latitude && address.longitude
          ? {
              latitude: address.latitude,
              longitude: address.longitude,
            }
          : undefined,
      accessibility: {
        wheelchairAccessible: false,
        adaCompliant: false,
        interpreterAvailable: false,
        signLanguageAvailable: false,
        ttyAvailable: false,
        features: [],
      },
      parkingAvailable: false,
    };
  }
}

// ============================================================================
// Resource Sync Manager
// ============================================================================

export interface SyncConfig {
  findHelp?: FindHelpConfig;
  twoOneOne?: TwoOneOneConfig;
  syncInterval: number; // in hours
  autoSync: boolean;
}

export class ResourceSyncManager {
  private config: SyncConfig;
  private findHelpClient?: FindHelpClient;
  private twoOneOneClient?: TwoOneOneClient;
  private lastSyncTime?: Date;

  constructor(config: SyncConfig) {
    this.config = config;

    if (config.findHelp) {
      this.findHelpClient = new FindHelpClient(config.findHelp);
    }

    if (config.twoOneOne) {
      this.twoOneOneClient = new TwoOneOneClient(config.twoOneOne);
    }
  }

  /**
   * Sync resources from external sources
   */
  async syncResources(
    organizationId: string,
    location: { latitude: number; longitude: number } | { zipCode: string }
  ): Promise<CommunityResource[]> {
    const syncedResources: CommunityResource[] = [];

    // Sync from FindHelp
    if (this.findHelpClient) {
      try {
        const findHelpResults = await this.findHelpClient.searchResources({
          location,
          radius: 50,
          perPage: 100,
        });

        findHelpResults.results.forEach((resource) => {
          syncedResources.push(
            this.findHelpClient!.convertToInternalFormat(resource, organizationId)
          );
        });
      } catch (error) {
        console.error("FindHelp sync error:", error);
      }
    }

    // Sync from 211
    if (this.twoOneOneClient) {
      try {
        const request: TwoOneOneSearchRequest = {
          radius: 50,
          pageSize: 100,
        };

        if ("latitude" in location) {
          request.latitude = location.latitude;
          request.longitude = location.longitude;
        } else {
          request.zipCode = location.zipCode;
        }

        const twoOneOneResults =
          await this.twoOneOneClient.searchResources(request);

        twoOneOneResults.forEach((resource) => {
          syncedResources.push(
            this.twoOneOneClient!.convertToInternalFormat(
              resource,
              organizationId
            )
          );
        });
      } catch (error) {
        console.error("211 sync error:", error);
      }
    }

    this.lastSyncTime = new Date();
    return syncedResources;
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | undefined {
    return this.lastSyncTime;
  }

  /**
   * Check if sync is needed
   */
  needsSync(): boolean {
    if (!this.lastSyncTime) return true;

    const hoursSinceLastSync =
      (Date.now() - this.lastSyncTime.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastSync >= this.config.syncInterval;
  }
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const FindHelpConfigSchema = z.object({
  apiKey: z.string(),
  apiUrl: z.string().url(),
  organizationId: z.string(),
  environment: z.enum(["production", "sandbox"]),
});

export const TwoOneOneConfigSchema = z.object({
  apiKey: z.string(),
  apiUrl: z.string().url(),
  providerId: z.string(),
});
