/**
 * usePGx Hook
 * React hook for pharmacogenomics recommendations and drug-gene interactions
 */

import { useState, useEffect, useCallback } from "react";
import type {
  PGxRecommendation,
  PGxDrugRecommendation,
} from "@/types/genomics";

export interface UsePGxReturn {
  recommendations: PGxRecommendation[];
  activeAlerts: PGxRecommendation[];
  drugRecommendations: PGxDrugRecommendation[];
  loading: boolean;
  error: Error | null;
  fetchRecommendations: (patientId: string) => Promise<void>;
  checkDrugInteraction: (drug: string) => Promise<PGxDrugRecommendation | null>;
  getDrugAlternatives: (drug: string) => Promise<string[]>;
  refreshRecommendations: () => Promise<void>;
}

/**
 * Hook to manage pharmacogenomics recommendations
 */
export function usePGx(patientId?: string): UsePGxReturn {
  const [recommendations, setRecommendations] = useState<PGxRecommendation[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<PGxRecommendation[]>([]);
  const [drugRecommendations, setDrugRecommendations] = useState<PGxDrugRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch PGx recommendations for patient
   */
  const fetchRecommendations = useCallback(async (patId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/genomics/pgx?patientId=${patId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch PGx recommendations");
      }

      const data: PGxRecommendation[] = await response.json();
      setRecommendations(data);

      // Filter active alerts (recommendations that require action)
      const alerts = data.filter((rec) =>
        rec.drugs.some((d) => d.recommendation !== "USE_AS_DIRECTED" && d.strength === "STRONG")
      );
      setActiveAlerts(alerts);

      // Flatten all drug recommendations
      const allDrugRecs = data.flatMap((rec) => rec.drugs);
      setDrugRecommendations(allDrugRecs);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check if a specific drug has PGx interaction
   */
  const checkDrugInteraction = useCallback(
    async (drug: string): Promise<PGxDrugRecommendation | null> => {
      const drugLower = drug.toLowerCase();

      for (const rec of recommendations) {
        const drugRec = rec.drugs.find((d) =>
          d.drug.toLowerCase().includes(drugLower) ||
          drugLower.includes(d.drug.toLowerCase())
        );

        if (drugRec) {
          return drugRec;
        }
      }

      return null;
    },
    [recommendations]
  );

  /**
   * Get alternative drugs for a given medication
   */
  const getDrugAlternatives = useCallback(
    async (drug: string): Promise<string[]> => {
      const drugInteraction = await checkDrugInteraction(drug);

      if (drugInteraction && drugInteraction.alternatives.length > 0) {
        return drugInteraction.alternatives;
      }

      return [];
    },
    [checkDrugInteraction]
  );

  /**
   * Refresh recommendations
   */
  const refreshRecommendations = useCallback(async () => {
    if (patientId) {
      await fetchRecommendations(patientId);
    }
  }, [patientId, fetchRecommendations]);

  // Auto-fetch on mount if patientId provided
  useEffect(() => {
    if (patientId) {
      fetchRecommendations(patientId);
    }
  }, [patientId, fetchRecommendations]);

  return {
    recommendations,
    activeAlerts,
    drugRecommendations,
    loading,
    error,
    fetchRecommendations,
    checkDrugInteraction,
    getDrugAlternatives,
    refreshRecommendations,
  };
}

/**
 * Hook for real-time drug interaction checking
 */
export function useDrugInteractionCheck() {
  const [checking, setChecking] = useState(false);
  const [interactions, setInteractions] = useState<
    Map<string, PGxDrugRecommendation>
  >(new Map());

  /**
   * Check multiple drugs for interactions
   */
  const checkDrugs = useCallback(
    async (drugs: string[], patientId: string) => {
      setChecking(true);

      try {
        const response = await fetch(`/api/genomics/pgx/check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientId,
            drugs,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to check drug interactions");
        }

        const results: Record<string, PGxDrugRecommendation> =
          await response.json();

        const newInteractions = new Map<string, PGxDrugRecommendation>();
        for (const [drug, recommendation] of Object.entries(results)) {
          newInteractions.set(drug, recommendation);
        }

        setInteractions(newInteractions);
      } catch (err) {
        console.error("Error checking drug interactions:", err);
      } finally {
        setChecking(false);
      }
    },
    []
  );

  /**
   * Get interaction for specific drug
   */
  const getInteraction = useCallback(
    (drug: string): PGxDrugRecommendation | undefined => {
      return interactions.get(drug);
    },
    [interactions]
  );

  /**
   * Check if drug has interaction
   */
  const hasInteraction = useCallback(
    (drug: string): boolean => {
      const interaction = interactions.get(drug);
      return interaction !== undefined && interaction.recommendation !== "USE_AS_DIRECTED";
    },
    [interactions]
  );

  return {
    checking,
    interactions,
    checkDrugs,
    getInteraction,
    hasInteraction,
  };
}

/**
 * Hook for PGx gene status
 */
export function usePGxGeneStatus(patientId: string, gene: string) {
  const [diplotype, setDiplotype] = useState<string | null>(null);
  const [phenotype, setPhenotype] = useState<string | null>(null);
  const [affectedDrugs, setAffectedDrugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGeneStatus = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/genomics/pgx/genes/${gene}?patientId=${patientId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch gene status");
        }

        const data = await response.json();
        setDiplotype(data.diplotype);
        setPhenotype(data.phenotype);
        setAffectedDrugs(data.affectedDrugs || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    if (patientId && gene) {
      fetchGeneStatus();
    }
  }, [patientId, gene]);

  return {
    diplotype,
    phenotype,
    affectedDrugs,
    loading,
    error,
  };
}

export default usePGx;
