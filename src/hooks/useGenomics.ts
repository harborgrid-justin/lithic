/**
 * useGenomics Hook
 * React hook for managing genomic data, variants, and genetic tests
 */

import { useState, useEffect, useCallback } from "react";
import type {
  GenomicData,
  Variant,
  VariantInterpretation,
  GeneticRiskAssessment,
  SearchVariantParams,
  GenomicsSearchParams,
} from "@/types/genomics";

export interface UseGenomicsReturn {
  genomicData: GenomicData[];
  variants: Variant[];
  interpretations: VariantInterpretation[];
  riskAssessments: GeneticRiskAssessment[];
  loading: boolean;
  error: Error | null;
  fetchGenomicData: (patientId: string) => Promise<void>;
  searchVariants: (params: SearchVariantParams) => Promise<void>;
  getVariantDetails: (variantId: string) => Promise<Variant | null>;
  refreshData: () => Promise<void>;
}

/**
 * Hook to manage genomic data for a patient
 */
export function useGenomics(patientId?: string): UseGenomicsReturn {
  const [genomicData, setGenomicData] = useState<GenomicData[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [interpretations, setInterpretations] = useState<VariantInterpretation[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<GeneticRiskAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch genomic data for patient
   */
  const fetchGenomicData = useCallback(async (patId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/genomics/tests?patientId=${patId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch genomic data");
      }

      const data: GenomicData[] = await response.json();
      setGenomicData(data);

      // Extract all variants
      const allVariants = data.flatMap((test) => test.variants);
      setVariants(allVariants);

      // Extract all interpretations
      const allInterpretations = data.flatMap((test) => test.interpretations);
      setInterpretations(allInterpretations);

      // Extract all risk assessments
      const allRiskAssessments = data.flatMap((test) => test.riskAssessments);
      setRiskAssessments(allRiskAssessments);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Search variants
   */
  const searchVariants = useCallback(async (params: SearchVariantParams) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      if (params.gene) queryParams.append("gene", params.gene);
      if (params.chromosome) queryParams.append("chromosome", params.chromosome);
      if (params.position) queryParams.append("position", params.position.toString());
      if (params.variantType) queryParams.append("variantType", params.variantType);
      if (params.classification) queryParams.append("classification", params.classification);
      if (params.hgvs) queryParams.append("hgvs", params.hgvs);
      if (params.dbSnpId) queryParams.append("dbSnpId", params.dbSnpId);

      const response = await fetch(`/api/genomics/variants?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to search variants");
      }

      const data: Variant[] = await response.json();
      setVariants(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get variant details
   */
  const getVariantDetails = useCallback(async (variantId: string): Promise<Variant | null> => {
    try {
      const response = await fetch(`/api/genomics/variants/${variantId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch variant details");
      }

      const variant: Variant = await response.json();
      return variant;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      return null;
    }
  }, []);

  /**
   * Refresh data
   */
  const refreshData = useCallback(async () => {
    if (patientId) {
      await fetchGenomicData(patientId);
    }
  }, [patientId, fetchGenomicData]);

  // Auto-fetch on mount if patientId provided
  useEffect(() => {
    if (patientId) {
      fetchGenomicData(patientId);
    }
  }, [patientId, fetchGenomicData]);

  return {
    genomicData,
    variants,
    interpretations,
    riskAssessments,
    loading,
    error,
    fetchGenomicData,
    searchVariants,
    getVariantDetails,
    refreshData,
  };
}

/**
 * Hook for actionable variants
 */
export function useActionableVariants(patientId: string) {
  const [actionableVariants, setActionableVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchActionableVariants = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/genomics/variants?patientId=${patientId}&actionable=true`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch actionable variants");
        }

        const data: Variant[] = await response.json();
        setActionableVariants(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchActionableVariants();
    }
  }, [patientId]);

  return { actionableVariants, loading, error };
}

/**
 * Hook for incidental findings
 */
export function useIncidentalFindings(patientId: string) {
  const [incidentalFindings, setIncidentalFindings] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchIncidentalFindings = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/genomics/variants?patientId=${patientId}&incidentalFindings=true`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch incidental findings");
        }

        const data: Variant[] = await response.json();
        setIncidentalFindings(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchIncidentalFindings();
    }
  }, [patientId]);

  return { incidentalFindings, loading, error };
}

export default useGenomics;
