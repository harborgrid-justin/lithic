'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Users, Calendar, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChallengeCardProps {
  challenge: any;
  onJoin?: (challengeId: string) => void;
  userJoined?: boolean;
  userProgress?: number;
}

export function ChallengeCard({ challenge, onJoin, userJoined, userProgress }: ChallengeCardProps) {
  const daysRemaining = Math.ceil(
    (new Date(challenge.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{challenge.icon}</span>
              <Badge variant={challenge.difficulty === 'beginner' ? 'secondary' : 'default'}>
                {challenge.difficulty}
              </Badge>
            </div>
            <CardTitle>{challenge.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{daysRemaining} days left</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{challenge.participantCount || 0} joined</span>
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-3">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold">{challenge.pointsReward} Points</span>
            </div>
          </div>

          {userJoined && typeof userProgress === 'number' && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Your Progress</span>
                <span>{Math.round((userProgress / challenge.targetValue) * 100)}%</span>
              </div>
              <Progress value={(userProgress / challenge.targetValue) * 100} />
            </div>
          )}

          <Button
            className="w-full"
            onClick={() => onJoin?.(challenge.id)}
            disabled={userJoined}
          >
            {userJoined ? 'Joined' : 'Join Challenge'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
