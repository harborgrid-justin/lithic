/**
 * Diagnosis-Based Clinical Alerts
 * Guidelines, monitoring, and quality measures based on diagnoses
 */

import {
  ContextDiagnosis,
  ContextMedication,
  CDSContext,
  ContextLab,
} from "@/types/cds";

/**
 * Diagnosis-specific guideline
 */
interface DiagnosisGuideline {
  icdCode: string;
  icdPattern?: string;
  condition: string;
  category:
    | "MONITORING"
    | "MEDICATION"
    | "PREVENTIVE"
    | "FOLLOW_UP"
    | "LIFESTYLE"
    | "TESTING";
  title: string;
  recommendation: string;
  evidence: string;
  frequency?: string;
  timeframe?: string;
}

const DIAGNOSIS_GUIDELINES: DiagnosisGuideline[] = [
  // Diabetes Management
  {
    icdCode: "E11",
    icdPattern: "E11.*",
    condition: "Type 2 Diabetes",
    category: "MONITORING",
    title: "HbA1c Monitoring",
    recommendation:
      "Check HbA1c every 3 months if not at goal, every 6 months if at goal.",
    evidence: "ADA Standards of Care 2024",
    frequency: "Every 3-6 months",
  },
  {
    icdCode: "E11",
    condition: "Type 2 Diabetes",
    category: "TESTING",
    title: "Annual Comprehensive Foot Exam",
    recommendation:
      "Perform comprehensive foot examination annually to assess for peripheral neuropathy and vascular disease.",
    evidence: "ADA Standards of Care 2024",
    frequency: "Annually",
  },
  {
    icdCode: "E11",
    condition: "Type 2 Diabetes",
    category: "TESTING",
    title: "Annual Dilated Eye Exam",
    recommendation:
      "Refer for dilated eye examination annually to screen for diabetic retinopathy.",
    evidence: "ADA Standards of Care 2024",
    frequency: "Annually",
  },
  {
    icdCode: "E11",
    condition: "Type 2 Diabetes",
    category: "MONITORING",
    title: "Renal Function Monitoring",
    recommendation:
      "Monitor urinary albumin and serum creatinine annually for diabetic kidney disease.",
    evidence: "ADA Standards of Care 2024",
    frequency: "Annually",
  },
  {
    icdCode: "E11",
    condition: "Type 2 Diabetes",
    category: "PREVENTIVE",
    title: "ASCVD Risk Assessment",
    recommendation:
      "Assess 10-year ASCVD risk. Consider statin therapy if age >40 or presence of cardiovascular risk factors.",
    evidence: "ADA Standards of Care 2024",
  },

  // Hypertension Management
  {
    icdCode: "I10",
    condition: "Essential Hypertension",
    category: "MONITORING",
    title: "Blood Pressure Monitoring",
    recommendation:
      "Monitor BP at each visit. Goal: <130/80 mmHg for most patients.",
    evidence: "ACC/AHA 2017 Guidelines",
  },
  {
    icdCode: "I10",
    condition: "Essential Hypertension",
    category: "TESTING",
    title: "Baseline Laboratory Tests",
    recommendation:
      "Obtain electrolytes, creatinine, glucose, lipid panel, urinalysis, and ECG at baseline.",
    evidence: "ACC/AHA 2017 Guidelines",
  },

  // Heart Failure
  {
    icdCode: "I50",
    icdPattern: "I50.*",
    condition: "Heart Failure",
    category: "MEDICATION",
    title: "Guideline-Directed Medical Therapy",
    recommendation:
      "Initiate GDMT: ACE-I/ARB/ARNI + Beta-blocker + MRA + SGLT2i for HFrEF.",
    evidence: "ACC/AHA/HFSA 2022 Guidelines",
  },
  {
    icdCode: "I50",
    condition: "Heart Failure",
    category: "MONITORING",
    title: "Daily Weight Monitoring",
    recommendation:
      "Instruct patient to monitor daily weights and report gain of >2-3 lbs in 24 hours or >5 lbs in a week.",
    evidence: "ACC/AHA/HFSA 2022 Guidelines",
  },
  {
    icdCode: "I50",
    condition: "Heart Failure",
    category: "PREVENTIVE",
    title: "Sodium and Fluid Restriction",
    recommendation:
      "Advise sodium restriction (<2-3g/day) and fluid restriction if hyponatremia present.",
    evidence: "ACC/AHA/HFSA 2022 Guidelines",
  },

  // Atrial Fibrillation
  {
    icdCode: "I48",
    icdPattern: "I48.*",
    condition: "Atrial Fibrillation",
    category: "TESTING",
    title: "CHA2DS2-VASc Score",
    recommendation:
      "Calculate CHA2DS2-VASc score to determine stroke risk and need for anticoagulation.",
    evidence: "AHA/ACC/HRS 2019 Guidelines",
  },
  {
    icdCode: "I48",
    condition: "Atrial Fibrillation",
    category: "MEDICATION",
    title: "Anticoagulation Therapy",
    recommendation:
      "Consider anticoagulation if CHA2DS2-VASc ≥2 (men) or ≥3 (women). Prefer DOACs over warfarin.",
    evidence: "AHA/ACC/HRS 2019 Guidelines",
  },

  // COPD
  {
    icdCode: "J44",
    icdPattern: "J44.*",
    condition: "COPD",
    category: "TESTING",
    title: "Spirometry",
    recommendation:
      "Obtain spirometry to confirm diagnosis and assess severity.",
    evidence: "GOLD Guidelines 2024",
  },
  {
    icdCode: "J44",
    condition: "COPD",
    category: "PREVENTIVE",
    title: "Smoking Cessation",
    recommendation:
      "Provide smoking cessation counseling and pharmacotherapy at every visit.",
    evidence: "GOLD Guidelines 2024",
  },
  {
    icdCode: "J44",
    condition: "COPD",
    category: "PREVENTIVE",
    title: "Vaccinations",
    recommendation:
      "Ensure pneumococcal and annual influenza vaccinations are up to date.",
    evidence: "GOLD Guidelines 2024",
  },

  // Osteoporosis
  {
    icdCode: "M81",
    icdPattern: "M81.*",
    condition: "Osteoporosis",
    category: "TESTING",
    title: "Bone Density Monitoring",
    recommendation:
      "Repeat DEXA scan every 2 years to monitor treatment efficacy.",
    evidence: "NOF Guidelines",
    frequency: "Every 2 years",
  },
  {
    icdCode: "M81",
    condition: "Osteoporosis",
    category: "PREVENTIVE",
    title: "Calcium and Vitamin D Supplementation",
    recommendation:
      "Ensure adequate calcium (1200mg/day) and vitamin D (800-1000 IU/day) intake.",
    evidence: "NOF Guidelines",
  },

  // Depression
  {
    icdCode: "F32",
    icdPattern: "F32.*",
    condition: "Major Depressive Disorder",
    category: "MONITORING",
    title: "PHQ-9 Screening",
    recommendation:
      "Administer PHQ-9 at baseline and regularly to monitor treatment response.",
    evidence: "APA Practice Guidelines",
    frequency: "Every 2-4 weeks initially",
  },
  {
    icdCode: "F32",
    condition: "Major Depressive Disorder",
    category: "FOLLOW_UP",
    title: "Suicide Risk Assessment",
    recommendation:
      "Assess suicide risk at each visit, especially during treatment initiation and dose changes.",
    evidence: "APA Practice Guidelines",
  },

  // CKD
  {
    icdCode: "N18",
    icdPattern: "N18.*",
    condition: "Chronic Kidney Disease",
    category: "MONITORING",
    title: "Renal Function Monitoring",
    recommendation:
      "Monitor serum creatinine, eGFR, and urinary albumin every 3-6 months.",
    evidence: "KDIGO Guidelines",
    frequency: "Every 3-6 months",
  },
  {
    icdCode: "N18",
    condition: "Chronic Kidney Disease",
    category: "MONITORING",
    title: "Electrolyte Monitoring",
    recommendation:
      "Monitor potassium, phosphorus, calcium, and PTH based on CKD stage.",
    evidence: "KDIGO Guidelines",
  },
  {
    icdCode: "N18",
    condition: "Chronic Kidney Disease",
    category: "MEDICATION",
    title: "Medication Dose Adjustment",
    recommendation:
      "Review all medications for renal dose adjustments. Avoid nephrotoxic agents.",
    evidence: "KDIGO Guidelines",
  },
];

