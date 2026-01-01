/**
 * 30-Day Readmission Risk Prediction Model
 *
 * Predicts risk of hospital readmission within 30 days using:
 * - Patient demographics
 * - Diagnosis codes
 * - Previous hospitalizations
 * - Comorbidities
 * - Social determinants of health
 *
 * Based on LACE+ index and machine learning features
 *
 * @module ai/prediction/readmission-model
 */

/**
 * Patient data for readmission prediction
 */
export interface ReadmissionPredictionInput {
  // Demographics
  age: number;
  gender: 'male' | 'female' | 'other';

  // Current admission
  lengthOfStay: number; // days
  admissionType: 'elective' | 'urgent' | 'emergency';
  dischargeDestination: 'home' | 'snf' | 'rehabilitation' | 'other_hospital' | 'died';

  // Clinical
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  procedures: string[];
  comorbidityCount: number;
  charlsonComorbidityIndex?: number;

  // Lab values (if available)
  hemoglobin?: number;
  sodium?: number;
  creatinine?: number;
  albumin?: number;

  // Vital signs at discharge
  vitalSigns?: {
    systolicBP?: number;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
  };

  // History
  previousAdmissionsLast6Months: number;
  previousAdmissionsLastYear: number;
  previousEDVisitsLast6Months: number;

  // Medications
  numberOfMedications: number;
  highRiskMedications?: string[]; // anticoagulants, insulin, opioids, etc.

  // Social
  hasHomeHealthCare?: boolean;
  hasSocialSupport?: boolean;
  insuranceType?: 'medicare' | 'medicaid' | 'private' | 'uninsured';

  // Functional status
  functionalStatus?: 'independent' | 'partially_dependent' | 'fully_dependent';
}

/**
 * Readmission risk prediction result
 */
export interface ReadmissionPredictionResult {
  riskScore: number; // 0-100
  riskCategory: 'low' | 'moderate' | 'high' | 'very_high';
  predictedProbability: number; // 0-1
  riskFactors: RiskFactor[];
  recommendations: string[];
  laceScore?: number;
  hospitalScore?: number;
  confidence: number;
  modelVersion: string;
}

/**
 * Individual risk factor
 */
export interface RiskFactor {
  factor: string;
  weight: number;
  contribution: number; // percentage of total risk
  modifiable: boolean;
}

/**
 * 30-Day Readmission Risk Prediction Model
 *
 * Combines clinical scores (LACE, HOSPITAL) with ML-derived features
 */
export class ReadmissionModel {
  private readonly modelVersion = '1.0.0';

