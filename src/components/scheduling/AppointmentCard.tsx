'use client';

import React from 'react';
import { Clock, User, MapPin, FileText } from 'lucide-react';
import type { Appointment } from '@/types/scheduling';
import { cn, formatTime, formatDuration, getStatusColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: () => void;
  compact?: boolean;
  showProvider?: boolean;
  showPatient?: boolean;
}

export default function AppointmentCard({
  appointment,
  onClick,
  compact = false,
  showProvider = true,
  showPatient = true,
}: AppointmentCardProps) {
  if (compact) {
    return (
      <div
        className={cn(
          'p-2 rounded border-l-4 cursor-pointer hover:shadow-md transition-shadow',
          'bg-white border-gray-200',
          appointment.status === 'confirmed' && 'border-l-green-500',
          appointment.status === 'scheduled' && 'border-l-blue-500',
          appointment.status === 'in-progress' && 'border-l-yellow-500',
          appointment.status === 'completed' && 'border-l-gray-500',
          appointment.status === 'cancelled' && 'border-l-red-500'
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{appointment.title}</div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(appointment.startTime)}
            </div>
          </div>
          <Badge className={cn('ml-2', getStatusColor(appointment.status))}>
            {appointment.status}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg">{appointment.title}</h3>
            <Badge className={cn('mt-1', getStatusColor(appointment.status))}>
              {appointment.status}
            </Badge>
          </div>
          <span className="text-sm text-gray-500">{appointment.type}</span>
        </div>

        <div className="space-y-2">
          {showPatient && appointment.patient && (
            <div className="flex items-center text-sm">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              <span>
                {appointment.patient.firstName} {appointment.patient.lastName}
              </span>
            </div>
          )}

          {showProvider && appointment.provider && (
            <div className="flex items-center text-sm">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              <span>Dr. {appointment.provider.name}</span>
            </div>
          )}

          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            <span>
              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
              <span className="text-gray-500 ml-1">
                ({formatDuration(appointment.duration)})
              </span>
            </span>
          </div>

          {appointment.location && (
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <span>{appointment.location}</span>
            </div>
          )}

          {appointment.chiefComplaint && (
            <div className="flex items-start text-sm">
              <FileText className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
              <span className="text-gray-600">{appointment.chiefComplaint}</span>
            </div>
          )}
        </div>

        {appointment.notes && (
          <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
            {appointment.notes}
          </div>
        )}
      </div>
    </Card>
  );
}
