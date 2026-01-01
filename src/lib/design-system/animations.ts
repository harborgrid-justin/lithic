/**
 * Lithic Enterprise Animation Library
 *
 * Comprehensive animation utilities for enterprise healthcare platform.
 * Includes page transitions, micro-interactions, loading states, and feedback animations.
 */

import { animation } from './tokens';

// Animation Variants for Framer Motion (if used) or CSS classes
export const pageTransitions = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: [0, 0, 0.2, 1] },
  },

  slideInFromRight: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
  },

  slideInFromLeft: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
  },

  slideInFromTop: {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 },
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
  },

  slideInFromBottom: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
  },

  scaleIn: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    transition: { duration: 0.2, ease: [0, 0, 0.2, 1] },
  },

  zoomIn: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 },
    transition: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] },
  },
} as const;

// Micro-interactions
export const microAnimations = {
  buttonPress: {
    whileTap: { scale: 0.98 },
    transition: { duration: 0.1 },
  },

  buttonHover: {
    whileHover: { scale: 1.02 },
    transition: { duration: 0.15 },
  },

  cardHover: {
    whileHover: { y: -4, boxShadow: '0 12px 24px -8px rgba(0, 0, 0, 0.15)' },
    transition: { duration: 0.2 },
  },

  iconSpin: {
    animate: { rotate: 360 },
    transition: { duration: 1, repeat: Infinity, ease: 'linear' },
  },

  iconPulse: {
    animate: { scale: [1, 1.1, 1] },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },

  shake: {
    animate: { x: [-2, 2, -2, 2, 0] },
    transition: { duration: 0.4 },
  },

  bounce: {
    animate: { y: [-4, 0, -4, 0] },
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
} as const;

// Loading Animations
export const loadingAnimations = {
  spinner: {
    animate: { rotate: 360 },
    transition: { duration: 1, repeat: Infinity, ease: 'linear' },
  },

  dots: {
    animate: { opacity: [0.4, 1, 0.4] },
    transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
  },

  pulse: {
    animate: { opacity: [0.6, 1, 0.6] },
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },

  skeleton: {
    animate: {
      backgroundColor: [
        'rgba(229, 231, 235, 1)',
        'rgba(243, 244, 246, 1)',
        'rgba(229, 231, 235, 1)',
      ],
    },
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },

  progress: {
    initial: { width: '0%' },
    animate: { width: '100%' },
    transition: { duration: 2, ease: 'easeInOut' },
  },
} as const;

// Success/Error Feedback Animations
export const feedbackAnimations = {
  success: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 },
    transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
  },

  error: {
    initial: { x: -10, opacity: 0 },
    animate: { x: [0, -5, 5, -5, 5, 0], opacity: 1 },
    exit: { x: 10, opacity: 0 },
    transition: { duration: 0.5 },
  },

  notification: {
    initial: { x: 400, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 400, opacity: 0 },
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
  },

  checkmark: {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
} as const;

// Modal/Dialog Animations
export const modalAnimations = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },

  content: {
    initial: { scale: 0.95, opacity: 0, y: 20 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 0.95, opacity: 0, y: 20 },
    transition: { duration: 0.2, ease: [0, 0, 0.2, 1] },
  },
} as const;

// Dropdown/Menu Animations
export const dropdownAnimations = {
  container: {
    initial: { opacity: 0, scale: 0.95, y: -10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -10 },
    transition: { duration: 0.15, ease: [0, 0, 0.2, 1] },
  },

  item: {
    initial: { x: -10, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.15 },
  },
} as const;

// Tooltip Animations
export const tooltipAnimations = {
  fadeIn: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
    transition: { duration: 0.1 },
  },
} as const;

// List/Stagger Animations
export const staggerAnimations = {
  container: {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  },

  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
  },
} as const;

