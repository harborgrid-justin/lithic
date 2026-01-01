/**
 * Care Gaps Detection Algorithms
 * Evidence-based identification of preventive care and chronic disease management gaps
 */

import {
  CareGap,
  CareGapType,
  CareGapCategory,
  GapPriority,
  CareGapStatus,
  GapEvidence,
} from "@/types/population-health";
import { Patient } from "@/types/patient";
import { Encounter, Diagnosis, ProblemList } from "@/types/clinical";

interface PatientData {
  patient: Patient;
  encounters: Encounter[];
  diagnoses: Diagnosis[];
  problemList: ProblemList[];
  immunizations: any[];
  labResults: any[];
  medications: any[];
}

interface GapDetectionResult {
  gaps: CareGap[];
  summary: {
    total: number;
    byCategory: Record<CareGapCategory, number>;
    byPriority: Record<GapPriority, number>;
  };
}

/**
 * Main function to identify all care gaps for a patient
 */
export function identifyCareGaps(
  data: PatientData,
  organizationId: string,
): GapDetectionResult {
  const gaps: CareGap[] = [];

  // Preventive care gaps
  gaps.push(...identifyPreventiveCareGaps(data, organizationId));

  // Chronic disease management gaps
  gaps.push(...identifyChronicCareGaps(data, organizationId));

  // Immunization gaps
  gaps.push(...identifyImmunizationGaps(data, organizationId));

  // Screening gaps
  gaps.push(...identifyScreeningGaps(data, organizationId));

  // Medication adherence gaps
  gaps.push(...identifyMedicationGaps(data, organizationId));

  // Calculate summary
  const summary = {
    total: gaps.length,
    byCategory: {
      PREVENTIVE: gaps.filter((g) => g.category === CareGapCategory.PREVENTIVE)
        .length,
      CHRONIC_DISEASE: gaps.filter(
        (g) => g.category === CareGapCategory.CHRONIC_DISEASE,
      ).length,
      ACUTE_CARE: gaps.filter((g) => g.category === CareGapCategory.ACUTE_CARE)
        .length,
      BEHAVIORAL_HEALTH: gaps.filter(
        (g) => g.category === CareGapCategory.BEHAVIORAL_HEALTH,
      ).length,
      MEDICATION: gaps.filter((g) => g.category === CareGapCategory.MEDICATION)
        .length,
    } as Record<CareGapCategory, number>,
    byPriority: {
      LOW: gaps.filter((g) => g.priority === GapPriority.LOW).length,
      MEDIUM: gaps.filter((g) => g.priority === GapPriority.MEDIUM).length,
      HIGH: gaps.filter((g) => g.priority === GapPriority.HIGH).length,
      URGENT: gaps.filter((g) => g.priority === GapPriority.URGENT).length,
      CRITICAL: gaps.filter((g) => g.priority === GapPriority.CRITICAL).length,
    } as Record<GapPriority, number>,
  };

  return { gaps, summary };
}

/**
 * Identify preventive care gaps based on age and gender
 */
