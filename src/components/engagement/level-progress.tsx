'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Zap, Gift } from 'lucide-react';

export function LevelProgress() {
  const [levelData, setLevelData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/engagement/points?action=balance')
      .then((r) => r.json())
      .then((data) => {
        const level = Math.floor(Math.sqrt(data.totalPoints / 100));
        const nextLevel = level + 1;
        const currentLevelPoints = level * level * 100;
        const nextLevelPoints = nextLevel * nextLevel * 100;
        const progress = ((data.totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;

        setLevelData({
          currentLevel: level,
          nextLevel,
          progress,
          pointsToNext: nextLevelPoints - data.totalPoints,
          totalPoints: data.totalPoints,
        });
      });
  }, []);

  if (!levelData) return null;

  return (
    <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-90">Current Level</p>
            <p className="text-4xl font-bold">{levelData.currentLevel}</p>
          </div>
          <Trophy className="h-12 w-12 opacity-80" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress to Level {levelData.nextLevel}</span>
            <span>{Math.round(levelData.progress)}%</span>
          </div>
          <Progress value={levelData.progress} className="bg-white/20" />
          <p className="text-xs text-center opacity-90">
            {levelData.pointsToNext.toLocaleString()} points to next level
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-white/10 p-3">
            <Zap className="h-5 w-5 mb-1" />
            <p className="text-xs opacity-90">Multiplier</p>
            <p className="text-lg font-bold">{(1 + levelData.currentLevel * 0.05).toFixed(2)}x</p>
          </div>
          <div className="rounded-lg bg-white/10 p-3">
            <Gift className="h-5 w-5 mb-1" />
            <p className="text-xs opacity-90">Benefits</p>
            <p className="text-lg font-bold">{Math.min(levelData.currentLevel, 10)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