export interface DiagnosisAlert {
  diagnosis: ContextDiagnosis;
  category: DiagnosisGuideline["category"];
  title: string;
  recommendation: string;
  evidence: string;
  priority: "HIGH" | "MODERATE" | "LOW";
  dueDate?: Date;
  overdue?: boolean;
}

/**
 * Diagnosis-Based Alert Generator
 */
export class DiagnosisAlertGenerator {
  /**
   * Generate alerts based on patient diagnoses
   */
  generateAlerts(
    diagnoses: ContextDiagnosis[],
    context: CDSContext,
  ): DiagnosisAlert[] {
    const alerts: DiagnosisAlert[] = [];

    for (const diagnosis of diagnoses) {
      // Only check active diagnoses
      if (diagnosis.status !== "ACTIVE") {
        continue;
      }

      const diagnosisAlerts = this.getAlertsForDiagnosis(diagnosis, context);
      alerts.push(...diagnosisAlerts);
    }

    return this.sortByPriority(alerts);
  }

  /**
   * Get alerts for a specific diagnosis
   */
  private getAlertsForDiagnosis(
    diagnosis: ContextDiagnosis,
    context: CDSContext,
  ): DiagnosisAlert[] {
    const alerts: DiagnosisAlert[] = [];

    // Find applicable guidelines
    const guidelines = this.findApplicableGuidelines(diagnosis.icdCode);

    for (const guideline of guidelines) {
      // Check if alert should be triggered
      if (this.shouldTriggerAlert(guideline, diagnosis, context)) {
        alerts.push({
          diagnosis,
          category: guideline.category,
          title: guideline.title,
          recommendation: guideline.recommendation,
          evidence: guideline.evidence,
          priority: this.determinePriority(guideline, context),
        });
      }
    }

    return alerts;
  }

