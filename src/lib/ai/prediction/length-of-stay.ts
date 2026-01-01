/**
 * Length of Stay (LOS) Prediction Model
 *
 * Predicts expected hospital length of stay for:
 * - Resource planning
 * - Capacity management
 * - Discharge planning
 * - Care coordination
 *
 * @module ai/prediction/length-of-stay
 */

/**
 * Admission data for LOS prediction
 */
export interface LOSPredictionInput {
  // Patient demographics
  age: number;
  gender: 'male' | 'female' | 'other';

  // Admission details
  admissionType: 'elective' | 'urgent' | 'emergency';
  admissionSource: 'emergency_room' | 'transfer' | 'direct' | 'physician_referral';
  admissionDayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

  // Clinical
  primaryDiagnosis: string;
  diagnosisCategory?: string; // ICD-10 chapter
  procedurePlanned?: string;
  procedureCategory?: string;
  comorbidityCount: number;
  charlsonComorbidityIndex?: number;

  // Vital signs at admission
  vitalSigns?: {
    systolicBP: number;
    heartRate: number;
    respiratoryRate: number;
    temperature: number;
    oxygenSaturation: number;
  };

  // Lab values at admission
  labValues?: {
    hemoglobin?: number;
    whiteBloodCells?: number;
    platelets?: number;
    sodium?: number;
    potassium?: number;
    creatinine?: number;
    glucose?: number;
    albumin?: number;
  };

  // Patient history
  previousAdmissionsLast6Months: number;
  averagePreviousLOS?: number; // days

  // Social factors
  hasHomeHealthCare?: boolean;
  hasSocialSupport?: boolean;
  insuranceType?: 'medicare' | 'medicaid' | 'private' | 'uninsured';

  // Functional status
  functionalStatus?: 'independent' | 'partially_dependent' | 'fully_dependent';
  mobilityStatus?: 'ambulatory' | 'wheelchair' | 'bedbound';
}

/**
 * LOS prediction result
 */
export interface LOSPredictionResult {
  predictedLOS: number; // days
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  category: 'short' | 'average' | 'long' | 'extended';
  riskFactors: LOSRiskFactor[];
  recommendations: string[];
  benchmarkLOS?: number; // typical LOS for this diagnosis
  confidence: number;
  modelVersion: string;
}

/**
 * LOS risk factor
 */
export interface LOSRiskFactor {
  factor: string;
  impact: number; // days added/subtracted
  category: 'patient' | 'clinical' | 'social' | 'procedural';
}

/**
 * Length of Stay Prediction Model
 *
 * Uses regression model with clinical and social factors
 */
export class LengthOfStayModel {
  private readonly modelVersion = '1.0.0';

  // Benchmark LOS by diagnosis category (in days)
  private readonly benchmarkLOS: Record<string, number> = {
    cardiovascular: 4.2,
    respiratory: 5.1,
    gastrointestinal: 4.8,
    neurological: 6.3,
    orthopedic: 4.5,
    surgical: 5.7,
    oncology: 7.2,
    infectious: 6.8,
    renal: 5.9,
    endocrine: 4.3,
    default: 5.0,
  };

  /**
   * Predict length of stay
   *
   * @param input - Admission data
   * @returns LOS prediction with recommendations
   */
  predict(input: LOSPredictionInput): LOSPredictionResult {
    // Get baseline LOS for diagnosis
    const baselineLOS = this.getBaselineLOS(input);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(input);

    // Calculate adjustments
    const totalAdjustment = riskFactors.reduce((sum, rf) => sum + rf.impact, 0);

    // Predicted LOS
    const predictedLOS = Math.max(1, Math.round((baselineLOS + totalAdjustment) * 10) / 10);

    // Confidence interval (±20%)
    const confidenceInterval = {
      lower: Math.max(1, Math.round(predictedLOS * 0.8 * 10) / 10),
      upper: Math.round(predictedLOS * 1.2 * 10) / 10,
    };

    // Categorize LOS
    const category = this.categorizeLOS(predictedLOS, baselineLOS);

    // Generate recommendations
    const recommendations = this.generateRecommendations(input, riskFactors, category);

    // Assess confidence
    const confidence = this.assessConfidence(input);

    return {
      predictedLOS,
      confidenceInterval,
      category,
      riskFactors: riskFactors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
      recommendations,
      benchmarkLOS: baselineLOS,
      confidence,
      modelVersion: this.modelVersion,
    };
  }

  /**
   * Get baseline LOS for diagnosis
   */
  private getBaselineLOS(input: LOSPredictionInput): number {
    const category = (input.diagnosisCategory || 'default').toLowerCase();
    const baseline = this.benchmarkLOS[category] || this.benchmarkLOS.default;

    // Adjust for planned procedure
    if (input.procedurePlanned) {
      return baseline * 1.3; // Procedures typically extend LOS
    }

    return baseline;
  }

