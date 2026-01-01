/**
 * MIPS Improvement Activities Category
 * Measures focused on practice improvement, care coordination, patient safety, and population health
 */

export type ActivityCategory =
  | "achieving-health-equity"
  | "behavioral-mental-health"
  | "beneficiary-engagement"
  | "care-coordination"
  | "emergency-preparedness"
  | "expanded-practice-access"
  | "patient-safety"
  | "population-management";

export type ActivityWeight = "medium" | "high";

export interface ImprovementActivity {
  activityId: string;
  title: string;
  description: string;
  category: ActivityCategory;
  subcategory?: string;
  weight: ActivityWeight;
  basePoints: number;

  // Attestation
  attested: boolean;
  attestationDate?: Date;
  attestedBy?: string;

  // Documentation
  supportingDocumentation: string[];
  implementationDate?: Date;

  // Special designations
  highPriority: boolean;
}

export interface IACategory {
  totalActivities: number;
  activitiesAttested: number;
  totalPoints: number;
  maxPoints: number;
  categoryScore: number;
  categoryWeight: number;
  weightedScore: number;

  activities: ImprovementActivity[];
  categoriesRepresented: ActivityCategory[];
}

// ============================================================================
// Improvement Activity Definitions
// ============================================================================

/**
 * Get improvement activity definition
 */
