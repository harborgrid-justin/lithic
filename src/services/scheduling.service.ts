import api from "@/lib/api";
import type {
  Appointment,
  AppointmentFilters,
  Provider,
  Patient,
  Resource,
  WaitlistEntry,
  ScheduleTemplate,
  RecurringSeries,
  ScheduleConflict,
} from "@/types/scheduling";
import type {
  AppointmentInput,
  WaitlistInput,
  ScheduleTemplateInput,
} from "@/lib/validators";

class SchedulingService {
  // Appointments
  async getAppointments(filters?: AppointmentFilters): Promise<Appointment[]> {
    const { data } = await api.get("/scheduling/appointments", {
      params: filters,
    });
    return data;
  }

  async getAppointment(id: string): Promise<Appointment> {
    const { data } = await api.get(`/scheduling/appointments/${id}`);
    return data;
  }

  async createAppointment(appointment: AppointmentInput): Promise<Appointment> {
    const { data } = await api.post("/scheduling/appointments", appointment);
    return data;
  }

  async updateAppointment(
    id: string,
    appointment: Partial<AppointmentInput>,
  ): Promise<Appointment> {
    const { data } = await api.put(
      `/scheduling/appointments/${id}`,
      appointment,
    );
    return data;
  }

  async deleteAppointment(id: string): Promise<void> {
    await api.delete(`/scheduling/appointments/${id}`);
  }

  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    const { data } = await api.post(`/scheduling/appointments/${id}/cancel`, {
      reason,
    });
    return data;
  }

  async rescheduleAppointment(
    id: string,
    newStartTime: string,
  ): Promise<Appointment> {
    const { data } = await api.post(
      `/scheduling/appointments/${id}/reschedule`,
      { newStartTime },
    );
    return data;
  }

  async confirmAppointment(id: string): Promise<Appointment> {
    const { data } = await api.post(`/scheduling/appointments/${id}/confirm`);
    return data;
  }

  async checkInAppointment(id: string): Promise<Appointment> {
    const { data } = await api.post(`/scheduling/appointments/${id}/check-in`);
    return data;
  }

  async completeAppointment(id: string, notes?: string): Promise<Appointment> {
    const { data } = await api.post(`/scheduling/appointments/${id}/complete`, {
      notes,
    });
    return data;
  }

  async checkConflicts(
    providerId: string,
    startTime: string,
    duration: number,
    excludeAppointmentId?: string,
  ): Promise<ScheduleConflict | null> {
    const { data } = await api.post(
      "/scheduling/appointments/check-conflicts",
      {
        providerId,
        startTime,
        duration,
        excludeAppointmentId,
      },
    );
    return data;
  }

  // Recurring Appointments
  async createRecurringAppointments(
    appointment: AppointmentInput,
  ): Promise<RecurringSeries> {
    const { data } = await api.post("/scheduling/recurring", appointment);
    return data;
  }

  async updateRecurringSeries(
    seriesId: string,
    updates: Partial<AppointmentInput>,
    updateScope: "this" | "future" | "all",
  ): Promise<RecurringSeries> {
    const { data } = await api.put(`/scheduling/recurring/${seriesId}`, {
      updates,
      updateScope,
    });
    return data;
  }

  async deleteRecurringSeries(
    seriesId: string,
    deleteScope: "this" | "future" | "all",
  ): Promise<void> {
    await api.delete(`/scheduling/recurring/${seriesId}`, {
      params: { deleteScope },
    });
  }

  // Providers
  async getProviders(): Promise<Provider[]> {
    const { data } = await api.get("/scheduling/providers");
    return data;
  }

  async getProvider(id: string): Promise<Provider> {
    const { data } = await api.get(`/scheduling/providers/${id}`);
    return data;
  }

  async getProviderSchedule(
    providerId: string,
    startDate: string,
    endDate: string,
  ): Promise<Appointment[]> {
    const { data } = await api.get(
      `/scheduling/providers/${providerId}/schedule`,
      {
        params: { startDate, endDate },
      },
    );
    return data;
  }

  // Resources
  async getResources(): Promise<Resource[]> {
    const { data } = await api.get("/scheduling/resources");
    return data;
  }

  async getResource(id: string): Promise<Resource> {
    const { data } = await api.get(`/scheduling/resources/${id}`);
    return data;
  }

  async getResourceSchedule(
    resourceId: string,
    startDate: string,
    endDate: string,
  ): Promise<Appointment[]> {
    const { data } = await api.get(
      `/scheduling/resources/${resourceId}/schedule`,
      {
        params: { startDate, endDate },
      },
    );
    return data;
  }

  // Waitlist
  async getWaitlist(filters?: {
    providerId?: string;
    status?: string;
  }): Promise<WaitlistEntry[]> {
    const { data } = await api.get("/scheduling/waitlist", { params: filters });
    return data;
  }

  async addToWaitlist(entry: WaitlistInput): Promise<WaitlistEntry> {
    const { data } = await api.post("/scheduling/waitlist", entry);
    return data;
  }

  async updateWaitlistEntry(
    id: string,
    updates: Partial<WaitlistInput>,
  ): Promise<WaitlistEntry> {
    const { data } = await api.put(`/scheduling/waitlist/${id}`, updates);
    return data;
  }

  async removeFromWaitlist(id: string): Promise<void> {
    await api.delete(`/scheduling/waitlist/${id}`);
  }

  async notifyWaitlistEntry(id: string): Promise<WaitlistEntry> {
    const { data } = await api.post(`/scheduling/waitlist/${id}/notify`);
    return data;
  }

  async scheduleFromWaitlist(
    id: string,
    appointmentData: AppointmentInput,
  ): Promise<{
    appointment: Appointment;
    waitlistEntry: WaitlistEntry;
  }> {
    const { data } = await api.post(
      `/scheduling/waitlist/${id}/schedule`,
      appointmentData,
    );
    return data;
  }

  // Templates
  async getScheduleTemplates(): Promise<ScheduleTemplate[]> {
    const { data } = await api.get("/scheduling/templates");
    return data;
  }

  async getScheduleTemplate(id: string): Promise<ScheduleTemplate> {
    const { data } = await api.get(`/scheduling/templates/${id}`);
    return data;
  }

  async createScheduleTemplate(
    template: ScheduleTemplateInput,
  ): Promise<ScheduleTemplate> {
    const { data } = await api.post("/scheduling/templates", template);
    return data;
  }

  async updateScheduleTemplate(
    id: string,
    template: Partial<ScheduleTemplateInput>,
  ): Promise<ScheduleTemplate> {
    const { data } = await api.put(`/scheduling/templates/${id}`, template);
    return data;
  }

  async deleteScheduleTemplate(id: string): Promise<void> {
    await api.delete(`/scheduling/templates/${id}`);
  }

  async applyScheduleTemplate(
    templateId: string,
    providerId: string,
    startDate: string,
    endDate: string,
  ): Promise<Appointment[]> {
    const { data } = await api.post(
      `/scheduling/templates/${templateId}/apply`,
      {
        providerId,
        startDate,
        endDate,
      },
    );
    return data;
  }

  // Bulk operations
  async bulkUpdateAppointments(
    appointmentIds: string[],
    updates: Partial<AppointmentInput>,
  ): Promise<Appointment[]> {
    const { data } = await api.post("/scheduling/appointments/bulk-update", {
      appointmentIds,
      updates,
    });
    return data;
  }

  async bulkCancelAppointments(
    appointmentIds: string[],
    reason?: string,
  ): Promise<void> {
    await api.post("/scheduling/appointments/bulk-cancel", {
      appointmentIds,
      reason,
    });
  }

  // Search
  async searchPatients(query: string): Promise<Patient[]> {
    const { data } = await api.get("/patients/search", {
      params: { q: query },
    });
    return data;
  }

  async searchProviders(query: string): Promise<Provider[]> {
    const { data } = await api.get("/scheduling/providers/search", {
      params: { q: query },
    });
    return data;
  }

  // Statistics
  async getAppointmentStats(startDate: string, endDate: string) {
    const { data } = await api.get("/scheduling/appointments/stats", {
      params: { startDate, endDate },
    });
    return data;
  }

  async getProviderStats(
    providerId: string,
    startDate: string,
    endDate: string,
  ) {
    const { data } = await api.get(
      `/scheduling/providers/${providerId}/stats`,
      {
        params: { startDate, endDate },
      },
    );
    return data;
  }
}

export const schedulingService = new SchedulingService();
export default schedulingService;
