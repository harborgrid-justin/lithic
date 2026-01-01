/**
 * Permission Checking React Hook
 * Lithic v0.2 - Advanced RBAC System
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import {
  PermissionResource,
  PermissionAction,
  PermissionEvaluationResult,
} from "@/types/rbac";

interface PermissionCheckOptions {
  resource: PermissionResource | string;
  action: PermissionAction | string;
  resourceId?: string;
  departmentId?: string;
  locationId?: string;
}

interface UsePermissionsReturn {
  hasPermission: (options: PermissionCheckOptions) => Promise<boolean>;
  checkPermission: (
    options: PermissionCheckOptions,
  ) => Promise<PermissionEvaluationResult>;
  hasAnyPermission: (permissions: PermissionCheckOptions[]) => Promise<boolean>;
  hasAllPermissions: (
    permissions: PermissionCheckOptions[],
  ) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for checking user permissions
 */
export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const hasPermission = useCallback(
    async (options: PermissionCheckOptions): Promise<boolean> => {
      if (!user?.id) {
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/rbac/check-permission", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            organizationId: user.organizationId,
            ...options,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Permission check failed");
        }

        return data.allowed;
      } catch (err) {
        setError(err as Error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, user?.organizationId],
  );

  const checkPermission = useCallback(
    async (
      options: PermissionCheckOptions,
    ): Promise<PermissionEvaluationResult> => {
      if (!user?.id) {
        return {
          allowed: false,
          reason: "User not authenticated",
          matchedPolicies: [],
          conditions: [],
        };
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/rbac/check-permission", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            organizationId: user.organizationId,
            ...options,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Permission check failed");
        }

        return data;
      } catch (err) {
        setError(err as Error);
        return {
          allowed: false,
          reason: err instanceof Error ? err.message : "Unknown error",
          matchedPolicies: [],
          conditions: [],
        };
      } finally {
        setLoading(false);
      }
    },
    [user?.id, user?.organizationId],
  );

  const hasAnyPermission = useCallback(
    async (permissions: PermissionCheckOptions[]): Promise<boolean> => {
      if (!user?.id) {
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        const checks = await Promise.all(
          permissions.map((perm) => hasPermission(perm)),
        );

        return checks.some((allowed) => allowed);
      } catch (err) {
        setError(err as Error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, hasPermission],
  );

  const hasAllPermissions = useCallback(
    async (permissions: PermissionCheckOptions[]): Promise<boolean> => {
      if (!user?.id) {
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        const checks = await Promise.all(
          permissions.map((perm) => hasPermission(perm)),
        );

        return checks.every((allowed) => allowed);
      } catch (err) {
        setError(err as Error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, hasPermission],
  );

  return {
    hasPermission,
    checkPermission,
    hasAnyPermission,
    hasAllPermissions,
    loading,
    error,
  };
}

/**
 * Hook for checking a specific permission
 */
export function usePermission(
  resource: PermissionResource | string,
  action: PermissionAction | string,
  options?: {
    resourceId?: string;
    departmentId?: string;
    locationId?: string;
  },
): {
  allowed: boolean;
  loading: boolean;
  error: Error | null;
  recheck: () => void;
} {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [recheckTrigger, setRecheckTrigger] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const checkPermission = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/rbac/check-permission", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            organizationId: user.organizationId,
            resource,
            action,
            ...options,
          }),
        });

        const data = await response.json();

        if (!cancelled) {
          if (!response.ok) {
            throw new Error(data.error || "Permission check failed");
          }

          setAllowed(data.allowed);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setAllowed(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    checkPermission();

    return () => {
      cancelled = true;
    };
  }, [
    user?.id,
    user?.organizationId,
    resource,
    action,
    options,
    recheckTrigger,
  ]);

  const recheck = useCallback(() => {
    setRecheckTrigger((prev) => prev + 1);
  }, []);

  return {
    allowed,
    loading,
    error,
    recheck,
  };
}

/**
 * Hook for role checking
 */
export function useRole(roles: string | string[]): {
  hasRole: boolean;
  loading: boolean;
} {
  const { user } = useAuth();
  const [hasRole, setHasRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.role) {
      setHasRole(false);
      setLoading(false);
      return;
    }

    const roleArray = Array.isArray(roles) ? roles : [roles];
    const has = roleArray.includes(user.role);

    setHasRole(has);
    setLoading(false);
  }, [user?.role, roles]);

  return {
    hasRole,
    loading,
  };
}

/**
 * Hook for accessing user permissions list
 */
export function useUserPermissions(): {
  permissions: any[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
} {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchPermissions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/rbac/user-permissions?userId=${user.id}`,
        );
        const data = await response.json();

        if (!cancelled) {
          if (!response.ok) {
            throw new Error(data.error || "Failed to fetch permissions");
          }

          setPermissions(data.permissions || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setPermissions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPermissions();

    return () => {
      cancelled = true;
    };
  }, [user?.id, refreshTrigger]);

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return {
    permissions,
    loading,
    error,
    refresh,
  };
}