function identifyPreventiveCareGaps(
  data: PatientData,
  organizationId: string,
): CareGap[] {
  const gaps: CareGap[] = [];
  const age = calculateAge(data.patient.dateOfBirth);
  const gender = data.patient.gender;

  // Annual Wellness Visit
  const lastWellnessVisit = findMostRecentEncounter(data.encounters, [
    "PREVENTIVE",
    "OFFICE_VISIT",
  ]);
  if (!lastWellnessVisit || daysSince(lastWellnessVisit.startTime) > 365) {
    gaps.push(
      createCareGap({
        organizationId,
        patientId: data.patient.id,
        gapType: CareGapType.FOLLOW_UP_VISIT,
        category: CareGapCategory.PREVENTIVE,
        title: "Annual Wellness Visit Due",
        description:
          "Patient has not had an annual wellness visit in the past 12 months",
        priority: GapPriority.MEDIUM,
        dueDate: addDays(new Date(), 30),
        evidence: [
          {
            type: "Last Visit",
            description: lastWellnessVisit
              ? `Last visit was ${daysSince(lastWellnessVisit.startTime)} days ago`
              : "No wellness visit on record",
            date: lastWellnessVisit?.startTime || null,
            value: null,
            source: "Encounter History",
          },
        ],
        recommendations: [
          "Schedule annual physical exam",
          "Review preventive care checklist",
          "Update health history and medications",
        ],
      }),
    );
  }

  // Blood Pressure Screening (adults)
  if (age >= 18) {
    const lastBPReading = findMostRecentVitals(
      data.encounters,
      "blood_pressure",
    );
    if (!lastBPReading || daysSince(lastBPReading) > 730) {
      // 2 years
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.PREVENTIVE_SCREENING,
          category: CareGapCategory.PREVENTIVE,
          title: "Blood Pressure Screening Due",
          description:
            "Blood pressure screening recommended every 2 years for adults",
          priority: GapPriority.MEDIUM,
          dueDate: addDays(new Date(), 60),
          evidence: [
            {
              type: "Vital Signs",
              description: "No recent blood pressure reading",
              date: lastBPReading,
              value: null,
              source: "Vital Signs",
            },
          ],
          recommendations: [
            "Measure blood pressure at next visit",
            "Consider home BP monitoring if indicated",
          ],
        }),
      );
    }
  }

  // Cholesterol Screening (adults 40-75)
  if (age >= 40 && age <= 75) {
    const lastLipidPanel = findMostRecentLab(data.labResults, [
      "80061",
      "83721",
    ]); // Lipid panel CPT codes
    if (!lastLipidPanel || daysSince(lastLipidPanel.collectedDate) > 1825) {
      // 5 years
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.LAB_TEST,
          category: CareGapCategory.PREVENTIVE,
          title: "Lipid Panel Due",
          description:
            "Cholesterol screening recommended every 5 years for adults 40-75",
          priority: GapPriority.MEDIUM,
          dueDate: addDays(new Date(), 90),
          evidence: [
            {
              type: "Lab Test",
              description: lastLipidPanel
                ? `Last lipid panel was ${daysSince(lastLipidPanel.collectedDate)} days ago`
                : "No lipid panel on record",
              date: lastLipidPanel?.collectedDate || null,
              value: null,
              source: "Lab Results",
            },
          ],
          recommendations: [
            "Order fasting lipid panel",
            "Assess cardiovascular risk factors",
          ],
        }),
      );
    }
  }

  // Colorectal Cancer Screening (age 45-75)
  if (age >= 45 && age <= 75) {
    const lastColonoscopy = findMostRecentProcedure(data.encounters, [
      "45378",
      "45380",
      "45385",
    ]); // Colonoscopy CPT codes
    const lastFIT = findMostRecentLab(data.labResults, ["82270"]); // FIT test

    const needsScreening =
      (!lastColonoscopy || daysSince(lastColonoscopy) > 3650) && // 10 years
      (!lastFIT || daysSince(lastFIT.collectedDate) > 365); // 1 year

    if (needsScreening) {
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.PREVENTIVE_SCREENING,
          category: CareGapCategory.PREVENTIVE,
          title: "Colorectal Cancer Screening Due",
          description:
            "Colorectal cancer screening recommended for adults 45-75",
          priority: GapPriority.HIGH,
          dueDate: addDays(new Date(), 30),
          evidence: [
            {
              type: "Screening History",
              description: "No recent colorectal cancer screening",
              date: null,
              value: null,
              source: "Procedures and Lab Results",
            },
          ],
          recommendations: [
            "Order FIT test (annual) or",
            "Refer for colonoscopy (every 10 years) or",
            "Consider other screening options (Cologuard, flexible sigmoidoscopy)",
          ],
        }),
      );
    }
  }

  // Breast Cancer Screening (women 50-74)
  if (gender === "FEMALE" && age >= 50 && age <= 74) {
    const lastMammogram = findMostRecentProcedure(data.encounters, ["77067"]); // Mammogram CPT code
    if (!lastMammogram || daysSince(lastMammogram) > 730) {
      // 2 years
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.IMAGING_STUDY,
          category: CareGapCategory.PREVENTIVE,
          title: "Mammogram Due",
          description: "Biennial mammogram recommended for women 50-74",
          priority: GapPriority.HIGH,
          dueDate: addDays(new Date(), 30),
          evidence: [
            {
              type: "Imaging Study",
              description: lastMammogram
                ? `Last mammogram was ${daysSince(lastMammogram)} days ago`
                : "No mammogram on record",
              date: lastMammogram ? new Date(lastMammogram) : null,
              value: null,
              source: "Imaging Studies",
            },
          ],
          recommendations: [
            "Order screening mammogram",
            "Assess breast cancer risk factors",
          ],
        }),
      );
    }
  }

  // Cervical Cancer Screening (women 21-65)
  if (gender === "FEMALE" && age >= 21 && age <= 65) {
    const lastPapSmear = findMostRecentLab(data.labResults, [
      "88142",
      "88143",
      "88175",
    ]); // Pap test codes
    const lastHPV = findMostRecentLab(data.labResults, ["87624", "87625"]); // HPV test codes

    const interval = lastHPV ? 1825 : 1095; // 5 years with HPV, 3 years without
    const needsScreening =
      !lastPapSmear || daysSince(lastPapSmear.collectedDate) > interval;

    if (needsScreening) {
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.LAB_TEST,
          category: CareGapCategory.PREVENTIVE,
          title: "Cervical Cancer Screening Due",
          description:
            "Pap smear recommended every 3 years (or every 5 years with HPV co-testing)",
          priority: GapPriority.MEDIUM,
          dueDate: addDays(new Date(), 60),
          evidence: [
            {
              type: "Lab Test",
              description: lastPapSmear
                ? `Last Pap smear was ${daysSince(lastPapSmear.collectedDate)} days ago`
                : "No Pap smear on record",
              date: lastPapSmear?.collectedDate || null,
              value: null,
              source: "Lab Results",
            },
          ],
          recommendations: [
            "Schedule Pap smear",
            "Consider HPV co-testing (age 30+)",
          ],
        }),
      );
    }
  }

  // Depression Screening (adults)
  if (age >= 18) {
    const lastDepressionScreen = findMostRecentEncounter(
      data.encounters,
      ["OFFICE_VISIT"],
      ["96127", "G0444"],
    );
    if (
      !lastDepressionScreen ||
      daysSince(lastDepressionScreen.startTime) > 365
    ) {
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.PREVENTIVE_SCREENING,
          category: CareGapCategory.BEHAVIORAL_HEALTH,
          title: "Depression Screening Due",
          description: "Annual depression screening recommended for adults",
          priority: GapPriority.MEDIUM,
          dueDate: addDays(new Date(), 90),
          evidence: [
            {
              type: "Screening",
              description: "No recent depression screening documented",
              date: lastDepressionScreen?.startTime || null,
              value: null,
              source: "Encounter Documentation",
            },
          ],
          recommendations: [
            "Administer PHQ-9 or PHQ-2 screening",
            "Document results in EHR",
          ],
        }),
      );
    }
  }

  return gaps;
}

