/**
 * Achievements Page
 * Agent 5: Patient Engagement Platform
 */

"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AchievementBadge, AchievementGrid } from "@/components/engagement/AchievementBadge";
import { LeaderBoard } from "@/components/engagement/LeaderBoard";
import { PointsDisplay } from "@/components/engagement/PointsDisplay";
import { useEngagement } from "@/hooks/useEngagement";
import { AchievementsEngine } from "@/lib/engagement/achievements";
import { Trophy, Award, Medal, TrendingUp } from "lucide-react";

export default function AchievementsPage() {
  // Mock patient ID - in production, get from session
  const patientId = "patient-123";

  const {
    profile,
    achievements: earnedAchievements,
    badges,
    isLoading,
  } = useEngagement(patientId);

  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);

  // Get all available achievements
  const allAchievements = AchievementsEngine.getPredefinedAchievements();
  const allBadges = AchievementsEngine.getPredefinedBadges();

  // Calculate completion percentage
  const completionPercentage =
    allAchievements.length > 0
      ? (earnedAchievements.length / allAchievements.length) * 100
      : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Achievements & Rewards</h1>
        <p className="text-muted-foreground">
          Track your progress, unlock achievements, and earn rewards
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {profile && (
          <PointsDisplay
            level={profile.level}
            experiencePoints={profile.experiencePoints}
            totalPoints={profile.totalPoints}
            pointsToNextLevel={1000}
            currentLevelXp={0}
            nextLevelXp={1000}
            showProgress={false}
          />
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earnedAchievements.length}/{allAchievements.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {completionPercentage.toFixed(1)}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{badges.length}</div>
            <p className="text-xs text-muted-foreground">Collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rank</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{profile?.rank || "-"}</div>
            <p className="text-xs text-muted-foreground">On leaderboard</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="achievements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Achievements</CardTitle>
              <CardDescription>
                Complete activities to unlock achievements and earn rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AchievementGrid
                achievements={allAchievements}
                earnedAchievements={earnedAchievements.map((e) => ({
                  achievementId: e.achievementId,
                  earnedDate: e.earnedDate,
                  progress: e.progress,
                }))}
                onAchievementClick={setSelectedAchievement}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Badge Collection</CardTitle>
              <CardDescription>
                Special badges earned for completing milestones and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allBadges.map((badge) => {
                  const earned = badges.find((b) => b.badgeId === badge.id);
                  return (
                    <Card
                      key={badge.id}
                      className={`${!earned ? "opacity-50" : ""}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center space-y-2">
                          <div
                            className="h-16 w-16 rounded-full flex items-center justify-center text-3xl"
                            style={{ backgroundColor: badge.backgroundColor }}
                          >
                            {badge.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{badge.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {badge.description}
                            </p>
                          </div>
                          {earned && (
                            <p className="text-xs text-muted-foreground">
                              Earned {new Date(earned.earnedDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <LeaderBoard
            entries={[]}
            currentPatientId={patientId}
            timeframe="This Week"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
