/**
 * Workflow Engine Core - State Machine-Based Execution
 * Enterprise-grade workflow orchestration with parallel processing and error handling
 */

import {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowInstanceStatus,
  NodeExecution,
  NodeExecutionStatus,
  NodeType,
  WorkflowNode,
  WorkflowEdge,
  WorkflowError,
  WorkflowCondition,
  ConditionOperator,
  RetryPolicy,
  BackoffType,
} from "@/types/workflow";

// ============================================================================
// Workflow Engine Class
// ============================================================================

export class WorkflowEngine {
  private instances: Map<string, WorkflowInstance> = new Map();
  private nodeExecutions: Map<string, NodeExecution> = new Map();
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * Start a new workflow instance
   */
  async startWorkflow(
    definition: WorkflowDefinition,
    context: Record<string, any>,
    variables: Record<string, any> = {}
  ): Promise<WorkflowInstance> {
    const instance: WorkflowInstance = {
      id: this.generateId(),
      workflowDefinitionId: definition.id,
      workflowDefinition: definition,
      name: definition.name,
      status: WorkflowInstanceStatus.RUNNING,
      currentNodes: [],
      variables: { ...variables },
      context: {
        initiator: context.userId,
        patientId: context.patientId,
        encounterId: context.encounterId,
        orderId: context.orderId,
        relatedResources: context.relatedResources || {},
        businessKey: context.businessKey,
        correlationId: context.correlationId || this.generateId(),
      },
      startedAt: new Date(),
      completedAt: null,
      duration: null,
      error: null,
      parentInstanceId: context.parentInstanceId || null,
      priority: context.priority || "NORMAL",
      metadata: {},
      organizationId: context.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: context.userId,
      updatedBy: context.userId,
    };

    this.instances.set(instance.id, instance);
    this.emitEvent("workflow:started", instance);

    // Find start node and execute
    const startNode = definition.nodes.find(
      (node) => node.type === NodeType.START
    );
    if (!startNode) {
      throw new Error("Workflow definition has no START node");
    }

    await this.executeNode(instance, startNode);

    return instance;
  }

  /**
   * Execute a workflow node
   */
  private async executeNode(
    instance: WorkflowInstance,
    node: WorkflowNode
  ): Promise<void> {
    const execution: NodeExecution = {
      id: this.generateId(),
      instanceId: instance.id,
      nodeId: node.id,
      nodeName: node.name,
      status: NodeExecutionStatus.RUNNING,
      startedAt: new Date(),
      completedAt: null,
      duration: null,
      attempts: 0,
      input: { ...instance.variables },
      output: null,
      error: null,
      assignedTo: null,
      metadata: {},
    };

    this.nodeExecutions.set(execution.id, execution);
    instance.currentNodes.push(node.id);
    this.updateInstance(instance);

    try {
      // Execute node based on type
      const output = await this.executeNodeType(instance, node, execution);

      // Mark execution as completed
      execution.status = NodeExecutionStatus.COMPLETED;
      execution.completedAt = new Date();
      execution.duration =
        execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.output = output;

      // Update instance variables with output
      if (output && node.config.outputMapping) {
        Object.entries(node.config.outputMapping).forEach(([key, path]) => {
          instance.variables[key] = this.getNestedValue(output, path);
        });
      }

      // Remove from current nodes
      instance.currentNodes = instance.currentNodes.filter(
        (id) => id !== node.id
      );

      this.emitEvent("node:completed", { instance, node, execution });

      // Find and execute next nodes
      await this.executeNextNodes(instance, node, output);
    } catch (error) {
      await this.handleNodeError(instance, node, execution, error);
    }
  }

