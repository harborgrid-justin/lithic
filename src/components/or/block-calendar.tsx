"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";

interface Block {
  id: string;
  surgeon: string;
  room: string;
  startTime: string;
  endTime: string;
  utilization: number;
}

interface BlockCalendarProps {
  blocks: Block[];
}

export function BlockCalendar({ blocks }: BlockCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekStart = startOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Block Schedule</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addDays(currentDate, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div key={day.toISOString()} className="border rounded p-2">
            <div className="font-semibold text-sm mb-2">
              {format(day, "EEE MMM d")}
            </div>
            {blocks.slice(0, 2).map((block) => (
              <div
                key={block.id}
                className="bg-blue-50 p-2 rounded mb-1 text-xs"
              >
                <div className="font-medium">{block.surgeon}</div>
                <div className="text-gray-600">{block.room}</div>
                <div className="text-gray-500">
                  {block.startTime}-{block.endTime}
                </div>
                <div className="text-blue-600 font-medium">
                  {block.utilization}% utilized
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
