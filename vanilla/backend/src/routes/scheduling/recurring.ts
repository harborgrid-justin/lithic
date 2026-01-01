/**
 * Recurring Appointments Routes - Scheduling Module
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { Router, Request, Response } from 'express';

const router = Router();

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every N days/weeks/months/years
  daysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly)
  monthOfYear?: number; // 1-12 (for yearly)
  count?: number; // Number of occurrences
  endDate?: Date; // When to stop recurring
}

export interface RecurringAppointment {
  id: string;
  templateId: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  appointmentType: string;
  specialty?: string;
  duration: number; // minutes
  startDate: Date; // First occurrence
  startTime: string; // HH:MM format
  recurrencePattern: RecurrencePattern;
  reason: string;
  notes?: string;
  location: {
    facilityId: string;
    facilityName: string;
    roomNumber?: string;
  };
  resources?: {
    resourceId: string;
    resourceType: string;
    resourceName: string;
  }[];
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  occurrences: {
    appointmentId: string;
    date: Date;
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';
    cancelledReason?: string;
    rescheduledTo?: Date;
  }[];
  totalOccurrences?: number;
  completedOccurrences: number;
  upcomingOccurrences: number;
  lastOccurrence?: Date;
  nextOccurrence?: Date;
  autoConfirm: boolean;
  sendReminders: boolean;
  reminderSettings?: {
    daysBeforeMinutes: number;
    hoursBeforeMinutes: number;
    methods: ('email' | 'sms' | 'push')[];
  };
  exceptions: Date[]; // Dates to skip
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  pausedAt?: Date;
  pausedBy?: string;
  pausedReason?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
}

export interface RecurrenceTemplate {
  id: string;
  name: string;
  description?: string;
  appointmentType: string;
  duration: number;
  recurrencePattern: RecurrencePattern;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

// GET /api/scheduling/recurring - Get all recurring appointments
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      providerId,
      status,
      limit = '50',
      offset = '0'
    } = req.query;

    // TODO: Implement database query
    const recurringAppointments: RecurringAppointment[] = [];

    res.json({
      success: true,
      data: recurringAppointments,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recurring appointments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/scheduling/recurring/:id - Get recurring appointment by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Implement database query
    const recurring: RecurringAppointment | null = null;

    if (!recurring) {
      return res.status(404).json({
        success: false,
        error: 'Recurring appointment not found'
      });
    }

    res.json({
      success: true,
      data: recurring
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recurring appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/scheduling/recurring - Create recurring appointment
router.post('/', async (req: Request, res: Response) => {
  try {
    const recurringData = req.body;

    // Validate required fields
    if (!recurringData.patientId || !recurringData.providerId || !recurringData.startDate || !recurringData.recurrencePattern) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patientId, providerId, startDate, recurrencePattern'
      });
    }

    // Validate recurrence pattern
    const { frequency, interval, count, endDate } = recurringData.recurrencePattern;

    if (!frequency || !interval || interval < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recurrence pattern: frequency and interval (>= 1) are required'
      });
    }

    if (!count && !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Recurrence pattern must have either count or endDate'
      });
    }

    // Calculate occurrences
    const occurrences = calculateOccurrences(recurringData);

    // Check for conflicts for each occurrence
    // TODO: Implement conflict detection

    const newRecurring: RecurringAppointment = {
      id: `rec-${Date.now()}`,
      templateId: recurringData.templateId || `tpl-${Date.now()}`,
      ...recurringData,
      status: 'active',
      occurrences,
      totalOccurrences: occurrences.length,
      completedOccurrences: 0,
      upcomingOccurrences: occurrences.length,
      nextOccurrence: occurrences.length > 0 ? occurrences[0].date : undefined,
      autoConfirm: recurringData.autoConfirm ?? false,
      sendReminders: recurringData.sendReminders ?? true,
      exceptions: recurringData.exceptions || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system', // TODO: Get from auth
      updatedBy: 'system'
    };

    // TODO: Save to database and create individual appointments

    res.status(201).json({
      success: true,
      data: newRecurring,
      message: `Recurring appointment created with ${occurrences.length} occurrences`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create recurring appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/scheduling/recurring/:id - Update recurring appointment
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const { updateFuture = true } = req.query;

    // TODO: Fetch existing recurring appointment
    const existingRecurring: RecurringAppointment | null = null;

    if (!existingRecurring) {
      return res.status(404).json({
        success: false,
        error: 'Recurring appointment not found'
      });
    }

    // Update recurring appointment
    const updatedRecurring: RecurringAppointment = {
      ...existingRecurring,
      ...updateData,
      updatedAt: new Date(),
      updatedBy: 'system' // TODO: Get from auth
    };

    // If updateFuture is true, update all future occurrences
    // TODO: Implement future occurrences update

    // TODO: Save to database

    res.json({
      success: true,
      data: updatedRecurring,
      message: updateFuture ? 'Recurring appointment and future occurrences updated' : 'Recurring appointment updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update recurring appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/scheduling/recurring/:id - Cancel recurring appointment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, cancelFuture = true } = req.body;

    // TODO: Fetch existing recurring appointment
    const existingRecurring: RecurringAppointment | null = null;

    if (!existingRecurring) {
      return res.status(404).json({
        success: false,
        error: 'Recurring appointment not found'
      });
    }

    // Cancel recurring appointment
    const cancelledRecurring: RecurringAppointment = {
      ...existingRecurring,
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy: 'system', // TODO: Get from auth
      cancellationReason: reason,
      updatedAt: new Date(),
      updatedBy: 'system'
    };

    // If cancelFuture is true, cancel all future occurrences
    // TODO: Implement future occurrences cancellation

    // TODO: Save to database

    res.json({
      success: true,
      data: cancelledRecurring,
      message: cancelFuture ? 'Recurring appointment and all future occurrences cancelled' : 'Recurring appointment cancelled'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to cancel recurring appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/scheduling/recurring/:id/pause - Pause recurring appointment
router.post('/:id/pause', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // TODO: Fetch existing recurring appointment
    const existingRecurring: RecurringAppointment | null = null;

    if (!existingRecurring) {
      return res.status(404).json({
        success: false,
        error: 'Recurring appointment not found'
      });
    }

    if (existingRecurring.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Can only pause active recurring appointments'
      });
    }

    // Pause recurring appointment
    const pausedRecurring: RecurringAppointment = {
      ...existingRecurring,
      status: 'paused',
      pausedAt: new Date(),
      pausedBy: 'system', // TODO: Get from auth
      pausedReason: reason,
      updatedAt: new Date(),
      updatedBy: 'system'
    };

    // TODO: Save to database

    res.json({
      success: true,
      data: pausedRecurring,
      message: 'Recurring appointment paused successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to pause recurring appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/scheduling/recurring/:id/resume - Resume paused recurring appointment
router.post('/:id/resume', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Fetch existing recurring appointment
    const existingRecurring: RecurringAppointment | null = null;

    if (!existingRecurring) {
      return res.status(404).json({
        success: false,
        error: 'Recurring appointment not found'
      });
    }

    if (existingRecurring.status !== 'paused') {
      return res.status(400).json({
        success: false,
        error: 'Can only resume paused recurring appointments'
      });
    }

    // Resume recurring appointment
    const resumedRecurring: RecurringAppointment = {
      ...existingRecurring,
      status: 'active',
      pausedAt: undefined,
      pausedBy: undefined,
      pausedReason: undefined,
      updatedAt: new Date(),
      updatedBy: 'system' // TODO: Get from auth
    };

    // TODO: Save to database

    res.json({
      success: true,
      data: resumedRecurring,
      message: 'Recurring appointment resumed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to resume recurring appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/scheduling/recurring/:id/skip - Skip specific occurrence
router.post('/:id/skip', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required'
      });
    }

    // TODO: Fetch existing recurring appointment
    const existingRecurring: RecurringAppointment | null = null;

    if (!existingRecurring) {
      return res.status(404).json({
        success: false,
        error: 'Recurring appointment not found'
      });
    }

    // Add date to exceptions
    const updatedRecurring: RecurringAppointment = {
      ...existingRecurring,
      exceptions: [...existingRecurring.exceptions, new Date(date)],
      updatedAt: new Date(),
      updatedBy: 'system' // TODO: Get from auth
    };

    // TODO: Save to database and cancel the specific appointment

    res.json({
      success: true,
      data: updatedRecurring,
      message: 'Occurrence skipped successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to skip occurrence',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/scheduling/recurring/:id/occurrences - Get all occurrences
router.get('/:id/occurrences', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, startDate, endDate } = req.query;

    // TODO: Fetch recurring appointment and its occurrences
    const occurrences: any[] = [];

    res.json({
      success: true,
      data: occurrences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch occurrences',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/scheduling/recurring/templates - Get recurrence templates
router.get('/templates', async (req: Request, res: Response) => {
  try {
    // TODO: Fetch templates from database
    const templates: RecurrenceTemplate[] = [
      {
        id: 'tpl-weekly',
        name: 'Weekly',
        description: 'Repeats every week on the same day',
        appointmentType: 'follow-up',
        duration: 30,
        recurrencePattern: {
          frequency: 'weekly',
          interval: 1,
          count: 12
        },
        isActive: true,
        createdAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'tpl-biweekly',
        name: 'Bi-weekly',
        description: 'Repeats every 2 weeks',
        appointmentType: 'therapy',
        duration: 60,
        recurrencePattern: {
          frequency: 'weekly',
          interval: 2,
          count: 8
        },
        isActive: true,
        createdAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'tpl-monthly',
        name: 'Monthly',
        description: 'Repeats monthly on the same day',
        appointmentType: 'follow-up',
        duration: 30,
        recurrencePattern: {
          frequency: 'monthly',
          interval: 1,
          count: 6
        },
        isActive: true,
        createdAt: new Date(),
        createdBy: 'system'
      }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to calculate occurrences
function calculateOccurrences(recurringData: any): any[] {
  const occurrences = [];
  const { startDate, recurrencePattern } = recurringData;
  const { frequency, interval, count, endDate, daysOfWeek } = recurrencePattern;

  let currentDate = new Date(startDate);
  const maxDate = endDate ? new Date(endDate) : null;
  const maxCount = count || 52; // Default to 1 year of weekly appointments

  for (let i = 0; i < maxCount; i++) {
    if (maxDate && currentDate > maxDate) break;

    occurrences.push({
      appointmentId: `apt-${Date.now()}-${i}`,
      date: new Date(currentDate),
      status: 'scheduled'
    });

    // Calculate next occurrence based on frequency
    switch (frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + (interval * 7));
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        break;
    }
  }

  return occurrences;
}

export default router;
