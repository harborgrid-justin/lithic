"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { isMobileDevice, isPWAInstalled } from "@/lib/pwa/manifest";
import { MobileNavigation } from "./MobileNavigation";

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  showNavigation?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Mobile Layout Wrapper
 * Provides mobile-optimized layout with safe areas and PWA support
 */
export function MobileLayout({
  children,
  className,
  showNavigation = true,
  header,
  footer,
}: MobileLayoutProps) {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isPWA, setIsPWA] = React.useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = React.useState(false);

  React.useEffect(() => {
    // Check if mobile device
    setIsMobile(isMobileDevice());
    setIsPWA(isPWAInstalled());

    // Handle keyboard visibility
    const handleResize = () => {
      // On mobile, viewport height changes when keyboard opens
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        setIsKeyboardOpen(viewportHeight < windowHeight * 0.75);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      return () => {
        window.visualViewport?.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  // Apply mobile-specific styles
  const layoutClasses = cn(
    "mobile-layout",
    "min-h-screen",
    "flex flex-col",
    "bg-background",
    // Safe area padding for iOS notch
    isPWA && "pt-safe pb-safe",
    // Prevent overscroll bounce on iOS
    "overscroll-none",
    className
  );

  return (
    <div className={layoutClasses}>
      {/* Status bar spacer for iOS */}
      {isPWA && isMobile && (
        <div
          className="status-bar-spacer bg-primary"
          style={{ height: "env(safe-area-inset-top)" }}
        />
      )}

      {/* Header */}
      {header && (
        <header className="mobile-header sticky top-0 z-40 bg-background border-b">
          {header}
        </header>
      )}

      {/* Main content */}
      <main
        className={cn(
          "mobile-main flex-1 overflow-y-auto",
          showNavigation && !isKeyboardOpen && "pb-16",
          "overscroll-contain"
        )}
      >
        {children}
      </main>

      {/* Footer */}
      {footer && (
        <footer className="mobile-footer border-t bg-background">
          {footer}
        </footer>
      )}

      {/* Bottom navigation */}
      {showNavigation && !isKeyboardOpen && <MobileNavigation />}

      {/* Bottom safe area for iOS */}
      {isPWA && isMobile && (
        <div
          className="safe-area-bottom bg-background"
          style={{ height: "env(safe-area-inset-bottom)" }}
        />
      )}
    </div>
  );
}

/**
 * Mobile Container
 * Provides consistent padding and max-width for content
 */
interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function MobileContainer({
  children,
  className,
  noPadding = false,
}: MobileContainerProps) {
  return (
    <div
      className={cn(
        "mobile-container",
        "w-full mx-auto",
        !noPadding && "px-4 py-4",
        "max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Mobile Section
 * Provides consistent spacing for content sections
 */
interface MobileSectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function MobileSection({
  children,
  title,
  subtitle,
  action,
  className,
}: MobileSectionProps) {
  return (
    <section className={cn("mobile-section", "mb-6", className)}>
      {(title || subtitle || action) && (
        <div className="section-header mb-3 flex items-start justify-between">
          <div className="flex-1">
            {title && (
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {action && <div className="section-action ml-4">{action}</div>}
        </div>
      )}
      <div className="section-content">{children}</div>
    </section>
  );
}

/**
 * Mobile Card
 * Card component optimized for mobile with touch feedback
 */
interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export function MobileCard({
  children,
  className,
  onClick,
  interactive = false,
}: MobileCardProps) {
  const cardClasses = cn(
    "mobile-card",
    "bg-card rounded-lg border",
    "shadow-sm",
    interactive || onClick
      ? [
          "active:scale-[0.98]",
          "transition-transform duration-100",
          "cursor-pointer",
          "hover:bg-accent/5",
        ]
      : "",
    className
  );

  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
}

/**
 * Mobile List
 * List component with dividers
 */
interface MobileListProps {
  children: React.ReactNode;
  className?: string;
  divided?: boolean;
}

export function MobileList({
  children,
  className,
  divided = true,
}: MobileListProps) {
  return (
    <div
      className={cn(
        "mobile-list",
        divided && "divide-y divide-border",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Mobile List Item
 * List item with touch feedback
 */
interface MobileListItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function MobileListItem({
  children,
  className,
  onClick,
  interactive = false,
  leftIcon,
  rightIcon,
}: MobileListItemProps) {
  const itemClasses = cn(
    "mobile-list-item",
    "flex items-center",
    "px-4 py-3",
    "min-h-[3rem]",
    interactive || onClick
      ? [
          "active:bg-accent/10",
          "transition-colors duration-100",
          "cursor-pointer",
        ]
      : "",
    className
  );

  return (
    <div className={itemClasses} onClick={onClick}>
      {leftIcon && (
        <div className="list-item-icon-left mr-3 flex-shrink-0">{leftIcon}</div>
      )}
      <div className="list-item-content flex-1">{children}</div>
      {rightIcon && (
        <div className="list-item-icon-right ml-3 flex-shrink-0">
          {rightIcon}
        </div>
      )}
    </div>
  );
}

/**
 * Mobile Header
 * Standard mobile page header
 */
interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  backButton?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function MobileHeader({
  title,
  subtitle,
  backButton,
  actions,
  className,
}: MobileHeaderProps) {
  return (
    <div
      className={cn(
        "mobile-header-content",
        "flex items-center",
        "px-4 py-3",
        "gap-3",
        className
      )}
    >
      {backButton && (
        <div className="header-back flex-shrink-0">{backButton}</div>
      )}
      <div className="header-title flex-1 min-w-0">
        <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      {actions && <div className="header-actions flex-shrink-0">{actions}</div>}
    </div>
  );
}

/**
 * Mobile Bottom Sheet
 * Bottom sheet for mobile actions
 */
interface MobileBottomSheetProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
}

export function MobileBottomSheet({
  children,
  isOpen,
  onClose,
  title,
  className,
}: MobileBottomSheetProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timeout = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50",
          "transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-background rounded-t-2xl",
          "shadow-2xl",
          "max-h-[90vh] overflow-hidden",
          "transition-transform duration-300",
          isOpen ? "translate-y-0" : "translate-y-full",
          className
        )}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-4 pb-3 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
          {children}
        </div>
      </div>
    </>
  );
}
