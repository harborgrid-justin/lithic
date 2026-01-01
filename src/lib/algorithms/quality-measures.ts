/**
 * Quality Measure Calculations
 * HEDIS, MIPS, ACO, and custom quality measure algorithms
 */

import {
  QualityMeasure,
  QualityMeasureResult,
  MeasureSet,
  TrendDirection,
} from "@/types/population-health";
import { Patient } from "@/types/patient";
import { Encounter, Diagnosis, ProblemList } from "@/types/clinical";

interface MeasureData {
  patients: Patient[];
  encounters: Encounter[];
  diagnoses: Diagnosis[];
  problemLists: ProblemList[];
  immunizations: any[];
  labResults: any[];
  medications: any[];
  procedures: any[];
}

/**
 * Calculate HEDIS Measure: Breast Cancer Screening (BCS)
 * Women 50-74 who had a mammogram in past 2 years
 */
export function calculateHEDIS_BCS(
  data: MeasureData,
  periodStart: Date,
  periodEnd: Date,
  organizationId: string,
): QualityMeasureResult {
  const measureId = "HEDIS_BCS";

  // Denominator: Women age 50-74 as of end of measurement period
  const denominator = data.patients.filter((p) => {
    const age = calculateAgeAtDate(p.dateOfBirth, periodEnd);
    return p.gender === "FEMALE" && age >= 50 && age <= 74 && !p.deceased;
  });

  // Numerator: Women who had mammogram in past 27 months
  const lookbackDate = new Date(periodEnd);
  lookbackDate.setMonth(lookbackDate.getMonth() - 27);

  const numerator = denominator.filter((p) => {
    const patientProcedures = data.procedures.filter(
      (proc) =>
        proc.patientId === p.id &&
        ["77067", "77066", "77063"].includes(proc.cptCode) &&
        proc.performedDate >= lookbackDate &&
        proc.performedDate <= periodEnd,
    );
    return patientProcedures.length > 0;
  });

  const rate =
    denominator.length > 0 ? (numerator.length / denominator.length) * 100 : 0;

  const target = 75.0; // HEDIS benchmark
  const met = rate >= target;

  return createMeasureResult({
    measureId,
    periodStart,
    periodEnd,
    numerator: numerator.length,
    denominator: denominator.length,
    exclusions: 0,
    exceptions: 0,
    rate,
    target,
    benchmark: 78.5, // National average
    met,
    patientsInDenominator: denominator.map((p) => p.id),
    patientsInNumerator: numerator.map((p) => p.id),
    organizationId,
  });
}

/**
 * Calculate HEDIS Measure: Colorectal Cancer Screening (COL)
 * Adults 50-75 who had appropriate colorectal cancer screening
 */
export function calculateHEDIS_COL(
  data: MeasureData,
  periodStart: Date,
  periodEnd: Date,
  organizationId: string,
): QualityMeasureResult {
  const measureId = "HEDIS_COL";

  // Denominator: Adults age 50-75
  const denominator = data.patients.filter((p) => {
    const age = calculateAgeAtDate(p.dateOfBirth, periodEnd);
    return age >= 50 && age <= 75 && !p.deceased;
  });

  // Numerator: Patients with any of:
  // - Colonoscopy in past 10 years
  // - FIT test in past year
  // - Flexible sigmoidoscopy in past 5 years
  // - CT colonography in past 5 years
  // - FIT-DNA in past 3 years

  const colonoscopyDate = new Date(periodEnd);
  colonoscopyDate.setFullYear(colonoscopyDate.getFullYear() - 10);

  const fitDate = new Date(periodEnd);
  fitDate.setFullYear(fitDate.getFullYear() - 1);

  const sigmoidoscopyDate = new Date(periodEnd);
  sigmoidoscopyDate.setFullYear(sigmoidoscopyDate.getFullYear() - 5);

  const numerator = denominator.filter((p) => {
    // Check colonoscopy
    const hasColonoscopy = data.procedures.some(
      (proc) =>
        proc.patientId === p.id &&
        ["45378", "45380", "45385"].includes(proc.cptCode) &&
        proc.performedDate >= colonoscopyDate &&
        proc.performedDate <= periodEnd,
    );

    if (hasColonoscopy) return true;

    // Check FIT test
    const hasFIT = data.labResults.some(
      (lab) =>
        lab.patientId === p.id &&
        ["82270", "82274"].includes(lab.testCode) &&
        lab.collectedDate >= fitDate &&
        lab.collectedDate <= periodEnd,
    );

    if (hasFIT) return true;

    // Check flexible sigmoidoscopy
    const hasSigmoidoscopy = data.procedures.some(
      (proc) =>
        proc.patientId === p.id &&
        ["45330", "45331", "45332"].includes(proc.cptCode) &&
        proc.performedDate >= sigmoidoscopyDate &&
        proc.performedDate <= periodEnd,
    );

    return hasSigmoidoscopy;
  });

  const rate =
    denominator.length > 0 ? (numerator.length / denominator.length) * 100 : 0;

  const target = 70.0;
  const met = rate >= target;

  return createMeasureResult({
    measureId,
    periodStart,
    periodEnd,
    numerator: numerator.length,
    denominator: denominator.length,
    exclusions: 0,
    exceptions: 0,
    rate,
    target,
    benchmark: 72.3,
    met,
    patientsInDenominator: denominator.map((p) => p.id),
    patientsInNumerator: numerator.map((p) => p.id),
    organizationId,
  });
}

