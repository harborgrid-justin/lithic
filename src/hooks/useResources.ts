/**
 * Resources Hook
 *
 * Custom React hook for managing community resource operations
 */

import { useState, useCallback } from "react";
import type {
  CommunityResource,
  ResourceSearchParams,
  ResourceSearchResult,
} from "@/types/sdoh";

export function useResources() {
  const [resources, setResources] = useState<CommunityResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchResources = useCallback(
    async (params: ResourceSearchParams): Promise<ResourceSearchResult[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/sdoh/resources/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (!response.ok) throw new Error("Failed to search resources");

        const data = await response.json();
        return data.results || [];
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getResource = useCallback(async (resourceId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sdoh/resources/${resourceId}`);

      if (!response.ok) throw new Error("Failed to fetch resource");

      const data = await response.json();
      return data.resource;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createReferral = useCallback(
    async (resourceId: string, patientId: string, data: any) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/sdoh/referrals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId, patientId, ...data }),
        });

        if (!response.ok) throw new Error("Failed to create referral");

        const result = await response.json();
        return result.referral;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    resources,
    isLoading,
    error,
    searchResources,
    getResource,
    createReferral,
  };
}
