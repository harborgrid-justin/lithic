"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { RefreshCw, ChevronDown } from "lucide-react";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
  maxPullDistance?: number;
  className?: string;
}

/**
 * Pull to Refresh Component
 * iOS-style pull to refresh for mobile
 */
export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  maxPullDistance = 120,
  className,
}: PullToRefreshProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isPulling, setIsPulling] = React.useState(false);
  const startY = React.useRef(0);
  const currentY = React.useRef(0);

  // Check if user is at top of scroll container
  const isAtTop = () => {
    if (!containerRef.current) return false;
    return containerRef.current.scrollTop === 0;
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || !isAtTop()) return;

    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || !isAtTop()) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    // Only pull down
    if (deltaY > 0) {
      setIsPulling(true);

      // Apply resistance curve
      let distance = deltaY;
      if (distance > threshold) {
        const excess = distance - threshold;
        distance = threshold + excess * 0.5;
      }

      // Cap at max pull distance
      distance = Math.min(distance, maxPullDistance);

      setPullDistance(distance);

      // Prevent default scroll when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  };

  // Handle touch end
  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return;

    setIsPulling(false);

    if (pullDistance >= threshold) {
      // Trigger refresh
      setIsRefreshing(true);
      setPullDistance(threshold);

      // Add haptic feedback
      if ("vibrate" in navigator) {
        navigator.vibrate(10);
      }

      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        // Animate back to 0
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 300);
      }
    } else {
      // Reset
      setPullDistance(0);
    }
  };

  // Calculate rotation for icon
  const iconRotation = React.useMemo(() => {
    if (isRefreshing) return 0;
    return Math.min((pullDistance / threshold) * 180, 180);
  }, [pullDistance, threshold, isRefreshing]);

  // Calculate opacity for indicator
  const indicatorOpacity = React.useMemo(() => {
    return Math.min(pullDistance / threshold, 1);
  }, [pullDistance, threshold]);

  // Determine indicator state
  const indicatorState = React.useMemo(() => {
    if (isRefreshing) return "refreshing";
    if (pullDistance >= threshold) return "ready";
    if (isPulling) return "pulling";
    return "idle";
  }, [isRefreshing, pullDistance, threshold, isPulling]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "pull-to-refresh-container",
        "relative overflow-y-auto h-full",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0",
          "flex items-center justify-center",
          "transition-all duration-200",
          "pointer-events-none",
          "z-50"
        )}
        style={{
          height: `${Math.max(pullDistance, 0)}px`,
          opacity: indicatorOpacity,
        }}
      >
        <div className="flex flex-col items-center gap-2">
          {/* Icon */}
          {indicatorState === "refreshing" ? (
            <RefreshCw
              className={cn(
                "w-6 h-6 text-primary",
                "animate-spin"
              )}
            />
          ) : (
            <ChevronDown
              className="w-6 h-6 text-primary transition-transform duration-200"
              style={{
                transform: `rotate(${iconRotation}deg)`,
              }}
            />
          )}

          {/* Text */}
          <span className="text-sm font-medium text-primary">
            {indicatorState === "refreshing" && "Refreshing..."}
            {indicatorState === "ready" && "Release to refresh"}
            {indicatorState === "pulling" && "Pull to refresh"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          "transition-transform duration-200",
          isPulling && "touch-none"
        )}
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Simpler Pull to Refresh (icon only)
 */
interface SimplePullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function SimplePullToRefresh({
  children,
  onRefresh,
  disabled = false,
  className,
}: SimplePullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (isRefreshing || disabled) return;

    setIsRefreshing(true);

    try {
      await onRefresh();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      disabled={disabled}
      className={className}
    >
      {children}
    </PullToRefresh>
  );
}

/**
 * Manual Refresh Button
 * Alternative to pull to refresh
 */
interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function RefreshButton({
  onRefresh,
  disabled = false,
  className,
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleClick = async () => {
    if (isRefreshing || disabled) return;

    setIsRefreshing(true);

    // Add haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }

    try {
      await onRefresh();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isRefreshing}
      className={cn(
        "flex items-center gap-2",
        "px-4 py-2",
        "rounded-lg",
        "bg-muted hover:bg-muted/80",
        "text-sm font-medium",
        "transition-all duration-200",
        "active:scale-95",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      <RefreshCw
        className={cn("w-4 h-4", isRefreshing && "animate-spin")}
      />
      <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
    </button>
  );
}

/**
 * Refresh Indicator (for use in headers)
 */
interface RefreshIndicatorProps {
  isRefreshing: boolean;
  className?: string;
}

export function RefreshIndicator({
  isRefreshing,
  className,
}: RefreshIndicatorProps) {
  if (!isRefreshing) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        "text-sm font-medium text-primary",
        className
      )}
    >
      <RefreshCw className="w-4 h-4 animate-spin" />
      <span>Refreshing...</span>
    </div>
  );
}

/**
 * Auto Refresh Hook
 * Automatically refresh data at intervals
 */
export function useAutoRefresh(
  onRefresh: () => Promise<void>,
  intervalMs: number = 30000,
  enabled: boolean = true
) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [lastRefresh, setLastRefresh] = React.useState<Date | null>(null);

  const refresh = React.useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Auto refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);

  React.useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(refresh, intervalMs);

    return () => clearInterval(interval);
  }, [enabled, intervalMs, refresh]);

  return {
    isRefreshing,
    lastRefresh,
    refresh,
  };
}
