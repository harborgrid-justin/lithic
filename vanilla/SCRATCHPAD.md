# Lithic Vanilla - Enterprise Healthcare SaaS Platform

## Coordination Document for 10 Coding Agents

---

## ARCHITECTURE OVERVIEW

### Technology Stack

- **Backend**: Express.js + TypeScript + Prisma + PostgreSQL
- **Frontend**: Vite + Vanilla TypeScript (Web Components pattern)
- **Build Tools**: esbuild (backend) + Vite (frontend)
- **Database**: PostgreSQL 15+ with Prisma ORM
- **API**: RESTful JSON API
- **Authentication**: JWT with httpOnly cookies
- **Real-time**: Server-Sent Events (SSE) for updates

### Project Structure

```
/home/user/lithic/vanilla/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── index.ts     # Main entry point
│   │   ├── config/      # Configuration modules
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API route handlers
│   │   ├── services/    # Business logic
│   │   ├── models/      # Prisma client & helpers
│   │   └── utils/       # Shared utilities
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
├── frontend/            # Vite vanilla TypeScript
│   ├── src/
│   │   ├── main.ts     # Application entry
│   │   ├── router.ts   # Client-side routing
│   │   ├── components/ # Web Components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API clients
│   │   ├── utils/      # Frontend utilities
│   │   └── styles/     # Global styles
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
└── shared/              # Shared TypeScript types
    └── types/           # Type definitions
```

---

## MODULE ASSIGNMENTS (10 AGENTS)

### Agent 1: Authentication & Authorization

**Module**: `/backend/src/routes/auth.ts` + `/frontend/src/services/auth.ts`

- JWT token generation & validation
- Role-based access control (RBAC)
- Session management
- Password hashing (bcrypt)
- OAuth2 integration prep
- Audit logging for access

### Agent 2: Patient Management

**Module**: `/backend/src/routes/patients.ts` + `/frontend/src/components/patient/`

- Patient registration & demographics
- Medical record number (MRN) generation
- Patient search & filtering
- HIPAA-compliant data access
- Patient portal access
- Emergency contacts

### Agent 3: Clinical Documentation

**Module**: `/backend/src/routes/clinical.ts` + `/frontend/src/components/clinical/`

- Clinical notes (SOAP, Progress, Discharge)
- Diagnosis management (ICD-10)
- Procedure documentation (CPT codes)
- Vital signs tracking
- Medical history
- Allergies & adverse reactions

### Agent 4: Scheduling & Appointments

**Module**: `/backend/src/routes/scheduling.ts` + `/frontend/src/components/scheduling/`

- Appointment booking & management
- Provider calendar management
- Waiting room queue
- Appointment reminders
- Resource allocation
- No-show tracking

### Agent 5: Billing & Insurance

**Module**: `/backend/src/routes/billing.ts` + `/frontend/src/components/billing/`

- Claims generation (CMS-1500, UB-04)
- Insurance verification
- Payment processing
- Coding validation (ICD-10, CPT)
- EOB processing
- Patient statements

### Agent 6: Laboratory Management

**Module**: `/backend/src/routes/laboratory.ts` + `/frontend/src/components/laboratory/`

- Lab order management
- Result entry & validation
- LOINC code mapping
- Panic value alerts
- Quality control tracking
- Interface with LIS systems

### Agent 7: Pharmacy & Medication

**Module**: `/backend/src/routes/pharmacy.ts` + `/frontend/src/components/pharmacy/`

- e-Prescribing (EPCS ready)
- Medication order management
- Drug interaction checking
- Formulary management
- Medication administration records
- Controlled substance tracking

### Agent 8: Imaging & PACS

**Module**: `/backend/src/routes/imaging.ts` + `/frontend/src/components/imaging/`

- Imaging order management
- DICOM integration prep
- Radiology reporting
- Image viewer integration
- Modality worklist
- Critical results notification

### Agent 9: Analytics & Reporting

**Module**: `/backend/src/routes/analytics.ts` + `/frontend/src/components/analytics/`

- Clinical quality metrics
- Financial dashboards
- Utilization reports
- Custom report builder
- Data export (CSV, PDF)
- BI tool integration

### Agent 10: Admin & Configuration

**Module**: `/backend/src/routes/admin.ts` + `/frontend/src/components/admin/`

- User management
- Organization settings
- System configuration
- Audit log viewer
- Backup & restore
- Integration management

---

## SHARED INTERFACES & TYPES

### Type Definition Pattern

Location: `/shared/types/*.ts`

All types are exported from `/shared/types/index.ts` for easy import:

```typescript
// Backend usage
import { Patient, Appointment } from "../../../shared/types";

// Frontend usage
import { Patient, Appointment } from "../../../shared/types";
```

### Core Type Files

