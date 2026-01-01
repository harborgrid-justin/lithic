# Lithic Clinical Documentation & EHR Module

Enterprise-grade Clinical Documentation and Electronic Health Record (EHR) system built with Express.js and Vanilla TypeScript.

## Features

### Clinical Documentation

- **Encounter Management**: Track patient encounters from scheduling to completion
- **Clinical Notes**: SOAP notes, progress notes, admission/discharge summaries
- **Rich Text Editor**: Full-featured note editor with formatting capabilities
- **E-Signatures**: Secure electronic signature workflow for clinical documentation
- **Templates**: Pre-built clinical note templates for efficiency

### EHR Capabilities

- **Vital Signs**: Record and trend vital signs over time
- **Problem List**: ICD-10 coded problem list with status tracking
- **Allergies**: Comprehensive allergy tracking with severity levels
- **Medications**: Medication prescribing and management
- **Orders**: Lab, imaging, and procedure order management
- **Clinical Coding**: ICD-10 and CPT code lookup and integration

### Enterprise Features

- **No Framework Dependencies**: Pure Vanilla TypeScript for maximum flexibility
- **Type Safety**: Full TypeScript implementation
- **RESTful API**: Clean, documented REST API
- **HIPAA Ready**: Security and audit trail features
- **Scalable Architecture**: Modular design for enterprise deployment

## Architecture

### Backend (Express + TypeScript)

```
/home/user/lithic/vanilla/backend/
├── src/
│   ├── routes/clinical/       # API routes
│   ├── controllers/           # Request handlers
│   ├── services/              # Business logic
│   ├── models/                # Type definitions
│   └── server.ts              # Main server file
```

### Frontend (Vanilla TypeScript)

```
/home/user/lithic/vanilla/frontend/
├── src/
│   ├── pages/clinical/        # Page components
│   ├── components/clinical/   # Reusable components
│   ├── services/              # API client
│   ├── styles/                # CSS styles
│   └── index.ts               # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- TypeScript 5+

### Backend Setup

```bash
cd /home/user/lithic/vanilla/backend

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The backend server will start on http://localhost:3000

### Frontend Setup

```bash
cd /home/user/lithic/vanilla/frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

The frontend dev server will start on http://localhost:8080

## API Endpoints

### Encounters

- `POST /api/clinical/encounters` - Create encounter
- `GET /api/clinical/encounters/:id` - Get encounter
- `PUT /api/clinical/encounters/:id` - Update encounter
- `POST /api/clinical/encounters/:id/start` - Start encounter
- `POST /api/clinical/encounters/:id/complete` - Complete encounter
- `POST /api/clinical/encounters/:id/sign` - Sign encounter

### Clinical Notes

- `POST /api/clinical/notes` - Create note
- `GET /api/clinical/notes/:id` - Get note
- `PUT /api/clinical/notes/:id` - Update note
- `POST /api/clinical/notes/:id/sign` - Sign note
- `POST /api/clinical/notes/:id/addendum` - Add addendum

### Vitals

- `POST /api/clinical/vitals` - Record vitals
- `GET /api/clinical/vitals/patient/:id` - Get patient vitals
- `GET /api/clinical/vitals/encounter/:id` - Get encounter vitals

### Problems

- `POST /api/clinical/problems` - Add problem
- `GET /api/clinical/problems/patient/:id` - Get patient problems
- `PUT /api/clinical/problems/:id` - Update problem
- `GET /api/clinical/problems/icd10/search` - Search ICD-10 codes

### Allergies

- `POST /api/clinical/allergies` - Add allergy
- `GET /api/clinical/allergies/patient/:id` - Get patient allergies
- `PUT /api/clinical/allergies/:id` - Update allergy

### Medications

- `POST /api/clinical/medications` - Prescribe medication
- `GET /api/clinical/medications/patient/:id` - Get patient medications
- `PUT /api/clinical/medications/:id` - Update medication

### Orders

- `POST /api/clinical/orders` - Create order
- `GET /api/clinical/orders/encounter/:id` - Get encounter orders
- `POST /api/clinical/orders/:id/sign` - Sign order
- `GET /api/clinical/orders/cpt/search` - Search CPT codes

## Components

### Frontend Components

- **EncounterList**: Display list of encounters
- **EncounterForm**: Create/edit encounters
- **SOAPNote**: SOAP note editor
- **NoteEditor**: Rich text clinical note editor
- **VitalsPanel**: Vital signs input form
- **VitalsChart**: Vitals trending chart
- **ProblemList**: Patient problem list display
- **AllergyList**: Allergy list with severity indicators
- **MedicationList**: Active medication list
- **OrdersPanel**: Clinical orders display

### Frontend Pages

- **ClinicalDashboardPage**: Provider dashboard
- **EncounterListPage**: Patient encounter history
- **EncounterDetailPage**: Detailed encounter view
- **NewEncounterPage**: Create new encounter
- **NotesPage**: Clinical note editor
- **VitalsPage**: Vitals recording and history
- **ProblemsPage**: Problem list management
- **AllergiesPage**: Allergy management
- **MedicationsPage**: Medication management

## Clinical Features

### ICD-10 Coding

The system includes built-in ICD-10 code lookup with common diagnoses:

- I10 - Essential (primary) hypertension
- E11.9 - Type 2 diabetes mellitus without complications
- J44.9 - Chronic obstructive pulmonary disease, unspecified
- And more...

### CPT Coding

Built-in CPT code reference for procedures and services:

- 99213-99215 - Office visits (established patient)
- 99203-99204 - Office visits (new patient)
- 80053 - Comprehensive metabolic panel
- And more...

### E-Signature Workflow

Secure electronic signature with:

- Password/PIN verification
- IP address tracking
- Timestamp recording
- Audit trail
- Addendum support for signed documents

## Security

- Input validation on all forms
- Type-safe API with TypeScript
- CORS configuration
- Error handling and logging
- Audit trail for clinical actions

## Future Enhancements

- Integration with HL7/FHIR standards
- Real-time collaboration
- Mobile responsive design
- Advanced analytics and reporting
- Integration with laboratory systems
- Prescription e-prescribing (EPCS)
- Patient portal integration

## License

MIT License - see LICENSE file for details

## Support

For enterprise support and customization, contact Lithic Health.
