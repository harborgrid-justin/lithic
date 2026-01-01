'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Provider, Appointment, ProviderAvailability } from '@/types/scheduling';
import { schedulingService } from '@/services/scheduling.service';
import { availabilityService } from '@/services/availability.service';
import { formatTime, formatDuration } from '@/lib/utils';
import AppointmentCard from './AppointmentCard';

interface ProviderScheduleProps {
  provider: Provider;
  date: Date;
  onAppointmentClick?: (appointment: Appointment) => void;
}

export default function ProviderSchedule({
  provider,
  date,
  onAppointmentClick,
}: ProviderScheduleProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<ProviderAvailability[]>([]);
  const [stats, setStats] = useState<{
    totalAppointments: number;
    totalHours: number;
    utilizationRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
    loadAvailability();
    loadStats();
  }, [provider.id, date]);

  const loadSchedule = async () => {
    try {
      const startDate = format(date, 'yyyy-MM-dd');
      const endDate = format(date, 'yyyy-MM-dd');

      const data = await schedulingService.getProviderSchedule(provider.id, startDate, endDate);
      setAppointments(data);
    } catch (error) {
      console.error('Failed to load provider schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      const data = await availabilityService.getProviderAvailability(provider.id);
      setAvailability(data);
    } catch (error) {
      console.error('Failed to load provider availability:', error);
    }
  };

  const loadStats = async () => {
    try {
      const startDate = format(date, 'yyyy-MM-dd');
      const endDate = format(date, 'yyyy-MM-dd');

      const data = await schedulingService.getProviderStats(provider.id, startDate, endDate);
      setStats(data);
    } catch (error) {
      console.error('Failed to load provider stats:', error);
    }
  };

  const dayAvailability = availability.find(
    (a) => a.dayOfWeek === date.getDay() && a.isActive
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{provider.name}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{provider.specialty}</p>
            </div>
            <Badge>{provider.department}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Date</div>
                <div className="font-semibold">{format(date, 'MMM d, yyyy')}</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Working Hours</div>
                <div className="font-semibold">
                  {dayAvailability
                    ? `${dayAvailability.startTime} - ${dayAvailability.endTime}`
                    : 'Not available'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Appointments</div>
                <div className="font-semibold">{appointments.length}</div>
              </div>
            </div>
          </div>

          {stats && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary-600">
                    {stats.totalAppointments}
                  </div>
                  <div className="text-xs text-gray-500">Total Appointments</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-600">
                    {stats.totalHours.toFixed(1)}h
                  </div>
                  <div className="text-xs text-gray-500">Scheduled Hours</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-600">
                    {(stats.utilizationRate * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500">Utilization Rate</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No appointments scheduled for this day
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onClick={() => onAppointmentClick?.(appointment)}
                  showProvider={false}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
