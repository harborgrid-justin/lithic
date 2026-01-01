/**
 * Notification Bell - Notification Center Component
 */

"use client";

import React from "react";
import { useWorkflowStore, selectUnreadNotifications } from "@/stores/workflow-store";
import { NotificationStatus, NotificationPriority } from "@/types/workflow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export function NotificationBell() {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useWorkflowStore();

  const unread = notifications.filter((n) => n.status !== NotificationStatus.READ);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const priorityColors = {
    [NotificationPriority.LOW]: "border-gray-300",
    [NotificationPriority.NORMAL]: "border-blue-300",
    [NotificationPriority.HIGH]: "border-yellow-300",
    [NotificationPriority.URGENT]: "border-orange-400",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white"
            variant="danger"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white border rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                onClick={markAllNotificationsRead}
                variant="ghost"
                size="sm"
              >
                <Check className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                      priorityColors[notification.priority]
                    } ${
                      notification.status === NotificationStatus.READ
                        ? "opacity-60"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>{format(new Date(notification.createdAt), "MMM d, HH:mm")}</span>
                          <Badge variant="secondary" className="text-xs">
                            {notification.category}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        {notification.status !== NotificationStatus.READ && (
                          <Button
                            onClick={() => markNotificationRead(notification.id)}
                            variant="ghost"
                            size="sm"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => deleteNotification(notification.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {notification.actionUrl && (
                      <Button
                        onClick={() => {
                          markNotificationRead(notification.id);
                          window.location.href = notification.actionUrl!;
                        }}
                        variant="link"
                        size="sm"
                        className="mt-2 p-0 h-auto"
                      >
                        {notification.actionLabel || "View"}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="p-3 border-t text-center">
              <Button variant="link" size="sm">
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
