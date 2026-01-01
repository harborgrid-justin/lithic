/**
 * Patient Experience KPIs
 * Satisfaction scores, NPS tracking, complaint trends, and response times
 */

import { z } from 'zod';

// ============================================================================
// Types & Schemas
// ============================================================================

export const PatientExperienceDataSchema = z.object({
  date: z.string(),
  facility: z.string().optional(),
  department: z.string().optional(),

  // Survey responses
  surveysCompleted: z.number(),
  surveysSent: z.number(),

  // HCAHPS domains
  communicationWithNurses: z.number(),
  communicationWithDoctors: z.number(),
  responsivenessOfStaff: z.number(),
  painManagement: z.number(),
  communicationAboutMedicines: z.number(),
  cleanlinessOfEnvironment: z.number(),
  quietnessOfEnvironment: z.number(),
  dischargeInformation: z.number(),
  overallRating: z.number(),
  wouldRecommend: z.number(),

  // NPS
  promoters: z.number(),
  passives: z.number(),
  detractors: z.number(),

  // Complaints
  complaints: z.number(),
  complaintsClosed: z.number(),
  avgResolutionTime: z.number(), // hours

  // Accessibility
  phoneAnswerTime: z.number(), // seconds
  appointmentSchedulingTime: z.number(), // minutes
  appointmentAvailability: z.number(), // days until next available

  // Digital engagement
  portalActivations: z.number(),
  portalLogins: z.number(),
  mobileAppUsage: z.number(),
});

export type PatientExperienceData = z.infer<typeof PatientExperienceDataSchema>;

export interface PatientExperienceKPI {
  id: string;
  name: string;
  description: string;
  value: number;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  target?: number;
  benchmark?: number;
  status?: 'success' | 'warning' | 'danger';
  format: 'number' | 'percentage' | 'score' | 'nps' | 'time';
  category: 'satisfaction' | 'nps' | 'complaints' | 'accessibility' | 'engagement';
}

// ============================================================================
// Satisfaction Scores
// ============================================================================

/**
 * Calculate overall HCAHPS composite score
 */
export function calculateHCAHPSComposite(data: PatientExperienceData[]): PatientExperienceKPI {
  const domains = [
    'communicationWithNurses',
    'communicationWithDoctors',
    'responsivenessOfStaff',
    'painManagement',
    'communicationAboutMedicines',
    'cleanlinessOfEnvironment',
    'quietnessOfEnvironment',
    'dischargeInformation',
  ] as const;

  let totalScore = 0;
  let count = 0;

  data.forEach(d => {
    domains.forEach(domain => {
      totalScore += d[domain];
      count++;
    });
  });

  const avgScore = count > 0 ? totalScore / count : 0;

  return {
    id: 'hcahps-composite',
    name: 'HCAHPS Composite Score',
    description: 'Average across all HCAHPS domains',
    value: avgScore,
    target: 75,
    benchmark: 70,
    format: 'percentage',
    category: 'satisfaction',
    status: avgScore >= 75 ? 'success' : avgScore >= 70 ? 'warning' : 'danger',
  };
}

/**
 * Calculate communication with nurses score
 */
export function calculateNursesCommunication(data: PatientExperienceData[]): PatientExperienceKPI {
  const totalScore = data.reduce((sum, d) => sum + d.communicationWithNurses, 0);
  const avgScore = data.length > 0 ? totalScore / data.length : 0;

  return {
    id: 'nurses-communication',
    name: 'Communication with Nurses',
    description: 'Patients rating nurse communication as "always"',
    value: avgScore,
    target: 80,
    benchmark: 75,
    format: 'percentage',
    category: 'satisfaction',
    status: avgScore >= 80 ? 'success' : avgScore >= 75 ? 'warning' : 'danger',
  };
}

/**
 * Calculate communication with doctors score
 */