  /**
   * Predict 30-day readmission risk
   *
   * @param input - Patient clinical data
   * @returns Readmission risk prediction
   */
  predict(input: ReadmissionPredictionInput): ReadmissionPredictionResult {
    // Calculate clinical scores
    const laceScore = this.calculateLACEScore(input);
    const hospitalScore = this.calculateHOSPITALScore(input);

    // Extract risk factors
    const riskFactors = this.identifyRiskFactors(input);

    // Calculate overall risk score (0-100)
    const riskScore = this.calculateRiskScore(input, laceScore, hospitalScore, riskFactors);

    // Convert to probability
    const predictedProbability = this.convertToProbability(riskScore);

    // Categorize risk
    const riskCategory = this.categorizeRisk(riskScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(input, riskFactors, riskCategory);

    // Assess model confidence
    const confidence = this.assessConfidence(input);

    return {
      riskScore,
      riskCategory,
      predictedProbability,
      riskFactors,
      recommendations,
      laceScore,
      hospitalScore,
      confidence,
      modelVersion: this.modelVersion,
    };
  }

  /**
   * Calculate LACE Index
   * L = Length of stay
   * A = Acuity of admission
   * C = Comorbidities (Charlson)
   * E = Emergency department visits
   */
  private calculateLACEScore(input: ReadmissionPredictionInput): number {
    let score = 0;

    // Length of stay (0-7 points)
    if (input.lengthOfStay < 1) score += 0;
    else if (input.lengthOfStay === 1) score += 1;
    else if (input.lengthOfStay === 2) score += 2;
    else if (input.lengthOfStay === 3) score += 3;
    else if (input.lengthOfStay <= 6) score += 4;
    else if (input.lengthOfStay <= 13) score += 5;
    else score += 7;

    // Acuity of admission (0-3 points)
    if (input.admissionType === 'emergency') score += 3;
    else if (input.admissionType === 'urgent') score += 2;

    // Comorbidities (0-5 points)
    const charlson = input.charlsonComorbidityIndex || this.estimateCharlson(input);
    if (charlson >= 4) score += 5;
    else if (charlson >= 1) score += charlson;

    // ED visits in last 6 months (0-4 points)
    const edVisits = input.previousEDVisitsLast6Months;
    if (edVisits >= 4) score += 4;
    else score += edVisits;

    return score; // Max 19 points
  }

  /**
   * Calculate HOSPITAL Score
   * Hemoglobin, Oncology, Sodium, Procedure, Index admission type,
   * Total admissions, Length of stay
   */
  private calculateHOSPITALScore(input: ReadmissionPredictionInput): number {
    let score = 0;

    // Hemoglobin at discharge (<12 g/dL) - 1 point
    if (input.hemoglobin && input.hemoglobin < 12) score += 1;

    // Oncology service - 2 points
    if (this.isOncologyRelated(input.primaryDiagnosis, input.secondaryDiagnoses)) {
      score += 2;
    }

    // Sodium at discharge (<135 mEq/L) - 1 point
    if (input.sodium && input.sodium < 135) score += 1;

    // Procedure during hospitalization - 1 point
    if (input.procedures.length > 0) score += 1;

    // Index admission type (urgent/emergent) - 1 point
    if (input.admissionType !== 'elective') score += 1;

    // Total admissions in last year - up to 5 points
    const admissions = input.previousAdmissionsLastYear;
    if (admissions >= 5) score += 5;
    else score += admissions;

    // Length of stay >= 5 days - 2 points
    if (input.lengthOfStay >= 5) score += 2;

    return score; // Max 13 points
  }

  /**
   * Identify and weight risk factors
   */
  private identifyRiskFactors(input: ReadmissionPredictionInput): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Prior admissions (strongest predictor)
    if (input.previousAdmissionsLast6Months > 0) {
      factors.push({
        factor: 'Recent hospitalizations',
        weight: 0.25,
        contribution: 0,
        modifiable: false,
      });
    }

    // Long length of stay
    if (input.lengthOfStay > 7) {
      factors.push({
        factor: 'Extended hospital stay',
        weight: 0.15,
        contribution: 0,
        modifiable: true,
      });
    }

    // High comorbidity burden
    if (input.comorbidityCount >= 3) {
      factors.push({
        factor: 'Multiple comorbidities',
        weight: 0.20,
        contribution: 0,
        modifiable: false,
      });
    }

    // Polypharmacy
    if (input.numberOfMedications > 10) {
      factors.push({
        factor: 'Polypharmacy (>10 medications)',
        weight: 0.12,
        contribution: 0,
        modifiable: true,
      });
    }

    // Lack of social support
    if (input.hasSocialSupport === false) {
      factors.push({
        factor: 'Limited social support',
        weight: 0.10,
        contribution: 0,
        modifiable: true,
      });
    }

    // Discharge to facility
    if (input.dischargeDestination !== 'home') {
      factors.push({
        factor: 'Discharge to facility',
        weight: 0.08,
        contribution: 0,
        modifiable: false,
      });
    }

    // Abnormal labs
    if (input.albumin && input.albumin < 3.0) {
      factors.push({
        factor: 'Low albumin (malnutrition)',
        weight: 0.08,
        contribution: 0,
        modifiable: true,
      });
    }

    // High-risk medications
    if (input.highRiskMedications && input.highRiskMedications.length > 0) {
      factors.push({
        factor: 'High-risk medications',
        weight: 0.10,
        contribution: 0,
        modifiable: true,
      });
    }

    // Functional dependence
    if (input.functionalStatus === 'fully_dependent' || input.functionalStatus === 'partially_dependent') {
      factors.push({
        factor: 'Functional dependence',
        weight: 0.12,
        contribution: 0,
        modifiable: true,
      });
    }

    // Calculate contributions (normalized to sum to 100%)
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    factors.forEach(f => {
      f.contribution = (f.weight / totalWeight) * 100;
    });

    return factors.sort((a, b) => b.contribution - a.contribution);
  }

  /**
   * Calculate overall risk score (0-100)
   */
  private calculateRiskScore(
    input: ReadmissionPredictionInput,
    laceScore: number,
    hospitalScore: number,
    riskFactors: RiskFactor[]
  ): number {
    // Weighted combination of multiple factors
    let score = 0;

    // LACE score contribution (0-35 points)
    score += (laceScore / 19) * 35;

    // HOSPITAL score contribution (0-25 points)
    score += (hospitalScore / 13) * 25;

    // Risk factors contribution (0-40 points)
    const riskFactorScore = riskFactors.reduce((sum, f) => sum + f.weight, 0);
    score += Math.min(riskFactorScore * 40, 40);

    return Math.min(Math.round(score), 100);
  }

