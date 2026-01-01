"use client";

import React, { useState, useEffect } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/types/scheduling";
import { availabilityService } from "@/services/availability.service";

interface TimeSlotPickerProps {
  providerId?: string;
  resourceId?: string;
  duration: number;
  appointmentType?: string;
  onSelectSlot: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot;
}

export default function TimeSlotPicker({
  providerId,
  resourceId,
  duration,
  appointmentType,
  onSelectSlot,
  selectedSlot,
}: TimeSlotPickerProps) {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));
  const [slots, setSlots] = useState<Record<string, TimeSlot[]>>({});
  const [loading, setLoading] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  useEffect(() => {
    loadAvailableSlots();
  }, [currentWeek, providerId, resourceId, duration, appointmentType]);

  const loadAvailableSlots = async () => {
    if (!providerId && !resourceId) return;

    setLoading(true);
    try {
      const startDate = format(currentWeek, "yyyy-MM-dd");
      const endDate = format(addDays(currentWeek, 6), "yyyy-MM-dd");

      const slotsData = await availabilityService.getAvailableSlotsRange({
        providerId,
        resourceId,
        startDate,
        endDate,
        duration,
        appointmentType,
      });

      setSlots(slotsData);
    } catch (error) {
      console.error("Failed to load available slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const offset = direction === "next" ? 7 : -7;
    setCurrentWeek(addDays(currentWeek, offset));
  };

  const isSlotSelected = (slot: TimeSlot) => {
    if (!selectedSlot) return false;
    return (
      slot.start.getTime() === selectedSlot.start.getTime() &&
      slot.end.getTime() === selectedSlot.end.getTime()
    );
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Available Time Slots</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[200px] text-center">
            {format(currentWeek, "MMM d")} -{" "}
            {format(addDays(currentWeek, 6), "MMM d, yyyy")}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const daySlots = slots[dateKey] || [];
            const availableSlots = daySlots.filter((s) => s.isAvailable);

            return (
              <div
                key={dateKey}
                className="border border-gray-200 rounded-lg p-2"
              >
                <div className="text-center mb-2">
                  <div className="text-xs font-semibold text-gray-600">
                    {format(day, "EEE")}
                  </div>
                  <div className="text-lg font-bold">{format(day, "d")}</div>
                </div>

                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {availableSlots.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center py-4">
                      No slots
                    </div>
                  ) : (
                    availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => onSelectSlot(slot)}
                        className={cn(
                          "w-full px-2 py-1 text-xs rounded border transition-colors",
                          isSlotSelected(slot)
                            ? "bg-primary-600 text-white border-primary-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-primary-50 hover:border-primary-300",
                        )}
                      >
                        {format(slot.start, "h:mm a")}
                      </button>
                    ))
                  )}
                </div>

                {availableSlots.length > 0 && (
                  <div className="text-xs text-gray-500 text-center mt-2">
                    {availableSlots.length} available
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!providerId && !resourceId && (
        <div className="text-center py-8 text-gray-500">
          Select a provider or resource to view available time slots
        </div>
      )}
    </Card>
  );
}