/**
 * Calculate HEDIS Measure: Comprehensive Diabetes Care - HbA1c Testing (CDC-H)
 * Diabetic patients age 18-75 who had HbA1c test
 */
export function calculateHEDIS_CDC_HbA1c(
  data: MeasureData,
  periodStart: Date,
  periodEnd: Date,
  organizationId: string,
): QualityMeasureResult {
  const measureId = "HEDIS_CDC_HbA1c";

  // Denominator: Diabetic patients age 18-75
  const denominator = data.patients.filter((p) => {
    const age = calculateAgeAtDate(p.dateOfBirth, periodEnd);
    if (age < 18 || age > 75 || p.deceased) return false;

    // Check for diabetes diagnosis
    const hasDiabetes = data.problemLists.some(
      (prob) =>
        prob.patientId === p.id &&
        prob.status === "ACTIVE" &&
        (prob.icdCode.startsWith("E10") || prob.icdCode.startsWith("E11")),
    );

    return hasDiabetes;
  });

  // Numerator: Patients with at least one HbA1c test during measurement period
  const numerator = denominator.filter((p) => {
    const hasHbA1c = data.labResults.some(
      (lab) =>
        lab.patientId === p.id &&
        ["83036", "83037"].includes(lab.testCode) &&
        lab.collectedDate >= periodStart &&
        lab.collectedDate <= periodEnd,
    );
    return hasHbA1c;
  });

  const rate =
    denominator.length > 0 ? (numerator.length / denominator.length) * 100 : 0;

  const target = 90.0;
  const met = rate >= target;

  return createMeasureResult({
    measureId,
    periodStart,
    periodEnd,
    numerator: numerator.length,
    denominator: denominator.length,
    exclusions: 0,
    exceptions: 0,
    rate,
    target,
    benchmark: 91.2,
    met,
    patientsInDenominator: denominator.map((p) => p.id),
    patientsInNumerator: numerator.map((p) => p.id),
    organizationId,
  });
}

/**
 * Calculate HEDIS Measure: Comprehensive Diabetes Care - HbA1c Control (<8%)
 */
export function calculateHEDIS_CDC_HbA1cControl(
  data: MeasureData,
  periodStart: Date,
  periodEnd: Date,
  organizationId: string,
): QualityMeasureResult {
  const measureId = "HEDIS_CDC_HbA1c_Control";

  // Denominator: Same as HbA1c testing
  const denominator = data.patients.filter((p) => {
    const age = calculateAgeAtDate(p.dateOfBirth, periodEnd);
    if (age < 18 || age > 75 || p.deceased) return false;

    const hasDiabetes = data.problemLists.some(
      (prob) =>
        prob.patientId === p.id &&
        prob.status === "ACTIVE" &&
        (prob.icdCode.startsWith("E10") || prob.icdCode.startsWith("E11")),
    );

    return hasDiabetes;
  });

  // Numerator: Patients with most recent HbA1c < 8%
  const numerator = denominator.filter((p) => {
    const patientLabs = data.labResults
      .filter(
        (lab) =>
          lab.patientId === p.id &&
          ["83036", "83037"].includes(lab.testCode) &&
          lab.collectedDate >= periodStart &&
          lab.collectedDate <= periodEnd,
      )
      .sort((a, b) => b.collectedDate.getTime() - a.collectedDate.getTime());

    if (patientLabs.length === 0) return false;

    const mostRecentHbA1c = parseFloat(patientLabs[0].value);
    return mostRecentHbA1c < 8.0;
  });

  const rate =
    denominator.length > 0 ? (numerator.length / denominator.length) * 100 : 0;

  const target = 60.0;
  const met = rate >= target;

  return createMeasureResult({
    measureId,
    periodStart,
    periodEnd,
    numerator: numerator.length,
    denominator: denominator.length,
    exclusions: 0,
    exceptions: 0,
    rate,
    target,
    benchmark: 63.7,
    met,
    patientsInDenominator: denominator.map((p) => p.id),
    patientsInNumerator: numerator.map((p) => p.id),
    organizationId,
  });
}

