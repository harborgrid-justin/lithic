/**
 * Family and Caregiver Engagement System
 * Agent 5: Patient Engagement Platform
 *
 * Comprehensive family management including:
 * - Family member invitations and permissions
 * - Care circle management
 * - Family activity tracking
 * - Privacy and access controls
 * - Caregiver support features
 */

import type {
  FamilyMember,
  FamilyRelationship,
  FamilyAccessLevel,
  FamilyPermission,
  InvitationStatus,
  FamilyNotificationPreferences,
  CareCircle,
  FamilyActivity,
  FamilyActivityType,
} from "@/types/engagement";

// ============================================================================
// Family Access Engine
// ============================================================================

export class FamilyAccessEngine {
  /**
   * Invite family member to patient's care circle
   */
  static async inviteFamilyMember(
    patientId: string,
    inviteeData: FamilyMemberInvite
  ): Promise<FamilyMember> {
    // Validate patient permissions
    await this.validatePatientConsent(patientId);

    const now = new Date();

    const familyMember: FamilyMember = {
      id: crypto.randomUUID(),
      organizationId: "", // Set from context
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: patientId,
      updatedBy: patientId,
      patientId,
      familyMemberId: null,
      name: inviteeData.name,
      relationship: inviteeData.relationship,
      email: inviteeData.email || null,
      phone: inviteeData.phone || null,
      dateOfBirth: inviteeData.dateOfBirth || null,
      accessLevel: inviteeData.accessLevel || FamilyAccessLevel.VIEW_ONLY,
      permissions: this.getDefaultPermissions(inviteeData.accessLevel || FamilyAccessLevel.VIEW_ONLY),
      invitationStatus: InvitationStatus.PENDING,
      invitationSentDate: now,
      acceptedDate: null,
      isActive: false,
      canViewMedicalInfo: inviteeData.canViewMedicalInfo ?? false,
      canViewAppointments: inviteeData.canViewAppointments ?? true,
      canViewGoals: inviteeData.canViewGoals ?? true,
      canManageGoals: inviteeData.canManageGoals ?? false,
      canReceiveAlerts: inviteeData.canReceiveAlerts ?? true,
      notificationPreferences: this.getDefaultNotificationPreferences(),
    };

    // Send invitation email/SMS
    await this.sendInvitation(familyMember);

    return familyMember;
  }

  /**
   * Accept family member invitation
   */
  static async acceptInvitation(
    invitationId: string,
    acceptingPatientId: string
  ): Promise<FamilyMember> {
    const familyMember = await this.getFamilyMemberById(invitationId);

    if (familyMember.invitationStatus !== InvitationStatus.PENDING) {
      throw new Error("Invitation is not pending");
    }

    familyMember.invitationStatus = InvitationStatus.ACCEPTED;
    familyMember.acceptedDate = new Date();
    familyMember.isActive = true;
    familyMember.familyMemberId = acceptingPatientId;
    familyMember.updatedAt = new Date();

    // Record activity
    await this.recordFamilyActivity({
      patientId: familyMember.patientId,
      familyMemberId: invitationId,
      activityType: FamilyActivityType.CHALLENGE_JOIN,
      description: `${familyMember.name} joined the care circle`,
      metadata: {},
    });

    return familyMember;
  }

  /**
   * Decline family member invitation
   */
  static async declineInvitation(invitationId: string): Promise<FamilyMember> {
    const familyMember = await this.getFamilyMemberById(invitationId);

    familyMember.invitationStatus = InvitationStatus.DECLINED;
    familyMember.updatedAt = new Date();

    return familyMember;
  }

  /**
   * Update family member permissions
   */
  static async updatePermissions(
    familyMemberId: string,
    permissions: Partial<FamilyMemberPermissions>
  ): Promise<FamilyMember> {
    const familyMember = await this.getFamilyMemberById(familyMemberId);

    // Update individual permissions
    if (permissions.canViewMedicalInfo !== undefined) {
      familyMember.canViewMedicalInfo = permissions.canViewMedicalInfo;
    }
    if (permissions.canViewAppointments !== undefined) {
      familyMember.canViewAppointments = permissions.canViewAppointments;
    }
    if (permissions.canViewGoals !== undefined) {
      familyMember.canViewGoals = permissions.canViewGoals;
    }
    if (permissions.canManageGoals !== undefined) {
      familyMember.canManageGoals = permissions.canManageGoals;
    }
    if (permissions.canReceiveAlerts !== undefined) {
      familyMember.canReceiveAlerts = permissions.canReceiveAlerts;
    }

    // Update access level if provided
    if (permissions.accessLevel) {
      familyMember.accessLevel = permissions.accessLevel;
      familyMember.permissions = this.getDefaultPermissions(permissions.accessLevel);
    }

    familyMember.updatedAt = new Date();

    return familyMember;
  }

