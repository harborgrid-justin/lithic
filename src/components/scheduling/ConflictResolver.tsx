"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Clock, User, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  ScheduleConflict,
  TimeSlot,
  Appointment,
} from "@/types/scheduling";
import { formatTime, formatDateTime } from "@/lib/utils";
import { schedulingService } from "@/services/scheduling.service";

interface ConflictResolverProps {
  providerId: string;
  startTime: string;
  duration: number;
  excludeAppointmentId?: string;
  onResolve?: (selectedSlot: TimeSlot) => void;
  onCancel?: () => void;
}

export default function ConflictResolver({
  providerId,
  startTime,
  duration,
  excludeAppointmentId,
  onResolve,
  onCancel,
}: ConflictResolverProps) {
  const [conflict, setConflict] = useState<ScheduleConflict | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  useEffect(() => {
    checkConflicts();
  }, [providerId, startTime, duration, excludeAppointmentId]);

  const checkConflicts = async () => {
    setLoading(true);
    try {
      const result = await schedulingService.checkConflicts(
        providerId,
        startTime,
        duration,
        excludeAppointmentId,
      );
      setConflict(result);
    } catch (error) {
      console.error("Failed to check conflicts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Checking for conflicts...
        </CardContent>
      </Card>
    );
  }

  if (!conflict) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-green-600">
            <div className="text-center">
              <div className="text-2xl mb-2">✓</div>
              <div className="font-medium">No conflicts found</div>
              <div className="text-sm text-gray-500 mt-1">
                This time slot is available
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getConflictIcon = (type: string) => {
    switch (type) {
      case "provider-busy":
        return <User className="h-5 w-5 text-orange-600" />;
      case "resource-busy":
        return <Calendar className="h-5 w-5 text-orange-600" />;
      case "patient-busy":
        return <User className="h-5 w-5 text-orange-600" />;
      case "outside-hours":
        return <Clock className="h-5 w-5 text-orange-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-900">
              Schedule Conflict Detected
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-3">
            {getConflictIcon(conflict.type)}
            <div className="flex-1">
              <div className="font-medium text-orange-900 mb-1">
                {conflict.type
                  .split("-")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </div>
              <p className="text-sm text-orange-800">{conflict.message}</p>
            </div>
          </div>

          {conflict.conflictingAppointments &&
            conflict.conflictingAppointments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-orange-200">
                <h4 className="font-medium text-orange-900 mb-2">
                  Conflicting Appointments:
                </h4>
                <div className="space-y-2">
                  {conflict.conflictingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3 bg-white rounded-lg border border-orange-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{apt.title}</div>
                          <div className="text-sm text-gray-600">
                            {apt.patient?.firstName} {apt.patient?.lastName}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div>{formatDateTime(apt.startTime)}</div>
                          <Badge className="mt-1">{apt.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {conflict.suggestedAlternatives &&
        conflict.suggestedAlternatives.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Suggested Alternative Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {conflict.suggestedAlternatives.map((slot, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 border rounded-lg cursor-pointer transition-all",
                      selectedSlot === slot
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-primary-300 hover:bg-gray-50",
                    )}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            {formatDateTime(slot.start)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTime(slot.start)} - {formatTime(slot.end)}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={slot.isAvailable ? "default" : "secondary"}
                      >
                        {slot.isAvailable ? "Available" : "Limited"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                {onCancel && (
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={() => selectedSlot && onResolve?.(selectedSlot)}
                  disabled={!selectedSlot}
                >
                  Use Selected Time
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