// CSS Keyframe Animations (for Tailwind)
export const cssAnimations = {
  '@keyframes fadeIn': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },

  '@keyframes fadeOut': {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },

  '@keyframes slideInFromTop': {
    from: { transform: 'translateY(-100%)' },
    to: { transform: 'translateY(0)' },
  },

  '@keyframes slideInFromBottom': {
    from: { transform: 'translateY(100%)' },
    to: { transform: 'translateY(0)' },
  },

  '@keyframes slideInFromLeft': {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0)' },
  },

  '@keyframes slideInFromRight': {
    from: { transform: 'translateX(100%)' },
    to: { transform: 'translateX(0)' },
  },

  '@keyframes scaleIn': {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },

  '@keyframes scaleOut': {
    from: { transform: 'scale(1)', opacity: 1 },
    to: { transform: 'scale(0.95)', opacity: 0 },
  },

  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },

  '@keyframes pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },

  '@keyframes bounce': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-8px)' },
  },

  '@keyframes shake': {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
  },

  '@keyframes shimmer': {
    '0%': { backgroundPosition: '-1000px 0' },
    '100%': { backgroundPosition: '1000px 0' },
  },

  '@keyframes progressIndeterminate': {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(400%)' },
  },
} as const;

// Tailwind Animation Classes (to be added to tailwind.config.ts)
export const tailwindAnimations = {
  animation: {
    'fade-in': 'fadeIn 200ms cubic-bezier(0, 0, 0.2, 1)',
    'fade-out': 'fadeOut 200ms cubic-bezier(0.4, 0, 1, 1)',
    'slide-in-from-top': 'slideInFromTop 300ms cubic-bezier(0, 0, 0.2, 1)',
    'slide-in-from-bottom': 'slideInFromBottom 300ms cubic-bezier(0, 0, 0.2, 1)',
    'slide-in-from-left': 'slideInFromLeft 300ms cubic-bezier(0, 0, 0.2, 1)',
    'slide-in-from-right': 'slideInFromRight 300ms cubic-bezier(0, 0, 0.2, 1)',
    'scale-in': 'scaleIn 200ms cubic-bezier(0, 0, 0.2, 1)',
    'scale-out': 'scaleOut 200ms cubic-bezier(0.4, 0, 1, 1)',
    'spin': 'spin 1s linear infinite',
    'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    'bounce': 'bounce 1s infinite',
    'shake': 'shake 400ms cubic-bezier(0.36, 0.07, 0.19, 0.97)',
    'shimmer': 'shimmer 2s linear infinite',
    'progress-indeterminate': 'progressIndeterminate 1.5s ease-in-out infinite',
  },

  keyframes: {
    fadeIn: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    fadeOut: {
      from: { opacity: '1' },
      to: { opacity: '0' },
    },
    slideInFromTop: {
      from: { transform: 'translateY(-100%)' },
      to: { transform: 'translateY(0)' },
    },
    slideInFromBottom: {
      from: { transform: 'translateY(100%)' },
      to: { transform: 'translateY(0)' },
    },
    slideInFromLeft: {
      from: { transform: 'translateX(-100%)' },
      to: { transform: 'translateX(0)' },
    },
    slideInFromRight: {
      from: { transform: 'translateX(100%)' },
      to: { transform: 'translateX(0)' },
    },
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: '0' },
      to: { transform: 'scale(1)', opacity: '1' },
    },
    scaleOut: {
      from: { transform: 'scale(1)', opacity: '1' },
      to: { transform: 'scale(0.95)', opacity: '0' },
    },
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },
    },
    bounce: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-8px)' },
    },
    shake: {
      '0%, 100%': { transform: 'translateX(0)' },
      '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
      '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
    },
    shimmer: {
      '0%': { backgroundPosition: '-1000px 0' },
      '100%': { backgroundPosition: '1000px 0' },
    },
    progressIndeterminate: {
      '0%': { transform: 'translateX(-100%)' },
      '100%': { transform: 'translateX(400%)' },
    },
  },
} as const;

// Utility function to get animation classes
export function getAnimationClass(animationName: keyof typeof tailwindAnimations.animation): string {
  return `animate-${animationName}`;
}

// Reduced motion variants
export function getReducedMotionVariant<T extends Record<string, any>>(
  animation: T,
  reducedMotion: boolean
): T {
  if (reducedMotion) {
    return {
      ...animation,
      transition: { duration: 0.001 },
    } as T;
  }
  return animation;
}
