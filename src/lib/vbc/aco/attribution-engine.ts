/**
 * ACO Attribution Engine
 * Patient attribution algorithms for Accountable Care Organizations
 * Supports prospective, retrospective, and voluntary alignment methods
 */

export type AttributionMethod = "prospective" | "retrospective" | "voluntary" | "claims-based";
export type AttributionModel = "step-wise" | "plurality" | "hierarchical";

export interface PatientAttribution {
  patientId: string;
  acoId: string;
  providerId: string;
  primaryCareProviderId: string;
  attributionMethod: AttributionMethod;
  attributionModel: AttributionModel;
  attributionDate: Date;
  effectiveDate: Date;
  expirationDate?: Date;
  alignmentScore: number;
  visitCount: number;
  primaryCareVisits: number;
  specialtyVisits: number;
  totalAllowedCharges: number;
  isVoluntary: boolean;
  previousAttribution?: {
    acoId: string;
    providerId: string;
    endDate: Date;
  };
  riskScore: number;
  hccCategories: string[];
}

export interface AttributionCriteria {
  minPrimaryCareVisits: number;
  lookbackPeriodMonths: number;
  requireFaceToFace: boolean;
  excludedServices: string[];
  qualifyingServiceCodes: string[];
}

export interface AttributionChange {
  patientId: string;
  changeType: "new" | "transfer" | "termination";
  previousAcoId?: string;
  newAcoId: string;
  changeDate: Date;
  reason: string;
  impactOnSavings: number;
}

// ============================================================================
// Step-Wise Attribution (CMS Standard)
// ============================================================================

/**
 * Perform step-wise attribution per CMS MSSP rules
 * Step 1: Primary care services by primary care physicians
 * Step 2: Primary care services by specialists
 */
export function performStepwiseAttribution(
  patientId: string,
  claims: ClaimRecord[],
  criteria: AttributionCriteria,
): PatientAttribution | null {
  const lookbackDate = new Date();
  lookbackDate.setMonth(lookbackDate.getMonth() - criteria.lookbackPeriodMonths);

  // Filter qualifying claims
  const qualifyingClaims = claims.filter(claim =>
    claim.serviceDate >= lookbackDate &&
    criteria.qualifyingServiceCodes.includes(claim.procedureCode) &&
    !criteria.excludedServices.includes(claim.serviceType)
  );

  if (qualifyingClaims.length === 0) return null;

  // Step 1: Try primary care physician attribution
  const pcpClaims = qualifyingClaims.filter(c =>
    c.providerSpecialty === "Internal Medicine" ||
    c.providerSpecialty === "Family Practice" ||
    c.providerSpecialty === "General Practice" ||
    c.providerSpecialty === "Geriatric Medicine"
  );

  if (pcpClaims.length >= criteria.minPrimaryCareVisits) {
    const attribution = calculatePluralityProvider(patientId, pcpClaims, "step-wise");
    if (attribution) {
      attribution.primaryCareVisits = pcpClaims.length;
      return attribution;
    }
  }

  // Step 2: Try specialist attribution
  const specialistClaims = qualifyingClaims.filter(c =>
    c.serviceType === "primary_care" && !pcpClaims.includes(c)
  );

  if (specialistClaims.length >= criteria.minPrimaryCareVisits) {
    const attribution = calculatePluralityProvider(patientId, specialistClaims, "step-wise");
    if (attribution) {
      attribution.primaryCareVisits = 0;
      attribution.specialtyVisits = specialistClaims.length;
      return attribution;
    }
  }

  return null;
}

// ============================================================================
// Plurality Attribution
// ============================================================================

/**
 * Attribute patient to provider with plurality of allowed charges
 */
