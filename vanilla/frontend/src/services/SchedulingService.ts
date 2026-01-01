/**
 * Scheduling Service - Frontend API Client
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

export class SchedulingService {
  private apiBaseUrl = '/api/scheduling';

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/dashboard/stats`);
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    const result = await response.json();
    return result.data;
  }

  /**
   * Get today's schedule
   */
  async getTodaySchedule(): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getAppointments({
      startDate: today,
      endDate: tomorrow
    });
  }

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(days: number = 7): Promise<any[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.getAppointments({
      startDate,
      endDate,
      status: 'scheduled,confirmed'
    });
  }

  /**
   * Get appointments with filters
   */
  async getAppointments(filters: any = {}): Promise<any> {
    const params = new URLSearchParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (filters[key] instanceof Date) {
          params.append(key, filters[key].toISOString());
        } else {
          params.append(key, filters[key].toString());
        }
      }
    });

    const response = await fetch(`${this.apiBaseUrl}/appointments?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch appointments');
    const result = await response.json();
    return result.data;
  }

  /**
   * Get single appointment by ID
   */
  async getAppointment(id: string): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/appointments/${id}`);
    if (!response.ok) throw new Error('Failed to fetch appointment');
    const result = await response.json();
    return result.data;
  }

  /**
   * Create new appointment
   */
  async createAppointment(data: any): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create appointment');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Update appointment
   */
  async updateAppointment(id: string, data: any): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to update appointment');
    const result = await response.json();
    return result.data;
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(id: string, reason: string): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/appointments/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) throw new Error('Failed to cancel appointment');
    const result = await response.json();
    return result.data;
  }

  /**
   * Check in patient
   */
  async checkIn(id: string): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/appointments/${id}/check-in`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Failed to check in patient');
    const result = await response.json();
    return result.data;
  }

  /**
   * Check out patient
   */
  async checkOut(id: string): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/appointments/${id}/check-out`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Failed to check out patient');
    const result = await response.json();
    return result.data;
  }

  /**
   * Confirm appointment
   */
  async confirmAppointment(id: string): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/appointments/${id}/confirm`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Failed to confirm appointment');
    const result = await response.json();
    return result.data;
  }

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(id: string, newStartTime: Date, reason?: string): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/appointments/${id}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newStartTime: newStartTime.toISOString(), reason })
    });

    if (!response.ok) throw new Error('Failed to reschedule appointment');
    const result = await response.json();
    return result.data;
  }

  /**
   * Send reminder
   */
  async sendReminder(id: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/appointments/${id}/reminder`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Failed to send reminder');
  }

  /**
   * Check for conflicts
   */
  async checkConflicts(data: any): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/appointments/check-conflicts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to check conflicts');
    const result = await response.json();
    return result;
  }

  /**
   * Get availability
   */
  async getAvailability(filters: any): Promise<any[]> {
    const params = new URLSearchParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        if (filters[key] instanceof Date) {
          params.append(key, filters[key].toISOString());
        } else {
          params.append(key, filters[key].toString());
        }
      }
    });

    const response = await fetch(`${this.apiBaseUrl}/availability?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch availability');
    const result = await response.json();
    return result.data;
  }

  /**
   * Get providers
   */
  async getProviders(filters: any = {}): Promise<any[]> {
    const params = new URLSearchParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key].toString());
      }
    });

    const response = await fetch(`${this.apiBaseUrl}/providers?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch providers');
    const result = await response.json();
    return result.data;
  }

  /**
   * Get provider by ID
   */
  async getProvider(id: string): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/providers/${id}`);
    if (!response.ok) throw new Error('Failed to fetch provider');
    const result = await response.json();
    return result.data;
  }

  /**
   * Get resources
   */
  async getResources(filters: any = {}): Promise<any[]> {
    const params = new URLSearchParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key].toString());
      }
    });

    const response = await fetch(`${this.apiBaseUrl}/resources?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch resources');
    const result = await response.json();
    return result.data;
  }

  /**
   * Get waitlist entries
   */
  async getWaitlist(filters: any = {}): Promise<any[]> {
    const params = new URLSearchParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key].toString());
      }
    });

    const response = await fetch(`${this.apiBaseUrl}/waitlist?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch waitlist');
    const result = await response.json();
    return result.data;
  }

  /**
   * Get priority waitlist
   */
  async getPriorityWaitlist(): Promise<any[]> {
    const response = await fetch(`${this.apiBaseUrl}/waitlist/priority-queue`);
    if (!response.ok) throw new Error('Failed to fetch priority waitlist');
    const result = await response.json();
    return result.data;
  }

  /**
   * Add to waitlist
   */
  async addToWaitlist(data: any): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to add to waitlist');
    const result = await response.json();
    return result.data;
  }

  /**
   * Notify waitlist entry
   */
  async notifyWaitlistEntry(id: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/waitlist/${id}/notify`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Failed to notify patient');
  }

  /**
   * Remove from waitlist
   */
  async removeFromWaitlist(id: string, reason?: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/waitlist/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) throw new Error('Failed to remove from waitlist');
  }

  /**
   * Get recurring appointment templates
   */
  async getRecurringTemplates(): Promise<any[]> {
    const response = await fetch(`${this.apiBaseUrl}/recurring/templates`);
    if (!response.ok) throw new Error('Failed to fetch templates');
    const result = await response.json();
    return result.data;
  }

  /**
   * Create recurring appointment
   */
  async createRecurringAppointment(data: any): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/recurring`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to create recurring appointment');
    const result = await response.json();
    return result.data;
  }

  /**
   * Search today's appointments (for check-in kiosk)
   */
  async searchTodayAppointments(query: string): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await fetch(
      `${this.apiBaseUrl}/appointments?` +
      `startDate=${today.toISOString()}&` +
      `endDate=${tomorrow.toISOString()}&` +
      `search=${encodeURIComponent(query)}`
    );

    if (!response.ok) throw new Error('Failed to search appointments');
    const result = await response.json();
    return result.data;
  }

  /**
   * Get calendar data
   */
  async getCalendarData(filters: any): Promise<any> {
    const params = new URLSearchParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        if (filters[key] instanceof Date) {
          params.append(key, filters[key].toISOString());
        } else {
          params.append(key, filters[key].toString());
        }
      }
    });

    const response = await fetch(`${this.apiBaseUrl}/calendar?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch calendar data');
    const result = await response.json();
    return result.data;
  }

  /**
   * Batch operations on appointments
   */
  async batchOperation(operation: string, appointmentIds: string[], data?: any): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation, appointmentIds, data })
    });

    if (!response.ok) throw new Error(`Failed to perform batch operation: ${operation}`);
    const result = await response.json();
    return result.data;
  }
}

export default SchedulingService;