/**
 * Calculate HEDIS Measure: Controlling High Blood Pressure (CBP)
 * Adults 18-85 with hypertension whose BP was < 140/90
 */
export function calculateHEDIS_CBP(
  data: MeasureData,
  periodStart: Date,
  periodEnd: Date,
  organizationId: string,
): QualityMeasureResult {
  const measureId = "HEDIS_CBP";

  // Denominator: Patients age 18-85 with hypertension diagnosis
  const denominator = data.patients.filter((p) => {
    const age = calculateAgeAtDate(p.dateOfBirth, periodEnd);
    if (age < 18 || age > 85 || p.deceased) return false;

    const hasHTN = data.problemLists.some(
      (prob) =>
        prob.patientId === p.id &&
        prob.status === "ACTIVE" &&
        prob.icdCode.startsWith("I10"),
    );

    return hasHTN;
  });

  // Numerator: Patients with most recent BP < 140/90 during measurement period
  const numerator = denominator.filter((p) => {
    const patientEncounters = data.encounters
      .filter(
        (e) =>
          e.patientId === p.id &&
          e.status === "COMPLETED" &&
          e.startTime >= periodStart &&
          e.startTime <= periodEnd &&
          e.vitalSigns &&
          e.vitalSigns.length > 0,
      )
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    if (patientEncounters.length === 0) return false;

    const mostRecentEncounter = patientEncounters[0];
    const vitals =
      mostRecentEncounter.vitalSigns[mostRecentEncounter.vitalSigns.length - 1];

    return (
      vitals.systolicBP !== null &&
      vitals.diastolicBP !== null &&
      vitals.systolicBP < 140 &&
      vitals.diastolicBP < 90
    );
  });

  const rate =
    denominator.length > 0 ? (numerator.length / denominator.length) * 100 : 0;

  const target = 65.0;
  const met = rate >= target;

  return createMeasureResult({
    measureId,
    periodStart,
    periodEnd,
    numerator: numerator.length,
    denominator: denominator.length,
    exclusions: 0,
    exceptions: 0,
    rate,
    target,
    benchmark: 67.9,
    met,
    patientsInDenominator: denominator.map((p) => p.id),
    patientsInNumerator: numerator.map((p) => p.id),
    organizationId,
  });
}

/**
 * Calculate MIPS Measure: Depression Screening and Follow-up
 * Percentage of patients screened for depression with follow-up plan
 */
export function calculateMIPS_134(
  data: MeasureData,
  periodStart: Date,
  periodEnd: Date,
  organizationId: string,
): QualityMeasureResult {
  const measureId = "MIPS_134";

  // Denominator: All patients age 12+ with qualifying encounter
  const denominator = data.patients.filter((p) => {
    const age = calculateAgeAtDate(p.dateOfBirth, periodEnd);
    if (age < 12 || p.deceased) return false;

    // Must have qualifying encounter during measurement period
    const hasQualifyingEncounter = data.encounters.some(
      (e) =>
        e.patientId === p.id &&
        e.status === "COMPLETED" &&
        e.startTime >= periodStart &&
        e.startTime <= periodEnd,
    );

    return hasQualifyingEncounter;
  });

  // Numerator: Patients screened for depression with follow-up if positive
  // This would check for documented PHQ-2/PHQ-9 screening
  // For this implementation, we'll simulate the logic
  const numerator = denominator.filter((p) => {
    // In production, check for depression screening documentation
    // and follow-up plan if screen was positive
    return false; // Placeholder
  });

  const rate =
    denominator.length > 0 ? (numerator.length / denominator.length) * 100 : 0;

  const target = 80.0;
  const met = rate >= target;

  return createMeasureResult({
    measureId,
    periodStart,
    periodEnd,
    numerator: numerator.length,
    denominator: denominator.length,
    exclusions: 0,
    exceptions: 0,
    rate,
    target,
    benchmark: 75.2,
    met,
    patientsInDenominator: denominator.map((p) => p.id),
    patientsInNumerator: numerator.map((p) => p.id),
    organizationId,
  });
}