1. **auth.ts** - User, Role, Permission, Session
2. **patient.ts** - Patient, Demographics, Contact, Insurance
3. **clinical.ts** - ClinicalNote, Diagnosis, Procedure, VitalSigns
4. **scheduling.ts** - Appointment, Schedule, Resource
5. **billing.ts** - Claim, Payment, Invoice, Transaction
6. **laboratory.ts** - LabOrder, LabResult, LabTest
7. **pharmacy.ts** - Medication, Prescription, AdministrationRecord
8. **imaging.ts** - ImagingOrder, Study, Report
9. **analytics.ts** - Metric, Report, Dashboard
10. **index.ts** - Central export point

---

## API CONVENTIONS

### REST Endpoint Structure

```
/api/v1/{resource}
```

### Standard Methods

- `GET /api/v1/{resource}` - List with pagination
- `GET /api/v1/{resource}/:id` - Get single item
- `POST /api/v1/{resource}` - Create new
- `PUT /api/v1/{resource}/:id` - Full update
- `PATCH /api/v1/{resource}/:id` - Partial update
- `DELETE /api/v1/{resource}/:id` - Delete (soft delete preferred)

### Request/Response Format

```typescript
// List Response
{
  data: Array<T>,
  meta: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}

// Single Item Response
{
  data: T
}

// Error Response
{
  error: {
    code: string,
    message: string,
    details?: any,
    timestamp: string
  }
}
```

### Authentication

- Header: `Authorization: Bearer <JWT_TOKEN>`
- Cookie: `session=<SIGNED_COOKIE>` (httpOnly, secure, sameSite)

### Pagination

- Query params: `?page=1&limit=20`
- Default limit: 20, max: 100

### Filtering & Search

- Query params: `?filter[field]=value&search=term`
- Date ranges: `?startDate=2024-01-01&endDate=2024-12-31`

### Sorting

- Query param: `?sort=-createdAt,name` (- prefix for descending)

---

## FRONTEND COMPONENT PATTERNS

### Web Components Architecture

We use native Web Components with TypeScript for maximum performance and zero framework overhead.

#### Base Component Class

```typescript
// /frontend/src/components/base.ts
export abstract class BaseComponent extends HTMLElement {
  protected shadow: ShadowRoot;
  protected template: string = "";

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  protected render() {
    this.shadow.innerHTML = this.template;
  }

  protected abstract attachEventListeners(): void;
}
```

#### Component Naming Convention

- Custom element name: `lithic-{module}-{component}`
- Examples: `lithic-patient-list`, `lithic-appointment-calendar`

#### Component Registration

```typescript
customElements.define("lithic-patient-list", PatientListComponent);
```

#### Component Usage

```html
<lithic-patient-list api-endpoint="/api/v1/patients" page-size="20">
</lithic-patient-list>
```

### State Management Pattern

```typescript
// Simple observable pattern
class Store<T> {
  private state: T;
  private listeners: Set<(state: T) => void> = new Set();

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState(): T {
    return this.state;
  }

  setState(newState: Partial<T>) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach((listener) => listener(this.state));
  }

  subscribe(listener: (state: T) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
```

### Client-Side Routing

```typescript
// /frontend/src/router.ts
class Router {
  private routes: Map<string, () => void>;

  register(path: string, handler: () => void) {
    this.routes.set(path, handler);
  }

  navigate(path: string) {
    history.pushState(null, "", path);
    this.resolve();
  }

  private resolve() {
    const handler = this.routes.get(window.location.pathname);
    if (handler) handler();
  }
}
```

---

## DATABASE SCHEMA CONVENTIONS

### Naming Conventions

- Tables: PascalCase (Patient, Appointment)
- Fields: camelCase (firstName, dateOfBirth)
- Foreign keys: {model}Id (patientId, providerId)
- Junction tables: {Model1}{Model2} (PatientInsurance)

### Audit Fields (All Tables)

```prisma
createdAt    DateTime @default(now())
updatedAt    DateTime @updatedAt
createdBy    String?
updatedBy    String?
deletedAt    DateTime?  // Soft delete
```

### HIPAA Compliance Fields

```prisma
accessLog     AccessLog[]  // Track all access
encryptedData String?      // For PHI fields
dataHash      String?      // Integrity verification
```

### ID Strategy

- Primary keys: String (CUID for distributed systems)
- MRN/Custom IDs: Separate indexed fields

---

## SECURITY & HIPAA COMPLIANCE

### Data Classification

- **PHI (Protected Health Information)**: Encrypt at rest, audit all access
- **PII (Personal Identifiable Information)**: Tokenize where possible
- **Public**: Organization info, code tables

### Encryption Strategy

- At Rest: Database-level encryption (PostgreSQL + pgcrypto)
- In Transit: TLS 1.3 minimum
- Application-level: Sensitive fields encrypted before storage

### Audit Logging

Every PHI access must log:

- User ID
- Timestamp
- Action (read, write, delete)
- IP address
- Resource accessed
- Purpose of access

### Access Control Matrix

