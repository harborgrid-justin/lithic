/**
 * Workflow Node - Workflow Node Component
 */

"use client";

import React from "react";
import { WorkflowNode as WorkflowNodeType, NodeType } from "@/types/workflow";
import { Card } from "@/components/ui/card";
import {
  Play,
  Square,
  CheckCircle,
  GitBranch,
  Clock,
  Send,
  Users,
  Code,
  Zap,
} from "lucide-react";

interface WorkflowNodeProps {
  node: WorkflowNodeType;
  isActive?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
}

export function WorkflowNode({
  node,
  isActive = false,
  isCompleted = false,
  onClick,
}: WorkflowNodeProps) {
  const nodeTypeConfig = {
    [NodeType.START]: { icon: Play, color: "bg-green-500", label: "Start" },
    [NodeType.END]: { icon: Square, color: "bg-red-500", label: "End" },
    [NodeType.TASK]: { icon: CheckCircle, color: "bg-blue-500", label: "Task" },
    [NodeType.DECISION]: { icon: GitBranch, color: "bg-yellow-500", label: "Decision" },
    [NodeType.PARALLEL]: { icon: Zap, color: "bg-purple-500", label: "Parallel" },
    [NodeType.JOIN]: { icon: Zap, color: "bg-purple-500", label: "Join" },
    [NodeType.WAIT]: { icon: Clock, color: "bg-purple-500", label: "Wait" },
    [NodeType.SUBPROCESS]: { icon: Zap, color: "bg-indigo-500", label: "Subprocess" },
    [NodeType.API_CALL]: { icon: Zap, color: "bg-teal-500", label: "API Call" },
    [NodeType.NOTIFICATION]: { icon: Send, color: "bg-orange-500", label: "Notify" },
    [NodeType.APPROVAL]: { icon: Users, color: "bg-indigo-500", label: "Approval" },
    [NodeType.SCRIPT]: { icon: Code, color: "bg-gray-500", label: "Script" },
  };

  const config = nodeTypeConfig[node.type] || nodeTypeConfig[NodeType.TASK];
  const Icon = config.icon;

  return (
    <Card
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all ${
        isActive ? "ring-2 ring-blue-500 shadow-lg" : ""
      } ${isCompleted ? "opacity-70" : ""} ${
        onClick ? "hover:shadow-md" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`${config.color} p-2 rounded ${
            isCompleted ? "opacity-50" : ""
          }`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{node.name}</div>
          <div className="text-xs text-gray-500">{config.label}</div>
        </div>
        {isActive && (
          <div className="flex-shrink-0">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
          </div>
        )}
        {isCompleted && (
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
        )}
      </div>
      {node.description && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
          {node.description}
        </p>
      )}
    </Card>
  );
}
