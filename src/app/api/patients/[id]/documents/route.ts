import { NextRequest, NextResponse } from "next/server";
import { PatientDocument } from "@/types/patient";
import { auditLogger } from "@/lib/audit-logger";

// Mock database
const documentsDb: PatientDocument[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const documents = documentsDb.filter((d) => d.patientId === params.id);

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const metadataStr = formData.get("metadata") as string;
    const metadata = JSON.parse(metadataStr || "{}");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // In production, upload file to cloud storage (S3, Azure Blob, etc.)
    const fileUrl = "/uploads/" + file.name; // Mock URL

    const document: PatientDocument = {
      id: crypto.randomUUID?.() || Math.random().toString(36),
      patientId: params.id,
      type: metadata.type || "other",
      name: metadata.name || file.name,
      description: metadata.description,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      url: fileUrl,
      uploadedBy: "current-user-id",
      uploadedAt: new Date().toISOString(),
      tags: metadata.tags || [],
    };

    documentsDb.push(document);

    // Audit log
    await auditLogger.log({
      resourceType: "document",
      resourceId: document.id,
      action: "create",
      actor: {
        userId: "current-user-id",
        username: "current-user",
        role: "clinician",
      },
      metadata: {
        patientId: params.id,
        documentType: document.type,
        fileName: document.fileName,
      },
      timestamp: new Date().toISOString(),
      ipAddress: request.ip,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 },
    );
  }
}
