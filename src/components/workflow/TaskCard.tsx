/**
 * Task Card - Task Display Component
 * Displays task information with priority, status, and actions
 */

"use client";

import React from "react";
import { Task, TaskPriority, TaskStatus } from "@/types/workflow";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Flag,
  MoreVertical,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

// ============================================================================
// Component
// ============================================================================

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  compact?: boolean;
}

export function TaskCard({ task, onClick, onComplete, onCancel, compact = false }: TaskCardProps) {
  const priorityConfig = {
    [TaskPriority.CRITICAL]: { color: "bg-red-600", label: "Critical", icon: AlertCircle },
    [TaskPriority.URGENT]: { color: "bg-orange-500", label: "Urgent", icon: AlertCircle },
    [TaskPriority.HIGH]: { color: "bg-yellow-500", label: "High", icon: Flag },
    [TaskPriority.NORMAL]: { color: "bg-blue-500", label: "Normal", icon: Flag },
    [TaskPriority.LOW]: { color: "bg-gray-400", label: "Low", icon: Flag },
  };

  const statusConfig = {
    [TaskStatus.PENDING]: { color: "bg-gray-500", label: "Pending" },
    [TaskStatus.ASSIGNED]: { color: "bg-blue-500", label: "Assigned" },
    [TaskStatus.IN_PROGRESS]: { color: "bg-purple-500", label: "In Progress" },
    [TaskStatus.WAITING]: { color: "bg-yellow-500", label: "Waiting" },
    [TaskStatus.BLOCKED]: { color: "bg-red-500", label: "Blocked" },
    [TaskStatus.COMPLETED]: { color: "bg-green-500", label: "Completed" },
    [TaskStatus.CANCELLED]: { color: "bg-gray-400", label: "Cancelled" },
    [TaskStatus.OVERDUE]: { color: "bg-red-600", label: "Overdue" },
    [TaskStatus.ESCALATED]: { color: "bg-orange-600", label: "Escalated" },
  };

  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const PriorityIcon = priority.icon;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED;

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`${priority.color} p-1.5 rounded text-white`}>
            <PriorityIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{task.title}</div>
            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
              {task.dueDate && (
                <span className={isOverdue ? "text-red-600" : ""}>
                  {format(new Date(task.dueDate), "MMM d")}
                </span>
              )}
              <Badge variant="secondary" className="text-xs">
                {status.label}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`${priority.color} p-2 rounded text-white`}>
              <PriorityIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{task.title}</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          <Badge className={status.color}>{status.label}</Badge>
          <Badge variant="outline">{task.category}</Badge>
          {isOverdue && (
            <Badge variant="danger">
              <AlertCircle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {task.dueDate && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Due: {format(new Date(task.dueDate), "MMM d, yyyy")}</span>
            </div>
          )}
          {task.estimatedDuration && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{task.estimatedDuration} min</span>
            </div>
          )}
          {task.assignedTo && (
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4" />
              <span className="truncate">Assigned to {task.assignedTo}</span>
            </div>
          )}
        </div>

        {/* Checklist Progress */}
        {task.checklist && task.checklist.length > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">
                {task.checklist.filter((i) => i.completed).length}/{task.checklist.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${(task.checklist.filter((i) => i.completed).length / task.checklist.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            onClick={onClick}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          {task.status !== TaskStatus.COMPLETED && onComplete && (
            <Button
              onClick={onComplete}
              variant="default"
              size="sm"
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
