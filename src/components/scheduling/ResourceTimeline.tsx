/**
 * ResourceTimeline Component - Gantt-style Resource View
 * Shows resource allocation over time
 */

"use client";

import React from "react";
import { format, eachHourOfInterval, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import type { Appointment, Room, Equipment } from "@/types/scheduling";
import { Bed, Wrench, Clock } from "lucide-react";

interface ResourceTimelineProps {
  date: Date;
  resources: (Room | Equipment)[];
  appointments: Appointment[];
  onResourceClick?: (resourceId: string) => void;
  onSlotClick?: (resourceId: string, time: Date) => void;
  className?: string;
}

export function ResourceTimeline({
  date,
  resources,
  appointments,
  onResourceClick,
  onSlotClick,
  className,
}: ResourceTimelineProps) {
  const hours = React.useMemo(() => {
    const start = startOfDay(date);
    start.setHours(6);
    const end = endOfDay(date);
    end.setHours(20);
    return eachHourOfInterval({ start, end });
  }, [date]);

  const isRoom = (resource: Room | Equipment): resource is Room => {
    return "number" in resource;
  };

  const getResourceAllocations = (resourceId: string) => {
    return appointments.filter((appt) => {
      if ("roomId" in appt && appt.roomId === resourceId) return true;
      // For equipment, would need to check equipment allocations
      return false;
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      AVAILABLE: "bg-green-100 border-green-300",
      OCCUPIED: "bg-blue-100 border-blue-300",
      IN_USE: "bg-blue-100 border-blue-300",
      CLEANING: "bg-yellow-100 border-yellow-300",
      MAINTENANCE: "bg-orange-100 border-orange-300",
      OUT_OF_SERVICE: "bg-red-100 border-red-300",
      RETIRED: "bg-gray-100 border-gray-300",
    };
    return colors[status] || "bg-gray-100 border-gray-300";
  };

  if (resources.length === 0) {
    return (
      <div className={cn("border rounded-lg p-8 text-center", className)}>
        <Bed className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No resources available</p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-auto border rounded-lg", className)}>
      <div className="min-w-max">
        <div className="grid" style={{ gridTemplateColumns: `200px repeat(${hours.length}, 60px)` }}>
          {/* Header Row */}
          <div className="sticky left-0 top-0 bg-background border-r border-b p-3 font-semibold z-20">
            Resources
          </div>
          {hours.map((hour) => (
            <div
              key={hour.toISOString()}
              className="sticky top-0 bg-background border-b p-2 text-center text-xs font-medium z-10"
            >
              {format(hour, "ha")}
            </div>
          ))}

          {/* Resource Rows */}
          {resources.map((resource) => {
            const allocations = getResourceAllocations(resource.id);

            return (
              <React.Fragment key={resource.id}>
                {/* Resource Name */}
                <div
                  className="sticky left-0 bg-background border-r border-b p-3 cursor-pointer hover:bg-accent z-10"
                  onClick={() => onResourceClick?.(resource.id)}
                >
                  <div className="flex items-center gap-2">
                    {isRoom(resource) ? (
                      <Bed className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {resource.name}
                      </div>
                      <div className={cn(
                        "text-xs px-1.5 py-0.5 rounded inline-block mt-1 border",
                        getStatusColor(resource.status)
                      )}>
                        {resource.status}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Slots */}
                {hours.map((hour) => {
                  const hourEnd = new Date(hour);
                  hourEnd.setHours(hour.getHours() + 1);

                  const isAllocated = allocations.some((appt) => {
                    return isWithinInterval(hour, {
                      start: new Date(appt.startTime),
                      end: new Date(appt.endTime),
                    });
                  });

                  const allocation = allocations.find((appt) =>
                    isWithinInterval(hour, {
                      start: new Date(appt.startTime),
                      end: new Date(appt.endTime),
                    })
                  );

                  return (
                    <div
                      key={hour.toISOString()}
                      className={cn(
                        "border-r border-b cursor-pointer transition-colors",
                        isAllocated
                          ? "bg-blue-100 hover:bg-blue-200"
                          : "hover:bg-accent"
                      )}
                      onClick={() => !isAllocated && onSlotClick?.(resource.id, hour)}
                      title={allocation ? `${allocation.reason} (${format(allocation.startTime, "h:mm a")})` : "Available"}
                    >
                      {isAllocated && allocation && (
                        <div className="p-1 h-full flex items-center justify-center">
                          <div className="w-full bg-blue-500 rounded-sm text-white text-[10px] text-center py-1 px-0.5 truncate">
                            {allocation.duration}m
                          </div>
                        </div>
                      )}
                      {!isAllocated && (
                        <div className="p-1 h-full flex items-center justify-center opacity-0 hover:opacity-100">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
