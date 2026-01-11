/**
 * Wellness Portal Page
 * Agent 5: Patient Engagement Platform
 */

"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalTracker } from "@/components/engagement/GoalTracker";
import { ChallengeCard } from "@/components/engagement/ChallengeCard";
import { WellnessDashboard } from "@/components/engagement/WellnessDashboard";
import { EducationModule } from "@/components/engagement/EducationModule";
import { StreakCounter } from "@/components/engagement/StreakCounter";
import { PointsDisplay } from "@/components/engagement/PointsDisplay";
import { useEngagement } from "@/hooks/useEngagement";
import { useGoals } from "@/hooks/useGoals";
import { Activity, Target, BookOpen, Trophy } from "lucide-react";

export default function WellnessPage() {
  // Mock patient ID - in production, get from session
  const patientId = "patient-123";

  const {
    profile,
    achievements,
    badges,
    streaks,
    metrics,
    isLoading: engagementLoading,
  } = useEngagement(patientId);

  const { goals, activeGoals, isLoading: goalsLoading } = useGoals(patientId, {
    status: "ACTIVE",
  });

  if (engagementLoading || goalsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading your wellness dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wellness Dashboard</h1>
        <p className="text-muted-foreground">
          Track your health goals, earn rewards, and stay motivated
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {profile && (
          <PointsDisplay
            level={profile.level}
            experiencePoints={profile.experiencePoints}
            totalPoints={profile.totalPoints}
            pointsToNextLevel={1000} // Mock value
            currentLevelXp={0}
            nextLevelXp={1000}
          />
        )}

        {streaks.length > 0 && <StreakCounter streak={streaks[0]} />}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGoals.length}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievements.length}</div>
            <p className="text-xs text-muted-foreground">Unlocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="goals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            My Goals
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="programs" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Programs
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Education
          </TabsTrigger>
        </TabsList>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGoals.map((goal) => (
              <GoalTracker
                key={goal.id}
                goal={goal}
                onViewDetails={(goal) => console.log("View goal:", goal)}
              />
            ))}
          </div>
          {activeGoals.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Active Goals</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start your wellness journey by creating your first health goal
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Mock challenges - in production, fetch from API */}
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Active Challenges</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Join a challenge to compete with others and stay motivated
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          <WellnessDashboard enrollments={[]} />
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Educational Content Coming Soon</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn about your health conditions and treatments
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
