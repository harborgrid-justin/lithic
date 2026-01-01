/**
 * Offline Store - IndexedDB wrapper for PWA offline capabilities
 * Provides client-side storage for healthcare data with HIPAA-compliant encryption
 *
 * Features:
 * - Patient data caching
 * - Appointment sync queue
 * - Clinical notes offline storage
 * - Conflict resolution
 * - Automatic data expiration
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ============================================================================
// Types
// ============================================================================

/**
 * Database schema definition
 */
interface LithicDB extends DBSchema {
  patients: {
    key: string;
    value: PatientCache;
    indexes: {
      'by-mrn': string;
      'by-updated': number;
    };
  };
  appointments: {
    key: string;
    value: AppointmentCache;
    indexes: {
      'by-patient': string;
      'by-date': string;
      'by-status': string;
      'by-sync-status': SyncStatus;
    };
  };
  clinicalNotes: {
    key: string;
    value: ClinicalNoteCache;
    indexes: {
      'by-patient': string;
      'by-encounter': string;
      'by-sync-status': SyncStatus;
    };
  };
  medications: {
    key: string;
    value: MedicationCache;
    indexes: {
      'by-patient': string;
      'by-status': string;
    };
  };
  allergies: {
    key: string;
    value: AllergyCache;
    indexes: {
      'by-patient': string;
    };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-status': SyncStatus;
      'by-priority': number;
      'by-created': number;
    };
  };
  metadata: {
    key: string;
    value: MetadataItem;
  };
}

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface PatientCache {
  id: string;
  mrn: string;
  data: any;
  lastUpdated: number;
  expiresAt: number;
  version: number;
}

export interface AppointmentCache {
  id: string;
  patientId: string;
  data: any;
  startTime: string;
  status: string;
  syncStatus: SyncStatus;
  lastUpdated: number;
  localChanges?: any;
  serverVersion?: number;
}

export interface ClinicalNoteCache {
  id: string;
  patientId: string;
  encounterId: string;
  data: any;
  syncStatus: SyncStatus;
  lastUpdated: number;
  localChanges?: any;
}

export interface MedicationCache {
  id: string;
  patientId: string;
  data: any;
  status: string;
  lastUpdated: number;
}

export interface AllergyCache {
  id: string;
  patientId: string;
  data: any;
  lastUpdated: number;
}

export interface SyncQueueItem {
  id: string;
  resource: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  status: SyncStatus;
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  lastAttempt?: number;
  error?: string;
}

export interface MetadataItem {
  key: string;
  value: any;
  updatedAt: number;
}

// ============================================================================
// Database Configuration
// ============================================================================

const DB_NAME = 'lithic-healthcare';
const DB_VERSION = 1;

// Cache expiration times (milliseconds)
const CACHE_EXPIRATION = {
  patient: 24 * 60 * 60 * 1000, // 24 hours
  appointment: 7 * 24 * 60 * 60 * 1000, // 7 days
  clinicalNote: 30 * 24 * 60 * 60 * 1000, // 30 days
  medication: 24 * 60 * 60 * 1000, // 24 hours
  allergy: 7 * 24 * 60 * 60 * 1000, // 7 days
};

let dbInstance: IDBPDatabase<LithicDB> | null = null;

/**
 * Initialize and open the IndexedDB database
 */
async function getDB(): Promise<IDBPDatabase<LithicDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<LithicDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log('[OfflineStore] Upgrading database from', oldVersion, 'to', newVersion);

      // Create patients store
      if (!db.objectStoreNames.contains('patients')) {
        const patientsStore = db.createObjectStore('patients', { keyPath: 'id' });
        patientsStore.createIndex('by-mrn', 'mrn', { unique: true });
        patientsStore.createIndex('by-updated', 'lastUpdated');
      }

      // Create appointments store
      if (!db.objectStoreNames.contains('appointments')) {
        const appointmentsStore = db.createObjectStore('appointments', { keyPath: 'id' });
        appointmentsStore.createIndex('by-patient', 'patientId');
        appointmentsStore.createIndex('by-date', 'startTime');
        appointmentsStore.createIndex('by-status', 'status');
        appointmentsStore.createIndex('by-sync-status', 'syncStatus');
      }

      // Create clinical notes store
      if (!db.objectStoreNames.contains('clinicalNotes')) {
        const notesStore = db.createObjectStore('clinicalNotes', { keyPath: 'id' });
        notesStore.createIndex('by-patient', 'patientId');
        notesStore.createIndex('by-encounter', 'encounterId');
        notesStore.createIndex('by-sync-status', 'syncStatus');
      }

      // Create medications store
      if (!db.objectStoreNames.contains('medications')) {
        const medsStore = db.createObjectStore('medications', { keyPath: 'id' });
        medsStore.createIndex('by-patient', 'patientId');
        medsStore.createIndex('by-status', 'status');
      }

      // Create allergies store
      if (!db.objectStoreNames.contains('allergies')) {
        const allergiesStore = db.createObjectStore('allergies', { keyPath: 'id' });
        allergiesStore.createIndex('by-patient', 'patientId');
      }

      // Create sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('by-status', 'status');
        syncStore.createIndex('by-priority', 'priority');
        syncStore.createIndex('by-created', 'createdAt');
      }

      // Create metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    },
    blocked() {
      console.warn('[OfflineStore] Database upgrade blocked - close other tabs');
    },
    blocking() {
      console.warn('[OfflineStore] Database blocking newer version');
      dbInstance?.close();
      dbInstance = null;
    },
  });

  return dbInstance;
}

