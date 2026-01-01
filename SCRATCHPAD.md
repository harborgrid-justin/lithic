# LITHIC - Enterprise Healthcare SaaS Platform
## Coordination Scratchpad for Multi-Agent Development

**Last Updated:** 2026-01-01
**Status:** Initial Foundation Setup Complete
**Target:** Enterprise EHR/EMR Platform (Epic Competitor)

---

## PROJECT OVERVIEW

Lithic is an enterprise-grade healthcare SaaS platform built to compete with Epic Systems. The platform provides comprehensive hospital and clinic management including EHR, patient management, clinical workflows, billing, laboratory, pharmacy, imaging, and analytics.

### Technology Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript 5.3+
- **Styling:** Tailwind CSS 3.4+, shadcn/ui components
- **Backend:** Next.js API Routes, tRPC
- **Database:** PostgreSQL 15+ with Prisma ORM
- **Authentication:** NextAuth.js v5 with RBAC
- **Real-time:** Pusher/Socket.io for live updates
- **Storage:** AWS S3 for medical imaging/documents
- **Compliance:** HIPAA-compliant architecture, audit logging, encryption at rest/in transit

### Architecture Principles
1. **Multi-tenancy:** Organization-based data isolation
2. **HIPAA Compliance:** Full audit trails, encryption, access controls
3. **HL7 FHIR Compatible:** Standardized healthcare data formats
4. **Role-Based Access Control (RBAC):** Granular permissions
5. **Microservices-Ready:** Modular design for future scaling
6. **Zero-Trust Security:** All operations authenticated and authorized

---

## MODULE ASSIGNMENTS

### Agent 1: Core Infrastructure
**Responsibility:** Foundation, shared utilities, database setup, build configuration

**Deliverables:**
- Project configuration (Next.js, TypeScript, Tailwind)
- Database migrations and seed data
- Shared UI components library (shadcn/ui setup)
- Authentication middleware
- API middleware (rate limiting, validation)
- Error handling utilities
- Logging and monitoring setup
- Development tooling (ESLint, Prettier, Husky)

**Key Files:**
- `/src/app/layout.tsx` - Root layout with providers
- `/src/app/page.tsx` - Landing/dashboard router
- `/src/components/ui/*` - shadcn/ui components
- `/src/middleware.ts` - Next.js middleware for auth/routing
- `/src/lib/auth.ts` - NextAuth configuration
- `/src/lib/api.ts` - API utilities
- `/prisma/migrations/*` - Database migrations

---

### Agent 2: Patient Management Module
**Responsibility:** Patient demographics, registration, medical records management

**Deliverables:**
- Patient registration and onboarding flows
- Patient search and demographics management
- Medical history and allergies tracking
- Emergency contacts and insurance information
- Patient portal access management
- Document upload and management
- Family/dependent relationships

**Key Files:**
- `/src/app/(dashboard)/patients/*` - Patient management UI
- `/src/app/api/patients/*` - Patient API routes
- `/src/components/patients/*` - Patient-specific components
- `/src/lib/services/patient-service.ts` - Business logic
- `/prisma/schema.prisma` - Patient, Insurance, Contact models

**API Endpoints:**
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `GET /api/patients/search` - Search patients
- `GET /api/patients/:id/history` - Medical history

**Database Tables:**
- `Patient`, `PatientInsurance`, `EmergencyContact`, `PatientDocument`, `Allergy`, `Immunization`

---

### Agent 3: Clinical Documentation/EHR Module
**Responsibility:** Electronic health records, clinical notes, SOAP notes, care plans

**Deliverables:**
- Clinical note templates (SOAP, H&P, Progress Notes)
- ICD-10 and CPT code integration
- Problem list management
- Care plan creation and tracking
- Clinical decision support system (CDSS) hooks
- Medical history documentation
- Vital signs tracking and trending

**Key Files:**
- `/src/app/(dashboard)/clinical/*` - Clinical UI
- `/src/app/api/clinical/*` - Clinical API routes
- `/src/components/clinical/*` - Clinical components (note editor, templates)
- `/src/lib/services/clinical-service.ts` - Clinical business logic
- `/src/lib/fhir/*` - FHIR resource mappers

