# Lithic Enterprise Healthcare Platform - API Reference

**Version**: 0.4.0
**Date**: 2026-01-01
**Base URL**: `https://api.lithic.health/v1`

## Table of Contents

1. [Authentication](#authentication)
2. [AI/ML APIs (NEW v0.4)](#aiml-apis-new-v04)
3. [Genomics APIs (NEW v0.4)](#genomics-apis-new-v04)
4. [SDOH APIs (NEW v0.4)](#sdoh-apis-new-v04)
5. [Value-Based Care APIs (NEW v0.4)](#value-based-care-apis-new-v04)
6. [Collaboration APIs (NEW v0.4)](#collaboration-apis-new-v04)
7. [Patient APIs](#patient-apis)
8. [Clinical APIs](#clinical-apis)
9. [Scheduling APIs](#scheduling-apis)
10. [Billing APIs](#billing-apis)
11. [Analytics APIs](#analytics-apis)
12. [FHIR APIs](#fhir-apis)
13. [Rate Limiting](#rate-limiting)
14. [Error Codes](#error-codes)

---

## Authentication

All API endpoints require authentication via JWT bearer token or session cookie.

### Obtain Access Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "mfaCode": "123456" // Optional, required if MFA enabled
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "physician"
  }
}
```

### Using the Access Token

Include the access token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## AI/ML APIs (NEW v0.4)

### Chat with GPT-4 Clinical Assistant

```http
POST /api/ai/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "What are the differential diagnoses for a patient with fever, cough, and shortness of breath?",
  "conversationId": "conv_123", // Optional, for continuing conversation
  "context": {
    "patientId": "patient_456",
    "encounterId": "enc_789"
  }
}
```

**Response:**
```json
{
  "response": "Based on the symptoms of fever, cough, and shortness of breath, the differential diagnoses include:\n\n1. Community-acquired pneumonia (CAP)\n2. COVID-19\n3. Influenza\n4. Acute bronchitis\n5. Exacerbation of COPD\n...",
  "conversationId": "conv_123",
  "tokensUsed": 245,
  "sources": ["CDC Guidelines", "UpToDate"],
  "confidence": 0.92
}
```

### Summarize Clinical Notes

```http
POST /api/ai/summarize
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Patient presents with...", // Clinical note text
  "summaryType": "brief", // "brief" | "comprehensive" | "discharge"
  "maxLength": 250
}
```

**Response:**
```json
{
  "summary": "72-year-old male with history of hypertension and diabetes presents with acute chest pain. ECG shows ST elevation in leads II, III, aVF. Troponin elevated at 2.5. Diagnosis: Acute inferior STEMI. Treatment: Emergent PCI performed with stent placement to RCA.",
  "keyFindings": [
    "Acute inferior STEMI",
    "Elevated troponin (2.5)",
    "PCI with stent to RCA"
  ],
  "tokensUsed": 180
}
```

### Predict Readmission Risk

```http
POST /api/ai/predict/readmission
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": "patient_123",
  "encounterData": {
    "diagnoses": ["I21.09", "I10"],
    "procedures": ["PCI"],
    "medications": ["aspirin", "clopidogrel", "atorvastatin"],
    "lengthOfStay": 3,
    "age": 72,
    "comorbidities": ["diabetes", "hypertension"],
    "vitalSigns": {
      "heartRate": 78,
      "bloodPressure": "140/85",
      "respiratoryRate": 16
    }
  },
  "timeframe": 30 // 30, 60, or 90 days
}
```

**Response:**
```json
{
  "riskScore": 0.32,
  "riskCategory": "moderate",
  "confidenceInterval": [0.28, 0.36],
  "contributingFactors": [
    {
      "factor": "Multiple comorbidities",
      "importance": 0.25
    },
    {
      "factor": "Recent MI",
      "importance": 0.22
    },
    {
      "factor": "Age > 65",
      "importance": 0.18
    }
  ],
  "recommendations": [
    "Schedule follow-up within 7 days",
    "Home health nursing evaluation",
    "Medication reconciliation"
  ],
  "modelVersion": "readmission_v2.1.0",
  "timestamp": "2026-01-01T10:30:00Z"
}
```

### Predict Sepsis Risk

```http
POST /api/ai/predict/sepsis
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": "patient_123",
  "vitalSigns": {
    "temperature": 38.9,
    "heartRate": 110,
    "respiratoryRate": 24,
    "bloodPressure": "90/55",
    "oxygenSaturation": 94
  },
  "labResults": {
    "wbc": 15.2,
    "lactate": 3.5,
    "creatinine": 1.8
  },
  "demographics": {
    "age": 68,
    "gender": "female"
  }
}
```

**Response:**
```json
{
  "sepsisRisk": 0.78,
  "riskLevel": "high",
  "alert": true,
  "qSOFAScore": 2,
  "recommendations": [
    "Immediate physician notification",
    "Blood cultures x2",
    "Lactate measurement",
    "Broad-spectrum antibiotics within 1 hour",
    "Fluid resuscitation"
  ],
  "trendingWorse": true,
  "modelVersion": "sepsis_v3.0.0",
  "timestamp": "2026-01-01T10:30:00Z"
}
```

### Extract Clinical Entities

```http
POST /api/ai/nlp/extract
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Patient reports severe headache for 3 days. Taking ibuprofen 600mg TID. History of migraines. Denies fever, neck stiffness, or vision changes.",
  "entityTypes": ["medication", "symptom", "diagnosis", "dosage"]
}
```

**Response:**
```json
{
  "entities": {
    "medications": [
      {
        "text": "ibuprofen",
        "rxnormCode": "5640",
        "dosage": "600mg",
        "frequency": "TID",
        "confidence": 0.98
      }
    ],
    "symptoms": [
      {
        "text": "severe headache",
        "snomedCode": "25064002",
        "severity": "severe",
        "duration": "3 days",
        "confidence": 0.95
      }
    ],
    "diagnoses": [
      {
        "text": "migraines",
        "icd10Code": "G43.909",
        "status": "history",
        "confidence": 0.92
      }
    ]
  },
  "processingTime": 245
}
```

### List AI Models

```http
GET /api/ai/models
Authorization: Bearer {token}
```

**Response:**
```json
{
  "models": [
    {
      "id": "readmission_v2.1.0",
      "name": "Readmission Risk Predictor",
      "version": "2.1.0",
      "type": "classification",
      "accuracy": 0.87,
      "auc": 0.91,
      "status": "active",
      "lastUpdated": "2026-01-01T00:00:00Z"
    },
    {
      "id": "sepsis_v3.0.0",
      "name": "Sepsis Early Warning",
      "version": "3.0.0",
      "type": "classification",
      "accuracy": 0.92,
      "auc": 0.94,
      "status": "active",
      "lastUpdated": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

## Genomics APIs (NEW v0.4)

### Upload VCF File

```http
POST /api/genomics/vcf/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "file": <VCF file>,
  "patientId": "patient_123",
  "testType": "whole_genome", // "whole_genome" | "exome" | "panel"
  "lab": "GenomeLab Inc",
  "collectionDate": "2026-01-01"
}
```

**Response:**
```json
{
  "uploadId": "upload_abc123",
  "status": "processing",
  "fileName": "patient_123_wgs.vcf.gz",
  "fileSize": 2147483648,
  "variantCount": null,
  "estimatedProcessingTime": 600
}
```

### Get VCF Processing Status

```http
GET /api/genomics/vcf/status/{uploadId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "uploadId": "upload_abc123",
  "status": "completed",
  "progress": 100,
  "variantCount": 4582901,
  "pathogenicVariants": 12,
  "pgxVariants": 45,
  "completedAt": "2026-01-01T10:45:00Z"
}
```

### Analyze Pharmacogenomics

```http
POST /api/genomics/pgx/analyze
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": "patient_123",
  "uploadId": "upload_abc123",
  "medications": ["warfarin", "clopidogrel", "codeine"]
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "medication": "warfarin",
      "gene": "CYP2C9",
      "genotype": "*1/*3",
      "phenotype": "intermediate_metabolizer",
      "recommendation": "Consider 25-50% dose reduction. Monitor INR closely.",
      "cpicLevel": "A",
      "cpicGuideline": "https://cpicpgx.org/guidelines/guideline-for-warfarin-and-cyp2c9-and-vkorc1/"
    },
    {
      "medication": "clopidogrel",
      "gene": "CYP2C19",
      "genotype": "*1/*2",
      "phenotype": "intermediate_metabolizer",
      "recommendation": "Consider alternative P2Y12 inhibitor (prasugrel or ticagrelor).",
      "cpicLevel": "A",
      "alert": true
    },
    {
      "medication": "codeine",
      "gene": "CYP2D6",
      "genotype": "*1/*1",
      "phenotype": "normal_metabolizer",
      "recommendation": "Standard dosing appropriate.",
      "cpicLevel": "A"
    }
  ],
  "reportId": "pgx_report_456"
}
```

### Get Genetic Risk Assessment

```http
POST /api/genomics/risk/assess
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": "patient_123",
  "uploadId": "upload_abc123",
  "riskTypes": ["cancer", "cardiac", "pharmacogenomics"]
}
```

**Response:**
```json
{
  "riskAssessment": {
    "cancer": {
      "breastCancer": {
        "risk": "increased",
        "relativeRisk": 5.2,
        "variants": [
          {
            "gene": "BRCA1",
            "variant": "c.5266dupC",
            "classification": "pathogenic",
            "clinvarId": "VCV000012345"
          }
        ],
        "recommendations": [
          "Genetic counseling referral",
          "Enhanced screening starting age 30",
          "Consider prophylactic measures"
        ]
      },
      "colonCancer": {
        "risk": "average",
        "relativeRisk": 1.1
      }
    },
    "cardiac": {
      "familialHypercholesterolemia": {
        "risk": "low",
        "relativeRisk": 0.8
      },
      "longQT": {
        "risk": "low",
        "relativeRisk": 0.9
      }
    }
  },
  "reportGenerated": true,
  "reportId": "risk_report_789"
}
```

### Get Genomics Report

```http
GET /api/genomics/report/{patientId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "patientId": "patient_123",
  "reportId": "report_comprehensive_123",
  "generatedAt": "2026-01-01T11:00:00Z",
  "sections": {
    "pharmacogenomics": {
      "url": "/reports/patient_123_pgx.pdf",
      "summary": "12 actionable medication recommendations"
    },
    "riskAssessment": {
      "url": "/reports/patient_123_risk.pdf",
      "summary": "1 high-risk variant identified (BRCA1)"
    },
    "carrierStatus": {
      "url": "/reports/patient_123_carrier.pdf",
      "summary": "Carrier for cystic fibrosis (CFTR)"
    }
  },
  "clinicalReview": {
    "status": "reviewed",
    "reviewedBy": "Dr. Sarah Johnson, Genetic Counselor",
    "reviewDate": "2026-01-01T14:00:00Z"
  }
}
```

---

## SDOH APIs (NEW v0.4)

### Conduct SDOH Screening

```http
POST /api/sdoh/screen
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": "patient_123",
  "screeningTool": "PRAPARE", // "PRAPARE" | "AHC_HRSN" | "custom"
  "responses": {
    "housing_stability": "stable",
    "food_insecurity": "sometimes_true",
    "transportation": "no_difficulty",
    "utility_assistance": "yes",
    "safety_concerns": "no",
    "social_isolation": "moderate"
  },
  "screenedBy": "user_456",
  "screeningDate": "2026-01-01"
}
```

**Response:**
```json
{
  "screeningId": "screen_abc123",
  "identifiedNeeds": [
    {
      "category": "food_insecurity",
      "severity": "moderate",
      "zCode": "Z59.41",
      "priority": "high"
    },
    {
      "category": "utility_assistance",
      "severity": "high",
      "zCode": "Z59.5",
      "priority": "high"
    },
    {
      "category": "social_isolation",
      "severity": "moderate",
      "zCode": "Z60.2",
      "priority": "medium"
    }
  ],
  "recommendedActions": [
    "Refer to food bank",
    "Connect with utility assistance program",
    "Social work consultation"
  ],
  "riskScore": 6
}
```

### Search Community Resources

```http
GET /api/sdoh/resources/search
Authorization: Bearer {token}
Query Parameters:
  - need: food_insecurity
  - zipCode: 12345
  - radius: 10 (miles)
  - limit: 20
```

**Response:**
```json
{
  "resources": [
    {
      "id": "resource_123",
      "name": "Community Food Bank",
      "category": "food_assistance",
      "services": ["food_pantry", "meal_program"],
      "address": {
        "street": "123 Main St",
        "city": "Springfield",
        "state": "IL",
        "zipCode": "12345"
      },
      "contact": {
        "phone": "(555) 123-4567",
        "email": "info@foodbank.org",
        "website": "https://foodbank.org"
      },
      "hours": {
        "monday": "9:00-17:00",
        "tuesday": "9:00-17:00",
        "wednesday": "9:00-17:00",
        "thursday": "9:00-17:00",
        "friday": "9:00-17:00"
      },
      "eligibility": "Low-income individuals and families",
      "distance": 2.3,
      "availability": "accepting_referrals"
    }
  ],
  "totalResults": 8
}
```

### Create Referral

```http
POST /api/sdoh/referral
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": "patient_123",
  "screeningId": "screen_abc123",
  "resourceId": "resource_123",
  "need": "food_insecurity",
  "urgency": "routine", // "urgent" | "routine"
  "notes": "Patient reports difficulty affording food after paying rent",
  "consentObtained": true
}
```

**Response:**
```json
{
  "referralId": "ref_xyz789",
  "status": "pending",
  "createdAt": "2026-01-01T10:30:00Z",
  "tracking": {
    "trackingNumber": "REF-2026-001234",
    "expectedResponseTime": 48
  },
  "nextSteps": [
    "CBO will contact patient within 48 hours",
    "Follow up in 1 week to check on referral status"
  ]
}
```

### Track Referral Status

```http
GET /api/sdoh/referral/{referralId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "referralId": "ref_xyz789",
  "status": "completed",
  "timeline": [
    {
      "status": "created",
      "timestamp": "2026-01-01T10:30:00Z",
      "actor": "Dr. Smith"
    },
    {
      "status": "sent_to_cbo",
      "timestamp": "2026-01-01T10:31:00Z",
      "actor": "System"
    },
    {
      "status": "accepted",
      "timestamp": "2026-01-01T14:00:00Z",
      "actor": "Community Food Bank"
    },
    {
      "status": "patient_contacted",
      "timestamp": "2026-01-02T09:00:00Z",
      "actor": "Community Food Bank"
    },
    {
      "status": "service_provided",
      "timestamp": "2026-01-03T11:00:00Z",
      "actor": "Community Food Bank"
    },
    {
      "status": "completed",
      "timestamp": "2026-01-03T11:30:00Z",
      "actor": "Community Food Bank"
    }
  ],
  "outcome": {
    "needMet": true,
    "servicesProvided": ["food_pantry_access", "snap_enrollment_assistance"],
    "followUpNeeded": false,
    "patientSatisfaction": 5
  }
}
```

### Track SDOH Outcomes

```http
GET /api/sdoh/outcomes/{patientId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "patientId": "patient_123",
  "screeningsCompleted": 3,
  "identifiedNeeds": [
    {
      "need": "food_insecurity",
      "status": "resolved",
      "referralsMade": 1,
      "resolution": "Patient enrolled in SNAP program"
    },
    {
      "need": "transportation",
      "status": "ongoing",
      "referralsMade": 2,
      "currentServices": ["Medical transportation vouchers"]
    }
  ],
  "roi": {
    "edVisitsAvoided": 2,
    "estimatedSavings": 4800,
    "qualityOfLifeImprovement": 35
  }
}
```

---

## Value-Based Care APIs (NEW v0.4)

### Get ACO Performance

```http
GET /api/vbc/aco/performance
Authorization: Bearer {token}
Query Parameters:
  - period: 2025
  - acoId: aco_123
```

**Response:**
```json
{
  "acoId": "aco_123",
  "acoName": "Metro Health ACO",
  "performancePeriod": "2025",
  "metrics": {
    "totalBeneficiaries": 15240,
    "qualityScore": 92.5,
    "financialPerformance": {
      "totalExpenditure": 142500000,
      "benchmark": 148000000,
      "savings": 5500000,
      "savingsRate": 3.72,
      "qualityThresholdMet": true,
      "sharedSavingsAmount": 2750000
    },
    "utilizationMetrics": {
      "admissionsPerThousand": 245,
      "readmissions30Day": 12.3,
      "edVisitsPerThousand": 420,
      "averageLengthOfStay": 4.2
    },
    "qualityMeasures": {
      "acm01_diabetes_hba1c": 88.5,
      "acm02_hypertension_control": 72.3,
      "acm03_preventive_care": 85.2,
      "acm04_depression_screening": 91.0
    }
  },
  "trend": "improving",
  "ranking": 12,
  "totalAcos": 245
}
```

### Calculate Patient Attribution

```http
POST /api/vbc/aco/attribution
Authorization: Bearer {token}
Content-Type: application/json

{
  "acoId": "aco_123",
  "beneficiaryId": "bene_456",
  "claimsData": {
    "primaryCareVisits": [
      {
        "providerId": "prov_789",
        "date": "2025-03-15",
        "allowed": 150
      },
      {
        "providerId": "prov_789",
        "date": "2025-08-22",
        "allowed": 150
      }
    ],
    "specialistVisits": [],
    "totalAllowed": 300
  },
  "attributionMethod": "step_wise" // "step_wise" | "voluntary"
}
```

**Response:**
```json
{
  "beneficiaryId": "bene_456",
  "attributed": true,
  "attributionMethod": "step_wise",
  "attributedProvider": {
    "providerId": "prov_789",
    "npi": "1234567890",
    "name": "Dr. John Smith",
    "specialty": "Internal Medicine"
  },
  "attributionScore": 95,
  "riskScore": 1.23,
  "estimatedCost": 12500
}
```

### Get MIPS Final Score

```http
GET /api/vbc/mips/score
Authorization: Bearer {token}
Query Parameters:
  - providerId: prov_789
  - year: 2025
```

**Response:**
```json
{
  "providerId": "prov_789",
  "providerName": "Dr. John Smith",
  "npi": "1234567890",
  "performanceYear": 2025,
  "finalScore": 87.25,
  "paymentAdjustment": 1.75,
  "categories": {
    "quality": {
      "score": 85.0,
      "weight": 0.45,
      "weightedScore": 38.25,
      "measureCount": 6,
      "bonus": 5.0
    },
    "cost": {
      "score": 72.0,
      "weight": 0.15,
      "weightedScore": 10.80
    },
    "improvementActivities": {
      "score": 100.0,
      "weight": 0.15,
      "weightedScore": 15.00,
      "activitiesCompleted": 4
    },
    "promotingInteroperability": {
      "score": 95.0,
      "weight": 0.25,
      "weightedScore": 23.75,
      "exclusion": false
    }
  },
  "comparisonData": {
    "nationalAverage": 75.5,
    "specialtyAverage": 78.2,
    "percentile": 85
  }
}
```

### Identify Care Gaps

```http
GET /api/vbc/care-gaps
Authorization: Bearer {token}
Query Parameters:
  - patientId: patient_123
  - measureSet: HEDIS_2025
```

**Response:**
```json
{
  "patientId": "patient_123",
  "gaps": [
    {
      "measure": "COL",
      "measureName": "Colorectal Cancer Screening",
      "status": "open",
      "dueDate": "2026-12-31",
      "priority": "high",
      "recommendedAction": "Order colonoscopy or FIT test",
      "eligibility": {
        "age": 58,
        "lastScreening": null,
        "averageRisk": true
      }
    },
    {
      "measure": "CDC",
      "measureName": "Diabetes HbA1c Control",
      "status": "open",
      "dueDate": "2026-03-01",
      "priority": "high",
      "lastValue": 8.2,
      "targetValue": "<7.0",
      "recommendedAction": "Order HbA1c test. Consider medication adjustment."
    },
    {
      "measure": "CBP",
      "measureName": "Controlling High Blood Pressure",
      "status": "closed",
      "lastMeasurement": {
        "value": "128/78",
        "date": "2025-12-15",
        "controlled": true
      }
    }
  ],
  "totalGaps": 2,
  "closedGaps": 1,
  "qualityScore": 33.3
}
```

---

## Collaboration APIs (NEW v0.4)

### Create Video Room

```http
POST /api/collaboration/room/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Cardiology Consult - Patient Smith",
  "participants": ["user_123", "user_456", "user_789"],
  "recording": true,
  "maxDuration": 3600,
  "waitingRoom": true
}
```

**Response:**
```json
{
  "roomId": "room_abc123",
  "roomUrl": "https://lithic.health/collab/room_abc123",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "participants": [
    {
      "userId": "user_123",
      "role": "moderator",
      "token": "participant_token_1"
    },
    {
      "userId": "user_456",
      "role": "participant",
      "token": "participant_token_2"
    }
  ],
  "createdAt": "2026-01-01T10:30:00Z",
  "expiresAt": "2026-01-01T11:30:00Z"
}
```

### Get Whiteboard State

```http
GET /api/collaboration/whiteboard/{whiteboardId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "whiteboardId": "wb_123",
  "state": {
    "objects": [
      {
        "type": "text",
        "content": "Differential Diagnosis",
        "x": 100,
        "y": 50,
        "fontSize": 24,
        "color": "#000000"
      },
      {
        "type": "arrow",
        "points": [150, 100, 300, 200],
        "color": "#FF0000",
        "width": 2
      }
    ],
    "version": 42
  },
  "activeUsers": ["user_123", "user_456"],
  "lastModified": "2026-01-01T10:35:00Z"
}
```

### Update User Presence

```http
POST /api/collaboration/presence/update
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "available", // "available" | "busy" | "away" | "offline"
  "customMessage": "In patient room, available for urgent matters"
}
```

**Response:**
```json
{
  "userId": "user_123",
  "status": "available",
  "customMessage": "In patient room, available for urgent matters",
  "lastSeen": "2026-01-01T10:30:00Z"
}
```

---

## Rate Limiting

All API endpoints are subject to rate limiting to ensure fair usage and system stability.

### Rate Limit Headers

Every API response includes rate limit information in the headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1640000000
```

### Rate Limits by Endpoint

| Endpoint Category | Requests per Minute | Burst Limit |
|-------------------|---------------------|-------------|
| Authentication | 10 | 20 |
| AI/ML Inference | 60 | 100 |
| Genomics Upload | 10 | 15 |
| Standard APIs | 1000 | 1500 |
| FHIR APIs | 500 | 750 |
| Webhooks | 100 | 200 |

### Rate Limit Exceeded Response

```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded. Please try again in 45 seconds.",
  "retryAfter": 45
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Response Format

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "patientId",
        "message": "Patient ID is required"
      }
    ],
    "requestId": "req_abc123",
    "timestamp": "2026-01-01T10:30:00Z"
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `invalid_request` | Malformed request |
| `authentication_required` | Missing or invalid authentication |
| `insufficient_permissions` | User lacks required permissions |
| `resource_not_found` | Requested resource does not exist |
| `validation_error` | Input validation failed |
| `rate_limit_exceeded` | Too many requests |
| `internal_error` | Internal server error |
| `service_unavailable` | Service temporarily unavailable |

---

## Pagination

List endpoints support pagination using cursor-based pagination.

### Request

```http
GET /api/patients?limit=50&cursor=eyJpZCI6MTIzNDU2fQ
```

### Response

```json
{
  "data": [...],
  "pagination": {
    "limit": 50,
    "hasMore": true,
    "nextCursor": "eyJpZCI6MTIzNTA2fQ",
    "total": 1250
  }
}
```

---

## Versioning

The API uses URL versioning. The current version is `v1`.

- Current version: `https://api.lithic.health/v1`
- Legacy version: `https://api.lithic.health/v0` (deprecated)

---

## Support

For API support:
- Documentation: https://docs.lithic.health
- Developer Portal: https://developers.lithic.health
- Support Email: api-support@lithic.health
- Status Page: https://status.lithic.health

---

**Document Version**: 0.4.0
**Last Updated**: 2026-01-01
**Maintained By**: Agent 14 - Documentation Specialist
