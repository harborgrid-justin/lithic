/**
 * Leaderboard Component
 * Agent 5: Patient Engagement Platform
 */

"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderBoardEntry {
  rank: number;
  displayName: string;
  avatar: string | null;
  points: number;
  level: number;
}

interface LeaderBoardProps {
  entries: LeaderBoardEntry[];
  currentPatientId?: string;
  timeframe?: string;
  className?: string;
}

export function LeaderBoard({
  entries,
  currentPatientId,
  timeframe = "All Time",
  className,
}: LeaderBoardProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
        <CardDescription>{timeframe}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-4 p-3 rounded-lg ${
                entry.rank <= 3 ? "bg-muted/50" : ""
              }`}
            >
              <div className="flex items-center justify-center w-8">
                {getRankIcon(entry.rank) || (
                  <span className="font-semibold text-muted-foreground">
                    {entry.rank}
                  </span>
                )}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={entry.avatar || undefined} />
                <AvatarFallback>{entry.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{entry.displayName}</div>
                <div className="text-sm text-muted-foreground">
                  Level {entry.level}
                </div>
              </div>
              <Badge variant="secondary">
                {entry.points.toLocaleString()} pts
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
