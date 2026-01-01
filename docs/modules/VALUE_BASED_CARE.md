# Value-Based Care Suite

**Module**: Value-Based Care
**Version**: 0.4.0
**Date**: 2026-01-01
**Agent**: Agent 4 - Value-Based Care

## Table of Contents

1. [Overview](#overview)
2. [ACO Management](#aco-management)
3. [MIPS Reporting](#mips-reporting)
4. [Quality Measures](#quality-measures)
5. [Care Gaps](#care-gaps)
6. [Financial Analytics](#financial-analytics)
7. [Configuration](#configuration)
8. [Usage Examples](#usage-examples)

---

## Overview

The Value-Based Care Suite provides comprehensive tools for managing accountable care organizations (ACOs), MIPS quality reporting, and value-based payment programs. The platform helps healthcare organizations succeed in value-based care by tracking quality measures, identifying care gaps, and optimizing financial performance.

### Key Features

- **ACO Performance Management**: Patient attribution, risk adjustment, shared savings calculation
- **MIPS Reporting**: Complete MIPS score calculation and submission
- **Quality Measure Tracking**: HEDIS, ACO, and custom quality measures
- **Care Gap Analysis**: Automated care gap identification and closure tracking
- **Financial Analytics**: Bundled payments, risk-sharing agreements, and ROI analysis
- **Benchmarking**: Performance comparison against national and regional benchmarks

### Supported Programs

- Medicare Shared Savings Program (MSSP)
- Next Generation ACO Model
- Merit-based Incentive Payment System (MIPS)
- Alternative Payment Models (APMs)
- HEDIS Quality Measures
- Bundled Payment Models
- Commercial Value-Based Contracts

---

## ACO Management

### Patient Attribution

Automated patient attribution using claims data and encounter records.

#### Attribution Methods

```typescript
import { AttributionEngine } from '@/lib/vbc/aco/attribution-engine';

const engine = new AttributionEngine();

// Step-wise attribution (most common for MSSP)
const attribution = await engine.attributePatient({
  beneficiaryId: 'bene_123',
  attributionPeriod: '2025',
  method: 'step_wise',
  claimsData: {
    primaryCareVisits: [
      {
        providerId: 'prov_789',
        npi: '1234567890',
        date: '2025-03-15',
        allowedAmount: 150,
      },
      {
        providerId: 'prov_789',
        npi: '1234567890',
        date: '2025-08-22',
        allowedAmount: 150,
      },
    ],
    specialistVisits: [],
    totalPrimaryCareAllowed: 300,
    totalAllowed: 1250,
  },
});

console.log(attribution);
// {
//   beneficiaryId: 'bene_123',
//   attributed: true,
//   attributionMethod: 'step_wise',
//   attributedProvider: {
//     providerId: 'prov_789',
//     npi: '1234567890',
//     name: 'Dr. John Smith',
//     tin: '12-3456789',
//     acoId: 'aco_123',
//   },
//   attributionScore: 95,
//   attributionDate: '2025-12-31',
//   historicallyAttributed: true,
// }
```

### Risk Adjustment

HCC (Hierarchical Condition Category) risk scoring for financial benchmarking.

```typescript
import { RiskAdjustment } from '@/lib/vbc/aco/risk-adjustment';

const riskAdj = new RiskAdjustment();

const riskScore = await riskAdj.calculateHCC({
  beneficiaryId: 'bene_123',
  demographics: {
    age: 72,
    sex: 'male',
    medicaidStatus: false,
    disabilityStatus: false,
    institutionalized: false,
  },
  diagnoses: [
    'I21.09', // Acute MI
    'I10', // Hypertension
    'E11.9', // Type 2 diabetes
    'N18.3', // CKD stage 3
  ],
  year: 2025,
});

console.log(riskScore);
// {
//   beneficiaryId: 'bene_123',
//   riskScore: 1.23,
//   hccCategories: [
//     { hcc: 'HCC88', description: 'Acute MI', coefficient: 0.321 },
//     { hcc: 'HCC19', description: 'Diabetes without complication', coefficient: 0.104 },
//     { hcc: 'HCC138', description: 'Chronic kidney disease stage 3', coefficient: 0.237 },
//   ],
//   demographicScore: 0.568,
//   diseaseScore: 0.662,
//   interactions: [],
// }
```

### Performance Tracking

Real-time ACO performance monitoring.

```typescript
import { PerformanceTracker } from '@/lib/vbc/aco/performance-tracker';

const tracker = new PerformanceTracker();

const performance = await tracker.getACOPerformance({
  acoId: 'aco_123',
  performancePeriod: '2025',
});

console.log(performance);
// {
//   acoId: 'aco_123',
//   acoName: 'Metro Health ACO',
//   performancePeriod: '2025',
//
//   population: {
//     totalBeneficiaries: 15240,
//     averageRiskScore: 1.08,
//     newBeneficiaries: 1450,
//     continuouslyEnrolled: 13790,
//   },
//
//   financial: {
//     totalExpenditure: 142500000,
//     benchmark: 148000000,
//     savings: 5500000,
//     savingsRate: 3.72,
//     qualityThresholdMet: true,
//     sharedSavingsEligible: true,
//     sharedSavingsAmount: 2750000,
//     minimumSavingsRate: 3.5,
//   },
//
//   quality: {
//     overallScore: 92.5,
//     qualityCategory: 'excellent',
//     measureScores: {
//       acm01_diabetes_hba1c: 88.5,
//       acm02_hypertension_control: 72.3,
//       acm03_preventive_care: 85.2,
//       acm04_depression_screening: 91.0,
//     },
//   },
//
//   utilization: {
//     admissionsPerThousand: 245,
//     readmissions30Day: 12.3,
//     edVisitsPerThousand: 420,
//     averageLengthOfStay: 4.2,
//     imagingUtilization: 0.85,
//   },
//
//   trend: 'improving',
//   ranking: 12,
//   totalAcosInProgram: 245,
// }
```

### Shared Savings Calculator

Calculate shared savings based on performance.

```typescript
import { SharedSavingsCalculator } from '@/lib/vbc/aco/shared-savings-calculator';

const calculator = new SharedSavingsCalculator();

const calculation = await calculator.calculate({
  acoId: 'aco_123',
  performancePeriod: '2025',
  track: 'track_1_plus', // 'track_1', 'track_1_plus', 'track_2', 'track_3'
  expenditure: 142500000,
  benchmark: 148000000,
  qualityScore: 92.5,
  minimumSavingsRate: 0.035,
});

console.log(calculation);
// {
//   savings: 5500000,
//   savingsRate: 0.0372,
//   exceededMinimumSavingsRate: true,
//   qualityThresholdMet: true,
//   qualityAdjustment: 1.0,
//   sharedSavingsRate: 0.5,
//   grossSharedSavings: 2750000,
//   sequestrationReduction: 0,
//   netSharedSavings: 2750000,
//   perProviderBonus: 18340, // Assuming 150 participating providers
// }
```

---

## MIPS Reporting

### MIPS Categories

Complete implementation of all four MIPS performance categories.

#### Quality Measures

```typescript
import { MIPSQualityMeasures } from '@/lib/vbc/mips/quality-measures';

const quality = new MIPSQualityMeasures();

// Submit quality measure
await quality.submitMeasure({
  providerId: 'prov_789',
  npi: '1234567890',
  tin: '12-3456789',
  year: 2025,
  measure: {
    measureId: '001',
    measureName: 'Diabetes: Hemoglobin A1c Poor Control',
    numerator: 135,
    denominator: 180,
    performance: 75.0,
    deciles: [50, 60, 70, 80, 90],
    performancePoints: 7.5,
    bonusPoints: 0,
  },
});

// Calculate total quality score
const qualityScore = await quality.calculateScore({
  providerId: 'prov_789',
  year: 2025,
});

console.log(qualityScore);
// {
//   providerId: 'prov_789',
//   measuresSubmitted: 6,
//   measuresRequired: 6,
//   completenessScore: 60,
//   performanceScore: 25.0,
//   bonusPoints: 5.0,
//   totalQualityScore: 85.0,
//   qualityCategory: 'exceptional',
//   cappedAt100: true,
// }
```

#### Cost Measures

```typescript
import { MIPSCostMeasures } from '@/lib/vbc/mips/cost-measures';

const cost = new MIPSCostMeasures();

const costScore = await cost.calculateScore({
  providerId: 'prov_789',
  year: 2025,
  measures: [
    {
      measureId: 'TPCC',
      measureName: 'Total Per Capita Cost',
      providerCost: 8500,
      benchmark: 9200,
      percentile: 72,
    },
    {
      measureId: 'MSPB',
      measureName: 'Medicare Spending Per Beneficiary',
      providerCost: 18500,
      benchmark: 19800,
      percentile: 68,
    },
  ],
});

console.log(costScore);
// {
//   providerId: 'prov_789',
//   totalCostScore: 72.0,
//   measuresCalculated: 2,
//   performanceCategory: 'good',
// }
```

#### Improvement Activities

```typescript
import { MIPSImprovementActivities } from '@/lib/vbc/mips/improvement-activities';

const ia = new MIPSImprovementActivities();

// Attest to improvement activities
await ia.attestActivity({
  providerId: 'prov_789',
  year: 2025,
  activity: {
    activityId: 'IA_EPA_4',
    activityName: 'Use of QCDR for feedback reports',
    category: 'expanded_practice_access',
    weight: 'medium',
    completedQuarters: [1, 2, 3, 4],
    documentation: 'Quarterly QCDR reports reviewed and acted upon',
  },
});

// Calculate IA score
const iaScore = await ia.calculateScore({
  providerId: 'prov_789',
  year: 2025,
});

console.log(iaScore);
// {
//   providerId: 'prov_789',
//   activitiesAttested: 4,
//   activitiesRequired: 1,
//   totalPoints: 40,
//   maximumPoints: 40,
//   score: 100.0,
//   performanceCategory: 'excellent',
// }
```

#### Promoting Interoperability (PI)

```typescript
import { MIPSPromotingInterop } from '@/lib/vbc/mips/promoting-interoperability';

const pi = new MIPSPromotingInterop();

// Submit PI measures
await pi.submitMeasures({
  providerId: 'prov_789',
  year: 2025,
  measures: {
    ePrescribing: { numerator: 850, denominator: 900, performance: 94.4 },
    healthInfoExchange: { numerator: 320, denominator: 400, performance: 80.0 },
    providerToPatient: { numerator: 450, denominator: 500, performance: 90.0 },
    publicHealthReporting: { yesNoResponse: 'yes', bonusEligible: true },
  },
  securityRiskAnalysis: {
    conducted: true,
    date: '2025-01-15',
  },
});

// Calculate PI score
const piScore = await pi.calculateScore({
  providerId: 'prov_789',
  year: 2025,
});

console.log(piScore);
// {
//   providerId: 'prov_789',
//   baseScore: 90.0,
//   bonusPoints: 5.0,
//   totalScore: 95.0,
//   performanceCategory: 'excellent',
//   exclusion: false,
//   exclusionReason: null,
// }
```

### MIPS Final Score

```typescript
import { MIPSFinalScore } from '@/lib/vbc/mips/final-score';

const finalScore = new MIPSFinalScore();

const score = await finalScore.calculate({
  providerId: 'prov_789',
  year: 2025,
});

console.log(score);
// {
//   providerId: 'prov_789',
//   providerName: 'Dr. John Smith',
//   npi: '1234567890',
//   performanceYear: 2025,
//
//   categories: {
//     quality: {
//       score: 85.0,
//       weight: 0.45,
//       weightedScore: 38.25,
//     },
//     cost: {
//       score: 72.0,
//       weight: 0.15,
//       weightedScore: 10.80,
//     },
//     improvementActivities: {
//       score: 100.0,
//       weight: 0.15,
//       weightedScore: 15.00,
//     },
//     promotingInteroperability: {
//       score: 95.0,
//       weight: 0.25,
//       weightedScore: 23.75,
//     },
//   },
//
//   finalScore: 87.80,
//   exceptionalPerformanceBonus: 0,
//   totalScore: 87.80,
//   paymentAdjustment: 1.75, // +1.75%
//   performanceThreshold: 75.0,
//   exceedsThreshold: true,
//
//   comparison: {
//     nationalAverage: 75.5,
//     specialtyAverage: 78.2,
//     percentile: 85,
//   },
// }
```

---

## Quality Measures

### HEDIS Calculator

Healthcare Effectiveness Data and Information Set (HEDIS) measure calculation.

```typescript
import { HEDISCalculator } from '@/lib/vbc/quality/hedis-calculator';

const hedis = new HEDISCalculator();

// Calculate HEDIS measure
const measure = await hedis.calculateMeasure({
  measureCode: 'CDC',
  measureName: 'Comprehensive Diabetes Care: HbA1c Control (<8.0%)',
  measurementYear: 2025,
  population: 'commercial',
  eligiblePatients: await getEligibleDiabeticPatients(),
});

console.log(measure);
// {
//   measureCode: 'CDC',
//   measureName: 'Comprehensive Diabetes Care: HbA1c Control (<8.0%)',
//   numerator: 850,
//   denominator: 1000,
//   rate: 85.0,
//   benchmark: {
//     percentile50: 75.0,
//     percentile75: 82.0,
//     percentile90: 88.0,
//   },
//   performanceLevel: 'above_75th_percentile',
//   exclusions: 15,
//   administrativeCoding: 650,
//   hybridCoding: 350,
// }
```

### Custom Quality Measures

```typescript
import { CustomQualityMeasure } from '@/lib/vbc/quality/custom-measure';

// Define custom measure
const measure = new CustomQualityMeasure({
  measureId: 'CUSTOM_001',
  name: 'Influenza Vaccination Rate',
  description: 'Percentage of patients 65+ who received flu vaccine',
  specification: {
    denominator: {
      criteria: ['age >= 65', 'active_patient'],
      exclusions: ['vaccine_contraindication'],
    },
    numerator: {
      criteria: ['flu_vaccine_administered', 'vaccination_season_2025'],
    },
  },
});

const result = await measure.calculate({
  measurementPeriod: {
    start: '2025-10-01',
    end: '2026-03-31',
  },
});

console.log(result);
// {
//   numerator: 1850,
//   denominator: 2100,
//   exclusions: 50,
//   rate: 88.1,
//   target: 85.0,
//   meetsTarget: true,
// }
```

---

## Care Gaps

### Care Gap Identification

Automated identification of care gaps for quality measures.

```typescript
import { CareGapAnalyzer } from '@/lib/vbc/quality/care-gap-analyzer';

const analyzer = new CareGapAnalyzer();

// Identify care gaps for patient
const gaps = await analyzer.identifyGaps({
  patientId: 'patient_123',
  measureSets: ['HEDIS_2025', 'ACO_MEASURES', 'MIPS_2025'],
  includeClosedGaps: false,
});

console.log(gaps);
// {
//   patientId: 'patient_123',
//   totalGaps: 3,
//   gaps: [
//     {
//       gapId: 'gap_001',
//       measure: 'COL',
//       measureName: 'Colorectal Cancer Screening',
//       status: 'open',
//       priority: 'high',
//       dueDate: '2026-12-31',
//       recommendedAction: 'Order colonoscopy or FIT test',
//       eligibility: {
//         age: 58,
//         lastScreening: null,
//         averageRisk: true,
//       },
//       estimatedImpact: {
//         qualityScore: 0.5,
//         financialImpact: 250,
//       },
//     },
//     {
//       gapId: 'gap_002',
//       measure: 'CDC',
//       measureName: 'Diabetes HbA1c Control',
//       status: 'open',
//       priority: 'high',
//       dueDate: '2026-03-01',
//       lastValue: 8.2,
//       targetValue: '<7.0',
//       recommendedAction: 'Order HbA1c test. Consider medication adjustment.',
//       barriers: ['Medication adherence issues'],
//     },
//     {
//       gapId: 'gap_003',
//       measure: 'BCS',
//       measureName: 'Breast Cancer Screening',
//       status: 'open',
//       priority: 'medium',
//       dueDate: '2026-06-30',
//       lastScreening: '2023-05-15',
//       recommendedAction: 'Schedule mammogram',
//     },
//   ],
//   closedGapsThisYear: 2,
//   qualityScoreImpact: 1.2,
// }
```

### Care Gap Closure Tracking

```typescript
import { CareGapTracker } from '@/lib/vbc/quality/care-gap-tracker';

const tracker = new CareGapTracker();

// Close care gap
await tracker.closeGap({
  gapId: 'gap_001',
  patientId: 'patient_123',
  closureMethod: 'service_completed',
  details: {
    serviceDate: '2026-01-15',
    serviceType: 'colonoscopy',
    result: 'normal',
    nextDueDate: '2036-01-15',
  },
  closedBy: 'user_456',
});

// Get closure statistics
const stats = await tracker.getClosureStats({
  timeframe: '2025',
  providerId: 'prov_789',
});

console.log(stats);
// {
//   totalGapsIdentified: 450,
//   gapsClosed: 385,
//   closureRate: 85.6,
//   gapsRemaining: 65,
//   closuresByMeasure: {
//     COL: { identified: 80, closed: 72, rate: 90.0 },
//     CDC: { identified: 120, closed: 108, rate: 90.0 },
//     BCS: { identified: 100, closed: 85, rate: 85.0 },
//     // ...
//   },
//   qualityScoreImprovement: 4.2,
// }
```

---

## Financial Analytics

### Bundled Payment Tracking

```typescript
import { BundledPaymentTracker } from '@/lib/vbc/financial/bundled-payments';

const tracker = new BundledPaymentTracker();

const episode = await tracker.trackEpisode({
  episodeId: 'episode_123',
  episodeType: 'total_joint_replacement',
  anchor: {
    procedureDate: '2025-06-15',
    providerId: 'prov_789',
    facilityId: 'facility_456',
  },
  patient: {
    beneficiaryId: 'bene_123',
    riskScore: 1.15,
  },
  targetPrice: 25000,
});

console.log(episode);
// {
//   episodeId: 'episode_123',
//   status: 'active',
//   daysRemaining: 45,
//   episodeWindow: 90,
//
//   costs: {
//     anchor: 18500,
//     readmissions: 0,
//     postAcuteCare: 3200,
//     outpatientServices: 850,
//     total: 22550,
//   },
//
//   targetPrice: 25000,
//   variance: 2450,
//   performingUnderTarget: true,
//   qualityThresholdMet: true,
//
//   reconciliation: {
//     eligible: true,
//     estimatedPayment: 1225, // 50% of savings
//   },
// }
```

### Value-Based Contract Analytics

```typescript
import { ContractAnalytics } from '@/lib/vbc/financial/contract-analytics';

const analytics = new ContractAnalytics();

const performance = await analytics.analyzeContract({
  contractId: 'contract_789',
  period: '2025',
});

console.log(performance);
// {
//   contractId: 'contract_789',
//   contractName: 'Commercial ACO - ABC Health Plan',
//   period: '2025',
//
//   financial: {
//     totalRevenue: 45000000,
//     feeForService: 38000000,
//     sharedSavings: 5000000,
//     qualityBonuses: 2000000,
//     penalties: 0,
//   },
//
//   quality: {
//     overallScore: 88.5,
//     target: 85.0,
//     bonus: 2000000,
//   },
//
//   utilization: {
//     admissionsPerThousand: 185,
//     target: 200,
//     performance: 'exceeds',
//   },
//
//   roi: {
//     investment: 8000000,
//     return: 7000000,
//     netBenefit: -1000000,
//     roiPercentage: -12.5,
//   },
// }
```

---

## Configuration

### Environment Variables

```bash
# ACO Configuration
ACO_ID=aco_123
ACO_TIN=12-3456789
ACO_TRACK=track_1_plus
ACO_START_YEAR=2024

# MIPS Configuration
MIPS_REPORTING_ENABLED=true
MIPS_SUBMISSION_METHOD=registry
MIPS_REGISTRY_ID=12345

# Quality Measure Sets
ENABLE_HEDIS=true
ENABLE_ACO_MEASURES=true
ENABLE_MIPS_MEASURES=true
ENABLE_CUSTOM_MEASURES=true

# Benchmarking
BENCHMARK_DATA_SOURCE=cms
BENCHMARK_UPDATE_FREQUENCY=quarterly

# Analytics
VBC_ANALYTICS_ENABLED=true
CARE_GAP_AUTO_IDENTIFICATION=true
CARE_GAP_REMINDER_FREQUENCY=weekly
```

### Measure Specifications

```typescript
// Configure quality measures
import { MeasureLibrary } from '@/lib/vbc/quality/measure-library';

const library = new MeasureLibrary();

await library.addMeasureSet({
  name: 'Organization Custom Measures 2025',
  measures: [
    {
      measureId: 'CUSTOM_001',
      name: 'Diabetes Eye Exam',
      specification: {...},
      target: 85.0,
      weight: 1.0,
    },
    // ... more measures
  ],
});
```

---

## Usage Examples

### Complete VBC Workflow

```typescript
import { VBCPlatform } from '@/lib/vbc';

const vbc = new VBCPlatform();

// 1. Attribute patients
const attribution = await vbc.runAttribution({
  acoId: 'aco_123',
  year: 2025,
});

// 2. Calculate risk scores
const riskScores = await vbc.calculateRiskScores({
  beneficiaries: attribution.attributedPatients,
});

// 3. Identify care gaps
const careGaps = await vbc.identifyAllCareGaps({
  patients: attribution.attributedPatients,
  measureSets: ['HEDIS_2025', 'ACO_MEASURES'],
});

// 4. Generate outreach lists
const outreachLists = await vbc.generateOutreachLists({
  careGaps: careGaps,
  prioritization: 'quality_score_impact',
});

// 5. Track performance
const performance = await vbc.trackPerformance({
  acoId: 'aco_123',
  period: '2025',
  frequency: 'monthly',
});

// 6. Calculate projected shared savings
const projection = await vbc.projectSharedSavings({
  acoId: 'aco_123',
  currentPerformance: performance,
  remainingMonths: 6,
});

console.log(projection);
```

---

## Best Practices

1. **Regular Monitoring**: Review performance metrics at least monthly
2. **Proactive Care Gap Closure**: Identify and close gaps throughout the year
3. **Risk Stratification**: Prioritize high-risk, high-impact patients
4. **Team-Based Care**: Engage care coordinators and navigators
5. **Data Quality**: Ensure accurate and complete documentation
6. **Benchmarking**: Compare performance against peers regularly
7. **Continuous Improvement**: Use data to drive quality improvement initiatives

---

## Support

For value-based care support:
- Technical Documentation: `/docs/modules/VALUE_BASED_CARE.md`
- API Reference: `/docs/API_REFERENCE.md#value-based-care-apis`
- Support Email: vbc-support@lithic.health

---

**Document Version**: 0.4.0
**Last Updated**: 2026-01-01
**Maintained By**: Agent 14 - Documentation Specialist
**Developed By**: Agent 4 - Value-Based Care
