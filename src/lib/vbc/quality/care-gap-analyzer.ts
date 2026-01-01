/**
 * Care Gap Analyzer
 * Identify and prioritize quality measure care gaps for patient outreach
 */

export type CareGapCategory =
  | "preventive-screening"
  | "chronic-disease-management"
  | "medication-adherence"
  | "follow-up-care"
  | "behavioral-health";

export type CareGapPriority = "critical" | "high" | "medium" | "low";
export type CareGapStatus = "open" | "in-progress" | "closed" | "excluded";

export interface CareGap {
  gapId: string;
  patientId: string;
  measureId: string;
  measureName: string;
  category: CareGapCategory;

  // Gap details
  description: string;
  dueDate: Date;
  overdueBy?: number; // days overdue
  priority: CareGapPriority;
  status: CareGapStatus;

  // Clinical information
  lastCompleted?: Date;
  frequencyRequirement: string;
  clinicalIndication: string;

  // Outreach
  outreachAttempts: number;
  lastOutreachDate?: Date;
  nextOutreachDate?: Date;
  preferredContactMethod?: string;

  // Barriers
  barriers: string[];
  notes?: string;

  // Value
  qualityImpact: number; // Points or dollars
  closureComplexity: "easy" | "moderate" | "difficult";
}

export interface PatientCareGapProfile {
  patientId: string;
  patientName: string;
  age: number;
  riskScore: number;

  totalGaps: number;
  openGaps: number;
  criticalGaps: number;
  highPriorityGaps: number;

  gaps: CareGap[];

  // Engagement
  lastVisitDate?: Date;
  nextScheduledVisit?: Date;
  engagementScore: number;
  contactability: "easy" | "moderate" | "difficult";

  // Priority ranking
  priorityScore: number;
  priorityRank?: number;
}

// ============================================================================
// Care Gap Identification
// ============================================================================

/**
 * Identify care gaps for quality measures
 */
export function identifyCareGap(
  patientId: string,
  measureId: string,
  measureName: string,
  category: CareGapCategory,
  dueDate: Date,
  lastCompleted?: Date,
  clinicalIndication: string = "",
): CareGap {
  const now = new Date();
  const isOverdue = dueDate < now;
  const overdueBy = isOverdue
    ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    : undefined;

  // Determine priority
  const priority = calculateGapPriority(category, overdueBy, lastCompleted);

  // Estimate closure complexity
  const closureComplexity = estimateClosureComplexity(category, overdueBy);

  // Calculate quality impact
  const qualityImpact = calculateQualityImpact(measureId, priority);

  return {
    gapId: `GAP-${patientId}-${measureId}`,
    patientId,
    measureId,
    measureName,
    category,
    description: `${measureName} is ${isOverdue ? "overdue" : "due"}`,
    dueDate,
    overdueBy,
    priority,
    status: "open",
    lastCompleted,
    frequencyRequirement: getFrequencyRequirement(measureId),
    clinicalIndication,
    outreachAttempts: 0,
    barriers: [],
    qualityImpact,
    closureComplexity,
  };
}

/**
 * Calculate gap priority
 */
function calculateGapPriority(
  category: CareGapCategory,
  overdueBy?: number,
  lastCompleted?: Date,
): CareGapPriority {
  // Critical if significantly overdue
  if (overdueBy && overdueBy > 180) return "critical";

  // High priority categories
  if (category === "chronic-disease-management" || category === "behavioral-health") {
    if (overdueBy && overdueBy > 90) return "critical";
    if (overdueBy && overdueBy > 30) return "high";
  }

  // Preventive screening
  if (category === "preventive-screening") {
    if (overdueBy && overdueBy > 365) return "high";
    if (overdueBy && overdueBy > 180) return "medium";
  }

  // Medication adherence
  if (category === "medication-adherence") {
    if (overdueBy && overdueBy > 60) return "critical";
    if (overdueBy && overdueBy > 30) return "high";
  }

  // Never completed
  if (!lastCompleted && overdueBy && overdueBy > 0) {
    return "high";
  }

  return overdueBy && overdueBy > 0 ? "medium" : "low";
}

/**
 * Estimate closure complexity
 */