export function calculateDoctorsCommunication(data: PatientExperienceData[]): PatientExperienceKPI {
  const totalScore = data.reduce((sum, d) => sum + d.communicationWithDoctors, 0);
  const avgScore = data.length > 0 ? totalScore / data.length : 0;

  return {
    id: 'doctors-communication',
    name: 'Communication with Doctors',
    description: 'Patients rating doctor communication as "always"',
    value: avgScore,
    target: 82,
    benchmark: 78,
    format: 'percentage',
    category: 'satisfaction',
    status: avgScore >= 82 ? 'success' : avgScore >= 78 ? 'warning' : 'danger',
  };
}

/**
 * Calculate staff responsiveness score
 */
export function calculateStaffResponsiveness(data: PatientExperienceData[]): PatientExperienceKPI {
  const totalScore = data.reduce((sum, d) => sum + d.responsivenessOfStaff, 0);
  const avgScore = data.length > 0 ? totalScore / data.length : 0;

  return {
    id: 'staff-responsiveness',
    name: 'Staff Responsiveness',
    description: 'Patients rating staff responsiveness as "always"',
    value: avgScore,
    target: 70,
    benchmark: 65,
    format: 'percentage',
    category: 'satisfaction',
    status: avgScore >= 70 ? 'success' : avgScore >= 65 ? 'warning' : 'danger',
  };
}

/**
 * Calculate overall hospital rating
 */
export function calculateOverallRating(data: PatientExperienceData[]): PatientExperienceKPI {
  const totalRating = data.reduce((sum, d) => sum + d.overallRating, 0);
  const avgRating = data.length > 0 ? totalRating / data.length : 0;

  return {
    id: 'overall-rating',
    name: 'Overall Hospital Rating',
    description: 'Patients rating hospital 9-10 out of 10',
    value: avgRating,
    target: 75,
    benchmark: 70,
    format: 'percentage',
    category: 'satisfaction',
    status: avgRating >= 75 ? 'success' : avgRating >= 70 ? 'warning' : 'danger',
  };
}

/**
 * Calculate willingness to recommend
 */
export function calculateWouldRecommend(data: PatientExperienceData[]): PatientExperienceKPI {
  const totalRecommend = data.reduce((sum, d) => sum + d.wouldRecommend, 0);
  const avgRecommend = data.length > 0 ? totalRecommend / data.length : 0;

  return {
    id: 'would-recommend',
    name: 'Would Recommend',
    description: 'Patients who would definitely recommend',
    value: avgRecommend,
    target: 72,
    benchmark: 68,
    format: 'percentage',
    category: 'satisfaction',
    status: avgRecommend >= 72 ? 'success' : avgRecommend >= 68 ? 'warning' : 'danger',
  };
}

/**
 * Calculate survey response rate
 */
export function calculateSurveyResponseRate(data: PatientExperienceData[]): PatientExperienceKPI {
  const totalCompleted = data.reduce((sum, d) => sum + d.surveysCompleted, 0);
  const totalSent = data.reduce((sum, d) => sum + d.surveysSent, 0);

  const responseRate = totalSent > 0 ? (totalCompleted / totalSent) * 100 : 0;

  return {
    id: 'survey-response-rate',
    name: 'Survey Response Rate',
    description: 'Percentage of surveys completed',
    value: responseRate,
    target: 30,
    benchmark: 25,
    format: 'percentage',
    category: 'satisfaction',
    status: responseRate >= 30 ? 'success' : responseRate >= 25 ? 'warning' : 'danger',
  };
}

// ============================================================================
// Net Promoter Score (NPS)
// ============================================================================

/**
 * Calculate Net Promoter Score
 */
