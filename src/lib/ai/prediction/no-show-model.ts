/**
 * Appointment No-Show Prediction Model
 *
 * Predicts likelihood of patient no-show for appointments using:
 * - Historical attendance patterns
 * - Demographics
 * - Appointment characteristics
 * - Social determinants of health
 * - Engagement metrics
 *
 * @module ai/prediction/no-show-model
 */

/**
 * Appointment data for no-show prediction
 */
export interface NoShowPredictionInput {
  // Patient demographics
  patientAge: number;
  patientGender: 'male' | 'female' | 'other';

  // Patient history
  totalPreviousAppointments: number;
  previousNoShows: number;
  previousCancellations: number;
  previousLateArrivals: number;
  daysSinceLastVisit?: number;

  // Appointment details
  appointmentType: 'new_patient' | 'follow_up' | 'procedure' | 'lab' | 'imaging';
  specialty: string;
  leadTime: number; // days between scheduling and appointment
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  appointmentDuration: number; // minutes

  // Communication
  remindersSent: number;
  confirmationReceived: boolean;
  preferredContactMethod?: 'phone' | 'email' | 'sms' | 'portal';
  lastContactAttempt?: Date;

  // Clinical factors
  chronicConditions: number;
  activePrescriptions: number;
  recentHospitalization?: boolean;
  urgencyLevel?: 'routine' | 'urgent' | 'follow_up_urgent';

  // Social factors
  insuranceType?: 'medicare' | 'medicaid' | 'private' | 'uninsured' | 'self_pay';
  distanceToClinic?: number; // miles
  hasTransportation?: boolean;
  employmentStatus?: 'employed' | 'unemployed' | 'retired' | 'student';

  // Weather/external (optional)
  weatherCondition?: 'clear' | 'rain' | 'snow' | 'severe';

  // Patient engagement
  patientPortalActive?: boolean;
  lastPortalLogin?: Date;
  patientSatisfactionScore?: number; // 1-5
}

/**
 * No-show prediction result
 */
export interface NoShowPredictionResult {
  noShowProbability: number; // 0-1
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  riskScore: number; // 0-100
  riskFactors: NoShowRiskFactor[];
  recommendations: string[];
  interventionPriority: 'none' | 'low' | 'medium' | 'high';
  suggestedInterventions: string[];
  confidence: number;
  modelVersion: string;
}

/**
 * No-show risk factor
 */
export interface NoShowRiskFactor {
  factor: string;
  weight: number;
  category: 'history' | 'appointment' | 'social' | 'engagement' | 'clinical';
}

/**
 * Appointment No-Show Prediction Model
 *
 * Combines historical patterns with real-time factors
 */
export class NoShowModel {
  private readonly modelVersion = '1.0.0';

  /**
   * Predict no-show probability
   *
   * @param input - Appointment and patient data
   * @returns No-show prediction with interventions
   */
  predict(input: NoShowPredictionInput): NoShowPredictionResult {
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(input);

    // Calculate risk score
    const riskScore = this.calculateRiskScore(input, riskFactors);

    // Convert to probability
    const noShowProbability = this.convertToProbability(riskScore);

    // Categorize risk
    const riskLevel = this.categorizeRisk(noShowProbability);

    // Determine intervention priority
    const interventionPriority = this.determineInterventionPriority(riskLevel, input);

    // Generate recommendations
    const { recommendations, suggestedInterventions } = this.generateRecommendations(
      input,
      riskFactors,
      riskLevel
    );

    // Assess confidence
    const confidence = this.assessConfidence(input);

    return {
      noShowProbability,
      riskLevel,
      riskScore,
      riskFactors: riskFactors.sort((a, b) => b.weight - a.weight),
      recommendations,
      interventionPriority,
      suggestedInterventions,
      confidence,
      modelVersion: this.modelVersion,
    };
  }

