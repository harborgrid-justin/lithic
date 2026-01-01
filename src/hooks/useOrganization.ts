"use client";

import { useState, useEffect, useCallback } from "react";
import {
  OrganizationContext,
  Organization,
  Facility,
  Department,
} from "@/types/enterprise";
import {
  tenantResolver,
  TenantSwitchOptions,
} from "@/lib/multi-tenant/tenant-resolver";

export interface UseOrganizationReturn {
  context: OrganizationContext | null;
  organization: Organization | null;
  facility: Facility | null;
  department: Department | null;
  loading: boolean;
  error: Error | null;
  switchOrganization: (options: TenantSwitchOptions) => Promise<void>;
  refreshContext: () => Promise<void>;
  getAccessibleOrganizations: () => Promise<Organization[]>;
}

export function useOrganization(): UseOrganizationReturn {
  const [context, setContext] = useState<OrganizationContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadContext = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user ID from auth context
      const userId = "current-user-id"; // Replace with actual auth

      // Resolve current context
      const resolvedContext = await tenantResolver.resolveContext(userId);
      setContext(resolvedContext);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to load organization context"),
      );
      console.error("Error loading organization context:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  const switchOrganization = useCallback(
    async (options: TenantSwitchOptions) => {
      try {
        setLoading(true);
        setError(null);

        const userId = "current-user-id";
        const newContext = await tenantResolver.switchContext(
          userId,
          options.organizationId,
          options.facilityId,
          options.departmentId,
        );

        setContext(newContext);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to switch organization"),
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const refreshContext = useCallback(async () => {
    await loadContext();
  }, [loadContext]);

  const getAccessibleOrganizations = useCallback(async () => {
    try {
      const userId = "current-user-id";
      return await tenantResolver.getAccessibleOrganizations(userId);
    } catch (err) {
      console.error("Error fetching accessible organizations:", err);
      return [];
    }
  }, []);

  return {
    context,
    organization: context?.organization || null,
    facility: context?.facility || null,
    department: context?.department || null,
    loading,
    error,
    switchOrganization,
    refreshContext,
    getAccessibleOrganizations,
  };
}
