# Lithic - Enterprise Healthcare SaaS Platform

## Laboratory Information System (LIS) Module

A comprehensive Laboratory Information System built with Next.js 14, TypeScript, and modern healthcare standards including LOINC codes and HL7 interfaces.

### Features

- **Laboratory Order Management**: Create, track, and manage laboratory test orders
- **Result Entry & Verification**: Enter, verify, and release laboratory results
- **Specimen Tracking**: Track specimens from collection to disposal with barcode support
- **Test Panels**: Manage customizable test panels and configurations
- **Reference Ranges**: LOINC-compliant reference ranges with critical value alerts
- **Critical Alerts**: Real-time monitoring and notification of critical values
- **Quality Control**: QC record management and monitoring
- **Trend Analysis**: Visualize patient test results over time
- **HL7 Interface**: Generate HL7 messages for order and result transmission
- **Barcode Scanner**: Scan and track specimens using barcode technology
- **Comprehensive Reporting**: Generate detailed laboratory reports

### Healthcare Standards Compliance

- **LOINC Codes**: Standardized laboratory test codes
- **HL7 v2.5**: Message format for healthcare data exchange
- **HIPAA**: Privacy and security considerations built-in
- **Reference Ranges**: Age and gender-specific ranges
- **Critical Values**: Automated detection and alerting

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Components**: Radix UI + Tailwind CSS
- **Charts**: Recharts
- **State Management**: React Hooks
- **Styling**: Tailwind CSS with shadcn/ui components

### Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── laboratory/
│   │       ├── page.tsx                    # Main dashboard
│   │       ├── orders/
│   │       │   ├── page.tsx               # Orders list
│   │       │   ├── new/page.tsx           # New order form
│   │       │   └── [id]/page.tsx          # Order details
│   │       ├── results/
│   │       │   ├── page.tsx               # Results list
│   │       │   └── [id]/page.tsx          # Result details
│   │       ├── specimens/page.tsx         # Specimen tracking
│   │       ├── panels/page.tsx            # Test panels
│   │       ├── reference/page.tsx         # Reference ranges
│   │       └── qc/page.tsx                # Quality control
│   ├── api/
│   │   └── laboratory/
│   │       ├── orders/route.ts            # Orders API
│   │       ├── orders/[id]/route.ts       # Order by ID API
│   │       ├── results/route.ts           # Results API
│   │       ├── results/[id]/route.ts      # Result by ID API
│   │       ├── specimens/route.ts         # Specimens API
│   │       ├── panels/route.ts            # Panels API
│   │       └── reference/route.ts         # Reference ranges API
│   ├── globals.css                        # Global styles
│   └── layout.tsx                         # Root layout
├── components/
│   ├── laboratory/
│   │   ├── LabOrderList.tsx              # Order list component
│   │   ├── LabOrderForm.tsx              # Order form component
│   │   ├── ResultEntry.tsx               # Result entry component
│   │   ├── ResultViewer.tsx              # Result viewer component
│   │   ├── SpecimenTracker.tsx           # Specimen tracking component
│   │   ├── LabPanelBuilder.tsx           # Panel builder component
│   │   ├── ReferenceRanges.tsx           # Reference ranges component
│   │   ├── CriticalAlerts.tsx            # Critical alerts component
│   │   ├── TrendChart.tsx                # Trend chart component
│   │   ├── LabReport.tsx                 # Report generation component
│   │   ├── QualityControl.tsx            # QC component
│   │   └── BarcodeScanner.tsx            # Barcode scanner component
│   └── ui/                                # Reusable UI components
├── services/
│   ├── laboratory.service.ts              # Laboratory business logic
│   └── specimen.service.ts                # Specimen business logic
├── types/
│   └── laboratory.ts                      # TypeScript type definitions
└── lib/
    ├── utils.ts                           # Utility functions
    ├── loinc-codes.ts                     # LOINC code definitions
    └── reference-ranges.ts                # Reference range data

```

### Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### API Routes

- `GET /api/laboratory/orders` - List all orders
- `POST /api/laboratory/orders` - Create new order
- `GET /api/laboratory/orders/[id]` - Get order by ID
- `PATCH /api/laboratory/orders/[id]` - Update order
- `GET /api/laboratory/results` - List all results
- `POST /api/laboratory/results` - Create new result
- `GET /api/laboratory/results/[id]` - Get result by ID
- `PATCH /api/laboratory/results/[id]` - Update result
- `GET /api/laboratory/specimens` - List all specimens
- `POST /api/laboratory/specimens` - Create new specimen
- `GET /api/laboratory/panels` - List all test panels
- `POST /api/laboratory/panels` - Create new panel
- `GET /api/laboratory/reference` - List reference ranges

### Key Components

#### LabOrderList
Displays a table of laboratory orders with filtering and status badges.

#### LabOrderForm
Form for creating new laboratory orders with patient info, test selection, and priority.

#### ResultEntry
Interface for entering and verifying laboratory test results.

#### ResultViewer
Displays test results with flags, reference ranges, and critical value indicators.

#### SpecimenTracker
Tracks specimens through collection, processing, and storage phases.

#### BarcodeScanner
Scans and retrieves specimen information using barcodes.

#### TrendChart
Visualizes patient test results over time with reference range indicators.

#### CriticalAlerts
Monitors and manages critical value alerts requiring immediate attention.

### LOINC Codes

The system includes common LOINC codes for:
- Complete Blood Count (CBC)
- Basic Metabolic Panel (BMP)
- Liver Function Tests (LFT)
- Lipid Panel
- Thyroid Function Tests
- Cardiac Markers
- Coagulation Studies
- Urinalysis
- And more...

### HL7 Message Generation

The system can generate HL7 v2.5 messages for:
- Order messages (ORM^O01)
- Result messages (ORU^R01)

### Security & Compliance

- HIPAA-compliant data handling
- Audit logging for all actions
- User authentication and authorization (to be implemented)
- Secure data transmission
- Data encryption at rest (to be implemented)

### Future Enhancements

- Database integration (PostgreSQL/MySQL)
- User authentication and authorization
- Real-time notifications
- Mobile app support
- Integration with laboratory instruments
- Advanced analytics and reporting
- Multi-language support
- Barcode label printing
- Electronic signature for result verification
- Integration with EMR/EHR systems

### License

Proprietary - Lithic Enterprise Healthcare SaaS Platform

### Support

For support and questions, contact the development team.