  /**
   * Identify risk factors for no-show
   */
  private identifyRiskFactors(input: NoShowPredictionInput): NoShowRiskFactor[] {
    const factors: NoShowRiskFactor[] = [];

    // HISTORICAL PATTERNS (strongest predictor)
    if (input.totalPreviousAppointments > 0) {
      const noShowRate = input.previousNoShows / input.totalPreviousAppointments;

      if (noShowRate > 0.3) {
        factors.push({
          factor: 'High no-show history (>30%)',
          weight: 0.30,
          category: 'history',
        });
      } else if (noShowRate > 0.15) {
        factors.push({
          factor: 'Moderate no-show history (15-30%)',
          weight: 0.20,
          category: 'history',
        });
      } else if (noShowRate === 0 && input.totalPreviousAppointments >= 5) {
        factors.push({
          factor: 'Perfect attendance record',
          weight: -0.20,
          category: 'history',
        });
      }

      // Recent no-show
      if (input.previousNoShows > 0 && input.daysSinceLastVisit && input.daysSinceLastVisit < 90) {
        factors.push({
          factor: 'Recent no-show',
          weight: 0.15,
          category: 'history',
        });
      }
    } else {
      // New patient - higher risk
      factors.push({
        factor: 'New patient (no history)',
        weight: 0.15,
        category: 'history',
      });
    }

    // LEAD TIME
    if (input.leadTime > 30) {
      factors.push({
        factor: 'Long lead time (>30 days)',
        weight: 0.18,
        category: 'appointment',
      });
    } else if (input.leadTime > 14) {
      factors.push({
        factor: 'Medium lead time (14-30 days)',
        weight: 0.10,
        category: 'appointment',
      });
    } else if (input.leadTime < 2) {
      factors.push({
        factor: 'Short lead time (<2 days)',
        weight: -0.08,
        category: 'appointment',
      });
    }

    // APPOINTMENT TYPE
    if (input.appointmentType === 'new_patient') {
      factors.push({
        factor: 'New patient appointment',
        weight: 0.12,
        category: 'appointment',
      });
    } else if (input.appointmentType === 'follow_up') {
      factors.push({
        factor: 'Follow-up appointment',
        weight: -0.05,
        category: 'appointment',
      });
    }

    // TIMING
    if (input.dayOfWeek === 'monday') {
      factors.push({
        factor: 'Monday appointment',
        weight: 0.08,
        category: 'appointment',
      });
    } else if (input.dayOfWeek === 'friday') {
      factors.push({
        factor: 'Friday appointment',
        weight: 0.06,
        category: 'appointment',
      });
    }

    if (input.timeOfDay === 'morning') {
      factors.push({
        factor: 'Early morning time',
        weight: -0.05,
        category: 'appointment',
      });
    } else if (input.timeOfDay === 'evening') {
      factors.push({
        factor: 'Evening appointment',
        weight: 0.04,
        category: 'appointment',
      });
    }

    // COMMUNICATION
    if (!input.confirmationReceived) {
      factors.push({
        factor: 'No appointment confirmation',
        weight: 0.15,
        category: 'engagement',
      });
    }

    if (input.remindersSent === 0) {
      factors.push({
        factor: 'No reminders sent',
        weight: 0.12,
        category: 'engagement',
      });
    }

    // ENGAGEMENT
    if (input.patientPortalActive === false) {
      factors.push({
        factor: 'Patient portal not activated',
        weight: 0.10,
        category: 'engagement',
      });
    } else if (input.lastPortalLogin) {
      const daysSinceLogin = Math.floor(
        (Date.now() - input.lastPortalLogin.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLogin > 180) {
        factors.push({
          factor: 'Low portal engagement',
          weight: 0.08,
          category: 'engagement',
        });
      }
    }

    // SOCIAL FACTORS
    if (input.insuranceType === 'uninsured' || input.insuranceType === 'self_pay') {
      factors.push({
        factor: 'Uninsured/self-pay',
        weight: 0.14,
        category: 'social',
      });
    }

    if (input.distanceToClinic && input.distanceToClinic > 20) {
      factors.push({
        factor: 'Long travel distance (>20 miles)',
        weight: 0.12,
        category: 'social',
      });
    }

    if (input.hasTransportation === false) {
      factors.push({
        factor: 'Transportation barriers',
        weight: 0.16,
        category: 'social',
      });
    }

    if (input.employmentStatus === 'employed') {
      factors.push({
        factor: 'Employed (scheduling conflicts)',
        weight: 0.07,
        category: 'social',
      });
    }

    // CLINICAL URGENCY
    if (input.urgencyLevel === 'urgent' || input.urgencyLevel === 'follow_up_urgent') {
      factors.push({
        factor: 'Urgent appointment',
        weight: -0.12,
        category: 'clinical',
      });
    }

    if (input.recentHospitalization) {
      factors.push({
        factor: 'Recent hospitalization',
        weight: -0.10,
        category: 'clinical',
      });
    }

    if (input.chronicConditions >= 3) {
      factors.push({
        factor: 'Multiple chronic conditions',
        weight: -0.08,
        category: 'clinical',
      });
    }

    // WEATHER
    if (input.weatherCondition === 'snow' || input.weatherCondition === 'severe') {
      factors.push({
        factor: 'Poor weather conditions',
        weight: 0.10,
        category: 'appointment',
      });
    }

    // PATIENT SATISFACTION
    if (input.patientSatisfactionScore !== undefined) {
      if (input.patientSatisfactionScore <= 2) {
        factors.push({
          factor: 'Low patient satisfaction',
          weight: 0.13,
          category: 'engagement',
        });
      } else if (input.patientSatisfactionScore >= 4) {
        factors.push({
          factor: 'High patient satisfaction',
          weight: -0.10,
          category: 'engagement',
        });
      }
    }

    // AGE FACTORS
    if (input.patientAge < 25) {
      factors.push({
        factor: 'Young age (<25)',
        weight: 0.09,
        category: 'history',
      });
    } else if (input.patientAge > 65) {
      factors.push({
        factor: 'Older age (>65)',
        weight: -0.06,
        category: 'history',
      });
    }

    return factors;
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(
    input: NoShowPredictionInput,
    riskFactors: NoShowRiskFactor[]
  ): number {
    // Base score starts at 50
    let score = 50;

    // Add weighted risk factors
    const totalWeight = riskFactors.reduce((sum, rf) => sum + rf.weight, 0);
    score += totalWeight * 100;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Convert risk score to probability
   */
  private convertToProbability(riskScore: number): number {
    // Logistic transformation
    // Average no-show rate is typically 15-20%
    const z = (riskScore - 50) / 25;
    const probability = 0.18 / (1 + Math.exp(-z));
    return Math.min(Math.max(probability, 0), 1);
  }

  /**
   * Categorize risk level
   */
  private categorizeRisk(probability: number): 'low' | 'moderate' | 'high' | 'very_high' {
    if (probability < 0.15) return 'low';
    if (probability < 0.30) return 'moderate';
    if (probability < 0.50) return 'high';
    return 'very_high';
  }

  /**
   * Determine intervention priority
   */
  private determineInterventionPriority(
    riskLevel: string,
    input: NoShowPredictionInput
  ): 'none' | 'low' | 'medium' | 'high' {
    if (riskLevel === 'very_high') return 'high';
    if (riskLevel === 'high') return 'medium';
    if (riskLevel === 'moderate') return 'low';
    return 'none';
  }

  /**
   * Generate recommendations and interventions
   */
  private generateRecommendations(
    input: NoShowPredictionInput,
    riskFactors: NoShowRiskFactor[],
    riskLevel: string
  ): {
    recommendations: string[];
    suggestedInterventions: string[];
  } {
    const recommendations: string[] = [];
    const suggestedInterventions: string[] = [];

    // GENERAL RECOMMENDATIONS
    if (riskLevel === 'very_high' || riskLevel === 'high') {
      recommendations.push('Consider overbooking strategy for this time slot');
      recommendations.push('Flag for intensive outreach');
    }

    // COMMUNICATION INTERVENTIONS
    if (!input.confirmationReceived || input.remindersSent < 2) {
      suggestedInterventions.push('Send appointment confirmation immediately');
      suggestedInterventions.push('Schedule 48-hour reminder call');
      suggestedInterventions.push('Send 24-hour SMS reminder');
    }

    if (riskFactors.some(rf => rf.factor.includes('confirmation'))) {
      suggestedInterventions.push('Personal phone call to confirm appointment');
    }

    // TRANSPORTATION
    if (riskFactors.some(rf => rf.factor.includes('Transportation') || rf.factor.includes('distance'))) {
      suggestedInterventions.push('Offer telehealth alternative');
      suggestedInterventions.push('Provide transportation assistance information');
      recommendations.push('Consider scheduling at closer clinic location if available');
    }

    // SCHEDULING
    if (riskFactors.some(rf => rf.factor.includes('lead time'))) {
      recommendations.push('Attempt to move appointment to earlier date');
      suggestedInterventions.push('Add to cancellation waitlist for earlier slot');
    }

    if (riskFactors.some(rf => rf.factor.includes('Monday') || rf.factor.includes('Friday'))) {
      recommendations.push('Consider rescheduling to mid-week if patient agrees');
    }

    // FINANCIAL
    if (riskFactors.some(rf => rf.factor.includes('Uninsured') || rf.factor.includes('self-pay'))) {
      suggestedInterventions.push('Discuss financial assistance programs');
      suggestedInterventions.push('Offer payment plan options');
      recommendations.push('Have financial counselor contact patient before appointment');
    }

    // ENGAGEMENT
    if (riskFactors.some(rf => rf.factor.includes('portal') || rf.factor.includes('engagement'))) {
      suggestedInterventions.push('Assist with patient portal activation');
      suggestedInterventions.push('Increase touchpoints through preferred contact method');
    }

    if (input.patientSatisfactionScore && input.patientSatisfactionScore <= 2) {
      recommendations.push('Address previous care concerns before appointment');
      suggestedInterventions.push('Manager outreach to discuss concerns');
    }

    // INCENTIVES
    if (riskLevel === 'very_high') {
      suggestedInterventions.push('Consider appointment incentive program enrollment');
      suggestedInterventions.push('Emphasize importance of appointment in communication');
    }

    // CLINICAL IMPORTANCE
    if (input.urgencyLevel === 'urgent' || input.recentHospitalization) {
      suggestedInterventions.push('Emphasize medical importance in all communications');
      suggestedInterventions.push('Provider phone call explaining importance');
    }

    return {
      recommendations,
      suggestedInterventions,
    };
  }

  /**
   * Assess prediction confidence
   */
  private assessConfidence(input: NoShowPredictionInput): number {
    let confidence = 100;

    // Missing historical data (most important)
    if (input.totalPreviousAppointments === 0) {
      confidence -= 25;
    } else if (input.totalPreviousAppointments < 3) {
      confidence -= 15;
    }

    // Missing engagement data
    if (input.patientPortalActive === undefined) confidence -= 10;
    if (!input.lastPortalLogin && input.patientPortalActive) confidence -= 5;

    // Missing social data
    if (input.distanceToClinic === undefined) confidence -= 8;
    if (input.hasTransportation === undefined) confidence -= 8;
    if (input.employmentStatus === undefined) confidence -= 5;

    // Missing clinical context
    if (input.urgencyLevel === undefined) confidence -= 7;
    if (input.patientSatisfactionScore === undefined) confidence -= 7;

    // Missing communication data
    if (input.preferredContactMethod === undefined) confidence -= 5;

    return Math.max(confidence, 40);
  }
}

/**
 * Create singleton no-show model instance
 */
let modelInstance: NoShowModel | null = null;

export function getNoShowModel(): NoShowModel {
  if (!modelInstance) {
    modelInstance = new NoShowModel();
  }
  return modelInstance;
}
