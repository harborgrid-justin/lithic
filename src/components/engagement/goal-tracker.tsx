'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, CheckCircle2, Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function GoalTracker({ compact = false }: { compact?: boolean }) {
  const [goals, setGoals] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/engagement/goals?action=list&status=ACTIVE')
      .then((r) => r.json())
      .then(setGoals);
  }, []);

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Active Goals
            </h3>
            <Badge variant="secondary">{goals.length}</Badge>
          </div>
          <div className="space-y-2">
            {goals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate">{goal.title}</span>
                  <span className="text-muted-foreground">{Math.round(goal.progressPercentage)}%</span>
                </div>
                <Progress value={goal.progressPercentage} className="h-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {goals.map((goal) => (
        <Card key={goal.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{goal.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {goal.description}
                </p>
              </div>
              <Badge variant={goal.priority === 'high' ? 'destructive' : 'secondary'}>
                {goal.priority}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span className="font-semibold">
                    {goal.currentValue} / {goal.targetValue} {goal.unit}
                  </span>
                </div>
                <Progress value={goal.progressPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(goal.progressPercentage)}% complete
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Flame className="h-4 w-4" />
                  <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                </div>
              </div>

              <Button className="w-full" size="sm">
                Update Progress
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
