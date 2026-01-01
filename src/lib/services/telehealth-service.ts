/**
 * Telehealth Service
 * Business logic for telehealth sessions, waiting room, and recording management
 */

import {
  TelehealthSession,
  SessionStatus,
  WaitingRoomEntry,
  WaitingRoomStatus,
  VideoParticipant,
  ParticipantType,
  ParticipantRole,
  ConnectionStatus,
  SessionRecording,
  RecordingStatus,
  CreateSessionDto,
  UpdateSessionDto,
  JoinWaitingRoomDto,
  StartRecordingDto,
  SessionSummary,
} from "@/types/telehealth";

// Mock data store - replace with actual database in production
let sessions: TelehealthSession[] = [];
let waitingRoomEntries: WaitingRoomEntry[] = [];
let participants: VideoParticipant[] = [];
let recordings: SessionRecording[] = [];

export class TelehealthService {
  // ============================================================================
  // Session Management
  // ============================================================================

  static async createSession(
    dto: CreateSessionDto,
  ): Promise<TelehealthSession> {
    const roomId = this.generateRoomId();
    const waitingRoomId = this.generateWaitingRoomId();

    const session: TelehealthSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId: "org_default",
      patientId: dto.patientId,
      patientName: "Patient Name",
      providerId: dto.providerId,
      providerName: "Provider Name",
      appointmentId: dto.appointmentId || null,
      encounterId: null,
      type: dto.type,
      status: SessionStatus.SCHEDULED,
      scheduledStartTime: dto.scheduledStartTime,
      scheduledEndTime: dto.scheduledEndTime,
      actualStartTime: null,
      actualEndTime: null,
      roomId,
      roomUrl: `/telehealth/room/${roomId}`,
      waitingRoomId,
      participants: [],
      recordingEnabled: dto.recordingEnabled || false,
      recordings: [],
      consentObtained: false,
      consentObtainedAt: null,
      consentSignature: null,
      chiefComplaint: null,
      notes: dto.notes || null,
      clinicalNoteId: null,
      prescriptionsIssued: [],
      labOrdersCreated: [],
      imagingOrdersCreated: [],
      followUpRequired: false,
      followUpInstructions: null,
      technicalIssues: [],
      qualityMetrics: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: dto.providerId,
      updatedBy: dto.providerId,
    };