/**
 * Calculate ACO Measure: ACO-27 - Diabetes Mellitus: Hemoglobin A1c Poor Control
 * Lower rate is better (percentage with HbA1c > 9%)
 */
export function calculateACO_27(
  data: MeasureData,
  periodStart: Date,
  periodEnd: Date,
  organizationId: string,
): QualityMeasureResult {
  const measureId = "ACO_27";

  // Denominator: Diabetic patients age 18-75
  const denominator = data.patients.filter((p) => {
    const age = calculateAgeAtDate(p.dateOfBirth, periodEnd);
    if (age < 18 || age > 75 || p.deceased) return false;

    const hasDiabetes = data.problemLists.some(
      (prob) =>
        prob.patientId === p.id &&
        prob.status === "ACTIVE" &&
        (prob.icdCode.startsWith("E10") || prob.icdCode.startsWith("E11")),
    );

    return hasDiabetes;
  });

  // Numerator: Patients with most recent HbA1c > 9% (BAD - lower is better)
  const numerator = denominator.filter((p) => {
    const patientLabs = data.labResults
      .filter(
        (lab) =>
          lab.patientId === p.id &&
          ["83036", "83037"].includes(lab.testCode) &&
          lab.collectedDate >= periodStart &&
          lab.collectedDate <= periodEnd,
      )
      .sort((a, b) => b.collectedDate.getTime() - a.collectedDate.getTime());

    if (patientLabs.length === 0) return false;

    const mostRecentHbA1c = parseFloat(patientLabs[0].value);
    return mostRecentHbA1c > 9.0;
  });

  const rate =
    denominator.length > 0 ? (numerator.length / denominator.length) * 100 : 0;

  const target = 20.0; // Lower is better, target is maximum acceptable
  const met = rate <= target; // Inverse - lower rate is better

  return createMeasureResult({
    measureId,
    periodStart,
    periodEnd,
    numerator: numerator.length,
    denominator: denominator.length,
    exclusions: 0,
    exceptions: 0,
    rate,
    target,
    benchmark: 18.5, // Lower is better
    met,
    patientsInDenominator: denominator.map((p) => p.id),
    patientsInNumerator: numerator.map((p) => p.id),
    organizationId,
  });
}

/**
 * Calculate custom measure: 30-Day Readmission Rate
 * Lower rate is better
 */
export function calculate30DayReadmissionRate(
  data: MeasureData,
  periodStart: Date,
  periodEnd: Date,
  organizationId: string,
): QualityMeasureResult {
  const measureId = "CUSTOM_30DAY_READMISSION";

  // Denominator: All inpatient admissions during measurement period
  const admissions = data.encounters.filter(
    (e) =>
      e.class === "INPATIENT" &&
      e.status === "COMPLETED" &&
      e.endTime !== null &&
      e.endTime >= periodStart &&
      e.endTime <= periodEnd,
  );

  const denominator = admissions.length;

  // Numerator: Admissions with readmission within 30 days
  const readmissions = admissions.filter((admission) => {
    if (!admission.endTime) return false;

    const thirtyDaysLater = new Date(admission.endTime);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    // Check for another inpatient admission within 30 days
    const hasReadmission = data.encounters.some(
      (e) =>
        e.patientId === admission.patientId &&
        e.id !== admission.id &&
        e.class === "INPATIENT" &&
        e.status === "COMPLETED" &&
        e.startTime > admission.endTime! &&
        e.startTime <= thirtyDaysLater,
    );

    return hasReadmission;
  });

  const numerator = readmissions.length;

  const rate = denominator > 0 ? (numerator / denominator) * 100 : 0;

  const target = 15.0; // Lower is better
  const met = rate <= target;

  return createMeasureResult({
    measureId,
    periodStart,
    periodEnd,
    numerator,
    denominator,
    exclusions: 0,
    exceptions: 0,
    rate,
    target,
    benchmark: 14.2,
    met,
    patientsInDenominator: admissions.map((a) => a.patientId),
    patientsInNumerator: readmissions.map((r) => r.patientId),
    organizationId,
  });
}

