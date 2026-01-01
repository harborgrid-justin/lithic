"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  Clock,
  User,
  Phone,
  Mail,
  Bell,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { WaitlistEntry, Provider } from "@/types/scheduling";
import { getPriorityColor, formatDateTime } from "@/lib/utils";
import { schedulingService } from "@/services/scheduling.service";
import { toast } from "sonner";

interface WaitlistManagerProps {
  entries: WaitlistEntry[];
  providers?: Provider[];
  onEntryUpdate?: () => void;
  onSchedule?: (entry: WaitlistEntry) => void;
}

export default function WaitlistManager({
  entries,
  providers = [],
  onEntryUpdate,
  onSchedule,
}: WaitlistManagerProps) {
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(
    null,
  );
  const [loading, setLoading] = useState<string | null>(null);

  const handleNotify = async (entry: WaitlistEntry) => {
    setLoading(entry.id);
    try {
      await schedulingService.notifyWaitlistEntry(entry.id);
      toast.success("Patient notified successfully");
      onEntryUpdate?.();
    } catch (error) {
      toast.error("Failed to notify patient");
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleRemove = async (entry: WaitlistEntry) => {
    if (
      !confirm(
        "Are you sure you want to remove this patient from the waitlist?",
      )
    ) {
      return;
    }

    setLoading(entry.id);
    try {
      await schedulingService.removeFromWaitlist(entry.id);
      toast.success("Patient removed from waitlist");
      onEntryUpdate?.();
    } catch (error) {
      toast.error("Failed to remove patient from waitlist");
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      scheduled: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return variants[status] || "bg-gray-100 text-gray-800";
  };

  const activeEntries = entries.filter((e) => e.status === "active");
  const contactedEntries = entries.filter((e) => e.status === "contacted");
  const scheduledEntries = entries.filter((e) => e.status === "scheduled");

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {activeEntries.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Active</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {contactedEntries.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Contacted</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {scheduledEntries.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Scheduled</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Waitlist Entries ({entries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No entries in waitlist
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <Card
                  key={entry.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold">
                            {entry.patient?.firstName} {entry.patient?.lastName}
                          </h4>
                          <Badge className={getPriorityColor(entry.priority)}>
                            {entry.priority}
                          </Badge>
                          <Badge className={getStatusBadge(entry.status)}>
                            {entry.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {entry.patient?.email}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {entry.patient?.phone}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            Added: {formatDateTime(entry.createdAt)}
                          </div>
                          {entry.provider && (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-gray-400" />
                              {entry.provider.name}
                            </div>
                          )}
                        </div>

                        <div className="mt-2">
                          <span className="text-sm font-medium">Type:</span>{" "}
                          <span className="text-sm text-gray-600 capitalize">
                            {entry.appointmentType}
                          </span>
                        </div>

                        {entry.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            {entry.notes}
                          </div>
                        )}

                        {entry.preferredDates &&
                          entry.preferredDates.length > 0 && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">
                                Preferred Dates:
                              </span>{" "}
                              {entry.preferredDates
                                .map((d) => format(new Date(d), "MMM d"))
                                .join(", ")}
                            </div>
                          )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => onSchedule?.(entry)}
                          disabled={
                            loading === entry.id || entry.status === "scheduled"
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleNotify(entry)}
                          disabled={loading === entry.id}
                        >
                          <Bell className="h-4 w-4 mr-1" />
                          Notify
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemove(entry)}
                          disabled={loading === entry.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
