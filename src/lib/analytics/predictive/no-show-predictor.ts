/**
 * Appointment No-Show Prediction Model
 * Predicts likelihood of patient missing scheduled appointment
 */

import type { Prediction, PredictionFactor, RiskLevel } from "@/types/analytics-enterprise";

export interface NoShowPredictionInput {
  patientId: string;
  appointmentId: string;

  // Appointment characteristics
  appointmentType: "primary_care" | "specialist" | "procedure" | "follow_up" | "new_patient";
  leadTimeDays: number;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  timeSlot: "morning" | "afternoon" | "evening";
  provider: string;

  // Patient history
  totalAppointments: number;
  noShowCount: number;
  cancelledCount: number;
  lateArrivalCount: number;
  consecutiveShows: number;

  // Patient demographics
  age: number;
  distanceMiles: number;

  // Communication & engagement
  confirmationSent: boolean;
  reminderSent: boolean;
  patientConfirmed: boolean;
  hasPortalAccess: boolean;
  hasEmail: boolean;
  hasPhone: boolean;

  // Clinical factors
  chronicConditionCount: number;
  lastVisitDaysAgo?: number;
  activePrescriptions: number;

  // Scheduling factors
  patientRequested: boolean;
  waitlistAppointment: boolean;

  // Weather & external (optional)
  forecastBadWeather?: boolean;
}

export interface NoShowPredictionOutput extends Prediction {
  noShowProbability: number;
  retentionStrategies: string[];
  optimalContactTime: string;
}

/**
 * Feature weights for no-show prediction
 */
const NO_SHOW_WEIGHTS = {
  // Strongest predictors - patient history
  noShowRate: 50,
  consecutiveShows: -3, // Protective
  recentNoShow: 20,

  // Appointment characteristics
  leadTime: 2,
  newPatient: 12,
  specialist: 5,
  procedure: -8, // Less likely to miss procedures

  // Communication
  notConfirmed: 15,
  noReminderSent: 10,
  noPortalAccess: 5,
  noContactInfo: 8,

  // Clinical engagement
  chronicConditions: -2, // More engaged if chronic conditions
  activePrescriptions: -1,
  longTimeSinceVisit: 6,

  // Demographics & logistics
  distance: 1.5,
  youngAge: 4,
  mondayMorning: -3, // More reliable
  fridayAfternoon: 6, // Higher no-show
  evening: 8,

  // Scheduling
  patientRequested: -7, // Less likely to miss if they requested
  waitlist: 10,

  // External
  badWeather: 8,
};

/**
 * Predict no-show probability
 */
