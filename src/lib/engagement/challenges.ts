/**
 * Health Challenges and Competitions System
 * Agent 5: Patient Engagement Platform
 *
 * Comprehensive challenge system including:
 * - Individual and team challenges
 * - Challenge creation and management
 * - Leaderboards and rankings
 * - Progress tracking
 * - Reward distribution
 */

import type {
  Challenge,
  ChallengeType,
  ChallengeCategory,
  ChallengeStatus,
  ChallengeParticipant,
  ParticipantStatus,
  ChallengeTeam,
  JoinChallengeDto,
  LeaderboardType,
} from "@/types/engagement";

// ============================================================================
// Challenges Engine
// ============================================================================

export class ChallengesEngine {
  /**
   * Join a challenge
   */
  static async joinChallenge(
    data: JoinChallengeDto
  ): Promise<{
    participant: ChallengeParticipant;
    team?: ChallengeTeam;
  }> {
    const challenge = await this.getChallengeById(data.challengeId);

    // Validate challenge is active and accepting participants
    this.validateChallengeJoinable(challenge);

    // Check if already participating
    const existing = await this.findParticipant(data.challengeId, data.patientId);
    if (existing) {
      throw new Error("Already participating in this challenge");
    }

    const now = new Date();

    const participant: ChallengeParticipant = {
      id: crypto.randomUUID(),
      organizationId: "", // Set from context
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: data.patientId,
      updatedBy: data.patientId,
      challengeId: data.challengeId,
      patientId: data.patientId,
      teamId: data.teamId || null,
      joinedDate: now,
      status: ParticipantStatus.ACTIVE,
      currentProgress: 0,
      rank: 0,
      completedDate: null,
      lastActivityDate: null,
    };

    // Update challenge participant count
    challenge.currentParticipants++;

    // Handle team-based challenges
    let team: ChallengeTeam | undefined;
    if (challenge.isTeamBased && data.teamId) {
      team = await this.addToTeam(data.teamId, data.patientId);
    } else if (challenge.isTeamBased && !data.teamId) {
      // Auto-assign to team or create new one
      team = await this.autoAssignTeam(challenge, data.patientId);
      participant.teamId = team.id;
    }

    return { participant, team };
  }

  /**
   * Update challenge progress
   */
  static async updateProgress(
    participantId: string,
    value: number,
    metadata?: Record<string, any>
  ): Promise<{
    participant: ChallengeParticipant;
    challenge: Challenge;
    completed: boolean;
    pointsEarned: number;
    rank: number;
  }> {
    const participant = await this.getParticipantById(participantId);
    const challenge = await this.getChallengeById(participant.challengeId);

    // Update progress based on challenge goal type
    if (challenge.goal.isAccumulative) {
      participant.currentProgress += value;
    } else {
      participant.currentProgress = Math.max(participant.currentProgress, value);
    }

    participant.lastActivityDate = new Date();
    participant.updatedAt = new Date();

    // Check for completion
    const completed = participant.currentProgress >= challenge.goal.target;
    let pointsEarned = 0;

    if (completed && participant.status === ParticipantStatus.ACTIVE) {
      participant.status = ParticipantStatus.COMPLETED;
      participant.completedDate = new Date();

      // Calculate rewards based on completion time/rank
      const rank = await this.calculateRank(participant, challenge);
      participant.rank = rank;

      pointsEarned = this.calculateRewardPoints(challenge, rank);
    }

    // Update leaderboard rank
    const currentRank = await this.calculateRank(participant, challenge);

    return {
      participant,
      challenge,
      completed,
      pointsEarned,
      rank: currentRank,
    };
  }

  /**
   * Generate challenge leaderboard
   */
  static async getLeaderboard(
    challengeId: string,
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    const challenge = await this.getChallengeById(challengeId);
    const participants = await this.getChallengeParticipants(challengeId);

    // Sort based on leaderboard type
    let sorted: ChallengeParticipant[];
    switch (challenge.leaderboardType) {
      case LeaderboardType.TOTAL_PROGRESS:
        sorted = participants.sort(
          (a, b) => b.currentProgress - a.currentProgress
        );
        break;

      case LeaderboardType.PERCENTAGE_COMPLETE:
        sorted = participants.sort((a, b) => {
          const aPercent = (a.currentProgress / challenge.goal.target) * 100;
          const bPercent = (b.currentProgress / challenge.goal.target) * 100;
          return bPercent - aPercent;
        });
        break;

      case LeaderboardType.DAILY_AVERAGE:
        sorted = participants.sort((a, b) => {
          const aDays = this.getDaysSinceJoin(a.joinedDate);
          const bDays = this.getDaysSinceJoin(b.joinedDate);
          const aAvg = a.currentProgress / Math.max(aDays, 1);
          const bAvg = b.currentProgress / Math.max(bDays, 1);
          return bAvg - aAvg;
        });
        break;

      default:
        sorted = participants.sort(
          (a, b) => b.currentProgress - a.currentProgress
        );
    }

    return sorted.slice(0, limit).map((p, index) => ({
      rank: index + 1,
      patientId: p.patientId,
      displayName: "Anonymous", // Would fetch from profile
      progress: p.currentProgress,
      percentComplete: (p.currentProgress / challenge.goal.target) * 100,
      status: p.status,
      joinedDate: p.joinedDate,
      teamId: p.teamId,
    }));
  }

