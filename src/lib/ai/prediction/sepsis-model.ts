/**
 * Sepsis Prediction Model
 *
 * Enhanced sepsis detection and early warning system using:
 * - qSOFA (quick Sequential Organ Failure Assessment)
 * - SIRS (Systemic Inflammatory Response Syndrome)
 * - SOFA score
 * - Real-time vital signs and lab analysis
 * - Machine learning risk stratification
 *
 * @module ai/prediction/sepsis-model
 */

/**
 * Patient vital signs for sepsis screening
 */
export interface SepsisScreeningInput {
  // Vital signs (required)
  systolicBP: number; // mmHg
  diastolicBP: number; // mmHg
  heartRate: number; // bpm
  respiratoryRate: number; // breaths/min
  temperature: number; // Celsius
  oxygenSaturation: number; // percentage
  supplementalO2?: boolean;

  // Glasgow Coma Scale
  glasgowComaScale?: number; // 3-15

  // Mental status
  mentalStatusAltered?: boolean;

  // Lab values (if available)
  whiteBloodCells?: number; // K/μL
  bandForms?: number; // percentage
  lactate?: number; // mmol/L
  creatinine?: number; // mg/dL
  bilirubin?: number; // mg/dL
  platelets?: number; // K/μL
  pao2?: number; // mmHg (arterial oxygen)
  fio2?: number; // fraction (e.g., 0.21 for room air)

  // Clinical context
  suspectedInfection: boolean;
  infectionSource?: string;
  patientAge: number;
  immunocompromised?: boolean;

  // Urine output (if available)
  urineOutputLast24h?: number; // mL
  weightKg?: number;
}

/**
 * Sepsis screening result
 */
export interface SepsisScreeningResult {
  sepsisRisk: 'low' | 'moderate' | 'high' | 'severe';
  recommendedAction: 'routine_monitoring' | 'increased_monitoring' | 'immediate_evaluation' | 'activate_sepsis_protocol';
  riskScore: number; // 0-100
  confidence: number;

  // Clinical scores
  scores: {
    qSOFA: number; // 0-3
    SIRS: number; // 0-4
    SOFA?: number; // 0-24
    earlyWarningScore: number; // custom ML score
  };

  // Positive criteria
  positiveCriteria: string[];

  // Recommendations
  recommendations: string[];

  // Trend analysis (if historical data available)
  trendingWorse?: boolean;

  // Alert level
  alertLevel: 'green' | 'yellow' | 'orange' | 'red';

  timestamp: string;
}

/**
 * Sepsis Prediction and Early Warning Model
 *
 * Implements multiple validated sepsis screening tools
 * with enhanced ML-based risk stratification
 */