export function getImprovementActivityDefinition(activityId: string): Partial<ImprovementActivity> {
  const activities: Record<string, Partial<ImprovementActivity>> = {
    // Care Coordination
    "IA_CC_1": {
      activityId: "IA_CC_1",
      title: "Implementation of Use of Specialist Reports Back to Referring Clinician or Group",
      description: "Implementation of processes to improve care coordination by ensuring specialist reports are sent to the referring clinician",
      category: "care-coordination",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },

    "IA_CC_4": {
      activityId: "IA_CC_4",
      title: "Care Transition Documentation Practice Improvements",
      description: "Implementation of practices/processes to ensure a comprehensive care plan is accessible to the patient and documented in the EHR for transitions of care",
      category: "care-coordination",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },

    "IA_CC_7": {
      activityId: "IA_CC_7",
      title: "Use of QCDR Data for Ongoing Practice Assessment and Improvements",
      description: "Use of QCDR data for ongoing practice assessment and improvements",
      category: "care-coordination",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },

    "IA_CC_13": {
      activityId: "IA_CC_13",
      title: "Practice Improvements for Bilateral Exchange of Patient Information",
      description: "Participation in a Health Information Exchange (HIE) to enable secure, bi-directional data exchange",
      category: "care-coordination",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },

    // Beneficiary Engagement
    "IA_BE_2": {
      activityId: "IA_BE_2",
      title: "Use of Telehealth Services that Expand Practice Access",
      description: "Expanded practice access by offering telehealth services",
      category: "beneficiary-engagement",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },

    "IA_BE_6": {
      activityId: "IA_BE_6",
      title: "Collection and Use of Patient Experience and Satisfaction Data on Access",
      description: "Collection and use of patient experience and satisfaction data on access to care and development of improvement plan",
      category: "beneficiary-engagement",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },

    "IA_BE_14": {
      activityId: "IA_BE_14",
      title: "Engagement of Patients Through Implementation of Improvements in Patient Portal",
      description: "Enhancements to patient portal to improve patient engagement",
      category: "beneficiary-engagement",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },

    "IA_BE_24": {
      activityId: "IA_BE_24",
      title: "Provide Patients with Access to their Health Information",
      description: "Provide patients with access to their health information through multiple modalities",
      category: "beneficiary-engagement",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },

    // Population Management
    "IA_PM_1": {
      activityId: "IA_PM_1",
      title: "Participation in ACO",
      description: "Participation in an Accountable Care Organization (ACO)",
      category: "population-management",
      weight: "high",
      basePoints: 20,
      highPriority: true,
    },

    "IA_PM_2": {
      activityId: "IA_PM_2",
      title: "Participation in PCMH",
      description: "Participation in a Patient-Centered Medical Home (PCMH)",
      category: "population-management",
      weight: "high",
      basePoints: 20,
      highPriority: true,
    },

    "IA_PM_4": {
      activityId: "IA_PM_4",
      title: "Chronic Care Management",
      description: "Implementation of chronic care management services",
      category: "population-management",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },

    "IA_PM_14": {
      activityId: "IA_PM_14",
      title: "Implement Condition-Specific Chronic Disease Self-Management Support Programs",
      description: "Implementation of condition-specific chronic disease self-management support programs",
      category: "population-management",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },

    "IA_PM_16": {
      activityId: "IA_PM_16",
      title: "Implementation of Medication Management Practice Improvements",
      description: "Implement medication management practice improvements including medication reconciliation",
      category: "population-management",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },

    // Patient Safety and Practice Assessment
    "IA_PSPA_6": {
      activityId: "IA_PSPA_6",
      title: "Participation in an AHRQ-listed Patient Safety Organization",
      description: "Participation in an AHRQ-listed Patient Safety Organization",
      category: "patient-safety",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },

    "IA_PSPA_18": {
      activityId: "IA_PSPA_18",
      title: "Participation in a QCDR that Promotes Use of Patient Safety Data",
      description: "Participation in QCDR that promotes use of patient safety data",
      category: "patient-safety",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },

    "IA_PSPA_29": {
      activityId: "IA_PSPA_29",
      title: "Leadership Engagement in Regular Guidance and Demonstrated Commitment",
      description: "Leadership engagement in regular guidance and demonstrated commitment for implementing practice improvement changes",
      category: "patient-safety",
      weight: "high",
      basePoints: 20,
      highPriority: false,
    },

    // Achieving Health Equity
    "IA_AHE_1": {
      activityId: "IA_AHE_1",
      title: "Engagement of New Medicaid Patients and Follow-up",
      description: "Expand access to newly eligible Medicaid patients and follow-up",
      category: "achieving-health-equity",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },

    "IA_AHE_4": {
      activityId: "IA_AHE_4",
      title: "Engagement of Underserved and Vulnerable Populations",
      description: "Provide access to care for underserved and vulnerable populations",
      category: "achieving-health-equity",
      weight: "high",
      basePoints: 20,
      highPriority: true,
    },

    // Behavioral and Mental Health
    "IA_BMH_1": {
      activityId: "IA_BMH_1",
      title: "Implement Collaborative Care Model",
      description: "Implementation of collaborative care model for behavioral health and mental health conditions",
      category: "behavioral-mental-health",
      weight: "high",
      basePoints: 20,
      highPriority: true,
    },

    "IA_BMH_6": {
      activityId: "IA_BMH_6",
      title: "Behavioral and Mental Health Integration",
      description: "Implementation of behavioral and mental health integration practices",
      category: "behavioral-mental-health",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },

    // Emergency Response and Preparedness
    "IA_EPA_4": {
      activityId: "IA_EPA_4",
      title: "Participation in CDC-Supported Antibiotic Stewardship",
      description: "Participation in CDC-supported antibiotic stewardship activities",
      category: "emergency-preparedness",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },

    // Expanded Practice Access
    "IA_EPA_1": {
      activityId: "IA_EPA_1",
      title: "Provide 24/7 Access to MIPS Eligible Clinicians or Groups",
      description: "Provide 24/7 access to MIPS eligible clinicians or groups",
      category: "expanded-practice-access",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },

    "IA_EPA_3": {
      activityId: "IA_EPA_3",
      title: "Collection and Use of Patient Experience and Satisfaction Data",
      description: "Collection and follow-up on patient experience and satisfaction data",
      category: "expanded-practice-access",
      weight: "medium",
      basePoints: 10,
      highPriority: false,
    },
  };

  return activities[activityId] || {};
}

// ============================================================================
// Activity Attestation
// ============================================================================

/**
 * Attest to improvement activity
 */
