'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import AppointmentCard from '@/components/scheduling/AppointmentCard';
import { schedulingService } from '@/services/scheduling.service';
import type { Appointment, AppointmentFilters } from '@/types/scheduling';
import { toast } from 'sonner';
import { debounce } from '@/lib/utils';

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AppointmentFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAppointments();
  }, [filters]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await schedulingService.getAppointments(filters);
      setAppointments(data);
    } catch (error) {
      toast.error('Failed to load appointments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = debounce((query: string) => {
    setFilters({ ...filters, searchTerm: query });
  }, 300);

  const handleStatusFilter = (status: string) => {
    if (status === 'all') {
      const { status: _, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({ ...filters, status: [status as any] });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-gray-600 mt-1">View and manage all appointments</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => router.push('/scheduling/appointments/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patients or providers..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
            />
          </div>
          <Select onChange={(e) => handleStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked-in">Checked In</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No Show</option>
          </Select>
          <Select>
            <option value="all">All Types</option>
            <option value="consultation">Consultation</option>
            <option value="follow-up">Follow-up</option>
            <option value="procedure">Procedure</option>
            <option value="telemedicine">Telemedicine</option>
          </Select>
          <Input type="date" onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
        </div>
      </Card>

      {/* Appointments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No appointments found</p>
            <Button
              className="mt-4"
              onClick={() => router.push('/scheduling/appointments/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Appointment
            </Button>
          </div>
        ) : (
          appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onClick={() => router.push(`/scheduling/appointments/${appointment.id}`)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {appointments.length > 0 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-gray-600">
            Showing {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
