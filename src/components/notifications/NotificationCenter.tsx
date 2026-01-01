"use client";

/**
 * NotificationCenter - Real-time Notification Action Center
 * Displays and manages notifications with action buttons
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  AlertCircle,
  ExternalLink,
  Trash2,
  CheckCheck,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardStore } from "@/stores/dashboard-store";
import { cn } from "@/lib/utils";

// ============================================================================
// Component
// ============================================================================

export function NotificationCenter() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    notificationCenterOpen,
    toggleNotificationCenter,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  } = useDashboardStore();

  const [filter, setFilter] = useState<"all" | "unread" | "actionable">("all");

  // Auto-populate with demo notifications on mount (in production, use real-time events)
  useEffect(() => {
    // This would be replaced with WebSocket/Pusher subscriptions
    // For demo purposes, notifications are managed through the store
  }, []);

  const getNotificationIcon = (
    type: "info" | "warning" | "error" | "success",
  ) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case "success":
        return <CheckCircle2 className={cn(iconClass, "text-green-600")} />;
      case "warning":
        return <AlertTriangle className={cn(iconClass, "text-orange-600")} />;
      case "error":
        return <AlertCircle className={cn(iconClass, "text-red-600")} />;
      default:
        return <Info className={cn(iconClass, "text-blue-600")} />;
    }
  };

  const getNotificationBgColor = (
    type: "info" | "warning" | "error" | "success",
  ) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-orange-50 border-orange-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const handleNotificationAction = (
    notification: (typeof notifications)[0],
  ) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      markAsRead(notification.id);
      toggleNotificationCenter();
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.read;
    if (filter === "actionable") return notif.actionable;
    return true;
  });

  const unreadNotifications = notifications.filter((n) => !n.read);
  const actionableNotifications = notifications.filter((n) => n.actionable);

  return (
    <Sheet
      open={notificationCenterOpen}
      onOpenChange={toggleNotificationCenter}
    >
      <SheetContent className="w-full sm:w-[540px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-600" />
              <div>
                <SheetTitle className="text-lg">Notifications</SheetTitle>
                <SheetDescription className="text-xs mt-0.5">
                  {unreadCount} unread notification
                  {unreadCount !== 1 ? "s" : ""}
                </SheetDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Filters */}
        <div className="px-6 py-3 border-b bg-gray-50">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1 text-xs">
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1 text-xs">
                Unread ({unreadNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="actionable" className="flex-1 text-xs">
                Actionable ({actionableNotifications.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Notification List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-900">
                  No notifications
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {filter === "unread"
                    ? "You're all caught up!"
                    : filter === "actionable"
                      ? "No actionable notifications"
                      : "Notifications will appear here"}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={cn(
                      "relative p-4 rounded-lg border transition-all",
                      getNotificationBgColor(notification.type),
                      !notification.read && "shadow-md",
                    )}
                  >
                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div className="absolute top-4 left-2 w-2 h-2 bg-blue-600 rounded-full" />
                    )}

                    {/* Dismiss Button */}
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="absolute top-2 right-2 p-1 rounded hover:bg-white/50 transition-colors"
                      aria-label="Dismiss notification"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>

                    <div className="flex items-start gap-3 pr-6 pl-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-700 mb-3">
                          {notification.message}
                        </p>

                        {/* Meta and Actions */}
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-gray-600">
                            {getTimeAgo(notification.timestamp)}
                          </span>

                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-7 text-xs"
                              >
                                Mark as read
                              </Button>
                            )}

                            {notification.actionable &&
                              notification.actionUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleNotificationAction(notification)
                                  }
                                  className="h-7 text-xs"
                                >
                                  {notification.actionLabel || "View"}
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </Button>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {index < filteredNotifications.length - 1 && (
                    <Separator className="my-3" />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