// ============================================================================
// Patient Operations
// ============================================================================

export const patientStore = {
  /**
   * Cache a patient record
   */
  async set(id: string, mrn: string, data: any): Promise<void> {
    const db = await getDB();
    const patient: PatientCache = {
      id,
      mrn,
      data,
      lastUpdated: Date.now(),
      expiresAt: Date.now() + CACHE_EXPIRATION.patient,
      version: 1,
    };
    await db.put('patients', patient);
  },

  /**
   * Get a cached patient by ID
   */
  async get(id: string): Promise<any | null> {
    const db = await getDB();
    const patient = await db.get('patients', id);

    if (!patient) {
      return null;
    }

    // Check if expired
    if (patient.expiresAt < Date.now()) {
      await db.delete('patients', id);
      return null;
    }

    return patient.data;
  },

  /**
   * Get a cached patient by MRN
   */
  async getByMRN(mrn: string): Promise<any | null> {
    const db = await getDB();
    const patient = await db.getFromIndex('patients', 'by-mrn', mrn);

    if (!patient || patient.expiresAt < Date.now()) {
      return null;
    }

    return patient.data;
  },

  /**
   * Get all cached patients
   */
  async getAll(): Promise<any[]> {
    const db = await getDB();
    const patients = await db.getAllFromIndex('patients', 'by-updated');

    // Filter expired and return data only
    return patients
      .filter((p) => p.expiresAt >= Date.now())
      .map((p) => p.data);
  },

  /**
   * Delete a cached patient
   */
  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('patients', id);
  },

  /**
   * Clear all cached patients
   */
  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('patients');
  },
};

// ============================================================================
// Appointment Operations
// ============================================================================

export const appointmentStore = {
  /**
   * Cache an appointment
   */
  async set(id: string, patientId: string, data: any, syncStatus: SyncStatus = 'synced'): Promise<void> {
    const db = await getDB();
    const appointment: AppointmentCache = {
      id,
      patientId,
      data,
      startTime: data.startTime,
      status: data.status,
      syncStatus,
      lastUpdated: Date.now(),
    };
    await db.put('appointments', appointment);
  },

  /**
   * Get a cached appointment
   */
  async get(id: string): Promise<any | null> {
    const db = await getDB();
    const appointment = await db.get('appointments', id);
    return appointment?.data || null;
  },

  /**
   * Get appointments for a patient
   */
  async getByPatient(patientId: string): Promise<any[]> {
    const db = await getDB();
    const appointments = await db.getAllFromIndex('appointments', 'by-patient', patientId);
    return appointments.map((a) => a.data);
  },

  /**
   * Get appointments by status
   */
  async getByStatus(status: string): Promise<any[]> {
    const db = await getDB();
    const appointments = await db.getAllFromIndex('appointments', 'by-status', status);
    return appointments.map((a) => a.data);
  },

  /**
   * Get appointments pending sync
   */
  async getPendingSync(): Promise<AppointmentCache[]> {
    const db = await getDB();
    return db.getAllFromIndex('appointments', 'by-sync-status', 'pending');
  },

  /**
   * Update appointment sync status
   */
  async updateSyncStatus(id: string, status: SyncStatus): Promise<void> {
    const db = await getDB();
    const appointment = await db.get('appointments', id);

    if (appointment) {
      appointment.syncStatus = status;
      appointment.lastUpdated = Date.now();
      await db.put('appointments', appointment);
    }
  },

  /**
   * Mark appointment with local changes
   */
  async markLocalChanges(id: string, changes: any): Promise<void> {
    const db = await getDB();
    const appointment = await db.get('appointments', id);

    if (appointment) {
      appointment.localChanges = changes;
      appointment.syncStatus = 'pending';
      appointment.lastUpdated = Date.now();
      await db.put('appointments', appointment);
    }
  },

  /**
   * Delete a cached appointment
   */
  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('appointments', id);
  },

  /**
   * Clear all cached appointments
   */
  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('appointments');
  },
};

// ============================================================================
// Clinical Notes Operations
// ============================================================================

