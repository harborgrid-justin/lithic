/**
 * Streak Counter Component
 * Agent 5: Patient Engagement Platform
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Snowflake } from "lucide-react";
import type { Streak } from "@/types/engagement";

interface StreakCounterProps {
  streak: Streak;
  size?: "sm" | "md" | "lg";
  showFreeze?: boolean;
  className?: string;
}

export function StreakCounter({
  streak,
  size = "md",
  showFreeze = true,
  className,
}: StreakCounterProps) {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Flame
              className={`${
                streak.isActive ? "text-orange-500 animate-pulse" : "text-gray-400"
              } ${size === "lg" ? "h-16 w-16" : size === "md" ? "h-12 w-12" : "h-8 w-8"}`}
            />
            <div>
              <div className={`font-bold ${sizeClasses[size]}`}>
                {streak.currentCount}
              </div>
              <div className="text-sm text-muted-foreground">
                Day{streak.currentCount !== 1 ? "s" : ""} Streak
              </div>
            </div>
          </div>
          {showFreeze && streak.freezeCount > 0 && (
            <div className="flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-blue-500" />
              <Badge variant="outline">{streak.freezeCount} Freezes</Badge>
            </div>
          )}
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Longest: {streak.longestCount} days
        </div>
      </CardContent>
    </Card>
  );
}