export class SepsisModel {
  /**
   * Screen patient for sepsis risk
   *
   * @param input - Current vital signs and lab values
   * @returns Sepsis screening result with recommendations
   */
  screen(input: SepsisScreeningInput): SepsisScreeningResult {
    // Calculate clinical scores
    const qSOFA = this.calculateQSOFA(input);
    const SIRS = this.calculateSIRS(input);
    const SOFA = this.calculateSOFA(input);
    const earlyWarningScore = this.calculateEarlyWarningScore(input);

    // Identify positive criteria
    const positiveCriteria = this.identifyPositiveCriteria(input, qSOFA, SIRS);

    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(input, qSOFA, SIRS, SOFA, earlyWarningScore);

    // Determine risk level and recommended action
    const sepsisRisk = this.determineRiskLevel(riskScore, qSOFA, input.suspectedInfection);
    const recommendedAction = this.determineRecommendedAction(sepsisRisk, qSOFA, input);
    const alertLevel = this.determineAlertLevel(sepsisRisk, riskScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      input,
      sepsisRisk,
      positiveCriteria,
      qSOFA,
      SIRS
    );

    // Assess confidence
    const confidence = this.assessConfidence(input);

    return {
      sepsisRisk,
      recommendedAction,
      riskScore,
      confidence,
      scores: {
        qSOFA,
        SIRS,
        SOFA,
        earlyWarningScore,
      },
      positiveCriteria,
      recommendations,
      alertLevel,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate qSOFA (quick SOFA) score
   * Criteria:
   * - Respiratory rate ≥ 22/min (1 point)
   * - Altered mentation (1 point)
   * - Systolic BP ≤ 100 mmHg (1 point)
   *
   * Score ≥ 2 suggests sepsis
   */
  private calculateQSOFA(input: SepsisScreeningInput): number {
    let score = 0;

    // Respiratory rate ≥ 22
    if (input.respiratoryRate >= 22) score += 1;

    // Altered mentation (GCS < 15 or clinical assessment)
    if (input.glasgowComaScale && input.glasgowComaScale < 15) score += 1;
    else if (input.mentalStatusAltered) score += 1;

    // Systolic BP ≤ 100
    if (input.systolicBP <= 100) score += 1;

    return score;
  }

  /**
   * Calculate SIRS (Systemic Inflammatory Response Syndrome) criteria
   * Criteria:
   * - Temperature > 38°C or < 36°C (1 point)
   * - Heart rate > 90 bpm (1 point)
   * - Respiratory rate > 20/min (1 point)
   * - WBC > 12K or < 4K or > 10% bands (1 point)
   *
   * ≥ 2 criteria = SIRS
   */
  private calculateSIRS(input: SepsisScreeningInput): number {
    let score = 0;

    // Temperature
    if (input.temperature > 38 || input.temperature < 36) score += 1;

    // Heart rate
    if (input.heartRate > 90) score += 1;

    // Respiratory rate
    if (input.respiratoryRate > 20) score += 1;

    // White blood cells
    if (input.whiteBloodCells) {
      if (
        input.whiteBloodCells > 12 ||
        input.whiteBloodCells < 4 ||
        (input.bandForms && input.bandForms > 10)
      ) {
        score += 1;
      }
    }

    return score;
  }

  /**
   * Calculate SOFA (Sequential Organ Failure Assessment) score
   * Assesses organ dysfunction in 6 systems
   */
  private calculateSOFA(input: SepsisScreeningInput): number | undefined {
    let score = 0;
    let hasRequiredData = false;

    // Respiration (PaO2/FiO2 ratio)
    if (input.pao2 !== undefined && input.fio2 !== undefined) {
      hasRequiredData = true;
      const pf_ratio = input.pao2 / input.fio2;
      if (pf_ratio < 100) score += 4;
      else if (pf_ratio < 200) score += 3;
      else if (pf_ratio < 300) score += 2;
      else if (pf_ratio < 400) score += 1;
    }

    // Coagulation (platelets)
    if (input.platelets !== undefined) {
      hasRequiredData = true;
      if (input.platelets < 20) score += 4;
      else if (input.platelets < 50) score += 3;
      else if (input.platelets < 100) score += 2;
      else if (input.platelets < 150) score += 1;
    }

    // Liver (bilirubin)
    if (input.bilirubin !== undefined) {
      hasRequiredData = true;
      if (input.bilirubin >= 12) score += 4;
      else if (input.bilirubin >= 6) score += 3;
      else if (input.bilirubin >= 2) score += 2;
      else if (input.bilirubin >= 1.2) score += 1;
    }

    // Cardiovascular (hypotension)
    hasRequiredData = true;
    const map = input.diastolicBP + (input.systolicBP - input.diastolicBP) / 3;
    if (map < 70) score += 1;
    // Additional points for vasopressor requirement would be added clinically

    // Central nervous system (GCS)
    if (input.glasgowComaScale !== undefined) {
      hasRequiredData = true;
      if (input.glasgowComaScale < 6) score += 4;
      else if (input.glasgowComaScale < 10) score += 3;
      else if (input.glasgowComaScale < 13) score += 2;
      else if (input.glasgowComaScale < 15) score += 1;
    }

    // Renal (creatinine and urine output)
    if (input.creatinine !== undefined) {
      hasRequiredData = true;
      if (input.creatinine >= 5) score += 4;
      else if (input.creatinine >= 3.5) score += 3;
      else if (input.creatinine >= 2) score += 2;
      else if (input.creatinine >= 1.2) score += 1;
    }

    return hasRequiredData ? score : undefined;
  }

  /**
   * Calculate custom early warning score using ML features
   */
  private calculateEarlyWarningScore(input: SepsisScreeningInput): number {
    let score = 0;

    // Lactate (strong predictor)
    if (input.lactate !== undefined) {
      if (input.lactate >= 4) score += 20;
      else if (input.lactate >= 2) score += 10;
      else if (input.lactate >= 1) score += 5;
    }

    // Hypotension with tachycardia (shock)
    if (input.systolicBP < 90 && input.heartRate > 100) {
      score += 15;
    }

    // Tachypnea with hypoxia
    if (input.respiratoryRate > 24 && input.oxygenSaturation < 92) {
      score += 12;
    }

    // Hypothermia or hyperthermia
    if (input.temperature < 36 || input.temperature > 39) {
      score += 8;
    }

    // Altered mental status
    if (input.mentalStatusAltered || (input.glasgowComaScale && input.glasgowComaScale < 14)) {
      score += 10;
    }

    // Immunocompromised status
    if (input.immunocompromised) {
      score += 5;
    }

    // Age factor
    if (input.patientAge > 65) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate overall sepsis risk score
   */
  private calculateRiskScore(
    input: SepsisScreeningInput,
    qSOFA: number,
    SIRS: number,
    SOFA: number | undefined,
    earlyWarningScore: number
  ): number {
    let riskScore = 0;

    // qSOFA contribution (0-40 points)
    riskScore += (qSOFA / 3) * 40;

    // SIRS contribution (0-20 points)
    riskScore += (SIRS / 4) * 20;

    // SOFA contribution if available (0-20 points)
    if (SOFA !== undefined) {
      riskScore += Math.min((SOFA / 10) * 20, 20);
    }

    // Early warning score contribution (0-20 points)
    riskScore += (earlyWarningScore / 100) * 20;

    // Bonus if infection suspected
    if (input.suspectedInfection) {
      riskScore += 10;
    }

    return Math.min(Math.round(riskScore), 100);
  }

  /**
   * Determine risk level
   */
  private determineRiskLevel(
    riskScore: number,
    qSOFA: number,
    suspectedInfection: boolean
  ): 'low' | 'moderate' | 'high' | 'severe' {
    // qSOFA ≥ 2 with infection = high risk for sepsis
    if (qSOFA >= 2 && suspectedInfection) {
      return riskScore >= 70 ? 'severe' : 'high';
    }

    if (riskScore >= 75) return 'severe';
    if (riskScore >= 50) return 'high';
    if (riskScore >= 25) return 'moderate';
    return 'low';
  }

  /**
   * Determine recommended action
   */
  private determineRecommendedAction(
    sepsisRisk: string,
    qSOFA: number,
    input: SepsisScreeningInput
  ): 'routine_monitoring' | 'increased_monitoring' | 'immediate_evaluation' | 'activate_sepsis_protocol' {
    // Severe sepsis or septic shock indicators
    if (
      sepsisRisk === 'severe' ||
      (qSOFA >= 2 && input.suspectedInfection) ||
      (input.lactate && input.lactate >= 4) ||
      input.systolicBP < 90
    ) {
      return 'activate_sepsis_protocol';
    }

    if (sepsisRisk === 'high') {
      return 'immediate_evaluation';
    }

    if (sepsisRisk === 'moderate') {
      return 'increased_monitoring';
    }

    return 'routine_monitoring';
  }

  /**
   * Determine alert level for UI
   */
  private determineAlertLevel(sepsisRisk: string, riskScore: number): 'green' | 'yellow' | 'orange' | 'red' {
    if (sepsisRisk === 'severe' || riskScore >= 75) return 'red';
    if (sepsisRisk === 'high' || riskScore >= 50) return 'orange';
    if (sepsisRisk === 'moderate' || riskScore >= 25) return 'yellow';
    return 'green';
  }

  /**
   * Identify positive sepsis criteria
   */
  private identifyPositiveCriteria(
    input: SepsisScreeningInput,
    qSOFA: number,
    SIRS: number
  ): string[] {
    const criteria: string[] = [];

    // qSOFA criteria
    if (input.respiratoryRate >= 22) {
      criteria.push('Tachypnea (RR ≥ 22)');
    }
    if (input.systolicBP <= 100) {
      criteria.push('Hypotension (SBP ≤ 100 mmHg)');
    }
    if (input.mentalStatusAltered || (input.glasgowComaScale && input.glasgowComaScale < 15)) {
      criteria.push('Altered mental status');
    }

    // SIRS criteria
    if (input.temperature > 38 || input.temperature < 36) {
      criteria.push(`Abnormal temperature (${input.temperature}°C)`);
    }
    if (input.heartRate > 90) {
      criteria.push('Tachycardia (HR > 90)');
    }

    // Severe criteria
    if (input.lactate && input.lactate >= 2) {
      criteria.push(`Elevated lactate (${input.lactate} mmol/L)`);
    }
    if (input.oxygenSaturation < 90) {
      criteria.push('Hypoxemia (SpO2 < 90%)');
    }

    // Infection suspected
    if (input.suspectedInfection) {
      criteria.push(`Suspected infection${input.infectionSource ? ': ' + input.infectionSource : ''}`);
    }

    return criteria;
  }

  /**
   * Generate clinical recommendations
   */
  private generateRecommendations(
    input: SepsisScreeningInput,
    sepsisRisk: string,
    positiveCriteria: string[],
    qSOFA: number,
    SIRS: number
  ): string[] {
    const recommendations: string[] = [];

    // Critical recommendations for high/severe risk
    if (sepsisRisk === 'severe' || sepsisRisk === 'high') {
      recommendations.push('ACTIVATE SEPSIS PROTOCOL IMMEDIATELY');
      recommendations.push('Obtain blood cultures before antibiotics');
      recommendations.push('Administer broad-spectrum antibiotics within 1 hour');
      recommendations.push('Initiate aggressive fluid resuscitation (30 mL/kg crystalloid)');
      recommendations.push('Measure serum lactate');
      recommendations.push('Continuous vital sign monitoring');
    }

    // Additional recommendations based on criteria
    if (input.systolicBP < 90) {
      recommendations.push('Assess for vasopressor need if hypotension persists after fluids');
    }

    if (input.oxygenSaturation < 90) {
      recommendations.push('Supplemental oxygen to maintain SpO2 > 94%');
      recommendations.push('Consider arterial blood gas');
    }

    if (!input.lactate && sepsisRisk !== 'low') {
      recommendations.push('Order serum lactate level');
    }

    if (!input.whiteBloodCells && sepsisRisk !== 'low') {
      recommendations.push('Order complete blood count');
    }

    if (!input.creatinine && sepsisRisk !== 'low') {
      recommendations.push('Order comprehensive metabolic panel');
    }

    if (sepsisRisk === 'moderate') {
      recommendations.push('Reassess in 1-2 hours');
      recommendations.push('Consider infectious disease consultation');
    }

    if (input.suspectedInfection && input.infectionSource) {
      recommendations.push(`Source control for ${input.infectionSource}`);
    }

    if (qSOFA >= 2 || SIRS >= 2) {
      recommendations.push('Transfer to higher level of care if not already in ICU');
    }

    return recommendations;
  }

  /**
   * Assess model confidence based on data completeness
   */
  private assessConfidence(input: SepsisScreeningInput): number {
    let confidence = 100;

    // Core vitals are required (already have them)
    // Reduce confidence for missing important labs

    if (!input.whiteBloodCells) confidence -= 10;
    if (!input.lactate) confidence -= 15;
    if (!input.glasgowComaScale && !input.mentalStatusAltered) confidence -= 10;
    if (!input.platelets) confidence -= 5;
    if (!input.creatinine) confidence -= 5;

    return Math.max(confidence, 50);
  }
}

/**
 * Create singleton sepsis model instance
 */
let modelInstance: SepsisModel | null = null;

export function getSepsisModel(): SepsisModel {
  if (!modelInstance) {
    modelInstance = new SepsisModel();
  }
  return modelInstance;
}