/**
 * Identify chronic disease management gaps
 */
function identifyChronicCareGaps(
  data: PatientData,
  organizationId: string,
): CareGap[] {
  const gaps: CareGap[] = [];

  // Check for specific chronic conditions
  const hasDiabetes = hasCondition(data.problemList, ["E10", "E11"]);
  const hasHypertension = hasCondition(data.problemList, ["I10"]);
  const hasHeartFailure = hasCondition(data.problemList, ["I50"]);
  const hasCKD = hasCondition(data.problemList, ["N18"]);
  const hasCOPD = hasCondition(data.problemList, ["J44"]);

  // Diabetes Care Gaps
  if (hasDiabetes) {
    // HbA1c monitoring (every 3-6 months)
    const lastHbA1c = findMostRecentLab(data.labResults, ["83036", "83037"]);
    if (!lastHbA1c || daysSince(lastHbA1c.collectedDate) > 180) {
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.CHRONIC_CARE_MONITORING,
          category: CareGapCategory.CHRONIC_DISEASE,
          title: "HbA1c Test Due",
          description:
            "HbA1c monitoring recommended every 3-6 months for diabetes patients",
          priority: GapPriority.HIGH,
          dueDate: addDays(new Date(), 30),
          evidence: [
            {
              type: "Lab Test",
              description: lastHbA1c
                ? `Last HbA1c was ${daysSince(lastHbA1c.collectedDate)} days ago`
                : "No HbA1c on record",
              date: lastHbA1c?.collectedDate || null,
              value: lastHbA1c?.value || null,
              source: "Lab Results",
            },
          ],
          recommendations: [
            "Order HbA1c test",
            "Review diabetes management plan",
            "Assess medication adherence",
          ],
        }),
      );
    }

    // Annual eye exam
    const lastEyeExam = findMostRecentEncounter(
      data.encounters,
      ["OFFICE_VISIT"],
      ["92004", "92014"],
    );
    if (!lastEyeExam || daysSince(lastEyeExam.startTime) > 365) {
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.SPECIALIST_REFERRAL,
          category: CareGapCategory.CHRONIC_DISEASE,
          title: "Diabetic Eye Exam Due",
          description:
            "Annual dilated eye exam recommended for diabetes patients",
          priority: GapPriority.HIGH,
          dueDate: addDays(new Date(), 60),
          evidence: [
            {
              type: "Specialist Visit",
              description: "No recent ophthalmology exam documented",
              date: lastEyeExam?.startTime || null,
              value: null,
              source: "Encounter History",
            },
          ],
          recommendations: [
            "Refer to ophthalmology for dilated eye exam",
            "Ensure retinal screening for diabetic retinopathy",
          ],
        }),
      );
    }

    // Foot exam
    const lastFootExam = findMostRecentEncounter(
      data.encounters,
      ["OFFICE_VISIT"],
      ["99202", "99203"],
    );
    if (!lastFootExam || daysSince(lastFootExam.startTime) > 365) {
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.CHRONIC_CARE_MONITORING,
          category: CareGapCategory.CHRONIC_DISEASE,
          title: "Diabetic Foot Exam Due",
          description:
            "Annual comprehensive foot exam recommended for diabetes patients",
          priority: GapPriority.MEDIUM,
          dueDate: addDays(new Date(), 90),
          evidence: [
            {
              type: "Physical Exam",
              description: "No documented foot exam in past year",
              date: lastFootExam?.startTime || null,
              value: null,
              source: "Encounter Documentation",
            },
          ],
          recommendations: [
            "Perform comprehensive foot exam",
            "Assess for neuropathy and vascular disease",
            "Provide foot care education",
          ],
        }),
      );
    }

    // Kidney function monitoring
    const lastCreatinine = findMostRecentLab(data.labResults, ["82565"]);
    const lastACR = findMostRecentLab(data.labResults, ["82570", "82043"]);
    if (
      !lastCreatinine ||
      !lastACR ||
      daysSince(lastCreatinine.collectedDate) > 365 ||
      daysSince(lastACR.collectedDate) > 365
    ) {
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.LAB_TEST,
          category: CareGapCategory.CHRONIC_DISEASE,
          title: "Diabetic Kidney Monitoring Due",
          description:
            "Annual creatinine and urine albumin-to-creatinine ratio recommended",
          priority: GapPriority.HIGH,
          dueDate: addDays(new Date(), 30),
          evidence: [
            {
              type: "Lab Test",
              description: "Kidney function tests not current",
              date: null,
              value: null,
              source: "Lab Results",
            },
          ],
          recommendations: [
            "Order serum creatinine and eGFR",
            "Order urine albumin-to-creatinine ratio",
          ],
        }),
      );
    }
  }

  // Hypertension Care Gaps
  if (hasHypertension) {
    const lastBPReading = findMostRecentVitals(
      data.encounters,
      "blood_pressure",
    );
    if (!lastBPReading || daysSince(lastBPReading) > 180) {
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.CHRONIC_CARE_MONITORING,
          category: CareGapCategory.CHRONIC_DISEASE,
          title: "Blood Pressure Check Due",
          description:
            "Regular BP monitoring recommended for hypertension management",
          priority: GapPriority.HIGH,
          dueDate: addDays(new Date(), 30),
          evidence: [
            {
              type: "Vital Signs",
              description: "No recent BP reading",
              date: lastBPReading,
              value: null,
              source: "Vital Signs",
            },
          ],
          recommendations: [
            "Schedule follow-up for BP check",
            "Review antihypertensive medications",
            "Assess medication adherence",
          ],
        }),
      );
    }
  }

  // Heart Failure Care Gaps
  if (hasHeartFailure) {
    const lastEcho = findMostRecentProcedure(data.encounters, [
      "93306",
      "93307",
      "93308",
    ]);
    if (!lastEcho || daysSince(lastEcho) > 365) {
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.IMAGING_STUDY,
          category: CareGapCategory.CHRONIC_DISEASE,
          title: "Echocardiogram Due",
          description:
            "Annual echocardiogram recommended for heart failure monitoring",
          priority: GapPriority.HIGH,
          dueDate: addDays(new Date(), 60),
          evidence: [
            {
              type: "Imaging Study",
              description: "No recent echocardiogram",
              date: lastEcho ? new Date(lastEcho) : null,
              value: null,
              source: "Imaging Studies",
            },
          ],
          recommendations: [
            "Order transthoracic echocardiogram",
            "Assess ejection fraction",
            "Review heart failure medications",
          ],
        }),
      );
    }
  }

  // COPD Care Gaps
  if (hasCOPD) {
    const lastPulmonaryFunction = findMostRecentProcedure(data.encounters, [
      "94010",
      "94060",
    ]);
    if (!lastPulmonaryFunction || daysSince(lastPulmonaryFunction) > 365) {
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.PREVENTIVE_SCREENING,
          category: CareGapCategory.CHRONIC_DISEASE,
          title: "Pulmonary Function Test Due",
          description: "Annual spirometry recommended for COPD monitoring",
          priority: GapPriority.MEDIUM,
          dueDate: addDays(new Date(), 90),
          evidence: [
            {
              type: "Pulmonary Function Test",
              description: "No recent spirometry",
              date: lastPulmonaryFunction
                ? new Date(lastPulmonaryFunction)
                : null,
              value: null,
              source: "Procedures",
            },
          ],
          recommendations: [
            "Order spirometry",
            "Assess COPD control",
            "Review inhaler technique",
          ],
        }),
      );
    }
  }

  return gaps;
}

