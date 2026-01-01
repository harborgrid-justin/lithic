'use client';

/**
 * Points Display Component
 * Shows points balance, recent activity, and animated counters
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {  Coins, TrendingUp, Award, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PointsDisplayProps {
  userId?: string;
  compact?: boolean;
}

export function PointsDisplay({ userId, compact = false }: PointsDisplayProps) {
  const [pointsData, setPointsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [animatedPoints, setAnimatedPoints] = useState(0);

  useEffect(() => {
    fetchPointsData();
  }, [userId]);

  useEffect(() => {
    if (pointsData?.balance?.totalPoints) {
      animateCounter(pointsData.balance.totalPoints);
    }
  }, [pointsData?.balance?.totalPoints]);

  const fetchPointsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/engagement/points');
      const data = await response.json();
      setPointsData(data);
    } catch (error) {
      console.error('Failed to fetch points:', error);
    } finally {
      setLoading(false);
    }
  };

  const animateCounter = (target: number) => {
    const duration = 1000; // 1 second
    const steps = 50;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedPoints(target);
        clearInterval(timer);
      } else {
        setAnimatedPoints(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pointsData) return null;

  const { balance, recentHistory, categoryStats } = pointsData;
  const progressToNextLevel =
    ((balance.totalPoints - balance.currentLevel * balance.currentLevel * 100) /
      ((balance.currentLevel + 1) * (balance.currentLevel + 1) * 100 -
        balance.currentLevel * balance.currentLevel * 100)) *
    100;

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Total Points</p>
              <p className="text-3xl font-bold">{animatedPoints.toLocaleString()}</p>
            </div>
            <Coins className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span>Level {balance.currentLevel}</span>
              <span>{Math.round(progressToNextLevel)}%</span>
            </div>
            <Progress value={progressToNextLevel} className="mt-2 bg-white/20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Points Balance Card */}
      <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 opacity-80" />
                <p className="text-sm font-medium opacity-90">Total Points</p>
              </div>
              <p className="mt-2 text-4xl font-bold">{animatedPoints.toLocaleString()}</p>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 opacity-80" />
                <p className="text-sm font-medium opacity-90">Available</p>
              </div>
              <p className="mt-2 text-4xl font-bold">
                {balance.availablePoints.toLocaleString()}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 opacity-80" />
                <p className="text-sm font-medium opacity-90">Level</p>
              </div>
              <p className="mt-2 text-4xl font-bold">{balance.currentLevel}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span>Progress to Level {balance.currentLevel + 1}</span>
              <span>{balance.nextLevelPoints - balance.totalPoints} points to go</span>
            </div>
            <Progress value={progressToNextLevel} className="mt-2 bg-white/20" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {recentHistory.map((transaction: any, index: number) => (
                  <div
                    key={transaction.id || index}
                    className="flex items-start justify-between border-b pb-3 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Badge variant={transaction.totalPoints > 0 ? 'default' : 'secondary'}>
                      {transaction.totalPoints > 0 ? '+' : ''}
                      {transaction.totalPoints}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Points by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Points by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryStats).map(([category, points]) => {
                const total = Object.values(categoryStats).reduce(
                  (sum: number, val: any) => sum + val,
                  0
                ) as number;
                const percentage = total > 0 ? ((points as number) / total) * 100 : 0;

                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">
                        {category.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {(points as number).toLocaleString()} pts
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lifetime Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {balance.lifetimePoints.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Lifetime Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {balance.totalPoints.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Current Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {balance.availablePoints.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {balance.redeemedPoints.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Redeemed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
