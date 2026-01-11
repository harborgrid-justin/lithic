/**
 * Goals Management Hook
 * Agent 5: Patient Engagement Platform
 *
 * Centralized hook for managing health goals including:
 * - Goal CRUD operations
 * - Progress tracking
 * - Recommendations
 * - Analytics
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  HealthGoal,
  GoalType,
  GoalStatus,
  CreateGoalDto,
  UpdateGoalDto,
} from "@/types/engagement";

// ============================================================================
// useGoals Hook
// ============================================================================

export function useGoals(patientId: string, filters?: GoalFilters) {
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load goals
   */
  const loadGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        patientId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.type && { type: filters.type }),
        ...(filters?.category && { category: filters.category }),
      });

      const response = await fetch(`/api/engagement/goals?${params}`);
      if (!response.ok) throw new Error("Failed to load goals");

      const data = await response.json();
      setGoals(data.goals || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [patientId, filters]);

  /**
   * Create new goal
   */
  const createGoal = useCallback(
    async (goalData: CreateGoalDto) => {
      try {
        const response = await fetch("/api/engagement/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(goalData),
        });

        if (!response.ok) throw new Error("Failed to create goal");

        const data = await response.json();
        const newGoal = data.goal;

        setGoals((prev) => [...prev, newGoal]);
        return newGoal;
      } catch (err) {
        console.error("Failed to create goal:", err);
        throw err;
      }
    },
    []
  );

  /**
   * Update goal
   */
  const updateGoal = useCallback(async (goalData: UpdateGoalDto) => {
    try {
      const response = await fetch(`/api/engagement/goals/${goalData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) throw new Error("Failed to update goal");

      const data = await response.json();
      const updatedGoal = data.goal;

      setGoals((prev) =>
        prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
      );

      return updatedGoal;
    } catch (err) {
      console.error("Failed to update goal:", err);
      throw err;
    }
  }, []);

  /**
   * Update goal progress
   */
  const updateProgress = useCallback(
    async (goalId: string, value: number, source: string = "MANUAL") => {
      try {
        const response = await fetch(
          `/api/engagement/goals/${goalId}/progress`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              value,
              source,
            }),
          }
        );

        if (!response.ok) throw new Error("Failed to update progress");

        const data = await response.json();
        const updatedGoal = data.goal;

        setGoals((prev) =>
          prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
        );

        // Return points earned for UI feedback
        return {
          goal: updatedGoal,
          pointsEarned: data.pointsEarned || 0,
        };
      } catch (err) {
        console.error("Failed to update progress:", err);
        throw err;
      }
    },
    []
  );

  /**
   * Delete goal
   */
  const deleteGoal = useCallback(async (goalId: string) => {
    try {
      const response = await fetch(`/api/engagement/goals/${goalId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete goal");

      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch (err) {
      console.error("Failed to delete goal:", err);
      throw err;
    }
  }, []);

  /**
   * Complete goal
   */
  const completeGoal = useCallback(
    async (goalId: string) => {
      return updateGoal({
        id: goalId,
        status: GoalStatus.COMPLETED,
      });
    },
    [updateGoal]
  );

  /**
   * Abandon goal
   */
  const abandonGoal = useCallback(
    async (goalId: string) => {
      return updateGoal({
        id: goalId,
        status: GoalStatus.ABANDONED,
      });
    },
    [updateGoal]
  );

  // Load goals on mount and when filters change
  useEffect(() => {
    if (patientId) {
      loadGoals();
    }
  }, [patientId, loadGoals]);

  return {
    // State
    goals,
    isLoading,
    error,

    // Actions
    createGoal,
    updateGoal,
    updateProgress,
    deleteGoal,
    completeGoal,
    abandonGoal,

    // Utilities
    refresh: loadGoals,
    activeGoals: goals.filter((g) => g.status === GoalStatus.ACTIVE),
    completedGoals: goals.filter((g) => g.status === GoalStatus.COMPLETED),
  };
}

// ============================================================================
// useGoalRecommendations Hook
// ============================================================================

export function useGoalRecommendations(patientId: string) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/engagement/goals/recommendations?patientId=${patientId}`
        );

        if (!response.ok) throw new Error("Failed to load recommendations");

        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    if (patientId) {
      loadRecommendations();
    }
  }, [patientId]);

  const acceptRecommendation = useCallback(
    async (recommendation: any) => {
      const goalData: CreateGoalDto = {
        patientId,
        type: recommendation.type,
        category: recommendation.category || "WELLNESS",
        title: recommendation.title,
        description: recommendation.description,
        targetValue: recommendation.suggestedTarget,
        unit: recommendation.unit,
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      };

      const response = await fetch("/api/engagement/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) throw new Error("Failed to create goal");

      return await response.json();
    },
    [patientId]
  );

  return {
    recommendations,
    isLoading,
    error,
    acceptRecommendation,
  };
}

// ============================================================================
// useGoalAnalytics Hook
// ============================================================================

export function useGoalAnalytics(patientId: string) {
  const [analytics, setAnalytics] = useState<GoalAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/engagement/goals/analytics?patientId=${patientId}`
      );

      if (!response.ok) throw new Error("Failed to load analytics");

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      loadAnalytics();
    }
  }, [patientId, loadAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    refresh: loadAnalytics,
  };
}

// ============================================================================
// useGoalProgress Hook
// ============================================================================

export function useGoalProgress(goalId: string) {
  const [progress, setProgress] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/engagement/goals/${goalId}/progress`
        );

        if (!response.ok) throw new Error("Failed to load progress");

        const data = await response.json();
        setProgress(data.progress || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    if (goalId) {
      loadProgress();
    }
  }, [goalId]);

  return {
    progress,
    isLoading,
    error,
  };
}

// ============================================================================
// Type Definitions
// ============================================================================

interface GoalFilters {
  status?: GoalStatus;
  type?: GoalType;
  category?: string;
}

interface GoalAnalytics {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  abandonedGoals: number;
  completionRate: number;
  avgCompletionTime: number;
  typeSuccessRates: Record<GoalType, number>;
  strongestCategories: GoalType[];
  recommendedFocus: GoalType[];
}
