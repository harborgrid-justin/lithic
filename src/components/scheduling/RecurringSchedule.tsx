'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Repeat, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RecurringSeries, Appointment } from '@/types/scheduling';
import { formatTime } from '@/lib/utils';

interface RecurringScheduleProps {
  series: RecurringSeries;
  onEditSeries?: (series: RecurringSeries, scope: 'this' | 'future' | 'all') => void;
  onDeleteSeries?: (series: RecurringSeries, scope: 'this' | 'future' | 'all') => void;
  onViewAppointment?: (appointment: Appointment) => void;
}

export default function RecurringSchedule({
  series,
  onEditSeries,
  onDeleteSeries,
  onViewAppointment,
}: RecurringScheduleProps) {
  const [editScope, setEditScope] = useState<'this' | 'future' | 'all'>('all');

  const getFrequencyLabel = (frequency: string): string => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Every 2 weeks',
      monthly: 'Monthly',
      yearly: 'Yearly',
    };
    return labels[frequency] || frequency;
  };

  const getSummary = () => {
    const { frequency, interval, endDate, occurrences, daysOfWeek } = series.recurrenceRule;
    let summary = `Repeats ${getFrequencyLabel(frequency)}`;

    if (interval && interval > 1) {
      summary += ` (every ${interval} ${frequency === 'daily' ? 'days' : frequency === 'weekly' ? 'weeks' : frequency === 'monthly' ? 'months' : 'years'})`;
    }

    if (daysOfWeek && daysOfWeek.length > 0) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      summary += ` on ${daysOfWeek.map((d) => dayNames[d]).join(', ')}`;
    }

    if (endDate) {
      summary += ` until ${format(new Date(endDate), 'MMM d, yyyy')}`;
    } else if (occurrences) {
      summary += ` for ${occurrences} occurrences`;
    }

    return summary;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Repeat className="h-5 w-5 text-primary-600" />
            <CardTitle>Recurring Appointment Series</CardTitle>
          </div>
          <Badge>{series.appointments.length} appointments</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Repeat className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">Recurrence Pattern</span>
          </div>
          <p className="text-sm text-blue-700">{getSummary()}</p>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium">Modify Series:</span>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditSeries?.(series, 'all')}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit All
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDeleteSeries?.(series, 'all')}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete All
            </Button>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Upcoming Appointments</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {series.appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => onViewAppointment?.(appointment)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium">
                        {format(new Date(appointment.startTime), 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={
                      appointment.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : appointment.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
