/**
 * Video Conference Room Manager
 * Handles video room creation, management, and participant tracking
 */

import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const RoomSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(["CONSULTATION", "TEAM_MEETING", "CLINICAL_REVIEW", "EDUCATION"]),
  status: z.enum(["SCHEDULED", "ACTIVE", "ENDED", "CANCELLED"]),
  maxParticipants: z.number().default(50),
  isRecording: z.boolean().default(false),
  recordingConsent: z.array(z.string()).default([]),
  startTime: z.date(),
  endTime: z.date().optional(),
  hostId: z.string(),
  participantIds: z.array(z.string()).default([]),
  settings: z.object({
    allowScreenShare: z.boolean().default(true),
    allowChat: z.boolean().default(true),
    allowFileShare: z.boolean().default(true),
    requireApproval: z.boolean().default(false),
    lobbyEnabled: z.boolean().default(false),
    muteOnJoin: z.boolean().default(false),
    e2eEncryption: z.boolean().default(false),
    waitingRoomEnabled: z.boolean().default(false),
  }),
  metadata: z.record(z.any()).optional(),
});

export type Room = z.infer<typeof RoomSchema>;

export interface Participant {
  id: string;
  userId: string;
  userName: string;
  role: "HOST" | "CO_HOST" | "PRESENTER" | "PARTICIPANT" | "OBSERVER";
  joinedAt: Date;
  leftAt?: Date;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  permissions: {
    canShare: boolean;
    canRecord: boolean;
    canMute: boolean;
    canRemove: boolean;
  };
  connectionQuality: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "UNKNOWN";
  deviceInfo?: {
    browser: string;
    os: string;
    deviceType: "desktop" | "mobile" | "tablet";
  };
}

export interface RoomStats {
  roomId: string;
  currentParticipants: number;
  totalParticipants: number;
  duration: number;
  recordingDuration: number;
  bandwidth: {
    upload: number;
    download: number;
  };
  quality: {
    averageLatency: number;
    packetLoss: number;
    jitter: number;
  };
}

export class VideoRoomManager {
  private rooms: Map<string, Room> = new Map();
  private participants: Map<string, Map<string, Participant>> = new Map();
  private roomStats: Map<string, RoomStats> = new Map();

  /**
   * Create a new video room
   */
  async createRoom(
    data: Omit<Room, "id" | "status" | "participantIds" | "recordingConsent">
  ): Promise<Room> {
    const roomId = this.generateRoomId();

    const room: Room = {
      id: roomId,
      ...data,
      status: "SCHEDULED",
      participantIds: [],
      recordingConsent: [],
      settings: {
        allowScreenShare: true,
        allowChat: true,
        allowFileShare: true,
        requireApproval: false,
        lobbyEnabled: false,
        muteOnJoin: false,
        e2eEncryption: false,
        waitingRoomEnabled: false,
        ...data.settings,
      },
    };

    this.rooms.set(roomId, room);
    this.participants.set(roomId, new Map());

    // Initialize stats
    this.roomStats.set(roomId, {
      roomId,
      currentParticipants: 0,
      totalParticipants: 0,
      duration: 0,
      recordingDuration: 0,
      bandwidth: { upload: 0, download: 0 },
      quality: { averageLatency: 0, packetLoss: 0, jitter: 0 },
    });

    return room;
  }

  /**
   * Get room by ID
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Update room settings
   */
  async updateRoom(
    roomId: string,
    updates: Partial<Room>
  ): Promise<Room | undefined> {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    const updatedRoom = { ...room, ...updates };
    this.rooms.set(roomId, updatedRoom);

    return updatedRoom;
  }

  /**
   * Start a room (change status to ACTIVE)
   */
  async startRoom(roomId: string): Promise<Room | undefined> {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    room.status = "ACTIVE";
    room.startTime = new Date();
    this.rooms.set(roomId, room);

    return room;
  }

  /**
   * End a room
   */
  async endRoom(roomId: string): Promise<Room | undefined> {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    room.status = "ENDED";
    room.endTime = new Date();
    this.rooms.set(roomId, room);

    // Remove all participants
    const roomParticipants = this.participants.get(roomId);
    if (roomParticipants) {
      const now = new Date();
      roomParticipants.forEach((participant) => {
        participant.leftAt = now;
      });
    }

    return room;
  }

  /**
   * Add participant to room
   */
  async addParticipant(
    roomId: string,
    participantData: Omit<Participant, "joinedAt">
  ): Promise<Participant | undefined> {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    const roomParticipants =
      this.participants.get(roomId) || new Map<string, Participant>();

    const participant: Participant = {
      ...participantData,
      joinedAt: new Date(),
      audioEnabled: !room.settings.muteOnJoin,
      videoEnabled: participantData.videoEnabled,
      screenSharing: false,
      handRaised: false,
      connectionQuality: "UNKNOWN",
    };

    roomParticipants.set(participant.id, participant);
    this.participants.set(roomId, roomParticipants);

    // Update room participant list
    if (!room.participantIds.includes(participant.userId)) {
      room.participantIds.push(participant.userId);
      this.rooms.set(roomId, room);
    }

    // Update stats
    const stats = this.roomStats.get(roomId);
    if (stats) {
      stats.currentParticipants = roomParticipants.size;
      stats.totalParticipants = Math.max(
        stats.totalParticipants,
        roomParticipants.size
      );
      this.roomStats.set(roomId, stats);
    }

    return participant;
  }

