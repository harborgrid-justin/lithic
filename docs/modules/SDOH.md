# Social Determinants of Health (SDOH) Module

**Module**: SDOH & Care Coordination
**Version**: 0.4.0
**Date**: 2026-01-01
**Agent**: Agent 7 - SDOH & Care Coordination

## Table of Contents

1. [Overview](#overview)
2. [Screening Tools](#screening-tools)
3. [Resource Matching](#resource-matching)
4. [Referral Workflow](#referral-workflow)
5. [Outcomes Tracking](#outcomes-tracking)
6. [Clinical Integration](#clinical-integration)
7. [Configuration](#configuration)
8. [Usage Examples](#usage-examples)

---

## Overview

The SDOH Module provides comprehensive tools for identifying, addressing, and tracking social determinants of health. By integrating social needs screening, community resource matching, and referral management, the platform enables healthcare organizations to address the whole patient.

### Key Features

- **Standardized Screening**: PRAPARE, AHC-HRSN, and custom screening tools
- **Z-Code Mapping**: Automatic ICD-10 Z-code documentation
- **Resource Database**: Comprehensive community resource directory
- **Intelligent Matching**: Geographic and need-based resource matching
- **Referral Management**: Automated referral workflows with CBOs
- **Outcomes Tracking**: ROI measurement and impact analysis
- **Consent Management**: HIPAA-compliant consent for external referrals

### Addressed Social Needs

- Food Insecurity
- Housing Instability
- Transportation Barriers
- Utility Assistance Needs
- Interpersonal Safety Concerns
- Social Isolation and Loneliness
- Employment and Financial Strain
- Education Access
- Legal Services
- Childcare Needs

---

## Screening Tools

### PRAPARE Screening

Protocol for Responding to and Assessing Patient Assets, Risks, and Experiences.

#### Implementation

```typescript
import { PRAPAREScreener } from '@/lib/sdoh/screening/prapare';

const screener = new PRAPAREScreener();

const screening = await screener.conduct({
  patientId: 'patient_123',
  screenedBy: 'user_456',
  responses: {
    // Demographics
    race: ['white', 'hispanic'],
    ethnicity: 'hispanic',
    preferredLanguage: 'english',
    veteranStatus: false,

    // Family & Home
    householdSize: 4,
    housingStatus: 'rent',
    housingStability: {
      worriedAboutLosingHousing: 'sometimes',
      movingInPast12Months: 1,
    },

    // Money & Resources
    annualIncome: 35000,
    insuranceStatus: 'medicaid',
    financialResourceStrain: {
      foodInsecurity: 'often_true',
      utilityShutoff: 'sometimes_true',
      clothingInsecurity: 'never_true',
      childcareAffordability: 'often_true',
    },

    // Social & Emotional Health
    socialConnection: {
      howOftenSeePeople: 'less_than_once_per_week',
      stressLevel: 'quite_a_bit',
    },
    safetyAtHome: 'safe',

    // Optional
    refugeeOrImmigrantStatus: false,
    incarcerationHistory: false,
  },
});

console.log(screening);
// {
//   screeningId: 'screen_abc123',
//   identifiedNeeds: [
//     {
//       category: 'food_insecurity',
//       severity: 'high',
//       zCode: 'Z59.41',
//       priority: 'high',
//       response: 'often_true'
//     },
//     {
//       category: 'utility_assistance',
//       severity: 'moderate',
//       zCode: 'Z59.5',
//       priority: 'high',
//       response: 'sometimes_true'
//     },
//     {
//       category: 'childcare_affordability',
//       severity: 'high',
//       zCode: 'Z59.7',
//       priority: 'medium',
//       response: 'often_true'
//     },
//     {
//       category: 'social_isolation',
//       severity: 'moderate',
//       zCode: 'Z60.2',
//       priority: 'medium',
//       response: 'less_than_once_per_week'
//     }
//   ],
//   riskScore: 7,
//   recommendedActions: [
//     'Refer to food bank',
//     'Connect with utility assistance program',
//     'Social work consultation for childcare resources',
//     'Community connection program'
//   ]
// }
```

### AHC-HRSN Screening

Accountable Health Communities Health-Related Social Needs screening tool.

#### Implementation

```typescript
import { AHCScreener } from '@/lib/sdoh/screening/ahc-hrsn';

const screener = new AHCScreener();

const screening = await screener.conduct({
  patientId: 'patient_123',
  screenedBy: 'user_456',
  responses: {
    // Housing
    housingStatus: 'rent',
    housingConcerns: ['worried_about_losing_housing'],

    // Food
    foodInsecurity: {
      ranOutOfFood: 'sometimes_true',
        ranOutOfMoney: 'often_true',
    },

    // Transportation
    transportation: {
      lackOfTransportation: 'yes',
      medicalAppointmentsMissed: 2,
      medicationPickupDifficulty: 'yes',
    },

    // Utilities
    utilities: {
      utilityShutoffWorry: 'yes',
      shutoffOccurrence: 'past_6_months',
    },

    // Safety
    interpersonalSafety: {
      feelsSafe: 'no',
      specifyConcerns: 'domestic_violence',
    },
  },
});

console.log(screening.identifiedNeeds);
```

### Custom Screening

Create organization-specific screening tools.

```typescript
import { CustomScreener } from '@/lib/sdoh/screening/custom-screener';

const screener = new CustomScreener({
  name: 'Community Health Center SDOH Screen',
  questions: [
    {
      id: 'q1',
      text: 'In the past year, have you been unable to get health care when you needed it?',
      type: 'yes_no',
      category: 'healthcare_access',
      zCode: 'Z75.3',
    },
    {
      id: 'q2',
      text: 'Do you feel safe in your current living situation?',
      type: 'yes_no',
      category: 'interpersonal_safety',
      zCode: 'Z65.5',
    },
    // ... more questions
  ],
});

const result = await screener.conduct({
  patientId: 'patient_123',
  responses: { q1: 'yes', q2: 'no' },
});
```

### Z-Code Mapping

Automatic ICD-10 Z-code assignment for documentation and billing.

```typescript
import { ZCodeMapper } from '@/lib/sdoh/screening/z-code-mapper';

const mapper = new ZCodeMapper();

const zCode = mapper.getZCode({
  category: 'food_insecurity',
  severity: 'moderate',
  specifics: {
    type: 'insufficient_food_intake',
  },
});

console.log(zCode);
// {
//   code: 'Z59.41',
//   description: 'Food insecurity',
//   category: 'Problems related to housing and economic circumstances',
//   billable: true
// }
```

---

## Resource Matching

### Community Resource Database

Comprehensive database of community resources and services.

#### Resource Types

- Food Banks and Pantries
- Homeless Shelters and Housing Assistance
- Transportation Services
- Utility Assistance Programs
- Legal Aid Services
- Employment and Job Training
- Education Programs
- Mental Health Services
- Substance Abuse Treatment
- Domestic Violence Support

#### Resource Matcher

```typescript
import { ResourceMatcher } from '@/lib/sdoh/resources/matcher';

const matcher = new ResourceMatcher();

const resources = await matcher.findResources({
  need: 'food_insecurity',
  zipCode: '12345',
  radius: 10, // miles
  filters: {
    acceptsReferrals: true,
    hasCapacity: true,
    languages: ['english', 'spanish'],
    accessibilityFeatures: ['wheelchair_accessible'],
  },
  sort: 'distance',
  limit: 10,
});

console.log(resources);
// [
//   {
//     id: 'resource_123',
//     name: 'Community Food Bank',
//     category: 'food_assistance',
//     services: [
//       {
//         name: 'Food Pantry',
//         description: 'Emergency food assistance',
//         eligibility: 'Low-income individuals and families',
//         schedule: 'Monday-Friday 9AM-5PM',
//       },
//       {
//         name: 'SNAP Enrollment Assistance',
//         description: 'Help applying for SNAP benefits',
//         eligibility: 'All',
//       },
//     ],
//     address: {
//       street: '123 Main St',
//       city: 'Springfield',
//       state: 'IL',
//       zipCode: '12345',
//     },
//     contact: {
//       phone: '(555) 123-4567',
//       email: 'info@foodbank.org',
//       website: 'https://foodbank.org',
//     },
//     hours: {
//       monday: '9:00-17:00',
//       tuesday: '9:00-17:00',
//       // ...
//     },
//     languages: ['english', 'spanish'],
//     accessibility: ['wheelchair_accessible', 'parking_available'],
//     distance: 2.3,
//     availability: 'accepting_referrals',
//     ratings: {
//       average: 4.7,
//       count: 245,
//     },
//   },
// ]
```

### FindHelp.org Integration

Integration with FindHelp.org (formerly Aunt Bertha) for nationwide resource directory.

```typescript
import { FindHelpIntegration } from '@/lib/sdoh/resources/findhelp-integration';

const findHelp = new FindHelpIntegration({
  apiKey: process.env.FINDHELP_API_KEY,
});

const resources = await findHelp.search({
  category: 'food',
  location: {
    zipCode: '12345',
    radius: 25,
  },
  subcategories: ['food_pantry', 'meal_program'],
});

console.log(resources);
```

---

## Referral Workflow

### Creating Referrals

```typescript
import { ReferralEngine } from '@/lib/sdoh/referrals/referral-engine';

const engine = new ReferralEngine();

const referral = await engine.createReferral({
  patientId: 'patient_123',
  screeningId: 'screen_abc123',
  resourceId: 'resource_123',
  need: 'food_insecurity',
  urgency: 'routine', // 'urgent' | 'routine'
  notes: 'Patient reports difficulty affording food after paying rent. Family of 4 with annual income $35,000.',
  consent: {
    obtained: true,
    consentFormId: 'consent_456',
    consentedBy: 'patient_123',
    consentDate: '2026-01-01',
  },
  preferredContactMethod: 'phone',
  preferredLanguage: 'spanish',
});

console.log(referral);
// {
//   referralId: 'ref_xyz789',
//   status: 'pending',
//   trackingNumber: 'REF-2026-001234',
//   createdAt: '2026-01-01T10:30:00Z',
//   expectedResponseTime: 48,
//   nextSteps: [
//     'CBO will contact patient within 48 hours',
//     'Follow up in 1 week to check on referral status'
//   ]
// }
```

### CBO Integration

Bidirectional integration with Community-Based Organizations.

```typescript
import { CBOIntegration } from '@/lib/sdoh/referrals/cbo-integration';

const cbo = new CBOIntegration({
  organizationId: 'resource_123',
  integrationMethod: 'api', // 'api' | 'email' | 'fax' | 'web_form'
});

// Send referral to CBO
await cbo.sendReferral({
  referralId: 'ref_xyz789',
  patientInfo: {
    firstName: 'John',
    lastName: 'Smith',
    phone: '(555) 123-4567',
    email: 'john.smith@example.com',
    preferredLanguage: 'spanish',
  },
  needDescription: 'Food insecurity, family of 4',
  urgency: 'routine',
});

// Receive status updates from CBO
cbo.on('status_update', async (update) => {
  await ReferralEngine.updateStatus({
    referralId: update.referralId,
    status: update.status,
    notes: update.notes,
    updatedBy: update.cboUserId,
  });
});
```

### Consent Management

```typescript
import { ConsentManager } from '@/lib/sdoh/referrals/consent-manager';

const consentMgr = new ConsentManager();

// Obtain consent for referral
const consent = await consentMgr.obtainConsent({
  patientId: 'patient_123',
  purpose: 'external_referral',
  organization: 'Community Food Bank',
  dataSharing: {
    personalInfo: true,
    medicalInfo: false,
    financialInfo: true,
  },
  validUntil: '2027-01-01',
});

// Check consent before sharing data
const hasConsent = await consentMgr.checkConsent({
  patientId: 'patient_123',
  purpose: 'external_referral',
  organization: 'Community Food Bank',
});

if (!hasConsent) {
  throw new Error('Patient consent required for external referral');
}
```

### Referral Tracking

```typescript
import { ReferralTracker } from '@/lib/sdoh/referrals/tracker';

const tracker = new ReferralTracker();

// Get referral status
const status = await tracker.getStatus('ref_xyz789');

console.log(status);
// {
//   referralId: 'ref_xyz789',
//   status: 'service_provided',
//   timeline: [
//     {
//       status: 'created',
//       timestamp: '2026-01-01T10:30:00Z',
//       actor: 'Dr. Smith',
//     },
//     {
//       status: 'sent_to_cbo',
//       timestamp: '2026-01-01T10:31:00Z',
//       actor: 'System',
//     },
//     {
//       status: 'accepted',
//       timestamp: '2026-01-01T14:00:00Z',
//       actor: 'Community Food Bank',
//     },
//     {
//       status: 'patient_contacted',
//       timestamp: '2026-01-02T09:00:00Z',
//       actor: 'Maria Garcia (CBO)',
//     },
//     {
//       status: 'service_provided',
//       timestamp: '2026-01-03T11:00:00Z',
//       actor: 'Community Food Bank',
//       notes: 'Patient received 1 week of emergency food. Enrolled in SNAP program.',
//     },
//   ],
//   currentAssignee: 'Community Food Bank',
//   daysOpen: 2,
// }
```

---

## Outcomes Tracking

### Measuring Impact

Track outcomes and ROI of SDOH interventions.

```typescript
import { OutcomesTracker } from '@/lib/sdoh/outcomes/tracker';

const tracker = new OutcomesTracker();

// Record outcome
await tracker.recordOutcome({
  referralId: 'ref_xyz789',
  patientId: 'patient_123',
  need: 'food_insecurity',
  outcome: {
    needMet: true,
    servicesReceived: ['food_pantry_access', 'snap_enrollment'],
    timeToResolution: 3, // days
    patientSatisfaction: 5, // 1-5 scale
    followUpNeeded: false,
  },
});

// Get patient outcomes
const outcomes = await tracker.getPatientOutcomes('patient_123');

console.log(outcomes);
// {
//   patientId: 'patient_123',
//   screeningsCompleted: 3,
//   identifiedNeeds: 4,
//   referralsMade: 3,
//   needsResolved: 2,
//   needsOngoing: 1,
//   needsUnmet: 1,
//   outcomes: [
//     {
//       need: 'food_insecurity',
//       status: 'resolved',
//       resolution: 'Enrolled in SNAP program',
//       timeToResolution: 3,
//     },
//     {
//       need: 'transportation',
//       status: 'ongoing',
//       currentServices: ['Medical transportation vouchers'],
//     },
//   ],
// }
```

### ROI Analytics

```typescript
import { ROICalculator } from '@/lib/sdoh/outcomes/analytics';

const roi = new ROICalculator();

// Calculate ROI for SDOH program
const analysis = await roi.calculate({
  timeframe: {
    start: '2025-01-01',
    end: '2025-12-31',
  },
  population: {
    patientCount: 1000,
    screenedCount: 850,
    referredCount: 320,
  },
  costs: {
    staffing: 200000,
    technology: 50000,
    cboPartners: 30000,
  },
});

console.log(analysis);
// {
//   totalCosts: 280000,
//   measuredBenefits: {
//     edVisitsAvoided: 145,
//     edVisitSavings: 290000,
//     hospitalizationsAvoided: 28,
//     hospitalizationSavings: 420000,
//     improvedMedicationAdherence: 180,
//     adherenceSavings: 90000,
//   },
//   totalSavings: 800000,
//   netBenefit: 520000,
//   roi: 1.86, // $1.86 return per $1 invested
//   qualityMetrics: {
//     patientSatisfactionImprovement: 0.32,
//     healthOutcomeImprovement: 0.24,
//     qualityOfLifeImprovement: 0.35,
//   },
// }
```

---

## Clinical Integration

### EHR Integration

SDOH data integrated throughout clinical workflows.

#### Problem List

```typescript
// Automatically add SDOH problems to problem list
await addToProblemList({
  patientId: 'patient_123',
  problems: [
    {
      code: 'Z59.41',
      description: 'Food insecurity',
      status: 'active',
      onset: '2026-01-01',
      severity: 'moderate',
    },
    {
      code: 'Z59.5',
      description: 'Extreme poverty',
      status: 'active',
      onset: '2026-01-01',
    },
  ],
});
```

#### Care Plan Integration

```typescript
// Add SDOH interventions to care plan
await addToCarePlan({
  patientId: 'patient_123',
  goals: [
    {
      description: 'Patient will have consistent access to nutritious food',
      targetDate: '2026-03-01',
      interventions: [
        'Referral to community food bank',
        'SNAP enrollment assistance',
        'Nutrition counseling',
      ],
      status: 'in_progress',
    },
  ],
});
```

#### Quality Measures

SDOH screening and intervention tracking for quality reporting.

```typescript
import { SDOHQualityMeasures } from '@/lib/sdoh/quality';

const measures = new SDOHQualityMeasures();

// Calculate screening rate
const screeningRate = await measures.calculateScreeningRate({
  timeframe: '2025',
  population: 'all_adults',
});

console.log(screeningRate);
// {
//   numerator: 8500, // Patients screened
//   denominator: 10000, // Eligible patients
//   rate: 0.85,
//   benchmark: 0.80,
//   meetsTarget: true
// }
```

---

## Configuration

### Environment Variables

```bash
# Resource Database
SDOH_RESOURCES_API=https://resources.lithic.health
SDOH_RESOURCES_API_KEY=...

# FindHelp.org Integration
FINDHELP_API_KEY=...
FINDHELP_API_URL=https://api.findhelp.org/v1

# Screening Configuration
ENABLE_PRAPARE=true
ENABLE_AHC_HRSN=true
ENABLE_CUSTOM_SCREENING=true

# Referral Settings
REFERRAL_FOLLOW_UP_DAYS=7
REFERRAL_AUTO_REMINDER=true
REFERRAL_CONSENT_REQUIRED=true

# Analytics
SDOH_ANALYTICS_ENABLED=true
ROI_TRACKING_ENABLED=true
```

### Custom Resource Database

```typescript
// Add organization-specific resources
import { ResourceDatabase } from '@/lib/sdoh/resources/resource-database';

const db = new ResourceDatabase();

await db.addResource({
  name: 'Local Food Pantry',
  category: 'food_assistance',
  services: ['emergency_food', 'nutrition_education'],
  address: {
    street: '456 Oak St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '12345',
  },
  contact: {
    phone: '(555) 234-5678',
    email: 'info@localpantry.org',
  },
  eligibility: 'Households at or below 185% FPL',
  acceptsReferrals: true,
  referralMethod: 'phone',
});
```

---

## Best Practices

1. **Universal Screening**: Screen all patients for SDOH at least annually
2. **Trauma-Informed Care**: Use sensitive, non-stigmatizing language
3. **Patient Privacy**: Protect SDOH data with appropriate security measures
4. **Cultural Competency**: Provide multilingual screening and resources
5. **Follow-Up**: Systematically follow up on referrals
6. **CBO Partnerships**: Build strong relationships with community organizations
7. **Data Quality**: Regularly update resource directory
8. **Outcome Measurement**: Track and report on SDOH intervention outcomes

---

## Support

For SDOH module support:
- Technical Documentation: `/docs/modules/SDOH.md`
- API Reference: `/docs/API_REFERENCE.md#sdoh-apis`
- Support Email: sdoh-support@lithic.health

---

**Document Version**: 0.4.0
**Last Updated**: 2026-01-01
**Maintained By**: Agent 14 - Documentation Specialist
**Developed By**: Agent 7 - SDOH & Care Coordination