export function calculateNPS(data: PatientExperienceData[]): PatientExperienceKPI {
  const totalPromoters = data.reduce((sum, d) => sum + d.promoters, 0);
  const totalPassives = data.reduce((sum, d) => sum + d.passives, 0);
  const totalDetractors = data.reduce((sum, d) => sum + d.detractors, 0);

  const totalResponses = totalPromoters + totalPassives + totalDetractors;

  const nps = totalResponses > 0
    ? ((totalPromoters - totalDetractors) / totalResponses) * 100
    : 0;

  return {
    id: 'nps',
    name: 'Net Promoter Score',
    description: 'Patient likelihood to recommend (NPS)',
    value: Math.round(nps),
    target: 50,
    benchmark: 40,
    format: 'nps',
    category: 'nps',
    status: nps >= 50 ? 'success' : nps >= 40 ? 'warning' : 'danger',
  };
}

/**
 * Calculate promoter percentage
 */
export function calculatePromoterPercentage(data: PatientExperienceData[]): PatientExperienceKPI {
  const totalPromoters = data.reduce((sum, d) => sum + d.promoters, 0);
  const totalResponses = data.reduce(
    (sum, d) => sum + d.promoters + d.passives + d.detractors,
    0
  );

  const promoterPct = totalResponses > 0 ? (totalPromoters / totalResponses) * 100 : 0;

  return {
    id: 'promoter-percentage',
    name: 'Promoter Percentage',
    description: 'Percentage of patients rating 9-10',
    value: promoterPct,
    target: 60,
    benchmark: 55,
    format: 'percentage',
    category: 'nps',
    status: promoterPct >= 60 ? 'success' : promoterPct >= 55 ? 'warning' : 'danger',
  };
}

/**
 * Calculate detractor percentage
 */
export function calculateDetractorPercentage(data: PatientExperienceData[]): PatientExperienceKPI {
  const totalDetractors = data.reduce((sum, d) => sum + d.detractors, 0);
  const totalResponses = data.reduce(
    (sum, d) => sum + d.promoters + d.passives + d.detractors,
    0
  );

  const detractorPct = totalResponses > 0 ? (totalDetractors / totalResponses) * 100 : 0;

  return {
    id: 'detractor-percentage',
    name: 'Detractor Percentage',
    description: 'Percentage of patients rating 0-6',
    value: detractorPct,
    target: 10,
    benchmark: 15,
    format: 'percentage',
    category: 'nps',
    status: detractorPct <= 10 ? 'success' : detractorPct <= 15 ? 'warning' : 'danger',
  };
}

// ============================================================================
// Complaint Trends
// ============================================================================

/**
 * Calculate complaint rate
 */
export function calculateComplaintRate(
  data: PatientExperienceData[],
  encounters: number
): PatientExperienceKPI {
  const totalComplaints = data.reduce((sum, d) => sum + d.complaints, 0);

  const rate = encounters > 0 ? (totalComplaints / encounters) * 1000 : 0;

  return {
    id: 'complaint-rate',
    name: 'Complaint Rate',
    description: 'Complaints per 1000 patient encounters',
    value: rate,
    target: 5,
    benchmark: 8,
    format: 'number',
    category: 'complaints',
    status: rate <= 5 ? 'success' : rate <= 8 ? 'warning' : 'danger',
  };
}

/**
 * Calculate complaint closure rate
 */
export function calculateComplaintClosureRate(data: PatientExperienceData[]): PatientExperienceKPI {
  const totalClosed = data.reduce((sum, d) => sum + d.complaintsClosed, 0);
  const totalComplaints = data.reduce((sum, d) => sum + d.complaints, 0);

  const closureRate = totalComplaints > 0 ? (totalClosed / totalComplaints) * 100 : 0;

  return {
    id: 'complaint-closure-rate',
    name: 'Complaint Closure Rate',
    description: 'Percentage of complaints resolved',
    value: closureRate,
    target: 95,
    benchmark: 90,
    format: 'percentage',
    category: 'complaints',
    status: closureRate >= 95 ? 'success' : closureRate >= 90 ? 'warning' : 'danger',
  };
}

/**
 * Calculate average complaint resolution time
 */
