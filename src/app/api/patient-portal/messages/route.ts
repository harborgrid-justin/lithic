/**
 * Patient Portal Messages API
 * GET /api/patient-portal/messages - Get message threads
 * POST /api/patient-portal/messages - Send a new message
 */

import { NextRequest, NextResponse } from "next/server";
import type { MessageThread, Message } from "@/types/patient-portal";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 },
      );
    }

    // Mock data - Replace with actual database queries
    const mockThreads: MessageThread[] = [
      {
        id: "thread-1",
        subject: "Lab Results Question",
        participants: [
          {
            id: "patient-1",
            name: "John Doe",
            type: "PATIENT",
          },
          {
            id: "provider-1",
            name: "Dr. Sarah Johnson",
            type: "PROVIDER",
            role: "Primary Care Physician",
          },
        ],
        messages: [
          {
            id: "msg-1",
            threadId: "thread-1",
            subject: "Lab Results Question",
            body: "I noticed my cholesterol levels were flagged. What does this mean?",
            senderId: "patient-1",
            senderName: "John Doe",
            senderType: "PATIENT",
            recipientId: "provider-1",
            recipientName: "Dr. Sarah Johnson",
            recipientType: "PROVIDER",
            category: "TEST_RESULTS",
            priority: "NORMAL",
            status: "READ",
            readAt: new Date("2025-12-20T10:30:00"),
            repliedAt: new Date("2025-12-20T14:15:00"),
            attachments: [],
            metadata: {},
            organizationId: "org-1",
            createdAt: new Date("2025-12-20T09:00:00"),
            updatedAt: new Date("2025-12-20T09:00:00"),
            deletedAt: null,
            createdBy: "patient-1",
            updatedBy: "patient-1",
          },
          {
            id: "msg-2",
            threadId: "thread-1",
            subject: "Re: Lab Results Question",
            body: "Your LDL cholesterol is slightly elevated at 145 mg/dL. I recommend dietary changes and we'll recheck in 3 months. Let's discuss this at your next appointment.",
            senderId: "provider-1",
            senderName: "Dr. Sarah Johnson",
            senderType: "PROVIDER",
            recipientId: "patient-1",
            recipientName: "John Doe",
            recipientType: "PATIENT",
            category: "TEST_RESULTS",
            priority: "NORMAL",
            status: "READ",
            readAt: new Date("2025-12-20T15:00:00"),
            repliedAt: null,
            attachments: [],
            metadata: {},
            organizationId: "org-1",
            createdAt: new Date("2025-12-20T14:15:00"),
            updatedAt: new Date("2025-12-20T14:15:00"),
            deletedAt: null,
            createdBy: "provider-1",
            updatedBy: "provider-1",
          },
        ],
        category: "TEST_RESULTS",
        priority: "NORMAL",
        status: "ACTIVE",
        lastMessageAt: new Date("2025-12-20T14:15:00"),
        unreadCount: 0,
      },
      {
        id: "thread-2",
        subject: "Prescription Refill Request - Metformin",
        participants: [
          {
            id: "patient-1",
            name: "John Doe",
            type: "PATIENT",
          },
          {
            id: "provider-2",
            name: "Dr. Michael Chen",
            type: "PROVIDER",
            role: "Endocrinologist",
          },
        ],
        messages: [
          {
            id: "msg-3",
            threadId: "thread-2",
            subject: "Prescription Refill Request - Metformin",
            body: "I need a refill on my Metformin 500mg prescription. I have about a week's supply left.",
            senderId: "patient-1",
            senderName: "John Doe",
            senderType: "PATIENT",
            recipientId: "provider-2",
            recipientName: "Dr. Michael Chen",
            recipientType: "PROVIDER",
            category: "PRESCRIPTION_REFILL",
            priority: "NORMAL",
            status: "DELIVERED",
            readAt: null,
            repliedAt: null,
            attachments: [],
            metadata: {},
            organizationId: "org-1",
            createdAt: new Date("2026-01-01T08:30:00"),
            updatedAt: new Date("2026-01-01T08:30:00"),
            deletedAt: null,
            createdBy: "patient-1",
            updatedBy: "patient-1",
          },
        ],
        category: "PRESCRIPTION_REFILL",
        priority: "NORMAL",
        status: "ACTIVE",
        lastMessageAt: new Date("2026-01-01T08:30:00"),
        unreadCount: 0,
      },
      {
        id: "thread-3",
        subject: "Appointment Scheduling - Annual Physical",
        participants: [
          {
            id: "patient-1",
            name: "John Doe",
            type: "PATIENT",
          },
          {
            id: "care-team-1",
            name: "Care Coordinator",
            type: "CARE_TEAM",
          },
        ],
        messages: [
          {
            id: "msg-4",
            threadId: "thread-3",
            subject: "Appointment Scheduling - Annual Physical",
            body: "I'd like to schedule my annual physical exam. Do you have any availability in the next 2 weeks?",
            senderId: "patient-1",
            senderName: "John Doe",
            senderType: "PATIENT",
            recipientId: "care-team-1",
            recipientName: "Care Coordinator",
            recipientType: "CARE_TEAM",
            category: "APPOINTMENT_REQUEST",
            priority: "NORMAL",
            status: "READ",
            readAt: new Date("2025-12-28T11:00:00"),
            repliedAt: new Date("2025-12-28T13:30:00"),
            attachments: [],
            metadata: {},
            organizationId: "org-1",
            createdAt: new Date("2025-12-28T10:00:00"),
            updatedAt: new Date("2025-12-28T10:00:00"),
            deletedAt: null,
            createdBy: "patient-1",
            updatedBy: "patient-1",
          },
          {
            id: "msg-5",
            threadId: "thread-3",
            subject: "Re: Appointment Scheduling - Annual Physical",
            body: "We have availability on January 15th at 10:30 AM or January 18th at 2:00 PM. Which works better for you?",
            senderId: "care-team-1",
            senderName: "Care Coordinator",
            senderType: "CARE_TEAM",
            recipientId: "patient-1",
            recipientName: "John Doe",
            recipientType: "PATIENT",
            category: "APPOINTMENT_REQUEST",
            priority: "NORMAL",
            status: "SENT",
            readAt: null,
            repliedAt: null,
            attachments: [],
            metadata: {},
            organizationId: "org-1",
            createdAt: new Date("2025-12-28T13:30:00"),
            updatedAt: new Date("2025-12-28T13:30:00"),
            deletedAt: null,
            createdBy: "care-team-1",
            updatedBy: "care-team-1",
          },
        ],
        category: "APPOINTMENT_REQUEST",
        priority: "NORMAL",
        status: "ACTIVE",
        lastMessageAt: new Date("2025-12-28T13:30:00"),
        unreadCount: 1,
      },
    ];

    // Filter by status if provided
    const filteredThreads = status
      ? mockThreads.filter((thread) => thread.status === status)
      : mockThreads;

    return NextResponse.json({
      success: true,
      data: filteredThreads,
      meta: {
        total: filteredThreads.length,
        unreadCount: filteredThreads.reduce(
          (sum, thread) => sum + thread.unreadCount,
          0,
        ),
      },
    });
  } catch (error) {
    console.error("Messages API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, subject, messageBody, recipientId, category } = body;

    if (!patientId || !subject || !messageBody || !recipientId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Mock response - Replace with actual database insert
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      threadId: `thread-${Date.now()}`,
      subject,
      body: messageBody,
      senderId: patientId,
      senderName: "John Doe",
      senderType: "PATIENT",
      recipientId,
      recipientName: "Provider",
      recipientType: "PROVIDER",
      category: category || "GENERAL_QUESTION",
      priority: "NORMAL",
      status: "SENT",
      readAt: null,
      repliedAt: null,
      attachments: [],
      metadata: {},
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: patientId,
      updatedBy: patientId,
    };

    return NextResponse.json({
      success: true,
      data: newMessage,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Send Message API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