function calculatePluralityProvider(
  patientId: string,
  claims: ClaimRecord[],
  model: AttributionModel,
): PatientAttribution | null {
  const providerCharges = new Map<string, {
    providerId: string;
    totalCharges: number;
    visitCount: number;
    acoId: string;
  }>();

  // Aggregate charges by provider
  claims.forEach(claim => {
    const key = claim.providerId;
    const existing = providerCharges.get(key) || {
      providerId: claim.providerId,
      totalCharges: 0,
      visitCount: 0,
      acoId: claim.acoId,
    };

    existing.totalCharges += claim.allowedAmount;
    existing.visitCount += 1;
    providerCharges.set(key, existing);
  });

  // Find provider with plurality
  let maxCharges = 0;
  let attributedProvider: typeof providerCharges.values extends () => Iterator<infer T> ? T : never | null = null;

  for (const provider of providerCharges.values()) {
    if (provider.totalCharges > maxCharges) {
      maxCharges = provider.totalCharges;
      attributedProvider = provider;
    }
  }

  if (!attributedProvider) return null;

  const totalCharges = Array.from(providerCharges.values())
    .reduce((sum, p) => sum + p.totalCharges, 0);

  const attribution: PatientAttribution = {
    patientId,
    acoId: attributedProvider.acoId,
    providerId: attributedProvider.providerId,
    primaryCareProviderId: attributedProvider.providerId,
    attributionMethod: "claims-based",
    attributionModel: model,
    attributionDate: new Date(),
    effectiveDate: new Date(),
    alignmentScore: (attributedProvider.totalCharges / totalCharges) * 100,
    visitCount: claims.length,
    primaryCareVisits: attributedProvider.visitCount,
    specialtyVisits: claims.length - attributedProvider.visitCount,
    totalAllowedCharges: totalCharges,
    isVoluntary: false,
    riskScore: 1.0,
    hccCategories: [],
  };

  return attribution;
}

// ============================================================================
// Prospective Attribution
// ============================================================================

/**
 * Prospective attribution using historical claims data
 * Attribution determined at start of performance year
 */
export function performProspectiveAttribution(
  patientId: string,
  historicalClaims: ClaimRecord[],
  performanceYearStart: Date,
): PatientAttribution | null {
  const baselineEnd = new Date(performanceYearStart);
  baselineEnd.setDate(baselineEnd.getDate() - 1);

  const baselineStart = new Date(baselineEnd);
  baselineStart.setFullYear(baselineStart.getFullYear() - 1);

  const baselineClaims = historicalClaims.filter(c =>
    c.serviceDate >= baselineStart && c.serviceDate <= baselineEnd
  );

  const criteria: AttributionCriteria = {
    minPrimaryCareVisits: 1,
    lookbackPeriodMonths: 12,
    requireFaceToFace: true,
    excludedServices: ["telehealth", "emergency"],
    qualifyingServiceCodes: ["99201", "99202", "99203", "99204", "99205", "99211", "99212", "99213", "99214", "99215"],
  };

  const attribution = performStepwiseAttribution(patientId, baselineClaims, criteria);

  if (attribution) {
    attribution.attributionMethod = "prospective";
    attribution.effectiveDate = performanceYearStart;

    const expirationDate = new Date(performanceYearStart);
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    attribution.expirationDate = expirationDate;
  }

  return attribution;
}

// ============================================================================
// Retrospective Attribution
// ============================================================================

/**
 * Retrospective attribution using performance year claims
 * Attribution determined after performance year ends
 */
export function performRetrospectiveAttribution(
  patientId: string,
  performanceYearClaims: ClaimRecord[],
  performanceYearStart: Date,
  performanceYearEnd: Date,
): PatientAttribution | null {
  const criteria: AttributionCriteria = {
    minPrimaryCareVisits: 1,
    lookbackPeriodMonths: 12,
    requireFaceToFace: true,
    excludedServices: ["telehealth", "emergency"],
    qualifyingServiceCodes: ["99201", "99202", "99203", "99204", "99205", "99211", "99212", "99213", "99214", "99215"],
  };

  const attribution = performStepwiseAttribution(patientId, performanceYearClaims, criteria);

  if (attribution) {
    attribution.attributionMethod = "retrospective";
    attribution.effectiveDate = performanceYearStart;
    attribution.expirationDate = performanceYearEnd;
  }

  return attribution;
}