```typescript
enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ORG_ADMIN = "ORG_ADMIN",
  PHYSICIAN = "PHYSICIAN",
  NURSE = "NURSE",
  FRONT_DESK = "FRONT_DESK",
  BILLING = "BILLING",
  LAB_TECH = "LAB_TECH",
  PHARMACIST = "PHARMACIST",
  RADIOLOGIST = "RADIOLOGIST",
  PATIENT = "PATIENT",
}

enum Permission {
  PATIENT_READ = "PATIENT_READ",
  PATIENT_WRITE = "PATIENT_WRITE",
  CLINICAL_READ = "CLINICAL_READ",
  CLINICAL_WRITE = "CLINICAL_WRITE",
  PRESCRIBE = "PRESCRIBE",
  BILLING_READ = "BILLING_READ",
  BILLING_WRITE = "BILLING_WRITE",
  LAB_ORDER = "LAB_ORDER",
  LAB_RESULT = "LAB_RESULT",
  IMAGING_ORDER = "IMAGING_ORDER",
  ADMIN = "ADMIN",
}
```

---

## ERROR HANDLING

### Backend Error Codes

```typescript
enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",

  // Server errors (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
}
```

### Frontend Error Handling

```typescript
class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: any,
  ) {
    super(message);
  }
}

async function handleApiCall<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    // Log to error tracking service
    // Show user-friendly message
    throw error;
  }
}
```

---

## VALIDATION STRATEGY

### Backend Validation

- Use Zod for runtime schema validation
- Validate at route handler entry
- Sanitize all inputs

### Frontend Validation

- HTML5 native validation first
- Custom validators for complex rules
- Real-time feedback on forms

---

## TESTING STRATEGY

### Backend Testing

- Unit tests: Vitest
- Integration tests: Supertest
- Database: Docker PostgreSQL for tests
- Coverage target: 80%+

### Frontend Testing

- Unit tests: Vitest
- Component tests: Web Test Runner
- E2E tests: Playwright
- Coverage target: 70%+

---

## DEPLOYMENT ARCHITECTURE

### Production Environment

```
┌─────────────┐
│   Nginx     │  (Reverse proxy, SSL termination)
└──────┬──────┘
       │
   ┌───┴────┐
   │        │
┌──▼──┐  ┌──▼──────┐
│Vite │  │ Express │
│Build│  │  API    │
└─────┘  └────┬────┘
              │
         ┌────▼────┐
         │PostgreSQL│
         └─────────┘
```

### Environment Variables

See `.env.example` for complete list

---

## DEVELOPMENT WORKFLOW

### Getting Started

```bash
# Backend
cd /home/user/lithic/vanilla/backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend
cd /home/user/lithic/vanilla/frontend
npm install
npm run dev
```

### Git Workflow

- Main branch: `main`
- Feature branches: `feature/{agent-number}-{module-name}`
- Each agent works on their assigned module
- PR required for merging to main

---

## AGENT COORDINATION CHECKLIST

### Phase 1: Foundation (Week 1)

- [ ] Agent 10: Admin module (user management for testing)
- [ ] Agent 1: Authentication (needed by all modules)
- [ ] All agents: Set up shared types for their domain

### Phase 2: Core Modules (Week 2-3)

- [ ] Agent 2: Patient management
- [ ] Agent 4: Scheduling
- [ ] Agent 3: Clinical documentation

### Phase 3: Ancillary Services (Week 4-5)

- [ ] Agent 6: Laboratory
- [ ] Agent 7: Pharmacy
- [ ] Agent 8: Imaging

### Phase 4: Business Operations (Week 6)

- [ ] Agent 5: Billing
- [ ] Agent 9: Analytics

### Phase 5: Integration & Testing (Week 7-8)

- [ ] All agents: Integration testing
- [ ] All agents: Security audit
- [ ] All agents: Performance optimization

---

## COMMUNICATION PROTOCOL

### Daily Standups (Async)

Each agent updates this document with:

- Progress since last update
- Blockers
- API contracts published
- Types added to `/shared/types`

### API Contract Changes

When changing shared APIs:

1. Update type definitions first
2. Notify dependent agents
3. Version the endpoint if breaking change

### Merge Conflicts

- Types conflicts: Agent who created the type resolves
- Prisma schema: Coordinate via this document before changing

---

## PERFORMANCE TARGETS

- API response time: < 200ms (p95)
- Frontend load time: < 2s (First Contentful Paint)
- Database queries: < 50ms (p95)
- Bundle size: < 300KB (frontend gzipped)

---

## MONITORING & OBSERVABILITY

- Logging: Winston (backend), Console (frontend with levels)
- Metrics: Prometheus-compatible endpoints
- Tracing: OpenTelemetry ready
- Health checks: `/health` endpoint

---

## NEXT STEPS FOR AGENTS

1. Review this scratchpad thoroughly
2. Review your assigned module in "MODULE ASSIGNMENTS"
3. Familiarize with shared types in `/shared/types`
4. Set up your development environment
5. Start with backend route + service, then frontend component
6. Write tests as you go
7. Update this scratchpad with your progress

---

**Last Updated**: 2026-01-01
**Version**: 1.0.0
**Coordinator**: Main Agent
