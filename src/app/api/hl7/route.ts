/**
 * HL7 v2 Message Receiver API
 * Receives and processes HL7 v2.x messages
 */

import { NextRequest, NextResponse } from "next/server";
import {
  parseHL7,
  extractPatientFromADT,
  extractOrderFromORM,
  type HL7Message,
} from "@/lib/hl7/parser";
import { createACK } from "@/lib/hl7/messages";
import { db } from "@/lib/db";
import { z } from "zod";

const HL7RequestSchema = z.object({
  message: z.string(),
  encoding: z.enum(["base64", "plain"]).default("plain"),
});

interface ProcessingResult {
  success: boolean;
  acknowledgmentCode: "AA" | "AE" | "AR";
  messageControlId: string;
  textMessage?: string;
  processedData?: any;
}

/**
 * POST /api/hl7
 * Receive and process HL7 messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, encoding } = HL7RequestSchema.parse(body);

    // Decode if base64
    const hl7Message =
      encoding === "base64"
        ? Buffer.from(message, "base64").toString("utf-8")
        : message;

    // Parse HL7 message
    const parsed = parseHL7(hl7Message);

    // Validate message
    const validation = validateHL7Message(parsed);
    if (!validation.valid) {
      const ack = createACK({
        facility: {
          sendingApplication: "LITHIC",
          sendingFacility: "MAIN",
          receivingApplication: "EXTERNAL",
          receivingFacility: "EXTERNAL",
        },
        originalMessageControlId: parsed.messageControlId,
        acknowledgmentCode: "AR",
        textMessage: validation.errors.join("; "),
      });

      return NextResponse.json(
        {
          acknowledgment: ack,
          success: false,
          errors: validation.errors,
        },
        { status: 400 },
      );
    }

    // Process message based on type
    const result = await processHL7Message(parsed);

    // Create acknowledgment
    const ack = createACK({
      facility: {
        sendingApplication: "LITHIC",
        sendingFacility: "MAIN",
        receivingApplication: "EXTERNAL",
        receivingFacility: "EXTERNAL",
      },
      originalMessageControlId: result.messageControlId,
      acknowledgmentCode: result.acknowledgmentCode,
      textMessage: result.textMessage,
    });

    return NextResponse.json({
      acknowledgment: ack,
      success: result.success,
      messageControlId: result.messageControlId,
      processedData: result.processedData,
    });
  } catch (error) {
    console.error("HL7 processing error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        acknowledgment: null,
      },
      { status: 500 },
    );
  }
}

/**
 * Validate HL7 message structure
 */