/**
 * Identify immunization gaps
 */
function identifyImmunizationGaps(
  data: PatientData,
  organizationId: string,
): CareGap[] {
  const gaps: CareGap[] = [];
  const age = calculateAge(data.patient.dateOfBirth);

  // Influenza vaccine (annual for everyone)
  const lastFluShot = findMostRecentImmunization(data.immunizations, [
    "141",
    "140",
    "161",
  ]); // CVX codes for flu
  const fluSeason = getCurrentFluSeason();
  if (
    !lastFluShot ||
    new Date(lastFluShot.administeredDate) < fluSeason.start
  ) {
    gaps.push(
      createCareGap({
        organizationId,
        patientId: data.patient.id,
        gapType: CareGapType.IMMUNIZATION,
        category: CareGapCategory.PREVENTIVE,
        title: "Influenza Vaccine Due",
        description: `Annual flu vaccine recommended for ${fluSeason.year}-${fluSeason.year + 1} season`,
        priority: GapPriority.MEDIUM,
        dueDate: fluSeason.end,
        evidence: [
          {
            type: "Immunization",
            description: "No flu vaccine for current season",
            date: lastFluShot?.administeredDate || null,
            value: null,
            source: "Immunization Records",
          },
        ],
        recommendations: [
          "Administer seasonal influenza vaccine",
          "Document in immunization registry",
        ],
      }),
    );
  }

  // Pneumococcal vaccine (adults 65+)
  if (age >= 65) {
    const hasPneumovax = findMostRecentImmunization(data.immunizations, ["33"]); // PPSV23
    const hasPrevnar = findMostRecentImmunization(data.immunizations, [
      "133",
      "152",
    ]); // PCV13/PCV15

    if (!hasPneumovax && !hasPrevnar) {
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.IMMUNIZATION,
          category: CareGapCategory.PREVENTIVE,
          title: "Pneumococcal Vaccine Due",
          description:
            "Pneumococcal vaccination recommended for adults 65 and older",
          priority: GapPriority.HIGH,
          dueDate: addDays(new Date(), 30),
          evidence: [
            {
              type: "Immunization",
              description: "No pneumococcal vaccine on record",
              date: null,
              value: null,
              source: "Immunization Records",
            },
          ],
          recommendations: [
            "Administer PCV15 or PCV20",
            "If PCV15, follow with PPSV23 in 1 year",
          ],
        }),
      );
    }
  }

  // Shingles vaccine (adults 50+)
  if (age >= 50) {
    const hasShingrix = findMostRecentImmunization(data.immunizations, ["187"]); // Shingrix CVX code
    const shingrixDoses = data.immunizations.filter(
      (i) => i.cvxCode === "187",
    ).length;

    if (shingrixDoses < 2) {
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.IMMUNIZATION,
          category: CareGapCategory.PREVENTIVE,
          title: "Shingles Vaccine Due",
          description: `Shingrix series (dose ${shingrixDoses + 1} of 2) recommended for adults 50+`,
          priority: GapPriority.MEDIUM,
          dueDate: addDays(new Date(), 90),
          evidence: [
            {
              type: "Immunization",
              description: `${shingrixDoses} of 2 doses completed`,
              date: hasShingrix?.administeredDate || null,
              value: shingrixDoses.toString(),
              source: "Immunization Records",
            },
          ],
          recommendations: [
            shingrixDoses === 0
              ? "Administer Shingrix dose 1"
              : "Administer Shingrix dose 2 (2-6 months after dose 1)",
          ],
        }),
      );
    }
  }

  // Tdap/Td (every 10 years)
  const lastTdap = findMostRecentImmunization(data.immunizations, [
    "115",
    "113",
    "09",
  ]); // Tdap/Td CVX codes
  if (!lastTdap || daysSince(lastTdap.administeredDate) > 3650) {
    // 10 years
    gaps.push(
      createCareGap({
        organizationId,
        patientId: data.patient.id,
        gapType: CareGapType.IMMUNIZATION,
        category: CareGapCategory.PREVENTIVE,
        title: "Tetanus Booster Due",
        description: "Td or Tdap booster recommended every 10 years",
        priority: GapPriority.LOW,
        dueDate: addDays(new Date(), 180),
        evidence: [
          {
            type: "Immunization",
            description: lastTdap
              ? `Last tetanus booster was ${Math.floor(daysSince(lastTdap.administeredDate) / 365)} years ago`
              : "No tetanus immunization on record",
            date: lastTdap?.administeredDate || null,
            value: null,
            source: "Immunization Records",
          },
        ],
        recommendations: ["Administer Td or Tdap booster"],
      }),
    );
  }

  return gaps;
}

