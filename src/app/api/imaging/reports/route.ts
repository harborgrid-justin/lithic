import { NextRequest, NextResponse } from "next/server";

// Mock database - replace with actual database in production
let reports: any[] = [
  {
    id: "REP-001",
    studyId: "STU-001",
    accessionNumber: "ACC-2026-001",
    patientId: "PAT-001",
    patientName: "Johnson, Sarah",
    reportDate: "2026-01-01T14:00:00Z",
    radiologist: "Dr. Wilson",
    radiologistId: "RAD-001",
    status: "FINAL",
    studyDescription: "CT Chest with Contrast",
    technique:
      "Helical CT of the chest was performed following administration of intravenous contrast. Axial images were obtained from the thoracic inlet through the upper abdomen. Coronal and sagittal reformations were generated.",
    comparison: "CT Chest dated 2025-06-15",
    findings: `LUNGS: The lungs are clear bilaterally without focal consolidation, pleural effusion, or pneumothorax. No suspicious pulmonary nodules are identified.

MEDIASTINUM: The heart size is normal. The mediastinal contours are unremarkable. No mediastinal or hilar lymphadenopathy is present.

PLEURA: The pleural spaces are clear bilaterally.

CHEST WALL: The chest wall is unremarkable. No suspicious osseous lesions are identified.

UPPER ABDOMEN: Limited images of the upper abdomen demonstrate normal appearance of the visualized liver, spleen, adrenal glands, and kidneys.`,
    impression: `1. No acute cardiopulmonary abnormality.
2. No evidence of pulmonary embolism.`,
    recommendations: "Clinical correlation recommended.",
    criticalFindings: null,
    templateId: "TMPL-CT-CHEST",
    signedDate: "2026-01-01T14:00:00Z",
    signedBy: "Dr. Wilson",
    verifiedDate: "2026-01-01T14:05:00Z",
    verifiedBy: "Dr. Anderson",
    addendums: [],
    createdAt: "2026-01-01T13:00:00Z",
    updatedAt: "2026-01-01T14:05:00Z",
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    let filteredReports = [...reports];

    // Apply filters
    const studyId = searchParams.get("studyId");
    if (studyId) {
      filteredReports = filteredReports.filter((r) => r.studyId === studyId);
    }

    const patientId = searchParams.get("patientId");
    if (patientId) {
      filteredReports = filteredReports.filter(
        (r) => r.patientId === patientId,
      );
    }

    const radiologist = searchParams.get("radiologist");
    if (radiologist) {
      filteredReports = filteredReports.filter(
        (r) => r.radiologist === radiologist,
      );
    }

    const status = searchParams.get("status");
    if (status) {
      filteredReports = filteredReports.filter((r) => r.status === status);
    }

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate && endDate) {
      filteredReports = filteredReports.filter((r) => {
        const reportDate = new Date(r.reportDate);
        return (
          reportDate >= new Date(startDate) && reportDate <= new Date(endDate)
        );
      });
    }

    return NextResponse.json(filteredReports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newReport = {
      id: `REP-${String(reports.length + 1).padStart(3, "0")}`,
      ...body,
      status: body.status || "DRAFT",
      reportDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      addendums: [],
    };

    reports.push(newReport);

    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    const reportIndex = reports.findIndex((r) => r.id === id);

    if (reportIndex === -1) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    reports[reportIndex] = {
      ...reports[reportIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(reports[reportIndex]);
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 },
    );
  }
}
