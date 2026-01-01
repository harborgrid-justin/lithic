/**
 * Task Inbox Page
 * Personal task queue with filtering and quick actions
 */

"use client";

import React from "react";
import { useWorkflowStore, selectFilteredTasks } from "@/stores/workflow-store";
import { TaskCard } from "@/components/workflow/TaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskStatus, TaskPriority, TaskCategory } from "@/types/workflow";
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Inbox,
  Users,
} from "lucide-react";

export default function TaskInboxPage() {
  const {
    myTasks,
    teamTasks,
    taskFilter,
    setTaskFilter,
    clearTaskFilter,
    setSelectedTask,
  } = useWorkflowStore();

  const [view, setView] = React.useState<"my" | "team">("my");
  const [searchQuery, setSearchQuery] = React.useState("");

  const tasks = view === "my" ? myTasks : teamTasks;

  // Filter tasks
  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !task.title.toLowerCase().includes(query) &&
          !task.description.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      if (taskFilter.status && taskFilter.status.length > 0) {
        if (!taskFilter.status.includes(task.status)) return false;
      }

      if (taskFilter.priority && taskFilter.priority.length > 0) {
        if (!taskFilter.priority.includes(task.priority)) return false;
      }

      if (taskFilter.category && taskFilter.category.length > 0) {
        if (!taskFilter.category.includes(task.category)) return false;
      }

      return true;
    });
  }, [tasks, searchQuery, taskFilter]);

  // Calculate stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === TaskStatus.PENDING).length,
    inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    overdue: tasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        t.status !== TaskStatus.COMPLETED
    ).length,
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    // Navigate to task detail
    window.location.href = `/tasks/${task.id}`;
  };

  const handleCompleteTask = async (taskId: string) => {
    console.log("Completing task:", taskId);
    // In production, this would call the API
    alert("Task completed!");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Task Inbox</h1>
        <p className="text-gray-600 mt-1">
          Manage your assigned tasks and team workload
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            <Inbox className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stats.overdue}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={view === "my" ? "default" : "outline"}
              onClick={() => setView("my")}
            >
              <Inbox className="h-4 w-4 mr-2" />
              My Tasks ({myTasks.length})
            </Button>
            <Button
              variant={view === "team" ? "default" : "outline"}
              onClick={() => setView("team")}
            >
              <Users className="h-4 w-4 mr-2" />
              Team Tasks ({teamTasks.length})
            </Button>
          </div>

          <Button variant="outline" onClick={clearTaskFilter}>
            Clear Filters
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={taskFilter.status?.[0] || "all"}
            onValueChange={(value) => {
              if (value === "all") {
                setTaskFilter({ status: [] });
              } else {
                setTaskFilter({ status: [value as TaskStatus] });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.values(TaskStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={taskFilter.priority?.[0] || "all"}
            onValueChange={(value) => {
              if (value === "all") {
                setTaskFilter({ priority: [] });
              } else {
                setTaskFilter({ priority: [value as TaskPriority] });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {Object.values(TaskPriority).map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={taskFilter.category?.[0] || "all"}
            onValueChange={(value) => {
              if (value === "all") {
                setTaskFilter({ category: [] });
              } else {
                setTaskFilter({ category: [value] });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.values(TaskCategory).map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {filteredTasks.length} Task{filteredTasks.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <Inbox className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No tasks found</h3>
            <p className="text-gray-600">
              {tasks.length === 0
                ? "You don't have any tasks assigned."
                : "Try adjusting your filters to see more tasks."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => handleTaskClick(task)}
                onComplete={() => handleCompleteTask(task.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
