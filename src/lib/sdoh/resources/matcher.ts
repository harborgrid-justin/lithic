/**
 * SDOH Resource Matching Engine
 * Intelligent need-to-resource matching algorithm
 * SDOH & Care Coordination Specialist - Agent 7
 */

import {
  type CommunityResource,
  type ResourceSearchCriteria,
  type ResourceSearchResult,
  type EligibilityMatch,
  type AvailabilityStatus,
  type Coordinates,
  ResourceCategory,
  calculateDistance,
} from "./resource-database";

// ============================================================================
// Matching Engine
// ============================================================================

export class ResourceMatcher {
  private resources: CommunityResource[];

  constructor(resources: CommunityResource[]) {
    this.resources = resources;
  }

  /**
   * Find matching resources based on criteria
   */
  findMatches(criteria: ResourceSearchCriteria): ResourceSearchResult[] {
    let results: ResourceSearchResult[] = [];

    // Filter resources
    let filteredResources = this.filterResources(criteria);

    // Score and rank matches
    results = filteredResources.map((resource) => {
      const matchScore = this.calculateMatchScore(resource, criteria);
      const distance = this.calculateResourceDistance(resource, criteria);
      const eligibilityMatch = this.checkEligibility(resource, criteria);
      const availability = this.checkAvailability(resource);

      return {
        resource,
        distance,
        matchScore,
        matchReasons: this.generateMatchReasons(resource, criteria),
        eligibilityMatch,
        availability,
      };
    });

    // Sort results
    results = this.sortResults(results, criteria);

    // Apply pagination
    if (criteria.limit) {
      const offset = criteria.offset || 0;
      results = results.slice(offset, offset + criteria.limit);
    }

    return results;
  }

