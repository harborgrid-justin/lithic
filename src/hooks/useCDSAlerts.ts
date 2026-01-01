import { useState, useEffect, useCallback } from "react";
import {
  CDSAlert,
  CDSEvaluationRequest,
  CDSEvaluationResult,
  CDSContext,
  EvaluationTrigger,
  OverrideReasonCode,
} from "@/types/cds";

interface UseCDSAlertsOptions {
  patientId: string;
  encounterId?: string;
  context?: CDSContext;
  autoEvaluate?: boolean;
  trigger?: EvaluationTrigger;
}

interface UseCDSAlertsReturn {
  alerts: CDSAlert[];
  loading: boolean;
  error: Error | null;
  evaluate: (context: CDSContext, trigger: EvaluationTrigger) => Promise<void>;
  acknowledgeAlert: (alertId: string, notes?: string) => Promise<void>;
  overrideAlert: (
    alertId: string,
    reason: string,
    reasonCode: OverrideReasonCode,
    notes?: string,
  ) => Promise<void>;
  dismissAlert: (alertId: string, reason?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * React hook for CDS alerts management
 */
export function useCDSAlerts(options: UseCDSAlertsOptions): UseCDSAlertsReturn {
  const {
    patientId,
    encounterId,
    context,
    autoEvaluate = true,
    trigger = EvaluationTrigger.MANUAL_EVALUATION,
  } = options;

  const [alerts, setAlerts] = useState<CDSAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Evaluate CDS rules
   */
  const evaluate = useCallback(
    async (
      evaluationContext: CDSContext,
      evaluationTrigger: EvaluationTrigger,
    ) => {
      if (!patientId || !evaluationContext) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const request: CDSEvaluationRequest = {
          patientId,
          encounterId,
          context: evaluationContext,
          trigger: evaluationTrigger,
        };

        const response = await fetch("/api/cds/evaluate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error("Failed to evaluate CDS rules");
        }

        const result: CDSEvaluationResult = await response.json();
        setAlerts(result.alerts);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        console.error("CDS evaluation error:", err);
      } finally {
        setLoading(false);
      }
    },
    [patientId, encounterId],
  );

  /**
   * Acknowledge an alert
   */
  const acknowledgeAlert = useCallback(
    async (alertId: string, notes?: string) => {
      try {
        const response = await fetch(`/api/cds/alerts/${alertId}/acknowledge`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes }),
        });

        if (!response.ok) {
          throw new Error("Failed to acknowledge alert");
        }

        const updatedAlert: CDSAlert = await response.json();

        setAlerts((prevAlerts) =>
          prevAlerts.map((alert) =>
            alert.id === alertId ? updatedAlert : alert,
          ),
        );
      } catch (err) {
        console.error("Failed to acknowledge alert:", err);
        throw err;
      }
    },
    [],
  );

  /**
   * Override an alert
   */
  const overrideAlert = useCallback(
    async (
      alertId: string,
      reason: string,
      reasonCode: OverrideReasonCode,
      notes?: string,
    ) => {
      try {
        const response = await fetch(`/api/cds/alerts/${alertId}/override`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason, reasonCode, notes }),
        });

        if (!response.ok) {
          throw new Error("Failed to override alert");
        }

        const updatedAlert: CDSAlert = await response.json();

        setAlerts((prevAlerts) =>
          prevAlerts.map((alert) =>
            alert.id === alertId ? updatedAlert : alert,
          ),
        );
      } catch (err) {
        console.error("Failed to override alert:", err);
        throw err;
      }
    },
    [],
  );

  /**
   * Dismiss an alert
   */
  const dismissAlert = useCallback(async (alertId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/cds/alerts/${alertId}/dismiss`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error("Failed to dismiss alert");
      }

      setAlerts((prevAlerts) =>
        prevAlerts.filter((alert) => alert.id !== alertId),
      );
    } catch (err) {
      console.error("Failed to dismiss alert:", err);
      throw err;
    }
  }, []);

  /**
   * Refresh alerts
   */
  const refresh = useCallback(async () => {
    if (context) {
      await evaluate(context, trigger);
    }
  }, [context, trigger, evaluate]);

  /**
   * Auto-evaluate on mount if enabled
   */
  useEffect(() => {
    if (autoEvaluate && context) {
      evaluate(context, trigger);
    }
  }, [autoEvaluate, context, trigger, evaluate]);

  return {
    alerts,
    loading,
    error,
    evaluate,
    acknowledgeAlert,
    overrideAlert,
    dismissAlert,
    refresh,
  };
}