export function predictNoShow(input: NoShowPredictionInput): NoShowPredictionOutput {
  const factors: PredictionFactor[] = [];
  let totalScore = 0;

  // Calculate historical no-show rate (strongest predictor)
  const noShowRate =
    input.totalAppointments > 0 ? input.noShowCount / input.totalAppointments : 0;

  if (noShowRate > 0) {
    const contribution = noShowRate * NO_SHOW_WEIGHTS.noShowRate;
    factors.push({
      feature: "Historical No-Show Rate",
      value: `${(noShowRate * 100).toFixed(1)}%`,
      contribution,
      description: `${input.noShowCount} no-shows out of ${input.totalAppointments} appointments`,
    });
    totalScore += contribution;
  }

  // Recent no-show (last 90 days)
  // This would need to be passed in, but we approximate with noShowCount > 0
  if (input.noShowCount > 0 && input.totalAppointments < 10) {
    factors.push({
      feature: "Recent No-Show History",
      value: "Yes",
      contribution: NO_SHOW_WEIGHTS.recentNoShow,
      description: "Recent pattern of missed appointments",
    });
    totalScore += NO_SHOW_WEIGHTS.recentNoShow;
  }

  // Consecutive shows (protective factor)
  if (input.consecutiveShows >= 5) {
    const contribution = Math.abs(input.consecutiveShows * NO_SHOW_WEIGHTS.consecutiveShows);
    factors.push({
      feature: "Consecutive Shows",
      value: input.consecutiveShows,
      contribution: -contribution, // Negative = protective
      description: "Recent reliable attendance pattern",
    });
    totalScore -= contribution;
  }

  // Lead time (longer lead time = higher no-show risk)
  if (input.leadTimeDays > 7) {
    const contribution = Math.min((input.leadTimeDays - 7) * NO_SHOW_WEIGHTS.leadTime, 20);
    factors.push({
      feature: "Long Lead Time",
      value: `${input.leadTimeDays} days`,
      contribution,
      description: "Appointments scheduled far in advance have higher no-show rates",
    });
    totalScore += contribution;
  }

  // New patient
  if (input.appointmentType === "new_patient") {
    factors.push({
      feature: "New Patient",
      value: "Yes",
      contribution: NO_SHOW_WEIGHTS.newPatient,
      description: "New patients have higher no-show rates",
    });
    totalScore += NO_SHOW_WEIGHTS.newPatient;
  }

  // Specialist vs primary care
  if (input.appointmentType === "specialist") {
    factors.push({
      feature: "Specialist Appointment",
      value: "Yes",
      contribution: NO_SHOW_WEIGHTS.specialist,
      description: "Specialist appointments have moderate no-show risk",
    });
    totalScore += NO_SHOW_WEIGHTS.specialist;
  }

  // Procedure appointments (protective)
  if (input.appointmentType === "procedure") {
    const contribution = Math.abs(NO_SHOW_WEIGHTS.procedure);
    factors.push({
      feature: "Procedure Appointment",
      value: "Yes",
      contribution: -contribution,
      description: "Patients rarely miss procedure appointments",
    });
    totalScore += NO_SHOW_WEIGHTS.procedure;
  }

  // Patient did not confirm
  if (input.confirmationSent && !input.patientConfirmed) {
    factors.push({
      feature: "Not Confirmed",
      value: "No response",
      contribution: NO_SHOW_WEIGHTS.notConfirmed,
      description: "Patient did not confirm appointment when requested",
    });
    totalScore += NO_SHOW_WEIGHTS.notConfirmed;
  }

  // No reminder sent
  if (!input.reminderSent) {
    factors.push({
      feature: "No Reminder Sent",
      value: "Missing",
      contribution: NO_SHOW_WEIGHTS.noReminderSent,
      description: "Reminders reduce no-show rates significantly",
    });
    totalScore += NO_SHOW_WEIGHTS.noReminderSent;
  }

  // No portal access
  if (!input.hasPortalAccess) {
    factors.push({
      feature: "No Portal Access",
      value: "Not enrolled",
      contribution: NO_SHOW_WEIGHTS.noPortalAccess,
      description: "Portal users have better engagement",
    });
    totalScore += NO_SHOW_WEIGHTS.noPortalAccess;
  }

  // Limited contact information
  if (!input.hasEmail && !input.hasPhone) {
    factors.push({
      feature: "Limited Contact Info",
      value: "Missing",
      contribution: NO_SHOW_WEIGHTS.noContactInfo,
      description: "Cannot effectively reach patient for reminders",
    });
    totalScore += NO_SHOW_WEIGHTS.noContactInfo;
  }

  // Chronic conditions (protective - more engaged)
  if (input.chronicConditionCount >= 2) {
    const contribution = Math.abs(
      input.chronicConditionCount * NO_SHOW_WEIGHTS.chronicConditions,
    );
    factors.push({
      feature: "Chronic Conditions",
      value: input.chronicConditionCount,
      contribution: -contribution,
      description: "Patients with chronic conditions are more engaged",
    });
    totalScore -= contribution;
  }

  // Long time since last visit
  if (input.lastVisitDaysAgo && input.lastVisitDaysAgo > 365) {
    factors.push({
      feature: "Long Time Since Visit",
      value: `${input.lastVisitDaysAgo} days`,
      contribution: NO_SHOW_WEIGHTS.longTimeSinceVisit,
      description: "Disengaged patients more likely to no-show",
    });
    totalScore += NO_SHOW_WEIGHTS.longTimeSinceVisit;
  }

  // Distance to clinic
  if (input.distanceMiles > 15) {
    const contribution = Math.min(
      (input.distanceMiles - 15) * NO_SHOW_WEIGHTS.distance,
      15,
    );
    factors.push({
      feature: "Distance from Clinic",
      value: `${input.distanceMiles} miles`,
      contribution,
      description: "Travel distance affects attendance",
    });
    totalScore += contribution;
  }

  // Age factor (young adults have higher no-show)
  if (input.age >= 18 && input.age <= 35) {
    factors.push({
      feature: "Young Adult",
      value: input.age,
      contribution: NO_SHOW_WEIGHTS.youngAge,
      description: "Young adults (18-35) have higher no-show rates",
    });
    totalScore += NO_SHOW_WEIGHTS.youngAge;
  }

  // Day of week and time slot
  if (input.dayOfWeek === 5 && input.timeSlot === "afternoon") {
    factors.push({
      feature: "Friday Afternoon",
      value: "Risky time slot",
      contribution: NO_SHOW_WEIGHTS.fridayAfternoon,
      description: "Friday afternoons have elevated no-show rates",
    });
    totalScore += NO_SHOW_WEIGHTS.fridayAfternoon;
  } else if (input.dayOfWeek === 1 && input.timeSlot === "morning") {
    const contribution = Math.abs(NO_SHOW_WEIGHTS.mondayMorning);
    factors.push({
      feature: "Monday Morning",
      value: "Reliable time slot",
      contribution: -contribution,
      description: "Monday mornings have lower no-show rates",
    });
    totalScore += NO_SHOW_WEIGHTS.mondayMorning;
  }

  if (input.timeSlot === "evening") {
    factors.push({
      feature: "Evening Appointment",
      value: "After hours",
      contribution: NO_SHOW_WEIGHTS.evening,
      description: "Evening slots have higher no-show rates",
    });
    totalScore += NO_SHOW_WEIGHTS.evening;
  }

  // Patient requested (protective)
  if (input.patientRequested) {
    const contribution = Math.abs(NO_SHOW_WEIGHTS.patientRequested);
    factors.push({
      feature: "Patient Requested",
      value: "Yes",
      contribution: -contribution,
      description: "Self-scheduled appointments have better attendance",
    });
    totalScore += NO_SHOW_WEIGHTS.patientRequested;
  }

  // Waitlist appointment
  if (input.waitlistAppointment) {
    factors.push({
      feature: "Waitlist Appointment",
      value: "Yes",
      contribution: NO_SHOW_WEIGHTS.waitlist,
      description: "Last-minute waitlist slots have higher no-show",
    });
    totalScore += NO_SHOW_WEIGHTS.waitlist;
  }

  // Bad weather forecast
  if (input.forecastBadWeather) {
    factors.push({
      feature: "Bad Weather Forecast",
      value: "Yes",
      contribution: NO_SHOW_WEIGHTS.badWeather,
      description: "Severe weather increases no-show likelihood",
    });
    totalScore += NO_SHOW_WEIGHTS.badWeather;
  }

  // Convert score to probability
  const probability = 1 / (1 + Math.exp(-(totalScore - 30) / 10));
  const riskLevel = getNoShowRiskLevel(probability);

  // Generate retention strategies
  const strategies = generateRetentionStrategies(input, factors, riskLevel);
  const optimalContactTime = determineOptimalContactTime(input);

  return {
    id: `noshow-${input.appointmentId}-${Date.now()}`,
    patientId: input.patientId,
    modelId: "no-show-predictor-v1",
    modelVersion: "1.0",
    predictionType: "no_show_risk",
    score: totalScore,
    probability: probability * 100,
    riskLevel,
    predictedAt: new Date(),
    validUntil: new Date(input.leadTimeDays * 24 * 60 * 60 * 1000 + Date.now()),
    factors,
    recommendations: strategies,
    confidence: 85,
    noShowProbability: probability * 100,
    retentionStrategies: strategies,
    optimalContactTime,
  };
}

