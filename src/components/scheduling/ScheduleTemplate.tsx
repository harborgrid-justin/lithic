"use client";

import React from "react";
import { Clock, Calendar, MapPin, Edit, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ScheduleTemplate, Provider } from "@/types/scheduling";
import { formatDuration } from "@/lib/utils";

interface ScheduleTemplateProps {
  template: ScheduleTemplate;
  provider?: Provider;
  onEdit?: (template: ScheduleTemplate) => void;
  onDelete?: (template: ScheduleTemplate) => void;
  onApply?: (template: ScheduleTemplate) => void;
}

export default function ScheduleTemplateComponent({
  template,
  provider,
  onEdit,
  onDelete,
  onApply,
}: ScheduleTemplateProps) {
  const getDayName = (dayOfWeek: number): string => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[dayOfWeek];
  };

  return (
    <Card className={!template.isActive ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            <CardTitle>{template.name}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={template.isActive ? "default" : "secondary"}>
              {template.isActive ? "Active" : "Inactive"}
            </Badge>
            {provider && <Badge variant="outline">{provider.name}</Badge>}
          </div>
        </div>
        {template.description && (
          <p className="text-sm text-gray-500 mt-2">{template.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {template.schedule.map((slot, index) => (
            <div
              key={index}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-24">
                    <span className="font-medium text-sm">
                      {getDayName(slot.dayOfWeek)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {slot.startTime} - {slot.endTime}
                  </div>
                  {slot.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      {slot.location}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-gray-500">
                    Slot: {formatDuration(slot.slotDuration)}
                  </span>
                  {slot.breakDuration && slot.breakDuration > 0 && (
                    <span className="text-gray-500">
                      Break: {formatDuration(slot.breakDuration)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
          {onApply && (
            <Button size="sm" onClick={() => onApply(template)}>
              Apply Template
            </Button>
          )}
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(template)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => onDelete(template)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
