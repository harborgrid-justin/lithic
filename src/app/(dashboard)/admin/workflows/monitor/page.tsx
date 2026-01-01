/**
 * Workflow Monitor Page
 * Monitor active workflow instances with performance metrics
 */

"use client";

import React from "react";
import { useWorkflowStore } from "@/stores/workflow-store";
import { WorkflowNode } from "@/components/workflow/WorkflowNode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowInstanceStatus, WorkflowPriority } from "@/types/workflow";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Pause,
  Play,
  TrendingUp,
  Zap as _Zap,
} from "lucide-react";
import { format } from "date-fns";

export default function WorkflowMonitorPage() {
  const { workflowInstances, activeInstances: _activeInstances, setActiveInstances: _setActiveInstances } = useWorkflowStore();

  const [selectedInstance, setSelectedInstance] = React.useState<any>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Calculate stats
  const stats = {
    total: workflowInstances.length,
    running: workflowInstances.filter((i) => i.status === WorkflowInstanceStatus.RUNNING).length,
    completed: workflowInstances.filter((i) => i.status === WorkflowInstanceStatus.COMPLETED).length,
    failed: workflowInstances.filter((i) => i.status === WorkflowInstanceStatus.FAILED).length,
    avgDuration: workflowInstances
      .filter((i) => i.duration)
      .reduce((sum, i) => sum + (i.duration || 0), 0) /
      Math.max(workflowInstances.filter((i) => i.duration).length, 1),
  };

  // Filter instances
  const filteredInstances = React.useMemo(() => {
    if (statusFilter === "all") return workflowInstances;
    return workflowInstances.filter((i) => i.status === statusFilter);
  }, [workflowInstances, statusFilter]);

  const statusConfig = {
    [WorkflowInstanceStatus.PENDING]: { color: "bg-gray-500", icon: Clock },
    [WorkflowInstanceStatus.RUNNING]: { color: "bg-blue-500", icon: Play },
    [WorkflowInstanceStatus.WAITING]: { color: "bg-yellow-500", icon: Pause },
    [WorkflowInstanceStatus.COMPLETED]: { color: "bg-green-500", icon: CheckCircle },
    [WorkflowInstanceStatus.FAILED]: { color: "bg-red-500", icon: XCircle },
    [WorkflowInstanceStatus.CANCELLED]: { color: "bg-gray-400", icon: XCircle },
    [WorkflowInstanceStatus.SUSPENDED]: { color: "bg-orange-500", icon: Pause },
  };

  const priorityColors = {
    [WorkflowPriority.LOW]: "bg-gray-400",
    [WorkflowPriority.NORMAL]: "bg-blue-500",
    [WorkflowPriority.HIGH]: "bg-yellow-500",
    [WorkflowPriority.URGENT]: "bg-orange-500",
    [WorkflowPriority.CRITICAL]: "bg-red-600",
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "N/A";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Workflow Monitor</h1>
        <p className="text-gray-600 mt-1">
          Monitor workflow execution and performance metrics
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Instances</div>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stats.running}</div>
              <div className="text-sm text-gray-600">Running</div>
            </div>
            <Play className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stats.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div>
              <div className="text-sm text-gray-600">Avg Duration</div>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(WorkflowInstanceStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Instance List */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Workflow Instances ({filteredInstances.length})
          </h2>

          {filteredInstances.length === 0 ? (
            <Card className="p-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No instances found</h3>
              <p className="text-gray-600">
                Start a workflow to see it here
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredInstances.map((instance) => {
                const config = statusConfig[instance.status];
                const Icon = config.icon;
                const isSelected = selectedInstance?.id === instance.id;

                return (
                  <Card
                    key={instance.id}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => setSelectedInstance(instance)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`${config.color} p-2 rounded text-white`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{instance.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              ID: {instance.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={config.color}>
                            {instance.status}
                          </Badge>
                          <Badge className={priorityColors[instance.priority]}>
                            {instance.priority}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Started:</span>{" "}
                          {format(new Date(instance.startedAt), "MMM d, HH:mm")}
                        </div>
                        {instance.completedAt && (
                          <div>
                            <span className="text-gray-600">Completed:</span>{" "}
                            {format(new Date(instance.completedAt), "MMM d, HH:mm")}
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Duration:</span>{" "}
                          {formatDuration(instance.duration)}
                        </div>
                        <div>
                          <span className="text-gray-600">Current Nodes:</span>{" "}
                          {instance.currentNodes.length}
                        </div>
                      </div>

                      {instance.error && (
                        <div className="p-2 bg-red-50 rounded text-sm text-red-700">
                          <AlertCircle className="h-4 w-4 inline mr-1" />
                          {instance.error.message}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Instance Details */}
        {selectedInstance && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Instance Details</h2>

            <Card className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Workflow Steps</h3>
                <div className="space-y-2">
                  {selectedInstance.workflowDefinition?.nodes.map((node: any) => {
                    const isActive = selectedInstance.currentNodes.includes(node.id);
                    const isCompleted = false; // Would be determined from execution history

                    return (
                      <WorkflowNode
                        key={node.id}
                        node={node}
                        isActive={isActive}
                        isCompleted={isCompleted}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Context</h3>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  {selectedInstance.context.patientId && (
                    <div>
                      <span className="font-medium">Patient ID:</span>{" "}
                      {selectedInstance.context.patientId}
                    </div>
                  )}
                  {selectedInstance.context.encounterId && (
                    <div>
                      <span className="font-medium">Encounter ID:</span>{" "}
                      {selectedInstance.context.encounterId}
                    </div>
                  )}
                  {selectedInstance.context.initiator && (
                    <div>
                      <span className="font-medium">Initiated by:</span>{" "}
                      {selectedInstance.context.initiator}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  View Details
                </Button>
                {selectedInstance.status === WorkflowInstanceStatus.RUNNING && (
                  <Button variant="danger" className="flex-1">
                    Cancel
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