export function calculateComplaintResolutionTime(data: PatientExperienceData[]): PatientExperienceKPI {
  const totalResolutionTime = data.reduce((sum, d) => sum + d.avgResolutionTime, 0);
  const count = data.filter(d => d.complaintsClosed > 0).length;

  const avgTime = count > 0 ? totalResolutionTime / count : 0;

  // Convert hours to days
  const avgDays = avgTime / 24;

  return {
    id: 'complaint-resolution-time',
    name: 'Complaint Resolution Time',
    description: 'Average days to resolve complaints',
    value: avgDays,
    target: 5,
    benchmark: 7,
    format: 'number',
    category: 'complaints',
    status: avgDays <= 5 ? 'success' : avgDays <= 7 ? 'warning' : 'danger',
  };
}

// ============================================================================
// Accessibility & Response Times
// ============================================================================

/**
 * Calculate phone answer time
 */
export function calculatePhoneAnswerTime(data: PatientExperienceData[]): PatientExperienceKPI {
  const totalTime = data.reduce((sum, d) => sum + d.phoneAnswerTime, 0);
  const count = data.length;

  const avgTime = count > 0 ? totalTime / count : 0;

  return {
    id: 'phone-answer-time',
    name: 'Phone Answer Time',
    description: 'Average seconds to answer patient calls',
    value: Math.round(avgTime),
    target: 30,
    benchmark: 45,
    format: 'time',
    category: 'accessibility',
    status: avgTime <= 30 ? 'success' : avgTime <= 45 ? 'warning' : 'danger',
  };
}

/**
 * Calculate appointment scheduling time
 */
export function calculateSchedulingTime(data: PatientExperienceData[]): PatientExperienceKPI {
  const totalTime = data.reduce((sum, d) => sum + d.appointmentSchedulingTime, 0);
  const count = data.length;

  const avgTime = count > 0 ? totalTime / count : 0;

  return {
    id: 'appointment-scheduling-time',
    name: 'Appointment Scheduling Time',
    description: 'Average minutes to schedule appointment',
    value: Math.round(avgTime),
    target: 5,
    benchmark: 8,
    format: 'time',
    category: 'accessibility',
    status: avgTime <= 5 ? 'success' : avgTime <= 8 ? 'warning' : 'danger',
  };
}

/**
 * Calculate appointment availability
 */
export function calculateAppointmentAvailability(data: PatientExperienceData[]): PatientExperienceKPI {
  const totalDays = data.reduce((sum, d) => sum + d.appointmentAvailability, 0);
  const count = data.length;

  const avgDays = count > 0 ? totalDays / count : 0;

  return {
    id: 'appointment-availability',
    name: 'Appointment Availability',
    description: 'Average days until next available appointment',
    value: Math.round(avgDays),
    target: 7,
    benchmark: 14,
    format: 'number',
    category: 'accessibility',
    status: avgDays <= 7 ? 'success' : avgDays <= 14 ? 'warning' : 'danger',
  };
}

// ============================================================================
// Digital Engagement
// ============================================================================

/**
 * Calculate patient portal activation rate
 */
export function calculatePortalActivationRate(
  data: PatientExperienceData[],
  totalPatients: number
): PatientExperienceKPI {
  const totalActivations = data.reduce((sum, d) => sum + d.portalActivations, 0);

  const activationRate = totalPatients > 0 ? (totalActivations / totalPatients) * 100 : 0;

  return {
    id: 'portal-activation-rate',
    name: 'Patient Portal Activation Rate',
    description: 'Percentage of patients with active portal accounts',
    value: activationRate,
    target: 70,
    benchmark: 60,
    format: 'percentage',
    category: 'engagement',
    status: activationRate >= 70 ? 'success' : activationRate >= 60 ? 'warning' : 'danger',
  };
}

/**
 * Calculate portal engagement rate
 */
