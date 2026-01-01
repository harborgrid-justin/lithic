/**
 * Workflow Store - Zustand State Management
 * Manages workflow state, tasks, approvals, and notifications
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  WorkflowDefinition,
  WorkflowInstance,
  Task,
  ApprovalRequest,
  Notification,
  CareProtocol,
  ProtocolExecution,
  TaskStatus,
  TaskPriority,
  ApprovalStatus,
  NotificationStatus,
} from "@/types/workflow";

// ============================================================================
// Store State Interface
// ============================================================================

interface WorkflowState {
  // Workflow Definitions
  workflowDefinitions: WorkflowDefinition[];
  selectedWorkflow: WorkflowDefinition | null;

  // Workflow Instances
  workflowInstances: WorkflowInstance[];
  activeInstances: WorkflowInstance[];

  // Tasks
  tasks: Task[];
  myTasks: Task[];
  teamTasks: Task[];
  selectedTask: Task | null;

  // Approvals
  approvalRequests: ApprovalRequest[];
  pendingApprovals: ApprovalRequest[];
  selectedApproval: ApprovalRequest | null;

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // Care Protocols
  careProtocols: CareProtocol[];
  protocolExecutions: ProtocolExecution[];

  // UI State
  taskFilter: TaskFilter;
  approvalFilter: ApprovalFilter;
  isLoading: boolean;
  error: string | null;

  // Designer State
  designerNodes: any[];
  designerEdges: any[];
  designerViewport: { x: number; y: number; zoom: number };

  // Actions - Workflows
  setWorkflowDefinitions: (definitions: WorkflowDefinition[]) => void;
  setSelectedWorkflow: (workflow: WorkflowDefinition | null) => void;
  addWorkflowDefinition: (workflow: WorkflowDefinition) => void;
  updateWorkflowDefinition: (id: string, updates: Partial<WorkflowDefinition>) => void;
  deleteWorkflowDefinition: (id: string) => void;

  // Actions - Workflow Instances
  setWorkflowInstances: (instances: WorkflowInstance[]) => void;
  addWorkflowInstance: (instance: WorkflowInstance) => void;
  updateWorkflowInstance: (id: string, updates: Partial<WorkflowInstance>) => void;
  setActiveInstances: (instances: WorkflowInstance[]) => void;

  // Actions - Tasks
  setTasks: (tasks: Task[]) => void;
  setMyTasks: (tasks: Task[]) => void;
  setTeamTasks: (tasks: Task[]) => void;
  setSelectedTask: (task: Task | null) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setTaskFilter: (filter: Partial<TaskFilter>) => void;
  clearTaskFilter: () => void;

  // Actions - Approvals
  setApprovalRequests: (requests: ApprovalRequest[]) => void;
  setPendingApprovals: (requests: ApprovalRequest[]) => void;
  setSelectedApproval: (approval: ApprovalRequest | null) => void;
  addApprovalRequest: (request: ApprovalRequest) => void;
  updateApprovalRequest: (id: string, updates: Partial<ApprovalRequest>) => void;
  setApprovalFilter: (filter: Partial<ApprovalFilter>) => void;
  clearApprovalFilter: () => void;

  // Actions - Notifications
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;

  // Actions - Care Protocols
  setCareProtocols: (protocols: CareProtocol[]) => void;
  setProtocolExecutions: (executions: ProtocolExecution[]) => void;
  addCareProtocol: (protocol: CareProtocol) => void;
  updateCareProtocol: (id: string, updates: Partial<CareProtocol>) => void;
  addProtocolExecution: (execution: ProtocolExecution) => void;
  updateProtocolExecution: (id: string, updates: Partial<ProtocolExecution>) => void;

  // Actions - UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Actions - Designer
  setDesignerNodes: (nodes: any[]) => void;
  setDesignerEdges: (edges: any[]) => void;
  setDesignerViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  addDesignerNode: (node: any) => void;
  updateDesignerNode: (id: string, updates: any) => void;
  deleteDesignerNode: (id: string) => void;
  addDesignerEdge: (edge: any) => void;
  deleteDesignerEdge: (id: string) => void;
  clearDesigner: () => void;

  // Utility Actions
  reset: () => void;
}

interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignedTo?: string;
  category?: string[];
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface ApprovalFilter {
  status?: ApprovalStatus[];
  requestedBy?: string;
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// ============================================================================
// Initial State
// ============================================================================

const initialTaskFilter: TaskFilter = {};
const initialApprovalFilter: ApprovalFilter = {};

// ============================================================================
// Store Implementation
// ============================================================================

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      // Initial State
      workflowDefinitions: [],
      selectedWorkflow: null,
      workflowInstances: [],
      activeInstances: [],
      tasks: [],
      myTasks: [],
      teamTasks: [],
      selectedTask: null,
      approvalRequests: [],
      pendingApprovals: [],
      selectedApproval: null,
      notifications: [],
      unreadCount: 0,
      careProtocols: [],
      protocolExecutions: [],
      taskFilter: initialTaskFilter,
      approvalFilter: initialApprovalFilter,
      isLoading: false,
      error: null,
      designerNodes: [],
      designerEdges: [],
      designerViewport: { x: 0, y: 0, zoom: 1 },

      // Workflow Definitions Actions
      setWorkflowDefinitions: (definitions) =>
        set({ workflowDefinitions: definitions }),

      setSelectedWorkflow: (workflow) =>
        set({ selectedWorkflow: workflow }),

      addWorkflowDefinition: (workflow) =>
        set((state) => ({
          workflowDefinitions: [...state.workflowDefinitions, workflow],
        })),

      updateWorkflowDefinition: (id, updates) =>
        set((state) => ({
          workflowDefinitions: state.workflowDefinitions.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        })),

      deleteWorkflowDefinition: (id) =>
        set((state) => ({
          workflowDefinitions: state.workflowDefinitions.filter((w) => w.id !== id),
          selectedWorkflow:
            state.selectedWorkflow?.id === id ? null : state.selectedWorkflow,
        })),

      // Workflow Instances Actions
      setWorkflowInstances: (instances) =>
        set({ workflowInstances: instances }),

      addWorkflowInstance: (instance) =>
        set((state) => ({
          workflowInstances: [...state.workflowInstances, instance],
        })),

      updateWorkflowInstance: (id, updates) =>
        set((state) => ({
          workflowInstances: state.workflowInstances.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        })),

      setActiveInstances: (instances) =>
        set({ activeInstances: instances }),

      // Tasks Actions
      setTasks: (tasks) => {
        const unreadCount = tasks.filter(
          (t) => t.status === TaskStatus.ASSIGNED || t.status === TaskStatus.PENDING
        ).length;
        set({ tasks, unreadCount });
      },

      setMyTasks: (tasks) =>
        set({ myTasks: tasks }),

      setTeamTasks: (tasks) =>
        set({ teamTasks: tasks }),

      setSelectedTask: (task) =>
        set({ selectedTask: task }),

      addTask: (task) =>
        set((state) => ({
          tasks: [task, ...state.tasks],
          myTasks: task.assignedTo === get().selectedTask?.assignedTo
            ? [task, ...state.myTasks]
            : state.myTasks,
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
          myTasks: state.myTasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
          teamTasks: state.teamTasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
          selectedTask:
            state.selectedTask?.id === id
              ? { ...state.selectedTask, ...updates }
              : state.selectedTask,
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          myTasks: state.myTasks.filter((t) => t.id !== id),
          teamTasks: state.teamTasks.filter((t) => t.id !== id),
          selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
        })),

      setTaskFilter: (filter) =>
        set((state) => ({
          taskFilter: { ...state.taskFilter, ...filter },
        })),

      clearTaskFilter: () =>
        set({ taskFilter: initialTaskFilter }),

      // Approvals Actions
      setApprovalRequests: (requests) =>
        set({ approvalRequests: requests }),

      setPendingApprovals: (requests) =>
        set({ pendingApprovals: requests }),

      setSelectedApproval: (approval) =>
        set({ selectedApproval: approval }),

      addApprovalRequest: (request) =>
        set((state) => ({
          approvalRequests: [request, ...state.approvalRequests],
          pendingApprovals:
            request.status === ApprovalStatus.PENDING
              ? [request, ...state.pendingApprovals]
              : state.pendingApprovals,
        })),

      updateApprovalRequest: (id, updates) =>
        set((state) => ({
          approvalRequests: state.approvalRequests.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
          pendingApprovals: state.pendingApprovals.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
          selectedApproval:
            state.selectedApproval?.id === id
              ? { ...state.selectedApproval, ...updates }
              : state.selectedApproval,
        })),

      setApprovalFilter: (filter) =>
        set((state) => ({
          approvalFilter: { ...state.approvalFilter, ...filter },
        })),

      clearApprovalFilter: () =>
        set({ approvalFilter: initialApprovalFilter }),

      // Notifications Actions
      setNotifications: (notifications) => {
        const unreadCount = notifications.filter(
          (n) => n.status !== NotificationStatus.READ
        ).length;
        set({ notifications, unreadCount });
      },

      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount:
            notification.status !== NotificationStatus.READ
              ? state.unreadCount + 1
              : state.unreadCount,
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, status: NotificationStatus.READ, readAt: new Date() } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            status: NotificationStatus.READ,
            readAt: new Date(),
          })),
          unreadCount: 0,
        })),

      deleteNotification: (id) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount:
              notification && notification.status !== NotificationStatus.READ
                ? Math.max(0, state.unreadCount - 1)
                : state.unreadCount,
          };
        }),

      clearNotifications: () =>
        set({ notifications: [], unreadCount: 0 }),

      // Care Protocols Actions
      setCareProtocols: (protocols) =>
        set({ careProtocols: protocols }),

      setProtocolExecutions: (executions) =>
        set({ protocolExecutions: executions }),

      addCareProtocol: (protocol) =>
        set((state) => ({
          careProtocols: [...state.careProtocols, protocol],
        })),

      updateCareProtocol: (id, updates) =>
        set((state) => ({
          careProtocols: state.careProtocols.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      addProtocolExecution: (execution) =>
        set((state) => ({
          protocolExecutions: [...state.protocolExecutions, execution],
        })),

      updateProtocolExecution: (id, updates) =>
        set((state) => ({
          protocolExecutions: state.protocolExecutions.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      // UI Actions
      setLoading: (loading) =>
        set({ isLoading: loading }),

      setError: (error) =>
        set({ error }),

      clearError: () =>
        set({ error: null }),

      // Designer Actions
      setDesignerNodes: (nodes) =>
        set({ designerNodes: nodes }),

      setDesignerEdges: (edges) =>
        set({ designerEdges: edges }),

      setDesignerViewport: (viewport) =>
        set({ designerViewport: viewport }),

      addDesignerNode: (node) =>
        set((state) => ({
          designerNodes: [...state.designerNodes, node],
        })),

      updateDesignerNode: (id, updates) =>
        set((state) => ({
          designerNodes: state.designerNodes.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        })),

      deleteDesignerNode: (id) =>
        set((state) => ({
          designerNodes: state.designerNodes.filter((n) => n.id !== id),
          designerEdges: state.designerEdges.filter(
            (e) => e.source !== id && e.target !== id
          ),
        })),

      addDesignerEdge: (edge) =>
        set((state) => ({
          designerEdges: [...state.designerEdges, edge],
        })),

      deleteDesignerEdge: (id) =>
        set((state) => ({
          designerEdges: state.designerEdges.filter((e) => e.id !== id),
        })),

      clearDesigner: () =>
        set({
          designerNodes: [],
          designerEdges: [],
          designerViewport: { x: 0, y: 0, zoom: 1 },
        }),

      // Utility Actions
      reset: () =>
        set({
          workflowDefinitions: [],
          selectedWorkflow: null,
          workflowInstances: [],
          activeInstances: [],
          tasks: [],
          myTasks: [],
          teamTasks: [],
          selectedTask: null,
          approvalRequests: [],
          pendingApprovals: [],
          selectedApproval: null,
          notifications: [],
          unreadCount: 0,
          careProtocols: [],
          protocolExecutions: [],
          taskFilter: initialTaskFilter,
          approvalFilter: initialApprovalFilter,
          isLoading: false,
          error: null,
          designerNodes: [],
          designerEdges: [],
          designerViewport: { x: 0, y: 0, zoom: 1 },
        }),
    }),
    {
      name: "workflow-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist user preferences
        taskFilter: state.taskFilter,
        approvalFilter: state.approvalFilter,
        designerViewport: state.designerViewport,
      }),
    }
  )
);

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const selectFilteredTasks = (state: WorkflowState): Task[] => {
  let filtered = state.tasks;

  if (state.taskFilter.status && state.taskFilter.status.length > 0) {
    filtered = filtered.filter((t) => state.taskFilter.status!.includes(t.status));
  }

  if (state.taskFilter.priority && state.taskFilter.priority.length > 0) {
    filtered = filtered.filter((t) => state.taskFilter.priority!.includes(t.priority));
  }

  if (state.taskFilter.category && state.taskFilter.category.length > 0) {
    filtered = filtered.filter((t) => state.taskFilter.category!.includes(t.category));
  }

  if (state.taskFilter.assignedTo) {
    filtered = filtered.filter((t) => t.assignedTo === state.taskFilter.assignedTo);
  }

  if (state.taskFilter.search) {
    const search = state.taskFilter.search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
    );
  }

  if (state.taskFilter.dateRange) {
    filtered = filtered.filter(
      (t) =>
        t.createdAt >= state.taskFilter.dateRange!.start &&
        t.createdAt <= state.taskFilter.dateRange!.end
    );
  }

  return filtered;
};

export const selectFilteredApprovals = (state: WorkflowState): ApprovalRequest[] => {
  let filtered = state.approvalRequests;

  if (state.approvalFilter.status && state.approvalFilter.status.length > 0) {
    filtered = filtered.filter((a) => state.approvalFilter.status!.includes(a.status));
  }

  if (state.approvalFilter.requestedBy) {
    filtered = filtered.filter((a) => a.requestedBy === state.approvalFilter.requestedBy);
  }

  if (state.approvalFilter.search) {
    const search = state.approvalFilter.search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(search) ||
        a.description.toLowerCase().includes(search)
    );
  }

  if (state.approvalFilter.dateRange) {
    filtered = filtered.filter(
      (a) =>
        a.requestedAt >= state.approvalFilter.dateRange!.start &&
        a.requestedAt <= state.approvalFilter.dateRange!.end
    );
  }

  return filtered;
};

export const selectUnreadNotifications = (state: WorkflowState): Notification[] => {
  return state.notifications.filter((n) => n.status !== NotificationStatus.READ);
};

export const selectTasksByPriority = (state: WorkflowState): Record<TaskPriority, Task[]> => {
  const grouped: Record<TaskPriority, Task[]> = {
    LOW: [],
    NORMAL: [],
    HIGH: [],
    URGENT: [],
    CRITICAL: [],
  };

  state.tasks.forEach((task) => {
    grouped[task.priority].push(task);
  });

  return grouped;
};