/**
 * Identify screening gaps based on age, gender, and risk factors
 */
function identifyScreeningGaps(
  data: PatientData,
  organizationId: string,
): CareGap[] {
  const gaps: CareGap[] = [];
  const age = calculateAge(data.patient.dateOfBirth);

  // Osteoporosis screening (women 65+, high-risk earlier)
  if (data.patient.gender === "FEMALE" && age >= 65) {
    const lastDEXA = findMostRecentProcedure(data.encounters, [
      "77080",
      "77081",
    ]); // DEXA scan CPT codes
    if (!lastDEXA || daysSince(lastDEXA) > 730) {
      // 2 years
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.IMAGING_STUDY,
          category: CareGapCategory.PREVENTIVE,
          title: "Bone Density Screening Due",
          description:
            "DEXA scan recommended for osteoporosis screening in women 65+",
          priority: GapPriority.MEDIUM,
          dueDate: addDays(new Date(), 90),
          evidence: [
            {
              type: "Imaging Study",
              description: "No recent bone density scan",
              date: lastDEXA ? new Date(lastDEXA) : null,
              value: null,
              source: "Imaging Studies",
            },
          ],
          recommendations: ["Order DEXA scan", "Assess fracture risk factors"],
        }),
      );
    }
  }

  // Abdominal Aortic Aneurysm screening (men 65-75 with smoking history)
  if (data.patient.gender === "MALE" && age >= 65 && age <= 75) {
    const hasSmokingHistory =
      data.patient.socialHistory?.smokingStatus === "CURRENT_SMOKER" ||
      data.patient.socialHistory?.smokingStatus === "FORMER_SMOKER";

    if (hasSmokingHistory) {
      const lastAAAScreen = findMostRecentProcedure(data.encounters, ["76706"]); // AAA ultrasound CPT code
      if (!lastAAAScreen) {
        gaps.push(
          createCareGap({
            organizationId,
            patientId: data.patient.id,
            gapType: CareGapType.IMAGING_STUDY,
            category: CareGapCategory.PREVENTIVE,
            title: "AAA Screening Due",
            description:
              "One-time abdominal aortic aneurysm screening recommended for men 65-75 with smoking history",
            priority: GapPriority.HIGH,
            dueDate: addDays(new Date(), 60),
            evidence: [
              {
                type: "Screening",
                description: "No AAA screening on record",
                date: null,
                value: null,
                source: "Imaging Studies",
              },
            ],
            recommendations: ["Order abdominal ultrasound for AAA screening"],
          }),
        );
      }
    }
  }

  return gaps;
}