function estimateClosureComplexity(
  category: CareGapCategory,
  overdueBy?: number,
): "easy" | "moderate" | "difficult" {
  // Simple preventive screenings
  if (category === "preventive-screening") {
    return overdueBy && overdueBy > 365 ? "moderate" : "easy";
  }

  // Medication adherence requires behavior change
  if (category === "medication-adherence") {
    return "moderate";
  }

  // Chronic disease management requires ongoing engagement
  if (category === "chronic-disease-management") {
    return overdueBy && overdueBy > 180 ? "difficult" : "moderate";
  }

  // Behavioral health requires specialized care
  if (category === "behavioral-health") {
    return "difficult";
  }

  return "moderate";
}

/**
 * Calculate quality impact (points or dollars)
 */
function calculateQualityImpact(measureId: string, priority: CareGapPriority): number {
  // Base value by priority
  const baseValues: Record<CareGapPriority, number> = {
    critical: 100,
    high: 50,
    medium: 25,
    low: 10,
  };

  // Measure-specific multipliers (high-value measures)
  const highValueMeasures = new Set([
    "CDC-H", "CDC-C", "CBP", "BCS", "COL", "SPC",
  ]);

  const multiplier = highValueMeasures.has(measureId) ? 1.5 : 1.0;

  return baseValues[priority] * multiplier;
}

/**
 * Get frequency requirement for measure
 */
function getFrequencyRequirement(measureId: string): string {
  const frequencies: Record<string, string> = {
    "CDC-H": "Annually",
    "CDC-E": "Annually",
    "CDC-N": "Annually",
    "BCS": "Every 24 months",
    "COL": "Every 10 years (colonoscopy) or annually (FIT)",
    "CBP": "Annually",
    "SPC": "Ongoing",
  };

  return frequencies[measureId] || "Per clinical guidelines";
}

// ============================================================================
// Patient Care Gap Profile
// ============================================================================

/**
 * Generate patient care gap profile
 */
export function generatePatientCareGapProfile(
  patientId: string,
  patientName: string,
  age: number,
  riskScore: number,
  gaps: CareGap[],
  lastVisitDate?: Date,
  nextScheduledVisit?: Date,
  contactHistory: { attempts: number; successes: number } = { attempts: 0, successes: 0 },
): PatientCareGapProfile {
  const openGaps = gaps.filter(g => g.status === "open").length;
  const criticalGaps = gaps.filter(g => g.priority === "critical" && g.status === "open").length;
  const highPriorityGaps = gaps.filter(g => g.priority === "high" && g.status === "open").length;

  // Calculate engagement score
  const engagementScore = calculateEngagementScore(lastVisitDate, nextScheduledVisit, contactHistory);

  // Determine contactability
  const contactability = contactHistory.attempts > 0
    ? (contactHistory.successes / contactHistory.attempts > 0.5 ? "easy" : "moderate")
    : "easy";

  // Calculate priority score for outreach ranking
  const priorityScore = calculatePatientPriorityScore(
    openGaps,
    criticalGaps,
    highPriorityGaps,
    riskScore,
    engagementScore,
    gaps,
  );

  return {
    patientId,
    patientName,
    age,
    riskScore,
    totalGaps: gaps.length,
    openGaps,
    criticalGaps,
    highPriorityGaps,
    gaps,
    lastVisitDate,
    nextScheduledVisit,
    engagementScore,
    contactability,
    priorityScore,
  };
}

/**
 * Calculate engagement score (0-100)
 */