// ============================================================================
// Voluntary Attribution
// ============================================================================

/**
 * Process voluntary alignment (patient self-selects ACO)
 */
export function processVoluntaryAlignment(
  patientId: string,
  selectedAcoId: string,
  selectedProviderId: string,
  effectiveDate: Date,
): PatientAttribution {
  const attribution: PatientAttribution = {
    patientId,
    acoId: selectedAcoId,
    providerId: selectedProviderId,
    primaryCareProviderId: selectedProviderId,
    attributionMethod: "voluntary",
    attributionModel: "hierarchical",
    attributionDate: new Date(),
    effectiveDate,
    alignmentScore: 100,
    visitCount: 0,
    primaryCareVisits: 0,
    specialtyVisits: 0,
    totalAllowedCharges: 0,
    isVoluntary: true,
    riskScore: 1.0,
    hccCategories: [],
  };

  return attribution;
}

// ============================================================================
// Attribution Change Tracking
// ============================================================================

/**
 * Detect attribution changes between periods
 */
export function detectAttributionChanges(
  previousAttributions: PatientAttribution[],
  currentAttributions: PatientAttribution[],
): AttributionChange[] {
  const changes: AttributionChange[] = [];
  const previousMap = new Map(previousAttributions.map(a => [a.patientId, a]));
  const currentMap = new Map(currentAttributions.map(a => [a.patientId, a]));

  // Check for new attributions
  for (const current of currentAttributions) {
    const previous = previousMap.get(current.patientId);

    if (!previous) {
      changes.push({
        patientId: current.patientId,
        changeType: "new",
        newAcoId: current.acoId,
        changeDate: current.attributionDate,
        reason: "New patient attribution",
        impactOnSavings: 0,
      });
    } else if (previous.acoId !== current.acoId) {
      changes.push({
        patientId: current.patientId,
        changeType: "transfer",
        previousAcoId: previous.acoId,
        newAcoId: current.acoId,
        changeDate: current.attributionDate,
        reason: "Provider change",
        impactOnSavings: 0,
      });
    }
  }

  // Check for terminations
  for (const previous of previousAttributions) {
    if (!currentMap.has(previous.patientId)) {
      changes.push({
        patientId: previous.patientId,
        changeType: "termination",
        previousAcoId: previous.acoId,
        newAcoId: "",
        changeDate: new Date(),
        reason: "No qualifying services",
        impactOnSavings: 0,
      });
    }
  }

  return changes;
}

// ============================================================================
// Attribution Stability Metrics
// ============================================================================

/**
 * Calculate attribution stability metrics
 */
export function calculateAttributionStability(
  attributions: PatientAttribution[],
  changes: AttributionChange[],
): {
  stabilityRate: number;
  churnRate: number;
  averageAlignmentScore: number;
  voluntaryRate: number;
} {
  const totalPatients = attributions.length;
  const voluntaryCount = attributions.filter(a => a.isVoluntary).length;
  const changedPatients = new Set(changes.map(c => c.patientId)).size;

  const totalAlignmentScore = attributions.reduce((sum, a) => sum + a.alignmentScore, 0);

  return {
    stabilityRate: totalPatients > 0 ? ((totalPatients - changedPatients) / totalPatients) * 100 : 0,
    churnRate: totalPatients > 0 ? (changedPatients / totalPatients) * 100 : 0,
    averageAlignmentScore: totalPatients > 0 ? totalAlignmentScore / totalPatients : 0,
    voluntaryRate: totalPatients > 0 ? (voluntaryCount / totalPatients) * 100 : 0,
  };
}

// ============================================================================
// Supporting Types
// ============================================================================

interface ClaimRecord {
  patientId: string;
  providerId: string;
  acoId: string;
  serviceDate: Date;
  procedureCode: string;
  serviceType: string;
  providerSpecialty: string;
  allowedAmount: number;
  diagnosisCodes: string[];
}