  /**
   * Remove family member from care circle
   */
  static async removeFamilyMember(
    familyMemberId: string,
    reason?: string
  ): Promise<void> {
    const familyMember = await this.getFamilyMemberById(familyMemberId);

    familyMember.isActive = false;
    familyMember.invitationStatus = InvitationStatus.REVOKED;
    familyMember.updatedAt = new Date();

    // Record activity
    await this.recordFamilyActivity({
      patientId: familyMember.patientId,
      familyMemberId,
      activityType: FamilyActivityType.MESSAGE_SENT,
      description: `Family member removed: ${reason || "No reason provided"}`,
      metadata: { reason },
    });
  }

  /**
   * Create or update care circle
   */
  static async createCareCircle(
    patientId: string,
    circleData: CreateCareCircleDto
  ): Promise<CareCircle> {
    const now = new Date();

    const careCircle: CareCircle = {
      id: crypto.randomUUID(),
      organizationId: "", // Set from context
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: patientId,
      updatedBy: patientId,
      patientId,
      name: circleData.name,
      description: circleData.description || null,
      members: circleData.memberIds || [],
      goals: [],
      challenges: [],
      isActive: true,
    };

    return careCircle;
  }

  /**
   * Add family member to care circle
   */
  static async addToCareCircle(
    careCircleId: string,
    familyMemberId: string
  ): Promise<CareCircle> {
    const careCircle = await this.getCareCircleById(careCircleId);
    const familyMember = await this.getFamilyMemberById(familyMemberId);

    if (!familyMember.isActive) {
      throw new Error("Family member must accept invitation first");
    }

    if (!careCircle.members.includes(familyMemberId)) {
      careCircle.members.push(familyMemberId);
      careCircle.updatedAt = new Date();
    }

    return careCircle;
  }

  /**
   * Share goal with family members
   */
  static async shareGoalWithFamily(
    goalId: string,
    familyMemberIds: string[],
    message?: string
  ): Promise<void> {
    for (const memberId of familyMemberIds) {
      const familyMember = await this.getFamilyMemberById(memberId);

      if (!familyMember.canViewGoals) {
        continue; // Skip if they don't have permission
      }

      // Send notification
      await this.notifyFamilyMember(familyMember, {
        type: "goal_shared",
        title: "New Goal Shared",
        message: message || "A new health goal has been shared with you",
        actionUrl: `/goals/${goalId}`,
      });

      // Record activity
      await this.recordFamilyActivity({
        patientId: familyMember.patientId,
        familyMemberId: memberId,
        activityType: FamilyActivityType.GOAL_COMMENT,
        description: "Goal shared with family member",
        metadata: { goalId, message },
      });
    }
  }

  /**
   * Post encouragement/comment on goal
   */
  static async postEncouragement(
    familyMemberId: string,
    goalId: string,
    message: string
  ): Promise<FamilyActivity> {
    const familyMember = await this.getFamilyMemberById(familyMemberId);

    const activity = await this.recordFamilyActivity({
      patientId: familyMember.patientId,
      familyMemberId,
      activityType: FamilyActivityType.GOAL_ENCOURAGEMENT,
      description: message,
      metadata: { goalId },
    });

    // Notify patient
    await this.notifyPatient(familyMember.patientId, {
      type: "family_encouragement",
      title: "You received encouragement!",
      message: `${familyMember.name}: ${message}`,
      actionUrl: `/goals/${goalId}`,
    });

    return activity;
  }

  /**
   * Get family member activity feed
   */
  static async getActivityFeed(
    patientId: string,
    limit: number = 50
  ): Promise<FamilyActivity[]> {
    const activities = await this.getFamilyActivities(patientId);
    return activities.slice(0, limit);
  }

  /**
   * Get family member statistics
   */
  static async getFamilyStats(
    patientId: string
  ): Promise<FamilyStatistics> {
    const familyMembers = await this.getFamilyMembers(patientId);
    const activities = await this.getFamilyActivities(patientId);

    const active = familyMembers.filter((m) => m.isActive);
    const pending = familyMembers.filter(
      (m) => m.invitationStatus === InvitationStatus.PENDING
    );

    const recentActivities = activities.filter((a) => {
      const daysSince = this.getDaysSince(a.createdAt);
      return daysSince <= 7;
    });

    return {
      totalMembers: familyMembers.length,
      activeMembers: active.length,
      pendingInvitations: pending.length,
      recentActivities: recentActivities.length,
      totalEncouragements: this.countActivitiesByType(
        activities,
        FamilyActivityType.GOAL_ENCOURAGEMENT
      ),
      membersByRelationship: this.groupByRelationship(familyMembers),
    };
  }

  /**
   * Check if family member has permission for action
   */
  static async hasPermission(
    familyMemberId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const familyMember = await this.getFamilyMemberById(familyMemberId);

    if (!familyMember.isActive) {
      return false;
    }

    // Check resource-specific permissions
    switch (resource) {
      case "medical_info":
        return familyMember.canViewMedicalInfo && action === "read";
      case "appointments":
        return familyMember.canViewAppointments && action === "read";
      case "goals":
        if (action === "read") return familyMember.canViewGoals;
        if (action === "write") return familyMember.canManageGoals;
        return false;
      default:
        return false;
    }
  }