export function attestImprovementActivity(
  activityId: string,
  attestedBy: string,
  supportingDocumentation: string[] = [],
  implementationDate?: Date,
): ImprovementActivity {
  const definition = getImprovementActivityDefinition(activityId);

  return {
    activityId,
    title: definition.title || "",
    description: definition.description || "",
    category: definition.category || "care-coordination",
    subcategory: definition.subcategory,
    weight: definition.weight || "medium",
    basePoints: definition.basePoints || 10,
    attested: true,
    attestationDate: new Date(),
    attestedBy,
    supportingDocumentation,
    implementationDate,
    highPriority: definition.highPriority || false,
  };
}

// ============================================================================
// IA Category Scoring
// ============================================================================

/**
 * Calculate IA category score
 */
export function calculateIACategoryScore(
  activities: ImprovementActivity[],
  isSmallPractice: boolean = false,
  categoryWeight: number = 0.15, // 15% in 2024+
): IACategory {
  const attestedActivities = activities.filter(a => a.attested);

  // Calculate points
  let totalPoints = 0;

  attestedActivities.forEach(activity => {
    totalPoints += activity.basePoints;
  });

  // Small practices need 40 points, others need 40 points
  // But can earn up to 40 points (4 medium or 2 high activities)
  const maxPoints = 40;

  // Category score (0-100)
  const categoryScore = Math.min(100, (totalPoints / maxPoints) * 100);

  const weightedScore = categoryScore * categoryWeight;

  // Get unique categories represented
  const categoriesRepresented = Array.from(
    new Set(attestedActivities.map(a => a.category))
  );

  return {
    totalActivities: activities.length,
    activitiesAttested: attestedActivities.length,
    totalPoints: Math.min(totalPoints, maxPoints), // Cap at 40
    maxPoints,
    categoryScore,
    categoryWeight,
    weightedScore,
    activities: attestedActivities,
    categoriesRepresented,
  };
}

// ============================================================================
// Activity Selection Optimization
// ============================================================================

/**
 * Recommend optimal activity selection
 */
export function recommendImprovementActivities(
  availableActivities: ImprovementActivity[],
  currentAttestations: ImprovementActivity[],
  targetPoints: number = 40,
): {
  recommendedActivities: ImprovementActivity[];
  totalPoints: number;
  reasoning: string[];
} {
  const reasoning: string[] = [];
  const attestedIds = new Set(currentAttestations.map(a => a.activityId));

  // Filter out already attested
  const unattestedActivities = availableActivities.filter(
    a => !attestedIds.has(a.activityId)
  );

  // Sort by points (high weight first)
  const sortedActivities = [...unattestedActivities].sort((a, b) => {
    if (a.highPriority && !b.highPriority) return -1;
    if (!a.highPriority && b.highPriority) return 1;
    return b.basePoints - a.basePoints;
  });

  const currentPoints = currentAttestations.reduce((sum, a) => sum + a.basePoints, 0);
  const pointsNeeded = Math.max(0, targetPoints - currentPoints);

  const recommendedActivities: ImprovementActivity[] = [];
  let accumulatedPoints = 0;

  for (const activity of sortedActivities) {
    if (accumulatedPoints >= pointsNeeded) break;

    recommendedActivities.push(activity);
    accumulatedPoints += activity.basePoints;

    if (activity.highPriority) {
      reasoning.push(`${activity.activityId}: High-priority activity (20 points)`);
    }
  }

  // Add reasoning
  if (currentPoints >= targetPoints) {
    reasoning.unshift("Target points already achieved");
  } else {
    reasoning.unshift(
      `Need ${pointsNeeded} more points to reach ${targetPoints} points`
    );
  }

  // Category diversity recommendation
  const categories = new Set(recommendedActivities.map(a => a.category));
  reasoning.push(`Activities span ${categories.size} different categories`);

  return {
    recommendedActivities,
    totalPoints: currentPoints + accumulatedPoints,
    reasoning,
  };
}

// ============================================================================
// Activity Validation
// ============================================================================

/**
 * Validate improvement activity attestation
 */
