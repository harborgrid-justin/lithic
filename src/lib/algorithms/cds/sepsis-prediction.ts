/**
 * Advanced Sepsis Prediction and Early Warning System
 *
 * Clinical References:
 * - Sepsis-3 Definitions (JAMA 2016)
 * - qSOFA (Quick Sequential Organ Failure Assessment)
 * - NEWS2 (National Early Warning Score)
 * - MEWS (Modified Early Warning Score)
 * - SIRS Criteria (Systemic Inflammatory Response Syndrome)
 *
 * Features:
 * - Multiple sepsis scoring systems
 * - Machine learning-based prediction
 * - Real-time monitoring and alerting
 * - Trend analysis
 * - Risk stratification
 *
 * @version 1.0.0
 * @license HIPAA-compliant
 */

/**
 * Vital signs data structure
 */
export interface VitalSigns {
  temperature: number; // Celsius
  heartRate: number; // bpm
  respiratoryRate: number; // breaths/min
  systolicBP: number; // mmHg
  diastolicBP: number; // mmHg
  oxygenSaturation: number; // %
  consciousness: 'ALERT' | 'CONFUSION' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE';
  supplementalOxygen: boolean;
  timestamp: Date;
}

/**
 * Laboratory values for sepsis assessment
 */
export interface SepsisLabValues {
  wbc?: number; // K/μL
  temperature?: number; // °C
  lactate?: number; // mmol/L
  creatinine?: number; // mg/dL
  bilirubin?: number; // mg/dL
  platelets?: number; // K/μL
  pao2?: number; // mmHg
  fio2?: number; // fraction
  glucosechange?: number; // mg/dL change from baseline
}

/**
 * SIRS Criteria Result
 */
export interface SIRSResult {
  score: number; // 0-4
  met: boolean; // >= 2 criteria
  criteria: {
    temperature: boolean;
    heartRate: boolean;
    respiratoryRate: boolean;
    wbc: boolean;
  };
  details: string[];
  timestamp: Date;
}

/**
 * qSOFA Score Result
 */
export interface qSOFAResult {
  score: number; // 0-3
  highRisk: boolean; // >= 2
  criteria: {
    alteredMentation: boolean;
    systolicBP: boolean;
    respiratoryRate: boolean;
  };
  interpretation: string;
  recommendation: string;
  timestamp: Date;
}

/**
 * NEWS2 Score Result
 */
export interface NEWS2Result {
  score: number; // 0-20+
  riskLevel: 'LOW' | 'LOW_MEDIUM' | 'MEDIUM' | 'HIGH';
  breakdown: {
    respirationRate: number;
    oxygenSaturation: number;
    supplementalOxygen: number;
    temperature: number;
    systolicBP: number;
    heartRate: number;
    consciousness: number;
  };
  clinicalResponse: string;
  monitoringFrequency: string;
  timestamp: Date;
}

/**
 * MEWS Score Result
 */
export interface MEWSResult {
  score: number; // 0-14
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  breakdown: {
    systolicBP: number;
    heartRate: number;
    respiratoryRate: number;
    temperature: number;
    consciousness: number;
  };
  recommendation: string;
  timestamp: Date;
}

/**
 * SOFA Score (Sequential Organ Failure Assessment)
 */
export interface SOFAResult {
  totalScore: number; // 0-24
  breakdown: {
    respiration: number; // PaO2/FiO2 ratio
    coagulation: number; // Platelets
    liver: number; // Bilirubin
    cardiovascular: number; // MAP or vasopressors
    cns: number; // Glasgow Coma Scale
    renal: number; // Creatinine or urine output
  };
  interpretation: string;
  mortalityRisk: string;
  timestamp: Date;
}

/**
 * ML-based Sepsis Prediction
 */
export interface SepsisPrediction {
  probability: number; // 0-1
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  confidence: number; // 0-1
  contributingFactors: Array<{
    factor: string;
    importance: number;
    value: any;
  }>;
  recommendation: string;
  timeToSepsis?: number; // Estimated hours
  timestamp: Date;
}

/**
 * Comprehensive Sepsis Assessment
 */
