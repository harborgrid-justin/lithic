/**
 * Challenges System - Gamification Engine
 * Health challenges, team challenges, and time-limited events
 */

import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { PointActivity, PointsSystem } from './points-system';

export enum ChallengeType {
  INDIVIDUAL = 'individual',
  TEAM = 'team',
  COMMUNITY = 'community',
}

export enum ChallengeDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum ChallengeStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export interface ChallengeDefinition {
  id: string;
  name: string;
  description: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  icon: string;
  startDate: Date;
  endDate: Date;
  targetMetric: string;
  targetValue: number;
  unit: string;
  pointsReward: number;
  maxParticipants?: number;
  minLevel?: number;
  category: string;
  rules: string[];
  tips: string[];
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  joinedAt: Date;
  progress: number;
  completed: boolean;
  completedAt?: Date;
  rank?: number;
  teamId?: string;
}

export interface ChallengeTeam {
  id: string;
  challengeId: string;
  name: string;
  captainId: string;
  members: string[];
  progress: number;
  rank?: number;
}

export const CHALLENGE_TEMPLATES: ChallengeDefinition[] = [
  // ============ BEGINNER CHALLENGES ============
  {
    id: 'daily_vitals_week',
    name: '7-Day Vitals Tracker',
    description: 'Log your vital signs every day for 7 days',
    type: ChallengeType.INDIVIDUAL,
    difficulty: ChallengeDifficulty.BEGINNER,
    icon: '🎯',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    targetMetric: 'vitals_logged',
    targetValue: 7,
    unit: 'days',
    pointsReward: 300,
    category: 'health_tracking',
    rules: [
      'Log vital signs at least once per day',
      'Complete all 7 days to earn rewards',
      'Must include blood pressure and heart rate',
    ],
    tips: [
      'Set a daily reminder to log your vitals',
      'Track at the same time each day for consistency',
      'Share your progress with the community',
    ],
  },
  {
    id: 'medication_adherence_30',
    name: '30-Day Med Perfect',
    description: 'Take medications on time for 30 days straight',
    type: ChallengeType.INDIVIDUAL,
    difficulty: ChallengeDifficulty.BEGINNER,
    icon: '💊',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    targetMetric: 'medication_logged',
    targetValue: 30,
    unit: 'days',
    pointsReward: 800,
    category: 'medication',
    rules: [
      'Log all prescribed medications daily',
      'No missed doses',
      'Complete all 30 days',
    ],
    tips: [
      'Use medication reminders',
      'Keep medications in visible locations',
      'Track side effects to discuss with provider',
    ],
  },
  {
    id: 'hydration_hero',
    name: 'Hydration Hero',
    description: 'Drink 8 glasses of water daily for 14 days',
    type: ChallengeType.INDIVIDUAL,
    difficulty: ChallengeDifficulty.BEGINNER,
    icon: '💧',
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    targetMetric: 'water_intake',
    targetValue: 112,
    unit: 'glasses',
    pointsReward: 400,
    category: 'wellness',
    rules: ['Log water intake daily', 'Minimum 8 glasses per day', '14 consecutive days'],
    tips: [
      'Carry a reusable water bottle',
      'Set hourly reminders',
      'Flavor water with fruit if needed',
    ],
  },

  // ============ INTERMEDIATE CHALLENGES ============
  {
    id: 'step_master_10k',
    name: '10K Steps Challenge',
    description: 'Walk 10,000 steps every day for 30 days',
    type: ChallengeType.INDIVIDUAL,
    difficulty: ChallengeDifficulty.INTERMEDIATE,
    icon: '👟',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    targetMetric: 'steps',
    targetValue: 300000,
    unit: 'steps',
    pointsReward: 1200,
    minLevel: 5,
    category: 'fitness',
    rules: [
      'Log at least 10,000 steps daily',
      'Use connected device or manual entry',
      'Complete all 30 days',
    ],
    tips: [
      'Park farther away from destinations',
      'Take walking meetings',
      'Walk during phone calls',
    ],
  },
  {
    id: 'sleep_optimization',
    name: 'Sleep Optimization',
    description: 'Get 7-9 hours of sleep for 21 nights',
    type: ChallengeType.INDIVIDUAL,
    difficulty: ChallengeDifficulty.INTERMEDIATE,
    icon: '😴',
    startDate: new Date(),
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    targetMetric: 'sleep_hours',
    targetValue: 21,
    unit: 'nights',
    pointsReward: 700,
    minLevel: 5,
    category: 'wellness',
    rules: [
      'Sleep 7-9 hours per night',
      'Track sleep quality',
      'Complete 21 consecutive nights',
    ],
    tips: [
      'Establish a bedtime routine',
      'Avoid screens 1 hour before bed',
      'Keep bedroom cool and dark',
    ],
  },
  {
    id: 'nutrition_tracker_30',
    name: 'Nutrition Master',
    description: 'Log all meals and track macros for 30 days',
    type: ChallengeType.INDIVIDUAL,
    difficulty: ChallengeDifficulty.INTERMEDIATE,
    icon: '🥗',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    targetMetric: 'meals_logged',
    targetValue: 90,
    unit: 'meals',
    pointsReward: 900,
    minLevel: 10,
    category: 'nutrition',
    rules: ['Log all meals (breakfast, lunch, dinner)', 'Track macronutrients', '30 days total'],
    tips: [
      'Meal prep on weekends',
      'Use nutrition tracking apps',
      'Take photos of meals',
    ],
  },

  // ============ ADVANCED CHALLENGES ============
  {
    id: 'weight_loss_12week',
    name: '12-Week Transformation',
    description: 'Lose 5-10% body weight in 12 weeks',
    type: ChallengeType.INDIVIDUAL,
    difficulty: ChallengeDifficulty.ADVANCED,
    icon: '⚖️',
    startDate: new Date(),
    endDate: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000),
    targetMetric: 'weight_loss_percentage',
    targetValue: 5,
    unit: 'percent',
    pointsReward: 3000,
    minLevel: 15,
    category: 'fitness',
    rules: [
      'Weekly weigh-ins required',
      'Must be medically supervised',
      'Healthy rate of 1-2 lbs per week',
    ],
    tips: [
      'Work with a dietitian',
      'Combine diet and exercise',
      'Track progress photos',
    ],
  },
  {
    id: 'marathon_training',
    name: 'Half Marathon Prep',
    description: 'Complete a half marathon training program',
    type: ChallengeType.INDIVIDUAL,
    difficulty: ChallengeDifficulty.ADVANCED,
    icon: '🏃‍♂️',
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    targetMetric: 'running_distance',
    targetValue: 300,
    unit: 'miles',
    pointsReward: 4000,
    minLevel: 20,
    category: 'fitness',
    rules: [
      'Follow structured training plan',
      'Log all runs with distance and time',
      'Include rest days',
    ],
    tips: [
      'Increase mileage gradually',
      'Invest in proper running shoes',
      'Cross-train to prevent injury',
    ],
  },
  {
    id: 'blood_pressure_control',
    name: 'BP Control Challenge',
    description: 'Maintain healthy blood pressure for 90 days',
    type: ChallengeType.INDIVIDUAL,
    difficulty: ChallengeDifficulty.ADVANCED,
    icon: '❤️',
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    targetMetric: 'bp_readings_normal',
    targetValue: 90,
    unit: 'readings',
    pointsReward: 2500,
    minLevel: 10,
    category: 'chronic_disease',
    rules: [
      'Daily BP readings required',
      'Target: <120/80 mmHg',
      'Work with healthcare provider',
    ],
    tips: [
      'Reduce sodium intake',
      'Exercise regularly',
      'Manage stress',
    ],
  },

  // ============ TEAM CHALLENGES ============
  {
    id: 'team_steps_million',
    name: 'Million Step Team',
    description: 'Team up to walk 1 million steps together',
    type: ChallengeType.TEAM,
    difficulty: ChallengeDifficulty.INTERMEDIATE,
    icon: '👥',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    targetMetric: 'team_steps',
    targetValue: 1000000,
    unit: 'steps',
    pointsReward: 2000,
    maxParticipants: 10,
    category: 'fitness',
    rules: [
      'Teams of 5-10 members',
      'All member steps count',
      'First team to 1M wins bonus',
    ],
    tips: [
      'Encourage each other daily',
      'Share walking routes',
      'Organize group walks',
    ],
  },
  {
    id: 'community_wellness',
    name: 'Community Wellness Week',
    description: 'Entire community completes wellness activities',
    type: ChallengeType.COMMUNITY,
    difficulty: ChallengeDifficulty.BEGINNER,
    icon: '🌟',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    targetMetric: 'community_activities',
    targetValue: 1000,
    unit: 'activities',
    pointsReward: 500,
    category: 'wellness',
    rules: [
      'Any health activity counts',
      'Community goal: 1000 total activities',
      'Everyone who participates wins',
    ],
    tips: [
      'Try different activities',
      'Invite friends and family',
      'Share your achievements',
    ],
  },

  // ============ EXPERT CHALLENGES ============
  {
    id: 'diabetes_reversal',
    name: 'A1C Improvement',
    description: 'Lower A1C by 1% in 3 months',
    type: ChallengeType.INDIVIDUAL,
    difficulty: ChallengeDifficulty.EXPERT,
    icon: '🩸',
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    targetMetric: 'a1c_reduction',
    targetValue: 1.0,
    unit: 'percent',
    pointsReward: 5000,
    minLevel: 25,
    category: 'chronic_disease',
    rules: [
      'Medical supervision required',
      'Baseline and follow-up A1C tests',
      'Daily glucose monitoring',
    ],
    tips: [
      'Follow meal plan strictly',
      'Exercise daily',
      'Take medications as prescribed',
    ],
  },
  {
    id: 'ironman_training',
    name: 'Triathlon Legend',
    description: 'Complete Ironman distance training',
    type: ChallengeType.INDIVIDUAL,
    difficulty: ChallengeDifficulty.EXPERT,
    icon: '🏊‍♂️',
    startDate: new Date(),
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    targetMetric: 'triathlon_training',
    targetValue: 140,
    unit: 'hours',
    pointsReward: 10000,
    minLevel: 50,
    category: 'fitness',
    rules: [
      'Swim 2.4 miles total',
      'Bike 112 miles total',
      'Run 26.2 miles total',
      'Complete in 6 months',
    ],
    tips: [
      'Hire a coach',
      'Focus on nutrition',
      'Rest and recovery are crucial',
    ],
  },
];

