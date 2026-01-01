"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  Activity,
  Building2,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  Plus,
  Heart,
  Shield,
  DollarSign,
  Microscope,
  Scan,
  Pill,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  disabled?: boolean;
  roles?: string[];
  children?: NavItem[];
}

const defaultNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Patients",
    href: "/patients",
    icon: Users,
    badge: "234",
  },
  {
    title: "Appointments",
    href: "/appointments",
    icon: Calendar,
    badge: "12",
  },
  {
    title: "Medical Records",
    href: "/records",
    icon: FileText,
  },
  {
    title: "Clinical",
    href: "/clinical",
    icon: Heart,
    children: [
      { title: "Encounters", href: "/clinical/encounters", icon: FileText },
      { title: "Orders", href: "/clinical/orders", icon: Plus },
      { title: "Notes", href: "/clinical/notes", icon: FileText },
    ],
  },
  {
    title: "Imaging",
    href: "/imaging",
    icon: Scan,
    roles: ["admin", "radiologist", "physician"],
  },
  {
    title: "Laboratory",
    href: "/laboratory",
    icon: Microscope,
    roles: ["admin", "lab-tech", "physician"],
  },
  {
    title: "Pharmacy",
    href: "/pharmacy",
    icon: Pill,
    roles: ["admin", "pharmacist", "physician"],
  },
  {
    title: "Billing",
    href: "/billing",
    icon: DollarSign,
    roles: ["admin", "billing"],
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Administration",
    href: "/admin",
    icon: Shield,
    roles: ["admin"],
    children: [
      { title: "Users", href: "/admin/users", icon: UserCog },
      { title: "Departments", href: "/admin/departments", icon: Building2 },
      { title: "Security", href: "/admin/security", icon: Shield },
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface EnterpriseSidebarProps {
  navItems?: NavItem[];
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function EnterpriseSidebar({
  navItems = defaultNavItems,
  className,
  collapsible = true,
  defaultCollapsed = false,
}: EnterpriseSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Load favorites and recent items from localStorage
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem("sidebar-favorites");
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }

      const storedRecent = localStorage.getItem("sidebar-recent");
      if (storedRecent) {
        setRecentItems(JSON.parse(storedRecent));
      }
    } catch (error) {
      console.error("Failed to load sidebar preferences:", error);
    }
  }, []);

  // Update recent items when pathname changes
  useEffect(() => {
    if (!pathname) return;

    setRecentItems((prev) => {
      const newRecent = [pathname, ...prev.filter((p) => p !== pathname)].slice(
        0,
        5,
      );
      try {
        localStorage.setItem("sidebar-recent", JSON.stringify(newRecent));
      } catch (error) {
        console.error("Failed to save recent items:", error);
      }
      return newRecent;
    });
  }, [pathname]);

  const toggleFavorite = (href: string) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(href)
        ? prev.filter((f) => f !== href)
        : [...prev, href];

      try {
        localStorage.setItem("sidebar-favorites", JSON.stringify(newFavorites));
      } catch (error) {
        console.error("Failed to save favorites:", error);
      }

      return newFavorites;
    });
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  const filterItemsByRole = (items: NavItem[]): NavItem[] => {
    if (!user?.role) return items;

    return items.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.includes(user.role);
    });
  };

  const filteredNavItems = filterItemsByRole(navItems);

  const renderNavItem = (item: NavItem, level = 0) => {
    const Icon = item.icon;
    const isActive =
      pathname === item.href || pathname?.startsWith(item.href + "/");
    const isFavorite = favorites.includes(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroups.has(item.title);

    if (hasChildren) {
      return (
        <div key={item.href}>
          <button
            onClick={() => toggleGroup(item.title)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              item.disabled && "cursor-not-allowed opacity-50",
              collapsed && "justify-center",
            )}
            disabled={item.disabled}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.title}</span>
                {isExpanded ? (
                  <ChevronRight className="h-4 w-4 rotate-90 transition-transform" />
                ) : (
                  <ChevronRight className="h-4 w-4 transition-transform" />
                )}
              </>
            )}
          </button>
          {!collapsed && isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children.map((child) => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={item.href} className="relative group">
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            item.disabled &&
              "cursor-not-allowed opacity-50 pointer-events-none",
            collapsed && "justify-center",
            level > 0 && "text-xs",
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className="ml-auto"
                >
                  {item.badge}
                </Badge>
              )}
            </>
          )}
        </Link>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(item.href);
            }}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Star className={cn("h-3 w-3", isFavorite && "fill-current")} />
          </Button>
        )}
      </div>
    );
  };

  const favoriteItems = filteredNavItems.filter((item) =>
    favorites.includes(item.href),
  );
  const recentNavItems = recentItems
    .map((href) => filteredNavItems.find((item) => item.href === href))
    .filter((item): item is NavItem => item !== undefined)
    .slice(0, 3);

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      <div className="flex h-full flex-col">
        {/* Collapse Toggle */}
        {collapsible && (
          <div className="flex items-center justify-end p-2 border-b">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1 py-4">
          {/* Favorites Section */}
          {!collapsed && favoriteItems.length > 0 && (
            <div className="px-3 mb-4">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-muted-foreground">
                <Star className="h-3 w-3" />
                Favorites
              </div>
              <nav className="grid gap-1">
                {favoriteItems.map((item) => renderNavItem(item))}
              </nav>
              <Separator className="my-4" />
            </div>
          )}

          {/* Recent Section */}
          {!collapsed && recentNavItems.length > 0 && (
            <div className="px-3 mb-4">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-muted-foreground">
                <Clock className="h-3 w-3" />
                Recent
              </div>
              <nav className="grid gap-1">
                {recentNavItems.map((item) => renderNavItem(item))}
              </nav>
              <Separator className="my-4" />
            </div>
          )}

          {/* Main Navigation */}
          <nav className="grid gap-1 px-3">
            {filteredNavItems.map((item) => renderNavItem(item))}
          </nav>
        </ScrollArea>

        {/* Footer section */}
        {!collapsed && (
          <div className="border-t p-4">
            <div className="rounded-lg bg-muted p-3">
              <h4 className="mb-1 text-sm font-semibold">Upgrade to Pro</h4>
              <p className="mb-2 text-xs text-muted-foreground">
                Unlock advanced features and analytics
              </p>
              <Link
                href="/upgrade"
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
