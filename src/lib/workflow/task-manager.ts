/**
 * Task Management System
 * Enterprise task orchestration with priority queues, SLA tracking, and workload balancing
 */

import {
  Task,
  TaskType,
  TaskPriority,
  TaskStatus,
  TaskCategory,
  SLAConfig,
  SLAStatus,
  TaskEscalation,
  EscalationLevel,
  TaskChecklistItem,
  TaskComment,
  UserWorkload,
  TaskMetrics,
} from "@/types/workflow";

// ============================================================================
// Task Manager Class
// ============================================================================

export class TaskManager {
  private tasks: Map<string, Task> = new Map();
  private priorityQueues: Map<string, PriorityQueue<Task>> = new Map();
  private userWorkloads: Map<string, UserWorkload> = new Map();
  private slaTimers: Map<string, NodeJS.Timeout> = new Map();
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * Create a new task
   */
  async createTask(params: CreateTaskParams): Promise<Task> {
    const task: Task = {
      id: this.generateId(),
      workflowInstanceId: params.workflowInstanceId || null,
      nodeExecutionId: params.nodeExecutionId || null,
      type: params.type,
      title: params.title,
      description: params.description,
      priority: params.priority || TaskPriority.NORMAL,
      status: TaskStatus.PENDING,
      assignedTo: params.assignedTo || null,
      assignedBy: params.assignedBy,
      assignedAt: new Date(),
      dueDate: params.dueDate || null,
      completedAt: null,
      completedBy: null,
      estimatedDuration: params.estimatedDuration || null,
      actualDuration: null,
      category: params.category || TaskCategory.CUSTOM,
      tags: params.tags || [],
      context: params.context || { relatedResources: {} },
      data: params.data || {},
      dependencies: params.dependencies || [],
      checklist: params.checklist || [],
      attachments: [],
      comments: [],
      sla: params.sla || null,
      slaStatus: SLAStatus.NOT_APPLICABLE,
      escalations: [],
      metadata: params.metadata || {},
      organizationId: params.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: params.assignedBy,
      updatedBy: params.assignedBy,
    };

    // Update status if assigned
    if (task.assignedTo) {
      task.status = TaskStatus.ASSIGNED;
    }

    this.tasks.set(task.id, task);

    // Add to priority queue
    this.addToPriorityQueue(task);

    // Setup SLA monitoring
    if (task.sla) {
      this.setupSLAMonitoring(task);
    }

    // Update workload
    if (task.assignedTo) {
      this.updateWorkload(task.assignedTo);
    }

    this.emitEvent("task:created", task);

    return task;
  }

  /**
   * Assign task to user
   */
  async assignTask(taskId: string, userId: string, assignedBy: string): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Remove from old assignee's workload
    if (task.assignedTo) {
      this.updateWorkload(task.assignedTo);
    }

    task.assignedTo = userId;
    task.assignedBy = assignedBy;
    task.assignedAt = new Date();
    task.status = TaskStatus.ASSIGNED;
    task.updatedAt = new Date();
    task.updatedBy = assignedBy;

    // Update priority queue
    this.addToPriorityQueue(task);

    // Update new assignee's workload
    this.updateWorkload(userId);

    this.emitEvent("task:assigned", task);