  /**
   * Filter resources based on criteria
   */
  private filterResources(criteria: ResourceSearchCriteria): CommunityResource[] {
    return this.resources.filter((resource) => {
      // Active only
      if (criteria.activeOnly && !resource.isActive) {
        return false;
      }

      // Verified only
      if (criteria.verifiedOnly && !resource.verified) {
        return false;
      }

      // Category filter
      if (
        criteria.categories &&
        criteria.categories.length > 0 &&
        !criteria.categories.includes(resource.category)
      ) {
        return false;
      }

      // Subcategory filter
      if (
        criteria.subcategories &&
        criteria.subcategories.length > 0 &&
        !criteria.subcategories.some((sub) => resource.subcategories.includes(sub))
      ) {
        return false;
      }

      // Taxonomy codes filter
      if (
        criteria.taxonomyCodes &&
        criteria.taxonomyCodes.length > 0 &&
        !criteria.taxonomyCodes.some((code) => resource.taxonomyCodes.includes(code))
      ) {
        return false;
      }

      // Keyword filter
      if (criteria.keywords) {
        const searchText = `
          ${resource.name}
          ${resource.description}
          ${resource.subcategories.join(" ")}
          ${resource.tags.join(" ")}
        `.toLowerCase();

        const keywords = criteria.keywords.toLowerCase().split(/\s+/);
        if (!keywords.some((keyword) => searchText.includes(keyword))) {
          return false;
        }
      }

      // Location filter (radius)
      if (criteria.location && criteria.radius) {
        const withinRadius = resource.locations.some((location) => {
          if (location.coordinates) {
            const distance = calculateDistance(
              criteria.location!,
              location.coordinates
            );
            return distance <= criteria.radius!;
          }
          return false;
        });
        if (!withinRadius) return false;
      }

      // Zip code filter
      if (criteria.zipCode) {
        const inZipCode = resource.locations.some(
          (location) => location.address.zipCode === criteria.zipCode
        );
        if (!inZipCode) return false;
      }

      // City filter
      if (criteria.city) {
        const inCity = resource.locations.some(
          (location) =>
            location.address.city.toLowerCase() === criteria.city!.toLowerCase()
        );
        if (!inCity) return false;
      }

      // State filter
      if (criteria.state) {
        const inState = resource.locations.some(
          (location) =>
            location.address.state.toUpperCase() === criteria.state!.toUpperCase()
        );
        if (!inState) return false;
      }

      // Language filter
      if (criteria.languages && criteria.languages.length > 0) {
        const hasLanguage = criteria.languages.some((lang) =>
          resource.languages.includes(lang)
        );
        if (!hasLanguage) return false;
      }

      // Delivery method filter
      if (criteria.deliveryMethods && criteria.deliveryMethods.length > 0) {
        const hasMethod = resource.services.some((service) =>
          service.deliveryMethods.some((method) =>
            criteria.deliveryMethods!.includes(method)
          )
        );
        if (!hasMethod) return false;
      }

      // Accepts referrals filter
      if (criteria.acceptsReferrals && !resource.acceptsReferrals) {
        return false;
      }

      // Closed loop filter
      if (criteria.closedLoopOnly && !resource.closedLoopEnabled) {
        return false;
      }

      // Free services only
      if (criteria.freeOnly) {
        const hasFreeService = resource.services.some(
          (service) => service.cost.type === "free"
        );
        if (!hasFreeService) return false;
      }

      // Has capacity
      if (criteria.hasCapacity) {
        if (
          resource.capacity &&
          (resource.capacity.status === "full" ||
            (resource.capacity.available !== undefined &&
              resource.capacity.available <= 0))
        ) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Calculate match score for a resource
   */
  private calculateMatchScore(
    resource: CommunityResource,
    criteria: ResourceSearchCriteria
  ): number {
    let score = 0;
    let maxScore = 0;

    // Category match (30 points)
    maxScore += 30;
    if (criteria.categories && criteria.categories.includes(resource.category)) {
      score += 30;
    }

    // Subcategory match (20 points)
    if (criteria.subcategories && criteria.subcategories.length > 0) {
      maxScore += 20;
      const matchingSubcategories = criteria.subcategories.filter((sub) =>
        resource.subcategories.includes(sub)
      );
      score += (matchingSubcategories.length / criteria.subcategories.length) * 20;
    }

    // Keyword relevance (15 points)
    if (criteria.keywords) {
      maxScore += 15;
      const keywords = criteria.keywords.toLowerCase().split(/\s+/);
      const searchText = `
        ${resource.name}
        ${resource.description}
        ${resource.subcategories.join(" ")}
      `.toLowerCase();

      const matchingKeywords = keywords.filter((keyword) =>
        searchText.includes(keyword)
      );
      score += (matchingKeywords.length / keywords.length) * 15;
    }

    // Distance (10 points - closer is better)
    if (criteria.location) {
      maxScore += 10;
      const distance = this.calculateResourceDistance(resource, criteria);
      if (distance !== undefined) {
        if (distance <= 1) score += 10;
        else if (distance <= 5) score += 8;
        else if (distance <= 10) score += 5;
        else if (distance <= 25) score += 2;
      }
    }

    // Language match (10 points)
    if (criteria.languages && criteria.languages.length > 0) {
      maxScore += 10;
      const matchingLanguages = criteria.languages.filter((lang) =>
        resource.languages.includes(lang)
      );
      score += (matchingLanguages.length / criteria.languages.length) * 10;
    }

    // Verified resource (5 points)
    maxScore += 5;
    if (resource.verified) {
      score += 5;
    }

    // Accepts referrals (5 points)
    maxScore += 5;
    if (resource.acceptsReferrals) {
      score += 5;
    }

    // Has capacity (5 points)
    maxScore += 5;
    if (
      !resource.capacity ||
      resource.capacity.status === "available" ||
      (resource.capacity.available && resource.capacity.available > 0)
    ) {
      score += 5;
    }

    // High rating (bonus 5 points)
    if (resource.rating && resource.rating >= 4.5) {
      maxScore += 5;
      score += 5;
    }

    // Normalize to 0-100 scale
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  /**
   * Calculate distance to resource
   */
  private calculateResourceDistance(
    resource: CommunityResource,
    criteria: ResourceSearchCriteria
  ): number | undefined {
    if (!criteria.location) return undefined;

    const distances = resource.locations
      .filter((loc) => loc.coordinates)
      .map((loc) => calculateDistance(criteria.location!, loc.coordinates!));

    return distances.length > 0 ? Math.min(...distances) : undefined;
  }

  /**
   * Check eligibility for a resource
   */
  private checkEligibility(
    resource: CommunityResource,
    criteria: ResourceSearchCriteria
  ): EligibilityMatch {
    const reasons: string[] = [];
    const missingInfo: string[] = [];
    const potentialBarriers: string[] = [];
    let eligible = true;

    const { eligibility } = resource;

    // Age check
    if (criteria.age !== undefined) {
      if (eligibility.ageMin !== undefined && criteria.age < eligibility.ageMin) {
        eligible = false;
        potentialBarriers.push(
          `Minimum age requirement: ${eligibility.ageMin} years`
        );
      }
      if (eligibility.ageMax !== undefined && criteria.age > eligibility.ageMax) {
        eligible = false;
        potentialBarriers.push(
          `Maximum age requirement: ${eligibility.ageMax} years`
        );
      }
      if (eligible) {
        reasons.push("Meets age requirement");
      }
    } else if (eligibility.ageMin || eligibility.ageMax) {
      missingInfo.push("Age information needed to verify eligibility");
    }

    // Income check
    if (criteria.income !== undefined && criteria.householdSize !== undefined) {
      if (eligibility.income) {
        const meetsIncome = this.checkIncomeEligibility(
          criteria.income,
          criteria.householdSize,
          eligibility.income
        );
        if (!meetsIncome) {
          eligible = false;
          potentialBarriers.push("Does not meet income requirements");
        } else {
          reasons.push("Meets income requirements");
        }
      }
    } else if (eligibility.income) {
      missingInfo.push("Income and household size needed to verify eligibility");
    }

    // Insurance check
    if (criteria.insurance) {
      if (
        eligibility.insurance &&
        eligibility.insurance.length > 0 &&
        !eligibility.insurance.includes(criteria.insurance)
      ) {
        potentialBarriers.push("Insurance type may not be accepted");
      } else if (eligibility.insurance && eligibility.insurance.length > 0) {
        reasons.push("Insurance accepted");
      }
    }

    // Geographic eligibility
    if (eligibility.geographic && eligibility.geographic.length > 0) {
      let inServiceArea = false;
      if (criteria.zipCode) {
        inServiceArea = eligibility.geographic.includes(criteria.zipCode);
      } else if (criteria.city) {
        inServiceArea = eligibility.geographic.some((area) =>
          area.toLowerCase().includes(criteria.city!.toLowerCase())
        );
      }
      if (!inServiceArea && criteria.zipCode) {
        potentialBarriers.push("May be outside service area");
      }
    }

    return {
      eligible,
      reasons,
      missingInfo,
      potentialBarriers,
    };
  }

  /**
   * Check income eligibility
   */
  private checkIncomeEligibility(
    income: number,
    householdSize: number,
    requirement: any
  ): boolean {
    if (requirement.type === "absolute") {
      return income <= (requirement.maxIncome || Infinity);
    }

    if (requirement.type === "fpl") {
      // 2024 Federal Poverty Level guidelines
      const fplBase = 15060; // For 1 person
      const fplIncrement = 5380; // Per additional person
      const fpl = fplBase + (householdSize - 1) * fplIncrement;
      const maxIncome = (fpl * (requirement.percentage || 100)) / 100;
      return income <= maxIncome;
    }

    return true; // If unknown type, assume eligible
  }

  /**
   * Check resource availability
   */
  private checkAvailability(resource: CommunityResource): AvailabilityStatus {
    if (!resource.capacity) {
      return {
        available: true,
      };
    }

    const { capacity } = resource;

    if (capacity.status === "full") {
      return {
        available: false,
        waitlistEstimate: "Contact resource for waitlist information",
        capacity,
      };
    }

    if (capacity.available !== undefined && capacity.available <= 0) {
      return {
        available: false,
        capacity,
      };
    }

    return {
      available: true,
      capacity,
    };
  }

  /**
   * Generate match reasons
   */
  private generateMatchReasons(
    resource: CommunityResource,
    criteria: ResourceSearchCriteria
  ): string[] {
    const reasons: string[] = [];

    if (criteria.categories && criteria.categories.includes(resource.category)) {
      reasons.push(`Matches category: ${resource.category}`);
    }

    if (criteria.keywords) {
      reasons.push("Matches search keywords");
    }

    const distance = this.calculateResourceDistance(resource, criteria);
    if (distance !== undefined) {
      reasons.push(`${distance} miles away`);
    }

    if (criteria.languages && criteria.languages.length > 0) {
      const matchingLanguages = criteria.languages.filter((lang) =>
        resource.languages.includes(lang)
      );
      if (matchingLanguages.length > 0) {
        reasons.push(`Offers services in: ${matchingLanguages.join(", ")}`);
      }
    }

    if (resource.verified) {
      reasons.push("Verified resource");
    }

    if (resource.acceptsReferrals) {
      reasons.push("Accepts referrals");
    }

    if (resource.rating && resource.rating >= 4.0) {
      reasons.push(`Highly rated (${resource.rating}/5)`);
    }

    return reasons;
  }

  /**
   * Sort search results
   */
  private sortResults(
    results: ResourceSearchResult[],
    criteria: ResourceSearchCriteria
  ): ResourceSearchResult[] {
    const sortBy = criteria.sortBy || "matchScore";
    const sortOrder = criteria.sortOrder || "desc";

    results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "distance":
          if (a.distance !== undefined && b.distance !== undefined) {
            comparison = a.distance - b.distance;
          }
          break;
        case "name":
          comparison = a.resource.name.localeCompare(b.resource.name);
          break;
        case "rating":
          comparison =
            (b.resource.rating || 0) - (a.resource.rating || 0);
          break;
        case "matchScore":
        default:
          comparison = b.matchScore - a.matchScore;
          break;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    return results;
  }
}

// ============================================================================
// Multi-Need Matching
// ============================================================================

export interface MultiNeedRequest {
  needs: ResourceCategory[];
  patientLocation?: Coordinates;
  patientInfo?: {
    age?: number;
    income?: number;
    householdSize?: number;
    insurance?: string;
    languages?: string[];
  };
  preferences?: {
    maxDistance?: number;
    verifiedOnly?: boolean;
    freeOnly?: boolean;
  };
}

export interface MultiNeedResult {
  need: ResourceCategory;
  matches: ResourceSearchResult[];
  topMatch?: ResourceSearchResult;
}

/**
 * Find resources for multiple needs
 */
export function matchMultipleNeeds(
  request: MultiNeedRequest,
  allResources: CommunityResource[]
): MultiNeedResult[] {
  const matcher = new ResourceMatcher(allResources);
  const results: MultiNeedResult[] = [];

  request.needs.forEach((need) => {
    const criteria: ResourceSearchCriteria = {
      categories: [need],
      location: request.patientLocation,
      radius: request.preferences?.maxDistance || 25,
      age: request.patientInfo?.age,
      income: request.patientInfo?.income,
      householdSize: request.patientInfo?.householdSize,
      insurance: request.patientInfo?.insurance,
      languages: request.patientInfo?.languages,
      verifiedOnly: request.preferences?.verifiedOnly,
      freeOnly: request.preferences?.freeOnly,
      activeOnly: true,
      sortBy: "matchScore",
      limit: 10,
    };

    const matches = matcher.findMatches(criteria);

    results.push({
      need,
      matches,
      topMatch: matches.length > 0 ? matches[0] : undefined,
    });
  });

  return results;
}

// ============================================================================
// Smart Recommendations
// ============================================================================

export interface SmartRecommendation {
  resource: CommunityResource;
  reason: string;
  priority: "high" | "medium" | "low";
  estimatedImpact: string;
}

/**
 * Generate smart recommendations based on patient needs and history
 */
export function generateSmartRecommendations(
  primaryNeed: ResourceCategory,
  patientHistory: string[],
  allResources: CommunityResource[]
): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];
  const relatedCategories = getRelatedCategories(primaryNeed);

  // Find resources in related categories that patient hasn't used
  relatedCategories.forEach((category) => {
    const resources = allResources.filter(
      (r) =>
        r.category === category &&
        r.isActive &&
        !patientHistory.includes(r.id)
    );

    resources.slice(0, 2).forEach((resource) => {
      recommendations.push({
        resource,
        reason: `Often helpful for patients with ${primaryNeed} needs`,
        priority: category === primaryNeed ? "high" : "medium",
        estimatedImpact: "May help address underlying or related issues",
      });
    });
  });

  return recommendations;
}

/**
 * Get categories related to a primary need
 */
function getRelatedCategories(primary: ResourceCategory): ResourceCategory[] {
  const relationships: Record<ResourceCategory, ResourceCategory[]> = {
    [ResourceCategory.FOOD]: [
      ResourceCategory.FINANCIAL_ASSISTANCE,
      ResourceCategory.UTILITIES,
      ResourceCategory.TRANSPORTATION,
    ],
    [ResourceCategory.HOUSING]: [
      ResourceCategory.FINANCIAL_ASSISTANCE,
      ResourceCategory.LEGAL_SERVICES,
      ResourceCategory.UTILITIES,
    ],
    [ResourceCategory.TRANSPORTATION]: [
      ResourceCategory.EMPLOYMENT,
      ResourceCategory.HEALTHCARE,
    ],
    [ResourceCategory.EMPLOYMENT]: [
      ResourceCategory.EDUCATION,
      ResourceCategory.CHILDCARE,
      ResourceCategory.TRANSPORTATION,
    ],
    [ResourceCategory.MENTAL_HEALTH]: [
      ResourceCategory.SOCIAL_SERVICES,
      ResourceCategory.SUPPORT_GROUPS,
    ],
    [ResourceCategory.DOMESTIC_VIOLENCE]: [
      ResourceCategory.LEGAL_SERVICES,
      ResourceCategory.EMERGENCY_SHELTER,
      ResourceCategory.MENTAL_HEALTH,
    ],
    // Default empty arrays for other categories
  } as Record<ResourceCategory, ResourceCategory[]>;

  return [primary, ...(relationships[primary] || [])];
}