/**
 * Determine risk level for no-show
 */
function getNoShowRiskLevel(probability: number): RiskLevel {
  if (probability >= 0.40) return "very_high";
  if (probability >= 0.25) return "high";
  if (probability >= 0.15) return "moderate";
  return "low";
}

/**
 * Generate retention strategies
 */
function generateRetentionStrategies(
  input: NoShowPredictionInput,
  factors: PredictionFactor[],
  riskLevel: RiskLevel,
): string[] {
  const strategies: string[] = [];

  if (riskLevel === "very_high" || riskLevel === "high") {
    strategies.push("Send multiple reminders (48hr, 24hr, morning of)");
    strategies.push("Make personal phone call to confirm attendance");
    strategies.push("Emphasize importance of appointment in communications");
  }

  if (!input.patientConfirmed) {
    strategies.push("Request confirmation via preferred contact method");
  }

  if (!input.reminderSent) {
    strategies.push("Enable automated appointment reminders");
  }

  if (input.leadTimeDays > 14) {
    strategies.push("Send interim reminder 1 week before appointment");
  }

  if (!input.hasPortalAccess) {
    strategies.push("Encourage patient portal enrollment for easy rescheduling");
  }

  if (input.distanceMiles > 15) {
    strategies.push("Offer telehealth as alternative if appropriate");
    strategies.push("Provide directions and parking information");
  }

  if (input.forecastBadWeather) {
    strategies.push("Proactively offer to reschedule due to weather");
  }

  if (input.noShowCount > 2) {
    strategies.push("Discuss barriers to attendance with patient");
    strategies.push("Consider same-day appointment options");
    strategies.push("Offer transportation assistance if available");
  }

  if (input.timeSlot === "evening" || (input.dayOfWeek === 5 && input.timeSlot === "afternoon")) {
    strategies.push("Extra reminder for historically high-risk time slot");
  }

  return strategies;
}

