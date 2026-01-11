/**
 * Goal Tracker Widget Component
 * Agent 5: Patient Engagement Platform
 */

"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { HealthGoal, GoalStatus } from "@/types/engagement";
import { Target, TrendingUp, Calendar, Award } from "lucide-react";

interface GoalTrackerProps {
  goal: HealthGoal;
  onUpdateProgress?: (value: number) => void;
  onViewDetails?: (goal: HealthGoal) => void;
  className?: string;
}

export function GoalTracker({
  goal,
  onUpdateProgress,
  onViewDetails,
  className,
}: GoalTrackerProps) {
  const progressPercentage = (goal.currentValue / goal.targetValue) * 100;
  const daysRemaining = Math.ceil(
    (new Date(goal.targetDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const statusColors: Record<GoalStatus, string> = {
    ACTIVE: "bg-blue-500",
    COMPLETED: "bg-green-500",
    ABANDONED: "bg-gray-500",
    ON_HOLD: "bg-yellow-500",
    OVERDUE: "bg-red-500",
  };

  const statusLabels: Record<GoalStatus, string> = {
    ACTIVE: "Active",
    COMPLETED: "Completed",
    ABANDONED: "Abandoned",
    ON_HOLD: "On Hold",
    OVERDUE: "Overdue",
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">{goal.title}</CardTitle>
          </div>
          <CardDescription className="mt-1">{goal.description}</CardDescription>
        </div>
        <Badge variant="outline" className={statusColors[goal.status]}>
          {statusLabels[goal.status]}
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {goal.currentValue} / {goal.targetValue} {goal.unit}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="text-xs text-muted-foreground text-right">
              {progressPercentage.toFixed(1)}% complete
            </div>
          </div>

          {/* Milestones */}
          {goal.milestones.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Milestones</div>
              <div className="flex flex-wrap gap-2">
                {goal.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                      milestone.achievedDate
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {milestone.achievedDate && (
                      <Award className="h-3 w-3" />
                    )}
                    {milestone.value} {goal.unit}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Days Left</div>
                <div className="font-medium">
                  {daysRemaining > 0 ? daysRemaining : "Overdue"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Priority</div>
                <div className="font-medium capitalize">{goal.priority.toLowerCase()}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {onUpdateProgress && goal.status === "ACTIVE" && (
              <Button
                size="sm"
                onClick={() => onUpdateProgress(goal.currentValue + 1)}
                className="flex-1"
              >
                Update Progress
              </Button>
            )}
            {onViewDetails && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewDetails(goal)}
                className="flex-1"
              >
                View Details
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
