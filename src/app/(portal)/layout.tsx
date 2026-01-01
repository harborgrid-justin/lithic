/**
 * Patient Portal Layout
 * Agent 1: Patient Portal & Experience Expert
 * Modern, accessible layout with sidebar navigation
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePatientPortalStore } from "@/stores/patient-portal-store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  FileText,
  CreditCard,
  HeartPulse,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  HelpCircle,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
  { name: "Messages", href: "/patient/messages", icon: MessageSquare },
  { name: "Appointments", href: "/patient/appointments", icon: Calendar },
  { name: "Medical Records", href: "/patient/records", icon: FileText },
  { name: "Billing", href: "/patient/billing", icon: CreditCard },
  { name: "Health Tools", href: "/patient/health-tools", icon: HeartPulse },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    session,
    sidebarCollapsed,
    toggleSidebar,
    unreadNotificationsCount,
    unreadMessagesCount,
    notificationsPanelOpen,
    toggleNotificationsPanel,
  } = usePatientPortalStore();

  // Update navigation with dynamic badges
  const navWithBadges = navigation.map((item) => {
    if (item.name === "Messages" && unreadMessagesCount > 0) {
      return { ...item, badge: unreadMessagesCount };
    }
    return item;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Logo */}
          <Link href="/patient/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HeartPulse className="h-5 w-5" />
            </div>
            <span className="hidden font-bold sm:inline-block">
              Lithic Health Portal
            </span>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={toggleNotificationsPanel}
            >
              <Bell className="h-5 w-5" />
              {unreadNotificationsCount > 0 && (
                <Badge
                  variant="danger"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {unreadNotificationsCount}
                </Badge>
              )}
            </Button>

            {/* Help */}
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.preferences?.theme} />
                    <AvatarFallback>
                      {session?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline-block">
                    {session?.email || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  Family Access
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden lg:flex lg:flex-col fixed left-0 top-16 bottom-0 border-r bg-background transition-all duration-300",
            sidebarCollapsed ? "w-16" : "w-64",
          )}
        >
          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-2">
              {navWithBadges.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <Badge
                            variant={isActive ? "secondary" : "default"}
                            className="ml-auto"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                    {sidebarCollapsed && item.badge && (
                      <Badge
                        variant="danger"
                        className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Collapse Toggle */}
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={toggleSidebar}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Collapse
                </>
              )}
            </Button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed left-0 top-0 bottom-0 w-64 border-r bg-background">
              <div className="flex h-16 items-center justify-between border-b px-4">
                <span className="font-bold">Menu</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <ScrollArea className="h-[calc(100vh-4rem)] py-4">
                <nav className="space-y-1 px-2">
                  {navWithBadges.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <Badge
                            variant={isActive ? "secondary" : "default"}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </ScrollArea>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 transition-all duration-300",
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
          )}
        >
          <div className="mt-16 lg:mt-0">{children}</div>
        </main>
      </div>

      {/* Notifications Panel */}
      {notificationsPanelOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 border-l bg-background shadow-lg">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleNotificationsPanel}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">
                <p className="text-sm text-muted-foreground">
                  No new notifications
                </p>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
