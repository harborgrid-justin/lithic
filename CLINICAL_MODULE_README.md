# Clinical Documentation & EHR Module

**Agent 3 - Complete Clinical Documentation System for Lithic Healthcare SaaS**

## Overview

This module provides a comprehensive Electronic Health Record (EHR) and Clinical Documentation system with support for:

- Patient encounters and visits
- Clinical notes (SOAP, Progress, Discharge, etc.)
- Vital signs tracking and trending
- Problem lists with ICD-10 codes
- Allergy management
- Medication lists
- Clinical orders (Lab, Imaging, Procedures, etc.)
- Electronic signatures
- Rich text WYSIWYG note editor
- Clinical templates
- CPT and ICD-10 code integration

## Architecture

### Pages (11 total)

1. **Clinical Dashboard** - `/src/app/(dashboard)/clinical/page.tsx`
   - Overview of all clinical data
   - Quick access to encounters, notes, vitals, and orders
   - Clinical summary with active problems, allergies, and medications

2. **Encounters**
   - List: `/src/app/(dashboard)/clinical/encounters/page.tsx`
   - Detail: `/src/app/(dashboard)/clinical/encounters/[id]/page.tsx`
   - New: `/src/app/(dashboard)/clinical/encounters/new/page.tsx`

3. **Clinical Notes**
   - List: `/src/app/(dashboard)/clinical/notes/page.tsx`
   - Detail with signing: `/src/app/(dashboard)/clinical/notes/[id]/page.tsx`

4. **Vitals**: `/src/app/(dashboard)/clinical/vitals/page.tsx`
   - Latest vitals panel
   - Trending charts for BP, HR, Weight, Temperature

5. **Orders**: `/src/app/(dashboard)/clinical/orders/page.tsx`
   - Lab, imaging, procedure, medication, and referral orders

6. **Problem List**: `/src/app/(dashboard)/clinical/problems/page.tsx`
   - ICD-10 coded problems
   - Status tracking (active, chronic, resolved)

7. **Allergies**: `/src/app/(dashboard)/clinical/allergies/page.tsx`
   - Allergy types: medication, food, environmental
   - Severity levels

8. **Medications**: `/src/app/(dashboard)/clinical/medications/page.tsx`
   - Active and historical medications
   - Dosage, route, frequency tracking

### API Routes (9 total)

1. **Encounters**
   - `GET/POST /api/clinical/encounters`
   - `GET/PUT/PATCH/DELETE /api/clinical/encounters/[id]`

2. **Clinical Notes**
   - `GET/POST /api/clinical/notes`
   - `GET/PUT/PATCH /api/clinical/notes/[id]`
   - PATCH supports electronic signing

3. **Orders**
   - `GET/POST/PUT /api/clinical/orders`

4. **Vitals**
   - `GET/POST /api/clinical/vitals`
   - Auto-calculates BMI

5. **Problems**
   - `GET/POST/PUT /api/clinical/problems`

6. **Allergies**
   - `GET/POST/PUT /api/clinical/allergies`

7. **Medications**
   - `GET/POST/PUT /api/clinical/medications`

### Components (13 total)

#### Clinical Components

1. **EncounterList** - Table view of patient encounters
2. **EncounterForm** - Create/edit encounter form
3. **ClinicalNote** - Display clinical notes
4. **NoteEditor** - Rich text WYSIWYG editor with React Quill
5. **VitalsPanel** - Latest vital signs with icons
6. **VitalsChart** - Recharts trending visualization
7. **ProblemList** - ICD-10 coded problem list
8. **AllergyList** - Allergy tracking with severity
9. **MedicationList** - Medication management
10. **OrdersPanel** - Clinical orders dashboard
11. **ClinicalSummary** - Patient summary card
12. **SOAPNote** - Formatted SOAP note display
13. **TemplateSelector** - Clinical note templates

#### UI Components

- Button, Card, Badge, Input, Label, Select, Textarea
- Table components
- Separator

### Services (2 total)

1. **clinical.service.ts**
   - Notes, vitals, problems, allergies, medications, orders
   - ICD-10 and CPT code search
   - Template management
   - Electronic signatures

