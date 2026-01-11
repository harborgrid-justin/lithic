"use client";

import * as React from "react";

export interface OfflineStatus {
  isOnline: boolean;
  isOffline: boolean;
  downlink?: number; // Network download speed (Mbps)
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  saveData?: boolean; // User requested reduced data usage
  rtt?: number; // Round-trip time (ms)
}

/**
 * Use Offline Status Hook
 * Monitors network connectivity and connection quality
 */
export function useOfflineStatus(): OfflineStatus {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  const [connectionInfo, setConnectionInfo] = React.useState<{
    downlink?: number;
    effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
    saveData?: boolean;
    rtt?: number;
  }>({});

  // Update online status
  const updateOnlineStatus = React.useCallback(() => {
    setIsOnline(navigator.onLine);
  }, []);

  // Update connection info
  const updateConnectionInfo = React.useCallback(() => {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;

      setConnectionInfo({
        downlink: connection.downlink,
        effectiveType: connection.effectiveType,
        saveData: connection.saveData,
        rtt: connection.rtt,
      });
    }
  }, []);

  React.useEffect(() => {
    // Initial update
    updateOnlineStatus();
    updateConnectionInfo();

    // Listen for online/offline events
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Listen for connection changes
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener("change", updateConnectionInfo);

      return () => {
        window.removeEventListener("online", updateOnlineStatus);
        window.removeEventListener("offline", updateOnlineStatus);
        connection.removeEventListener("change", updateConnectionInfo);
      };
    }

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, [updateOnlineStatus, updateConnectionInfo]);

  return {
    isOnline,
    isOffline: !isOnline,
    ...connectionInfo,
  };
}

/**
 * Use Network Speed Hook
 * Returns estimated network speed category
 */
export function useNetworkSpeed(): "fast" | "medium" | "slow" | "offline" {
  const { isOnline, effectiveType, downlink } = useOfflineStatus();

  return React.useMemo(() => {
    if (!isOnline) return "offline";

    // Use Network Information API if available
    if (effectiveType) {
      if (effectiveType === "4g") return "fast";
      if (effectiveType === "3g") return "medium";
      return "slow";
    }

    // Fallback to downlink speed
    if (downlink !== undefined) {
      if (downlink >= 5) return "fast";
      if (downlink >= 1.5) return "medium";
      return "slow";
    }

    // Default to medium if no info available
    return "medium";
  }, [isOnline, effectiveType, downlink]);
}

/**
 * Use Online Effect Hook
 * Runs effect only when online
 */
export function useOnlineEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
) {
  const { isOnline } = useOfflineStatus();

  React.useEffect(() => {
    if (isOnline) {
      return effect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, ...(deps || [])]);
}

/**
 * Use Offline Effect Hook
 * Runs effect only when offline
 */
export function useOfflineEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
) {
  const { isOffline } = useOfflineStatus();

  React.useEffect(() => {
    if (isOffline) {
      return effect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline, ...(deps || [])]);
}

/**
 * Use Connection Quality Hook
 * Returns connection quality information
 */
export function useConnectionQuality() {
  const status = useOfflineStatus();
  const speed = useNetworkSpeed();

  const quality = React.useMemo<"excellent" | "good" | "poor" | "offline">(() => {
    if (!status.isOnline) return "offline";

    if (speed === "fast") {
      if (status.rtt && status.rtt < 100) return "excellent";
      return "good";
    }

    if (speed === "medium") return "good";

    return "poor";
  }, [status, speed]);

  const shouldReduceData = React.useMemo(() => {
    return (
      status.saveData || quality === "poor" || quality === "offline"
    );
  }, [status.saveData, quality]);

  return {
    quality,
    speed,
    shouldReduceData,
    ...status,
  };
}

/**
 * Use Offline Alert Hook
 * Shows alert when going offline/online
 */
export function useOfflineAlert(
  onOnline?: () => void,
  onOffline?: () => void
) {
  const { isOnline } = useOfflineStatus();
  const wasOnline = React.useRef(isOnline);

  React.useEffect(() => {
    if (wasOnline.current && !isOnline) {
      // Just went offline
      console.log("Connection lost");
      onOffline?.();

      // Show notification if supported
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Connection Lost", {
          body: "You are now offline. Some features may be limited.",
          icon: "/icons/icon-192x192.png",
          tag: "offline-status",
        });
      }
    } else if (!wasOnline.current && isOnline) {
      // Just came online
      console.log("Connection restored");
      onOnline?.();

      // Show notification if supported
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Connection Restored", {
          body: "You are back online. Syncing data...",
          icon: "/icons/icon-192x192.png",
          tag: "online-status",
        });
      }
    }

    wasOnline.current = isOnline;
  }, [isOnline, onOnline, onOffline]);
}

/**
 * Use Offline Ready Hook
 * Ensures required data is cached before going offline
 */
export function useOfflineReady(
  prepareForOffline: () => Promise<void>,
  enabled: boolean = true
) {
  const [isReady, setIsReady] = React.useState(false);
  const [isPreparing, setIsPreparing] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const prepare = React.useCallback(async () => {
    if (!enabled || isPreparing) return;

    setIsPreparing(true);
    setError(null);

    try {
      await prepareForOffline();
      setIsReady(true);
      console.log("Offline preparation complete");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Preparation failed");
      setError(error);
      console.error("Offline preparation failed:", error);
    } finally {
      setIsPreparing(false);
    }
  }, [enabled, isPreparing, prepareForOffline]);

  // Auto-prepare when coming online
  useOnlineEffect(() => {
    if (enabled && !isReady && !isPreparing) {
      prepare();
    }
  }, [enabled, isReady, isPreparing]);

  return {
    isReady,
    isPreparing,
    error,
    prepare,
  };
}

/**
 * Use Offline Storage Hook
 * Provides offline-aware data storage
 */
export function useOfflineStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, boolean] {
  const { isOnline } = useOfflineStatus();
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return initialValue;
    }
  });

  const setValue = React.useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error("Error writing to localStorage:", error);
      }
    },
    [key]
  );

  return [storedValue, setValue, isOnline];
}

/**
 * Use Periodic Sync Hook
 * Registers periodic background sync
 */
export function usePeriodicSync(
  tag: string,
  minInterval: number = 12 * 60 * 60 * 1000 // 12 hours
) {
  const [isRegistered, setIsRegistered] = React.useState(false);

  React.useEffect(() => {
    const registerSync = async () => {
      if ("periodicSync" in ServiceWorkerRegistration.prototype) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await (registration as any).periodicSync.register(tag, {
            minInterval,
          });
          setIsRegistered(true);
          console.log(`Periodic sync registered: ${tag}`);
        } catch (error) {
          console.error("Periodic sync registration failed:", error);
        }
      }
    };

    registerSync();
  }, [tag, minInterval]);

  return isRegistered;
}