/**
 * Identify medication adherence gaps
 */
function identifyMedicationGaps(
  data: PatientData,
  organizationId: string,
): CareGap[] {
  const gaps: CareGap[] = [];

  // Check for chronic disease medications
  const hasDiabetes = hasCondition(data.problemList, ["E10", "E11"]);
  const hasHypertension = hasCondition(data.problemList, ["I10"]);
  const hasHeartFailure = hasCondition(data.problemList, ["I50"]);
  const hasCAD = hasCondition(data.problemList, ["I25"]);

  // Statin for diabetes or CAD (if appropriate)
  if ((hasDiabetes || hasCAD) && calculateAge(data.patient.dateOfBirth) >= 40) {
    const onStatin = data.medications?.some(
      (m) =>
        m.class?.toLowerCase().includes("statin") ||
        m.name?.toLowerCase().includes("statin"),
    );

    if (!onStatin) {
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.MEDICATION_ADHERENCE,
          category: CareGapCategory.MEDICATION,
          title: "Statin Therapy Recommended",
          description:
            "Statin therapy recommended for cardiovascular risk reduction",
          priority: GapPriority.HIGH,
          dueDate: addDays(new Date(), 30),
          evidence: [
            {
              type: "Medication Review",
              description: "No statin medication on current medication list",
              date: null,
              value: null,
              source: "Medication List",
            },
          ],
          recommendations: [
            "Assess cardiovascular risk",
            "Consider statin therapy",
            "Discuss risks and benefits with patient",
          ],
        }),
      );
    }
  }

  // ACE-I or ARB for diabetes with albuminuria or heart failure
  if (hasDiabetes || hasHeartFailure) {
    const onACEorARB = data.medications?.some(
      (m) =>
        m.class?.toLowerCase().includes("ace inhibitor") ||
        m.class?.toLowerCase().includes("arb") ||
        m.name?.toLowerCase().includes("pril") ||
        m.name?.toLowerCase().includes("sartan"),
    );

    if (!onACEorARB) {
      gaps.push(
        createCareGap({
          organizationId,
          patientId: data.patient.id,
          gapType: CareGapType.MEDICATION_ADHERENCE,
          category: CareGapCategory.MEDICATION,
          title: "ACE-I/ARB Therapy Recommended",
          description:
            "ACE inhibitor or ARB recommended for renal protection and cardiovascular benefit",
          priority: GapPriority.HIGH,
          dueDate: addDays(new Date(), 30),
          evidence: [
            {
              type: "Medication Review",
              description: "No ACE-I or ARB on current medication list",
              date: null,
              value: null,
              source: "Medication List",
            },
          ],
          recommendations: [
            "Consider ACE inhibitor or ARB",
            "Monitor renal function and potassium",
          ],
        }),
      );
    }
  }

  return gaps;
}

