/**
 * Goals Management Page
 * Create, track, and manage health goals
 */

import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GoalTracker } from '@/components/engagement/goal-tracker';
import { Target, Plus, TrendingUp, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Goals | Patient Portal',
  description: 'Create and track your health and wellness goals',
};

export default function GoalsPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/patient-portal/engagement"
              className="text-muted-foreground hover:text-foreground"
            >
              Engagement
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold">Goals</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Target className="h-10 w-10" />
            My Health Goals
          </h1>
          <p className="text-muted-foreground mt-2">
            Set SMART goals and track your progress toward better health
          </p>
        </div>
        <Button size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Create New Goal
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">Active Goals</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">67%</p>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Plus className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold">3,200</p>
              <p className="text-sm text-muted-foreground">Points Earned</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Goals */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Active Goals</h2>
        <GoalTracker />
      </div>

      {/* Goal Templates / Suggestions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recommended Goals</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Healthy Weight Loss - 5%',
              description: 'Lose 5% of your body weight in 12 weeks',
              category: 'Weight Management',
              difficulty: 'Beginner',
              points: 1000,
            },
            {
              title: '10,000 Steps Daily',
              description: 'Walk 10,000 steps every day for 30 days',
              category: 'Exercise',
              difficulty: 'Beginner',
              points: 800,
            },
            {
              title: 'Perfect Medication Adherence',
              description: 'Take all medications as prescribed for 30 days',
              category: 'Medication',
              difficulty: 'Intermediate',
              points: 1200,
            },
          ].map((goal, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold mb-2">{goal.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                    {goal.category}
                  </span>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                    {goal.difficulty}
                  </span>
                </div>
                <span className="text-sm font-semibold text-purple-600">
                  +{goal.points} pts
                </span>
              </div>
              <Button className="w-full mt-4" size="sm">
                Start This Goal
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