export function validateImprovementActivity(
  activity: ImprovementActivity,
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check attestation
  if (!activity.attested) {
    errors.push("Activity not attested");
  }

  // Check supporting documentation
  if (activity.attested && activity.supportingDocumentation.length === 0) {
    warnings.push("No supporting documentation provided - may be requested during audit");
  }

  // Check implementation date
  if (activity.attested && !activity.implementationDate) {
    warnings.push("Implementation date not specified");
  }

  // Check if activity was implemented during performance period
  if (activity.implementationDate) {
    const performanceYearStart = new Date(new Date().getFullYear(), 0, 1);
    const performanceYearEnd = new Date(new Date().getFullYear(), 11, 31);

    if (
      activity.implementationDate < performanceYearStart ||
      activity.implementationDate > performanceYearEnd
    ) {
      errors.push(
        `Implementation date (${activity.implementationDate.toLocaleDateString()}) outside performance period`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Category Analysis
// ============================================================================

/**
 * Analyze improvement activities by category
 */
export function analyzeActivitiesByCategory(
  activities: ImprovementActivity[],
): Record<ActivityCategory, {
  count: number;
  points: number;
  highPriorityCount: number;
}> {
  const analysis: Record<string, {
    count: number;
    points: number;
    highPriorityCount: number;
  }> = {};

  const categories: ActivityCategory[] = [
    "achieving-health-equity",
    "behavioral-mental-health",
    "beneficiary-engagement",
    "care-coordination",
    "emergency-preparedness",
    "expanded-practice-access",
    "patient-safety",
    "population-management",
  ];

  categories.forEach(category => {
    analysis[category] = {
      count: 0,
      points: 0,
      highPriorityCount: 0,
    };
  });

  activities.filter(a => a.attested).forEach(activity => {
    const cat = analysis[activity.category];
    if (cat) {
      cat.count += 1;
      cat.points += activity.basePoints;
      if (activity.highPriority) {
        cat.highPriorityCount += 1;
      }
    }
  });

  return analysis as Record<ActivityCategory, {
    count: number;
    points: number;
    highPriorityCount: number;
  }>;
}

// ============================================================================
// Insights and Recommendations
// ============================================================================

/**
 * Generate insights for IA category
 */
export function generateIAInsights(
  iaCategory: IACategory,
): {
  strengths: string[];
  opportunities: string[];
  recommendations: string[];
} {
  const strengths: string[] = [];
  const opportunities: string[] = [];
  const recommendations: string[] = [];

  // Overall performance
  if (iaCategory.categoryScore >= 100) {
    strengths.push("Maximum IA points achieved (40 points)");
  } else if (iaCategory.categoryScore >= 75) {
    strengths.push(`Strong IA performance (${iaCategory.totalPoints} points)`);
  } else {
    opportunities.push(`Only ${iaCategory.totalPoints} IA points - room for improvement`);
  }

  // High-priority activities
  const highPriorityCount = iaCategory.activities.filter(a => a.highPriority).length;
  if (highPriorityCount > 0) {
    strengths.push(`${highPriorityCount} high-priority activities attested (20 points each)`);
  } else {
    opportunities.push("No high-priority activities attested - consider ACO or PCMH participation");
    recommendations.push("High-priority activities earn double points (20 vs 10)");
  }

  // Category diversity
  if (iaCategory.categoriesRepresented.length >= 4) {
    strengths.push(`Activities span ${iaCategory.categoriesRepresented.length} different categories`);
  } else if (iaCategory.categoriesRepresented.length <= 2) {
    recommendations.push("Consider diversifying activities across more categories");
  }

  // Points needed
  if (iaCategory.totalPoints < 40) {
    const pointsNeeded = 40 - iaCategory.totalPoints;
    const activitiesNeeded = Math.ceil(pointsNeeded / 10);
    recommendations.push(
      `Attest to ${activitiesNeeded} more medium-weight activities to reach 40 points`
    );
  }

  return {
    strengths,
    opportunities,
    recommendations,
  };
}
