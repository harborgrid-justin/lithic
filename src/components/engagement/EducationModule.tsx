/**
 * Education Content Viewer Component
 * Agent 5: Patient Engagement Platform
 */

"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { EducationContent, ContentProgressStatus } from "@/types/engagement";
import { BookOpen, Clock, Award, Star } from "lucide-react";

interface EducationModuleProps {
  content: EducationContent;
  progress?: {
    status: ContentProgressStatus;
    progress: number;
    timeSpent: number;
  };
  onStart?: (content: EducationContent) => void;
  onContinue?: (content: EducationContent) => void;
  className?: string;
}

export function EducationModule({
  content,
  progress,
  onStart,
  onContinue,
  className,
}: EducationModuleProps) {
  const isStarted = progress && progress.status !== "NOT_STARTED";
  const isCompleted = progress?.status === "COMPLETED";

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {content.title}
            </CardTitle>
            <CardDescription>{content.description}</CardDescription>
          </div>
          {content.isFeatured && (
            <Badge variant="default">Featured</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{content.type}</Badge>
          <Badge variant="outline">{content.category}</Badge>
          <Badge variant="outline">{content.level}</Badge>
          {content.language !== "en" && (
            <Badge variant="outline">{content.language.toUpperCase()}</Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{content.duration} min</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>{content.averageRating.toFixed(1)} ({content.reviewCount})</span>
          </div>
        </div>

        {isStarted && progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress.progress}%</span>
            </div>
            <Progress value={progress.progress} className="h-2" />
          </div>
        )}

        {content.rewardPoints > 0 && (
          <div className="flex items-center gap-1 text-sm text-yellow-600">
            <Award className="h-4 w-4" />
            <span>{content.rewardPoints} points upon completion</span>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {isCompleted ? (
          <Button variant="outline" disabled className="w-full">
            Completed
          </Button>
        ) : isStarted && onContinue ? (
          <Button onClick={() => onContinue(content)} className="w-full">
            Continue Learning
          </Button>
        ) : onStart ? (
          <Button onClick={() => onStart(content)} className="w-full">
            Start Learning
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
