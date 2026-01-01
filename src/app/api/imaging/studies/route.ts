import { NextRequest, NextResponse } from "next/server";

// Mock database - replace with actual database in production
let studies: any[] = [
  {
    id: "STU-001",
    studyInstanceUID: "1.2.840.113619.2.55.3.2831868566.123.1640000001.1",
    accessionNumber: "ACC-2026-001",
    patientId: "PAT-001",
    patientName: "Johnson, Sarah",
    patientMRN: "MRN-12345",
    patientDOB: "1985-03-15",
    patientSex: "F",
    studyDate: "2026-01-01",
    studyTime: "10:30:00",
    studyDescription: "CT Chest with Contrast",
    modality: "CT",
    bodyPart: "CHEST",
    referringPhysician: "Dr. Smith",
    performingPhysician: "Dr. Brown",
    radiologist: "Dr. Wilson",
    numberOfSeries: 3,
    numberOfInstances: 250,
    institutionName: "Memorial Hospital",
    stationName: "CT-SCANNER-01",
    status: "REPORTED",
    reportId: "REP-001",
    reportStatus: "FINAL",
    pacsStatus: "STORED",
    fileSize: 256000000,
    thumbnailUrl: "/api/imaging/thumbnails/STU-001",
    seriesList: [
      {
        id: "SER-001",
        seriesInstanceUID:
          "1.2.840.113619.2.55.3.2831868566.123.1640000001.1.1",
        seriesNumber: 1,
        seriesDescription: "Scout",
        modality: "CT",
        bodyPart: "CHEST",
        numberOfInstances: 2,
        instances: [],
      },
      {
        id: "SER-002",
        seriesInstanceUID:
          "1.2.840.113619.2.55.3.2831868566.123.1640000001.1.2",
        seriesNumber: 2,
        seriesDescription: "Axial Non-Contrast",
        modality: "CT",
        bodyPart: "CHEST",
        numberOfInstances: 124,
        instances: [],
      },
      {
        id: "SER-003",
        seriesInstanceUID:
          "1.2.840.113619.2.55.3.2831868566.123.1640000001.1.3",
        seriesNumber: 3,
        seriesDescription: "Axial Contrast",
        modality: "CT",
        bodyPart: "CHEST",
        numberOfInstances: 124,
        instances: [],
      },
    ],
    createdAt: "2026-01-01T10:30:00Z",
    updatedAt: "2026-01-01T14:00:00Z",
  },
  {
    id: "STU-002",
    studyInstanceUID: "1.2.840.113619.2.55.3.2831868566.456.1640000002.1",
    accessionNumber: "ACC-2026-002",
    patientId: "PAT-002",
    patientName: "Davis, Michael",
    patientMRN: "MRN-67890",
    patientDOB: "1972-08-22",
    patientSex: "M",
    studyDate: "2026-01-01",
    studyTime: "14:00:00",
    studyDescription: "MRI Brain without Contrast",
    modality: "MR",
    bodyPart: "BRAIN",
    referringPhysician: "Dr. Johnson",
    performingPhysician: "Dr. Garcia",
    radiologist: "Dr. Anderson",
    numberOfSeries: 5,
    numberOfInstances: 480,
    institutionName: "Memorial Hospital",
    stationName: "MR-SCANNER-01",
    status: "IN_REVIEW",
    pacsStatus: "STORED",
    fileSize: 512000000,
    thumbnailUrl: "/api/imaging/thumbnails/STU-002",
    seriesList: [
      {
        id: "SER-004",
        seriesInstanceUID:
          "1.2.840.113619.2.55.3.2831868566.456.1640000002.1.1",
        seriesNumber: 1,
        seriesDescription: "Localizer",
        modality: "MR",
        bodyPart: "BRAIN",
        numberOfInstances: 3,
        instances: [],
      },
      {
        id: "SER-005",
        seriesInstanceUID:
          "1.2.840.113619.2.55.3.2831868566.456.1640000002.1.2",
        seriesNumber: 2,
        seriesDescription: "T1 Sagittal",
        modality: "MR",
        bodyPart: "BRAIN",
        numberOfInstances: 120,
        instances: [],
      },
      {
        id: "SER-006",
        seriesInstanceUID:
          "1.2.840.113619.2.55.3.2831868566.456.1640000002.1.3",
        seriesNumber: 3,
        seriesDescription: "T2 Axial",
        modality: "MR",
        bodyPart: "BRAIN",
        numberOfInstances: 120,
        instances: [],
      },
      {
        id: "SER-007",
        seriesInstanceUID:
          "1.2.840.113619.2.55.3.2831868566.456.1640000002.1.4",
        seriesNumber: 4,
        seriesDescription: "FLAIR Axial",
        modality: "MR",
        bodyPart: "BRAIN",
        numberOfInstances: 120,
        instances: [],
      },
      {
        id: "SER-008",
        seriesInstanceUID:
          "1.2.840.113619.2.55.3.2831868566.456.1640000002.1.5",
        seriesNumber: 5,
        seriesDescription: "DWI",
        modality: "MR",
        bodyPart: "BRAIN",
        numberOfInstances: 117,
        instances: [],
      },
    ],
    createdAt: "2026-01-01T14:00:00Z",
    updatedAt: "2026-01-01T15:00:00Z",
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    let filteredStudies = [...studies];

    // Apply filters
    const patientId = searchParams.get("patientId");
    if (patientId) {
      filteredStudies = filteredStudies.filter(
        (s) => s.patientId === patientId,
      );
    }

    const modality = searchParams.get("modality");
    if (modality) {
      filteredStudies = filteredStudies.filter((s) => s.modality === modality);
    }

    const status = searchParams.get("status");
    if (status) {
      filteredStudies = filteredStudies.filter((s) => s.status === status);
    }

    const accessionNumber = searchParams.get("accessionNumber");
    if (accessionNumber) {
      filteredStudies = filteredStudies.filter(
        (s) => s.accessionNumber === accessionNumber,
      );
    }

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate && endDate) {
      filteredStudies = filteredStudies.filter((s) => {
        const studyDate = new Date(s.studyDate);
        return (
          studyDate >= new Date(startDate) && studyDate <= new Date(endDate)
        );
      });
    }

    return NextResponse.json(filteredStudies);
  } catch (error) {
    console.error("Error fetching studies:", error);
    return NextResponse.json(
      { error: "Failed to fetch studies" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newStudy = {
      id: `STU-${String(studies.length + 1).padStart(3, "0")}`,
      ...body,
      status: body.status || "ACQUIRED",
      pacsStatus: body.pacsStatus || "UPLOADING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    studies.push(newStudy);

    return NextResponse.json(newStudy, { status: 201 });
  } catch (error) {
    console.error("Error creating study:", error);
    return NextResponse.json(
      { error: "Failed to create study" },
      { status: 500 },
    );
  }
}
