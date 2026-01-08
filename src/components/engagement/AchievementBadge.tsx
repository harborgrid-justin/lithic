/**
 * Achievement Badge Display Component
 * Agent 5: Patient Engagement Platform
 */

"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Achievement, AchievementTier } from "@/types/engagement";
import { Trophy, Lock } from "lucide-react";

interface AchievementBadgeProps {
  achievement: Achievement;
  isEarned?: boolean;
  earnedDate?: Date;
  progress?: number;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AchievementBadge({
  achievement,
  isEarned = false,
  earnedDate,
  progress = 0,
  onClick,
  size = "md",
  className,
}: AchievementBadgeProps) {
  const tierColors: Record<AchievementTier, string> = {
    BRONZE: "from-amber-700 to-amber-900",
    SILVER: "from-gray-400 to-gray-600",
    GOLD: "from-yellow-400 to-yellow-600",
    PLATINUM: "from-purple-400 to-purple-600",
    DIAMOND: "from-cyan-400 to-cyan-600",
  };

  const sizeClasses = {
    sm: "h-16 w-16 text-2xl",
    md: "h-24 w-24 text-4xl",
    lg: "h-32 w-32 text-5xl",
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all ${
        isEarned ? "hover:shadow-lg cursor-pointer" : "opacity-50"
      } ${className || ""}`}
      onClick={isEarned ? onClick : undefined}
    >
      <div className="p-4">
        <div className="flex flex-col items-center text-center space-y-2">
          {/* Badge Icon */}
          <div
            className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${
              isEarned ? tierColors[achievement.tier] : "from-gray-300 to-gray-400"
            } flex items-center justify-center text-white shadow-lg`}
          >
            {achievement.isSecret && !isEarned ? (
              <Lock className="h-8 w-8" />
            ) : (
              <span>{achievement.icon}</span>
            )}
          </div>

          {/* Achievement Name */}
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">{achievement.name}</h3>
            {(!achievement.isSecret || isEarned) && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {achievement.description}
              </p>
            )}
          </div>

          {/* Tier Badge */}
          <Badge variant="secondary" className="text-xs">
            {achievement.tier}
          </Badge>

          {/* Progress or Earned Date */}
          {isEarned && earnedDate ? (
            <div className="text-xs text-muted-foreground">
              Earned {new Date(earnedDate).toLocaleDateString()}
            </div>
          ) : (
            progress > 0 && (
              <div className="w-full space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )
          )}

          {/* Points */}
          <div className="flex items-center gap-1 text-xs text-yellow-600">
            <Trophy className="h-3 w-3" />
            <span>{achievement.rewardPoints} points</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function AchievementGrid({
  achievements,
  earnedAchievements,
  onAchievementClick,
  className,
}: {
  achievements: Achievement[];
  earnedAchievements: Array<{ achievementId: string; earnedDate: Date; progress: number }>;
  onAchievementClick?: (achievement: Achievement) => void;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className || ""}`}>
      {achievements.map((achievement) => {
        const earned = earnedAchievements.find(
          (e) => e.achievementId === achievement.id
        );
        return (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            isEarned={!!earned}
            earnedDate={earned?.earnedDate}
            progress={earned?.progress || 0}
            onClick={() => onAchievementClick?.(achievement)}
          />
        );
      })}
    </div>
  );
}