export function calculatePortalEngagement(data: PatientExperienceData[]): PatientExperienceKPI {
  const totalLogins = data.reduce((sum, d) => sum + d.portalLogins, 0);
  const totalActivations = data.reduce((sum, d) => sum + d.portalActivations, 0);

  const engagementRate = totalActivations > 0 ? (totalLogins / totalActivations) : 0;

  return {
    id: 'portal-engagement',
    name: 'Portal Engagement Rate',
    description: 'Average logins per activated user',
    value: engagementRate,
    target: 5,
    benchmark: 3,
    format: 'number',
    category: 'engagement',
    status: engagementRate >= 5 ? 'success' : engagementRate >= 3 ? 'warning' : 'danger',
  };
}

/**
 * Calculate mobile app usage
 */
export function calculateMobileAppUsage(data: PatientExperienceData[]): PatientExperienceKPI {
  const totalUsage = data.reduce((sum, d) => sum + d.mobileAppUsage, 0);
  const days = data.length;

  const avgDailyUsage = days > 0 ? totalUsage / days : 0;

  return {
    id: 'mobile-app-usage',
    name: 'Daily Mobile App Sessions',
    description: 'Average daily mobile app sessions',
    value: Math.round(avgDailyUsage),
    format: 'number',
    category: 'engagement',
  };
}

// ============================================================================
// Comprehensive Dashboard Data
// ============================================================================

/**
 * Calculate all patient experience KPIs
 */
export function calculateAllPatientExperienceKPIs(
  data: PatientExperienceData[],
  encounters?: number,
  totalPatients?: number
): PatientExperienceKPI[] {
  const kpis: PatientExperienceKPI[] = [];

  // Satisfaction
  kpis.push(calculateHCAHPSComposite(data));
  kpis.push(calculateNursesCommunication(data));
  kpis.push(calculateDoctorsCommunication(data));
  kpis.push(calculateStaffResponsiveness(data));
  kpis.push(calculateOverallRating(data));
  kpis.push(calculateWouldRecommend(data));
  kpis.push(calculateSurveyResponseRate(data));

  // NPS
  kpis.push(calculateNPS(data));
  kpis.push(calculatePromoterPercentage(data));
  kpis.push(calculateDetractorPercentage(data));

  // Complaints
  if (encounters) {
    kpis.push(calculateComplaintRate(data, encounters));
  }
  kpis.push(calculateComplaintClosureRate(data));
  kpis.push(calculateComplaintResolutionTime(data));

  // Accessibility
  kpis.push(calculatePhoneAnswerTime(data));
  kpis.push(calculateSchedulingTime(data));
  kpis.push(calculateAppointmentAvailability(data));

  // Engagement
  if (totalPatients) {
    kpis.push(calculatePortalActivationRate(data, totalPatients));
  }
  kpis.push(calculatePortalEngagement(data));
  kpis.push(calculateMobileAppUsage(data));

  return kpis;
}

/**
 * Get patient experience trends over time
 */
export function getPatientExperienceTrends(
  data: PatientExperienceData[],
  groupBy: 'day' | 'week' | 'month'
): Array<{
  period: string;
  hcahpsScore: number;
  nps: number;
  complaintRate: number;
  portalActivations: number;
}> {
  // Group data by period
  const grouped = new Map<string, PatientExperienceData[]>();

  data.forEach(d => {
    const period = formatPeriod(d.date, groupBy);
    if (!grouped.has(period)) {
      grouped.set(period, []);
    }
    grouped.get(period)!.push(d);
  });

  // Calculate metrics for each period
  return Array.from(grouped.entries())
    .map(([period, periodData]) => ({
      period,
      hcahpsScore: calculateHCAHPSComposite(periodData).value,
      nps: calculateNPS(periodData).value,
      complaintRate: calculateComplaintRate(periodData, 1000).value,
      portalActivations: periodData.reduce((sum, d) => sum + d.portalActivations, 0),
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatPeriod(date: string, groupBy: 'day' | 'week' | 'month'): string {
  const d = new Date(date);

  switch (groupBy) {
    case 'day':
      return date;
    case 'week':
      const week = Math.floor(d.getDate() / 7);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-W${week}`;
    case 'month':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    default:
      return date;
  }
}