function calculateEngagementScore(
  lastVisitDate?: Date,
  nextScheduledVisit?: Date,
  contactHistory?: { attempts: number; successes: number },
): number {
  let score = 50; // Base score

  // Recent visit bonus
  if (lastVisitDate) {
    const daysSinceVisit = Math.floor(
      (new Date().getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceVisit < 30) score += 25;
    else if (daysSinceVisit < 90) score += 15;
    else if (daysSinceVisit < 180) score += 5;
    else score -= 10;
  } else {
    score -= 20; // Never visited
  }

  // Upcoming visit bonus
  if (nextScheduledVisit) {
    score += 15;
  }

  // Contact success rate
  if (contactHistory && contactHistory.attempts > 0) {
    const successRate = contactHistory.successes / contactHistory.attempts;
    score += successRate * 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate patient priority score for outreach
 */
function calculatePatientPriorityScore(
  openGaps: number,
  criticalGaps: number,
  highPriorityGaps: number,
  riskScore: number,
  engagementScore: number,
  gaps: CareGap[],
): number {
  let score = 0;

  // Gap count and priority
  score += criticalGaps * 50;
  score += highPriorityGaps * 25;
  score += openGaps * 5;

  // Risk score (higher risk = higher priority)
  score += riskScore * 10;

  // Engagement (higher engagement = easier to close gaps)
  score += engagementScore * 0.5;

  // Quality impact
  const totalQualityImpact = gaps
    .filter(g => g.status === "open")
    .reduce((sum, g) => sum + g.qualityImpact, 0);
  score += totalQualityImpact * 0.1;

  // Closure complexity (prioritize easy wins)
  const easyGaps = gaps.filter(g => g.status === "open" && g.closureComplexity === "easy").length;
  score += easyGaps * 10;

  return score;
}

// ============================================================================
// Care Gap Outreach Prioritization
// ============================================================================

/**
 * Prioritize patients for outreach
 */
export function prioritizePatientsForOutreach(
  patients: PatientCareGapProfile[],
  capacity: number = 100,
): {
  highPriority: PatientCareGapProfile[];
  mediumPriority: PatientCareGapProfile[];
  lowPriority: PatientCareGapProfile[];
  recommended: PatientCareGapProfile[];
} {
  // Sort by priority score
  const sorted = [...patients].sort((a, b) => b.priorityScore - a.priorityScore);

  // Assign ranks
  sorted.forEach((patient, index) => {
    patient.priorityRank = index + 1;
  });

  // Categorize
  const highPriority = sorted.filter(p => p.criticalGaps > 0 || p.highPriorityGaps >= 3);
  const mediumPriority = sorted.filter(p =>
    p.criticalGaps === 0 && p.highPriorityGaps > 0 && p.highPriorityGaps < 3
  );
  const lowPriority = sorted.filter(p =>
    p.criticalGaps === 0 && p.highPriorityGaps === 0
  );

  // Recommended list (top N based on capacity)
  const recommended = sorted.slice(0, capacity);

  return {
    highPriority,
    mediumPriority,
    lowPriority,
    recommended,
  };
}

// ============================================================================
// Care Gap Closure Tracking
// ============================================================================

/**
 * Update care gap status
 */
export function updateCareGapStatus(
  gap: CareGap,
  status: CareGapStatus,
  notes?: string,
): CareGap {
  const updated = { ...gap, status };

  if (status === "closed") {
    updated.lastCompleted = new Date();
  }

  if (notes) {
    updated.notes = notes;
  }

  return updated;
}

/**
 * Record outreach attempt
 */
export function recordOutreachAttempt(
  gap: CareGap,
  contactMethod: string,
  successful: boolean,
  nextAttemptDate?: Date,
): CareGap {
  return {
    ...gap,
    outreachAttempts: gap.outreachAttempts + 1,
    lastOutreachDate: new Date(),
    nextOutreachDate: nextAttemptDate,
    preferredContactMethod: successful ? contactMethod : gap.preferredContactMethod,
    status: successful ? "in-progress" : gap.status,
  };
}

/**
 * Add barrier to care gap
 */
export function addGapBarrier(
  gap: CareGap,
  barrier: string,
): CareGap {
  return {
    ...gap,
    barriers: [...gap.barriers, barrier],
  };
}

// ============================================================================
// Gap Closure Analytics
// ============================================================================

export interface GapClosureAnalytics {
  totalGapsIdentified: number;
  gapsOpened: number;
  gapsClosed: number;
  gapsInProgress: number;
  gapsExcluded: number;

  closureRate: number;
  averageTimeToClose: number; // days
  closureRateByCategory: Record<CareGapCategory, number>;
  closureRateByPriority: Record<CareGapPriority, number>;

  topBarriers: Array<{ barrier: string; count: number }>;
  outreachEffectiveness: number;
}

/**
 * Calculate gap closure analytics
 */
export function calculateGapClosureAnalytics(
  allGaps: CareGap[],
): GapClosureAnalytics {
  const totalGapsIdentified = allGaps.length;
  const gapsOpened = allGaps.filter(g => g.status === "open").length;
  const gapsClosed = allGaps.filter(g => g.status === "closed").length;
  const gapsInProgress = allGaps.filter(g => g.status === "in-progress").length;
  const gapsExcluded = allGaps.filter(g => g.status === "excluded").length;

  const closureRate = totalGapsIdentified > 0
    ? (gapsClosed / totalGapsIdentified) * 100
    : 0;

  // Average time to close
  const closedGaps = allGaps.filter(g => g.status === "closed" && g.lastCompleted);
  const timesToClose = closedGaps.map(g => {
    if (g.lastCompleted && g.dueDate) {
      return Math.abs(g.lastCompleted.getTime() - g.dueDate.getTime()) / (1000 * 60 * 60 * 24);
    }
    return 0;
  });

  const averageTimeToClose = timesToClose.length > 0
    ? timesToClose.reduce((a, b) => a + b, 0) / timesToClose.length
    : 0;

  // Closure rate by category
  const categories: CareGapCategory[] = [
    "preventive-screening",
    "chronic-disease-management",
    "medication-adherence",
    "follow-up-care",
    "behavioral-health",
  ];

  const closureRateByCategory: Record<string, number> = {};
  categories.forEach(category => {
    const categoryGaps = allGaps.filter(g => g.category === category);
    const categoryClosed = categoryGaps.filter(g => g.status === "closed").length;
    closureRateByCategory[category] = categoryGaps.length > 0
      ? (categoryClosed / categoryGaps.length) * 100
      : 0;
  });

  // Closure rate by priority
  const priorities: CareGapPriority[] = ["critical", "high", "medium", "low"];
  const closureRateByPriority: Record<string, number> = {};

  priorities.forEach(priority => {
    const priorityGaps = allGaps.filter(g => g.priority === priority);
    const priorityClosed = priorityGaps.filter(g => g.status === "closed").length;
    closureRateByPriority[priority] = priorityGaps.length > 0
      ? (priorityClosed / priorityGaps.length) * 100
      : 0;
  });

  // Top barriers
  const barrierCounts: Record<string, number> = {};
  allGaps.forEach(gap => {
    gap.barriers.forEach(barrier => {
      barrierCounts[barrier] = (barrierCounts[barrier] || 0) + 1;
    });
  });

  const topBarriers = Object.entries(barrierCounts)
    .map(([barrier, count]) => ({ barrier, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Outreach effectiveness
  const gapsWithOutreach = allGaps.filter(g => g.outreachAttempts > 0);
  const successfulOutreach = gapsWithOutreach.filter(g => g.status === "in-progress" || g.status === "closed").length;
  const outreachEffectiveness = gapsWithOutreach.length > 0
    ? (successfulOutreach / gapsWithOutreach.length) * 100
    : 0;

  return {
    totalGapsIdentified,
    gapsOpened,
    gapsClosed,
    gapsInProgress,
    gapsExcluded,
    closureRate,
    averageTimeToClose,
    closureRateByCategory: closureRateByCategory as any,
    closureRateByPriority: closureRateByPriority as any,
    topBarriers,
    outreachEffectiveness,
  };
}

// ============================================================================
// Care Gap Recommendations
// ============================================================================

/**
 * Generate care gap closure recommendations
 */
export function generateGapClosureRecommendations(
  gap: CareGap,
): string[] {
  const recommendations: string[] = [];

  // Category-specific recommendations
  if (gap.category === "preventive-screening") {
    recommendations.push("Schedule screening appointment during next visit");
    recommendations.push("Provide patient education on screening importance");

    if (gap.closureComplexity === "easy") {
      recommendations.push("Offer same-day screening if patient is in office");
    }
  }

  if (gap.category === "chronic-disease-management") {
    recommendations.push("Review current treatment plan and adjust as needed");
    recommendations.push("Ensure patient understands disease management goals");
    recommendations.push("Consider care management program enrollment");
  }

  if (gap.category === "medication-adherence") {
    recommendations.push("Assess barriers to medication adherence");
    recommendations.push("Consider medication cost assistance programs");
    recommendations.push("Simplify medication regimen if possible");
    recommendations.push("Set up medication reminders or pill box");
  }

  if (gap.category === "behavioral-health") {
    recommendations.push("Connect patient with behavioral health specialist");
    recommendations.push("Screen for social determinants of health");
    recommendations.push("Provide mental health resources");
  }

  // Priority-based recommendations
  if (gap.priority === "critical") {
    recommendations.push("URGENT: Immediate outreach required");
    recommendations.push("Escalate to care manager");
  }

  // Overdue-based recommendations
  if (gap.overdueBy && gap.overdueBy > 90) {
    recommendations.push("Multiple outreach methods recommended");
    recommendations.push("Consider home visit or community health worker outreach");
  }

  // Barrier-based recommendations
  if (gap.barriers.includes("transportation")) {
    recommendations.push("Arrange transportation assistance");
    recommendations.push("Offer telehealth alternative if appropriate");
  }

  if (gap.barriers.includes("cost")) {
    recommendations.push("Explore financial assistance programs");
    recommendations.push("Identify lower-cost alternatives");
  }

  return recommendations;
}