  /**
   * Send alert to family members
   */
  static async sendFamilyAlert(
    patientId: string,
    alert: FamilyAlert
  ): Promise<void> {
    const familyMembers = await this.getFamilyMembers(patientId);
    const eligibleMembers = familyMembers.filter(
      (m) => m.isActive && m.canReceiveAlerts && m.notificationPreferences.criticalAlerts
    );

    for (const member of eligibleMembers) {
      await this.notifyFamilyMember(member, {
        type: "critical_alert",
        title: alert.title,
        message: alert.message,
        actionUrl: alert.actionUrl,
        priority: "urgent",
      });
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private static getDefaultPermissions(
    accessLevel: FamilyAccessLevel
  ): FamilyPermission[] {
    const permissions: FamilyPermission[] = [];

    switch (accessLevel) {
      case FamilyAccessLevel.FULL:
        permissions.push(
          { resource: "medical_info", actions: ["read"] },
          { resource: "appointments", actions: ["read", "write"] },
          { resource: "goals", actions: ["read", "write"] },
          { resource: "messages", actions: ["read", "write"] }
        );
        break;

      case FamilyAccessLevel.MANAGE:
        permissions.push(
          { resource: "appointments", actions: ["read"] },
          { resource: "goals", actions: ["read", "write"] },
          { resource: "messages", actions: ["read", "write"] }
        );
        break;

      case FamilyAccessLevel.SUPPORT:
        permissions.push(
          { resource: "goals", actions: ["read"] },
          { resource: "messages", actions: ["read", "write"] }
        );
        break;

      case FamilyAccessLevel.VIEW_ONLY:
      default:
        permissions.push(
          { resource: "goals", actions: ["read"] },
          { resource: "messages", actions: ["read"] }
        );
        break;
    }

    return permissions;
  }

  private static getDefaultNotificationPreferences(): FamilyNotificationPreferences {
    return {
      email: true,
      sms: false,
      goalMilestones: true,
      challengeUpdates: true,
      appointmentReminders: true,
      criticalAlerts: true,
    };
  }

  private static async sendInvitation(
    familyMember: FamilyMember
  ): Promise<void> {
    // Integration with email/SMS service
    console.log(`Sending invitation to ${familyMember.email || familyMember.phone}`);
  }

  private static async notifyFamilyMember(
    familyMember: FamilyMember,
    notification: any
  ): Promise<void> {
    // Integration with notification service
  }

  private static async notifyPatient(
    patientId: string,
    notification: any
  ): Promise<void> {
    // Integration with notification service
  }

  private static async recordFamilyActivity(
    activityData: Omit<FamilyActivity, "id" | "organizationId" | "createdAt" | "updatedAt" | "deletedAt" | "createdBy" | "updatedBy">
  ): Promise<FamilyActivity> {
    const now = new Date();
    return {
      id: crypto.randomUUID(),
      organizationId: "",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: activityData.familyMemberId,
      updatedBy: activityData.familyMemberId,
      ...activityData,
    };
  }

  private static async validatePatientConsent(
    patientId: string
  ): Promise<void> {
    // Check if patient has consented to family access
  }

  private static getDaysSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private static countActivitiesByType(
    activities: FamilyActivity[],
    type: FamilyActivityType
  ): number {
    return activities.filter((a) => a.activityType === type).length;
  }

  private static groupByRelationship(
    members: FamilyMember[]
  ): Record<FamilyRelationship, number> {
    const grouped: Partial<Record<FamilyRelationship, number>> = {};
    members.forEach((m) => {
      grouped[m.relationship] = (grouped[m.relationship] || 0) + 1;
    });
    return grouped as Record<FamilyRelationship, number>;
  }

  // Mock database methods
  private static async getFamilyMemberById(
    familyMemberId: string
  ): Promise<FamilyMember> {
    throw new Error("Not implemented");
  }

  private static async getCareCircleById(
    careCircleId: string
  ): Promise<CareCircle> {
    throw new Error("Not implemented");
  }

  private static async getFamilyMembers(
    patientId: string
  ): Promise<FamilyMember[]> {
    return [];
  }

  private static async getFamilyActivities(
    patientId: string
  ): Promise<FamilyActivity[]> {
    return [];
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface FamilyMemberInvite {
  name: string;
  relationship: FamilyRelationship;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  accessLevel?: FamilyAccessLevel;
  canViewMedicalInfo?: boolean;
  canViewAppointments?: boolean;
  canViewGoals?: boolean;
  canManageGoals?: boolean;
  canReceiveAlerts?: boolean;
}

interface FamilyMemberPermissions {
  accessLevel?: FamilyAccessLevel;
  canViewMedicalInfo?: boolean;
  canViewAppointments?: boolean;
  canViewGoals?: boolean;
  canManageGoals?: boolean;
  canReceiveAlerts?: boolean;
}

interface CreateCareCircleDto {
  name: string;
  description?: string;
  memberIds?: string[];
}

interface FamilyStatistics {
  totalMembers: number;
  activeMembers: number;
  pendingInvitations: number;
  recentActivities: number;
  totalEncouragements: number;
  membersByRelationship: Record<FamilyRelationship, number>;
}

interface FamilyAlert {
  title: string;
  message: string;
  actionUrl?: string;
}