  /**
   * Get team leaderboard for team challenges
   */
  static async getTeamLeaderboard(
    challengeId: string
  ): Promise<TeamLeaderboardEntry[]> {
    const teams = await this.getChallengeTeams(challengeId);

    return teams
      .sort((a, b) => b.currentProgress - a.currentProgress)
      .map((team, index) => ({
        rank: index + 1,
        teamId: team.id,
        teamName: team.name,
        progress: team.currentProgress,
        memberCount: team.members.length,
        captain: team.captainId,
      }));
  }

  /**
   * Create a new team for a challenge
   */
  static async createTeam(
    challengeId: string,
    captainId: string,
    teamName: string,
    description?: string
  ): Promise<ChallengeTeam> {
    const challenge = await this.getChallengeById(challengeId);

    if (!challenge.isTeamBased) {
      throw new Error("Challenge is not team-based");
    }

    const now = new Date();

    const team: ChallengeTeam = {
      id: crypto.randomUUID(),
      organizationId: "", // Set from context
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: captainId,
      updatedBy: captainId,
      challengeId,
      name: teamName,
      description: description || null,
      captainId,
      members: [captainId],
      currentProgress: 0,
      rank: 0,
      avatar: null,
      color: this.generateTeamColor(),
    };

    return team;
  }