    return task;
  }

  /**
   * Reassign task
   */
  async reassignTask(
    taskId: string,
    fromUserId: string,
    toUserId: string,
    reason: string,
    reassignedBy: string
  ): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.assignedTo !== fromUserId) {
      throw new Error("Task not assigned to specified user");
    }

    // Add comment about reassignment
    this.addComment(taskId, {
      authorId: reassignedBy,
      authorName: "System",
      text: `Task reassigned from ${fromUserId} to ${toUserId}. Reason: ${reason}`,
      isInternal: true,
    });

    return this.assignTask(taskId, toUserId, reassignedBy);
  }

  /**
   * Delegate task
   */
  async delegateTask(
    taskId: string,
    toUserId: string,
    delegatedBy: string,
    notes?: string
  ): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Store original assignee in metadata
    task.metadata.originalAssignee = task.assignedTo;
    task.metadata.delegatedBy = delegatedBy;
    task.metadata.delegationNotes = notes;

    this.addComment(taskId, {
      authorId: delegatedBy,
      authorName: "System",
      text: `Task delegated to ${toUserId}${notes ? `. Notes: ${notes}` : ""}`,
      isInternal: true,
    });

    return this.assignTask(taskId, toUserId, delegatedBy);
  }

  /**
   * Start task
   */
  async startTask(taskId: string, userId: string): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.assignedTo !== userId) {
      throw new Error("Task not assigned to user");
    }

    task.status = TaskStatus.IN_PROGRESS;
    task.metadata.startedAt = new Date();
    task.updatedAt = new Date();

    this.emitEvent("task:started", task);

    return task;
  }

  /**
   * Complete task
   */
  async completeTask(
    taskId: string,
    userId: string,
    output?: Record<string, any>
  ): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Verify all required checklist items are completed
    const incompleteRequired = task.checklist.filter(
      (item) => item.required && !item.completed
    );

    if (incompleteRequired.length > 0) {
      throw new Error("Required checklist items not completed");
    }

    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();
    task.completedBy = userId;

    // Calculate actual duration
    if (task.metadata.startedAt) {
      const startTime = new Date(task.metadata.startedAt).getTime();
      task.actualDuration = Math.floor((task.completedAt.getTime() - startTime) / 60000);
    }

    // Store output
    if (output) {
      task.data.output = output;
    }

    // Update SLA status
    if (task.sla) {
      this.updateSLAStatus(task);
      this.clearSLAMonitoring(taskId);
    }

    // Update workload
    if (task.assignedTo) {
      this.updateWorkload(task.assignedTo);
    }

    this.emitEvent("task:completed", task);

    return task;
  }

  /**
   * Cancel task
   */
  async cancelTask(taskId: string, userId: string, reason: string): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    task.status = TaskStatus.CANCELLED;
    task.metadata.cancelledBy = userId;
    task.metadata.cancellationReason = reason;
    task.updatedAt = new Date();

    this.clearSLAMonitoring(taskId);

    if (task.assignedTo) {
      this.updateWorkload(task.assignedTo);
    }

    this.emitEvent("task:cancelled", task);

    return task;
  }

  /**
   * Update task priority
   */
  async updatePriority(
    taskId: string,
    priority: TaskPriority,
    userId: string
  ): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const oldPriority = task.priority;
    task.priority = priority;
    task.updatedAt = new Date();
    task.updatedBy = userId;

    // Re-add to priority queue
    this.addToPriorityQueue(task);

    this.addComment(taskId, {
      authorId: userId,
      authorName: "System",
      text: `Priority changed from ${oldPriority} to ${priority}`,
      isInternal: true,
    });

    this.emitEvent("task:priority:changed", task);

    return task;
  }

  /**
   * Update checklist item
   */
  async updateChecklistItem(
    taskId: string,
    itemId: string,
    completed: boolean,
    userId: string
  ): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const item = task.checklist.find((i) => i.id === itemId);
    if (!item) {
      throw new Error("Checklist item not found");
    }

    item.completed = completed;
    item.completedBy = completed ? userId : null;
    item.completedAt = completed ? new Date() : null;

    task.updatedAt = new Date();

    this.emitEvent("task:checklist:updated", task);

    return task;
  }

  /**
   * Add comment to task
   */
  addComment(taskId: string, comment: Omit<TaskComment, "id" | "createdAt" | "updatedAt">): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const newComment: TaskComment = {
      id: this.generateId(),
      ...comment,
      createdAt: new Date(),
      updatedAt: null,
    };

    task.comments.push(newComment);
    task.updatedAt = new Date();

    this.emitEvent("task:comment:added", { task, comment: newComment });
  }

  /**
   * Get tasks by assignee
   */
  getTasksByAssignee(userId: string, filters?: TaskFilters): Task[] {
    return Array.from(this.tasks.values())
      .filter((task) => task.assignedTo === userId)
      .filter((task) => this.matchesFilters(task, filters))
      .sort((a, b) => this.compareTasks(a, b));
  }

  /**
   * Get priority queue for user
   */
  getPriorityQueue(userId: string): Task[] {
    const queue = this.priorityQueues.get(userId);
    return queue ? queue.toArray() : [];
  }

  /**
   * Get next task for user (load balancing)
   */
  getNextTask(userId: string): Task | null {
    const queue = this.priorityQueues.get(userId);
    return queue?.peek() || null;
  }

  /**
   * Get workload for user
   */
  getUserWorkload(userId: string): UserWorkload {
    let workload = this.userWorkloads.get(userId);

    if (!workload) {
      workload = this.calculateWorkload(userId);
      this.userWorkloads.set(userId, workload);
    }

    return workload;
  }

  /**
   * Get team workloads (for load balancing)
   */
  getTeamWorkloads(userIds: string[]): UserWorkload[] {
    return userIds.map((userId) => this.getUserWorkload(userId));
  }

  /**
   * Find least loaded user (for load balanced assignment)
   */
  findLeastLoadedUser(userIds: string[]): string {
    const workloads = this.getTeamWorkloads(userIds);
    const sorted = workloads.sort((a, b) => a.utilizationRate - b.utilizationRate);
    return sorted[0]?.userId || userIds[0];
  }

  /**
   * Get task metrics
   */
  getTaskMetrics(filters?: TaskFilters): TaskMetrics {
    const tasks = Array.from(this.tasks.values()).filter((task) =>
      this.matchesFilters(task, filters)
    );

    const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED);
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== TaskStatus.COMPLETED
    );

    const completionTimes = completedTasks
      .filter((t) => t.actualDuration)
      .map((t) => t.actualDuration!);

    const averageCompletionTime =
      completionTimes.length > 0
        ? completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length
        : 0;

    const tasksByPriority = this.groupBy(tasks, (t) => t.priority);
    const tasksByStatus = this.groupBy(tasks, (t) => t.status);
    const tasksByCategory = this.groupBy(tasks, (t) => t.category);

    const slaCompliantTasks = tasks.filter((t) => t.slaStatus === SLAStatus.MET);
    const slaCompliance = tasks.length > 0 ? (slaCompliantTasks.length / tasks.length) * 100 : 0;

    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      averageCompletionTime,
      tasksByPriority,
      tasksByStatus,
      tasksByCategory,
      slaCompliance,
      period: {
        start: filters?.startDate || new Date(0),
        end: filters?.endDate || new Date(),
      },
    };
  }

  /**
   * Setup SLA monitoring
   */
  private setupSLAMonitoring(task: Task): void {
    if (!task.sla) return;

    const sla = task.sla;
    task.slaStatus = SLAStatus.MET;

    // Setup response time monitoring
    if (sla.responseTime) {
      const responseTimer = setTimeout(() => {
        this.checkResponseTime(task);
      }, sla.responseTime * 60000);

      this.slaTimers.set(`${task.id}:response`, responseTimer);
    }

    // Setup escalation timers
    sla.escalationLevels.forEach((level) => {
      const timer = setTimeout(() => {
        this.escalateTask(task, level);
      }, level.triggerAfter * 60000);

      this.slaTimers.set(`${task.id}:escalation:${level.level}`, timer);
    });
  }

  /**
   * Clear SLA monitoring
   */
  private clearSLAMonitoring(taskId: string): void {
    Array.from(this.slaTimers.keys())
      .filter((key) => key.startsWith(taskId))
      .forEach((key) => {
        const timer = this.slaTimers.get(key);
        if (timer) {
          clearTimeout(timer);
          this.slaTimers.delete(key);
        }
      });
  }

  /**
   * Check response time
   */
  private checkResponseTime(task: Task): void {
    if (task.status === TaskStatus.PENDING || task.status === TaskStatus.ASSIGNED) {
      task.slaStatus = SLAStatus.AT_RISK;
      this.emitEvent("task:sla:at_risk", task);
    }
  }

  /**
   * Escalate task
   */
  private async escalateTask(task: Task, level: EscalationLevel): Promise<void> {
    // Don't escalate if task is already completed
    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      return;
    }

    const escalation: TaskEscalation = {
      id: this.generateId(),
      level: level.level,
      triggeredAt: new Date(),
      escalatedTo: level.escalateTo,
      reason: `SLA breach - ${level.triggerAfter} minutes elapsed`,
      resolved: false,
      resolvedAt: null,
    };

    task.escalations.push(escalation);
    task.status = TaskStatus.ESCALATED;
    task.slaStatus = SLAStatus.BREACHED;

    this.emitEvent("task:escalated", { task, escalation, level });

    // Execute escalation actions
    level.actions.forEach((action) => {
      this.executeEscalationAction(task, action, level);
    });
  }

  /**
   * Execute escalation action
   */
  private executeEscalationAction(task: Task, action: string, level: EscalationLevel): void {
    switch (action) {
      case "NOTIFY_MANAGER":
        this.emitEvent("notification:send", {
          task,
          template: level.notificationTemplate,
          recipients: level.escalateTo,
        });
        break;

      case "INCREASE_PRIORITY":
        if (task.priority !== TaskPriority.CRITICAL) {
          const priorities = Object.values(TaskPriority);
          const currentIndex = priorities.indexOf(task.priority);
          task.priority = priorities[Math.min(currentIndex + 1, priorities.length - 1)];
          this.addToPriorityQueue(task);
        }
        break;

      case "REASSIGN":
        // Find least loaded user from escalation targets
        const leastLoaded = this.findLeastLoadedUser(level.escalateTo);
        this.assignTask(task.id, leastLoaded, "system");
        break;
    }
  }

  /**
   * Update SLA status
   */
  private updateSLAStatus(task: Task): void {
    if (!task.sla || !task.completedAt) return;

    const duration = Math.floor(
      (task.completedAt.getTime() - task.assignedAt.getTime()) / 60000
    );

    if (duration <= task.sla.resolutionTime) {
      task.slaStatus = SLAStatus.MET;
    } else {
      task.slaStatus = SLAStatus.BREACHED;
    }
  }

  /**
   * Add task to priority queue
   */
  private addToPriorityQueue(task: Task): void {
    if (!task.assignedTo) return;

    let queue = this.priorityQueues.get(task.assignedTo);
    if (!queue) {
      queue = new PriorityQueue<Task>(this.compareTasks);
      this.priorityQueues.set(task.assignedTo, queue);
    }

    // Remove if already exists
    queue.remove(task);

    // Add if not completed
    if (task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED) {
      queue.enqueue(task);
    }
  }

  /**
   * Calculate user workload
   */
  private calculateWorkload(userId: string): UserWorkload {
    const tasks = this.getTasksByAssignee(userId);
    const assignedTasks = tasks.filter(
      (t) => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED
    );
    const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED);
    const overdueTasks = assignedTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date()
    );

    const completionTimes = completedTasks
      .filter((t) => t.actualDuration)
      .map((t) => t.actualDuration!);

    const averageCompletionTime =
      completionTimes.length > 0
        ? completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length
        : 0;

    // Calculate capacity (assuming 8 hour work day = 480 minutes)
    const capacity = 480;
    const estimatedLoad = assignedTasks.reduce((sum, t) => sum + (t.estimatedDuration || 30), 0);
    const utilizationRate = (estimatedLoad / capacity) * 100;

    return {
      userId,
      userName: "", // Would be filled from database
      assignedTasks: assignedTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      averageCompletionTime,
      utilizationRate,
      capacity,
    };
  }

  /**
   * Update user workload
   */
  private updateWorkload(userId: string): void {
    const workload = this.calculateWorkload(userId);
    this.userWorkloads.set(userId, workload);
    this.emitEvent("workload:updated", workload);
  }

  /**
   * Compare tasks for priority ordering
   */
  private compareTasks(a: Task, b: Task): number {
    // Priority weights
    const priorityWeights = {
      [TaskPriority.CRITICAL]: 5,
      [TaskPriority.URGENT]: 4,
      [TaskPriority.HIGH]: 3,
      [TaskPriority.NORMAL]: 2,
      [TaskPriority.LOW]: 1,
    };

    // Compare by priority first
    const priorityDiff = priorityWeights[b.priority] - priorityWeights[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by due date (earlier first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    // Then by creation date (older first)
    return a.createdAt.getTime() - b.createdAt.getTime();
  }

  /**
   * Check if task matches filters
   */
  private matchesFilters(task: Task, filters?: TaskFilters): boolean {
    if (!filters) return true;

    if (filters.status && !filters.status.includes(task.status)) return false;
    if (filters.priority && !filters.priority.includes(task.priority)) return false;
    if (filters.category && !filters.category.includes(task.category)) return false;
    if (filters.assignedTo && task.assignedTo !== filters.assignedTo) return false;
    if (filters.startDate && task.createdAt < filters.startDate) return false;
    if (filters.endDate && task.createdAt > filters.endDate) return false;

    return true;
  }

  /**
   * Group tasks by key function
   */
  private groupBy<T, K extends string | number>(
    items: T[],
    keyFn: (item: T) => K
  ): Record<K, number> {
    const result = {} as Record<K, number>;
    items.forEach((item) => {
      const key = keyFn(item);
      result[key] = (result[key] || 0) + 1;
    });
    return result;
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
// Priority Queue Implementation
// ============================================================================

class PriorityQueue<T> {
  private items: T[] = [];
  private compareFn: (a: T, b: T) => number;

  constructor(compareFn: (a: T, b: T) => number) {
    this.compareFn = compareFn;
  }

  enqueue(item: T): void {
    this.items.push(item);
    this.items.sort(this.compareFn);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  peek(): T | undefined {
    return this.items[0];
  }

  remove(item: T): void {
    const index = this.items.indexOf(item);
    if (index > -1) {
      this.items.splice(index, 1);
    }
  }

  toArray(): T[] {
    return [...this.items];
  }

  get length(): number {
    return this.items.length;
  }
}

// ============================================================================
// Types
// ============================================================================

interface CreateTaskParams {
  workflowInstanceId?: string;
  nodeExecutionId?: string;
  type: TaskType;
  title: string;
  description: string;
  priority?: TaskPriority;
  assignedTo?: string;
  assignedBy: string;
  dueDate?: Date;
  estimatedDuration?: number;
  category?: TaskCategory;
  tags?: string[];
  context?: any;
  data?: Record<string, any>;
  dependencies?: string[];
  checklist?: TaskChecklistItem[];
  sla?: SLAConfig;
  metadata?: Record<string, any>;
  organizationId: string;
}

interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  category?: TaskCategory[];
  assignedTo?: string;
  startDate?: Date;
  endDate?: Date;
}

type EventHandler = (data: any) => void;

// ============================================================================
// Singleton Instance
// ============================================================================

export const taskManager = new TaskManager();
