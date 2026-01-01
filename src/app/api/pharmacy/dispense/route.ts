/**
 * Dispensing API Route
 * Handle prescription dispensing and queue management
 */

import { NextRequest, NextResponse } from "next/server";

// Mock databases
const dispensingQueue: any[] = [];
let queueIdCounter = 1000;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedTo = searchParams.get("assignedTo");

    let filtered = [...dispensingQueue];

    if (status) {
      filtered = filtered.filter((item) => item.status === status);
    }

    if (priority) {
      filtered = filtered.filter((item) => item.priority === priority);
    }

    if (assignedTo) {
      filtered = filtered.filter((item) => item.assignedTo === assignedTo);
    }

    // Sort by priority (STAT > Urgent > Priority > Routine) and queue position
    const priorityOrder = { stat: 0, urgent: 1, priority: 2, routine: 3 };
    filtered.sort((a, b) => {
      const priorityDiff =
        priorityOrder[a.priority as keyof typeof priorityOrder] -
        priorityOrder[b.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      return a.queuePosition - b.queuePosition;
    });

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching dispensing queue:", error);
    return NextResponse.json(
      { error: "Failed to fetch dispensing queue" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (data.prescriptionId) {
      // Add to dispensing queue
      const queuePosition = dispensingQueue.length + 1;
      const estimatedReadyTime = new Date();
      estimatedReadyTime.setMinutes(estimatedReadyTime.getMinutes() + 30); // 30 min default

      const queueItem = {
        id: `queue_${queueIdCounter++}`,
        prescriptionId: data.prescriptionId,
        prescription: data.prescription || null,
        priority: data.priority || "routine",
        queuePosition,
        estimatedReadyTime: estimatedReadyTime.toISOString(),
        status: "queued",
        enteredQueue: new Date().toISOString(),
        workflowSteps: [
          {
            step: "Enter prescription",
            status: "completed",
            completedAt: new Date().toISOString(),
          },
          { step: "Fill prescription", status: "pending" },
          { step: "Pharmacist verification", status: "pending" },
          { step: "Patient pickup", status: "pending" },
        ],
      };

      dispensingQueue.push(queueItem);
      return NextResponse.json(queueItem, { status: 201 });
    } else {
      // Dispense prescription
      const {
        prescriptionId,
        queueItemId,
        dispensedQuantity,
        lotNumber,
        ndc,
        dispensedBy,
        verifiedBy,
        patientCounseled,
        notes,
      } = data;

      // Update queue item status
      const queueItem = dispensingQueue.find((item) => item.id === queueItemId);
      if (queueItem) {
        queueItem.status = "picked-up";
        queueItem.workflowSteps.forEach((step: any) => {
          if (step.status === "pending") {
            step.status = "completed";
            step.completedAt = new Date().toISOString();
          }
        });
      }

      // In production, update prescription record with dispensing info
      const dispensedPrescription = {
        id: prescriptionId,
        dispensedDate: new Date().toISOString(),
        dispensedQuantity,
        lotNumber,
        dispensedBy,
        verifiedBy,
        status: "dispensed",
        notes,
      };

      return NextResponse.json(dispensedPrescription);
    }
  } catch (error) {
    console.error("Error processing dispensing request:", error);
    return NextResponse.json(
      { error: "Failed to process dispensing request" },
      { status: 500 },
    );
  }
}
