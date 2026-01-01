'use client';

import React, { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { format, addDays, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Appointment, Provider } from '@/types/scheduling';
import { cn, formatTime } from '@/lib/utils';
import { toast } from 'sonner';

const ITEM_TYPE = 'APPOINTMENT';

interface DragItem {
  appointment: Appointment;
  sourceDate: string;
  sourceTime: string;
}

interface DraggableAppointmentProps {
  appointment: Appointment;
  onDrop: (appointmentId: string, newDate: Date, newTime: string) => void;
}

function DraggableAppointment({ appointment, onDrop }: DraggableAppointmentProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: {
      appointment,
      sourceDate: format(new Date(appointment.startTime), 'yyyy-MM-dd'),
      sourceTime: format(new Date(appointment.startTime), 'HH:mm'),
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={cn(
        'p-2 bg-primary-100 text-primary-800 rounded border-l-4 border-primary-600',
        'cursor-move hover:shadow-md transition-shadow',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex items-center">
        <GripVertical className="h-4 w-4 mr-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{appointment.title}</div>
          <div className="text-xs truncate">
            {formatTime(appointment.startTime)} - {appointment.patient?.firstName} {appointment.patient?.lastName}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TimeSlotProps {
  date: Date;
  hour: number;
  appointments: Appointment[];
  onDrop: (appointmentId: string, newDate: Date, newTime: string) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
}

function TimeSlot({ date, hour, appointments, onDrop, onTimeSlotClick }: TimeSlotProps) {
  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: DragItem) => {
      const newTime = `${hour.toString().padStart(2, '0')}:00`;
      onDrop(item.appointment.id, date, newTime);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const slotAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.startTime);
    return (
      format(aptDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
      aptDate.getHours() === hour
    );
  });

  return (
    <div
      ref={drop}
      className={cn(
        'border-l border-gray-200 min-h-[60px] p-1',
        isOver && 'bg-primary-50 border-primary-300',
        'hover:bg-gray-50 cursor-pointer transition-colors'
      )}
      onClick={() => onTimeSlotClick?.(date, `${hour}:00`)}
    >
      <div className="space-y-1">
        {slotAppointments.map((apt) => (
          <DraggableAppointment key={apt.id} appointment={apt} onDrop={onDrop} />
        ))}
      </div>
    </div>
  );
}

interface DragDropCalendarProps {
  appointments: Appointment[];
  providers?: Provider[];
  onAppointmentMove: (appointmentId: string, newStartTime: Date) => Promise<void>;
  onTimeSlotClick?: (date: Date, time: string) => void;
}

function DragDropCalendarInner({
  appointments,
  providers = [],
  onAppointmentMove,
  onTimeSlotClick,
}: DragDropCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 9 PM

  const handleDrop = useCallback(
    async (appointmentId: string, newDate: Date, newTime: string) => {
      try {
        const [hours, minutes] = newTime.split(':').map(Number);
        const newStartTime = new Date(newDate);
        newStartTime.setHours(hours, minutes, 0, 0);

        await onAppointmentMove(appointmentId, newStartTime);
        toast.success('Appointment rescheduled successfully');
      } catch (error) {
        toast.error('Failed to reschedule appointment');
        console.error(error);
      }
    },
    [onAppointmentMove]
  );

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <h2 className="text-xl font-semibold">
          {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </h2>

        <div className="text-sm text-gray-500">Drag to reschedule</div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 sticky top-0">
            <div className="w-20"></div>
            {days.map((day) => (
              <div key={day.toString()} className="p-2 text-center">
                <div className="text-sm font-semibold">{format(day, 'EEE')}</div>
                <div
                  className={cn(
                    'text-lg',
                    format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
                      'text-primary-600 font-bold'
                  )}
                >
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-200">
              <div className="w-20 p-2 text-sm text-gray-500 bg-gray-50">
                {format(new Date().setHours(hour, 0), 'h a')}
              </div>
              {days.map((day) => (
                <TimeSlot
                  key={day.toString()}
                  date={day}
                  hour={hour}
                  appointments={appointments}
                  onDrop={handleDrop}
                  onTimeSlotClick={onTimeSlotClick}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function DragDropCalendar(props: DragDropCalendarProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <DragDropCalendarInner {...props} />
    </DndProvider>
  );
}