**API Endpoints:**
- `POST /api/clinical/notes` - Create clinical note
- `GET /api/clinical/notes/:id` - Get note
- `PUT /api/clinical/notes/:id` - Update note
- `POST /api/clinical/problems` - Add to problem list
- `GET /api/clinical/vitals/:patientId` - Get vital signs

**Database Tables:**
- `ClinicalNote`, `VitalSigns`, `ProblemList`, `CarePlan`, `Diagnosis`, `Procedure`

---

### Agent 4: Scheduling & Appointments Module
**Responsibility:** Appointment scheduling, calendar management, waitlists, reminders

**Deliverables:**
- Multi-provider calendar views
- Appointment booking and rescheduling
- Waitlist management
- Automated appointment reminders (SMS/Email)
- Resource scheduling (rooms, equipment)
- Recurring appointment support
- No-show tracking and management
- Check-in/check-out workflows

**Key Files:**
- `/src/app/(dashboard)/scheduling/*` - Scheduling UI
- `/src/app/api/scheduling/*` - Scheduling API
- `/src/components/scheduling/*` - Calendar components
- `/src/lib/services/scheduling-service.ts` - Scheduling logic
- `/src/lib/notifications/appointment-reminders.ts` - Reminder system

**API Endpoints:**
- `POST /api/scheduling/appointments` - Book appointment
- `GET /api/scheduling/appointments` - List appointments
- `PUT /api/scheduling/appointments/:id` - Update appointment
- `GET /api/scheduling/availability` - Check provider availability
- `POST /api/scheduling/check-in/:id` - Patient check-in

**Database Tables:**
- `Appointment`, `Schedule`, `TimeSlot`, `Waitlist`, `Room`, `AppointmentReminder`

---

### Agent 5: Billing & Revenue Cycle Module
**Responsibility:** Claims, billing, payments, insurance verification, revenue cycle management

**Deliverables:**
- Charge capture and coding
- Insurance eligibility verification
- Claims generation (CMS-1500, UB-04)
- Claims submission and tracking
- Payment processing and posting
- Denial management and appeals
- Patient statements and invoicing
- Revenue cycle analytics

**Key Files:**
- `/src/app/(dashboard)/billing/*` - Billing UI
- `/src/app/api/billing/*` - Billing API
- `/src/components/billing/*` - Billing components
- `/src/lib/services/billing-service.ts` - Billing logic
- `/src/lib/integrations/clearinghouse.ts` - Claims clearinghouse integration
- `/src/lib/payments/*` - Payment processing (Stripe integration)

**API Endpoints:**
- `POST /api/billing/charges` - Create charge
- `POST /api/billing/claims` - Submit claim
- `GET /api/billing/claims/:id/status` - Check claim status
- `POST /api/billing/payments` - Process payment
- `GET /api/billing/statements/:patientId` - Patient statement

**Database Tables:**
- `Claim`, `Charge`, `Payment`, `Invoice`, `Adjustment`, `Denial`, `InsuranceVerification`

---

### Agent 6: Laboratory Information System Module
**Responsibility:** Lab orders, results, specimen tracking, interfaces to lab equipment

**Deliverables:**
- Lab order creation and management
- Test catalogs and panels
- Specimen collection and tracking
- Results entry and validation
- Critical value alerts
- Reference ranges and interpretation
- Lab interfaces (HL7 integration)
- Quality control tracking

**Key Files:**
- `/src/app/(dashboard)/laboratory/*` - Lab UI
- `/src/app/api/laboratory/*` - Lab API
- `/src/components/laboratory/*` - Lab components
- `/src/lib/services/lab-service.ts` - Lab logic
- `/src/lib/integrations/hl7.ts` - HL7 message handlers
- `/src/lib/alerts/critical-values.ts` - Critical value alerting

**API Endpoints:**
- `POST /api/laboratory/orders` - Create lab order
- `GET /api/laboratory/orders/:id` - Get order details
- `POST /api/laboratory/results` - Submit results
- `GET /api/laboratory/results/:orderId` - Get results
- `POST /api/laboratory/specimens` - Register specimen

