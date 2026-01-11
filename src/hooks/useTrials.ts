/**
 * Clinical Trials Management Hook
 * Lithic Healthcare Platform v0.5
 */

import { useState, useEffect, useCallback } from "react";
import { ClinicalTrial, TrialSearchParams, StudySubject } from "@/types/research";

export function useTrials(organizationId: string) {
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrials = useCallback(
    async (params?: TrialSearchParams) => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams({
          organizationId,
          ...(params as any),
        });

        const response = await fetch(`/api/research/trials?${queryParams}`);

        if (!response.ok) {
          throw new Error("Failed to fetch trials");
        }

        const data = await response.json();
        setTrials(data.trials);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [organizationId]
  );

  useEffect(() => {
    fetchTrials();
  }, [fetchTrials]);

  const getTrial = useCallback(async (trialId: string) => {
    try {
      const response = await fetch(`/api/research/trials/${trialId}`);
      if (!response.ok) throw new Error("Failed to fetch trial");
      return await response.json();
    } catch (err) {
      throw err;
    }
  }, []);

  const createTrial = useCallback(async (trialData: Partial<ClinicalTrial>) => {
    try {
      const response = await fetch("/api/research/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trialData),
      });

      if (!response.ok) throw new Error("Failed to create trial");

      const newTrial = await response.json();
      setTrials((prev) => [...prev, newTrial]);
      return newTrial;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateTrial = useCallback(
    async (trialId: string, updates: Partial<ClinicalTrial>) => {
      try {
        const response = await fetch(`/api/research/trials/${trialId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!response.ok) throw new Error("Failed to update trial");

        const updatedTrial = await response.json();
        setTrials((prev) =>
          prev.map((t) => (t.id === trialId ? updatedTrial : t))
        );
        return updatedTrial;
      } catch (err) {
        throw err;
      }
    },
    []
  );

  return {
    trials,
    loading,
    error,
    fetchTrials,
    getTrial,
    createTrial,
    updateTrial,
  };
}

export function useTrial(trialId: string) {
  const [trial, setTrial] = useState<ClinicalTrial | null>(null);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrial = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/research/trials/${trialId}`);
        if (!response.ok) throw new Error("Failed to fetch trial");
        const data = await response.json();
        setTrial(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    if (trialId) {
      fetchTrial();
    }
  }, [trialId]);

  const fetchSubjects = useCallback(async () => {
    try {
      const response = await fetch(`/api/research/trials/${trialId}/subjects`);
      if (!response.ok) throw new Error("Failed to fetch subjects");
      const data = await response.json();
      setSubjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [trialId]);

  return {
    trial,
    subjects,
    loading,
    error,
    fetchSubjects,
  };
}
