/**
 * Challenges Page
 * Browse and join health challenges
 */

"use client";

import React from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChallengeCard } from '@/components/engagement/challenge-card';
import { Trophy } from 'lucide-react';

export default function ChallengesPage() {
  const mockChallenges = [
    {
      id: '1',
      name: '7-Day Vitals Tracker',
      description: 'Log your vital signs every day for 7 days',
      icon: '🎯',
      difficulty: 'beginner',
      pointsReward: 300,
      participantCount: 142,
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      targetValue: 7,
    },
    {
      id: '2',
      name: '10K Steps Challenge',
      description: 'Walk 10,000 steps every day for 30 days',
      icon: '👟',
      difficulty: 'intermediate',
      pointsReward: 1200,
      participantCount: 89,
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      targetValue: 300000,
    },
    {
      id: '3',
      name: '30-Day Med Perfect',
      description: 'Take medications on time for 30 days straight',
      icon: '💊',
      difficulty: 'beginner',
      pointsReward: 800,
      participantCount: 203,
      endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      targetValue: 30,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link
            href="/patient-portal/engagement"
            className="text-muted-foreground hover:text-foreground"
          >
            Engagement
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">Challenges</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <Trophy className="h-10 w-10" />
          Health Challenges
        </h1>
        <p className="text-muted-foreground mt-2">
          Join challenges, compete with others, and earn rewards for healthy behaviors
        </p>
      </div>

      {/* Challenges Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Challenges</TabsTrigger>
          <TabsTrigger value="my">My Challenges</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onJoin={(id) => console.log('Joining challenge:', id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my" className="space-y-6">
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Active Challenges</h3>
            <p className="text-muted-foreground">
              Join a challenge to start earning points and badges!
            </p>
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Completed Challenges Yet</h3>
            <p className="text-muted-foreground">
              Complete your first challenge to see it here!
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
