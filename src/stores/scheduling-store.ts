/**
 * Scheduling Store - Zustand State Management
 * Manages scheduling state, calendar view, and appointment operations
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Appointment,
  Schedule,
  AppointmentType,
  AppointmentStatus,
  Waitlist,
  Room,
} from "@/types/scheduling";
import { addDays, startOfWeek, endOfWeek, format } from "date-fns";

// ============================================================================
// Types
// ============================================================================

export type CalendarView = "day" | "week" | "month" | "agenda";

export interface CalendarFilter {
  providerIds: string[];
  facilityIds: string[];
  appointmentTypes: AppointmentType[];
  statuses: AppointmentStatus[];
  roomIds: string[];
  showCancelled: boolean;
  showNoShow: boolean;
}

export interface SelectedTimeSlot {
  providerId: string;
  startTime: Date;
  duration: number;
  roomId?: string;
}

export interface DraggedAppointment {
  appointment: Appointment;
  originalStartTime: Date;
}

// ============================================================================
// Store Interface
// ============================================================================

interface SchedulingStore {
  // Calendar State
  view: CalendarView;
  currentDate: Date;
  selectedDate: Date | null;
  selectedProviderId: string | null;
  selectedAppointmentId: string | null;

  // Data
  appointments: Appointment[];
  schedules: Schedule[];
  waitlist: Waitlist[];
  rooms: Room[];

  // Filter State
  filter: CalendarFilter;
  searchQuery: string;

  // UI State
  isLoading: boolean;
  isSidebarOpen: boolean;
  isAppointmentModalOpen: boolean;
  isWaitlistModalOpen: boolean;
  selectedTimeSlot: SelectedTimeSlot | null;
  draggedAppointment: DraggedAppointment | null;

  // Bulk Operations
  selectedAppointmentIds: Set<string>;
  bulkOperationMode: boolean;

  // Actions - View
  setView: (view: CalendarView) => void;
  setCurrentDate: (date: Date) => void;
  setSelectedDate: (date: Date | null) => void;
  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;

  // Actions - Selection
  setSelectedProviderId: (id: string | null) => void;
  setSelectedAppointmentId: (id: string | null) => void;
  selectTimeSlot: (slot: SelectedTimeSlot | null) => void;

  // Actions - Data
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  removeAppointment: (id: string) => void;
  setSchedules: (schedules: Schedule[]) => void;
  setWaitlist: (waitlist: Waitlist[]) => void;
  setRooms: (rooms: Room[]) => void;

  // Actions - Filter
  setFilter: (filter: Partial<CalendarFilter>) => void;
  resetFilter: () => void;
  setSearchQuery: (query: string) => void;

  // Actions - UI
  setLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  openAppointmentModal: () => void;
  closeAppointmentModal: () => void;
  openWaitlistModal: () => void;
  closeWaitlistModal: () => void;

  // Actions - Drag & Drop
  startDrag: (appointment: Appointment) => void;
  endDrag: () => void;
  dropAppointment: (newStartTime: Date, providerId?: string) => Promise<void>;

  // Actions - Bulk Operations
  toggleBulkMode: () => void;
  toggleAppointmentSelection: (id: string) => void;
  selectAllAppointments: () => void;
  clearSelection: () => void;
  bulkCancel: (reason: string) => Promise<void>;
  bulkReschedule: (newDate: Date) => Promise<void>;

  // Computed/Helper
  getFilteredAppointments: () => Appointment[];
  getAppointmentById: (id: string) => Appointment | undefined;
  getAppointmentsByProvider: (providerId: string) => Appointment[];
  getAppointmentsByDate: (date: Date) => Appointment[];
  getProviderSchedule: (providerId: string) => Schedule | undefined;
}

// ============================================================================
// Default Values
// ============================================================================

const defaultFilter: CalendarFilter = {
  providerIds: [],
  facilityIds: [],
  appointmentTypes: [],
  statuses: [],
  roomIds: [],
  showCancelled: false,
  showNoShow: false,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useSchedulingStore = create<SchedulingStore>()(
  persist(
    (set, get) => ({
      // Initial State
      view: "week",
      currentDate: new Date(),
      selectedDate: null,
      selectedProviderId: null,
      selectedAppointmentId: null,

      appointments: [],
      schedules: [],
      waitlist: [],
      rooms: [],

      filter: defaultFilter,
      searchQuery: "",

      isLoading: false,
      isSidebarOpen: true,
      isAppointmentModalOpen: false,
      isWaitlistModalOpen: false,
      selectedTimeSlot: null,
      draggedAppointment: null,

      selectedAppointmentIds: new Set(),
      bulkOperationMode: false,

      // View Actions
      setView: (view) => {
        set({ view });
      },

      setCurrentDate: (date) => {
        set({ currentDate: date });
      },

      setSelectedDate: (date) => {
        set({ selectedDate: date });
      },

      goToToday: () => {
        set({ currentDate: new Date(), selectedDate: new Date() });
      },

      goToPrevious: () => {
        const { view, currentDate } = get();
        let newDate: Date;

        switch (view) {
          case "day":
            newDate = addDays(currentDate, -1);
            break;
          case "week":
            newDate = addDays(currentDate, -7);
            break;
          case "month":
            newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            break;
          default:
            newDate = addDays(currentDate, -1);
        }

        set({ currentDate: newDate });
      },

      goToNext: () => {
        const { view, currentDate } = get();
        let newDate: Date;

        switch (view) {
          case "day":
            newDate = addDays(currentDate, 1);
            break;
          case "week":
            newDate = addDays(currentDate, 7);
            break;
          case "month":
            newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            break;
          default:
            newDate = addDays(currentDate, 1);
        }

        set({ currentDate: newDate });
      },

      // Selection Actions
      setSelectedProviderId: (id) => {
        set({ selectedProviderId: id });
      },

      setSelectedAppointmentId: (id) => {
        set({ selectedAppointmentId: id });
      },

      selectTimeSlot: (slot) => {
        set({
          selectedTimeSlot: slot,
          isAppointmentModalOpen: slot !== null,
        });
      },

      // Data Actions
      setAppointments: (appointments) => {
        set({ appointments });
      },

      addAppointment: (appointment) => {
        set((state) => ({
          appointments: [...state.appointments, appointment],
        }));
      },

      updateAppointment: (id, updates) => {
        set((state) => ({
          appointments: state.appointments.map((appt) =>
            appt.id === id ? { ...appt, ...updates } : appt
          ),
        }));
      },

      removeAppointment: (id) => {
        set((state) => ({
          appointments: state.appointments.filter((appt) => appt.id !== id),
        }));
      },

      setSchedules: (schedules) => {
        set({ schedules });
      },

      setWaitlist: (waitlist) => {
        set({ waitlist });
      },

      setRooms: (rooms) => {
        set({ rooms });
      },

      // Filter Actions
      setFilter: (filterUpdates) => {
        set((state) => ({
          filter: { ...state.filter, ...filterUpdates },
        }));
      },

      resetFilter: () => {
        set({ filter: defaultFilter });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      // UI Actions
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      toggleSidebar: () => {
        set((state) => ({
          isSidebarOpen: !state.isSidebarOpen,
        }));
      },

      openAppointmentModal: () => {
        set({ isAppointmentModalOpen: true });
      },

      closeAppointmentModal: () => {
        set({
          isAppointmentModalOpen: false,
          selectedTimeSlot: null,
        });
      },

      openWaitlistModal: () => {
        set({ isWaitlistModalOpen: true });
      },

      closeWaitlistModal: () => {
        set({ isWaitlistModalOpen: false });
      },

      // Drag & Drop Actions
      startDrag: (appointment) => {
        set({
          draggedAppointment: {
            appointment,
            originalStartTime: appointment.startTime,
          },
        });
      },

      endDrag: () => {
        set({ draggedAppointment: null });
      },

      dropAppointment: async (newStartTime, providerId) => {
        const { draggedAppointment, updateAppointment } = get();
        if (!draggedAppointment) return;

        const { appointment, originalStartTime } = draggedAppointment;
        const duration = appointment.duration;
        const newEndTime = addDays(newStartTime, duration / (24 * 60));

        // Update appointment
        updateAppointment(appointment.id, {
          startTime: newStartTime,
          endTime: newEndTime,
          providerId: providerId || appointment.providerId,
        });

        // In real implementation, would make API call here
        // await api.updateAppointment(appointment.id, { startTime, endTime, providerId });

        set({ draggedAppointment: null });
      },

      // Bulk Operation Actions
      toggleBulkMode: () => {
        set((state) => ({
          bulkOperationMode: !state.bulkOperationMode,
          selectedAppointmentIds: new Set(),
        }));
      },

      toggleAppointmentSelection: (id) => {
        set((state) => {
          const newSet = new Set(state.selectedAppointmentIds);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return { selectedAppointmentIds: newSet };
        });
      },

      selectAllAppointments: () => {
        const { getFilteredAppointments } = get();
        const filtered = getFilteredAppointments();
        set({
          selectedAppointmentIds: new Set(filtered.map((a) => a.id)),
        });
      },

      clearSelection: () => {
        set({ selectedAppointmentIds: new Set() });
      },

      bulkCancel: async (reason) => {
        const { selectedAppointmentIds, updateAppointment } = get();

        for (const id of selectedAppointmentIds) {
          updateAppointment(id, {
            status: AppointmentStatus.CANCELLED,
            cancellationReason: reason,
            cancelledAt: new Date(),
          });
        }

        // In real implementation, would make API call here
        // await api.bulkCancelAppointments(Array.from(selectedAppointmentIds), reason);

        set({
          selectedAppointmentIds: new Set(),
          bulkOperationMode: false,
        });
      },

      bulkReschedule: async (newDate) => {
        const { selectedAppointmentIds, appointments, updateAppointment } = get();

        for (const id of selectedAppointmentIds) {
          const appointment = appointments.find((a) => a.id === id);
          if (!appointment) continue;

          const startTime = new Date(newDate);
          startTime.setHours(
            appointment.startTime.getHours(),
            appointment.startTime.getMinutes()
          );

          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + appointment.duration);

          updateAppointment(id, {
            startTime,
            endTime,
          });
        }

        // In real implementation, would make API call here
        // await api.bulkRescheduleAppointments(Array.from(selectedAppointmentIds), newDate);

        set({
          selectedAppointmentIds: new Set(),
          bulkOperationMode: false,
        });
      },

      // Computed/Helper Functions
      getFilteredAppointments: () => {
        const { appointments, filter, searchQuery } = get();

        return appointments.filter((appt) => {
          // Provider filter
          if (filter.providerIds.length > 0 && !filter.providerIds.includes(appt.providerId)) {
            return false;
          }

          // Appointment type filter
          if (filter.appointmentTypes.length > 0 && !filter.appointmentTypes.includes(appt.appointmentType)) {
            return false;
          }

          // Status filter
          if (filter.statuses.length > 0 && !filter.statuses.includes(appt.status)) {
            return false;
          }

          // Room filter
          if (filter.roomIds.length > 0 && appt.roomId && !filter.roomIds.includes(appt.roomId)) {
            return false;
          }

          // Show cancelled
          if (!filter.showCancelled && appt.status === AppointmentStatus.CANCELLED) {
            return false;
          }

          // Show no-show
          if (!filter.showNoShow && appt.status === AppointmentStatus.NO_SHOW) {
            return false;
          }

          // Search query
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
              appt.reason?.toLowerCase().includes(query) ||
              appt.chiefComplaint?.toLowerCase().includes(query) ||
              appt.notes?.toLowerCase().includes(query)
            );
          }

          return true;
        });
      },

      getAppointmentById: (id) => {
        const { appointments } = get();
        return appointments.find((appt) => appt.id === id);
      },

      getAppointmentsByProvider: (providerId) => {
        const { appointments } = get();
        return appointments.filter((appt) => appt.providerId === providerId);
      },

      getAppointmentsByDate: (date) => {
        const { appointments } = get();
        const dateStr = format(date, "yyyy-MM-dd");
        return appointments.filter(
          (appt) => format(appt.startTime, "yyyy-MM-dd") === dateStr
        );
      },

      getProviderSchedule: (providerId) => {
        const { schedules } = get();
        return schedules.find((sched) => sched.providerId === providerId);
      },
    }),
    {
      name: "lithic-scheduling-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        view: state.view,
        filter: state.filter,
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
);