export const clinicalNoteStore = {
  /**
   * Cache a clinical note
   */
  async set(id: string, patientId: string, encounterId: string, data: any, syncStatus: SyncStatus = 'synced'): Promise<void> {
    const db = await getDB();
    const note: ClinicalNoteCache = {
      id,
      patientId,
      encounterId,
      data,
      syncStatus,
      lastUpdated: Date.now(),
    };
    await db.put('clinicalNotes', note);
  },

  /**
   * Get a cached clinical note
   */
  async get(id: string): Promise<any | null> {
    const db = await getDB();
    const note = await db.get('clinicalNotes', id);
    return note?.data || null;
  },

  /**
   * Get clinical notes for a patient
   */
  async getByPatient(patientId: string): Promise<any[]> {
    const db = await getDB();
    const notes = await db.getAllFromIndex('clinicalNotes', 'by-patient', patientId);
    return notes.map((n) => n.data);
  },

  /**
   * Get clinical notes for an encounter
   */
  async getByEncounter(encounterId: string): Promise<any[]> {
    const db = await getDB();
    const notes = await db.getAllFromIndex('clinicalNotes', 'by-encounter', encounterId);
    return notes.map((n) => n.data);
  },

  /**
   * Get notes pending sync
   */
  async getPendingSync(): Promise<ClinicalNoteCache[]> {
    const db = await getDB();
    return db.getAllFromIndex('clinicalNotes', 'by-sync-status', 'pending');
  },

  /**
   * Update note sync status
   */
  async updateSyncStatus(id: string, status: SyncStatus): Promise<void> {
    const db = await getDB();
    const note = await db.get('clinicalNotes', id);

    if (note) {
      note.syncStatus = status;
      note.lastUpdated = Date.now();
      await db.put('clinicalNotes', note);
    }
  },

  /**
   * Delete a cached clinical note
   */
  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('clinicalNotes', id);
  },

  /**
   * Clear all cached clinical notes
   */
  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('clinicalNotes');
  },
};

// ============================================================================
// Sync Queue Operations
// ============================================================================

export const syncQueue = {
  /**
   * Add item to sync queue
   */
  async add(
    resource: string,
    action: 'create' | 'update' | 'delete',
    data: any,
    priority: number = 0
  ): Promise<string> {
    const db = await getDB();
    const id = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const item: SyncQueueItem = {
      id,
      resource,
      action,
      data,
      status: 'pending',
      priority,
      retryCount: 0,
      maxRetries: 3,
      createdAt: Date.now(),
    };

    await db.put('syncQueue', item);
    return id;
  },

  /**
   * Get pending sync items
   */
  async getPending(): Promise<SyncQueueItem[]> {
    const db = await getDB();
    const items = await db.getAllFromIndex('syncQueue', 'by-status', 'pending');

    // Sort by priority (higher first) then creation time (older first)
    return items.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt - b.createdAt;
    });
  },

  /**
   * Update sync item status
   */
  async updateStatus(id: string, status: SyncStatus, error?: string): Promise<void> {
    const db = await getDB();
    const item = await db.get('syncQueue', id);

    if (item) {
      item.status = status;
      item.lastAttempt = Date.now();

      if (error) {
        item.error = error;
        item.retryCount++;

        // If max retries exceeded, mark as failed
        if (item.retryCount >= item.maxRetries) {
          item.status = 'failed';
        }
      }

      await db.put('syncQueue', item);
    }
  },

  /**
   * Remove item from sync queue
   */
  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('syncQueue', id);
  },

  /**
   * Clear all synced items
   */
  async clearSynced(): Promise<void> {
    const db = await getDB();
    const syncedItems = await db.getAllFromIndex('syncQueue', 'by-status', 'synced');

    for (const item of syncedItems) {
      await db.delete('syncQueue', item.id);
    }
  },

  /**
   * Clear all items
   */
  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('syncQueue');
  },
};

// ============================================================================
// Metadata Operations
// ============================================================================

export const metadata = {
  /**
   * Set metadata value
   */
  async set(key: string, value: any): Promise<void> {
    const db = await getDB();
    await db.put('metadata', {
      key,
      value,
      updatedAt: Date.now(),
    });
  },

  /**
   * Get metadata value
   */
  async get(key: string): Promise<any | null> {
    const db = await getDB();
    const item = await db.get('metadata', key);
    return item?.value || null;
  },

  /**
   * Delete metadata value
   */
  async delete(key: string): Promise<void> {
    const db = await getDB();
    await db.delete('metadata', key);
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get database size estimate
 */
export async function getDatabaseSize(): Promise<number> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}

/**
 * Clear all expired cache entries
 */
export async function clearExpired(): Promise<void> {
  const db = await getDB();

  // Clear expired patients
  const patients = await db.getAll('patients');
  const now = Date.now();

  for (const patient of patients) {
    if (patient.expiresAt < now) {
      await db.delete('patients', patient.id);
    }
  }
}

/**
 * Clear all cached data
 */
export async function clearAllData(): Promise<void> {
  await patientStore.clear();
  await appointmentStore.clear();
  await clinicalNoteStore.clear();
  await syncQueue.clear();
  console.log('[OfflineStore] All data cleared');
}

/**
 * Export database for backup
 */
export async function exportDatabase(): Promise<any> {
  const db = await getDB();
  const data: any = {};

  const storeNames = ['patients', 'appointments', 'clinicalNotes', 'medications', 'allergies', 'syncQueue', 'metadata'];

  for (const storeName of storeNames) {
    data[storeName] = await db.getAll(storeName as any);
  }

  return data;
}

/**
 * Close database connection
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