/**
 * Determine optimal time to contact patient
 */
function determineOptimalContactTime(input: NoShowPredictionInput): string {
  // High-risk appointments get earlier and more frequent contact
  const noShowRate =
    input.totalAppointments > 0 ? input.noShowCount / input.totalAppointments : 0;

  if (noShowRate > 0.3 || input.leadTimeDays > 21) {
    return "Contact 7 days, 3 days, 1 day, and morning of appointment";
  } else if (noShowRate > 0.15 || input.leadTimeDays > 14) {
    return "Contact 3 days and 1 day before appointment";
  } else {
    return "Contact 1 day before appointment";
  }
}

/**
 * Batch prediction for appointment list
 */
export function batchPredictNoShows(
  inputs: NoShowPredictionInput[],
): NoShowPredictionOutput[] {
  return inputs.map((input) => predictNoShow(input));
}

/**
 * Get high-risk appointments for proactive outreach
 */
export function getHighRiskAppointments(
  predictions: NoShowPredictionOutput[],
  threshold: number = 0.25,
): NoShowPredictionOutput[] {
  return predictions
    .filter((pred) => pred.noShowProbability / 100 >= threshold)
    .sort((a, b) => b.noShowProbability - a.noShowProbability);
}

/**
 * Calculate expected no-shows for capacity planning
 */
export function calculateExpectedNoShows(
  predictions: NoShowPredictionOutput[],
): {
  expectedNoShows: number;
  byTimeSlot: Record<string, number>;
  byDay: Record<string, number>;
} {
  const expectedTotal = predictions.reduce((sum, pred) => sum + pred.probability / 100, 0);

  const byTimeSlot: Record<string, number> = {};
  const byDay: Record<string, number> = {};

  // This would require additional context from inputs
  // For now, return totals
  return {
    expectedNoShows: expectedTotal,
    byTimeSlot,
    byDay,
  };
}
