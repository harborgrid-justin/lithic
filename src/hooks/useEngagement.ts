/**
 * Engagement State Hook
 * Agent 5: Patient Engagement Platform
 *
 * Centralized hook for managing engagement state including:
 * - Player profile and stats
 * - Points and experience
 * - Achievements and badges
 * - Streaks
 * - Leaderboards
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  PlayerProfile,
  AchievementEarned,
  BadgeEarned,
  Streak,
  EngagementMetrics,
} from "@/types/engagement";

// ============================================================================
// useEngagement Hook
// ============================================================================

export function useEngagement(patientId: string) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [achievements, setAchievements] = useState<AchievementEarned[]>([]);
  const [badges, setBadges] = useState<BadgeEarned[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load player profile
   */
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/engagement/profile/${patientId}`);
      if (!response.ok) throw new Error("Failed to load profile");

      const data = await response.json();
      setProfile(data.profile);
      setAchievements(data.achievements || []);
      setBadges(data.badges || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  /**
   * Load streaks
   */
  const loadStreaks = useCallback(async () => {
    try {
      const response = await fetch(`/api/engagement/streaks/${patientId}`);
      if (!response.ok) throw new Error("Failed to load streaks");

      const data = await response.json();
      setStreaks(data.streaks || []);
    } catch (err) {
      console.error("Failed to load streaks:", err);
    }
  }, [patientId]);

  /**
   * Load engagement metrics
   */
  const loadMetrics = useCallback(async () => {
    try {
      const response = await fetch(`/api/engagement/metrics/${patientId}`);
      if (!response.ok) throw new Error("Failed to load metrics");

      const data = await response.json();
      setMetrics(data.metrics);
    } catch (err) {
      console.error("Failed to load metrics:", err);
    }
  }, [patientId]);

  /**
   * Award points
   */
  const awardPoints = useCallback(
    async (amount: number, reason: string, category: string) => {
      try {
        const response = await fetch(`/api/engagement/points`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId,
            amount,
            reason,
            category,
          }),
        });

        if (!response.ok) throw new Error("Failed to award points");

        const data = await response.json();

        // Update profile
        if (data.profile) {
          setProfile(data.profile);
        }

        // Check for level up
        if (data.leveledUp) {
          // Trigger celebration animation
          console.log(`Level up! Now level ${data.newLevel}`);
        }

        return data;
      } catch (err) {
        console.error("Failed to award points:", err);
        throw err;
      }
    },
    [patientId]
  );

  /**
   * Check and award achievements
   */
  const checkAchievements = useCallback(
    async (eventType: string, eventData: Record<string, any>) => {
      try {
        const response = await fetch(`/api/engagement/achievements/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId,
            eventType,
            eventData,
          }),
        });

        if (!response.ok) return [];

        const data = await response.json();

        if (data.earned && data.earned.length > 0) {
          setAchievements((prev) => [...prev, ...data.earned]);
          return data.earned;
        }

        return [];
      } catch (err) {
        console.error("Failed to check achievements:", err);
        return [];
      }
    },
    [patientId]
  );

  /**
   * Record streak activity
   */
  const recordStreakActivity = useCallback(
    async (streakType: string, metadata?: Record<string, any>) => {
      try {
        const response = await fetch(`/api/engagement/streaks/record`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId,
            streakType,
            metadata,
          }),
        });

        if (!response.ok) throw new Error("Failed to record streak");

        const data = await response.json();

        // Update streaks
        if (data.streak) {
          setStreaks((prev) => {
            const index = prev.findIndex((s) => s.id === data.streak.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = data.streak;
              return updated;
            }
            return [...prev, data.streak];
          });
        }

        // Award milestone points if any
        if (data.pointsEarned > 0) {
          await awardPoints(
            data.pointsEarned,
            `Streak milestone: ${streakType}`,
            "STREAK_MILESTONE"
          );
        }

        return data;
      } catch (err) {
        console.error("Failed to record streak:", err);
        throw err;
      }
    },
    [patientId, awardPoints]
  );

  /**
   * Get player rank
   */
  const getRank = useCallback(
    async (timeframe: string = "ALL_TIME") => {
      try {
        const response = await fetch(
          `/api/engagement/rank/${patientId}?timeframe=${timeframe}`
        );
        if (!response.ok) throw new Error("Failed to get rank");

        const data = await response.json();
        return data.rank;
      } catch (err) {
        console.error("Failed to get rank:", err);
        return null;
      }
    },
    [patientId]
  );

  /**
   * Update preferences
   */
  const updatePreferences = useCallback(
    async (preferences: Partial<PlayerProfile["preferences"]>) => {
      try {
        const response = await fetch(`/api/engagement/preferences`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId,
            preferences,
          }),
        });

        if (!response.ok) throw new Error("Failed to update preferences");

        const data = await response.json();
        if (data.profile) {
          setProfile(data.profile);
        }

        return data;
      } catch (err) {
        console.error("Failed to update preferences:", err);
        throw err;
      }
    },
    [patientId]
  );

  // Load initial data
  useEffect(() => {
    if (patientId) {
      loadProfile();
      loadStreaks();
      loadMetrics();
    }
  }, [patientId, loadProfile, loadStreaks, loadMetrics]);

  return {
    // State
    profile,
    achievements,
    badges,
    streaks,
    metrics,
    isLoading,
    error,

    // Actions
    awardPoints,
    checkAchievements,
    recordStreakActivity,
    getRank,
    updatePreferences,

    // Utilities
    refresh: loadProfile,
    refreshStreaks: loadStreaks,
    refreshMetrics: loadMetrics,
  };
}

// ============================================================================
// useLeaderboard Hook
// ============================================================================

export function useLeaderboard(timeframe: string = "ALL_TIME", limit: number = 100) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/engagement/leaderboard?timeframe=${timeframe}&limit=${limit}`
        );

        if (!response.ok) throw new Error("Failed to load leaderboard");

        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, [timeframe, limit]);

  return { leaderboard, isLoading, error };
}

// ============================================================================
// useNotifications Hook
// ============================================================================

export function useNotifications(patientId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/engagement/notifications/${patientId}`);
      if (!response.ok) throw new Error("Failed to load notifications");

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/engagement/notifications/${notificationId}/read`,
        { method: "PATCH" }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/engagement/notifications/${patientId}/read-all`,
        { method: "PATCH" }
      );

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      loadNotifications();
    }
  }, [patientId, loadNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
}