  /**
   * Find applicable guidelines for ICD code
   */
  private findApplicableGuidelines(icdCode: string): DiagnosisGuideline[] {
    return DIAGNOSIS_GUIDELINES.filter((guideline) => {
      // Exact match
      if (guideline.icdCode === icdCode) {
        return true;
      }

      // Pattern match (e.g., E11.* matches E11.9)
      if (guideline.icdPattern) {
        const pattern = guideline.icdPattern.replace("*", ".*");
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(icdCode);
      }

      // Partial match (e.g., E11 matches E11.9)
      return icdCode.startsWith(guideline.icdCode);
    });
  }

  /**
   * Determine if alert should be triggered
   */
  private shouldTriggerAlert(
    guideline: DiagnosisGuideline,
    diagnosis: ContextDiagnosis,
    context: CDSContext,
  ): boolean {
    // For medication recommendations, check if already on appropriate therapy
    if (guideline.category === "MEDICATION") {
      return !this.isOnGuidelineDirectedTherapy(
        guideline,
        context.activeMedications,
      );
    }

    // For monitoring recommendations, check if recent labs exist
    if (
      guideline.category === "MONITORING" ||
      guideline.category === "TESTING"
    ) {
      return !this.hasRecentTest(guideline, context.recentLabs);
    }

    // Always show preventive and follow-up recommendations
    return true;
  }

  /**
   * Check if patient is on guideline-directed therapy
   */
  private isOnGuidelineDirectedTherapy(
    guideline: DiagnosisGuideline,
    medications: ContextMedication[],
  ): boolean {
    // This would need more sophisticated logic in production
    // For now, assume not on therapy to trigger the alert
    return false;
  }