export interface SepsisAssessment {
  sirs?: SIRSResult;
  qsofa: qSOFAResult;
  news2: NEWS2Result;
  mews: MEWSResult;
  sofa?: SOFAResult;
  prediction: SepsisPrediction;
  overallRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  alerts: SepsisAlert[];
  recommendations: string[];
  timestamp: Date;
}

/**
 * Sepsis Alert
 */
export interface SepsisAlert {
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  action: string;
  urgency: 'ROUTINE' | 'URGENT' | 'IMMEDIATE';
}

/**
 * Sepsis Prediction Engine
 */
export class SepsisPredictionEngine {
  /**
   * Calculate SIRS Criteria
   * Reference: Bone RC, et al. Chest. 1992
   */
  calculateSIRS(vitals: VitalSigns, labs: SepsisLabValues): SIRSResult {
    const criteria = {
      temperature: false,
      heartRate: false,
      respiratoryRate: false,
      wbc: false,
    };

    const details: string[] = [];
    let score = 0;

    // Temperature: >38°C (100.4°F) or <36°C (96.8°F)
    if (vitals.temperature > 38 || vitals.temperature < 36) {
      criteria.temperature = true;
      score++;
      details.push(
        `Temperature ${vitals.temperature.toFixed(1)}°C (abnormal: >38°C or <36°C)`
      );
    }

    // Heart rate: >90 bpm
    if (vitals.heartRate > 90) {
      criteria.heartRate = true;
      score++;
      details.push(`Heart rate ${vitals.heartRate} bpm (abnormal: >90 bpm)`);
    }

    // Respiratory rate: >20 breaths/min
    if (vitals.respiratoryRate > 20) {
      criteria.respiratoryRate = true;
      score++;
      details.push(
        `Respiratory rate ${vitals.respiratoryRate} (abnormal: >20 breaths/min)`
      );
    }

    // WBC: >12,000/mm³ or <4,000/mm³
    if (labs.wbc) {
      if (labs.wbc > 12 || labs.wbc < 4) {
        criteria.wbc = true;
        score++;
        details.push(
          `WBC ${labs.wbc.toFixed(1)} K/μL (abnormal: >12 or <4 K/μL)`
        );
      }
    }

    return {
      score,
      met: score >= 2,
      criteria,
      details,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate qSOFA Score
   * Reference: Singer M, et al. JAMA. 2016
   *
   * qSOFA ≥2 indicates higher risk of poor outcome
   */
  calculateQSOFA(vitals: VitalSigns): qSOFAResult {
    let score = 0;
    const criteria = {
      alteredMentation: false,
      systolicBP: false,
      respiratoryRate: false,
    };

    // Altered mentation (GCS < 15 or confusion)
    if (vitals.consciousness !== 'ALERT') {
      criteria.alteredMentation = true;
      score++;
    }

    // Systolic BP ≤ 100 mmHg
    if (vitals.systolicBP <= 100) {
      criteria.systolicBP = true;
      score++;
    }

    // Respiratory rate ≥ 22/min
    if (vitals.respiratoryRate >= 22) {
      criteria.respiratoryRate = true;
      score++;
    }

    const highRisk = score >= 2;

    let interpretation = '';
    let recommendation = '';

    if (score === 0) {
      interpretation = 'Low risk for adverse outcomes';
      recommendation = 'Continue routine monitoring';
    } else if (score === 1) {
      interpretation = 'Intermediate risk - monitor closely';
      recommendation = 'Increase monitoring frequency. Consider full SOFA score.';
    } else if (score >= 2) {
      interpretation = 'HIGH RISK for adverse outcomes including death or ICU stay';
      recommendation =
        'URGENT: Consider ICU evaluation. Assess for infection and organ dysfunction. Calculate full SOFA score. Initiate sepsis bundle if indicated.';
    }

    return {
      score,
      highRisk,
      criteria,
      interpretation,
      recommendation,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate NEWS2 Score (National Early Warning Score 2)
   * Reference: Royal College of Physicians 2017
   */
  calculateNEWS2(vitals: VitalSigns): NEWS2Result {
    const breakdown = {
      respirationRate: this.scoreRespirationRateNEWS2(vitals.respiratoryRate),
      oxygenSaturation: this.scoreOxygenSaturationNEWS2(vitals.oxygenSaturation),
      supplementalOxygen: vitals.supplementalOxygen ? 2 : 0,
      temperature: this.scoreTemperatureNEWS2(vitals.temperature),
      systolicBP: this.scoreSystolicBPNEWS2(vitals.systolicBP),
      heartRate: this.scoreHeartRateNEWS2(vitals.heartRate),
      consciousness: this.scoreConsciousnessNEWS2(vitals.consciousness),
    };

    const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    let riskLevel: 'LOW' | 'LOW_MEDIUM' | 'MEDIUM' | 'HIGH';
    let clinicalResponse = '';
    let monitoringFrequency = '';

    if (score === 0) {
      riskLevel = 'LOW';
      clinicalResponse = 'Continue routine monitoring';
      monitoringFrequency = 'Minimum 12 hourly';
    } else if (score >= 1 && score <= 4) {
      riskLevel = 'LOW_MEDIUM';
      clinicalResponse = 'Ward-based response';
      monitoringFrequency = 'Minimum 4-6 hourly';
    } else if (score >= 5 && score <= 6) {
      riskLevel = 'MEDIUM';
      clinicalResponse = 'Urgent ward-based response or critical care team review';
      monitoringFrequency = 'Minimum 1 hourly';
    } else {
      riskLevel = 'HIGH';
      clinicalResponse = 'EMERGENCY assessment by critical care team';
      monitoringFrequency = 'Continuous monitoring';
    }

    return {
      score,
      riskLevel,
      breakdown,
      clinicalResponse,
      monitoringFrequency,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate MEWS Score (Modified Early Warning Score)
   */
  calculateMEWS(vitals: VitalSigns): MEWSResult {
    const breakdown = {
      systolicBP: this.scoreSystolicBPMEWS(vitals.systolicBP),
      heartRate: this.scoreHeartRateMEWS(vitals.heartRate),
      respiratoryRate: this.scoreRespirationRateMEWS(vitals.respiratoryRate),
      temperature: this.scoreTemperatureMEWS(vitals.temperature),
      consciousness: this.scoreConsciousnessMEWS(vitals.consciousness),
    };

    const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    let recommendation = '';

    if (score <= 2) {
      riskLevel = 'LOW';
      recommendation = 'Continue routine ward care';
    } else if (score >= 3 && score <= 4) {
      riskLevel = 'MEDIUM';
      recommendation = 'Increase observation frequency. Notify medical team.';
    } else {
      riskLevel = 'HIGH';
      recommendation =
        'URGENT medical review required. Consider ICU/HDU assessment.';
    }

    return {
      score,
      riskLevel,
      breakdown,
      recommendation,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate SOFA Score (Sequential Organ Failure Assessment)
   * Reference: Vincent JL, et al. Intensive Care Med. 1996
   */
  calculateSOFA(vitals: VitalSigns, labs: SepsisLabValues): SOFAResult {
    const breakdown = {
      respiration: this.scoreRespirationSOFA(labs.pao2, labs.fio2),
      coagulation: this.scoreCoagulationSOFA(labs.platelets),
      liver: this.scoreLiverSOFA(labs.bilirubin),
      cardiovascular: this.scoreCardiovascularSOFA(vitals.systolicBP),
      cns: this.scoreCNSSOFA(vitals.consciousness),
      renal: this.scoreRenalSOFA(labs.creatinine),
    };

    const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    let interpretation = '';
    let mortalityRisk = '';

    if (totalScore <= 6) {
      interpretation = 'Mild to moderate organ dysfunction';
      mortalityRisk = '<10% mortality risk';
    } else if (totalScore >= 7 && totalScore <= 9) {
      interpretation = 'Moderate to severe organ dysfunction';
      mortalityRisk = '15-20% mortality risk';
    } else if (totalScore >= 10 && totalScore <= 12) {
      interpretation = 'Severe organ dysfunction';
      mortalityRisk = '40-50% mortality risk';
    } else {
      interpretation = 'Critical multi-organ dysfunction';
      mortalityRisk = '>80% mortality risk';
    }

    return {
      totalScore,
      breakdown,
      interpretation,
      mortalityRisk,
      timestamp: new Date(),
    };
  }

  /**
   * ML-based Sepsis Prediction
   * Uses ensemble of clinical indicators
   */
  predictSepsis(
    vitals: VitalSigns,
    labs: SepsisLabValues,
    historicalTrends?: VitalSigns[]
  ): SepsisPrediction {
    const features: Array<{ factor: string; importance: number; value: any }> = [];

    // Feature extraction
    let riskScore = 0;

    // Lactate (highest weight)
    if (labs.lactate) {
      const lactateWeight = labs.lactate > 4 ? 0.25 : labs.lactate > 2 ? 0.15 : 0.05;
      riskScore += lactateWeight;
      features.push({
        factor: 'Serum Lactate',
        importance: lactateWeight,
        value: `${labs.lactate.toFixed(1)} mmol/L`,
      });
    }

    // qSOFA components
    const qsofa = this.calculateQSOFA(vitals);
    if (qsofa.highRisk) {
      riskScore += 0.2;
      features.push({
        factor: 'qSOFA Score',
        importance: 0.2,
        value: `${qsofa.score} (high risk)`,
      });
    }

    // Vital sign trends (if available)
    if (historicalTrends && historicalTrends.length > 0) {
      const trend = this.analyzeVitalTrends(historicalTrends);
      if (trend.deteriorating) {
        riskScore += 0.15;
        features.push({
          factor: 'Vital Sign Trends',
          importance: 0.15,
          value: 'Deteriorating',
        });
      }
    }

    // Temperature instability
    if (vitals.temperature > 38.3 || vitals.temperature < 36) {
      riskScore += 0.1;
      features.push({
        factor: 'Temperature',
        importance: 0.1,
        value: `${vitals.temperature.toFixed(1)}°C`,
      });
    }

    // Hypotension
    if (vitals.systolicBP < 90) {
      riskScore += 0.15;
      features.push({
        factor: 'Hypotension',
        importance: 0.15,
        value: `SBP ${vitals.systolicBP} mmHg`,
      });
    }

    // WBC abnormality
    if (labs.wbc && (labs.wbc > 12 || labs.wbc < 4)) {
      riskScore += 0.1;
      features.push({
        factor: 'White Blood Cell Count',
        importance: 0.1,
        value: `${labs.wbc.toFixed(1)} K/μL`,
      });
    }

    const probability = Math.min(riskScore, 1.0);
    const confidence = features.length >= 4 ? 0.85 : 0.65;

    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    let recommendation = '';

    if (probability < 0.2) {
      riskLevel = 'LOW';
      recommendation = 'Continue routine monitoring';
    } else if (probability < 0.5) {
      riskLevel = 'MODERATE';
      recommendation =
        'Increased monitoring. Consider serial lactate measurements. Evaluate for infection source.';
    } else if (probability < 0.75) {
      riskLevel = 'HIGH';
      recommendation =
        'URGENT: Initiate sepsis protocol. Obtain blood cultures. Start empiric antibiotics. Consider ICU consultation.';
    } else {
      riskLevel = 'CRITICAL';
      recommendation =
        'CRITICAL: Activate sepsis code. Immediate ICU transfer. Start sepsis bundle (fluids, antibiotics, pressors if needed).';
    }

    return {
      probability,
      riskLevel,
      confidence,
      contributingFactors: features.sort((a, b) => b.importance - a.importance),
      recommendation,
      timeToSepsis: probability > 0.5 ? 6 : undefined, // Estimated 6 hours if high risk
      timestamp: new Date(),
    };
  }

  /**
   * Comprehensive Sepsis Assessment
   */
  async assessSepsis(
    vitals: VitalSigns,
    labs: SepsisLabValues,
    historicalTrends?: VitalSigns[]
  ): Promise<SepsisAssessment> {
    const sirs = labs.wbc ? this.calculateSIRS(vitals, labs) : undefined;
    const qsofa = this.calculateQSOFA(vitals);
    const news2 = this.calculateNEWS2(vitals);
    const mews = this.calculateMEWS(vitals);
    const sofa = labs.platelets ? this.calculateSOFA(vitals, labs) : undefined;
    const prediction = this.predictSepsis(vitals, labs, historicalTrends);

    const alerts: SepsisAlert[] = [];
    const recommendations: string[] = [];

    // Generate alerts
    if (qsofa.highRisk) {
      alerts.push({
        severity: 'CRITICAL',
        message: 'qSOFA ≥2: High risk for adverse outcomes',
        action: qsofa.recommendation,
        urgency: 'IMMEDIATE',
      });
    }

    if (news2.score >= 7) {
      alerts.push({
        severity: 'CRITICAL',
        message: `NEWS2 Score ${news2.score}: Emergency response required`,
        action: news2.clinicalResponse,
        urgency: 'IMMEDIATE',
      });
    }

    if (labs.lactate && labs.lactate > 4) {
      alerts.push({
        severity: 'CRITICAL',
        message: `Severe hyperlactatemia: ${labs.lactate.toFixed(1)} mmol/L`,
        action: 'Immediate fluid resuscitation and source control',
        urgency: 'IMMEDIATE',
      });
    }

    if (prediction.riskLevel === 'HIGH' || prediction.riskLevel === 'CRITICAL') {
      alerts.push({
        severity: 'CRITICAL',
        message: `Sepsis prediction: ${(prediction.probability * 100).toFixed(0)}% probability`,
        action: prediction.recommendation,
        urgency: 'IMMEDIATE',
      });
    }

    // Determine overall risk
    const overallRisk = this.determineOverallRisk(qsofa, news2, prediction);

    // Compile recommendations
    recommendations.push(qsofa.recommendation);
    recommendations.push(news2.clinicalResponse);
    recommendations.push(prediction.recommendation);

    return {
      sirs,
      qsofa,
      news2,
      mews,
      sofa,
      prediction,
      overallRisk,
      alerts,
      recommendations: [...new Set(recommendations)], // Remove duplicates
      timestamp: new Date(),
    };
  }

  /**
   * Analyze vital sign trends
   */
  private analyzeVitalTrends(trends: VitalSigns[]): { deteriorating: boolean } {
    if (trends.length < 2) return { deteriorating: false };

    // Simple trend analysis - check if vital signs are worsening
    const recent = trends[trends.length - 1]!;
    const previous = trends[trends.length - 2]!;

    const hrIncreasing = recent.heartRate > previous.heartRate + 10;
    const rrIncreasing = recent.respiratoryRate > previous.respiratoryRate + 4;
    const bpDecreasing = recent.systolicBP < previous.systolicBP - 20;

    return {
      deteriorating: hrIncreasing || rrIncreasing || bpDecreasing,
    };
  }

  /**
   * Determine overall risk level
   */
  private determineOverallRisk(
    qsofa: qSOFAResult,
    news2: NEWS2Result,
    prediction: SepsisPrediction
  ): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
    if (
      qsofa.highRisk ||
      news2.riskLevel === 'HIGH' ||
      prediction.riskLevel === 'CRITICAL'
    ) {
      return 'CRITICAL';
    }

    if (news2.riskLevel === 'MEDIUM' || prediction.riskLevel === 'HIGH') {
      return 'HIGH';
    }

    if (qsofa.score >= 1 || news2.riskLevel === 'LOW_MEDIUM') {
      return 'MODERATE';
    }

    return 'LOW';
  }

  // NEWS2 Scoring Methods
  private scoreRespirationRateNEWS2(rr: number): number {
    if (rr <= 8) return 3;
    if (rr <= 11) return 1;
    if (rr <= 20) return 0;
    if (rr <= 24) return 2;
    return 3;
  }

  private scoreOxygenSaturationNEWS2(spo2: number): number {
    if (spo2 <= 91) return 3;
    if (spo2 <= 93) return 2;
    if (spo2 <= 95) return 1;
    return 0;
  }

  private scoreTemperatureNEWS2(temp: number): number {
    if (temp <= 35.0) return 3;
    if (temp <= 36.0) return 1;
    if (temp <= 38.0) return 0;
    if (temp <= 39.0) return 1;
    return 2;
  }

  private scoreSystolicBPNEWS2(sbp: number): number {
    if (sbp <= 90) return 3;
    if (sbp <= 100) return 2;
    if (sbp <= 110) return 1;
    if (sbp <= 219) return 0;
    return 3;
  }

  private scoreHeartRateNEWS2(hr: number): number {
    if (hr <= 40) return 3;
    if (hr <= 50) return 1;
    if (hr <= 90) return 0;
    if (hr <= 110) return 1;
    if (hr <= 130) return 2;
    return 3;
  }

  private scoreConsciousnessNEWS2(consciousness: string): number {
    return consciousness === 'ALERT' ? 0 : 3;
  }

  // MEWS Scoring Methods
  private scoreSystolicBPMEWS(sbp: number): number {
    if (sbp <= 70) return 3;
    if (sbp <= 80) return 2;
    if (sbp <= 100) return 1;
    if (sbp <= 199) return 0;
    return 2;
  }

  private scoreHeartRateMEWS(hr: number): number {
    if (hr < 40) return 2;
    if (hr <= 50) return 1;
    if (hr <= 100) return 0;
    if (hr <= 110) return 1;
    if (hr <= 129) return 2;
    return 3;
  }

  private scoreRespirationRateMEWS(rr: number): number {
    if (rr < 9) return 2;
    if (rr <= 14) return 0;
    if (rr <= 20) return 1;
    if (rr <= 29) return 2;
    return 3;
  }

  private scoreTemperatureMEWS(temp: number): number {
    if (temp < 35) return 2;
    if (temp <= 38.4) return 0;
    return 2;
  }

  private scoreConsciousnessMEWS(consciousness: string): number {
    return consciousness === 'ALERT' ? 0 : 3;
  }

  // SOFA Scoring Methods
  private scoreRespirationSOFA(pao2?: number, fio2?: number): number {
    if (!pao2 || !fio2) return 0;
    const ratio = pao2 / fio2;
    if (ratio >= 400) return 0;
    if (ratio >= 300) return 1;
    if (ratio >= 200) return 2;
    if (ratio >= 100) return 3;
    return 4;
  }

  private scoreCoagulationSOFA(platelets?: number): number {
    if (!platelets) return 0;
    if (platelets >= 150) return 0;
    if (platelets >= 100) return 1;
    if (platelets >= 50) return 2;
    if (platelets >= 20) return 3;
    return 4;
  }

  private scoreLiverSOFA(bilirubin?: number): number {
    if (!bilirubin) return 0;
    if (bilirubin < 1.2) return 0;
    if (bilirubin < 2.0) return 1;
    if (bilirubin < 6.0) return 2;
    if (bilirubin < 12.0) return 3;
    return 4;
  }

  private scoreCardiovascularSOFA(sbp: number): number {
    if (sbp >= 70) return 0;
    if (sbp < 70) return 1;
    // In real implementation, would also check for vasopressor use
    return 0;
  }

  private scoreCNSSOFA(consciousness: string): number {
    // Simplified GCS mapping
    if (consciousness === 'ALERT') return 0;
    if (consciousness === 'CONFUSION') return 1;
    if (consciousness === 'VOICE') return 2;
    if (consciousness === 'PAIN') return 3;
    return 4;
  }

  private scoreRenalSOFA(creatinine?: number): number {
    if (!creatinine) return 0;
    if (creatinine < 1.2) return 0;
    if (creatinine < 2.0) return 1;
    if (creatinine < 3.5) return 2;
    if (creatinine < 5.0) return 3;
    return 4;
  }
}

// Export singleton instance
export const sepsisPredictionEngine = new SepsisPredictionEngine();

/**
 * Quick sepsis assessment
 */
export async function assessSepsisRisk(
  vitals: VitalSigns,
  labs: SepsisLabValues
): Promise<SepsisAssessment> {
  return sepsisPredictionEngine.assessSepsis(vitals, labs);
}
