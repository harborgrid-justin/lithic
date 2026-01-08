/**
 * useRPMData Hook
 * Custom hook for fetching and managing RPM data
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  VitalSignReading,
  ReadingType,
  AggregatedData,
  TimePeriod,
  CreateReadingDto,
} from "@/types/rpm";

export function useRPMData(patientId: string, readingType?: ReadingType) {
  const queryClient = useQueryClient();

  // Fetch latest readings
  const {
    data: latestReadings,
    isLoading: isLoadingLatest,
    error: latestError,
  } = useQuery({
    queryKey: ["rpm", "latest", patientId],
    queryFn: async () => {
      const response = await fetch(`/api/rpm/readings/latest?patientId=${patientId}`);
      if (!response.ok) throw new Error("Failed to fetch latest readings");
      return response.json() as Promise<Record<ReadingType, VitalSignReading>>;
    },
    enabled: !!patientId,
  });

  // Fetch readings history
  const {
    data: readings,
    isLoading: isLoadingReadings,
    error: readingsError,
  } = useQuery({
    queryKey: ["rpm", "readings", patientId, readingType],
    queryFn: async () => {
      const params = new URLSearchParams({ patientId });
      if (readingType) params.append("readingType", readingType);

      const response = await fetch(`/api/rpm/readings?${params}`);
      if (!response.ok) throw new Error("Failed to fetch readings");
      return response.json() as Promise<VitalSignReading[]>;
    },
    enabled: !!patientId,
  });

  // Fetch aggregated data
  const useAggregatedData = (period: TimePeriod = TimePeriod.WEEK) => {
    return useQuery({
      queryKey: ["rpm", "aggregated", patientId, readingType, period],
      queryFn: async () => {
        const params = new URLSearchParams({
          patientId,
          period,
        });
        if (readingType) params.append("readingType", readingType);

        const response = await fetch(`/api/rpm/readings/aggregated?${params}`);
        if (!response.ok) throw new Error("Failed to fetch aggregated data");
        return response.json() as Promise<AggregatedData>;
      },
      enabled: !!patientId && !!readingType,
    });
  };

  // Create reading mutation
  const createReading = useMutation({
    mutationFn: async (data: CreateReadingDto) => {
      const response = await fetch("/api/rpm/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create reading");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rpm", "readings", patientId] });
      queryClient.invalidateQueries({ queryKey: ["rpm", "latest", patientId] });
      queryClient.invalidateQueries({ queryKey: ["rpm", "aggregated", patientId] });
    },
  });

  return {
    latestReadings,
    readings,
    isLoading: isLoadingLatest || isLoadingReadings,
    error: latestError || readingsError,
    createReading: createReading.mutate,
    isCreating: createReading.isPending,
    useAggregatedData,
  };
}

export function useRPMStats(patientId: string) {
  return useQuery({
    queryKey: ["rpm", "stats", patientId],
    queryFn: async () => {
      const response = await fetch(`/api/rpm/stats?patientId=${patientId}`);
      if (!response.ok) throw new Error("Failed to fetch RPM stats");
      return response.json();
    },
    enabled: !!patientId,
  });
}

export function useRPMCompliance(patientId: string) {
  return useQuery({
    queryKey: ["rpm", "compliance", patientId],
    queryFn: async () => {
      const response = await fetch(`/api/rpm/compliance?patientId=${patientId}`);
      if (!response.ok) throw new Error("Failed to fetch compliance data");
      return response.json();
    },
    enabled: !!patientId,
    refetchInterval: 60000, // Refetch every minute
  });
}
