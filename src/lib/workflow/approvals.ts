/**
 * Approval Workflow System
 * Multi-level approval chains with delegation and auto-approval rules
 */

import {
  ApprovalRequest,
  ApprovalConfig,
  ApprovalType,
  ApprovalStatus,
  ApprovalLevel,
  Approval,
  Rejection,
  ApprovalComment,
  AutoApprovalRule,
  WorkflowCondition,
  ConditionOperator,
} from "@/types/workflow";
import { notificationManager } from "./notifications";
import { NotificationChannel, NotificationCategory, NotificationPriority } from "@/types/workflow";

// ============================================================================
// Approval Manager Class
// ============================================================================

export class ApprovalManager {
  private requests: Map<string, ApprovalRequest> = new Map();
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private delegations: Map<string, DelegationRule> = new Map();

  /**
   * Create approval request
   */
  async createApprovalRequest(params: CreateApprovalParams): Promise<ApprovalRequest> {
    // Check auto-approval rules first
    if (params.config.autoApprovalRules) {
      const autoApprove = this.checkAutoApprovalRules(
        params.config.autoApprovalRules,
        params.context
      );

      if (autoApprove) {
        return this.createAutoApprovedRequest(params);
      }
    }

    const request: ApprovalRequest = {
      id: this.generateId(),
      workflowInstanceId: params.workflowInstanceId || null,
      taskId: params.taskId || null,
      title: params.title,
      description: params.description,
      requestedBy: params.requestedBy,
      requestedAt: new Date(),
      config: params.config,
      status: ApprovalStatus.PENDING,
      currentLevel: 1,
      approvals: [],
      rejections: [],
      comments: [],
      dueDate: params.dueDate || null,
      completedAt: null,
      context: params.context,
      metadata: params.metadata || {},
      organizationId: params.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: params.requestedBy,
      updatedBy: params.requestedBy,
    };

    this.requests.set(request.id, request);

    // Notify approvers at first level
    await this.notifyLevelApprovers(request, 1);

    // Setup timeout if configured
    if (params.config.levels[0]?.timeout) {
      this.setupLevelTimeout(request, 1);
    }

    this.emitEvent("approval:requested", request);

    return request;
  }

