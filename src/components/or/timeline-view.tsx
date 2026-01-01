"use client";

import { Card } from "@/components/ui/card";
import { format, addHours } from "date-fns";

interface TimelineCase {
  id: string;
  room: string;
  patient: string;
  procedure: string;
  startTime: Date;
  endTime: Date;
  surgeon: string;
}

interface TimelineViewProps {
  cases: TimelineCase[];
  date: Date;
}

export function TimelineView({ cases, date }: TimelineViewProps) {
  const hours = Array.from({ length: 12 }, (_, i) => addHours(new Date(date).setHours(7, 0, 0, 0), i));
  const rooms = [...new Set(cases.map((c) => c.room))];

  return (
    <Card className="p-6 overflow-x-auto">
      <h2 className="text-2xl font-bold mb-4">Daily OR Timeline</h2>
      <div className="min-w-[800px]">
        <div className="flex">
          <div className="w-24 flex-shrink-0" />
          {hours.map((hour) => (
            <div key={hour.toISOString()} className="flex-1 text-center text-sm border-l">
              {format(hour, "HH:mm")}
            </div>
          ))}
        </div>
        {rooms.map((room) => (
          <div key={room} className="flex mt-2 border-t pt-2">
            <div className="w-24 flex-shrink-0 font-medium">{room}</div>
            <div className="flex-1 relative h-16">
              {cases
                .filter((c) => c.room === room)
                .map((caseItem) => {
                  const start = caseItem.startTime.getHours() + caseItem.startTime.getMinutes() / 60;
                  const duration =
                    (caseItem.endTime.getTime() - caseItem.startTime.getTime()) / (1000 * 60 * 60);
                  const left = ((start - 7) / 12) * 100;
                  const width = (duration / 12) * 100;

                  return (
                    <div
                      key={caseItem.id}
                      className="absolute bg-blue-500 text-white p-2 rounded text-xs"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        top: "0",
                        height: "100%",
                      }}
                    >
                      <div className="font-medium truncate">{caseItem.patient}</div>
                      <div className="truncate text-blue-100">{caseItem.surgeon}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
