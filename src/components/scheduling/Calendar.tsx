'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, addWeeks, addMonths, subWeeks, subMonths, isSameDay, startOfMonth, endOfMonth, getDay } from 'date-fns';
import type { Appointment, Provider, CalendarView } from '@/types/scheduling';
import { cn, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import AppointmentCard from './AppointmentCard';

interface CalendarProps {
  appointments: Appointment[];
  providers?: Provider[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  view?: CalendarView['mode'];
  onViewChange?: (view: CalendarView['mode']) => void;
}

export default function Calendar({
  appointments,
  providers = [],
  onAppointmentClick,
  onTimeSlotClick,
  view: initialView = 'week',
  onViewChange,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView['mode']>(initialView);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('all');

  const handleViewChange = (newView: CalendarView['mode']) => {
    setView(newView);
    onViewChange?.(newView);
  };

  const navigate = (direction: 'prev' | 'next') => {
    const offset = direction === 'next' ? 1 : -1;

    if (view === 'day') {
      setCurrentDate(addDays(currentDate, offset));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, offset));
    } else if (view === 'month') {
      setCurrentDate(addMonths(currentDate, offset));
    }
  };

  const filteredAppointments = useMemo(() => {
    return selectedProviderId === 'all'
      ? appointments
      : appointments.filter((apt) => apt.providerId === selectedProviderId);
  }, [appointments, selectedProviderId]);

  const renderDayView = () => {
    const dayAppointments = filteredAppointments.filter((apt) =>
      isSameDay(new Date(apt.startTime), currentDate)
    );

    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 9 PM

    return (
      <div className="flex-1 overflow-auto">
        <div className="min-w-[600px]">
          {hours.map((hour) => {
            const hourAppointments = dayAppointments.filter((apt) => {
              const aptHour = new Date(apt.startTime).getHours();
              return aptHour === hour;
            });

            return (
              <div key={hour} className="flex border-b border-gray-200">
                <div className="w-20 flex-shrink-0 p-2 text-sm text-gray-500">
                  {format(new Date().setHours(hour, 0), 'h:mm a')}
                </div>
                <div
                  className="flex-1 min-h-[60px] p-1 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onTimeSlotClick?.(currentDate, `${hour}:00`)}
                >
                  {hourAppointments.map((apt) => (
                    <div key={apt.id} className="mb-1">
                      <AppointmentCard
                        appointment={apt}
                        onClick={() => onAppointmentClick?.(apt)}
                        compact
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const hours = Array.from({ length: 14 }, (_, i) => i + 7);

    return (
      <div className="flex-1 overflow-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
            <div className="w-20"></div>
            {days.map((day) => (
              <div key={day.toString()} className="p-2 text-center">
                <div className="text-sm font-semibold">{format(day, 'EEE')}</div>
                <div className={cn(
                  'text-lg',
                  isSameDay(day, new Date()) && 'text-primary-600 font-bold'
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-200">
              <div className="w-20 p-2 text-sm text-gray-500">
                {format(new Date().setHours(hour, 0), 'h a')}
              </div>
              {days.map((day) => {
                const dayAppointments = filteredAppointments.filter((apt) => {
                  const aptDate = new Date(apt.startTime);
                  return (
                    isSameDay(aptDate, day) &&
                    aptDate.getHours() === hour
                  );
                });

                return (
                  <div
                    key={day.toString()}
                    className="border-l border-gray-200 min-h-[60px] p-1 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onTimeSlotClick?.(day, `${hour}:00`)}
                  >
                    {dayAppointments.map((apt) => (
                      <div key={apt.id} className="mb-1">
                        <AppointmentCard
                          appointment={apt}
                          onClick={() => onAppointmentClick?.(apt)}
                          compact
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="flex-1">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-semibold">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-rows-5 flex-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7">
              {week.map((day) => {
                const dayAppointments = filteredAppointments.filter((apt) =>
                  isSameDay(new Date(apt.startTime), day)
                );

                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      'border-l border-b border-gray-200 p-2 min-h-[120px]',
                      !isCurrentMonth && 'bg-gray-50',
                      'hover:bg-gray-100 cursor-pointer'
                    )}
                    onClick={() => onTimeSlotClick?.(day, '09:00')}
                  >
                    <div
                      className={cn(
                        'text-sm mb-1',
                        isToday && 'font-bold text-primary-600',
                        !isCurrentMonth && 'text-gray-400'
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((apt) => (
                        <div
                          key={apt.id}
                          className="text-xs p-1 bg-primary-100 text-primary-800 rounded truncate"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick?.(apt);
                          }}
                        >
                          {formatTime(apt.startTime)} - {apt.patient?.firstName} {apt.patient?.lastName}
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date())}>
              <CalendarIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <h2 className="text-xl font-semibold">
            {view === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
            {view === 'week' && `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`}
            {view === 'month' && format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {providers.length > 0 && (
            <Select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              className="w-48"
            >
              <option value="all">All Providers</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </Select>
          )}

          <div className="flex border border-gray-300 rounded-md">
            <button
              className={cn(
                'px-3 py-1 text-sm',
                view === 'day' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'
              )}
              onClick={() => handleViewChange('day')}
            >
              Day
            </button>
            <button
              className={cn(
                'px-3 py-1 text-sm border-l border-gray-300',
                view === 'week' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'
              )}
              onClick={() => handleViewChange('week')}
            >
              Week
            </button>
            <button
              className={cn(
                'px-3 py-1 text-sm border-l border-gray-300',
                view === 'month' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'
              )}
              onClick={() => handleViewChange('month')}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {view === 'day' && renderDayView()}
      {view === 'week' && renderWeekView()}
      {view === 'month' && renderMonthView()}
    </Card>
  );
}
