"use client";

/**
 * TasksWidget - Active Tasks and To-Do Items
 * Displays user's task list with priority and status
 */

import { useState } from "react";
import { CheckCircle2, Circle, Clock, Flag, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatTime } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in-progress" | "completed";
  dueTime?: string;
  category: string;
}

interface TasksWidgetProps {
  className?: string;
  maxItems?: number;
}

// ============================================================================
// Mock Data
// ============================================================================

const mockTasks: Task[] = [
  {
    id: "t1",
    title: "Review lab results for Patient #1247",
    description: "CBC and metabolic panel results ready",
    priority: "high",
    status: "pending",
    dueTime: "10:00 AM",
    category: "Clinical",
  },
  {
    id: "t2",
    title: "Sign prescription refills",
    description: "5 pending refill requests",
    priority: "medium",
    status: "pending",
    dueTime: "11:30 AM",
    category: "Pharmacy",
  },
  {
    id: "t3",
    title: "Complete discharge summary",
    description: "Patient: Sarah Johnson",
    priority: "urgent",
    status: "in-progress",
    dueTime: "2:00 PM",
    category: "Documentation",
  },
  {
    id: "t4",
    title: "Respond to consultation request",
    description: "Cardiology consult needed",
    priority: "high",
    status: "pending",
    category: "Referrals",
  },
  {
    id: "t5",
    title: "Update care plan",
    description: "Diabetes management protocol",
    priority: "medium",
    status: "pending",
    category: "Care Plans",
  },
];

// ============================================================================
// Component
// ============================================================================

export function TasksWidget({ className, maxItems = 5 }: TasksWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const toggleTaskStatus = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === "completed" ? "pending" : "completed",
            }
          : task,
      ),
    );
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "low":
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const displayTasks = tasks.slice(0, maxItems);
  const pendingCount = tasks.filter((t) => t.status !== "completed").length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">
            {pendingCount} Pending Task{pendingCount !== 1 ? "s" : ""}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700"
        >
          View All
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {displayTasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "group flex items-start gap-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors",
              task.status === "completed" && "opacity-60",
            )}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleTaskStatus(task.id)}
              className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
              aria-label={
                task.status === "completed"
                  ? "Mark as incomplete"
                  : "Mark as complete"
              }
            >
              {task.status === "completed" ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium text-gray-900",
                      task.status === "completed" &&
                        "line-through text-gray-500",
                    )}
                  >
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-gray-600 mt-1">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Task</DropdownMenuItem>
                    <DropdownMenuItem>Change Priority</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Task Meta */}
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium",
                    getPriorityColor(task.priority),
                  )}
                >
                  <Flag className="w-3 h-3 mr-1" />
                  {task.priority}
                </Badge>

                <span className="text-xs text-gray-500">{task.category}</span>

                {task.dueTime && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    {task.dueTime}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {displayTasks.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900">No tasks yet</p>
          <p className="text-xs text-gray-500 mt-1">
            All caught up! Create a new task to get started.
          </p>
        </div>
      )}
    </div>
  );
}