  /**
   * Identify factors that affect LOS
   */
  private identifyRiskFactors(input: LOSPredictionInput): LOSRiskFactor[] {
    const factors: LOSRiskFactor[] = [];

    // AGE FACTORS
    if (input.age > 80) {
      factors.push({
        factor: 'Age > 80 years',
        impact: 1.5,
        category: 'patient',
      });
    } else if (input.age > 65) {
      factors.push({
        factor: 'Age 65-80 years',
        impact: 0.8,
        category: 'patient',
      });
    }

    // ADMISSION TYPE
    if (input.admissionType === 'emergency') {
      factors.push({
        factor: 'Emergency admission',
        impact: 1.2,
        category: 'clinical',
      });
    } else if (input.admissionType === 'elective') {
      factors.push({
        factor: 'Elective admission',
        impact: -0.8,
        category: 'clinical',
      });
    }

    // ADMISSION SOURCE
    if (input.admissionSource === 'transfer') {
      factors.push({
        factor: 'Transfer from another facility',
        impact: 1.8,
        category: 'clinical',
      });
    }

    // WEEKEND ADMISSION
    if (input.admissionDayOfWeek === 'saturday' || input.admissionDayOfWeek === 'sunday') {
      factors.push({
        factor: 'Weekend admission',
        impact: 0.5,
        category: 'clinical',
      });
    }

    // COMORBIDITIES
    if (input.comorbidityCount >= 5) {
      factors.push({
        factor: 'Multiple comorbidities (≥5)',
        impact: 2.0,
        category: 'clinical',
      });
    } else if (input.comorbidityCount >= 3) {
      factors.push({
        factor: 'Multiple comorbidities (3-4)',
        impact: 1.0,
        category: 'clinical',
      });
    }

    // CHARLSON INDEX
    if (input.charlsonComorbidityIndex) {
      if (input.charlsonComorbidityIndex >= 5) {
        factors.push({
          factor: 'High Charlson score (≥5)',
          impact: 1.5,
          category: 'clinical',
        });
      }
    }

    // ABNORMAL VITAL SIGNS
    if (input.vitalSigns) {
      if (input.vitalSigns.systolicBP < 90 || input.vitalSigns.systolicBP > 180) {
        factors.push({
          factor: 'Abnormal blood pressure',
          impact: 0.7,
          category: 'clinical',
        });
      }
      if (input.vitalSigns.heartRate > 100 || input.vitalSigns.heartRate < 50) {
        factors.push({
          factor: 'Abnormal heart rate',
          impact: 0.5,
          category: 'clinical',
        });
      }
      if (input.vitalSigns.oxygenSaturation < 92) {
        factors.push({
          factor: 'Hypoxemia',
          impact: 1.2,
          category: 'clinical',
        });
      }
    }

    // ABNORMAL LABS
    if (input.labValues) {
      if (input.labValues.hemoglobin && input.labValues.hemoglobin < 10) {
        factors.push({
          factor: 'Anemia',
          impact: 0.8,
          category: 'clinical',
        });
      }
      if (input.labValues.creatinine && input.labValues.creatinine > 1.5) {
        factors.push({
          factor: 'Renal impairment',
          impact: 1.0,
          category: 'clinical',
        });
      }
      if (input.labValues.albumin && input.labValues.albumin < 3.0) {
        factors.push({
          factor: 'Hypoalbuminemia (malnutrition)',
          impact: 1.5,
          category: 'clinical',
        });
      }
      if (input.labValues.sodium && (input.labValues.sodium < 130 || input.labValues.sodium > 150)) {
        factors.push({
          factor: 'Electrolyte imbalance',
          impact: 0.6,
          category: 'clinical',
        });
      }
    }

    // PREVIOUS ADMISSIONS
    if (input.previousAdmissionsLast6Months > 2) {
      factors.push({
        factor: 'Frequent readmissions',
        impact: 1.3,
        category: 'patient',
      });
    }

    if (input.averagePreviousLOS && input.averagePreviousLOS > 7) {
      factors.push({
        factor: 'History of long hospital stays',
        impact: 1.0,
        category: 'patient',
      });
    }

    // SOCIAL FACTORS
    if (input.hasSocialSupport === false) {
      factors.push({
        factor: 'Limited social support',
        impact: 1.2,
        category: 'social',
      });
    }

    if (input.insuranceType === 'uninsured' || input.insuranceType === 'medicaid') {
      factors.push({
        factor: 'Insurance/financial barriers',
        impact: 0.7,
        category: 'social',
      });
    }

    // FUNCTIONAL STATUS
    if (input.functionalStatus === 'fully_dependent') {
      factors.push({
        factor: 'Fully dependent functional status',
        impact: 2.0,
        category: 'patient',
      });
    } else if (input.functionalStatus === 'partially_dependent') {
      factors.push({
        factor: 'Partially dependent functional status',
        impact: 1.0,
        category: 'patient',
      });
    }

    if (input.mobilityStatus === 'bedbound') {
      factors.push({
        factor: 'Bedbound',
        impact: 1.5,
        category: 'patient',
      });
    } else if (input.mobilityStatus === 'wheelchair') {
      factors.push({
        factor: 'Wheelchair-bound',
        impact: 0.8,
        category: 'patient',
      });
    }

    // PLANNED PROCEDURE
    if (input.procedurePlanned) {
      const category = (input.procedureCategory || '').toLowerCase();
      if (category.includes('cardiac') || category.includes('cardiovascular')) {
        factors.push({
          factor: 'Major cardiac procedure',
          impact: 2.5,
          category: 'procedural',
        });
      } else if (category.includes('orthopedic')) {
        factors.push({
          factor: 'Orthopedic procedure',
          impact: 1.8,
          category: 'procedural',
        });
      } else if (category.includes('neurosurgical')) {
        factors.push({
          factor: 'Neurosurgical procedure',
          impact: 3.0,
          category: 'procedural',
        });
      } else {
        factors.push({
          factor: 'Surgical procedure planned',
          impact: 1.5,
          category: 'procedural',
        });
      }
    }

    // PROTECTIVE FACTORS
    if (input.hasHomeHealthCare) {
      factors.push({
        factor: 'Home health care arranged',
        impact: -0.5,
        category: 'social',
      });
    }

    if (input.functionalStatus === 'independent' && input.age < 65) {
      factors.push({
        factor: 'Young and independent',
        impact: -0.8,
        category: 'patient',
      });
    }

    return factors;
  }

