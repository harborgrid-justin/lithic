/**
 * Research Data Management Hook
 * Lithic Healthcare Platform v0.5
 */

import { useState, useCallback } from "react";
import {
  DataCaptureFormInstance,
  AdverseEvent,
  EligibilityAssessment,
} from "@/types/research";

export function useResearchData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFormInstance = useCallback(
    async (formId: string, subjectId: string, visitId: string | null) => {
      setLoading(true);
      try {
        const response = await fetch("/api/research/data-capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formId, subjectId, visitId }),
        });

        if (!response.ok) throw new Error("Failed to create form instance");
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateFormData = useCallback(
    async (
      instanceId: string,
      fieldName: string,
      value: any,
      reason?: string
    ) => {
      try {
        const response = await fetch(
          `/api/research/data-capture/${instanceId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fieldName, value, reason }),
          }
        );

        if (!response.ok) throw new Error("Failed to update form data");
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    []
  );

  const assessEligibility = useCallback(
    async (patientId: string, trialId: string) => {
      setLoading(true);
      try {
        const response = await fetch("/api/research/eligibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId, trialId }),
        });

        if (!response.ok) throw new Error("Failed to assess eligibility");
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reportAdverseEvent = useCallback(
    async (eventData: Partial<AdverseEvent>) => {
      setLoading(true);
      try {
        const response = await fetch("/api/research/adverse-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) throw new Error("Failed to report adverse event");
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    createFormInstance,
    updateFormData,
    assessEligibility,
    reportAdverseEvent,
  };
}
