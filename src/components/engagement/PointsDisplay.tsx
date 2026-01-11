/**
 * Points/XP Display Component
 * Agent 5: Patient Engagement Platform
 */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Star } from "lucide-react";

interface PointsDisplayProps {
  level: number;
  experiencePoints: number;
  totalPoints: number;
  pointsToNextLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  showProgress?: boolean;
  className?: string;
}

export function PointsDisplay({
  level,
  experiencePoints,
  totalPoints,
  pointsToNextLevel,
  currentLevelXp,
  nextLevelXp,
  showProgress = true,
  className,
}: PointsDisplayProps) {
  const progress = currentLevelXp > 0
    ? ((experiencePoints - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Level {level}</span>
          <Badge variant="secondary" className="text-lg">
            <Trophy className="h-4 w-4 mr-1" />
            {totalPoints.toLocaleString()} pts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress to Level {level + 1}</span>
              <span className="font-medium">
                {pointsToNextLevel.toLocaleString()} XP needed
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{experiencePoints.toLocaleString()} XP</span>
              <span>{nextLevelXp.toLocaleString()} XP</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <div>
              <div className="text-xs text-muted-foreground">Total XP</div>
              <div className="font-semibold">{experiencePoints.toLocaleString()}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <div>
              <div className="text-xs text-muted-foreground">Progress</div>
              <div className="font-semibold">{progress.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