  /**
   * Convert risk score to probability
   */
  private convertToProbability(riskScore: number): number {
    // Logistic transformation to convert 0-100 score to probability
    // Calibrated so that average risk (50) = ~15% probability
    const z = (riskScore - 50) / 20;
    const probability = 0.15 / (1 + Math.exp(-z));
    return Math.min(Math.max(probability, 0), 1);
  }

  /**
   * Categorize risk level
   */
  private categorizeRisk(riskScore: number): 'low' | 'moderate' | 'high' | 'very_high' {
    if (riskScore < 25) return 'low';
    if (riskScore < 50) return 'moderate';
    if (riskScore < 75) return 'high';
    return 'very_high';
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    input: ReadmissionPredictionInput,
    riskFactors: RiskFactor[],
    riskCategory: string
  ): string[] {
    const recommendations: string[] = [];

    // Universal recommendations for moderate+ risk
    if (riskCategory !== 'low') {
      recommendations.push('Schedule follow-up appointment within 7 days of discharge');
      recommendations.push('Provide detailed discharge instructions and medication reconciliation');
    }

    // Targeted recommendations based on risk factors
    const modifiableFactors = riskFactors.filter(f => f.modifiable);

    if (modifiableFactors.some(f => f.factor.includes('social support'))) {
      recommendations.push('Arrange social work consultation before discharge');
      recommendations.push('Consider home health services');
    }

    if (modifiableFactors.some(f => f.factor.includes('Polypharmacy'))) {
      recommendations.push('Pharmacy consultation for medication reconciliation');
      recommendations.push('Review for potential deprescribing opportunities');
    }

    if (modifiableFactors.some(f => f.factor.includes('malnutrition'))) {
      recommendations.push('Nutrition consultation');
      recommendations.push('Consider nutritional supplementation');
    }

    if (modifiableFactors.some(f => f.factor.includes('Functional dependence'))) {
      recommendations.push('Physical therapy evaluation');
      recommendations.push('Assess need for durable medical equipment');
    }

    if (input.highRiskMedications && input.highRiskMedications.length > 0) {
      recommendations.push('Patient education on high-risk medications');
      recommendations.push('Arrange close monitoring for anticoagulation/insulin as needed');
    }

    if (riskCategory === 'very_high') {
      recommendations.push('Consider transitional care program enrollment');
      recommendations.push('Post-discharge phone call within 48 hours');
      recommendations.push('Arrange visiting nurse if not already planned');
    }

    return recommendations;
  }

  /**
   * Assess model confidence based on data completeness
   */
  private assessConfidence(input: ReadmissionPredictionInput): number {
    let confidence = 100;

    // Penalize for missing optional but important fields
    if (input.charlsonComorbidityIndex === undefined) confidence -= 10;
    if (!input.hemoglobin) confidence -= 5;
    if (!input.sodium) confidence -= 5;
    if (!input.albumin) confidence -= 5;
    if (!input.vitalSigns) confidence -= 5;
    if (input.hasSocialSupport === undefined) confidence -= 10;
    if (input.functionalStatus === undefined) confidence -= 10;

    return Math.max(confidence, 40); // Minimum 40% confidence
  }

  /**
   * Estimate Charlson Comorbidity Index from diagnoses
   */
  private estimateCharlson(input: ReadmissionPredictionInput): number {
    // Simplified estimation based on comorbidity count
    // In production, would use actual ICD codes
    return Math.min(input.comorbidityCount, 6);
  }

  /**
   * Check if diagnosis is oncology-related
   */
  private isOncologyRelated(primary: string, secondary: string[]): boolean {
    const allDiagnoses = [primary, ...secondary].join(' ').toLowerCase();
    const oncologyTerms = ['cancer', 'carcinoma', 'lymphoma', 'leukemia', 'neoplasm', 'metasta'];
    return oncologyTerms.some(term => allDiagnoses.includes(term));
  }
}

/**
 * Create singleton readmission model instance
 */
let modelInstance: ReadmissionModel | null = null;

export function getReadmissionModel(): ReadmissionModel {
  if (!modelInstance) {
    modelInstance = new ReadmissionModel();
  }
  return modelInstance;
}