  /**
   * Remove participant from room
   */
  async removeParticipant(
    roomId: string,
    participantId: string
  ): Promise<boolean> {
    const roomParticipants = this.participants.get(roomId);
    if (!roomParticipants) return false;

    const participant = roomParticipants.get(participantId);
    if (!participant) return false;

    participant.leftAt = new Date();
    roomParticipants.delete(participantId);

    // Update stats
    const stats = this.roomStats.get(roomId);
    if (stats) {
      stats.currentParticipants = roomParticipants.size;
      this.roomStats.set(roomId, stats);
    }

    return true;
  }

  /**
   * Update participant
   */
  async updateParticipant(
    roomId: string,
    participantId: string,
    updates: Partial<Participant>
  ): Promise<Participant | undefined> {
    const roomParticipants = this.participants.get(roomId);
    if (!roomParticipants) return undefined;

    const participant = roomParticipants.get(participantId);
    if (!participant) return undefined;

    const updatedParticipant = { ...participant, ...updates };
    roomParticipants.set(participantId, updatedParticipant);

    return updatedParticipant;
  }

  /**
   * Get all participants in a room
   */
  getParticipants(roomId: string): Participant[] {
    const roomParticipants = this.participants.get(roomId);
    if (!roomParticipants) return [];

    return Array.from(roomParticipants.values()).filter((p) => !p.leftAt);
  }

  /**
   * Get participant by ID
   */
  getParticipant(
    roomId: string,
    participantId: string
  ): Participant | undefined {
    return this.participants.get(roomId)?.get(participantId);
  }

  /**
   * Update participant permissions
   */
  async updateParticipantPermissions(
    roomId: string,
    participantId: string,
    permissions: Partial<Participant["permissions"]>
  ): Promise<Participant | undefined> {
    const participant = this.getParticipant(roomId, participantId);
    if (!participant) return undefined;

    participant.permissions = { ...participant.permissions, ...permissions };
    return this.updateParticipant(roomId, participantId, { permissions: participant.permissions });
  }

  /**
   * Toggle recording
   */
  async toggleRecording(roomId: string, isRecording: boolean): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.isRecording = isRecording;
    this.rooms.set(roomId, room);

    return true;
  }

  /**
   * Add recording consent
   */
  async addRecordingConsent(
    roomId: string,
    userId: string
  ): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    if (!room.recordingConsent.includes(userId)) {
      room.recordingConsent.push(userId);
      this.rooms.set(roomId, room);
    }

    return true;
  }

  /**
   * Check if all participants consented to recording
   */
  hasAllConsents(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const participants = this.getParticipants(roomId);
    return participants.every((p) =>
      room.recordingConsent.includes(p.userId)
    );
  }

  /**
   * Get room statistics
   */
  getRoomStats(roomId: string): RoomStats | undefined {
    return this.roomStats.get(roomId);
  }

  /**
   * Update room statistics
   */
  updateRoomStats(roomId: string, stats: Partial<RoomStats>): void {
    const currentStats = this.roomStats.get(roomId);
    if (currentStats) {
      this.roomStats.set(roomId, { ...currentStats, ...stats });
    }
  }

  /**
   * Get active rooms
   */
  getActiveRooms(): Room[] {
    return Array.from(this.rooms.values()).filter(
      (room) => room.status === "ACTIVE"
    );
  }

  /**
   * Get rooms for organization
   */
  getOrganizationRooms(organizationId: string): Room[] {
    return Array.from(this.rooms.values()).filter(
      (room) => room.organizationId === organizationId
    );
  }

  /**
   * Check room permissions
   */
  canJoinRoom(room: Room, userId: string, isHost: boolean): boolean {
    // Host can always join
    if (isHost || room.hostId === userId) return true;

    // Check if room is active or scheduled
    if (room.status === "ENDED" || room.status === "CANCELLED") return false;

    // Check max participants
    const currentParticipants = this.getParticipants(room.id).length;
    if (currentParticipants >= room.maxParticipants) return false;

    // Check if approval required
    if (room.settings.requireApproval) {
      return room.participantIds.includes(userId);
    }

    return true;
  }

  /**
   * Generate unique room ID
   */
  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Cleanup ended rooms (older than 24 hours)
   */
  async cleanupOldRooms(): Promise<number> {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [roomId, room] of this.rooms.entries()) {
      if (
        room.status === "ENDED" &&
        room.endTime &&
        room.endTime < cutoffTime
      ) {
        this.rooms.delete(roomId);
        this.participants.delete(roomId);
        this.roomStats.delete(roomId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}

/**
 * Singleton instance
 */
export const videoRoomManager = new VideoRoomManager();

/**
 * Room permission utilities
 */
export const RoomPermissions = {
  canRecord: (participant: Participant): boolean => {
    return participant.permissions.canRecord;
  },

  canShare: (participant: Participant): boolean => {
    return participant.permissions.canShare;
  },

  canMuteOthers: (participant: Participant): boolean => {
    return participant.permissions.canMute;
  },

  canRemoveParticipants: (participant: Participant): boolean => {
    return participant.permissions.canRemove;
  },

  isHost: (participant: Participant): boolean => {
    return participant.role === "HOST";
  },

  isCoHost: (participant: Participant): boolean => {
    return participant.role === "CO_HOST";
  },

  canModerate: (participant: Participant): boolean => {
    return participant.role === "HOST" || participant.role === "CO_HOST";
  },
};
