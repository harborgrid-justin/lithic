import { NextRequest, NextResponse } from "next/server";

// Mock PACS configuration - replace with actual PACS integration in production
let pacsConfig = {
  aeTitle: "LITHIC_PACS",
  host: "pacs.hospital.local",
  port: 11112,
  protocol: "DICOMweb",
  qidoUrl: "https://pacs.hospital.local/dicomweb",
  wadoUrl: "https://pacs.hospital.local/dicomweb",
  stowUrl: "https://pacs.hospital.local/dicomweb",
  enabled: true,
};

// Mock DICOM data for demonstration
const mockDicomTags = [
  {
    tag: "0008,0005",
    vr: "CS",
    value: "ISO_IR 100",
    name: "SpecificCharacterSet",
  },
  {
    tag: "0008,0008",
    vr: "CS",
    value: ["ORIGINAL", "PRIMARY", "AXIAL"],
    name: "ImageType",
  },
  {
    tag: "0008,0016",
    vr: "UI",
    value: "1.2.840.10008.5.1.4.1.1.2",
    name: "SOPClassUID",
  },
  {
    tag: "0008,0018",
    vr: "UI",
    value: "1.2.840.113619.2.55.3.2831868566.123.1640000001.1.1.1",
    name: "SOPInstanceUID",
  },
  { tag: "0008,0020", vr: "DA", value: "20260101", name: "StudyDate" },
  { tag: "0008,0021", vr: "DA", value: "20260101", name: "SeriesDate" },
  { tag: "0008,0030", vr: "TM", value: "103000", name: "StudyTime" },
  { tag: "0008,0031", vr: "TM", value: "103530", name: "SeriesTime" },
  {
    tag: "0008,0050",
    vr: "SH",
    value: "ACC-2026-001",
    name: "AccessionNumber",
  },
  { tag: "0008,0060", vr: "CS", value: "CT", name: "Modality" },
  {
    tag: "0008,0070",
    vr: "LO",
    value: "GE MEDICAL SYSTEMS",
    name: "Manufacturer",
  },
  {
    tag: "0008,0090",
    vr: "PN",
    value: "Dr. Brown",
    name: "ReferringPhysicianName",
  },
  {
    tag: "0008,103E",
    vr: "LO",
    value: "Axial Contrast",
    name: "SeriesDescription",
  },
  { tag: "0010,0010", vr: "PN", value: "Johnson^Sarah", name: "PatientName" },
  { tag: "0010,0020", vr: "LO", value: "MRN-12345", name: "PatientID" },
  { tag: "0010,0030", vr: "DA", value: "19850315", name: "PatientBirthDate" },
  { tag: "0010,0040", vr: "CS", value: "F", name: "PatientSex" },
  { tag: "0018,0015", vr: "CS", value: "CHEST", name: "BodyPartExamined" },
  { tag: "0018,0050", vr: "DS", value: "5.0", name: "SliceThickness" },
  { tag: "0018,0060", vr: "DS", value: "120", name: "KVP" },
  {
    tag: "0020,000D",
    vr: "UI",
    value: "1.2.840.113619.2.55.3.2831868566.123.1640000001.1",
    name: "StudyInstanceUID",
  },
  {
    tag: "0020,000E",
    vr: "UI",
    value: "1.2.840.113619.2.55.3.2831868566.123.1640000001.1.3",
    name: "SeriesInstanceUID",
  },
  { tag: "0020,0011", vr: "IS", value: "3", name: "SeriesNumber" },
  { tag: "0020,0013", vr: "IS", value: "1", name: "InstanceNumber" },
  {
    tag: "0020,0032",
    vr: "DS",
    value: [-125.0, -125.0, 0.0],
    name: "ImagePositionPatient",
  },
  {
    tag: "0020,0037",
    vr: "DS",
    value: [1, 0, 0, 0, 1, 0],
    name: "ImageOrientationPatient",
  },
  { tag: "0028,0002", vr: "US", value: 1, name: "SamplesPerPixel" },
  {
    tag: "0028,0004",
    vr: "CS",
    value: "MONOCHROME2",
    name: "PhotometricInterpretation",
  },
  { tag: "0028,0010", vr: "US", value: 512, name: "Rows" },
  { tag: "0028,0011", vr: "US", value: 512, name: "Columns" },
  {
    tag: "0028,0030",
    vr: "DS",
    value: [0.488281, 0.488281],
    name: "PixelSpacing",
  },
  { tag: "0028,0100", vr: "US", value: 16, name: "BitsAllocated" },
  { tag: "0028,0101", vr: "US", value: 16, name: "BitsStored" },
  { tag: "0028,0102", vr: "US", value: 15, name: "HighBit" },
  { tag: "0028,0103", vr: "US", value: 1, name: "PixelRepresentation" },
  { tag: "0028,1050", vr: "DS", value: 40, name: "WindowCenter" },
  { tag: "0028,1051", vr: "DS", value: 400, name: "WindowWidth" },
  { tag: "0028,1052", vr: "DS", value: -1024, name: "RescaleIntercept" },
  { tag: "0028,1053", vr: "DS", value: 1, name: "RescaleSlope" },
];