    sessions.push(session);
    return session;
  }

  static async getSession(
    sessionId: string,
  ): Promise<TelehealthSession | null> {
    return sessions.find((s) => s.id === sessionId) || null;
  }

  static async getSessionByRoomId(
    roomId: string,
  ): Promise<TelehealthSession | null> {
    return sessions.find((s) => s.roomId === roomId) || null;
  }

  static async updateSession(
    dto: UpdateSessionDto,
  ): Promise<TelehealthSession> {
    const index = sessions.findIndex((s) => s.id === dto.id);
    if (index === -1) {
      throw new Error("Session not found");
    }

    sessions[index] = {
      ...sessions[index],
      ...dto,
      updatedAt: new Date(),
    };

    return sessions[index];
  }

  static async startSession(sessionId: string): Promise<TelehealthSession> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    session.status = SessionStatus.IN_PROGRESS;
    session.actualStartTime = new Date();
    session.updatedAt = new Date();

    return session;
  }

  static async endSession(
    sessionId: string,
    notes?: string,
  ): Promise<TelehealthSession> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    session.status = SessionStatus.COMPLETED;
    session.actualEndTime = new Date();
    if (notes) {
      session.notes = notes;
    }
    session.updatedAt = new Date();

    // End all active recordings
    const sessionRecordings = recordings.filter(
      (r) =>
        r.sessionId === sessionId && r.status === RecordingStatus.RECORDING,
    );
    for (const recording of sessionRecordings) {
      await this.stopRecording(recording.id);
    }

    return session;
  }

  static async getSessionsByProvider(
    providerId: string,
  ): Promise<TelehealthSession[]> {
    return sessions.filter((s) => s.providerId === providerId && !s.deletedAt);
  }

  static async getSessionsByPatient(
    patientId: string,
  ): Promise<TelehealthSession[]> {
    return sessions.filter((s) => s.patientId === patientId && !s.deletedAt);
  }

  static async getUpcomingSessions(
    userId: string,
    userType: "provider" | "patient",
  ): Promise<SessionSummary[]> {
    const now = new Date();
    const filtered = sessions.filter((s) => {
      if (userType === "provider") {
        return (
          s.providerId === userId &&
          s.scheduledStartTime > now &&
          s.status === SessionStatus.SCHEDULED
        );
      } else {
        return (
          s.patientId === userId &&
          s.scheduledStartTime > now &&
          s.status === SessionStatus.SCHEDULED
        );
      }
    });

    return filtered.map((s) => this.toSessionSummary(s));
  }

  static async getActiveSession(
    userId: string,
    userType: "provider" | "patient",
  ): Promise<TelehealthSession | null> {
    return (
      sessions.find((s) => {
        if (userType === "provider") {
          return (
            s.providerId === userId && s.status === SessionStatus.IN_PROGRESS
          );
        } else {
          return (
            s.patientId === userId && s.status === SessionStatus.IN_PROGRESS
          );
        }
      }) || null
    );
  }

  // ============================================================================
  // Participant Management
  // ============================================================================

  static async addParticipant(
    sessionId: string,
    userId: string,
    userName: string,
    userType: ParticipantType,
    role: ParticipantRole,
    deviceInfo: any,
  ): Promise<VideoParticipant> {
    const participant: VideoParticipant = {
      id: `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId: "org_default",
      sessionId,
      userId,
      userName,
      userType,
      role,
      joinedAt: new Date(),
      leftAt: null,
      connectionStatus: ConnectionStatus.CONNECTING,
      audioEnabled: true,
      videoEnabled: true,
      screenSharing: false,
      deviceInfo,
      connectionQuality: "GOOD",
      peerId: null,
      streamId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: userId,
      updatedBy: userId,
    };

    participants.push(participant);

    // Update session participants
    const session = await this.getSession(sessionId);
    if (session) {
      session.participants.push(participant);
    }

    return participant;
  }

  static async removeParticipant(participantId: string): Promise<void> {
    const index = participants.findIndex((p) => p.id === participantId);
    if (index !== -1) {
      participants[index].leftAt = new Date();
      participants[index].connectionStatus = ConnectionStatus.DISCONNECTED;
    }
  }

  static async updateParticipantStatus(
    participantId: string,
    updates: Partial<VideoParticipant>,
  ): Promise<VideoParticipant> {
    const index = participants.findIndex((p) => p.id === participantId);
    if (index === -1) {
      throw new Error("Participant not found");
    }

    participants[index] = {
      ...participants[index],
      ...updates,
      updatedAt: new Date(),
    };

    return participants[index];
  }

  static async getSessionParticipants(
    sessionId: string,
  ): Promise<VideoParticipant[]> {
    return participants.filter((p) => p.sessionId === sessionId && !p.leftAt);
  }

  // ============================================================================
  // Waiting Room Management
  // ============================================================================

  static async joinWaitingRoom(
    dto: JoinWaitingRoomDto,
  ): Promise<WaitingRoomEntry> {
    const session = await this.getSession(dto.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const entry: WaitingRoomEntry = {
      id: `waiting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId: "org_default",
      sessionId: dto.sessionId,
      patientId: dto.patientId,
      patientName: "Patient Name",
      appointmentTime: session.scheduledStartTime,
      checkedInAt: new Date(),
      position:
        waitingRoomEntries.filter((e) => e.status === WaitingRoomStatus.WAITING)
          .length + 1,
      estimatedWaitTime: 5,
      status: WaitingRoomStatus.WAITING,
      preVisitCompleted: !!dto.preVisitData,
      preVisitData: dto.preVisitData || null,
      technicalCheckCompleted: !!dto.technicalCheckResults,
      technicalCheckResults: dto.technicalCheckResults || null,
      notifiedProvider: false,
      notifiedAt: null,
      admittedAt: null,
      admittedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: dto.patientId,
      updatedBy: dto.patientId,
    };

    waitingRoomEntries.push(entry);

    // Update session status
    session.status = SessionStatus.WAITING;

    return entry;
  }

  static async getWaitingRoomEntry(
    entryId: string,
  ): Promise<WaitingRoomEntry | null> {
    return waitingRoomEntries.find((e) => e.id === entryId) || null;
  }

  static async getWaitingRoomBySession(
    sessionId: string,
  ): Promise<WaitingRoomEntry | null> {
    return (
      waitingRoomEntries.find(
        (e) =>
          e.sessionId === sessionId && e.status === WaitingRoomStatus.WAITING,
      ) || null
    );
  }

  static async getProviderWaitingRoom(
    providerId: string,
  ): Promise<WaitingRoomEntry[]> {
    const providerSessions = await this.getSessionsByProvider(providerId);
    const sessionIds = providerSessions.map((s) => s.id);

    return waitingRoomEntries
      .filter(
        (e) =>
          sessionIds.includes(e.sessionId) &&
          e.status === WaitingRoomStatus.WAITING,
      )
      .sort((a, b) => a.position - b.position);
  }

  static async admitFromWaitingRoom(
    entryId: string,
    admittedBy: string,
  ): Promise<WaitingRoomEntry> {
    const index = waitingRoomEntries.findIndex((e) => e.id === entryId);
    if (index === -1) {
      throw new Error("Waiting room entry not found");
    }

    waitingRoomEntries[index] = {
      ...waitingRoomEntries[index],
      status: WaitingRoomStatus.ADMITTED,
      admittedAt: new Date(),
      admittedBy,
      updatedAt: new Date(),
    };

    // Start the session
    await this.startSession(waitingRoomEntries[index].sessionId);

    return waitingRoomEntries[index];
  }

  static async notifyProvider(entryId: string): Promise<WaitingRoomEntry> {
    const index = waitingRoomEntries.findIndex((e) => e.id === entryId);
    if (index === -1) {
      throw new Error("Waiting room entry not found");
    }

    waitingRoomEntries[index] = {
      ...waitingRoomEntries[index],
      status: WaitingRoomStatus.PROVIDER_NOTIFIED,
      notifiedProvider: true,
      notifiedAt: new Date(),
      updatedAt: new Date(),
    };

    return waitingRoomEntries[index];
  }

  // ============================================================================
  // Recording Management
  // ============================================================================

  static async startRecording(
    dto: StartRecordingDto,
  ): Promise<SessionRecording> {
    const session = await this.getSession(dto.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (!session.consentObtained) {
      throw new Error("Recording consent not obtained");
    }

    const recording: SessionRecording = {
      id: `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId: "org_default",
      sessionId: dto.sessionId,
      fileName: `session_${dto.sessionId}_${Date.now()}.webm`,
      fileUrl: "",
      fileSize: 0,
      duration: 0,
      format: "WEBM",
      quality: dto.quality,
      status: RecordingStatus.RECORDING,
      startedAt: new Date(),
      endedAt: null,
      startedBy: dto.userId,
      stoppedBy: null,
      consentDocumentId: dto.consentDocumentId,
      encryptionKey: this.generateEncryptionKey(),
      retentionUntil: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
      viewCount: 0,
      lastViewedAt: null,
      transcription: null,
      transcriptionStatus: "NOT_REQUESTED",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: dto.userId,
      updatedBy: dto.userId,
    };

    recordings.push(recording);
    session.recordings.push(recording);

    return recording;
  }

  static async stopRecording(recordingId: string): Promise<SessionRecording> {
    const index = recordings.findIndex((r) => r.id === recordingId);
    if (index === -1) {
      throw new Error("Recording not found");
    }

    const startTime = recordings[index].startedAt.getTime();
    const duration = Math.floor((Date.now() - startTime) / 1000);

    recordings[index] = {
      ...recordings[index],
      status: RecordingStatus.PROCESSING,
      endedAt: new Date(),
      duration,
      updatedAt: new Date(),
    };

    // Simulate processing completion
    setTimeout(() => {
      recordings[index].status = RecordingStatus.READY;
      recordings[index].fileSize = Math.floor(duration * 100000); // Estimate file size
    }, 3000);

    return recordings[index];
  }

  static async getSessionRecordings(
    sessionId: string,
  ): Promise<SessionRecording[]> {
    return recordings.filter((r) => r.sessionId === sessionId);
  }

  static async obtainRecordingConsent(
    sessionId: string,
    signature: string,
    ipAddress: string,
  ): Promise<TelehealthSession> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    session.consentObtained = true;
    session.consentObtainedAt = new Date();
    session.consentSignature = signature;
    session.updatedAt = new Date();

    return session;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private static generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateWaitingRoomId(): string {
    return `wr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateEncryptionKey(): string {
    return Buffer.from(Math.random().toString(36).substr(2, 32)).toString(
      "base64",
    );
  }

  private static toSessionSummary(session: TelehealthSession): SessionSummary {
    const duration =
      session.actualStartTime && session.actualEndTime
        ? Math.floor(
            (session.actualEndTime.getTime() -
              session.actualStartTime.getTime()) /
              1000 /
              60,
          )
        : null;

    return {
      id: session.id,
      patientName: session.patientName,
      providerName: session.providerName,
      type: session.type,
      status: session.status,
      scheduledStartTime: session.scheduledStartTime,
      duration,
      recordingAvailable: session.recordings.some(
        (r) => r.status === RecordingStatus.READY,
      ),
      clinicalNoteCompleted: !!session.clinicalNoteId,
    };
  }

  // ============================================================================
  // Mock Data Seeding
  // ============================================================================

  static seedMockData(): void {
    // This can be used to populate test data
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    this.createSession({
      patientId: "patient_001",
      providerId: "provider_001",
      type: "FOLLOW_UP",
      scheduledStartTime: tomorrow,
      scheduledEndTime: new Date(tomorrow.getTime() + 30 * 60 * 1000),
      recordingEnabled: true,
    });
  }
}
