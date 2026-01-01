'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award, TrendingUp, TrendingDown } from 'lucide-react';

export function LeaderboardTable() {
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [type, setType] = useState('points_all_time');

  useEffect(() => {
    fetchLeaderboard(type);
  }, [type]);

  const fetchLeaderboard = async (leaderboardType: string) => {
    try {
      const response = await fetch(`/api/engagement/leaderboard?type=${leaderboardType}`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
  };

  if (!leaderboard) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </CardTitle>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="points_all_time">All-Time Points</SelectItem>
              <SelectItem value="points_weekly">This Week</SelectItem>
              <SelectItem value="points_monthly">This Month</SelectItem>
              <SelectItem value="level">Levels</SelectItem>
              <SelectItem value="badges">Badges</SelectItem>
              <SelectItem value="challenges_won">Challenges</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.entries.map((entry: any) => (
            <div
              key={entry.userId}
              className={`flex items-center gap-4 rounded-lg p-3 transition-colors ${
                entry.isCurrentUser
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex w-12 items-center justify-center">
                {getRankIcon(entry.rank)}
              </div>

              <Avatar>
                <AvatarImage src={entry.avatar} />
                <AvatarFallback>
                  {entry.displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="font-medium">{entry.displayName}</p>
                {entry.badge && <span className="text-xs">{entry.badge}</span>}
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-purple-600">
                  {entry.value.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {leaderboard.config.valueLabel}
                </p>
              </div>

              {entry.trend && (
                <div>
                  {entry.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {entry.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                </div>
              )}
            </div>
          ))}
        </div>

        {leaderboard.currentUserEntry && !leaderboard.entries.some((e: any) => e.isCurrentUser) && (
          <div className="mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Your Rank</p>
            <div className="flex items-center gap-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 p-3">
              <div className="flex w-12 items-center justify-center">
                {getRankIcon(leaderboard.currentUserEntry.rank)}
              </div>
              <Avatar>
                <AvatarImage src={leaderboard.currentUserEntry.avatar} />
                <AvatarFallback>YOU</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{leaderboard.currentUserEntry.displayName}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-purple-600">
                  {leaderboard.currentUserEntry.value.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
