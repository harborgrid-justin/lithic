/**
 * Presence Indicator Component
 */

"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface PresenceIndicatorProps {
  userName: string;
  status: "ONLINE" | "AWAY" | "BUSY" | "OFFLINE";
  lastSeen?: Date;
}

export function PresenceIndicator({
  userName,
  status,
  lastSeen,
}: PresenceIndicatorProps) {
  const statusColors = {
    ONLINE: "bg-green-500",
    AWAY: "bg-yellow-500",
    BUSY: "bg-red-500",
    OFFLINE: "bg-gray-400",
  };

  return (
    <HoverCard>
      <HoverCardTrigger>
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {userName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${statusColors[status]}`}
          />
        </div>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{userName}</h4>
          <p className="text-xs text-gray-500">
            Status: <span className="capitalize">{status.toLowerCase()}</span>
          </p>
          {lastSeen && status === "OFFLINE" && (
            <p className="text-xs text-gray-500">
              Last seen: {lastSeen.toLocaleString()}
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
