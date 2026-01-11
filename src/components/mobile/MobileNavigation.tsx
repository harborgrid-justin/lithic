"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Calendar,
  Users,
  FileText,
  Menu,
  type LucideIcon,
} from "lucide-react";

interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
}

const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    href: "/",
  },
  {
    id: "patients",
    label: "Patients",
    icon: Users,
    href: "/patients",
  },
  {
    id: "appointments",
    label: "Schedule",
    icon: Calendar,
    href: "/appointments",
  },
  {
    id: "clinical",
    label: "Clinical",
    icon: FileText,
    href: "/clinical",
  },
  {
    id: "more",
    label: "More",
    icon: Menu,
    href: "/more",
  },
];

/**
 * Mobile Bottom Navigation
 * iOS and Android style bottom navigation bar
 */
export function MobileNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string): boolean => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const handleNavigation = (href: string) => {
    // Add haptic feedback on supported devices
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }

    router.push(href);
  };

  return (
    <nav
      className={cn(
        "mobile-navigation",
        "fixed bottom-0 left-0 right-0",
        "z-40",
        "bg-background/95 backdrop-blur-sm",
        "border-t border-border",
        "safe-area-pb"
      )}
    >
      <div className="flex items-center justify-around">
        {navigationItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "nav-item",
                "flex flex-col items-center justify-center",
                "flex-1",
                "py-2 px-1",
                "min-w-0",
                "transition-colors duration-200",
                "relative",
                "active:scale-95 transition-transform",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {/* Icon */}
              <div className="relative">
                <Icon
                  className={cn(
                    "w-6 h-6",
                    "transition-all duration-200",
                    active && "scale-110"
                  )}
                />

                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1",
                      "bg-destructive text-destructive-foreground",
                      "text-xs font-bold",
                      "rounded-full",
                      "min-w-[1.125rem] h-[1.125rem]",
                      "flex items-center justify-center",
                      "px-1"
                    )}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-xs font-medium mt-1",
                  "truncate max-w-full",
                  active && "font-semibold"
                )}
              >
                {item.label}
              </span>

              {/* Active indicator */}
              {active && (
                <div
                  className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2",
                    "w-12 h-0.5 bg-primary rounded-full"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Mobile Tab Navigation
 * Horizontal scrollable tabs for sub-navigation
 */
interface MobileTabNavigationProps {
  tabs: Array<{
    id: string;
    label: string;
    count?: number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function MobileTabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className,
}: MobileTabNavigationProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const activeTabRef = React.useRef<HTMLButtonElement>(null);

  // Scroll active tab into view
  React.useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      const tabElement = activeTabRef.current;
      const scrollElement = scrollRef.current;

      const tabLeft = tabElement.offsetLeft;
      const tabWidth = tabElement.offsetWidth;
      const scrollLeft = scrollElement.scrollLeft;
      const scrollWidth = scrollElement.offsetWidth;

      if (tabLeft < scrollLeft) {
        scrollElement.scrollTo({ left: tabLeft - 16, behavior: "smooth" });
      } else if (tabLeft + tabWidth > scrollLeft + scrollWidth) {
        scrollElement.scrollTo({
          left: tabLeft + tabWidth - scrollWidth + 16,
          behavior: "smooth",
        });
      }
    }
  }, [activeTab]);

  return (
    <div
      className={cn(
        "mobile-tab-navigation",
        "sticky top-0 z-30",
        "bg-background border-b",
        className
      )}
    >
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-2",
          "overflow-x-auto scrollbar-hide",
          "px-4 py-3",
          "-mb-px"
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : undefined}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "tab-button",
                "flex items-center gap-2",
                "px-4 py-2",
                "rounded-full",
                "text-sm font-medium",
                "whitespace-nowrap",
                "transition-all duration-200",
                "active:scale-95",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold",
                    isActive
                      ? "bg-primary-foreground/20"
                      : "bg-background/50"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Mobile Breadcrumb Navigation
 * Simplified breadcrumb for mobile
 */
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface MobileBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function MobileBreadcrumb({ items, className }: MobileBreadcrumbProps) {
  const router = useRouter();

  if (items.length === 0) return null;

  // On mobile, only show current page and back option
  const current = items[items.length - 1];
  const previous = items.length > 1 ? items[items.length - 2] : null;

  return (
    <nav className={cn("mobile-breadcrumb", "px-4 py-2", className)}>
      <div className="flex items-center gap-2 text-sm">
        {previous && previous.href && (
          <>
            <button
              onClick={() => router.push(previous.href!)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {previous.label}
            </button>
            <span className="text-muted-foreground">/</span>
          </>
        )}
        <span className="text-foreground font-medium truncate">
          {current.label}
        </span>
      </div>
    </nav>
  );
}

/**
 * Mobile Floating Action Button (FAB)
 */
interface MobileFABProps {
  icon: LucideIcon;
  label?: string;
  onClick: () => void;
  className?: string;
  variant?: "primary" | "secondary";
  position?: "bottom-right" | "bottom-center" | "bottom-left";
}

export function MobileFAB({
  icon: Icon,
  label,
  onClick,
  className,
  variant = "primary",
  position = "bottom-right",
}: MobileFABProps) {
  const positionClasses = {
    "bottom-right": "bottom-20 right-4",
    "bottom-center": "bottom-20 left-1/2 -translate-x-1/2",
    "bottom-left": "bottom-20 left-4",
  };

  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "mobile-fab",
        "fixed z-40",
        positionClasses[position],
        "flex items-center gap-2",
        "px-4 py-3",
        "rounded-full shadow-lg",
        "transition-all duration-200",
        "active:scale-95",
        variantClasses[variant],
        className
      )}
      aria-label={label}
    >
      <Icon className="w-6 h-6" />
      {label && <span className="font-medium">{label}</span>}
    </button>
  );
}

/**
 * Add custom CSS for safe areas and smooth scrolling
 */
export const MobileNavigationStyles = `
  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .safe-area-pb {
      padding-bottom: env(safe-area-inset-bottom);
    }

    .pt-safe {
      padding-top: env(safe-area-inset-top);
    }

    .pb-safe {
      padding-bottom: env(safe-area-inset-bottom);
    }

    .pl-safe {
      padding-left: env(safe-area-inset-left);
    }

    .pr-safe {
      padding-right: env(safe-area-inset-right);
    }
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .mobile-main {
    -webkit-overflow-scrolling: touch;
  }
`;
