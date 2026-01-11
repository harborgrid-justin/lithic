"use client";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface HeatmapCalendarProps {
  data: Array<{ date: Date; value: number; label?: string }>;
  startDate?: Date;
  endDate?: Date;
  colorScale?: "green" | "blue" | "red" | "purple";
  showMonthLabels?: boolean;
  className?: string;
}

export function HeatmapCalendar({
  data,
  startDate,
  endDate,
  colorScale = "green",
  showMonthLabels = true,
  className,
}: HeatmapCalendarProps) {
  const start = startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  // Calculate weeks to display
  const weeks = getWeeks(start, end);
  const dataMap = new Map(
    data.map((d) => [d.date.toISOString().split("T")[0] || "", d])
  );

  // Get max value for scaling
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="inline-flex flex-col gap-1">
        {showMonthLabels && (
          <div className="flex gap-1 pl-6">
            {getMonthLabels(start, end).map((month, i) => (
              <div
                key={i}
                className="text-xs text-muted-foreground"
                style={{ width: `${month.weeks * 12}px` }}
              >
                {month.label}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-1">
          <div className="flex flex-col justify-between py-1 text-xs text-muted-foreground">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>

          <TooltipProvider>
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => {
                    const dateKey = day.toISOString().split("T")[0] || "";
                    const dayData = dataMap.get(dateKey);
                    const intensity = dayData
                      ? Math.ceil((dayData.value / maxValue) * 4)
                      : 0;

                    return (
                      <Tooltip key={dayIndex}>
                        <TooltipTrigger>
                          <div
                            className={cn(
                              "h-2.5 w-2.5 rounded-sm",
                              getColorClass(colorScale, intensity)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <div className="font-medium">
                              {day.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                            {dayData && (
                              <div className="text-muted-foreground">
                                {dayData.label || `${dayData.value} events`}
                              </div>
                            )}
                            {!dayData && (
                              <div className="text-muted-foreground">No activity</div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((intensity) => (
              <div
                key={intensity}
                className={cn(
                  "h-2.5 w-2.5 rounded-sm",
                  getColorClass(colorScale, intensity)
                )}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

function getWeeks(start: Date, end: Date): Date[][] {
  const weeks: Date[][] = [];
  let currentDate = new Date(start);

  // Start from the Monday of the first week
  while (currentDate.getDay() !== 1) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  while (currentDate <= end) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

function getMonthLabels(
  start: Date,
  end: Date
): Array<{ label: string; weeks: number }> {
  const labels: Array<{ label: string; weeks: number }> = [];
  let currentDate = new Date(start);
  let currentMonth = currentDate.getMonth();
  let weekCount = 0;

  while (currentDate <= end) {
    if (currentDate.getMonth() !== currentMonth) {
      labels.push({
        label: new Date(currentDate.getFullYear(), currentMonth).toLocaleDateString(
          "en-US",
          { month: "short" }
        ),
        weeks: weekCount,
      });
      currentMonth = currentDate.getMonth();
      weekCount = 0;
    }
    weekCount++;
    currentDate.setDate(currentDate.getDate() + 7);
  }

  // Add last month
  if (weekCount > 0) {
    labels.push({
      label: new Date(currentDate.getFullYear(), currentMonth).toLocaleDateString(
        "en-US",
        { month: "short" }
      ),
      weeks: weekCount,
    });
  }

  return labels;
}

function getColorClass(
  colorScale: "green" | "blue" | "red" | "purple",
  intensity: number
): string {
  if (intensity === 0) return "bg-gray-100";

  const colors = {
    green: [
      "bg-green-100",
      "bg-green-300",
      "bg-green-500",
      "bg-green-700",
    ],
    blue: [
      "bg-blue-100",
      "bg-blue-300",
      "bg-blue-500",
      "bg-blue-700",
    ],
    red: [
      "bg-red-100",
      "bg-red-300",
      "bg-red-500",
      "bg-red-700",
    ],
    purple: [
      "bg-purple-100",
      "bg-purple-300",
      "bg-purple-500",
      "bg-purple-700",
    ],
  };

  return colors[colorScale][intensity - 1] || colors[colorScale][0];
}
