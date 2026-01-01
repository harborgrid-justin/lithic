/**
 * Patient Engagement Hub - Main Page
 * Overview dashboard for gamification, goals, challenges, and achievements
 */

import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PointsDisplay } from '@/components/engagement/points-display';
import { LevelProgress } from '@/components/engagement/level-progress';
import { GoalTracker } from '@/components/engagement/goal-tracker';
import { LeaderboardTable } from '@/components/engagement/leaderboard-table';
import { Trophy, Target, Award, Zap, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Engagement Hub | Patient Portal',
  description: 'Track your health journey, earn rewards, and achieve your goals',
};

export default function EngagementPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Engagement Hub</h1>
          <p className="text-muted-foreground mt-2">
            Track your health journey, earn rewards, and achieve your wellness goals
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/patient-portal/engagement/goals">
              <Target className="h-4 w-4 mr-2" />
              My Goals
            </Link>
          </Button>
          <Button asChild>
            <Link href="/patient-portal/engagement/challenges">
              <Trophy className="h-4 w-4 mr-2" />
              Join Challenge
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Points</p>
                <p className="text-3xl font-bold">12,450</p>
              </div>
              <Zap className="h-12 w-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Current Level</p>
                <p className="text-3xl font-bold">11</p>
              </div>
              <Trophy className="h-12 w-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Badges Earned</p>
                <p className="text-3xl font-bold">23/50</p>
              </div>
              <Award className="h-12 w-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Active Goals</p>
                <p className="text-3xl font-bold">3</p>
              </div>
              <Target className="h-12 w-12 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PointsDisplay />
            </div>
            <div className="space-y-6">
              <LevelProgress />
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-between" asChild>
                    <Link href="/patient-portal/engagement/goals">
                      View All Goals
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-between" asChild>
                    <Link href="/patient-portal/engagement/badges">
                      View Badge Collection
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-between" asChild>
                    <Link href="/patient-portal/engagement/challenges">
                      Browse Challenges
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-between" asChild>
                    <Link href="/patient-portal/engagement/rewards">
                      Redeem Rewards
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Active Goals</h2>
            <Button asChild>
              <Link href="/patient-portal/engagement/goals">View All</Link>
            </Button>
          </div>
          <GoalTracker />
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <LeaderboardTable />
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Your Achievements</h3>
                <p className="text-muted-foreground mb-6">
                  View all your unlocked badges and achievements
                </p>
                <Button asChild>
                  <Link href="/patient-portal/engagement/badges">View Badge Collection</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Call to Action Banner */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready for a Challenge?</h2>
              <p className="opacity-90">
                Join our community challenges and earn bonus points and exclusive badges!
              </p>
            </div>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/patient-portal/engagement/challenges">
                Browse Challenges
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