/**
 * Helper functions
 */

function createCareGap(params: {
  organizationId: string;
  patientId: string;
  gapType: CareGapType;
  category: CareGapCategory;
  title: string;
  description: string;
  priority: GapPriority;
  dueDate: Date | null;
  evidence: GapEvidence[];
  recommendations: string[];
}): CareGap {
  return {
    id: generateId(),
    organizationId: params.organizationId,
    patientId: params.patientId,
    registryId: null,
    gapType: params.gapType,
    category: params.category,
    title: params.title,
    description: params.description,
    measure: null,
    measureId: null,
    dueDate: params.dueDate,
    identifiedDate: new Date(),
    priority: params.priority,
    status: CareGapStatus.IDENTIFIED,
    closedDate: null,
    closedBy: null,
    closureMethod: null,
    assignedTo: null,
    outreachAttempts: 0,
    lastOutreachDate: null,
    nextOutreachDate: null,
    notes: null,
    evidence: params.evidence,
    recommendations: params.recommendations,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: "system",
    updatedBy: "system",
  };
}

function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    age--;
  }

  return age;
}

function daysSince(date: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function findMostRecentEncounter(
  encounters: Encounter[],
  types?: string[],
  cptCodes?: string[],
): Encounter | null {
  let filtered = encounters.filter((e) => e.status === "COMPLETED");

  if (types && types.length > 0) {
    filtered = filtered.filter((e) => types.includes(e.type));
  }

  if (cptCodes && cptCodes.length > 0) {
    filtered = filtered.filter((e) =>
      e.procedures?.some((p) => cptCodes.includes(p.cptCode)),
    );
  }

  return (
    filtered.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0] ||
    null
  );
}