// GET /api/imaging/dicom - Get DICOM configuration or query
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "config") {
      return NextResponse.json(pacsConfig);
    }

    if (action === "tags") {
      const studyInstanceUID = searchParams.get("studyInstanceUID");
      const seriesInstanceUID = searchParams.get("seriesInstanceUID");
      const sopInstanceUID = searchParams.get("sopInstanceUID");

      if (!studyInstanceUID || !seriesInstanceUID || !sopInstanceUID) {
        return NextResponse.json(
          { error: "Missing required parameters" },
          { status: 400 },
        );
      }

      // Return mock DICOM tags
      return NextResponse.json(mockDicomTags);
    }

    if (action === "metadata") {
      const studyInstanceUID = searchParams.get("studyInstanceUID");
      const seriesInstanceUID = searchParams.get("seriesInstanceUID");
      const sopInstanceUID = searchParams.get("sopInstanceUID");

      if (!studyInstanceUID || !seriesInstanceUID || !sopInstanceUID) {
        return NextResponse.json(
          { error: "Missing required parameters" },
          { status: 400 },
        );
      }

      // Return mock metadata
      const metadata = {
        studyInstanceUID,
        seriesInstanceUID,
        sopInstanceUID,
        patientName: "Johnson^Sarah",
        patientID: "MRN-12345",
        patientBirthDate: "19850315",
        patientSex: "F",
        studyDate: "20260101",
        studyTime: "103000",
        studyDescription: "CT Chest with Contrast",
        seriesDescription: "Axial Contrast",
        modality: "CT",
        manufacturerModelName: "LightSpeed VCT",
        institutionName: "Memorial Hospital",
        stationName: "CT-SCANNER-01",
        bodyPartExamined: "CHEST",
        rows: 512,
        columns: 512,
        bitsAllocated: 16,
        bitsStored: 16,
        highBit: 15,
        pixelRepresentation: 1,
        photometricInterpretation: "MONOCHROME2",
        samplesPerPixel: 1,
        windowCenter: 40,
        windowWidth: 400,
        rescaleIntercept: -1024,
        rescaleSlope: 1,
        instanceNumber: 1,
        sliceThickness: 5.0,
        pixelSpacing: [0.488281, 0.488281],
        kvp: 120,
      };

      return NextResponse.json(metadata);
    }

    if (action === "wado") {
      const studyInstanceUID = searchParams.get("studyInstanceUID");
      const seriesInstanceUID = searchParams.get("seriesInstanceUID");
      const sopInstanceUID = searchParams.get("sopInstanceUID");

      if (!studyInstanceUID || !seriesInstanceUID || !sopInstanceUID) {
        return NextResponse.json(
          { error: "Missing required parameters" },
          { status: 400 },
        );
      }

      // In production, this would retrieve the actual DICOM image from PACS
      // For now, return a placeholder response
      return NextResponse.json({
        message: "WADO-RS endpoint - would retrieve DICOM image",
        studyInstanceUID,
        seriesInstanceUID,
        sopInstanceUID,
      });
    }

    if (action === "thumbnail") {
      const studyInstanceUID = searchParams.get("studyInstanceUID");
      const seriesInstanceUID = searchParams.get("seriesInstanceUID");
      const sopInstanceUID = searchParams.get("sopInstanceUID");
      const size = searchParams.get("size") || "200";

      if (!studyInstanceUID || !seriesInstanceUID || !sopInstanceUID) {
        return NextResponse.json(
          { error: "Missing required parameters" },
          { status: 400 },
        );
      }

      // In production, this would generate a thumbnail from the DICOM image
      return NextResponse.json({
        message: "Thumbnail endpoint - would generate thumbnail",
        studyInstanceUID,
        seriesInstanceUID,
        sopInstanceUID,
        size,
      });
    }

    return NextResponse.json(
      { error: "Invalid action parameter" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in DICOM GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/imaging/dicom - Store DICOM, test connection, or perform operations
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "test-connection") {
      // Simulate PACS connection test
      const isConnected = pacsConfig.enabled && pacsConfig.host;

      return NextResponse.json({
        success: isConnected,
        message: isConnected
          ? "Successfully connected to PACS"
          : "Failed to connect to PACS",
        config: {
          aeTitle: pacsConfig.aeTitle,
          host: pacsConfig.host,
          port: pacsConfig.port,
          protocol: pacsConfig.protocol,
        },
      });
    }

    if (action === "store") {
      // Handle DICOM store (STOW-RS)
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 },
        );
      }

      // In production, this would store the DICOM file to PACS
      return NextResponse.json({
        success: true,
        message: "DICOM instance stored successfully",
        fileName: file.name,
        size: file.size,
      });
    }

    if (action === "retrieve") {
      const body = await request.json();
      const { studyInstanceUID, seriesInstanceUID, destination } = body;

      // Simulate C-MOVE or WADO-RS retrieve
      return NextResponse.json({
        success: true,
        message: "Retrieve request initiated",
        studyInstanceUID,
        seriesInstanceUID,
        destination: destination || pacsConfig.aeTitle,
      });
    }

    if (action === "find") {
      const body = await request.json();
      const { level, params } = body;

      // Simulate C-FIND or QIDO-RS query
      // Return mock results based on level (STUDY, SERIES, or IMAGE)
      const mockResults = [
        {
          studyInstanceUID: "1.2.840.113619.2.55.3.2831868566.123.1640000001.1",
          patientName: "Johnson^Sarah",
          patientID: "MRN-12345",
          studyDate: "20260101",
          studyDescription: "CT Chest with Contrast",
          accessionNumber: "ACC-2026-001",
          modality: "CT",
        },
      ];

      return NextResponse.json({
        success: true,
        level,
        results: mockResults,
      });
    }

    return NextResponse.json(
      { error: "Invalid action parameter" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in DICOM POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/imaging/dicom - Update PACS configuration
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "config") {
      const body = await request.json();
      pacsConfig = { ...pacsConfig, ...body };

      return NextResponse.json({
        success: true,
        message: "PACS configuration updated",
        config: pacsConfig,
      });
    }

    return NextResponse.json(
      { error: "Invalid action parameter" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in DICOM PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