2. **encounter.service.ts**
   - CRUD operations for encounters
   - Complete encounter workflow

### Type Definitions

**Location**: `/src/types/clinical.ts`

Key interfaces:

- `Encounter` - Patient visits
- `ClinicalNote` - All note types
- `VitalSigns` - Comprehensive vitals
- `Problem` - ICD-10 coded problems
- `Diagnosis` - Encounter diagnoses
- `Procedure` - CPT coded procedures
- `Allergy` - Allergy tracking
- `Medication` - Medication management
- `Order` - Clinical orders
- `NoteTemplate` - Note templates
- `ICD10Code` - ICD-10 codes
- `CPTCode` - CPT codes

## Features

### Clinical Notes

- **SOAP Notes** - Structured Subjective, Objective, Assessment, Plan
- **Progress Notes** - Follow-up documentation
- **Admission/Discharge Notes** - Hospital documentation
- **Procedure Notes** - Procedure documentation
- **Consultation Notes** - Specialist consultations

### Electronic Signatures

- Type-to-sign functionality
- Timestamp and provider tracking
- Signature lock (notes cannot be edited after signing)
- Audit trail

### Rich Text Editor

- React Quill integration
- Formatting: headers, bold, italic, underline
- Lists: ordered and unordered
- Code blocks and blockquotes
- Clean, professional output

### Vital Signs Tracking

- Temperature (F/C)
- Blood Pressure (Systolic/Diastolic)
- Heart Rate
- Respiratory Rate
- Oxygen Saturation
- Weight (lbs/kg)
- Height (in/cm)
- BMI (auto-calculated)
- Pain Level (0-10)

### Clinical Orders

- **Lab Orders** - Laboratory tests
- **Imaging Orders** - Radiology studies
- **Procedure Orders** - Clinical procedures
- **Medication Orders** - Prescriptions
- **Referral Orders** - Specialist referrals
- Priority levels: Routine, Urgent, STAT
- Status tracking: Pending, In Progress, Completed, Cancelled

### ICD-10 & CPT Integration

- ICD-10 code search for diagnoses
- CPT code search for procedures
- Code descriptions
- Category organization

### Clinical Templates

- Pre-built SOAP templates
- Annual physical template
- Progress note template
- Discharge summary template
- Template selector component
- Custom template support

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI primitives
- **Charts**: Recharts
- **Rich Text Editor**: React Quill
- **Date Handling**: date-fns
- **Utilities**: clsx, tailwind-merge, class-variance-authority

## Installation

```bash
cd /home/user/lithic
npm install
```

## Development

```bash
npm run dev
```

Visit: `http://localhost:3000/clinical`

## API Endpoints

### Encounters

```
GET    /api/clinical/encounters
POST   /api/clinical/encounters
GET    /api/clinical/encounters/[id]
PUT    /api/clinical/encounters/[id]
PATCH  /api/clinical/encounters/[id]
DELETE /api/clinical/encounters/[id]
```

### Clinical Notes

```
GET    /api/clinical/notes
POST   /api/clinical/notes
GET    /api/clinical/notes/[id]
PUT    /api/clinical/notes/[id]
PATCH  /api/clinical/notes/[id]  (for signing)
```

### Vitals, Problems, Allergies, Medications, Orders

```
GET    /api/clinical/{resource}?patientId={id}
POST   /api/clinical/{resource}
PUT    /api/clinical/{resource}  (with id in body)
```

## Usage Examples

### Creating an Encounter

```typescript
import { createEncounter } from "@/services/encounter.service";

const encounter = await createEncounter({
  patientId: "P001",
  patientName: "John Doe",
  providerId: "PR001",
  providerName: "Dr. Smith",
  type: "office-visit",
  date: new Date().toISOString(),
  chiefComplaint: "Annual physical",
  status: "scheduled",
});
```

### Creating a SOAP Note

