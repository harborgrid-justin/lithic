"use client";

import * as React from "react";

/**
 * Touch Gesture Types
 */
export type GestureType =
  | "tap"
  | "double-tap"
  | "long-press"
  | "swipe-left"
  | "swipe-right"
  | "swipe-up"
  | "swipe-down"
  | "pinch"
  | "rotate";

export interface GestureEvent {
  type: GestureType;
  target: EventTarget;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  distance: number;
  duration: number;
  velocity: number;
  scale?: number;
  rotation?: number;
}

export interface GestureHandlers {
  onTap?: (event: GestureEvent) => void;
  onDoubleTap?: (event: GestureEvent) => void;
  onLongPress?: (event: GestureEvent) => void;
  onSwipeLeft?: (event: GestureEvent) => void;
  onSwipeRight?: (event: GestureEvent) => void;
  onSwipeUp?: (event: GestureEvent) => void;
  onSwipeDown?: (event: GestureEvent) => void;
  onPinch?: (event: GestureEvent) => void;
  onRotate?: (event: GestureEvent) => void;
}

export interface GestureOptions {
  threshold?: number; // Minimum distance for swipe
  velocityThreshold?: number; // Minimum velocity for swipe
  longPressDelay?: number; // Delay for long press (ms)
  doubleTapDelay?: number; // Max delay between taps (ms)
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

/**
 * Use Mobile Gestures Hook
 * Detects and handles touch gestures on mobile devices
 */
export function useMobileGestures(
  handlers: GestureHandlers,
  options: GestureOptions = {}
) {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    longPressDelay = 500,
    doubleTapDelay = 300,
    preventDefault = false,
    stopPropagation = false,
  } = options;