function findMostRecentVitals(
  encounters: Encounter[],
  type: string,
): Date | null {
  const encountersWithVitals = encounters
    .filter((e) => e.vitalSigns && e.vitalSigns.length > 0)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  if (encountersWithVitals.length === 0) return null;

  const mostRecent = encountersWithVitals[0];
  const latestVitals = mostRecent.vitalSigns[mostRecent.vitalSigns.length - 1];

  return latestVitals.recordedAt;
}

function findMostRecentLab(
  labResults: any[],
  loincCodes: string[],
): any | null {
  if (!labResults || labResults.length === 0) return null;

  const filtered = labResults.filter((lab) =>
    loincCodes.some(
      (code) => lab.loincCode?.includes(code) || lab.testCode?.includes(code),
    ),
  );

  return (
    filtered.sort(
      (a, b) =>
        new Date(b.collectedDate).getTime() -
        new Date(a.collectedDate).getTime(),
    )[0] || null
  );
}

function findMostRecentProcedure(
  encounters: Encounter[],
  cptCodes: string[],
): number | null {
  const procedureDates: number[] = [];

  for (const encounter of encounters) {
    if (encounter.procedures) {
      for (const proc of encounter.procedures) {
        if (cptCodes.includes(proc.cptCode)) {
          procedureDates.push(proc.performedDate.getTime());
        }
      }
    }
  }

  return procedureDates.length > 0 ? Math.max(...procedureDates) : null;
}

function findMostRecentImmunization(
  immunizations: any[],
  cvxCodes: string[],
): any | null {
  if (!immunizations || immunizations.length === 0) return null;

  const filtered = immunizations.filter((imm) =>
    cvxCodes.includes(imm.cvxCode),
  );

  return (
    filtered.sort(
      (a, b) =>
        new Date(b.administeredDate).getTime() -
        new Date(a.administeredDate).getTime(),
    )[0] || null
  );
}

function hasCondition(
  problemList: ProblemList[],
  icdPrefixes: string[],
): boolean {
  return problemList.some(
    (problem) =>
      problem.status === "ACTIVE" &&
      icdPrefixes.some((prefix) => problem.icdCode.startsWith(prefix)),
  );
}

function getCurrentFluSeason(): { year: number; start: Date; end: Date } {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;

  return {
    year,
    start: new Date(year, 6, 1), // July 1
    end: new Date(year + 1, 4, 31), // May 31
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
