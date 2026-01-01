'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Calendar, Clock, User, MapPin, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { schedulingService } from '@/services/scheduling.service';
import type { Appointment } from '@/types/scheduling';
import { formatDateTime, formatDuration, getStatusColor } from '@/lib/utils';
import { toast } from 'sonner';

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadAppointment();
    }
  }, [id]);

  const loadAppointment = async () => {
    setLoading(true);
    try {
      const data = await schedulingService.getAppointment(id);
      setAppointment(data);
    } catch (error) {
      toast.error('Failed to load appointment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!appointment) return;

    setActionLoading(true);
    try {
      await schedulingService.confirmAppointment(appointment.id);
      toast.success('Appointment confirmed');
      await loadAppointment();
    } catch (error) {
      toast.error('Failed to confirm appointment');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!appointment) return;

    setActionLoading(true);
    try {
      await schedulingService.checkInAppointment(appointment.id);
      toast.success('Patient checked in');
      await loadAppointment();
    } catch (error) {
      toast.error('Failed to check in patient');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!appointment) return;

    setActionLoading(true);
    try {
      await schedulingService.completeAppointment(appointment.id);
      toast.success('Appointment completed');
      await loadAppointment();
    } catch (error) {
      toast.error('Failed to complete appointment');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment) return;

    setActionLoading(true);
    try {
      await schedulingService.cancelAppointment(appointment.id, cancelReason);
      toast.success('Appointment cancelled');
      setShowCancelDialog(false);
      await loadAppointment();
    } catch (error) {
      toast.error('Failed to cancel appointment');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;

    if (!confirm('Are you sure you want to delete this appointment?')) return;

    setActionLoading(true);
    try {
      await schedulingService.deleteAppointment(appointment.id);
      toast.success('Appointment deleted');
      router.push('/scheduling/appointments');
    } catch (error) {
      toast.error('Failed to delete appointment');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-gray-500">Loading appointment...</div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Appointment not found</p>
          <Button className="mt-4" onClick={() => router.push('/scheduling/appointments')}>
            Back to Appointments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/scheduling/appointments')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{appointment.title}</h1>
            <p className="text-gray-600 mt-1">Appointment Details</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {appointment.status === 'scheduled' && (
            <Button onClick={handleConfirm} disabled={actionLoading}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm
            </Button>
          )}
          {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
            <Button onClick={handleCheckIn} disabled={actionLoading}>
              Check In
            </Button>
          )}
          {appointment.status === 'in-progress' && (
            <Button onClick={handleComplete} disabled={actionLoading}>
              Complete
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push(`/scheduling/appointments/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowCancelDialog(true)} disabled={actionLoading}>
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Appointment Information</CardTitle>
                <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Date & Time</div>
                    <div className="font-medium">{formatDateTime(appointment.startTime)}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Duration</div>
                    <div className="font-medium">{formatDuration(appointment.duration)}</div>
                  </div>
                </div>

                {appointment.location && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Location</div>
                      <div className="font-medium">{appointment.location}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Type</div>
                    <div className="font-medium capitalize">{appointment.type}</div>
                  </div>
                </div>
              </div>

              {appointment.chiefComplaint && (
                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-500 mb-1">Chief Complaint</div>
                  <div>{appointment.chiefComplaint}</div>
                </div>
              )}

              {appointment.description && (
                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-500 mb-1">Description</div>
                  <div>{appointment.description}</div>
                </div>
              )}

              {appointment.notes && (
                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-500 mb-1">Notes</div>
                  <div className="p-3 bg-gray-50 rounded">{appointment.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Patient Info */}
          {appointment.patient && (
            <Card>
              <CardHeader>
                <CardTitle>Patient</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {appointment.patient.firstName} {appointment.patient.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{appointment.patient.email}</div>
                    <div className="text-sm text-gray-500">{appointment.patient.phone}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Provider Info */}
          {appointment.provider && (
            <Card>
              <CardHeader>
                <CardTitle>Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">{appointment.provider.name}</div>
                    <div className="text-sm text-gray-500">{appointment.provider.specialty}</div>
                    <div className="text-sm text-gray-500">{appointment.provider.department}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Cancellation reason..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Appointment
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={actionLoading}>
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
