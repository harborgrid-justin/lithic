import { NextRequest, NextResponse } from "next/server";
import { Patient, PatientMergeRequest } from "@/types/patient";
import { auditLogger } from "@/lib/audit-logger";

// Mock database
const patientsDb: Patient[] = [];

export async function POST(request: NextRequest) {
  try {
    const mergeRequest: PatientMergeRequest = await request.json();

    const sourceIndex = patientsDb.findIndex(
      (p) => p.id === mergeRequest.sourcePatientId,
    );
    const targetIndex = patientsDb.findIndex(
      (p) => p.id === mergeRequest.targetPatientId,
    );

    if (sourceIndex === -1 || targetIndex === -1) {
      return NextResponse.json(
        { error: "One or both patients not found" },
        { status: 404 },
      );
    }

    const sourcePatient = patientsDb[sourceIndex];
    const targetPatient = patientsDb[targetIndex];

    // Merge logic
    const mergedPatient: Patient = {
      ...targetPatient,
      // Keep target demographics if requested
      ...(mergeRequest.keepTargetDemographics
        ? {}
        : {
            firstName: sourcePatient.firstName,
            lastName: sourcePatient.lastName,
            dateOfBirth: sourcePatient.dateOfBirth,
            gender: sourcePatient.gender,
          }),
      // Merge insurance if requested
      insurance: mergeRequest.mergeInsurance
        ? [
            ...(targetPatient.insurance || []),
            ...(sourcePatient.insurance || []),
          ]
        : targetPatient.insurance,
      // Merge contacts if requested
      emergencyContacts: mergeRequest.mergeContacts
        ? [
            ...(targetPatient.emergencyContacts || []),
            ...(sourcePatient.emergencyContacts || []),
          ]
        : targetPatient.emergencyContacts,
      updatedAt: new Date().toISOString(),
      updatedBy: mergeRequest.performedBy,
    };

    // Update target patient
    patientsDb[targetIndex] = mergedPatient;

    // Mark source patient as inactive (merged)
    patientsDb[sourceIndex] = {
      ...sourcePatient,
      status: "inactive",
      updatedAt: new Date().toISOString(),
      updatedBy: mergeRequest.performedBy,
    };

    // Audit log
    await auditLogger.log({
      resourceType: "patient",
      resourceId: targetPatient.id,
      action: "merge",
      actor: {
        userId: mergeRequest.performedBy,
        username: "current-user",
        role: "admin",
      },
      changes: {
        sourcePatientId: sourcePatient.id,
        targetPatientId: targetPatient.id,
        reason: mergeRequest.reason,
      },
      timestamp: new Date().toISOString(),
      ipAddress: request.ip,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(mergedPatient);
  } catch (error) {
    console.error("Error merging patients:", error);
    return NextResponse.json(
      { error: "Failed to merge patients" },
      { status: 500 },
    );
  }
}