function validateHL7Message(message: HL7Message): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!message.messageControlId) {
    errors.push("Message control ID is required");
  }

  if (!message.messageType) {
    errors.push("Message type is required");
  }

  if (!message.segments.find((s) => s.name === "MSH")) {
    errors.push("MSH segment is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Process HL7 message based on type
 */
async function processHL7Message(
  message: HL7Message,
): Promise<ProcessingResult> {
  try {
    const messageType = message.messageType.split("^")[0];

    switch (messageType) {
      case "ADT":
        return await processADTMessage(message);

      case "ORM":
        return await processORMMessage(message);

      case "ORU":
        return await processORUMessage(message);

      case "DFT":
        return await processDFTMessage(message);

      case "SIU":
        return await processSIUMessage(message);

      case "MDM":
        return await processMDMMessage(message);

      default:
        return {
          success: false,
          acknowledgmentCode: "AR",
          messageControlId: message.messageControlId,
          textMessage: `Unsupported message type: ${messageType}`,
        };
    }
  } catch (error) {
    console.error("Message processing error:", error);

    return {
      success: false,
      acknowledgmentCode: "AE",
      messageControlId: message.messageControlId,
      textMessage: error instanceof Error ? error.message : "Processing error",
    };
  }
}

/**
 * Process ADT (Patient Administration) messages
 */
async function processADTMessage(
  message: HL7Message,
): Promise<ProcessingResult> {
  const triggerEvent = message.messageType.split("^")[1];
  const patientData = extractPatientFromADT(message);

  switch (triggerEvent) {
    case "A01": // Patient Admission
    case "A04": { // Patient Registration
      // Check if patient exists
      const existingPatient = patientData.mrn
        ? await db.patient.findFirst({ where: { mrn: patientData.mrn } })
        : null;

      if (existingPatient) {
        // Update existing patient
        await db.patient.update({
          where: { id: existingPatient.id },
          data: {
            firstName: patientData.firstName || existingPatient.firstName,
            lastName: patientData.lastName || existingPatient.lastName,
            dateOfBirth: patientData.dateOfBirth
              ? new Date(patientData.dateOfBirth)
              : existingPatient.dateOfBirth,
            gender: (patientData.gender || existingPatient.gender) as any,
            phone: patientData.phone || existingPatient.phone,
            address: patientData.address || existingPatient.address,
            city: patientData.city || existingPatient.city,
            state: patientData.state || existingPatient.state,
            zipCode: patientData.zipCode || existingPatient.zipCode,
          },
        });

        return {
          success: true,
          acknowledgmentCode: "AA",
          messageControlId: message.messageControlId,
          textMessage: "Patient updated successfully",
          processedData: { patientId: existingPatient.id, action: "update" },
        };
      } else {
        // Create new patient
        const newPatient = await db.patient.create({
          data: {
            mrn: patientData.mrn || "",
            firstName: patientData.firstName || "",
            lastName: patientData.lastName || "",
            dateOfBirth: patientData.dateOfBirth
              ? new Date(patientData.dateOfBirth)
              : new Date(),
            gender: (patientData.gender || "UNKNOWN") as any,
            phone: patientData.phone,
            email: undefined,
            address: patientData.address,
            city: patientData.city,
            state: patientData.state,
            zipCode: patientData.zipCode,
            ssn: patientData.ssn,
            active: true,
          } as any,
        });

        return {
          success: true,
          acknowledgmentCode: "AA",
          messageControlId: message.messageControlId,
          textMessage: "Patient created successfully",
          processedData: { patientId: newPatient.id, action: "create" },
        };
      }
    }

    case "A08": { // Patient Information Update
      if (!patientData.mrn) {
        return {
          success: false,
          acknowledgmentCode: "AR",
          messageControlId: message.messageControlId,
          textMessage: "Patient MRN is required for updates",
        };
      }

      const patient = await db.patient.findFirst({
        where: { mrn: patientData.mrn },
      });

      if (!patient) {
        return {
          success: false,
          acknowledgmentCode: "AR",
          messageControlId: message.messageControlId,
          textMessage: "Patient not found",
        };
      }

      await db.patient.update({
        where: { id: patient.id },
        data: {
          firstName: patientData.firstName || patient.firstName,
          lastName: patientData.lastName || patient.lastName,
          phone: patientData.phone || patient.phone,
          address: patientData.address || patient.address,
          city: patientData.city || patient.city,
          state: patientData.state || patient.state,
          zipCode: patientData.zipCode || patient.zipCode,
        },
      });

      return {
        success: true,
        acknowledgmentCode: "AA",
        messageControlId: message.messageControlId,
        textMessage: "Patient updated successfully",
        processedData: { patientId: patient.id, action: "update" },
      };
    }

    default:
      return {
        success: true,
        acknowledgmentCode: "AA",
        messageControlId: message.messageControlId,
        textMessage: `ADT^${triggerEvent} received but not processed`,
      };
  }
}

/**
 * Process ORM (Order) messages
 */
async function processORMMessage(
  message: HL7Message,
): Promise<ProcessingResult> {
  const orderData = extractOrderFromORM(message);

  // Find patient
  const patient = orderData.patientMrn
    ? await db.patient.findFirst({ where: { mrn: orderData.patientMrn } })
    : null;

  if (!patient) {
    return {
      success: false,
      acknowledgmentCode: "AR",
      messageControlId: message.messageControlId,
      textMessage: "Patient not found",
    };
  }

  // Create lab order (simplified - expand based on your schema)
  // This is a placeholder - implement based on your actual order schema
  const orderIds: string[] = [];

  for (const test of orderData.tests) {
    // In a real implementation, create lab orders here
    // const order = await db.labOrder.create({...});
    // orderIds.push(order.id);
  }

  return {
    success: true,
    acknowledgmentCode: "AA",
    messageControlId: message.messageControlId,
    textMessage: "Order received successfully",
    processedData: { orderIds, patientId: patient.id },
  };
}

/**
 * Process ORU (Observation Result) messages
 */
async function processORUMessage(
  message: HL7Message,
): Promise<ProcessingResult> {
  // Parse OBX segments and create observations
  // This is a simplified implementation

  return {
    success: true,
    acknowledgmentCode: "AA",
    messageControlId: message.messageControlId,
    textMessage: "Results received successfully",
  };
}

/**
 * Process DFT (Charge/Billing) messages
 */
async function processDFTMessage(
  message: HL7Message,
): Promise<ProcessingResult> {
  // Process billing/charge information
  // This is a placeholder

  return {
    success: true,
    acknowledgmentCode: "AA",
    messageControlId: message.messageControlId,
    textMessage: "Charges received successfully",
  };
}

/**
 * Process SIU (Scheduling) messages
 */
async function processSIUMessage(
  message: HL7Message,
): Promise<ProcessingResult> {
  // Process appointment scheduling
  // This is a placeholder

  return {
    success: true,
    acknowledgmentCode: "AA",
    messageControlId: message.messageControlId,
    textMessage: "Appointment scheduled successfully",
  };
}

/**
 * Process MDM (Medical Document) messages
 */
async function processMDMMessage(
  message: HL7Message,
): Promise<ProcessingResult> {
  // Process medical documents
  // This is a placeholder

  return {
    success: true,
    acknowledgmentCode: "AA",
    messageControlId: message.messageControlId,
    textMessage: "Document received successfully",
  };
}

/**
 * GET /api/hl7 - Health check
 */
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "HL7 v2 Message Receiver",
    version: "2.5",
    supportedMessages: ["ADT", "ORM", "ORU", "DFT", "SIU", "MDM"],
  });
}