```typescript
import { createClinicalNote } from "@/services/clinical.service";

const note = await createClinicalNote({
  patientId: "P001",
  patientName: "John Doe",
  providerId: "PR001",
  providerName: "Dr. Smith",
  encounterId: "E001",
  type: "soap",
  title: "Annual Physical - SOAP Note",
  subjective: "Patient reports feeling well...",
  objective: "Vital signs normal...",
  assessment: "Healthy adult...",
  plan: "Continue current lifestyle...",
});
```

### Signing a Note

```typescript
import { signClinicalNote } from "@/services/clinical.service";

const signedNote = await signClinicalNote("N001", "Dr. Sarah Smith, MD");
```

### Recording Vitals

```typescript
import { createVitals } from "@/services/clinical.service";

const vitals = await createVitals({
  patientId: "P001",
  recordedBy: "Nurse Johnson",
  temperature: 98.6,
  temperatureUnit: "F",
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  heartRate: 72,
  respiratoryRate: 16,
  oxygenSaturation: 98,
  weight: 170,
  weightUnit: "lbs",
  height: 70,
  heightUnit: "in",
});
```

## File Structure

```
/home/user/lithic/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   └── clinical/
│   │   │       ├── page.tsx                    # Clinical dashboard
│   │   │       ├── encounters/
│   │   │       │   ├── page.tsx                # Encounters list
│   │   │       │   ├── new/page.tsx            # New encounter
│   │   │       │   └── [id]/page.tsx           # Encounter detail
│   │   │       ├── notes/
│   │   │       │   ├── page.tsx                # Notes list
│   │   │       │   └── [id]/page.tsx           # Note detail + signing
│   │   │       ├── orders/page.tsx             # Orders
│   │   │       ├── vitals/page.tsx             # Vitals tracking
│   │   │       ├── problems/page.tsx           # Problem list
│   │   │       ├── allergies/page.tsx          # Allergies
│   │   │       └── medications/page.tsx        # Medications
│   │   ├── api/
│   │   │   └── clinical/
│   │   │       ├── encounters/
│   │   │       │   ├── route.ts
│   │   │       │   └── [id]/route.ts
│   │   │       ├── notes/
│   │   │       │   ├── route.ts
│   │   │       │   └── [id]/route.ts
│   │   │       ├── orders/route.ts
│   │   │       ├── vitals/route.ts
│   │   │       ├── problems/route.ts
│   │   │       ├── allergies/route.ts
│   │   │       └── medications/route.ts
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── clinical/
│   │   │   ├── EncounterList.tsx
│   │   │   ├── EncounterForm.tsx
│   │   │   ├── ClinicalNote.tsx
│   │   │   ├── NoteEditor.tsx
│   │   │   ├── VitalsPanel.tsx
│   │   │   ├── VitalsChart.tsx
│   │   │   ├── ProblemList.tsx
│   │   │   ├── AllergyList.tsx
│   │   │   ├── MedicationList.tsx
│   │   │   ├── OrdersPanel.tsx
│   │   │   ├── ClinicalSummary.tsx
│   │   │   ├── SOAPNote.tsx
│   │   │   └── TemplateSelector.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── badge.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── textarea.tsx
│   │       ├── table.tsx
│   │       └── separator.tsx
│   ├── services/
│   │   ├── clinical.service.ts
│   │   └── encounter.service.ts
│   ├── types/
│   │   └── clinical.ts
│   └── lib/
│       └── utils.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── next.config.js
```

## Future Enhancements

- Integration with HL7 FHIR
- Real-time collaboration on notes
- Voice-to-text dictation
- Smart templates with AI assistance
- Clinical decision support
- Drug interaction checking
- Prescription writing and e-prescribing
- Integration with external labs/imaging
- Advanced clinical analytics
- Quality measure tracking
- HIPAA audit logging

## Compliance & Security

- Electronic signatures with timestamps
- Audit trails for all clinical data changes
- Role-based access control (RBAC) ready
- HIPAA compliance structure
- Encrypted data at rest and in transit (when deployed)
- Session management and authentication hooks

## License

Enterprise Healthcare SaaS - Lithic Platform
Copyright 2024 - All Rights Reserved

---

**Built by Agent 3 - Clinical Documentation Module**
