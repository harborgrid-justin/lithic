/**
 * SDOH Screening Hook
 *
 * Custom React hook for managing SDOH screening state and operations
 */

import { useState, useCallback } from "react";
import type {
  SDOHScreening,
  QuestionnaireType,
  ScreeningResponse,
} from "@/types/sdoh";

export function useSDOHScreening(patientId: string) {
  const [screening, setScreening] = useState<SDOHScreening | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScreening = useCallback(
    async (questionnaireType: QuestionnaireType) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/sdoh/screening", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId,
            questionnaireType,
            administeredBy: "current-user-id",
          }),
        });

        if (!response.ok) throw new Error("Failed to start screening");

        const data = await response.json();
        setScreening(data.screening);
        return data.screening;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [patientId]
  );

  const completeScreening = useCallback(
    async (screeningId: string, responses: ScreeningResponse[]) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/sdoh/screening/${screeningId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ responses, status: "COMPLETED" }),
        });

        if (!response.ok) throw new Error("Failed to complete screening");

        const data = await response.json();
        setScreening(data.screening);
        return data.screening;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getPatientScreenings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/sdoh/screening?patientId=${patientId}`
      );

      if (!response.ok) throw new Error("Failed to fetch screenings");

      const data = await response.json();
      return data.screenings;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  return {
    screening,
    isLoading,
    error,
    startScreening,
    completeScreening,
    getPatientScreenings,
  };
}