  /**
   * Categorize predicted LOS
   */
  private categorizeLOS(predictedLOS: number, benchmarkLOS: number): 'short' | 'average' | 'long' | 'extended' {
    const ratio = predictedLOS / benchmarkLOS;

    if (ratio < 0.7) return 'short';
    if (ratio < 1.3) return 'average';
    if (ratio < 1.8) return 'long';
    return 'extended';
  }

  /**
   * Generate recommendations for care planning
   */
  private generateRecommendations(
    input: LOSPredictionInput,
    riskFactors: LOSRiskFactor[],
    category: string
  ): string[] {
    const recommendations: string[] = [];

    // For extended/long stays
    if (category === 'extended' || category === 'long') {
      recommendations.push('Initiate early discharge planning');
      recommendations.push('Schedule multidisciplinary care conference');
      recommendations.push('Assess need for post-acute care services');
    }

    // Address specific risk factors
    const socialFactors = riskFactors.filter(rf => rf.category === 'social');
    if (socialFactors.length > 0) {
      recommendations.push('Social work consultation for discharge planning');
      if (!input.hasHomeHealthCare) {
        recommendations.push('Evaluate need for home health services');
      }
    }

    const functionalFactors = riskFactors.filter(
      rf => rf.factor.toLowerCase().includes('dependent') || rf.factor.toLowerCase().includes('mobility')
    );
    if (functionalFactors.length > 0) {
      recommendations.push('Physical therapy evaluation and daily treatments');
      recommendations.push('Occupational therapy for ADL training');
      recommendations.push('Assess need for durable medical equipment');
    }

    // Nutritional issues
    if (riskFactors.some(rf => rf.factor.includes('malnutrition') || rf.factor.includes('albumin'))) {
      recommendations.push('Nutrition consultation');
      recommendations.push('Monitor nutritional intake and consider supplementation');
    }

    // Multiple comorbidities
    if (input.comorbidityCount >= 3) {
      recommendations.push('Comprehensive medication reconciliation');
      recommendations.push('Coordinate with specialists as needed');
    }

    // Planned procedures
    if (input.procedurePlanned) {
      recommendations.push('Pre-operative optimization');
      recommendations.push('Post-operative care pathway implementation');
    }

    // General recommendations for longer stays
    if (category !== 'short') {
      recommendations.push('Daily assessment of barriers to discharge');
      recommendations.push('Set realistic discharge date goal with team');
    }

    return recommendations;
  }

  /**
   * Assess prediction confidence
   */
  private assessConfidence(input: LOSPredictionInput): number {
    let confidence = 100;

    // Missing diagnosis category
    if (!input.diagnosisCategory) confidence -= 15;

    // Missing comorbidity score
    if (input.charlsonComorbidityIndex === undefined) confidence -= 10;

    // Missing vital signs
    if (!input.vitalSigns) confidence -= 10;

    // Missing labs
    if (!input.labValues) confidence -= 10;

    // Missing social history
    if (input.hasSocialSupport === undefined) confidence -= 8;
    if (input.hasHomeHealthCare === undefined) confidence -= 7;

    // Missing functional status
    if (!input.functionalStatus) confidence -= 10;
    if (!input.mobilityStatus) confidence -= 5;

    // No historical data
    if (!input.averagePreviousLOS && input.previousAdmissionsLast6Months > 0) {
      confidence -= 10;
    }

    return Math.max(confidence, 40);
  }
}

/**
 * Create singleton LOS model instance
 */
let modelInstance: LengthOfStayModel | null = null;

export function getLOSModel(): LengthOfStayModel {
  if (!modelInstance) {
    modelInstance = new LengthOfStayModel();
  }
  return modelInstance;
}