  /**
   * Approve request
   */
  async approve(
    requestId: string,
    approverId: string,
    comments?: string,
    signature?: string
  ): Promise<ApprovalRequest> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error("Approval request not found");
    }

    if (request.status !== ApprovalStatus.PENDING) {
      throw new Error("Request is not pending approval");
    }

    // Check if user is an approver at current level
    const currentLevel = request.config.levels.find((l) => l.level === request.currentLevel);
    if (!currentLevel) {
      throw new Error("Invalid approval level");
    }

    // Handle delegation
    const effectiveApproverId = this.resolveApprover(approverId, currentLevel);

    if (!this.isApproverAtLevel(effectiveApproverId, currentLevel)) {
      throw new Error("User is not authorized to approve at this level");
    }

    // Check if already approved by this user
    if (request.approvals.some((a) => a.approverId === effectiveApproverId && a.level === request.currentLevel)) {
      throw new Error("Already approved by this user");
    }

    const approval: Approval = {
      id: this.generateId(),
      level: request.currentLevel,
      approverId: effectiveApproverId,
      approverName: "", // Would be filled from database
      approvedAt: new Date(),
      comments: comments || null,
      signature: signature || null,
      ipAddress: "", // Would be filled from request context
      metadata: {},
    };

    request.approvals.push(approval);
    request.updatedAt = new Date();

    this.emitEvent("approval:approved", { request, approval });

    // Send notification
    await notificationManager.sendNotification({
      recipientId: request.requestedBy,
      channel: NotificationChannel.IN_APP,
      priority: NotificationPriority.NORMAL,
      title: "Approval Granted",
      message: `Your request "${request.title}" has been approved by ${approval.approverName}`,
      category: NotificationCategory.APPROVAL_APPROVED,
      organizationId: request.organizationId,
    });

    // Check if level is complete
    if (this.isLevelComplete(request, currentLevel)) {
      await this.completeLevelAndAdvance(request);
    }

    return request;
  }

  /**
   * Reject request
   */
  async reject(
    requestId: string,
    rejecterId: string,
    reason: string,
    comments?: string
  ): Promise<ApprovalRequest> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error("Approval request not found");
    }

    if (request.status !== ApprovalStatus.PENDING) {
      throw new Error("Request is not pending approval");
    }

    const currentLevel = request.config.levels.find((l) => l.level === request.currentLevel);
    if (!currentLevel) {
      throw new Error("Invalid approval level");
    }

    const effectiveRejecterId = this.resolveApprover(rejecterId, currentLevel);

    if (!this.isApproverAtLevel(effectiveRejecterId, currentLevel)) {
      throw new Error("User is not authorized to reject at this level");
    }

    const rejection: Rejection = {
      id: this.generateId(),
      level: request.currentLevel,
      rejecterId: effectiveRejecterId,
      rejecterName: "", // Would be filled from database
      rejectedAt: new Date(),
      reason,
      comments: comments || null,
      ipAddress: "", // Would be filled from request context
      metadata: {},
    };

    request.rejections.push(rejection);
    request.status = ApprovalStatus.REJECTED;
    request.completedAt = new Date();
    request.updatedAt = new Date();

    this.emitEvent("approval:rejected", { request, rejection });

    // Send notification
    await notificationManager.sendNotification({
      recipientId: request.requestedBy,
      channel: NotificationChannel.IN_APP,
      priority: NotificationPriority.HIGH,
      title: "Approval Rejected",
      message: `Your request "${request.title}" has been rejected. Reason: ${reason}`,
      category: NotificationCategory.APPROVAL_REJECTED,
      organizationId: request.organizationId,
    });

    return request;
  }

  /**
   * Add comment to approval request
   */
  async addComment(
    requestId: string,
    authorId: string,
    text: string,
    isInternal: boolean = false
  ): Promise<ApprovalComment> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error("Approval request not found");
    }

    const comment: ApprovalComment = {
      id: this.generateId(),
      authorId,
      authorName: "", // Would be filled from database
      text,
      createdAt: new Date(),
      isInternal,
    };

    request.comments.push(comment);
    request.updatedAt = new Date();

    this.emitEvent("approval:comment:added", { request, comment });

    return comment;
  }

  /**
   * Delegate approval
   */
  async delegateApproval(
    fromUserId: string,
    toUserId: string,
    startDate: Date,
    endDate: Date,
    reason?: string
  ): Promise<void> {
    const delegation: DelegationRule = {
      id: this.generateId(),
      fromUserId,
      toUserId,
      startDate,
      endDate,
      reason: reason || "Out of office",
      isActive: true,
    };

    this.delegations.set(delegation.id, delegation);

    this.emitEvent("approval:delegated", delegation);

    // Notify delegate
    await notificationManager.sendNotification({
      recipientId: toUserId,
      channel: NotificationChannel.EMAIL,
      priority: NotificationPriority.NORMAL,
      title: "Approval Delegation",
      message: `${fromUserId} has delegated their approval authority to you from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
      category: NotificationCategory.SYSTEM,
      organizationId: "default", // Would come from context
    });
  }

  /**
   * Cancel delegation
   */
  async cancelDelegation(delegationId: string): Promise<void> {
    const delegation = this.delegations.get(delegationId);
    if (!delegation) {
      throw new Error("Delegation not found");
    }

    delegation.isActive = false;

    this.emitEvent("approval:delegation:cancelled", delegation);
  }

  /**
   * Cancel approval request
   */
  async cancelRequest(requestId: string, userId: string, reason: string): Promise<ApprovalRequest> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error("Approval request not found");
    }

    if (request.requestedBy !== userId) {
      throw new Error("Only requester can cancel the request");
    }

    if (request.status !== ApprovalStatus.PENDING) {
      throw new Error("Can only cancel pending requests");
    }

    request.status = ApprovalStatus.CANCELLED;
    request.completedAt = new Date();
    request.metadata.cancellationReason = reason;
    request.updatedAt = new Date();

    this.emitEvent("approval:cancelled", request);

    return request;
  }

  /**
   * Get pending approvals for user
   */
  getPendingApprovals(userId: string): ApprovalRequest[] {
    return Array.from(this.requests.values()).filter((request) => {
      if (request.status !== ApprovalStatus.PENDING) return false;

      const currentLevel = request.config.levels.find((l) => l.level === request.currentLevel);
      if (!currentLevel) return false;

      return this.isApproverAtLevel(userId, currentLevel);
    });
  }

  /**
   * Get user's approval history
   */
  getApprovalHistory(userId: string): ApprovalRequest[] {
    return Array.from(this.requests.values()).filter(
      (request) =>
        request.requestedBy === userId ||
        request.approvals.some((a) => a.approverId === userId) ||
        request.rejections.some((r) => r.rejecterId === userId)
    );
  }

  /**
   * Check if level is complete
   */
  private isLevelComplete(request: ApprovalRequest, level: ApprovalLevel): boolean {
    const approvalsAtLevel = request.approvals.filter((a) => a.level === level.level);

    switch (request.config.type) {
      case ApprovalType.SINGLE:
      case ApprovalType.MULTI_LEVEL:
        return approvalsAtLevel.length >= level.minimumApprovals;

      case ApprovalType.PARALLEL:
        return approvalsAtLevel.length >= level.minimumApprovals;

      case ApprovalType.CONSENSUS:
        // All approvers must approve
        return approvalsAtLevel.length === level.approvers.length;

      case ApprovalType.MAJORITY:
        // More than 50% must approve
        return approvalsAtLevel.length > level.approvers.length / 2;

      default:
        return approvalsAtLevel.length >= level.minimumApprovals;
    }
  }

  /**
   * Complete level and advance to next
   */
  private async completeLevelAndAdvance(request: ApprovalRequest): Promise<void> {
    const nextLevel = request.config.levels.find((l) => l.level === request.currentLevel + 1);

    if (!nextLevel) {
      // No more levels, request is approved
      request.status = ApprovalStatus.APPROVED;
      request.completedAt = new Date();
      this.emitEvent("approval:completed", request);

      // Send final notification
      await notificationManager.sendNotification({
        recipientId: request.requestedBy,
        channel: NotificationChannel.IN_APP,
        priority: NotificationPriority.NORMAL,
        title: "Approval Complete",
        message: `Your request "${request.title}" has been fully approved`,
        category: NotificationCategory.APPROVAL_APPROVED,
        organizationId: request.organizationId,
      });

      return;
    }

    // Move to next level
    request.currentLevel = nextLevel.level;
    request.updatedAt = new Date();

    // Notify next level approvers
    await this.notifyLevelApprovers(request, nextLevel.level);

    // Setup timeout for next level
    if (nextLevel.timeout) {
      this.setupLevelTimeout(request, nextLevel.level);
    }

    this.emitEvent("approval:level:advanced", { request, level: nextLevel.level });
  }

  /**
   * Notify approvers at specific level
   */
  private async notifyLevelApprovers(request: ApprovalRequest, level: number): Promise<void> {
    const approvalLevel = request.config.levels.find((l) => l.level === level);
    if (!approvalLevel) return;

    const approverIds = approvalLevel.approvers.map((a) => a.id);

    await notificationManager.sendBulk(approverIds, {
      channel: NotificationChannel.IN_APP,
      priority: NotificationPriority.HIGH,
      title: "Approval Required",
      message: `Your approval is required for: ${request.title}`,
      category: NotificationCategory.APPROVAL_REQUESTED,
      actionUrl: `/approvals/${request.id}`,
      actionLabel: "Review",
      organizationId: request.organizationId,
      createdBy: request.requestedBy,
    });
  }

  /**
   * Setup timeout for approval level
   */
  private setupLevelTimeout(request: ApprovalRequest, level: number): void {
    const approvalLevel = request.config.levels.find((l) => l.level === level);
    if (!approvalLevel || !approvalLevel.timeout) return;

    setTimeout(() => {
      const currentRequest = this.requests.get(request.id);
      if (!currentRequest || currentRequest.status !== ApprovalStatus.PENDING) return;
      if (currentRequest.currentLevel !== level) return;

      // Level timed out
      currentRequest.status = ApprovalStatus.EXPIRED;
      currentRequest.completedAt = new Date();
      currentRequest.metadata.expirationLevel = level;

      this.emitEvent("approval:expired", currentRequest);

      // Notify requester
      notificationManager.sendNotification({
        recipientId: currentRequest.requestedBy,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.HIGH,
        title: "Approval Request Expired",
        message: `Your approval request "${currentRequest.title}" has expired at level ${level}`,
        category: NotificationCategory.SYSTEM,
        organizationId: currentRequest.organizationId,
      });
    }, approvalLevel.timeout * 60000);
  }

  /**
   * Check auto-approval rules
   */
  private checkAutoApprovalRules(
    rules: AutoApprovalRule[],
    context: Record<string, any>
  ): boolean {
    for (const rule of rules) {
      if (this.evaluateConditions(rule.conditions, context)) {
        return rule.autoApprove;
      }
    }
    return false;
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(
    conditions: WorkflowCondition[],
    context: Record<string, any>
  ): boolean {
    if (conditions.length === 0) return true;

    let result = this.evaluateCondition(conditions[0], context);

    for (let i = 1; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(condition, context);

      if (condition.logicalOperator === "OR") {
        result = result || conditionResult;
      } else {
        result = result && conditionResult;
      }
    }

    return result;
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(condition: WorkflowCondition, context: Record<string, any>): boolean {
    const fieldValue = this.getNestedValue(context, condition.field);
    const compareValue = condition.value;

    switch (condition.operator) {
      case ConditionOperator.EQUALS:
        return fieldValue === compareValue;
      case ConditionOperator.NOT_EQUALS:
        return fieldValue !== compareValue;
      case ConditionOperator.GREATER_THAN:
        return fieldValue > compareValue;
      case ConditionOperator.LESS_THAN:
        return fieldValue < compareValue;
      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        return fieldValue >= compareValue;
      case ConditionOperator.LESS_THAN_OR_EQUAL:
        return fieldValue <= compareValue;
      case ConditionOperator.IN:
        return Array.isArray(compareValue) && compareValue.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((curr, prop) => curr?.[prop], obj);
  }

  /**
   * Create auto-approved request
   */
  private createAutoApprovedRequest(params: CreateApprovalParams): ApprovalRequest {
    const request: ApprovalRequest = {
      id: this.generateId(),
      workflowInstanceId: params.workflowInstanceId || null,
      taskId: params.taskId || null,
      title: params.title,
      description: params.description,
      requestedBy: params.requestedBy,
      requestedAt: new Date(),
      config: params.config,
      status: ApprovalStatus.APPROVED,
      currentLevel: params.config.levels.length,
      approvals: [
        {
          id: this.generateId(),
          level: 1,
          approverId: "system",
          approverName: "Auto-Approval System",
          approvedAt: new Date(),
          comments: "Auto-approved based on configured rules",
          signature: null,
          ipAddress: "",
          metadata: { autoApproved: true },
        },
      ],
      rejections: [],
      comments: [],
      dueDate: params.dueDate || null,
      completedAt: new Date(),
      context: params.context,
      metadata: { ...params.metadata, autoApproved: true },
      organizationId: params.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: params.requestedBy,
      updatedBy: "system",
    };

    this.requests.set(request.id, request);
    this.emitEvent("approval:auto_approved", request);

    return request;
  }

  /**
   * Check if user is approver at level
   */
  private isApproverAtLevel(userId: string, level: ApprovalLevel): boolean {
    return level.approvers.some((a) => {
      if (a.type === "USER") return a.id === userId;
      // In production, would check role/group membership
      return false;
    });
  }

  /**
   * Resolve approver (handle delegation)
   */
  private resolveApprover(userId: string, level: ApprovalLevel): string {
    const now = new Date();

    // Check for active delegations
    const delegation = Array.from(this.delegations.values()).find(
      (d) =>
        d.isActive &&
        d.fromUserId === userId &&
        d.startDate <= now &&
        d.endDate >= now
    );

    if (delegation) {
      return delegation.toUserId;
    }

    return userId;
  }

  /**
   * Register event handler
   */
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Emit event
   */
  private emitEvent(event: string, data: any): void {
    this.eventHandlers.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Event handler error for ${event}:`, error);
      }
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Types
// ============================================================================

interface CreateApprovalParams {
  workflowInstanceId?: string;
  taskId?: string;
  title: string;
  description: string;
  requestedBy: string;
  config: ApprovalConfig;
  dueDate?: Date;
  context: Record<string, any>;
  metadata?: Record<string, any>;
  organizationId: string;
}

interface DelegationRule {
  id: string;
  fromUserId: string;
  toUserId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  isActive: boolean;
}

type EventHandler = (data: any) => void;

// ============================================================================
// Singleton Instance
// ============================================================================

export const approvalManager = new ApprovalManager();