**Database Tables:**
- `LabOrder`, `LabResult`, `LabTest`, `LabPanel`, `Specimen`, `ReferenceRange`, `LabInterface`

---

### Agent 7: Pharmacy Management Module
**Responsibility:** ePrescribing, medication management, formulary, drug interactions

**Deliverables:**
- Electronic prescribing (eRx)
- Medication order entry (CPOE)
- Drug interaction checking
- Allergy checking
- Formulary management
- Medication administration records (MAR)
- Controlled substance tracking
- Pharmacy inventory management
- NCPDP SCRIPT integration

**Key Files:**
- `/src/app/(dashboard)/pharmacy/*` - Pharmacy UI
- `/src/app/api/pharmacy/*` - Pharmacy API
- `/src/components/pharmacy/*` - Pharmacy components
- `/src/lib/services/pharmacy-service.ts` - Pharmacy logic
- `/src/lib/drug-database/*` - Drug interaction engine
- `/src/lib/integrations/surescripts.ts` - eRx integration

**API Endpoints:**
- `POST /api/pharmacy/prescriptions` - Create prescription
- `GET /api/pharmacy/prescriptions/:patientId` - Patient medications
- `POST /api/pharmacy/interactions/check` - Check drug interactions
- `POST /api/pharmacy/dispense` - Dispense medication
- `GET /api/pharmacy/formulary` - Get formulary

**Database Tables:**
- `Prescription`, `Medication`, `MedicationAdministration`, `Formulary`, `DrugInteraction`, `PharmacyInventory`

---

### Agent 8: Imaging/PACS Integration Module
**Responsibility:** Radiology orders, DICOM integration, image viewing, reports

**Deliverables:**
- Radiology order management
- DICOM integration and image storage
- Image viewer integration (OHIF Viewer)
- Radiology reports and templates
- Critical findings alerts
- Image sharing and CD burning
- Modality worklist
- RIS (Radiology Information System) functionality

**Key Files:**
- `/src/app/(dashboard)/imaging/*` - Imaging UI
- `/src/app/api/imaging/*` - Imaging API
- `/src/components/imaging/*` - Imaging components
- `/src/lib/services/imaging-service.ts` - Imaging logic
- `/src/lib/integrations/dicom.ts` - DICOM handlers
- `/src/lib/integrations/pacs.ts` - PACS integration

**API Endpoints:**
- `POST /api/imaging/orders` - Create imaging order
- `GET /api/imaging/studies/:id` - Get study details
- `POST /api/imaging/reports` - Submit radiology report
- `GET /api/imaging/viewer/:studyId` - Launch viewer
- `GET /api/imaging/images/:studyId` - Get DICOM images

**Database Tables:**
- `ImagingOrder`, `ImagingStudy`, `ImagingReport`, `DicomSeries`, `Modality`, `RadiologyTemplate`

---

### Agent 9: Analytics & Reporting Module
**Responsibility:** Business intelligence, clinical analytics, dashboards, compliance reporting

**Deliverables:**
- Executive dashboards
- Clinical quality measures (CQM)
- Financial analytics and KPIs
- Patient population health analytics
- Utilization reports
- Compliance reporting (HEDIS, MIPS, PQRS)
- Custom report builder
- Data export capabilities

**Key Files:**
- `/src/app/(dashboard)/analytics/*` - Analytics UI
- `/src/app/api/analytics/*` - Analytics API
- `/src/components/analytics/*` - Charts and dashboards
- `/src/lib/services/analytics-service.ts` - Analytics logic
- `/src/lib/reporting/*` - Report generators
- `/src/lib/queries/analytics-queries.ts` - Complex analytics queries

**API Endpoints:**
- `GET /api/analytics/dashboard/:type` - Get dashboard data
- `POST /api/analytics/reports/generate` - Generate report
- `GET /api/analytics/metrics/:metric` - Get specific metric
- `GET /api/analytics/population-health` - Population health data
- `POST /api/analytics/custom-query` - Run custom query

