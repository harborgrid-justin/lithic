/**
 * Challenge Card Component
 * Agent 5: Patient Engagement Platform
 */

"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Challenge } from "@/types/engagement";
import { Users, Calendar, Trophy, Target } from "lucide-react";

interface ChallengeCardProps {
  challenge: Challenge;
  isParticipating?: boolean;
  currentProgress?: number;
  onJoin?: (challenge: Challenge) => void;
  onViewDetails?: (challenge: Challenge) => void;
  className?: string;
}

export function ChallengeCard({
  challenge,
  isParticipating = false,
  currentProgress = 0,
  onJoin,
  onViewDetails,
  className,
}: ChallengeCardProps) {
  const daysRemaining = Math.ceil(
    (new Date(challenge.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const progressPercentage = (currentProgress / challenge.goal.target) * 100;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {challenge.name}
              {challenge.isTeamBased && <Users className="h-4 w-4" />}
            </CardTitle>
            <CardDescription>{challenge.description}</CardDescription>
          </div>
          <Badge variant={challenge.difficulty === "EASY" ? "secondary" : challenge.difficulty === "MEDIUM" ? "default" : "destructive"}>
            {challenge.difficulty}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Ends in</div>
              <div className="font-medium">{daysRemaining} days</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Participants</div>
              <div className="font-medium">{challenge.currentParticipants}</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              Goal: {challenge.goal.target} {challenge.goal.unit}
            </span>
          </div>
          {isParticipating && (
            <>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{currentProgress} {challenge.goal.unit}</span>
                <span>{progressPercentage.toFixed(1)}%</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 text-sm text-yellow-600">
          <Trophy className="h-4 w-4" />
          <span>{challenge.rewards.points} points reward</span>
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        {!isParticipating && onJoin && (
          <Button onClick={() => onJoin(challenge)} className="flex-1">
            Join Challenge
          </Button>
        )}
        {onViewDetails && (
          <Button
            variant={isParticipating ? "default" : "outline"}
            onClick={() => onViewDetails(challenge)}
            className="flex-1"
          >
            {isParticipating ? "View Progress" : "View Details"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
