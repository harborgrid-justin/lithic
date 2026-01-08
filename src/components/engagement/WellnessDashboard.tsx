/**
 * Wellness Dashboard Component
 * Agent 5: Patient Engagement Platform
 */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { ProgramEnrollment } from "@/types/engagement";
import { BookOpen, CheckCircle2, Clock } from "lucide-react";

interface WellnessDashboardProps {
  enrollments: ProgramEnrollment[];
  className?: string;
}

export function WellnessDashboard({ enrollments, className }: WellnessDashboardProps) {
  const active = enrollments.filter((e) => e.status === "ACTIVE");
  const completed = enrollments.filter((e) => e.status === "COMPLETED");

  return (
    <div className={`space-y-4 ${className || ""}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{active.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {active.length > 0
                ? Math.round(active.reduce((sum, e) => sum + e.progress, 0) / active.length)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Programs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {enrollments.map((enrollment) => (
            <div key={enrollment.id} className="space-y-2 pb-4 border-b last:border-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{enrollment.program.name}</h4>
                  <p className="text-sm text-muted-foreground">{enrollment.program.description}</p>
                </div>
                <Badge variant={enrollment.status === "ACTIVE" ? "default" : "secondary"}>
                  {enrollment.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Week {enrollment.currentWeek}</span>
                  <span className="font-medium">{enrollment.progress}%</span>
                </div>
                <Progress value={enrollment.progress} className="h-2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