export class ChallengeSystem {
  /**
   * Get all active challenges
   */
  static async getActiveChallenges(userId?: string): Promise<
    Array<
      ChallengeDefinition & {
        participantCount: number;
        userJoined?: boolean;
        userProgress?: number;
      }
    >
  > {
    const now = new Date();

    const activeChallenges = CHALLENGE_TEMPLATES.filter(
      (c) => c.startDate <= now && c.endDate > now
    );

    const results = await Promise.all(
      activeChallenges.map(async (challenge) => {
        const participantCount = await db.challengeParticipant.count({
          where: { challengeId: challenge.id },
        });

        let userJoined = false;
        let userProgress = 0;

        if (userId) {
          const participation = await db.challengeParticipant.findFirst({
            where: {
              challengeId: challenge.id,
              userId,
            },
          });
          userJoined = !!participation;
          userProgress = participation?.progress || 0;
        }

        return {
          ...challenge,
          participantCount,
          userJoined,
          userProgress,
        };
      })
    );

    return results;
  }

  /**
   * Join a challenge
   */
  static async joinChallenge(
    userId: string,
    challengeId: string,
    teamId?: string
  ): Promise<ChallengeParticipant> {
    const challenge = CHALLENGE_TEMPLATES.find((c) => c.id === challengeId);
    if (!challenge) throw new Error('Challenge not found');

    // Check if already joined
    const existing = await db.challengeParticipant.findFirst({
      where: {
        challengeId,
        userId,
      },
    });

    if (existing) {
      throw new Error('Already joined this challenge');
    }

    // Check max participants
    if (challenge.maxParticipants) {
      const count = await db.challengeParticipant.count({
        where: { challengeId },
      });
      if (count >= challenge.maxParticipants) {
        throw new Error('Challenge is full');
      }
    }

    // Check min level
    if (challenge.minLevel) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { totalPoints: true },
      });
      const level = Math.floor(Math.sqrt((user?.totalPoints || 0) / 100));
      if (level < challenge.minLevel) {
        throw new Error(`Must be level ${challenge.minLevel} to join`);
      }
    }

    // Create participation
    const participant = await db.challengeParticipant.create({
      data: {
        challengeId,
        userId,
        teamId,
        joinedAt: new Date(),
        progress: 0,
        completed: false,
      },
    });

    // Award points for joining
    await PointsSystem.awardPoints(userId, PointActivity.JOIN_CHALLENGE, {
      challengeId,
    });

    await logAudit({
      action: 'CHALLENGE_JOINED',
      userId,
      resource: 'challenge',
      resourceId: challengeId,
      description: `Joined challenge: ${challenge.name}`,
      metadata: { challengeName: challenge.name },
    });

    return participant as ChallengeParticipant;
  }

  /**
   * Update challenge progress
   */
  static async updateProgress(
    userId: string,
    challengeId: string,
    progress: number
  ): Promise<void> {
    const challenge = CHALLENGE_TEMPLATES.find((c) => c.id === challengeId);
    if (!challenge) throw new Error('Challenge not found');

    const participant = await db.challengeParticipant.findFirst({
      where: {
        challengeId,
        userId,
      },
    });

    if (!participant) {
      throw new Error('Not participating in this challenge');
    }

    const completed = progress >= challenge.targetValue;

    await db.challengeParticipant.update({
      where: { id: participant.id },
      data: {
        progress,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    // Award points if just completed
    if (completed && !participant.completed) {
      await PointsSystem.awardPoints(userId, PointActivity.COMPLETE_CHALLENGE, {
        challengeId,
        progress,
      });

      // Award challenge-specific points
      await db.user.update({
        where: { id: userId },
        data: {
          totalPoints: { increment: challenge.pointsReward },
          availablePoints: { increment: challenge.pointsReward },
          lifetimePoints: { increment: challenge.pointsReward },
        },
      });

      await logAudit({
        action: 'CHALLENGE_COMPLETED',
        userId,
        resource: 'challenge',
        resourceId: challengeId,
        description: `Completed challenge: ${challenge.name}`,
        metadata: {
          challengeName: challenge.name,
          points: challenge.pointsReward,
        },
      });
    }
  }

  /**
   * Get challenge leaderboard
   */
  static async getChallengeLeaderboard(challengeId: string, limit = 100): Promise<
    Array<{
      rank: number;
      userId: string;
      userName: string;
      progress: number;
      completed: boolean;
      completedAt?: Date;
    }>
  > {
    const participants = await db.challengeParticipant.findMany({
      where: { challengeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ progress: 'desc' }, { completedAt: 'asc' }],
      take: limit,
    });

    return participants.map((p, index) => ({
      rank: index + 1,
      userId: p.userId,
      userName: p.user.name || 'Anonymous',
      progress: p.progress || 0,
      completed: p.completed || false,
      completedAt: p.completedAt || undefined,
    }));
  }

  /**
   * Get user's active challenges
   */
  static async getUserChallenges(userId: string): Promise<
    Array<
      ChallengeDefinition & {
        progress: number;
        completed: boolean;
        rank?: number;
      }
    >
  > {
    const participations = await db.challengeParticipant.findMany({
      where: { userId },
    });

    const challenges = await Promise.all(
      participations.map(async (p) => {
        const challenge = CHALLENGE_TEMPLATES.find((c) => c.id === p.challengeId);
        if (!challenge) return null;

        // Get rank
        const higherRanked = await db.challengeParticipant.count({
          where: {
            challengeId: p.challengeId,
            OR: [
              { progress: { gt: p.progress } },
              {
                progress: p.progress,
                completedAt: { lt: p.completedAt || new Date() },
              },
            ],
          },
        });

        return {
          ...challenge,
          progress: p.progress || 0,
          completed: p.completed || false,
          rank: higherRanked + 1,
        };
      })
    );

    return challenges.filter(Boolean) as any;
  }

  /**
   * Create team for team challenge
   */
  static async createTeam(
    challengeId: string,
    captainId: string,
    teamName: string
  ): Promise<ChallengeTeam> {
    const challenge = CHALLENGE_TEMPLATES.find((c) => c.id === challengeId);
    if (!challenge || challenge.type !== ChallengeType.TEAM) {
      throw new Error('Invalid team challenge');
    }

    const team = await db.challengeTeam.create({
      data: {
        challengeId,
        name: teamName,
        captainId,
        members: [captainId],
        progress: 0,
      },
    });

    return team as ChallengeTeam;
  }

  /**
   * Join a team
   */
  static async joinTeam(userId: string, teamId: string): Promise<void> {
    const team = await db.challengeTeam.findUnique({
      where: { id: teamId },
    });

    if (!team) throw new Error('Team not found');

    const members = (team.members as string[]) || [];
    if (members.includes(userId)) {
      throw new Error('Already in this team');
    }

    const challenge = CHALLENGE_TEMPLATES.find((c) => c.id === team.challengeId);
    if (challenge?.maxParticipants && members.length >= challenge.maxParticipants) {
      throw new Error('Team is full');
    }

    await db.challengeTeam.update({
      where: { id: teamId },
      data: {
        members: [...members, userId],
      },
    });
  }
}