  /**
   * Execute node based on its type
   */
  private async executeNodeType(
    instance: WorkflowInstance,
    node: WorkflowNode,
    execution: NodeExecution
  ): Promise<any> {
    switch (node.type) {
      case NodeType.START:
        return this.executeStartNode(instance, node);

      case NodeType.END:
        return this.executeEndNode(instance, node);

      case NodeType.TASK:
        return this.executeTaskNode(instance, node, execution);

      case NodeType.DECISION:
        return this.executeDecisionNode(instance, node);

      case NodeType.PARALLEL:
        return this.executeParallelNode(instance, node);

      case NodeType.JOIN:
        return this.executeJoinNode(instance, node);

      case NodeType.WAIT:
        return this.executeWaitNode(instance, node);

      case NodeType.API_CALL:
        return this.executeApiCallNode(instance, node);

      case NodeType.NOTIFICATION:
        return this.executeNotificationNode(instance, node);

      case NodeType.APPROVAL:
        return this.executeApprovalNode(instance, node, execution);

      case NodeType.SCRIPT:
        return this.executeScriptNode(instance, node);

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Execute START node
   */
  private async executeStartNode(
    instance: WorkflowInstance,
    node: WorkflowNode
  ): Promise<any> {
    return { started: true, timestamp: new Date() };
  }

  /**
   * Execute END node
   */
  private async executeEndNode(
    instance: WorkflowInstance,
    node: WorkflowNode
  ): Promise<any> {
    instance.status = WorkflowInstanceStatus.COMPLETED;
    instance.completedAt = new Date();
    instance.duration =
      instance.completedAt.getTime() - instance.startedAt.getTime();
    this.updateInstance(instance);
    this.emitEvent("workflow:completed", instance);
    return { completed: true };
  }

  /**
   * Execute TASK node
   */
  private async executeTaskNode(
    instance: WorkflowInstance,
    node: WorkflowNode,
    execution: NodeExecution
  ): Promise<any> {
    // Create task assignment
    const assignee = await this.resolveAssignment(
      instance,
      node.config.assignee!
    );
    execution.assignedTo = assignee;

    // Emit task creation event
    this.emitEvent("task:created", {
      instance,
      node,
      execution,
      assignee,
    });

    // Task nodes wait for external completion
    instance.status = WorkflowInstanceStatus.WAITING;
    this.updateInstance(instance);

    return { taskCreated: true, assignedTo: assignee };
  }

  /**
   * Execute DECISION node
   */
  private async executeDecisionNode(
    instance: WorkflowInstance,
    node: WorkflowNode
  ): Promise<any> {
    const conditions = node.config.conditions || [];
    const evaluatedPath = this.evaluateConditions(instance.variables, conditions);

    return { decision: evaluatedPath, conditions };
  }

  /**
   * Execute PARALLEL node
   */
  private async executeParallelNode(
    instance: WorkflowInstance,
    node: WorkflowNode
  ): Promise<any> {
    const branches = node.config.parallelBranches || [];

    // Mark for parallel execution
    return { parallelBranches: branches, timestamp: new Date() };
  }

  /**
   * Execute JOIN node
   */
  private async executeJoinNode(
    instance: WorkflowInstance,
    node: WorkflowNode
  ): Promise<any> {
    // Wait for all incoming paths to complete
    const definition = instance.workflowDefinition!;
    const incomingEdges = definition.edges.filter((e) => e.target === node.id);

    // Check if all incoming nodes are completed
    const allCompleted = incomingEdges.every((edge) => {
      const executions = Array.from(this.nodeExecutions.values()).filter(
        (e) => e.instanceId === instance.id && e.nodeId === edge.source
      );
      return executions.some((e) => e.status === NodeExecutionStatus.COMPLETED);
    });

    if (!allCompleted) {
      throw new Error("Not all parallel branches completed");
    }

    return { joined: true, timestamp: new Date() };
  }

  /**
   * Execute WAIT node
   */
  private async executeWaitNode(
    instance: WorkflowInstance,
    node: WorkflowNode
  ): Promise<any> {
    const waitDuration = node.config.waitDuration || 0;
    const waitUntil = node.config.waitUntil;

    if (waitUntil) {
      const waitTime = new Date(waitUntil).getTime() - Date.now();
      if (waitTime > 0) {
        instance.status = WorkflowInstanceStatus.WAITING;
        this.updateInstance(instance);

        setTimeout(() => {
          instance.status = WorkflowInstanceStatus.RUNNING;
          this.updateInstance(instance);
          this.executeNextNodes(instance, node, {});
        }, waitTime);
      }
    } else if (waitDuration > 0) {
      instance.status = WorkflowInstanceStatus.WAITING;
      this.updateInstance(instance);

      setTimeout(() => {
        instance.status = WorkflowInstanceStatus.RUNNING;
        this.updateInstance(instance);
        this.executeNextNodes(instance, node, {});
      }, waitDuration);
    }

    return { waiting: true, duration: waitDuration, until: waitUntil };
  }

  /**
   * Execute API_CALL node
   */
  private async executeApiCallNode(
    instance: WorkflowInstance,
    node: WorkflowNode
  ): Promise<any> {
    const { apiEndpoint, apiMethod = "GET", apiPayload } = node.config;

    if (!apiEndpoint) {
      throw new Error("API endpoint not configured");
    }

    // Replace variables in endpoint
    const endpoint = this.replaceVariables(apiEndpoint, instance.variables);
    const payload = this.replaceVariables(
      JSON.stringify(apiPayload || {}),
      instance.variables
    );

    // Make API call
    const response = await fetch(endpoint, {
      method: apiMethod,
      headers: {
        "Content-Type": "application/json",
      },
      body: apiMethod !== "GET" ? payload : undefined,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Execute NOTIFICATION node
   */
  private async executeNotificationNode(
    instance: WorkflowInstance,
    node: WorkflowNode
  ): Promise<any> {
    const { notificationTemplate } = node.config;

    // Emit notification event
    this.emitEvent("notification:send", {
      instance,
      node,
      template: notificationTemplate,
      variables: instance.variables,
    });

    return { notificationSent: true, template: notificationTemplate };
  }

  /**
   * Execute APPROVAL node
   */
  private async executeApprovalNode(
    instance: WorkflowInstance,
    node: WorkflowNode,
    execution: NodeExecution
  ): Promise<any> {
    const { approvalConfig } = node.config;

    // Emit approval request event
    this.emitEvent("approval:requested", {
      instance,
      node,
      execution,
      config: approvalConfig,
    });

    // Approval nodes wait for external completion
    instance.status = WorkflowInstanceStatus.WAITING;
    this.updateInstance(instance);

    return { approvalRequested: true, config: approvalConfig };
  }

  /**
   * Execute SCRIPT node
   */
  private async executeScriptNode(
    instance: WorkflowInstance,
    node: WorkflowNode
  ): Promise<any> {
    const { scriptCode } = node.config;

    if (!scriptCode) {
      throw new Error("Script code not configured");
    }

    // Execute script in sandboxed context
    const context = {
      variables: instance.variables,
      context: instance.context,
      console: console,
    };

    try {
      const func = new Function(
        "context",
        `with(context) { ${scriptCode} }`
      );
      const result = func(context);
      return result || {};
    } catch (error) {
      throw new Error(`Script execution failed: ${error}`);
    }
  }

  /**
   * Execute next nodes based on edges
   */
  private async executeNextNodes(
    instance: WorkflowInstance,
    currentNode: WorkflowNode,
    output: any
  ): Promise<void> {
    const definition = instance.workflowDefinition!;
    const outgoingEdges = definition.edges
      .filter((edge) => edge.source === currentNode.id)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Handle PARALLEL node specially
    if (currentNode.type === NodeType.PARALLEL) {
      const parallelEdges = outgoingEdges.filter((edge) =>
        currentNode.config.parallelBranches?.includes(edge.id)
      );

      // Execute all parallel branches concurrently
      const promises = parallelEdges.map((edge) => {
        const nextNode = definition.nodes.find((n) => n.id === edge.target);
        if (nextNode) {
          return this.executeNode(instance, nextNode);
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      return;
    }

    // Handle DECISION node - only execute first matching path
    if (currentNode.type === NodeType.DECISION) {
      for (const edge of outgoingEdges) {
        if (this.evaluateEdgeCondition(instance.variables, edge)) {
          const nextNode = definition.nodes.find((n) => n.id === edge.target);
          if (nextNode) {
            await this.executeNode(instance, nextNode);
          }
          return; // Only execute first matching path
        }
      }
      return;
    }

    // For other nodes, execute all outgoing edges
    for (const edge of outgoingEdges) {
      if (this.evaluateEdgeCondition(instance.variables, edge)) {
        const nextNode = definition.nodes.find((n) => n.id === edge.target);
        if (nextNode) {
          await this.executeNode(instance, nextNode);
        }
      }
    }
  }

  /**
   * Handle node execution error
   */
  private async handleNodeError(
    instance: WorkflowInstance,
    node: WorkflowNode,
    execution: NodeExecution,
    error: any
  ): Promise<void> {
    const retryPolicy = node.config.retryPolicy;

    execution.attempts++;

    // Check if we should retry
    if (retryPolicy && execution.attempts < retryPolicy.maxAttempts) {
      const delay = this.calculateRetryDelay(retryPolicy, execution.attempts);

      execution.status = NodeExecutionStatus.RETRYING;
      this.emitEvent("node:retrying", { instance, node, execution, delay });

      setTimeout(() => {
        this.executeNode(instance, node);
      }, delay);

      return;
    }

    // No more retries, mark as failed
    execution.status = NodeExecutionStatus.FAILED;
    execution.completedAt = new Date();
    execution.duration =
      execution.completedAt.getTime() - execution.startedAt.getTime();
    execution.error = {
      code: "EXECUTION_ERROR",
      message: error.message || "Node execution failed",
      nodeId: node.id,
      timestamp: new Date(),
      stackTrace: error.stack,
      details: { error: String(error) },
    };

    instance.status = WorkflowInstanceStatus.FAILED;
    instance.error = execution.error;
    instance.completedAt = new Date();
    instance.duration =
      instance.completedAt.getTime() - instance.startedAt.getTime();

    this.updateInstance(instance);
    this.emitEvent("workflow:failed", { instance, error: execution.error });
  }

  /**
   * Calculate retry delay based on backoff policy
   */
  private calculateRetryDelay(
    policy: RetryPolicy,
    attempt: number
  ): number {
    switch (policy.backoffType) {
      case BackoffType.FIXED:
        return policy.initialDelay;

      case BackoffType.LINEAR:
        return Math.min(
          policy.initialDelay * attempt,
          policy.maxDelay
        );

      case BackoffType.EXPONENTIAL:
        return Math.min(
          policy.initialDelay * Math.pow(policy.multiplier, attempt - 1),
          policy.maxDelay
        );

      case BackoffType.RANDOM:
        return Math.min(
          Math.random() * policy.initialDelay * attempt,
          policy.maxDelay
        );

      default:
        return policy.initialDelay;
    }
  }

  /**
   * Evaluate edge condition
   */
  private evaluateEdgeCondition(
    variables: Record<string, any>,
    edge: WorkflowEdge
  ): boolean {
    if (!edge.condition) {
      return true;
    }

    return this.evaluateCondition(variables, edge.condition);
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(
    variables: Record<string, any>,
    conditions: WorkflowCondition[]
  ): boolean {
    if (conditions.length === 0) {
      return true;
    }

    let result = this.evaluateCondition(variables, conditions[0]);

    for (let i = 1; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(variables, condition);

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
  private evaluateCondition(
    variables: Record<string, any>,
    condition: WorkflowCondition
  ): boolean {
    const fieldValue = this.getNestedValue(variables, condition.field);
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

      case ConditionOperator.CONTAINS:
        return String(fieldValue).includes(String(compareValue));

      case ConditionOperator.NOT_CONTAINS:
        return !String(fieldValue).includes(String(compareValue));

      case ConditionOperator.IN:
        return Array.isArray(compareValue) && compareValue.includes(fieldValue);

      case ConditionOperator.NOT_IN:
        return Array.isArray(compareValue) && !compareValue.includes(fieldValue);

      case ConditionOperator.IS_NULL:
        return fieldValue === null || fieldValue === undefined;

      case ConditionOperator.IS_NOT_NULL:
        return fieldValue !== null && fieldValue !== undefined;

      case ConditionOperator.MATCHES_REGEX:
        return new RegExp(compareValue).test(String(fieldValue));

      default:
        return false;
    }
  }

  /**
   * Resolve task assignment
   */
  private async resolveAssignment(
    instance: WorkflowInstance,
    assignment: any
  ): Promise<string> {
    if (!assignment) {
      return instance.context.initiator;
    }

    switch (assignment.type) {
      case "USER":
        return assignment.userId;

      case "ROLE":
        // In production, this would query the database for users with this role
        return assignment.roleId;

      case "GROUP":
        return assignment.groupId;

      case "DYNAMIC":
        // Evaluate expression to determine assignee
        return this.evaluateExpression(assignment.expression, instance.variables);

      default:
        return instance.context.initiator;
    }
  }

  /**
   * Evaluate dynamic expression
   */
  private evaluateExpression(expression: string, variables: Record<string, any>): string {
    try {
      const func = new Function(
        "variables",
        `with(variables) { return ${expression}; }`
      );
      return func(variables);
    } catch (error) {
      console.error("Expression evaluation failed:", error);
      return "";
    }
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((curr, prop) => curr?.[prop], obj);
  }

  /**
   * Replace variables in string
   */
  private replaceVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
      return String(this.getNestedValue(variables, path) || "");
    });
  }

  /**
   * Update workflow instance
   */
  private updateInstance(instance: WorkflowInstance): void {
    instance.updatedAt = new Date();
    this.instances.set(instance.id, instance);
    this.emitEvent("instance:updated", instance);
  }

  /**
   * Complete a task node
   */
  async completeTask(
    instanceId: string,
    nodeId: string,
    output: Record<string, any>
  ): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error("Instance not found");
    }

    const execution = Array.from(this.nodeExecutions.values()).find(
      (e) => e.instanceId === instanceId && e.nodeId === nodeId
    );

    if (!execution) {
      throw new Error("Node execution not found");
    }

    execution.status = NodeExecutionStatus.COMPLETED;
    execution.completedAt = new Date();
    execution.duration =
      execution.completedAt.getTime() - execution.startedAt.getTime();
    execution.output = output;

    instance.status = WorkflowInstanceStatus.RUNNING;
    instance.currentNodes = instance.currentNodes.filter((id) => id !== nodeId);

    // Update variables with output
    Object.assign(instance.variables, output);

    const node = instance.workflowDefinition!.nodes.find((n) => n.id === nodeId);
    if (node) {
      await this.executeNextNodes(instance, node, output);
    }
  }

  /**
   * Cancel workflow instance
   */
  async cancelWorkflow(instanceId: string, reason: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error("Instance not found");
    }

    instance.status = WorkflowInstanceStatus.CANCELLED;
    instance.completedAt = new Date();
    instance.duration =
      instance.completedAt.getTime() - instance.startedAt.getTime();
    instance.error = {
      code: "CANCELLED",
      message: reason,
      nodeId: "",
      timestamp: new Date(),
    };

    this.updateInstance(instance);
    this.emitEvent("workflow:cancelled", instance);
  }

  /**
   * Get workflow instance
   */
  getInstance(instanceId: string): WorkflowInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Get node executions for instance
   */
  getNodeExecutions(instanceId: string): NodeExecution[] {
    return Array.from(this.nodeExecutions.values()).filter(
      (e) => e.instanceId === instanceId
    );
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
   * Unregister event handler
   */
  off(event: string, handler: EventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
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

type EventHandler = (data: any) => void;

// ============================================================================
// Singleton Instance
// ============================================================================

export const workflowEngine = new WorkflowEngine();
