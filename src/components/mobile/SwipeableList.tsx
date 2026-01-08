"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Trash2, Star, Archive, Mail, Check, X } from "lucide-react";

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "destructive" | "info";
  onClick: () => void;
}

interface SwipeableListItemProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeComplete?: (actionId: string) => void;
  className?: string;
  threshold?: number;
}

/**
 * Swipeable List Item
 * iOS-style swipeable list item with actions
 */
export function SwipeableListItem({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeComplete,
  className,
  threshold = 80,
}: SwipeableListItemProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = React.useState(0);
  const [isSwiping, setIsSwiping] = React.useState(false);
  const [revealedActions, setRevealedActions] = React.useState<"left" | "right" | null>(null);
  const startX = React.useRef(0);
  const currentX = React.useRef(0);
  const lastTranslateX = React.useRef(0);

  const colorClasses = {
    primary: "bg-primary text-primary-foreground",
    success: "bg-green-500 text-white",
    warning: "bg-yellow-500 text-white",
    destructive: "bg-destructive text-destructive-foreground",
    info: "bg-blue-500 text-white",
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setIsSwiping(true);

    // Add haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate(5);
    }
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;

    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current + lastTranslateX.current;

    // Limit swipe distance
    const maxLeft = leftActions.length > 0 ? leftActions.length * 80 : 0;
    const maxRight = rightActions.length > 0 ? rightActions.length * 80 : 0;

    let newTranslateX = deltaX;

    // Apply resistance at limits
    if (deltaX > maxLeft) {
      newTranslateX = maxLeft + (deltaX - maxLeft) * 0.3;
    } else if (deltaX < -maxRight) {
      newTranslateX = -maxRight + (deltaX + maxRight) * 0.3;
    }

    setTranslateX(newTranslateX);
  };

  // Handle touch end
  const handleTouchEnd = () => {
    setIsSwiping(false);

    const deltaX = translateX;
    const absTranslateX = Math.abs(translateX);

    // Check if threshold is met
    if (absTranslateX >= threshold) {
      // Snap to revealed position
      if (deltaX > 0 && leftActions.length > 0) {
        setTranslateX(leftActions.length * 80);
        lastTranslateX.current = leftActions.length * 80;
        setRevealedActions("left");
      } else if (deltaX < 0 && rightActions.length > 0) {
        setTranslateX(-rightActions.length * 80);
        lastTranslateX.current = -rightActions.length * 80;
        setRevealedActions("right");
      } else {
        resetPosition();
      }
    } else {
      resetPosition();
    }
  };

  // Reset position
  const resetPosition = () => {
    setTranslateX(0);
    lastTranslateX.current = 0;
    setRevealedActions(null);
  };

  // Handle action click
  const handleActionClick = (action: SwipeAction) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }

    action.onClick();

    if (onSwipeComplete) {
      onSwipeComplete(action.id);
    }

    // Reset position after action
    setTimeout(resetPosition, 200);
  };

  // Handle mouse events for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    currentX.current = startX.current;
    setIsSwiping(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwiping) return;

    currentX.current = e.clientX;
    const deltaX = currentX.current - startX.current + lastTranslateX.current;

    const maxLeft = leftActions.length > 0 ? leftActions.length * 80 : 0;
    const maxRight = rightActions.length > 0 ? rightActions.length * 80 : 0;

    let newTranslateX = deltaX;

    if (deltaX > maxLeft) {
      newTranslateX = maxLeft + (deltaX - maxLeft) * 0.3;
    } else if (deltaX < -maxRight) {
      newTranslateX = -maxRight + (deltaX + maxRight) * 0.3;
    }

    setTranslateX(newTranslateX);
  };

  const handleMouseUp = () => {
    if (!isSwiping) return;
    handleTouchEnd();
  };

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        revealedActions &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        resetPosition();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [revealedActions]);

  return (
    <div
      ref={containerRef}
      className={cn("swipeable-list-item", "relative overflow-hidden", className)}
    >
      {/* Left actions */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex">
          {leftActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={cn(
                "flex items-center justify-center",
                "w-20 h-full",
                "transition-all duration-200",
                "active:scale-95",
                colorClasses[action.color]
              )}
              style={{
                opacity: Math.min(1, translateX / 80),
              }}
            >
              <div className="flex flex-col items-center gap-1">
                {action.icon}
                <span className="text-xs font-medium">{action.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Right actions */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex">
          {rightActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={cn(
                "flex items-center justify-center",
                "w-20 h-full",
                "transition-all duration-200",
                "active:scale-95",
                colorClasses[action.color]
              )}
              style={{
                opacity: Math.min(1, Math.abs(translateX) / 80),
              }}
            >
              <div className="flex flex-col items-center gap-1">
                {action.icon}
                <span className="text-xs font-medium">{action.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div
        ref={contentRef}
        className={cn(
          "swipeable-content",
          "bg-background",
          "relative z-10",
          "touch-pan-y",
          isSwiping ? "transition-none" : "transition-transform duration-200"
        )}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={isSwiping ? handleMouseMove : undefined}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Swipeable List Container
 */
interface SwipeableListProps {
  children: React.ReactNode;
  className?: string;
  divided?: boolean;
}

export function SwipeableList({
  children,
  className,
  divided = true,
}: SwipeableListProps) {
  return (
    <div
      className={cn(
        "swipeable-list",
        divided && "divide-y divide-border",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Common Swipe Actions Presets
 */
export const SwipeActions = {
  delete: (onClick: () => void): SwipeAction => ({
    id: "delete",
    label: "Delete",
    icon: <Trash2 className="w-5 h-5" />,
    color: "destructive",
    onClick,
  }),

  archive: (onClick: () => void): SwipeAction => ({
    id: "archive",
    label: "Archive",
    icon: <Archive className="w-5 h-5" />,
    color: "warning",
    onClick,
  }),

  star: (onClick: () => void): SwipeAction => ({
    id: "star",
    label: "Star",
    icon: <Star className="w-5 h-5" />,
    color: "primary",
    onClick,
  }),

  markRead: (onClick: () => void): SwipeAction => ({
    id: "mark-read",
    label: "Read",
    icon: <Mail className="w-5 h-5" />,
    color: "info",
    onClick,
  }),

  complete: (onClick: () => void): SwipeAction => ({
    id: "complete",
    label: "Done",
    icon: <Check className="w-5 h-5" />,
    color: "success",
    onClick,
  }),

  dismiss: (onClick: () => void): SwipeAction => ({
    id: "dismiss",
    label: "Dismiss",
    icon: <X className="w-5 h-5" />,
    color: "warning",
    onClick,
  }),
};

/**
 * Example usage with patient list
 */
interface SwipeablePatientListItemProps {
  patient: {
    id: string;
    name: string;
    mrn: string;
  };
  onView?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export function SwipeablePatientListItem({
  patient,
  onView,
  onArchive,
  onDelete,
}: SwipeablePatientListItemProps) {
  const rightActions: SwipeAction[] = [];

  if (onArchive) {
    rightActions.push(SwipeActions.archive(onArchive));
  }

  if (onDelete) {
    rightActions.push(SwipeActions.delete(onDelete));
  }

  return (
    <SwipeableListItem rightActions={rightActions}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={onView}
      >
        <div className="flex-1">
          <div className="font-medium">{patient.name}</div>
          <div className="text-sm text-muted-foreground">MRN: {patient.mrn}</div>
        </div>
      </div>
    </SwipeableListItem>
  );
}