  const touchState = React.useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTapTime: 0,
    longPressTimer: null as NodeJS.Timeout | null,
    isSwiping: false,
    isPinching: false,
    initialDistance: 0,
    initialAngle: 0,
  });

  // Calculate distance between two touch points
  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate angle between two touch points
  const getAngle = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  // Clear long press timer
  const clearLongPressTimer = () => {
    if (touchState.current.longPressTimer) {
      clearTimeout(touchState.current.longPressTimer);
      touchState.current.longPressTimer = null;
    }
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (preventDefault) e.preventDefault();
    if (stopPropagation) e.stopPropagation();

    const touch = e.touches[0];
    const now = Date.now();

    touchState.current.startX = touch.clientX;
    touchState.current.startY = touch.clientY;
    touchState.current.startTime = now;
    touchState.current.isSwiping = false;

    // Handle multi-touch gestures
    if (e.touches.length === 2) {
      touchState.current.isPinching = true;
      touchState.current.initialDistance = getDistance(
        e.touches[0],
        e.touches[1]
      );
      touchState.current.initialAngle = getAngle(e.touches[0], e.touches[1]);
    }

    // Set up long press timer
    if (handlers.onLongPress) {
      clearLongPressTimer();
      touchState.current.longPressTimer = setTimeout(() => {
        const event: GestureEvent = {
          type: "long-press",
          target: e.target,
          startX: touchState.current.startX,
          startY: touchState.current.startY,
          endX: touchState.current.startX,
          endY: touchState.current.startY,
          deltaX: 0,
          deltaY: 0,
          distance: 0,
          duration: longPressDelay,
          velocity: 0,
        };

        handlers.onLongPress?.(event);

        // Haptic feedback
        if ("vibrate" in navigator) {
          navigator.vibrate(10);
        }
      }, longPressDelay);
    }
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (preventDefault) e.preventDefault();
    if (stopPropagation) e.stopPropagation();

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchState.current.startX;
    const deltaY = touch.clientY - touchState.current.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Cancel long press if moved
    if (distance > 10) {
      clearLongPressTimer();
    }

    // Mark as swiping if moved beyond threshold
    if (distance > 10 && !touchState.current.isSwiping) {
      touchState.current.isSwiping = true;
    }

    // Handle pinch gesture
    if (e.touches.length === 2 && touchState.current.isPinching) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const currentAngle = getAngle(e.touches[0], e.touches[1]);

      const scale = currentDistance / touchState.current.initialDistance;
      const rotation = currentAngle - touchState.current.initialAngle;

      // Call pinch handler
      if (handlers.onPinch && Math.abs(scale - 1) > 0.1) {
        const event: GestureEvent = {
          type: "pinch",
          target: e.target,
          startX: touchState.current.startX,
          startY: touchState.current.startY,
          endX: touch.clientX,
          endY: touch.clientY,
          deltaX,
          deltaY,
          distance: currentDistance,
          duration: Date.now() - touchState.current.startTime,
          velocity: 0,
          scale,
          rotation,
        };

        handlers.onPinch(event);
      }

      // Call rotate handler
      if (handlers.onRotate && Math.abs(rotation) > 5) {
        const event: GestureEvent = {
          type: "rotate",
          target: e.target,
          startX: touchState.current.startX,
          startY: touchState.current.startY,
          endX: touch.clientX,
          endY: touch.clientY,
          deltaX,
          deltaY,
          distance: currentDistance,
          duration: Date.now() - touchState.current.startTime,
          velocity: 0,
          scale,
          rotation,
        };

        handlers.onRotate(event);
      }
    }
  };

  // Handle touch end
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (preventDefault) e.preventDefault();
    if (stopPropagation) e.stopPropagation();

    clearLongPressTimer();

    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const deltaX = endX - touchState.current.startX;
    const deltaY = endY - touchState.current.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - touchState.current.startTime;
    const velocity = distance / duration;

    const event: GestureEvent = {
      type: "tap",
      target: e.target,
      startX: touchState.current.startX,
      startY: touchState.current.startY,
      endX,
      endY,
      deltaX,
      deltaY,
      distance,
      duration,
      velocity,
    };

    // Detect swipe gestures
    if (distance > threshold && velocity > velocityThreshold) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0) {
          event.type = "swipe-right";
          handlers.onSwipeRight?.(event);
        } else {
          event.type = "swipe-left";
          handlers.onSwipeLeft?.(event);
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          event.type = "swipe-down";
          handlers.onSwipeDown?.(event);
        } else {
          event.type = "swipe-up";
          handlers.onSwipeUp?.(event);
        }
      }

      // Haptic feedback for swipe
      if ("vibrate" in navigator) {
        navigator.vibrate(5);
      }
    }
    // Detect tap gestures
    else if (distance < 10 && duration < 300) {
      const now = Date.now();
      const timeSinceLastTap = now - touchState.current.lastTapTime;

      // Double tap detection
      if (
        timeSinceLastTap < doubleTapDelay &&
        timeSinceLastTap > 0 &&
        handlers.onDoubleTap
      ) {
        event.type = "double-tap";
        handlers.onDoubleTap(event);
        touchState.current.lastTapTime = 0; // Reset to prevent triple tap

        // Haptic feedback for double tap
        if ("vibrate" in navigator) {
          navigator.vibrate([5, 50, 5]);
        }
      }
      // Single tap
      else {
        touchState.current.lastTapTime = now;

        // Wait to see if it's a double tap
        setTimeout(() => {
          if (touchState.current.lastTapTime === now && handlers.onTap) {
            handlers.onTap(event);

            // Haptic feedback for tap
            if ("vibrate" in navigator) {
              navigator.vibrate(5);
            }
          }
        }, doubleTapDelay);
      }
    }

    // Reset pinching state
    touchState.current.isPinching = false;
    touchState.current.isSwiping = false;
  };

  // Handle touch cancel
  const handleTouchCancel = (e: React.TouchEvent) => {
    clearLongPressTimer();
    touchState.current.isPinching = false;
    touchState.current.isSwiping = false;
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };
}

/**
 * Use Swipe Hook
 * Simplified hook for swipe gestures only
 */
export function useSwipe(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold: number = 50
) {
  return useMobileGestures(
    {
      onSwipeLeft: onSwipeLeft ? () => onSwipeLeft() : undefined,
      onSwipeRight: onSwipeRight ? () => onSwipeRight() : undefined,
      onSwipeUp: onSwipeUp ? () => onSwipeUp() : undefined,
      onSwipeDown: onSwipeDown ? () => onSwipeDown() : undefined,
    },
    { threshold }
  );
}

/**
 * Use Long Press Hook
 * Simplified hook for long press gesture
 */
export function useLongPress(
  onLongPress: () => void,
  delay: number = 500
) {
  return useMobileGestures(
    {
      onLongPress: () => onLongPress(),
    },
    { longPressDelay: delay }
  );
}

/**
 * Use Double Tap Hook
 * Simplified hook for double tap gesture
 */
export function useDoubleTap(
  onDoubleTap: () => void,
  delay: number = 300
) {
  return useMobileGestures(
    {
      onDoubleTap: () => onDoubleTap(),
    },
    { doubleTapDelay: delay }
  );
}

/**
 * Use Pinch Zoom Hook
 * Hook for pinch to zoom gesture
 */
export function usePinchZoom(
  onZoom: (scale: number) => void
) {
  return useMobileGestures({
    onPinch: (event) => {
      if (event.scale) {
        onZoom(event.scale);
      }
    },
  });
}
