# Lithic Enterprise Healthcare Platform v0.4 - User Flow Diagrams

> Comprehensive Mermaid diagrams documenting all user experiences across the platform

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Authentication & Authorization Flows](#authentication--authorization-flows)
3. [Patient Experience Flows](#patient-experience-flows)
4. [Clinician Workflow Flows](#clinician-workflow-flows)
5. [Revenue Cycle Flows](#revenue-cycle-flows)
6. [Administrative Flows](#administrative-flows)
7. [AI/ML Integration Flows](#aiml-integration-flows)
8. [Genomics Platform Flows](#genomics-platform-flows)
9. [SDOH Module Flows](#sdoh-module-flows)
10. [Value-Based Care Flows](#value-based-care-flows)
11. [Real-time Collaboration Flows](#real-time-collaboration-flows)

---

## System Architecture Overview

```mermaid
graph TB
    subgraph "Lithic Enterprise Healthcare Platform v0.4"
        subgraph "Frontend Layer"
            PWA[Progressive Web App]
            WEB[Web Application]
            MOBILE[Mobile Apps]
        end

        subgraph "API Gateway"
            GATEWAY[Enterprise API Gateway]
            FHIR[FHIR R4 Server]
            HL7[HL7 v2 Broker]
            GRAPHQL[GraphQL API]
        end

        subgraph "Core Services"
            AUTH[Auth Service]
            PATIENT[Patient Service]
            CLINICAL[Clinical Service]
            BILLING[Billing Service]
            SCHEDULE[Scheduling Service]
            ANALYTICS[Analytics Engine]
        end

        subgraph "AI/ML Platform"
            GPT[GPT-4 Clinical Assistant]
            NLP[NLP Engine]
            PREDICT[Prediction Models]
            CV[Computer Vision]
        end

        subgraph "Specialty Modules"
            GENOMICS[Genomics Platform]
            SDOH[SDOH Module]
            VBC[Value-Based Care]
            ENGAGE[Patient Engagement]
        end

        subgraph "Data Layer"
            POSTGRES[(PostgreSQL)]
            REDIS[(Redis Cache)]
            ELASTIC[(Elasticsearch)]
            S3[(Object Storage)]
        end

        subgraph "Integration Layer"
            HIE[Health Information Exchange]
            PAYER[Payer Connections]
            LAB[Lab Interfaces]
            PHARMACY[Pharmacy Network]
        end
    end

    PWA --> GATEWAY
    WEB --> GATEWAY
    MOBILE --> GATEWAY
    GATEWAY --> AUTH
    GATEWAY --> FHIR
    GATEWAY --> HL7
    GATEWAY --> GRAPHQL
    AUTH --> PATIENT
    AUTH --> CLINICAL
    AUTH --> BILLING
    CLINICAL --> GPT
    CLINICAL --> NLP
    CLINICAL --> PREDICT
    ANALYTICS --> PREDICT
    PATIENT --> GENOMICS
    PATIENT --> SDOH
    BILLING --> VBC
    PATIENT --> ENGAGE
    PATIENT --> POSTGRES
    CLINICAL --> POSTGRES
    BILLING --> POSTGRES
    ANALYTICS --> ELASTIC
    AUTH --> REDIS
    CLINICAL --> S3
    FHIR --> HIE
    BILLING --> PAYER
    CLINICAL --> LAB
    CLINICAL --> PHARMACY
```

---

## Authentication & Authorization Flows

### Multi-Factor Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant AUTH as Auth Service
    participant MFA as MFA Service
    participant SSO as SSO Provider
    participant DB as Database
    participant AUDIT as Audit Log

    U->>FE: Enter credentials
    FE->>AUTH: POST /auth/login
    AUTH->>DB: Validate credentials
    DB-->>AUTH: User found
    AUTH->>AUTH: Check MFA requirement

    alt MFA Required
        AUTH->>MFA: Generate challenge
        MFA-->>AUTH: Challenge created
        AUTH-->>FE: MFA required
        FE->>U: Show MFA prompt

        alt TOTP Method
            U->>FE: Enter TOTP code
            FE->>MFA: Verify TOTP
            MFA-->>FE: Valid
        else SMS Method
            MFA->>U: Send SMS code
            U->>FE: Enter SMS code
            FE->>MFA: Verify SMS
            MFA-->>FE: Valid
        else Biometric
            U->>FE: Provide biometric
            FE->>MFA: Verify biometric
            MFA-->>FE: Valid
        end
    end

    AUTH->>DB: Create session
    AUTH->>AUDIT: Log authentication
    AUTH-->>FE: JWT + Refresh token
    FE->>U: Redirect to dashboard
```

### SSO Enterprise Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Lithic App
    participant AUTH as Auth Service
    participant IDP as Identity Provider
    participant SAML as SAML Service
    participant OIDC as OIDC Service
    participant PROV as Provisioning

    U->>FE: Click SSO Login
    FE->>AUTH: GET /auth/sso/init
    AUTH->>AUTH: Determine IdP

    alt SAML 2.0
        AUTH->>SAML: Generate AuthnRequest
        SAML-->>FE: Redirect to IdP
        FE->>IDP: SAML AuthnRequest
        IDP->>U: Show login
        U->>IDP: Authenticate
        IDP-->>FE: SAML Response
        FE->>SAML: POST /auth/sso/saml/callback
        SAML->>SAML: Validate assertion
        SAML->>PROV: Just-in-time provisioning
    else OIDC
        AUTH->>OIDC: Generate auth URL
        OIDC-->>FE: Redirect to IdP
        FE->>IDP: Authorization request
        IDP->>U: Show consent
        U->>IDP: Authorize
        IDP-->>FE: Auth code
        FE->>OIDC: POST /auth/sso/oidc/callback
        OIDC->>IDP: Exchange code for tokens
        IDP-->>OIDC: ID token + Access token
        OIDC->>PROV: Sync user attributes
    end

    PROV->>AUTH: Create/update session
    AUTH-->>FE: JWT tokens
    FE->>U: Access granted
```

### Role-Based Access Control Flow

```mermaid
flowchart TB
    subgraph "RBAC Authorization Flow"
        REQ[API Request] --> GATE{API Gateway}
        GATE --> |Extract JWT| VALID{Validate Token}
        VALID --> |Invalid| DENY1[401 Unauthorized]
        VALID --> |Valid| EXTRACT[Extract Claims]
        EXTRACT --> ROLES{Check Roles}
        ROLES --> PERMS{Check Permissions}

        subgraph "Permission Matrix"
            PERMS --> |Has Permission| CONTEXT{Context Check}
            PERMS --> |No Permission| DENY2[403 Forbidden]
            CONTEXT --> |Patient Context| PATIENT_CHECK{Patient Access?}
            CONTEXT --> |Org Context| ORG_CHECK{Organization Access?}
            CONTEXT --> |Resource Context| RESOURCE_CHECK{Resource Access?}
        end

        PATIENT_CHECK --> |Authorized| ALLOW[Allow Request]
        PATIENT_CHECK --> |Unauthorized| DENY3[403 Forbidden]
        ORG_CHECK --> |Authorized| ALLOW
        ORG_CHECK --> |Unauthorized| DENY3
        RESOURCE_CHECK --> |Authorized| ALLOW
        RESOURCE_CHECK --> |Unauthorized| DENY3

        ALLOW --> AUDIT[Audit Log]
        DENY1 --> AUDIT
        DENY2 --> AUDIT
        DENY3 --> AUDIT
    end

    subgraph "Role Hierarchy"
        SA[System Admin]
        OA[Org Admin]
        DA[Dept Admin]
        PHY[Physician]
        RN[Nurse]
        MA[Medical Assistant]
        REG[Registrar]
        PAT[Patient]

        SA --> OA
        OA --> DA
        DA --> PHY
        DA --> RN
        PHY --> MA
        RN --> MA
        MA --> REG
        REG --> PAT
    end
```

---

## Patient Experience Flows

### Patient Portal Journey

```mermaid
journey
    title Patient Portal User Journey
    section Registration
        Create Account: 5: Patient
        Verify Email: 4: Patient
        Complete Profile: 4: Patient
        Link Health Records: 5: Patient, System
    section Daily Use
        View Dashboard: 5: Patient
        Check Messages: 4: Patient
        Review Test Results: 5: Patient
        Request Refills: 5: Patient
    section Appointments
        Search Providers: 4: Patient
        Check Availability: 5: Patient, System
        Book Appointment: 5: Patient
        Receive Confirmation: 5: System
        Get Reminders: 5: System
        Check In Online: 5: Patient
    section After Visit
        View Visit Summary: 5: Patient
        Complete Surveys: 3: Patient
        Pay Bills: 4: Patient
        Schedule Follow-up: 5: Patient
```

### Patient Self-Scheduling Flow

```mermaid
sequenceDiagram
    participant P as Patient
    participant PP as Patient Portal
    participant SCHED as Scheduling Engine
    participant AVAIL as Availability Service
    participant PROV as Provider Calendar
    participant NOTIFY as Notification Service
    participant EHR as EHR System

    P->>PP: Access scheduling
    PP->>SCHED: Get schedulable services
    SCHED-->>PP: Available service types
    PP->>P: Show service options

    P->>PP: Select service type
    PP->>SCHED: Get matching providers
    SCHED-->>PP: Provider list with ratings
    PP->>P: Show providers

    P->>PP: Select provider
    PP->>AVAIL: Get availability
    AVAIL->>PROV: Query calendar
    PROV-->>AVAIL: Available slots
    AVAIL->>AVAIL: Apply scheduling rules
    AVAIL-->>PP: Filtered slots
    PP->>P: Show calendar

    P->>PP: Select time slot
    PP->>SCHED: Request appointment
    SCHED->>SCHED: Validate eligibility
    SCHED->>EHR: Check insurance
    EHR-->>SCHED: Coverage verified
    SCHED->>PROV: Reserve slot
    PROV-->>SCHED: Slot reserved
    SCHED->>EHR: Create encounter
    SCHED-->>PP: Confirmation

    PP->>NOTIFY: Send confirmations
    NOTIFY->>P: Email confirmation
    NOTIFY->>P: SMS confirmation
    NOTIFY->>P: Calendar invite
```

### Patient Engagement & Gamification Flow

```mermaid
flowchart TB
    subgraph "Patient Engagement Platform"
        LOGIN[Patient Login] --> DASH[Personalized Dashboard]

        subgraph "Health Goals"
            DASH --> GOALS[Health Goals]
            GOALS --> WEIGHT[Weight Management]
            GOALS --> BP[Blood Pressure]
            GOALS --> A1C[A1C Target]
            GOALS --> STEPS[Daily Steps]
            GOALS --> MED[Medication Adherence]
        end

        subgraph "Gamification Engine"
            WEIGHT --> TRACK[Track Progress]
            BP --> TRACK
            A1C --> TRACK
            STEPS --> TRACK
            MED --> TRACK

            TRACK --> POINTS[Earn Points]
            POINTS --> BADGES[Unlock Badges]
            BADGES --> LEVELS[Level Up]
            LEVELS --> REWARDS[Claim Rewards]
            REWARDS --> LEADER[Leaderboard]
        end

        subgraph "Engagement Tools"
            DASH --> CAMPAIGNS[Care Campaigns]
            CAMPAIGNS --> REMINDERS[Smart Reminders]
            CAMPAIGNS --> EDUCATION[Health Education]
            CAMPAIGNS --> SURVEYS[Health Surveys]
            CAMPAIGNS --> CHALLENGES[Health Challenges]
        end

        subgraph "Communication"
            DASH --> MSG[Secure Messaging]
            MSG --> PROVIDER[Provider Chat]
            MSG --> CARE[Care Team Chat]
            MSG --> AI[AI Health Assistant]
        end

        subgraph "Health Data"
            DASH --> RECORDS[Health Records]
            RECORDS --> LABS[Lab Results]
            RECORDS --> IMAGING[Imaging]
            RECORDS --> MEDS[Medications]
            RECORDS --> VISITS[Visit History]
            RECORDS --> SHARE[Share Records]
        end
    end
```

### Telehealth Visit Flow

```mermaid
sequenceDiagram
    participant P as Patient
    participant PP as Patient Portal
    participant TELE as Telehealth Service
    participant VIDEO as Video Platform
    participant PROV as Provider
    participant EHR as EHR System
    participant RX as e-Prescribe

    P->>PP: Join telehealth visit
    PP->>TELE: Initialize session
    TELE->>TELE: Check device compatibility
    TELE->>VIDEO: Create room
    VIDEO-->>TELE: Room URL
    TELE-->>PP: Join URL

    PP->>VIDEO: Connect to room
    VIDEO->>VIDEO: Camera/mic check
    VIDEO-->>PP: Ready

    PROV->>VIDEO: Join as host
    VIDEO->>VIDEO: Start recording

    rect rgb(200, 220, 255)
        Note over P,PROV: Virtual Visit Session
        P->>VIDEO: Share symptoms
        PROV->>EHR: View patient chart
        EHR-->>PROV: Clinical data
        PROV->>VIDEO: Conduct examination
        PROV->>VIDEO: Screen share (education)
    end

    PROV->>EHR: Document encounter
    PROV->>RX: Send prescription
    RX-->>P: Rx sent to pharmacy

    VIDEO->>VIDEO: Stop recording
    VIDEO->>TELE: Save recording

    PROV->>PP: End visit
    PP->>P: Visit summary
    PP->>P: Satisfaction survey
```

---

## Clinician Workflow Flows

### Clinical Documentation with AI Flow

```mermaid
sequenceDiagram
    participant DOC as Physician
    participant EHR as EHR Interface
    participant AI as GPT-4 Clinical AI
    participant NLP as NLP Engine
    participant CDS as CDS Engine
    participant SIGN as Signature Service
    participant AUDIT as Audit Trail

    DOC->>EHR: Open patient chart
    EHR->>EHR: Load patient context
    EHR-->>DOC: Display chart

    DOC->>EHR: Start voice dictation
    EHR->>AI: Stream audio
    AI->>NLP: Process speech
    NLP-->>AI: Transcription
    AI->>AI: Structure into note
    AI-->>EHR: Structured documentation
    EHR-->>DOC: Display draft note

    DOC->>EHR: Review AI suggestions

    AI->>CDS: Analyze documentation
    CDS->>CDS: Check clinical rules
    CDS-->>EHR: Alerts & suggestions
    EHR-->>DOC: Show CDS alerts

    alt Accept Suggestion
        DOC->>EHR: Accept AI suggestion
        EHR->>AI: Log acceptance
    else Modify
        DOC->>EHR: Edit documentation
        AI->>AI: Learn from edit
    else Reject
        DOC->>EHR: Reject suggestion
        AI->>AI: Log rejection reason
    end

    DOC->>EHR: Finalize note
    EHR->>CDS: Final validation
    CDS-->>EHR: Passed

    DOC->>EHR: Sign note
    EHR->>SIGN: Digital signature
    SIGN-->>EHR: Signed
    EHR->>AUDIT: Log completion
```

### Clinical Decision Support Flow

```mermaid
flowchart TB
    subgraph "CDS Engine v0.4"
        TRIGGER[Clinical Trigger] --> CONTEXT[Gather Context]

        subgraph "Context Assembly"
            CONTEXT --> PATIENT[Patient Data]
            CONTEXT --> MEDS[Medications]
            CONTEXT --> ALLERGIES[Allergies]
            CONTEXT --> LABS[Lab Results]
            CONTEXT --> VITALS[Vital Signs]
            CONTEXT --> DX[Diagnoses]
        end

        subgraph "Rule Evaluation"
            PATIENT --> RULES{Rule Engine}
            MEDS --> RULES
            ALLERGIES --> RULES
            LABS --> RULES
            VITALS --> RULES
            DX --> RULES

            RULES --> DDI[Drug-Drug Interaction]
            RULES --> DAI[Drug-Allergy Check]
            RULES --> DOSE[Dosing Check]
            RULES --> DUP[Duplicate Therapy]
            RULES --> CONTRA[Contraindications]
            RULES --> QUALITY[Quality Measures]
        end

        subgraph "AI Enhancement"
            DDI --> ML{ML Models}
            DAI --> ML
            DOSE --> ML
            DUP --> ML
            CONTRA --> ML
            QUALITY --> ML

            ML --> SEPSIS[Sepsis Prediction]
            ML --> READMIT[Readmission Risk]
            ML --> FALL[Fall Risk]
            ML --> AKI[AKI Prediction]
            ML --> MORTALITY[Mortality Risk]
        end

        subgraph "Alert Generation"
            SEPSIS --> PRIORITY{Prioritize Alerts}
            READMIT --> PRIORITY
            FALL --> PRIORITY
            AKI --> PRIORITY
            MORTALITY --> PRIORITY
            DDI --> PRIORITY
            DAI --> PRIORITY

            PRIORITY --> CRITICAL[Critical Alert]
            PRIORITY --> WARNING[Warning Alert]
            PRIORITY --> INFO[Info Alert]
            PRIORITY --> SUPPRESS[Alert Suppressed]
        end

        CRITICAL --> DISPLAY[Display to Clinician]
        WARNING --> DISPLAY
        INFO --> DISPLAY
    end
```

### Order Entry & CPOE Flow

```mermaid
sequenceDiagram
    participant CLIN as Clinician
    participant CPOE as CPOE System
    participant CDS as CDS Engine
    participant PHARM as Pharmacy
    participant LAB as Laboratory
    participant RAD as Radiology
    participant SIGN as E-Signature
    participant HL7 as HL7 Interface

    CLIN->>CPOE: Create order
    CPOE->>CPOE: Load order sets
    CPOE-->>CLIN: Suggest order set

    CLIN->>CPOE: Select medications
    CPOE->>CDS: Check interactions
    CDS-->>CPOE: DDI alerts
    CPOE-->>CLIN: Display warnings

    CLIN->>CPOE: Acknowledge/override
    CPOE->>CPOE: Add labs
    CPOE->>CDS: Validate lab orders
    CDS-->>CPOE: Duplicate check result

    CLIN->>CPOE: Add imaging
    CPOE->>CDS: Check appropriateness
    CDS-->>CPOE: AUC score

    CLIN->>CPOE: Review complete order
    CPOE->>SIGN: Request signature
    SIGN-->>CPOE: Order signed

    par Send to services
        CPOE->>HL7: Generate ORM
        HL7->>PHARM: Medication orders
        HL7->>LAB: Lab orders
        HL7->>RAD: Imaging orders
    end

    PHARM-->>CPOE: Order received
    LAB-->>CPOE: Order received
    RAD-->>CPOE: Order received
```

### Sepsis Early Warning Flow

```mermaid
flowchart TB
    subgraph "Sepsis Detection System"
        subgraph "Data Collection"
            VITALS[Vital Signs Monitor] --> STREAM[Data Stream]
            LABS[Lab Results] --> STREAM
            NOTES[Clinical Notes] --> STREAM
            MEDS[Medication Admin] --> STREAM
        end

        subgraph "SIRS Criteria Check"
            STREAM --> TEMP{Temp > 38°C or < 36°C}
            STREAM --> HR{HR > 90}
            STREAM --> RR{RR > 20 or PaCO2 < 32}
            STREAM --> WBC{WBC > 12K or < 4K}
        end

        subgraph "qSOFA Score"
            STREAM --> SBP{SBP ≤ 100}
            STREAM --> GCS{GCS < 15}
            STREAM --> RR2{RR ≥ 22}
        end

        subgraph "ML Prediction"
            TEMP --> ML_MODEL[Sepsis ML Model]
            HR --> ML_MODEL
            RR --> ML_MODEL
            WBC --> ML_MODEL
            SBP --> ML_MODEL
            GCS --> ML_MODEL
            RR2 --> ML_MODEL
            LABS --> ML_MODEL

            ML_MODEL --> PROB[Probability Score]
        end

        subgraph "Alert Escalation"
            PROB --> |>80%| CRITICAL_ALERT[🔴 CRITICAL ALERT]
            PROB --> |50-80%| HIGH_ALERT[🟠 HIGH ALERT]
            PROB --> |30-50%| MODERATE_ALERT[🟡 MODERATE ALERT]
            PROB --> |<30%| MONITOR[Continue Monitoring]

            CRITICAL_ALERT --> RAPID[Rapid Response Team]
            CRITICAL_ALERT --> PAGE[Page Physician]
            CRITICAL_ALERT --> PROTOCOL[Start Sepsis Protocol]

            HIGH_ALERT --> NOTIFY[Notify Care Team]
            HIGH_ALERT --> ORDER[Suggest Orders]

            MODERATE_ALERT --> WATCH[Enhanced Monitoring]
        end
    end
```

---

## Revenue Cycle Flows

### End-to-End Revenue Cycle Flow

```mermaid
flowchart LR
    subgraph "Front End"
        SCHED[Scheduling] --> ELIG[Eligibility Check]
        ELIG --> AUTH[Prior Auth]
        AUTH --> CHECKIN[Check-in]
    end

    subgraph "Middle Revenue Cycle"
        CHECKIN --> ENC[Encounter]
        ENC --> CHARGE[Charge Capture]
        CHARGE --> CODE[Coding]
        CODE --> CDI[CDI Review]
    end

    subgraph "Back End"
        CDI --> CLAIM[Claim Generation]
        CLAIM --> SCRUB[Claim Scrub]
        SCRUB --> SUBMIT[Claim Submission]
        SUBMIT --> STATUS[Status Check]
    end

    subgraph "Payment Processing"
        STATUS --> ERA[ERA/835 Receipt]
        ERA --> POST[Payment Posting]
        POST --> RECON[Reconciliation]
    end

    subgraph "Denial Management"
        ERA --> DENIAL{Denied?}
        DENIAL --> |Yes| ANALYSIS[Denial Analysis]
        ANALYSIS --> APPEAL[Appeal]
        APPEAL --> RESUBMIT[Resubmit]
        RESUBMIT --> STATUS
    end

    subgraph "Patient Balance"
        RECON --> STMT[Statement]
        STMT --> PAY[Patient Payment]
        PAY --> |Unpaid| COLLECT[Collections]
    end
```

### AI-Powered Coding Flow

```mermaid
sequenceDiagram
    participant DOC as Documentation
    participant NLP as NLP Engine
    participant AI as AI Coder
    participant ENCODER as Encoder
    participant CDI as CDI Specialist
    participant FINAL as Final Coder
    participant CLAIM as Claim System

    DOC->>NLP: Submit documentation
    NLP->>NLP: Extract clinical entities
    NLP->>AI: Send structured data

    AI->>AI: Analyze clinical content
    AI->>AI: Identify diagnoses
    AI->>AI: Identify procedures
    AI->>AI: Query specificity
    AI-->>ENCODER: Suggested codes

    ENCODER->>ENCODER: Apply ICD-10-CM
    ENCODER->>ENCODER: Apply CPT/HCPCS
    ENCODER->>ENCODER: Apply modifiers
    ENCODER-->>CDI: Initial code set

    CDI->>CDI: Review for CDI opportunities

    alt Query Needed
        CDI->>DOC: CDI Query
        DOC-->>CDI: Additional documentation
        CDI->>AI: Re-analyze
        AI-->>CDI: Updated codes
    end

    CDI-->>FINAL: CDI reviewed codes
    FINAL->>FINAL: Final review
    FINAL->>FINAL: Apply edits
    FINAL-->>CLAIM: Final code set

    CLAIM->>CLAIM: Generate claim
```

### Value-Based Care Payment Flow

```mermaid
flowchart TB
    subgraph "Value-Based Care Engine"
        subgraph "Quality Measurement"
            EHR[EHR Data] --> EXTRACT[Data Extraction]
            CLAIMS[Claims Data] --> EXTRACT
            EXTRACT --> CALC[Measure Calculator]

            CALC --> HEDIS[HEDIS Measures]
            CALC --> MIPS[MIPS Measures]
            CALC --> ACO[ACO Metrics]
            CALC --> CUSTOM[Custom Measures]
        end

        subgraph "Performance Tracking"
            HEDIS --> BENCH[Benchmarking]
            MIPS --> BENCH
            ACO --> BENCH
            CUSTOM --> BENCH

            BENCH --> COMPARE[Peer Comparison]
            BENCH --> TREND[Trend Analysis]
            BENCH --> GAP[Gap Analysis]
        end

        subgraph "Payment Calculation"
            COMPARE --> SCORE[Quality Score]
            SCORE --> CONTRACT[Contract Terms]
            CONTRACT --> CALC_PAY[Calculate Payment]

            CALC_PAY --> SHARED[Shared Savings]
            CALC_PAY --> BONUS[Quality Bonus]
            CALC_PAY --> PENALTY[Penalty Assessment]
            CALC_PAY --> BUNDLE[Bundle Payment]
        end

        subgraph "Attribution & Reporting"
            GAP --> ATTR[Patient Attribution]
            ATTR --> PANEL[Provider Panel]
            PANEL --> REPORT[Performance Report]
            REPORT --> DASH[Executive Dashboard]
        end
    end
```

---

## Administrative Flows

### Multi-Tenant Organization Management

```mermaid
flowchart TB
    subgraph "Multi-Tenant Architecture"
        subgraph "Organization Hierarchy"
            ENT[Enterprise/Health System]
            ENT --> HOSP1[Hospital A]
            ENT --> HOSP2[Hospital B]
            ENT --> CLINIC[Clinic Network]

            HOSP1 --> DEPT1[Cardiology]
            HOSP1 --> DEPT2[Oncology]
            HOSP1 --> DEPT3[Surgery]

            HOSP2 --> DEPT4[Emergency]
            HOSP2 --> DEPT5[ICU]

            CLINIC --> LOC1[Location 1]
            CLINIC --> LOC2[Location 2]
        end

        subgraph "Tenant Isolation"
            DEPT1 --> ISO{Data Isolation}
            DEPT2 --> ISO
            DEPT3 --> ISO

            ISO --> DB[(Shared DB)]
            ISO --> SCHEMA[Schema Isolation]
            ISO --> ROW[Row-Level Security]
        end

        subgraph "Cross-Tenant Features"
            ENT --> SHARED[Shared Services]
            SHARED --> FORMULARY[Enterprise Formulary]
            SHARED --> CDM[Charge Description Master]
            SHARED --> USERS[User Directory]
            SHARED --> SSO[SSO Configuration]
        end

        subgraph "Tenant Administration"
            ADMIN[Org Admin] --> CONFIG[Configuration]
            CONFIG --> BRAND[Branding]
            CONFIG --> WORKFLOW[Workflows]
            CONFIG --> FORMS[Custom Forms]
            CONFIG --> REPORTS[Reports]
        end
    end
```

### Audit Trail & Compliance Flow

```mermaid
sequenceDiagram
    participant USER as User
    participant APP as Application
    participant AUDIT as Audit Service
    participant ENCRYPT as Encryption
    participant STORE as Immutable Store
    participant SIEM as SIEM System
    participant ALERT as Alert System

    USER->>APP: Perform action
    APP->>APP: Execute action

    APP->>AUDIT: Log event
    Note over AUDIT: Capture: Who, What, When, Where, Why

    AUDIT->>AUDIT: Enrich context
    AUDIT->>AUDIT: Add metadata
    AUDIT->>ENCRYPT: Sign & encrypt
    ENCRYPT-->>AUDIT: Signed log

    AUDIT->>STORE: Write to immutable store
    STORE-->>AUDIT: Hash receipt

    AUDIT->>SIEM: Forward to SIEM
    SIEM->>SIEM: Analyze patterns

    alt Anomaly Detected
        SIEM->>ALERT: Trigger alert
        ALERT->>ALERT: Evaluate severity
        ALERT-->>USER: Security notification
    end

    Note over STORE: Tamper-proof retention for 7+ years
```

### Enterprise Workflow Designer Flow

```mermaid
flowchart TB
    subgraph "Workflow Designer v0.4"
        subgraph "Design Canvas"
            START[Start Node] --> COND1{Condition}
            COND1 --> |Yes| TASK1[Task: Review]
            COND1 --> |No| TASK2[Task: Auto-approve]

            TASK1 --> APPROVE{Approved?}
            APPROVE --> |Yes| TASK3[Task: Process]
            APPROVE --> |No| ESCALATE[Escalation]

            TASK2 --> TASK3
            ESCALATE --> TASK1

            TASK3 --> PARALLEL[Parallel Gateway]
            PARALLEL --> NOTIFY[Notify User]
            PARALLEL --> UPDATE[Update System]
            PARALLEL --> LOG[Audit Log]

            NOTIFY --> JOIN[Join Gateway]
            UPDATE --> JOIN
            LOG --> JOIN

            JOIN --> END[End Node]
        end

        subgraph "Node Types"
            NT_START[▶ Start]
            NT_END[⏹ End]
            NT_TASK[📋 Task]
            NT_COND[◇ Condition]
            NT_PARALLEL[⋈ Parallel]
            NT_TIMER[⏱ Timer]
            NT_EMAIL[✉ Email]
            NT_API[🔗 API Call]
            NT_HUMAN[👤 Human Task]
        end

        subgraph "Properties Panel"
            PROPS[Selected Node]
            PROPS --> NAME[Name]
            PROPS --> DESC[Description]
            PROPS --> ASSIGN[Assignment]
            PROPS --> SLA[SLA Settings]
            PROPS --> ACTIONS[Actions]
        end
    end
```

---

## AI/ML Integration Flows

### GPT-4 Clinical Assistant Flow

```mermaid
sequenceDiagram
    participant USER as Clinician
    participant UI as Clinical UI
    participant ASSIST as AI Assistant
    participant GPT as GPT-4 API
    participant CONTEXT as Context Engine
    participant SAFETY as Safety Layer
    participant EHR as EHR Data

    USER->>UI: Ask clinical question
    UI->>ASSIST: Process query

    ASSIST->>CONTEXT: Gather context
    CONTEXT->>EHR: Fetch patient data
    EHR-->>CONTEXT: Clinical data
    CONTEXT-->>ASSIST: Enriched context

    ASSIST->>SAFETY: Pre-check query
    SAFETY->>SAFETY: PHI detection
    SAFETY->>SAFETY: Scope validation
    SAFETY-->>ASSIST: Approved

    ASSIST->>GPT: Send prompt + context
    Note over GPT: System prompt includes:<br/>- Clinical guidelines<br/>- Safety constraints<br/>- Output format

    GPT-->>ASSIST: Response

    ASSIST->>SAFETY: Post-check response
    SAFETY->>SAFETY: Validate accuracy
    SAFETY->>SAFETY: Check recommendations
    SAFETY-->>ASSIST: Validated

    ASSIST-->>UI: Formatted response
    UI-->>USER: Display with citations

    Note over USER,UI: User can:<br/>- Accept suggestion<br/>- Request clarification<br/>- Report issue
```

### Predictive Analytics Pipeline

```mermaid
flowchart TB
    subgraph "ML Pipeline v0.4"
        subgraph "Data Ingestion"
            EHR[EHR Data] --> ETL[ETL Pipeline]
            CLAIMS[Claims] --> ETL
            LABS[Lab Systems] --> ETL
            DEVICES[IoT Devices] --> ETL

            ETL --> LAKE[Data Lake]
        end

        subgraph "Feature Engineering"
            LAKE --> CLEAN[Data Cleaning]
            CLEAN --> NORM[Normalization]
            NORM --> FEATURE[Feature Extraction]

            FEATURE --> DEMO[Demographics]
            FEATURE --> CLINICAL[Clinical Features]
            FEATURE --> TEMPORAL[Temporal Features]
            FEATURE --> SOCIAL[SDOH Features]
        end

        subgraph "Model Training"
            DEMO --> TRAIN[Model Training]
            CLINICAL --> TRAIN
            TEMPORAL --> TRAIN
            SOCIAL --> TRAIN

            TRAIN --> VALIDATE[Validation]
            VALIDATE --> TUNE[Hyperparameter Tuning]
            TUNE --> DEPLOY[Model Deployment]
        end

        subgraph "Inference"
            DEPLOY --> API[Prediction API]
            API --> READMIT[Readmission Risk]
            API --> SEPSIS[Sepsis Risk]
            API --> NOSHOW[No-Show Risk]
            API --> LOS[Length of Stay]
            API --> COST[Cost Prediction]
        end

        subgraph "Model Governance"
            DEPLOY --> MONITOR[Performance Monitoring]
            MONITOR --> DRIFT[Drift Detection]
            DRIFT --> RETRAIN{Retrain?}
            RETRAIN --> |Yes| TRAIN
            RETRAIN --> |No| MONITOR
        end
    end
```

---

## Genomics Platform Flows

### Genomic Data Processing Flow

```mermaid
flowchart TB
    subgraph "Genomics Platform v0.4"
        subgraph "Data Input"
            VCF[VCF Files] --> PARSE[VCF Parser]
            FASTQ[FASTQ Files] --> ALIGN[Alignment Pipeline]
            HL7G[HL7 Genomics] --> TRANSFORM[Data Transform]
        end

        subgraph "Variant Processing"
            PARSE --> ANNOTATE[Variant Annotation]
            ALIGN --> CALL[Variant Calling]
            CALL --> ANNOTATE
            TRANSFORM --> ANNOTATE

            ANNOTATE --> CLINVAR[ClinVar Lookup]
            ANNOTATE --> GNOMAD[gnomAD Frequency]
            ANNOTATE --> COSMIC[COSMIC Cancer DB]
        end

        subgraph "Clinical Interpretation"
            CLINVAR --> CLASSIFY[Variant Classification]
            GNOMAD --> CLASSIFY
            COSMIC --> CLASSIFY

            CLASSIFY --> PATHOGENIC[Pathogenic]
            CLASSIFY --> LIKELY_PATH[Likely Pathogenic]
            CLASSIFY --> VUS[VUS]
            CLASSIFY --> LIKELY_BEN[Likely Benign]
            CLASSIFY --> BENIGN[Benign]
        end

        subgraph "Pharmacogenomics"
            PATHOGENIC --> PGX[PGx Analysis]
            PGX --> CPIC[CPIC Guidelines]
            CPIC --> DRUG_REC[Drug Recommendations]
            DRUG_REC --> CDS[CDS Integration]
        end

        subgraph "Risk Assessment"
            PATHOGENIC --> RISK[Risk Calculator]
            RISK --> CANCER[Cancer Risk]
            RISK --> CARDIAC[Cardiac Risk]
            RISK --> HEREDITARY[Hereditary Conditions]
        end

        subgraph "Reporting"
            DRUG_REC --> REPORT[Clinical Report]
            CANCER --> REPORT
            CARDIAC --> REPORT
            HEREDITARY --> REPORT

            REPORT --> PDF[PDF Generation]
            REPORT --> EHR_INT[EHR Integration]
            REPORT --> COUNSEL[Genetic Counseling]
        end
    end
```

### Pharmacogenomics CDS Flow

```mermaid
sequenceDiagram
    participant DOC as Physician
    participant CPOE as Order Entry
    participant CDS as CDS Engine
    participant PGX as PGx Service
    participant GENOMICS as Genomics DB
    participant CPIC as CPIC Guidelines
    participant ALERT as Alert System

    DOC->>CPOE: Order medication
    CPOE->>CDS: Check for PGx
    CDS->>PGX: Query patient genetics

    PGX->>GENOMICS: Get patient variants
    GENOMICS-->>PGX: Relevant variants

    PGX->>CPIC: Get drug-gene interactions
    CPIC-->>PGX: CPIC recommendations

    PGX->>PGX: Calculate metabolizer status

    alt Poor Metabolizer
        PGX-->>CDS: High risk - dose adjustment needed
        CDS->>ALERT: Generate critical alert
        ALERT-->>DOC: ⚠️ PGx Alert: Poor metabolizer
        Note over DOC: Suggest dose reduction or alternative
    else Ultrarapid Metabolizer
        PGX-->>CDS: Increased metabolism
        CDS->>ALERT: Generate warning
        ALERT-->>DOC: ⚠️ PGx Alert: Ultrarapid metabolizer
        Note over DOC: Suggest dose increase or alternative
    else Normal Metabolizer
        PGX-->>CDS: No PGx concern
        CDS-->>CPOE: Proceed with order
    end

    DOC->>CPOE: Acknowledge & proceed
    CPOE->>CPOE: Complete order
```

---

## SDOH Module Flows

### Social Needs Screening Flow

```mermaid
flowchart TB
    subgraph "SDOH Screening & Intervention"
        subgraph "Screening Triggers"
            VISIT[Patient Visit] --> TRIGGER{Screening Due?}
            ADMIT[Admission] --> TRIGGER
            ANNUAL[Annual Wellness] --> TRIGGER
            RISK[High Risk Flag] --> TRIGGER
        end

        subgraph "Screening Tools"
            TRIGGER --> |Yes| SELECT[Select Tool]
            SELECT --> PRAPARE[PRAPARE]
            SELECT --> AHC[AHC HRSN]
            SELECT --> CUSTOM[Custom Screen]
        end

        subgraph "Data Collection"
            PRAPARE --> COLLECT[Collect Responses]
            AHC --> COLLECT
            CUSTOM --> COLLECT

            COLLECT --> FOOD[Food Insecurity]
            COLLECT --> HOUSING[Housing Instability]
            COLLECT --> TRANSPORT[Transportation]
            COLLECT --> UTILITY[Utility Needs]
            COLLECT --> SAFETY[Personal Safety]
            COLLECT --> EMPLOY[Employment]
        end

        subgraph "Need Identification"
            FOOD --> ANALYZE{Analyze Needs}
            HOUSING --> ANALYZE
            TRANSPORT --> ANALYZE
            UTILITY --> ANALYZE
            SAFETY --> ANALYZE
            EMPLOY --> ANALYZE

            ANALYZE --> URGENT[Urgent Needs]
            ANALYZE --> MODERATE[Moderate Needs]
            ANALYZE --> LOW[Low Priority]
        end

        subgraph "Resource Matching"
            URGENT --> MATCH[Resource Matcher]
            MODERATE --> MATCH

            MATCH --> COMMUNITY[Community Resources]
            MATCH --> GOVT[Government Programs]
            MATCH --> NONPROFIT[Nonprofit Services]

            COMMUNITY --> REFER[Generate Referral]
            GOVT --> REFER
            NONPROFIT --> REFER
        end

        subgraph "Care Coordination"
            REFER --> COORD[Care Coordinator]
            COORD --> FOLLOWUP[Follow-up Tasks]
            FOLLOWUP --> OUTCOME[Track Outcomes]
            OUTCOME --> REPORT[Outcomes Report]
        end
    end
```

### Community Resource Integration Flow

```mermaid
sequenceDiagram
    participant SW as Social Worker
    participant SDOH as SDOH Module
    participant FIND as Resource Finder
    participant API as Community APIs
    participant COORD as Care Coordination
    participant PATIENT as Patient Portal
    participant TRACK as Outcome Tracker

    SW->>SDOH: Identify patient need
    SDOH->>FIND: Search resources

    FIND->>API: Query 211 database
    API-->>FIND: Local resources

    FIND->>API: Query food banks
    API-->>FIND: Food resources

    FIND->>API: Query housing
    API-->>FIND: Housing resources

    FIND-->>SDOH: Matched resources
    SDOH-->>SW: Display options

    SW->>SDOH: Select resources
    SDOH->>COORD: Create referrals

    par Notify parties
        COORD->>PATIENT: Send resource list
        COORD->>API: Send referral to CBO
    end

    PATIENT-->>TRACK: Patient accessed resource
    API-->>TRACK: CBO confirms service

    TRACK->>TRACK: Update care plan
    TRACK-->>SDOH: Outcome recorded
```

---

## Value-Based Care Flows

### ACO Performance Management Flow

```mermaid
flowchart TB
    subgraph "ACO Management Suite"
        subgraph "Patient Attribution"
            CLAIMS[Claims Data] --> ATTR[Attribution Engine]
            ATTR --> ASSIGNED[Assigned Patients]
            ATTR --> PROSPECTIVE[Prospective Attribution]
        end

        subgraph "Quality Measures"
            ASSIGNED --> QUALITY[Quality Engine]
            QUALITY --> PREV[Preventive Care]
            QUALITY --> CHRONIC[Chronic Care]
            QUALITY --> OUTCOME[Outcomes]
            QUALITY --> SAFETY[Patient Safety]
            QUALITY --> EXPER[Patient Experience]
        end

        subgraph "Cost Tracking"
            ASSIGNED --> COST[Cost Analyzer]
            COST --> TOTAL[Total Cost of Care]
            COST --> UTIL[Utilization]
            COST --> LEAKAGE[Network Leakage]
        end

        subgraph "Risk Adjustment"
            ASSIGNED --> RISK[Risk Adjuster]
            RISK --> HCC[HCC Coding]
            RISK --> RAF[RAF Score]
            RAF --> BENCHMARK[Adjusted Benchmark]
        end

        subgraph "Performance Dashboard"
            PREV --> DASH[ACO Dashboard]
            CHRONIC --> DASH
            OUTCOME --> DASH
            TOTAL --> DASH
            BENCHMARK --> DASH

            DASH --> SHARED[Shared Savings Calc]
            SHARED --> DISTRIBUTE[Distribution Model]
        end

        subgraph "Care Gap Management"
            QUALITY --> GAPS[Care Gaps]
            GAPS --> OUTREACH[Patient Outreach]
            OUTREACH --> CLOSE[Gap Closure]
            CLOSE --> QUALITY
        end
    end
```

### MIPS Reporting Dashboard Flow

```mermaid
flowchart TB
    subgraph "MIPS Dashboard v0.4"
        subgraph "Data Sources"
            EHR[EHR Data] --> COLLECT[Data Collector]
            CLAIMS[Claims] --> COLLECT
            REGISTRY[Registry] --> COLLECT
            SURVEY[CAHPS Survey] --> COLLECT
        end

        subgraph "Category Scoring"
            COLLECT --> QUALITY_CAT[Quality - 30%]
            COLLECT --> PI_CAT[Promoting Interoperability - 25%]
            COLLECT --> IA_CAT[Improvement Activities - 15%]
            COLLECT --> COST_CAT[Cost - 30%]
        end

        subgraph "Quality Measures"
            QUALITY_CAT --> Q1[Measure 1: Diabetes]
            QUALITY_CAT --> Q2[Measure 2: Preventive]
            QUALITY_CAT --> Q3[Measure 3: Hypertension]
            QUALITY_CAT --> Q4[Measure 4: Immunization]
            QUALITY_CAT --> Q5[Measure 5: Screening]
            QUALITY_CAT --> Q6[Measure 6: Outcomes]
        end

        subgraph "PI Measures"
            PI_CAT --> E_RX[e-Prescribing]
            PI_CAT --> HIE_M[Health Information Exchange]
            PI_CAT --> PATIENT_ACCESS[Patient Access]
            PI_CAT --> SECURITY[Security Risk Analysis]
        end

        subgraph "Final Score"
            Q1 --> FINAL[Final Score Calculator]
            Q2 --> FINAL
            Q3 --> FINAL
            Q4 --> FINAL
            Q5 --> FINAL
            Q6 --> FINAL
            E_RX --> FINAL
            HIE_M --> FINAL
            PATIENT_ACCESS --> FINAL
            COST_CAT --> FINAL
            IA_CAT --> FINAL

            FINAL --> PAYMENT[Payment Adjustment]
            PAYMENT --> |≥75| BONUS[Positive Adjustment]
            PAYMENT --> |<75| NEUTRAL[Neutral]
            PAYMENT --> |<45| PENALTY[Negative Adjustment]
        end
    end
```

---

## Real-time Collaboration Flows

### Video Consultation Flow

```mermaid
sequenceDiagram
    participant PROV as Provider
    participant COLLAB as Collaboration Hub
    participant VIDEO as Video Service
    participant RECORD as Recording Service
    participant SPEC as Specialist
    participant EHR as EHR System
    participant PATIENT as Patient (optional)

    PROV->>COLLAB: Request consultation
    COLLAB->>VIDEO: Create room
    VIDEO-->>COLLAB: Room URL

    COLLAB->>SPEC: Send invitation
    SPEC->>VIDEO: Join room

    opt Patient Included
        COLLAB->>PATIENT: Send patient link
        PATIENT->>VIDEO: Join room
    end

    PROV->>VIDEO: Join room
    VIDEO->>VIDEO: Start session

    opt Recording Consent
        VIDEO->>RECORD: Start recording
    end

    rect rgb(200, 220, 255)
        Note over PROV,SPEC: Consultation Session
        PROV->>VIDEO: Share screen (images)
        PROV->>EHR: Pull up patient chart
        EHR-->>PROV: Clinical data
        SPEC->>VIDEO: Provide recommendations
        SPEC->>COLLAB: Add notes
    end

    SPEC->>COLLAB: End session
    COLLAB->>VIDEO: Close room

    opt Recording
        RECORD->>RECORD: Process recording
        RECORD->>EHR: Attach to encounter
    end

    COLLAB->>EHR: Document consultation
    COLLAB->>PROV: Summary notification
```

### Clinical Whiteboard Collaboration

```mermaid
flowchart TB
    subgraph "Clinical Whiteboard v0.4"
        subgraph "Participants"
            LEAD[Lead Physician]
            NURSE[Nurse]
            SPEC[Specialist]
            CARE[Care Coordinator]
        end

        subgraph "Whiteboard Canvas"
            LEAD --> CANVAS[Shared Canvas]
            NURSE --> CANVAS
            SPEC --> CANVAS
            CARE --> CANVAS

            CANVAS --> DRAW[Drawing Tools]
            CANVAS --> TEXT[Text Annotations]
            CANVAS --> IMAGES[Image Upload]
            CANVAS --> STICKY[Sticky Notes]
            CANVAS --> ARROWS[Connectors]
        end

        subgraph "Clinical Templates"
            CANVAS --> TEMP[Template Library]
            TEMP --> BODY[Body Diagram]
            TEMP --> TIMELINE[Patient Timeline]
            TEMP --> FLOWCHART[Care Flowchart]
            TEMP --> MEDS[Medication List]
            TEMP --> CHECKLIST[Checklist]
        end

        subgraph "Real-time Features"
            CANVAS --> SYNC[Real-time Sync]
            SYNC --> CURSORS[Multiple Cursors]
            SYNC --> PRESENCE[User Presence]
            SYNC --> VOICE[Voice Chat]
            SYNC --> HISTORY[Version History]
        end

        subgraph "Integration"
            CANVAS --> SAVE[Save to EHR]
            SAVE --> ATTACH[Attach to Encounter]
            SAVE --> EXPORT[Export as PDF]
            SAVE --> SHARE[Share Link]
        end
    end
```

---

## Mobile & PWA Flows

### Progressive Web App Architecture

```mermaid
flowchart TB
    subgraph "PWA Architecture v0.4"
        subgraph "App Shell"
            BROWSER[Browser] --> SW[Service Worker]
            SW --> CACHE[Cache Storage]
            SW --> IDB[IndexedDB]
        end

        subgraph "Offline Support"
            CACHE --> STATIC[Static Assets]
            CACHE --> API_CACHE[API Responses]
            IDB --> PATIENT_DATA[Patient Data]
            IDB --> QUEUE[Offline Queue]
        end

        subgraph "Background Sync"
            QUEUE --> SYNC[Background Sync]
            SYNC --> |Online| API[API Server]
            API --> |Conflict| RESOLVE[Conflict Resolution]
            RESOLVE --> IDB
        end

        subgraph "Push Notifications"
            PUSH_SRV[Push Server] --> SW
            SW --> NOTIFY[Show Notification]
            NOTIFY --> BADGE[Update Badge]
            NOTIFY --> CLICK[Handle Click]
            CLICK --> NAVIGATE[Navigate to Content]
        end

        subgraph "Device Features"
            SW --> CAMERA[Camera Access]
            SW --> GEO[Geolocation]
            SW --> BIOMETRIC[Biometric Auth]
            SW --> SHARE[Web Share API]
        end

        subgraph "Install Experience"
            BROWSER --> MANIFEST[Web Manifest]
            MANIFEST --> INSTALL[Install Prompt]
            INSTALL --> HOME[Add to Home Screen]
            HOME --> STANDALONE[Standalone App]
        end
    end
```

### Offline-First Data Sync Flow

```mermaid
sequenceDiagram
    participant USER as User
    participant APP as PWA
    participant SW as Service Worker
    participant IDB as IndexedDB
    participant QUEUE as Sync Queue
    participant API as Backend API
    participant CONFLICT as Conflict Resolver

    USER->>APP: Perform action (offline)
    APP->>IDB: Save locally
    APP->>QUEUE: Add to sync queue
    APP-->>USER: Optimistic UI update

    Note over SW: Device goes online

    SW->>QUEUE: Process queue

    loop Each queued item
        QUEUE->>API: Sync request

        alt Success
            API-->>QUEUE: Synced
            QUEUE->>IDB: Mark synced
        else Conflict
            API-->>CONFLICT: Version conflict
            CONFLICT->>CONFLICT: Compare versions

            alt Server wins
                CONFLICT->>IDB: Update local
                CONFLICT->>APP: Notify user
            else Client wins
                CONFLICT->>API: Force update
            else Manual merge
                CONFLICT->>APP: Show merge UI
                USER->>APP: Resolve conflict
                APP->>API: Submit resolution
            end
        else Error
            QUEUE->>QUEUE: Retry with backoff
        end
    end

    QUEUE-->>APP: Sync complete
    APP-->>USER: Update UI
```

---

## System Integration Overview

```mermaid
graph TB
    subgraph "Lithic Platform v0.4"
        subgraph "Core EHR"
            PATIENT[Patient Management]
            CLINICAL[Clinical Workflows]
            ORDERS[Order Management]
            DOCS[Documentation]
        end

        subgraph "Revenue Cycle"
            BILLING[Billing Engine]
            CLAIMS[Claims Management]
            VBC[Value-Based Care]
            CODING[AI Coding]
        end

        subgraph "Analytics"
            BI[Business Intelligence]
            POP[Population Health]
            PREDICT[Predictive Models]
            QUALITY[Quality Measures]
        end

        subgraph "Advanced Modules"
            GENOMICS[Genomics]
            SDOH[SDOH]
            AI[AI/ML Platform]
            COLLAB[Collaboration]
        end
    end

    subgraph "External Systems"
        HIE[Health Information Exchange]
        PAYER[Payer Systems]
        LAB[Reference Labs]
        PHARMACY[Pharmacy Networks]
        REGISTRY[Clinical Registries]
        CBO[Community Organizations]
        DEVICE[Medical Devices]
    end

    CLINICAL <--> HIE
    BILLING <--> PAYER
    ORDERS <--> LAB
    ORDERS <--> PHARMACY
    QUALITY <--> REGISTRY
    SDOH <--> CBO
    CLINICAL <--> DEVICE
```

---

## Summary

This document contains comprehensive Mermaid diagrams covering all major user flows in the Lithic Enterprise Healthcare Platform v0.4:

1. **Architecture**: System overview and component relationships
2. **Authentication**: MFA, SSO, and RBAC flows
3. **Patient Experience**: Portal, scheduling, engagement, telehealth
4. **Clinical Workflows**: Documentation, CDS, CPOE, sepsis detection
5. **Revenue Cycle**: End-to-end billing, AI coding, value-based care
6. **Administration**: Multi-tenant, audit, workflow designer
7. **AI/ML**: GPT-4 assistant, predictive analytics pipeline
8. **Genomics**: VCF processing, pharmacogenomics, risk assessment
9. **SDOH**: Screening, resource matching, care coordination
10. **Value-Based Care**: ACO management, MIPS reporting
11. **Collaboration**: Video consultation, clinical whiteboard
12. **Mobile/PWA**: Offline-first architecture, background sync

Each flow is designed to demonstrate enterprise-grade capabilities that compete with Epic Systems while leveraging modern technologies like AI/ML, genomics, and advanced analytics.

---

*Generated for Lithic Enterprise Healthcare Platform v0.4*
*Copyright (c) 2026 Lithic Healthcare Systems*