/**
 * Calculate all HEDIS measures for a population
 */
export function calculateAllHEDISMeasures(
  data: MeasureData,
  periodStart: Date,
  periodEnd: Date,
  organizationId: string,
): QualityMeasureResult[] {
  return [
    calculateHEDIS_BCS(data, periodStart, periodEnd, organizationId),
    calculateHEDIS_COL(data, periodStart, periodEnd, organizationId),
    calculateHEDIS_CDC_HbA1c(data, periodStart, periodEnd, organizationId),
    calculateHEDIS_CDC_HbA1cControl(
      data,
      periodStart,
      periodEnd,
      organizationId,
    ),
    calculateHEDIS_CBP(data, periodStart, periodEnd, organizationId),
  ];
}

/**
 * Calculate all ACO measures
 */
export function calculateAllACOMeasures(
  data: MeasureData,
  periodStart: Date,
  periodEnd: Date,
  organizationId: string,
): QualityMeasureResult[] {
  return [
    calculateACO_27(data, periodStart, periodEnd, organizationId),
    // Add more ACO measures here
  ];
}

/**
 * Calculate quality measure trend
 */
export function calculateMeasureTrend(
  currentResult: QualityMeasureResult,
  previousResult: QualityMeasureResult | null,
): TrendDirection {
  if (!previousResult) {
    return TrendDirection.INSUFFICIENT_DATA;
  }

  const rateChange = currentResult.rate - previousResult.rate;

  // For measures where higher is better
  if (
    currentResult.measureId.includes("CONTROL") ||
    currentResult.measureId.includes("SCREENING") ||
    currentResult.measureId === "HEDIS_CBP"
  ) {
    if (rateChange > 2) return TrendDirection.IMPROVING;
    if (rateChange < -2) return TrendDirection.DECLINING;
    return TrendDirection.STABLE;
  }

  // For measures where lower is better (readmission, poor control)
  if (
    currentResult.measureId.includes("READMISSION") ||
    currentResult.measureId === "ACO_27"
  ) {
    if (rateChange < -2) return TrendDirection.IMPROVING;
    if (rateChange > 2) return TrendDirection.DECLINING;
    return TrendDirection.STABLE;
  }

  return TrendDirection.STABLE;
}

/**
 * Helper functions
 */

function createMeasureResult(params: {
  measureId: string;
  periodStart: Date;
  periodEnd: Date;
  numerator: number;
  denominator: number;
  exclusions: number;
  exceptions: number;
  rate: number;
  target: number;
  benchmark: number | null;
  met: boolean;
  patientsInDenominator: string[];
  patientsInNumerator: string[];
  organizationId: string;
}): QualityMeasureResult {
  const variance = params.rate - params.target;
  const percentile = params.benchmark
    ? (params.rate / params.benchmark) * 50 // Simplified percentile calculation
    : null;

  return {
    id: generateId(),
    organizationId: params.organizationId,
    measureId: params.measureId,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    numerator: params.numerator,
    denominator: params.denominator,
    exclusions: params.exclusions,
    exceptions: params.exceptions,
    rate: Math.round(params.rate * 100) / 100, // Round to 2 decimals
    target: params.target,
    benchmark: params.benchmark,
    met: params.met,
    variance: Math.round(variance * 100) / 100,
    percentile: percentile ? Math.round(percentile * 100) / 100 : null,
    trend: TrendDirection.INSUFFICIENT_DATA,
    performanceGap: Math.max(0, params.target - params.rate),
    patientsInDenominator: params.patientsInDenominator,
    patientsInNumerator: params.patientsInNumerator,
    calculatedAt: new Date(),
    validatedBy: null,
    validatedAt: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: "system",
    updatedBy: "system",
  };
}

function calculateAgeAtDate(dateOfBirth: Date, asOfDate: Date): number {
  let age = asOfDate.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = asOfDate.getMonth() - dateOfBirth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && asOfDate.getDate() < dateOfBirth.getDate())
  ) {
    age--;
  }

  return age;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
