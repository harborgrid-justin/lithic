/**
 * WaitlistQueue Component - Priority Waitlist Display
 * Shows waitlist entries with priority and matching
 */

"use client";

import React from "react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Waitlist, WaitlistPriority, WaitlistStatus } from "@/types/scheduling";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, CheckCircle2, XCircle, Phone, Mail } from "lucide-react";

interface WaitlistQueueProps {
  entries: Waitlist[];
  onEntryClick?: (entry: Waitlist) => void;
  onNotify?: (entryId: string) => void;
  onSchedule?: (entryId: string) => void;
  onRemove?: (entryId: string) => void;
  className?: string;
  compact?: boolean;
}

export function WaitlistQueue({
  entries,
  onEntryClick,
  onNotify,
  onSchedule,
  onRemove,
  className,
  compact = false,
}: WaitlistQueueProps) {
  const priorityColors: Record<WaitlistPriority, string> = {
    URGENT: "bg-red-100 text-red-800 border-red-300",
    HIGH: "bg-orange-100 text-orange-800 border-orange-300",
    MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-300",
    LOW: "bg-green-100 text-green-800 border-green-300",
  };

  const statusIcons: Record<WaitlistStatus, React.ReactNode> = {
    ACTIVE: <Clock className="h-4 w-4 text-blue-500" />,
    CONTACTED: <Phone className="h-4 w-4 text-purple-500" />,
    NOTIFIED: <Mail className="h-4 w-4 text-indigo-500" />,
    SCHEDULED: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    ACCEPTED: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    COMPLETED: <CheckCircle2 className="h-4 w-4 text-gray-500" />,
    OVERDUE: <AlertCircle className="h-4 w-4 text-red-500" />,
    DISMISSED: <XCircle className="h-4 w-4 text-gray-500" />,
    DECLINED: <XCircle className="h-4 w-4 text-orange-500" />,
    EXPIRED: <XCircle className="h-4 w-4 text-gray-400" />,
    CANCELLED: <XCircle className="h-4 w-4 text-red-400" />,
    UNABLE_TO_CONTACT: <AlertCircle className="h-4 w-4 text-orange-500" />,
  };

  if (entries.length === 0) {
    return (
      <div className={cn("border rounded-lg p-8 text-center", className)}>
        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No patients on waitlist</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className={cn(
            "border rounded-lg transition-all hover:shadow-md cursor-pointer",
            compact ? "p-3" : "p-4",
          )}
          onClick={() => onEntryClick?.(entry)}
        >
          <div className="flex items-start gap-3">
            {/* Priority Badge */}
            <div
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold border-2 flex-shrink-0",
                priorityColors[entry.priority]
              )}
            >
              #{index + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-semibold">{entry.patientId}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {entry.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {statusIcons[entry.status]}
                  <Badge variant="outline" className="text-xs">
                    {entry.status}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    Added {formatDistanceToNow(entry.addedDate, { addSuffix: true })}
                  </span>
                </div>

                <div>
                  Type: <span className="font-medium">{entry.appointmentType}</span>
                </div>

                {entry.preferredTimes && entry.preferredTimes.length > 0 && (
                  <div>
                    Prefers: <span className="font-medium">{entry.preferredTimes.join(", ")}</span>
                  </div>
                )}
              </div>

              {!compact && (
                <div className="flex items-center gap-2 mt-3">
                  {entry.status === "ACTIVE" && onNotify && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNotify(entry.id);
                      }}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Notify
                    </Button>
                  )}

                  {(entry.status === "ACTIVE" || entry.status === "CONTACTED") && onSchedule && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSchedule(entry.id);
                      }}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Schedule
                    </Button>
                  )}

                  {onRemove && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(entry.id);
                      }}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
