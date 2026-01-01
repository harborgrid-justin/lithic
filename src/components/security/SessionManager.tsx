/**
 * Session Manager Component
 * View and manage active sessions
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone, Tablet, X } from "lucide-react";

interface Session {
  id: string;
  device: string;
  deviceType: "desktop" | "mobile" | "tablet";
  location: string;
  ipAddress: string;
  lastActivity: Date;
  current: boolean;
}

export function SessionManager() {
  const sessions: Session[] = [
    {
      id: "1",
      device: "Chrome on MacOS",
      deviceType: "desktop",
      location: "San Francisco, CA",
      ipAddress: "192.168.1.1",
      lastActivity: new Date(),
      current: true,
    },
  ];

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "desktop":
        return <Monitor className="h-4 w-4" />;
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between border-b pb-4"
          >
            <div className="flex items-center gap-3">
              {getDeviceIcon(session.deviceType)}
              <div>
                <p className="text-sm font-medium">{session.device}</p>
                <p className="text-xs text-muted-foreground">
                  {session.location} • {session.ipAddress}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last active: {session.lastActivity.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {session.current && <Badge>Current</Badge>}
              <Button variant="outline" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