  /**
   * Invite player to team
   */
  static async inviteToTeam(
    teamId: string,
    patientId: string
  ): Promise<TeamInvitation> {
    const team = await this.getTeamById(teamId);
    const challenge = await this.getChallengeById(team.challengeId);

    // Check team size limit
    if (challenge.teamSize && team.members.length >= challenge.teamSize) {
      throw new Error("Team is full");
    }

    const invitation: TeamInvitation = {
      id: crypto.randomUUID(),
      teamId,
      patientId,
      invitedBy: team.captainId,
      invitedAt: new Date(),
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    return invitation;
  }

  /**
   * Get challenge statistics
   */
  static async getChallengeStats(
    challengeId: string
  ): Promise<ChallengeStatistics> {
    const challenge = await this.getChallengeById(challengeId);
    const participants = await this.getChallengeParticipants(challengeId);

    const active = participants.filter(
      (p) => p.status === ParticipantStatus.ACTIVE
    );
    const completed = participants.filter(
      (p) => p.status === ParticipantStatus.COMPLETED
    );

    const avgProgress =
      participants.length > 0
        ? participants.reduce((sum, p) => sum + p.currentProgress, 0) /
          participants.length
        : 0;

    const completionRate =
      participants.length > 0 ? completed.length / participants.length : 0;

    return {
      totalParticipants: participants.length,
      activeParticipants: active.length,
      completedParticipants: completed.length,
      averageProgress: avgProgress,
      completionRate,
      daysRemaining: this.getDaysRemaining(challenge.endDate),
      isActive: challenge.status === ChallengeStatus.ACTIVE,
    };
  }

  /**
   * Get recommended challenges for patient
   */
  static async getRecommendations(
    patientId: string,
    preferences: PatientPreferences
  ): Promise<ChallengeRecommendation[]> {
    const availableChallenges = await this.getAvailableChallenges();
    const recommendations: ChallengeRecommendation[] = [];

    for (const challenge of availableChallenges) {
      const matchScore = this.calculateChallengeMatch(challenge, preferences);

      if (matchScore > 0.5) {
        recommendations.push({
          challenge,
          matchScore,
          reasons: this.getChallengeReasons(challenge, preferences),
          difficulty: this.assessDifficulty(challenge, preferences),
        });
      }
    }

    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  }

  /**
   * Leave/drop a challenge
   */
  static async leaveChallenge(participantId: string): Promise<void> {
    const participant = await this.getParticipantById(participantId);

    participant.status = ParticipantStatus.DROPPED;
    participant.updatedAt = new Date();

    // Remove from team if applicable
    if (participant.teamId) {
      await this.removeFromTeam(participant.teamId, participant.patientId);
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private static validateChallengeJoinable(challenge: Challenge): void {
    if (challenge.status !== ChallengeStatus.ACTIVE &&
        challenge.status !== ChallengeStatus.UPCOMING) {
      throw new Error("Challenge is not accepting participants");
    }

    if (challenge.maxParticipants &&
        challenge.currentParticipants >= challenge.maxParticipants) {
      throw new Error("Challenge is full");
    }

    if (new Date() > challenge.endDate) {
      throw new Error("Challenge has ended");
    }
  }

  private static async calculateRank(
    participant: ChallengeParticipant,
    challenge: Challenge
  ): Promise<number> {
    const leaderboard = await this.getLeaderboard(challenge.id, 1000);
    const entry = leaderboard.find((e) => e.patientId === participant.patientId);
    return entry?.rank || leaderboard.length + 1;
  }

  private static calculateRewardPoints(
    challenge: Challenge,
    rank: number
  ): number {
    // Get tier-based rewards
    const tier = challenge.rewards.tiers.find((t) => t.rank >= rank);
    return tier?.points || challenge.rewards.points;
  }

  private static getDaysSinceJoin(joinDate: Date): number {
    const now = new Date();
    const diff = now.getTime() - joinDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private static getDaysRemaining(endDate: Date): number {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  private static generateTeamColor(): string {
    const colors = [
      "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
      "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
      "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
      "#ec4899", "#f43f5e",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private static calculateChallengeMatch(
    challenge: Challenge,
    preferences: PatientPreferences
  ): number {
    let score = 0;

    // Category match
    if (preferences.interestedCategories?.includes(challenge.category)) {
      score += 0.4;
    }

    // Difficulty match
    if (preferences.preferredDifficulty === challenge.difficulty) {
      score += 0.3;
    }

    // Type match
    if (preferences.preferTeam && challenge.isTeamBased) {
      score += 0.3;
    } else if (!preferences.preferTeam && !challenge.isTeamBased) {
      score += 0.3;
    }

    return score;
  }

  private static getChallengeReasons(
    challenge: Challenge,
    preferences: PatientPreferences
  ): string[] {
    const reasons: string[] = [];

    if (preferences.interestedCategories?.includes(challenge.category)) {
      reasons.push("Matches your interests");
    }

    if (challenge.isTeamBased && preferences.preferTeam) {
      reasons.push("Team-based challenge");
    }

    if (challenge.currentParticipants > 100) {
      reasons.push("Popular challenge");
    }

    if (this.getDaysRemaining(challenge.endDate) < 7) {
      reasons.push("Ending soon");
    }

    return reasons;
  }

  private static assessDifficulty(
    challenge: Challenge,
    preferences: PatientPreferences
  ): "Easy" | "Medium" | "Hard" {
    // Simple assessment based on challenge difficulty
    return challenge.difficulty === "EASY"
      ? "Easy"
      : challenge.difficulty === "MEDIUM"
      ? "Medium"
      : "Hard";
  }

  private static async autoAssignTeam(
    challenge: Challenge,
    patientId: string
  ): Promise<ChallengeTeam> {
    // Find a team that has space
    const teams = await this.getChallengeTeams(challenge.id);
    const availableTeam = teams.find(
      (t) => !challenge.teamSize || t.members.length < challenge.teamSize
    );

    if (availableTeam) {
      return this.addToTeam(availableTeam.id, patientId);
    }

    // Create new team
    return this.createTeam(challenge.id, patientId, `Team ${teams.length + 1}`);
  }

  private static async addToTeam(
    teamId: string,
    patientId: string
  ): Promise<ChallengeTeam> {
    const team = await this.getTeamById(teamId);
    if (!team.members.includes(patientId)) {
      team.members.push(patientId);
    }
    return team;
  }

  private static async removeFromTeam(
    teamId: string,
    patientId: string
  ): Promise<void> {
    const team = await this.getTeamById(teamId);
    team.members = team.members.filter((m) => m !== patientId);
  }

  // Mock database methods
  private static async getChallengeById(
    challengeId: string
  ): Promise<Challenge> {
    throw new Error("Not implemented");
  }

  private static async getParticipantById(
    participantId: string
  ): Promise<ChallengeParticipant> {
    throw new Error("Not implemented");
  }

  private static async getTeamById(teamId: string): Promise<ChallengeTeam> {
    throw new Error("Not implemented");
  }

  private static async findParticipant(
    challengeId: string,
    patientId: string
  ): Promise<ChallengeParticipant | null> {
    return null;
  }

  private static async getChallengeParticipants(
    challengeId: string
  ): Promise<ChallengeParticipant[]> {
    return [];
  }

  private static async getChallengeTeams(
    challengeId: string
  ): Promise<ChallengeTeam[]> {
    return [];
  }

  private static async getAvailableChallenges(): Promise<Challenge[]> {
    return [];
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface LeaderboardEntry {
  rank: number;
  patientId: string;
  displayName: string;
  progress: number;
  percentComplete: number;
  status: ParticipantStatus;
  joinedDate: Date;
  teamId: string | null;
}

interface TeamLeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  progress: number;
  memberCount: number;
  captain: string;
}

interface TeamInvitation {
  id: string;
  teamId: string;
  patientId: string;
  invitedBy: string;
  invitedAt: Date;
  status: "pending" | "accepted" | "declined";
  expiresAt: Date;
}

interface ChallengeStatistics {
  totalParticipants: number;
  activeParticipants: number;
  completedParticipants: number;
  averageProgress: number;
  completionRate: number;
  daysRemaining: number;
  isActive: boolean;
}

interface PatientPreferences {
  interestedCategories?: ChallengeCategory[];
  preferredDifficulty?: string;
  preferTeam?: boolean;
}

interface ChallengeRecommendation {
  challenge: Challenge;
  matchScore: number;
  reasons: string[];
  difficulty: "Easy" | "Medium" | "Hard";
}