**Database Tables:**
- `Report`, `Dashboard`, `Metric`, `AnalyticsCache`, `QualityMeasure`, `ReportSchedule`

---

### Agent 10: Security, Auth & HIPAA Compliance Module
**Responsibility:** Authentication, authorization, audit logging, HIPAA compliance, security

**Deliverables:**
- User authentication and session management
- Role-based access control (RBAC)
- Permission management system
- Audit logging for all PHI access
- Encryption at rest and in transit
- Security incident detection
- HIPAA compliance monitoring
- User activity tracking
- Automatic session timeout
- MFA (Multi-Factor Authentication)
- Break-the-glass emergency access

**Key Files:**
- `/src/lib/auth/*` - Authentication system
- `/src/lib/rbac/*` - RBAC implementation
- `/src/lib/audit/*` - Audit logging
- `/src/lib/encryption/*` - Encryption utilities
- `/src/lib/compliance/*` - HIPAA compliance checks
- `/src/middleware.ts` - Auth middleware
- `/src/app/api/auth/*` - Auth API routes
- `/src/app/(auth)/*` - Login/logout pages

**API Endpoints:**
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/mfa/verify` - MFA verification
- `GET /api/auth/session` - Get current session
- `POST /api/auth/emergency-access` - Break-the-glass access
- `GET /api/audit/logs` - Query audit logs

**Database Tables:**
- `User`, `Role`, `Permission`, `AuditLog`, `Session`, `SecurityIncident`, `BreakGlassAccess`

---

## SHARED INTERFACES AND TYPES

All agents MUST use the shared TypeScript types defined in `/src/types/*.ts`. DO NOT create duplicate type definitions.

### Core Entity Types (src/types/index.ts)
- `Organization` - Multi-tenant organization
- `User` - System user with RBAC
- `Role` - User role definition
- `Permission` - Granular permissions
- `AuditLog` - Audit trail entry
- `Address` - Standard address format
- `ContactInfo` - Contact information
- `Timestamps` - createdAt, updatedAt, deletedAt

### Patient Types (src/types/patient.ts)
- `Patient` - Patient demographics
- `PatientInsurance` - Insurance information
- `EmergencyContact` - Emergency contacts
- `Allergy` - Patient allergies
- `Immunization` - Vaccination records

### Clinical Types (src/types/clinical.ts)
- `ClinicalNote` - Clinical documentation
- `VitalSigns` - Vital measurements
- `ProblemList` - Active problems
- `Diagnosis` - ICD-10 coded diagnoses
- `Procedure` - CPT coded procedures
- `CarePlan` - Treatment plans

### Scheduling Types (src/types/scheduling.ts)
- `Appointment` - Appointment entity
- `Schedule` - Provider schedules
- `TimeSlot` - Available time slots
- `Waitlist` - Waitlist entries

### Billing Types (src/types/billing.ts)
- `Claim` - Insurance claim
- `Charge` - Individual charge
- `Payment` - Payment transaction
- `Invoice` - Patient invoice

### Laboratory Types (src/types/laboratory.ts)
- `LabOrder` - Laboratory order
- `LabResult` - Test result
- `LabTest` - Test definition
- `Specimen` - Specimen tracking

### Pharmacy Types (src/types/pharmacy.ts)
- `Prescription` - Medication prescription
- `Medication` - Medication details
- `MedicationAdministration` - MAR entry
- `DrugInteraction` - Interaction data

### Imaging Types (src/types/imaging.ts)
- `ImagingOrder` - Imaging order
- `ImagingStudy` - DICOM study
- `ImagingReport` - Radiology report

### Analytics Types (src/types/analytics.ts)
- `Report` - Report definition
- `Dashboard` - Dashboard configuration
- `Metric` - Performance metric

### Auth Types (src/types/auth.ts)
- `AuthUser` - Authenticated user
- `Session` - User session
- `MFAChallenge` - MFA data

---

## DATABASE SCHEMA CONVENTIONS

### Naming Conventions
- **Tables:** PascalCase singular (e.g., `Patient`, `Appointment`)
- **Columns:** camelCase (e.g., `firstName`, `dateOfBirth`)
- **Relations:** Descriptive names (e.g., `patient`, `assignedProvider`)
- **Enums:** PascalCase (e.g., `AppointmentStatus`, `ClaimStatus`)

### Standard Fields
Every table MUST include:
```prisma
id            String   @id @default(cuid())
organizationId String
createdAt     DateTime @default(now())
updatedAt     DateTime @updatedAt
deletedAt     DateTime? // Soft delete
createdBy     String
updatedBy     String
```

### Multi-Tenancy
- All tables include `organizationId` for data isolation
- Queries MUST filter by `organizationId`
- Row-level security enforced at application layer

### Audit Trail
- Use `createdBy`, `updatedBy` for user tracking
- Soft delete with `deletedAt` (never hard delete PHI)
- Critical operations logged to `AuditLog` table

### Encryption
- PHI fields encrypted at rest (use Prisma middleware)
- Fields requiring encryption: SSN, MRN, notes, diagnoses
- Encryption key rotation support

---

## API ROUTE CONVENTIONS

### Route Structure
```
/api/{module}/{resource}
/api/{module}/{resource}/{id}
/api/{module}/{resource}/{id}/{action}
```

### HTTP Methods
- `GET` - Retrieve resources
- `POST` - Create new resource
- `PUT` - Update entire resource
- `PATCH` - Partial update
- `DELETE` - Soft delete resource

### Response Format
All API responses use consistent format:
```typescript
{
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

### Error Codes
- `AUTH_REQUIRED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `CONFLICT` - Resource conflict (duplicate)
- `INTERNAL_ERROR` - Server error

### Authentication
- All API routes require authentication (except `/api/auth/*`)
- JWT token in `Authorization: Bearer {token}` header
- Session validation on every request
- Rate limiting: 100 req/min per user

### Authorization
- Permission checks before data access
- RBAC enforced via middleware
- Organization-level data isolation
- Audit logging for PHI access

---

## COMPONENT LIBRARY STANDARDS

### UI Components (shadcn/ui)
Use shadcn/ui components for consistency:
- `Button`, `Input`, `Select`, `Checkbox`, `RadioGroup`
- `Dialog`, `Sheet`, `Popover`, `Tooltip`
- `Table`, `DataTable`, `Pagination`
- `Card`, `Tabs`, `Accordion`
- `Form`, `Label`, `Alert`

### Custom Components
Location: `/src/components/{module}/`

Naming: PascalCase, descriptive (e.g., `PatientSearchDialog`, `AppointmentCalendar`)

### Component Structure
```typescript
// Props interface
interface ComponentProps {
  // Props
}

// Component
export function Component({ ...props }: ComponentProps) {
  // Implementation
}
```

### Accessibility
- All form inputs must have labels
- Keyboard navigation support
- ARIA attributes where applicable
- Color contrast compliance (WCAG AA)

---

## INTEGRATION POINTS

### Module Dependencies

**Patient → Clinical**
- Clinical notes require patient context
- Shared patient demographics

**Clinical → Scheduling**
- Appointments linked to clinical encounters
- Chief complaint from appointment to clinical note

**Clinical → Billing**
- Diagnoses and procedures generate charges
- Clinical documentation supports billing

**Clinical → Laboratory**
- Lab orders from clinical workflow
- Results displayed in clinical timeline

**Clinical → Pharmacy**
- Prescriptions from clinical notes
- Medication list in clinical view

**Clinical → Imaging**
- Imaging orders from clinical workflow
- Reports integrated into clinical record

**Scheduling → Billing**
- Appointment creates billing encounter
- No-shows generate fees

**Billing → Analytics**
- Revenue data for financial reports
- Claims data for denial analytics

**All Modules → Audit**
- All PHI access logged
- User actions tracked

**All Modules → Auth**
- Authentication required
- Permission checks enforced

### Shared Services
- `/src/lib/services/notification-service.ts` - System-wide notifications
- `/src/lib/services/upload-service.ts` - File upload handling
- `/src/lib/services/export-service.ts` - Data export (PDF, CSV, HL7)
- `/src/lib/services/search-service.ts` - Global search functionality

### Event System
Use event emitters for inter-module communication:
```typescript
// Example: New lab result triggers clinical notification
eventEmitter.emit('lab.result.completed', { orderId, patientId });
```

Events to implement:
- `patient.created`, `patient.updated`
- `appointment.booked`, `appointment.cancelled`
- `lab.result.completed`, `lab.result.critical`
- `prescription.created`, `prescription.dispensed`
- `claim.submitted`, `claim.denied`
- `user.login`, `user.logout`

---

## DEVELOPMENT WORKFLOW

### Branch Strategy
- `main` - Production
- `develop` - Development
- `feature/{module}-{feature}` - Feature branches
- `bugfix/{issue-number}` - Bug fixes

### Code Review Requirements
- All code must be reviewed by coordinator
- Pass TypeScript compilation
- Pass ESLint/Prettier checks
- Include unit tests for business logic
- Update integration tests if APIs change

### Testing Strategy
- **Unit Tests:** Jest + React Testing Library
- **Integration Tests:** Playwright E2E
- **API Tests:** Supertest
- **Database Tests:** Prisma test database
- Target: >80% code coverage

### Deployment
- **Development:** Vercel preview deployments
- **Staging:** staging.lithic.health
- **Production:** app.lithic.health
- CI/CD via GitHub Actions

---

## HIPAA COMPLIANCE CHECKLIST

### Technical Safeguards
- [x] Encryption at rest (database level)
- [x] Encryption in transit (HTTPS/TLS 1.3)
- [x] Unique user identification
- [x] Automatic logoff (15 min idle)
- [x] Audit controls (comprehensive logging)
- [x] Integrity controls (checksums, version control)

### Administrative Safeguards
- [ ] Access management procedures (RBAC)
- [ ] Workforce training documentation
- [ ] Contingency planning (backup/disaster recovery)
- [ ] Business associate agreements

### Physical Safeguards
- [ ] Facility access controls (datacenter security)
- [ ] Workstation security (screen locks)
- [ ] Device and media controls

### Audit Requirements
All of the following MUST be logged:
- PHI access (who, what, when, from where)
- PHI modifications (before/after values)
- Failed login attempts
- Permission changes
- Emergency access usage
- Data exports

---

## NEXT STEPS

### Phase 1: Foundation (Week 1-2)
- Agent 1: Complete core infrastructure
- Agent 10: Implement auth and RBAC
- All: Review and align on shared types

### Phase 2: Core Modules (Week 3-4)
- Agent 2: Patient management
- Agent 3: Clinical documentation
- Agent 4: Scheduling

### Phase 3: Clinical Support (Week 5-6)
- Agent 6: Laboratory
- Agent 7: Pharmacy
- Agent 8: Imaging

### Phase 4: Revenue & Analytics (Week 7-8)
- Agent 5: Billing
- Agent 9: Analytics

### Phase 5: Integration & Testing (Week 9-10)
- All agents: Integration testing
- Performance optimization
- Security audit
- HIPAA compliance validation

---

## COORDINATION PROTOCOL

### Daily Standups (Async)
Each agent posts to this scratchpad:
- Yesterday's progress
- Today's goals
- Blockers/dependencies

### Code Freeze
- Coordinate with other agents before modifying shared types
- Announce breaking changes 24h in advance
- Update this scratchpad when adding new integration points

### Questions/Issues
Post questions to relevant section. Coordinator responds within 4h.

---

## CONTACT & ESCALATION

**Coordinator Agent:** Available for:
- Architecture decisions
- Merge conflict resolution
- Cross-module integration issues
- Shared type modifications
- Database schema changes

**Escalation Path:**
1. Post issue in scratchpad
2. Tag coordinator
3. Wait for response (4h SLA)
4. If urgent: Emergency protocol

---

## REVISION HISTORY

| Date | Agent | Changes |
|------|-------|---------|
| 2026-01-01 | Coordinator | Initial scratchpad creation |

---

**END OF SCRATCHPAD**

*This document is the source of truth for all development. Keep it updated.*
