import api from '@/lib/api';
import type { TimeSlot, ProviderAvailability, ResourceAvailability } from '@/types/scheduling';
import { generateTimeSlots, timeStringToDate, addMinutes, getDayOfWeek } from '@/lib/utils';

class AvailabilityService {
  // Provider Availability
  async getProviderAvailability(providerId: string): Promise<ProviderAvailability[]> {
    const { data } = await api.get(`/scheduling/availability/provider/${providerId}`);
    return data;
  }

  async updateProviderAvailability(
    providerId: string,
    availability: Omit<ProviderAvailability, 'id' | 'providerId'>[]
  ): Promise<ProviderAvailability[]> {
    const { data } = await api.post(`/scheduling/availability/provider/${providerId}`, {
      availability,
    });
    return data;
  }

  async deleteProviderAvailability(availabilityId: string): Promise<void> {
    await api.delete(`/scheduling/availability/${availabilityId}`);
  }

  // Resource Availability
  async getResourceAvailability(resourceId: string): Promise<ResourceAvailability[]> {
    const { data } = await api.get(`/scheduling/availability/resource/${resourceId}`);
    return data;
  }

  async updateResourceAvailability(
    resourceId: string,
    availability: Omit<ResourceAvailability, 'id' | 'resourceId'>[]
  ): Promise<ResourceAvailability[]> {
    const { data } = await api.post(`/scheduling/availability/resource/${resourceId}`, {
      availability,
    });
    return data;
  }

  // Available Time Slots
  async getAvailableSlots(params: {
    providerId?: string;
    resourceId?: string;
    date: string;
    duration: number;
    appointmentType?: string;
  }): Promise<TimeSlot[]> {
    const { data } = await api.get('/scheduling/availability/slots', { params });
    return data;
  }

  async getAvailableSlotsRange(params: {
    providerId?: string;
    resourceId?: string;
    startDate: string;
    endDate: string;
    duration: number;
    appointmentType?: string;
  }): Promise<Record<string, TimeSlot[]>> {
    const { data } = await api.get('/scheduling/availability/slots/range', { params });
    return data;
  }

  // Client-side helpers
  generateDailySlots(
    availability: ProviderAvailability | ResourceAvailability,
    date: Date,
    slotDuration: number,
    existingAppointments: { startTime: string; endTime: string }[] = []
  ): TimeSlot[] {
    const dayOfWeek = getDayOfWeek(date);

    if (availability.dayOfWeek !== dayOfWeek || !availability.isActive) {
      return [];
    }

    const timeStrings = generateTimeSlots(
      availability.startTime,
      availability.endTime,
      slotDuration
    );

    const slots: TimeSlot[] = timeStrings.map((timeStr) => {
      const start = timeStringToDate(date.toISOString(), timeStr);
      const end = addMinutes(start, slotDuration);

      const isAvailable = !existingAppointments.some((apt) => {
        const aptStart = new Date(apt.startTime);
        const aptEnd = new Date(apt.endTime);

        return (
          (start >= aptStart && start < aptEnd) ||
          (end > aptStart && end <= aptEnd) ||
          (start <= aptStart && end >= aptEnd)
        );
      });

      return {
        start,
        end,
        isAvailable,
      };
    });

    return slots;
  }

  findNextAvailableSlot(
    availabilities: ProviderAvailability[] | ResourceAvailability[],
    fromDate: Date,
    duration: number,
    existingAppointments: { startTime: string; endTime: string }[] = [],
    daysToSearch: number = 30
  ): TimeSlot | null {
    const currentDate = new Date(fromDate);
    const endDate = new Date(fromDate);
    endDate.setDate(endDate.getDate() + daysToSearch);

    while (currentDate <= endDate) {
      const dayOfWeek = getDayOfWeek(currentDate);
      const dayAvailability = availabilities.find(
        (a) => a.dayOfWeek === dayOfWeek && a.isActive
      );

      if (dayAvailability) {
        const slots = this.generateDailySlots(
          dayAvailability,
          currentDate,
          duration,
          existingAppointments
        );

        const availableSlot = slots.find((slot) => slot.isAvailable);
        if (availableSlot) {
          return availableSlot;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return null;
  }

  async checkMultiResourceAvailability(params: {
    resourceIds: string[];
    startTime: string;
    endTime: string;
  }): Promise<Record<string, boolean>> {
    const { data } = await api.post('/scheduling/availability/check-resources', params);
    return data;
  }

  async getProviderWorkload(
    providerId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalAppointments: number;
    totalHours: number;
    utilizationRate: number;
    appointmentsByDay: Record<string, number>;
  }> {
    const { data } = await api.get(`/scheduling/availability/provider/${providerId}/workload`, {
      params: { startDate, endDate },
    });
    return data;
  }

  async getResourceUtilization(
    resourceId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalBookings: number;
    totalHours: number;
    utilizationRate: number;
    bookingsByDay: Record<string, number>;
  }> {
    const { data } = await api.get(`/scheduling/availability/resource/${resourceId}/utilization`, {
      params: { startDate, endDate },
    });
    return data;
  }

  async suggestAlternativeSlots(params: {
    providerId: string;
    requestedTime: string;
    duration: number;
    maxAlternatives?: number;
  }): Promise<TimeSlot[]> {
    const { data } = await api.post('/scheduling/availability/suggest-alternatives', {
      ...params,
      maxAlternatives: params.maxAlternatives || 5,
    });
    return data;
  }

  async blockTimeSlot(params: {
    providerId?: string;
    resourceId?: string;
    startTime: string;
    endTime: string;
    reason: string;
  }): Promise<void> {
    await api.post('/scheduling/availability/block', params);
  }

  async unblockTimeSlot(blockId: string): Promise<void> {
    await api.delete(`/scheduling/availability/block/${blockId}`);
  }

  async getBlockedSlots(params: {
    providerId?: string;
    resourceId?: string;
    startDate: string;
    endDate: string;
  }): Promise<Array<{
    id: string;
    providerId?: string;
    resourceId?: string;
    startTime: string;
    endTime: string;
    reason: string;
  }>> {
    const { data } = await api.get('/scheduling/availability/blocked', { params });
    return data;
  }
}

export const availabilityService = new AvailabilityService();
export default availabilityService;