  /**
   * Check if recent test exists
   */
  private hasRecentTest(
    guideline: DiagnosisGuideline,
    labs: ContextLab[],
  ): boolean {
    if (labs.length === 0) {
      return false;
    }

    // Check if relevant lab exists within timeframe
    const relevantLabs = labs.filter((lab) => {
      // Match lab based on guideline title/recommendation
      const title = guideline.title.toLowerCase();
      const labName = lab.name.toLowerCase();

      if (title.includes("hba1c") && labName.includes("hba1c")) return true;
      if (title.includes("creatinine") && labName.includes("creatinine"))
        return true;
      if (title.includes("albumin") && labName.includes("albumin")) return true;

      return false;
    });

    if (relevantLabs.length === 0) {
      return false;
    }

    // Check if lab is recent enough based on frequency
    const mostRecentLab = relevantLabs.reduce((latest, lab) => {
      return new Date(lab.resultDate) > new Date(latest.resultDate)
        ? lab
        : latest;
    });

    const daysSinceTest =
      (Date.now() - new Date(mostRecentLab.resultDate).getTime()) /
      (1000 * 60 * 60 * 24);

    // Determine if test is recent based on frequency
    if (guideline.frequency?.includes("3 months")) {
      return daysSinceTest < 90;
    }
    if (guideline.frequency?.includes("6 months")) {
      return daysSinceTest < 180;
    }
    if (guideline.frequency?.includes("annually")) {
      return daysSinceTest < 365;
    }

    // Default to 6 months
    return daysSinceTest < 180;
  }

  /**
   * Determine priority of alert
   */
  private determinePriority(
    guideline: DiagnosisGuideline,
    context: CDSContext,
  ): "HIGH" | "MODERATE" | "LOW" {
    // High priority for medication and critical monitoring
    if (guideline.category === "MEDICATION") {
      return "HIGH";
    }

    if (
      guideline.title.toLowerCase().includes("critical") ||
      guideline.title.toLowerCase().includes("urgent")
    ) {
      return "HIGH";
    }

    // Moderate priority for monitoring and testing
    if (
      guideline.category === "MONITORING" ||
      guideline.category === "TESTING"
    ) {
      return "MODERATE";
    }

    // Low priority for preventive and lifestyle
    return "LOW";
  }

  /**
   * Sort alerts by priority
   */
  private sortByPriority(alerts: DiagnosisAlert[]): DiagnosisAlert[] {
    const priorityOrder = { HIGH: 3, MODERATE: 2, LOW: 1 };

    return alerts.sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get preventive care recommendations
   */
  getPreventiveCareRecommendations(
    age: number,
    gender: string,
    diagnoses: ContextDiagnosis[],
  ): DiagnosisAlert[] {
    const recommendations: DiagnosisAlert[] = [];

    // Colorectal cancer screening
    if (age >= 45 && age <= 75) {
      recommendations.push({
        diagnosis: {
          icdCode: "Z12.11",
          description: "Screening",
          diagnosedDate: new Date(),
          status: "ACTIVE",
        },
        category: "PREVENTIVE",
        title: "Colorectal Cancer Screening",
        recommendation:
          "Recommend colonoscopy every 10 years or annual FIT testing.",
        evidence: "USPSTF Grade A Recommendation",
        priority: "MODERATE",
      });
    }

    // Mammography
    if (gender === "FEMALE" && age >= 40) {
      recommendations.push({
        diagnosis: {
          icdCode: "Z12.31",
          description: "Screening",
          diagnosedDate: new Date(),
          status: "ACTIVE",
        },
        category: "PREVENTIVE",
        title: "Breast Cancer Screening",
        recommendation: "Recommend annual or biennial mammography.",
        evidence: "USPSTF Grade B Recommendation",
        priority: "MODERATE",
      });
    }

    // Osteoporosis screening
    if (gender === "FEMALE" && age >= 65) {
      recommendations.push({
        diagnosis: {
          icdCode: "Z13.820",
          description: "Screening",
          diagnosedDate: new Date(),
          status: "ACTIVE",
        },
        category: "PREVENTIVE",
        title: "Osteoporosis Screening",
        recommendation: "Recommend DEXA scan for bone density assessment.",
        evidence: "USPSTF Grade B Recommendation",
        priority: "MODERATE",
      });
    }

    return recommendations;
  }
}

// Export singleton instance
export const diagnosisAlertGenerator = new DiagnosisAlertGenerator();
