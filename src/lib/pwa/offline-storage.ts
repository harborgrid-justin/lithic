/**
 * IndexedDB Offline Storage for Lithic Healthcare Platform
 * HIPAA-compliant encrypted storage for offline data
 */

import { encryptObject, decryptObject } from "@/lib/encryption";

// Database configuration
const DB_NAME = "lithic-healthcare";
const DB_VERSION = 1;

// Object store names
export enum StoreName {
  PATIENTS = "patients",
  APPOINTMENTS = "appointments",
  CLINICAL_NOTES = "clinical_notes",
  MEDICATIONS = "medications",
  LAB_RESULTS = "lab_results",
  VITALS = "vitals",
  SYNC_QUEUE = "sync_queue",
  METADATA = "metadata",
}

// Encryption flag
const ENCRYPT_PHI = true;

/**
 * IndexedDB wrapper with encryption support
 */
export class OfflineStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize database connection
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(db);
      };
    });

    return this.initPromise;
  }

  /**
   * Create object stores
   */
  private createObjectStores(db: IDBDatabase): void {
    // Patients store
    if (!db.objectStoreNames.contains(StoreName.PATIENTS)) {
      const patientsStore = db.createObjectStore(StoreName.PATIENTS, {
        keyPath: "id",
      });
      patientsStore.createIndex("mrn", "mrn", { unique: true });
      patientsStore.createIndex("lastModified", "lastModified", {
        unique: false,
      });
    }

    // Appointments store
    if (!db.objectStoreNames.contains(StoreName.APPOINTMENTS)) {
      const appointmentsStore = db.createObjectStore(StoreName.APPOINTMENTS, {
        keyPath: "id",
      });
      appointmentsStore.createIndex("patientId", "patientId", {
        unique: false,
      });
      appointmentsStore.createIndex("date", "date", { unique: false });
      appointmentsStore.createIndex("status", "status", { unique: false });
    }

    // Clinical notes store
    if (!db.objectStoreNames.contains(StoreName.CLINICAL_NOTES)) {
      const notesStore = db.createObjectStore(StoreName.CLINICAL_NOTES, {
        keyPath: "id",
      });
      notesStore.createIndex("patientId", "patientId", { unique: false });
      notesStore.createIndex("encounterId", "encounterId", { unique: false });
      notesStore.createIndex("date", "date", { unique: false });
    }

    // Medications store
    if (!db.objectStoreNames.contains(StoreName.MEDICATIONS)) {
      const medsStore = db.createObjectStore(StoreName.MEDICATIONS, {
        keyPath: "id",
      });
      medsStore.createIndex("patientId", "patientId", { unique: false });
      medsStore.createIndex("status", "status", { unique: false });
    }

    // Lab results store
    if (!db.objectStoreNames.contains(StoreName.LAB_RESULTS)) {
      const labStore = db.createObjectStore(StoreName.LAB_RESULTS, {
        keyPath: "id",
      });
      labStore.createIndex("patientId", "patientId", { unique: false });
      labStore.createIndex("orderDate", "orderDate", { unique: false });
    }

    // Vitals store
    if (!db.objectStoreNames.contains(StoreName.VITALS)) {
      const vitalsStore = db.createObjectStore(StoreName.VITALS, {
        keyPath: "id",
      });
      vitalsStore.createIndex("patientId", "patientId", { unique: false });
      vitalsStore.createIndex("timestamp", "timestamp", { unique: false });
    }

    // Sync queue store
    if (!db.objectStoreNames.contains(StoreName.SYNC_QUEUE)) {
      const syncStore = db.createObjectStore(StoreName.SYNC_QUEUE, {
        keyPath: "id",
        autoIncrement: true,
      });
      syncStore.createIndex("timestamp", "timestamp", { unique: false });
      syncStore.createIndex("status", "status", { unique: false });
      syncStore.createIndex("storeName", "storeName", { unique: false });
    }

    // Metadata store
    if (!db.objectStoreNames.contains(StoreName.METADATA)) {
      db.createObjectStore(StoreName.METADATA, { keyPath: "key" });
    }
  }

  /**
   * Get record by ID
   */
  async get<T = any>(storeName: StoreName, id: string): Promise<T | null> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Decrypt if encrypted
        if (result.encrypted && ENCRYPT_PHI) {
          try {
            const decrypted = decryptObject<T>(result.data);
            resolve(decrypted);
          } catch (error) {
            reject(new Error("Failed to decrypt data"));
          }
        } else {
          resolve(result as T);
        }
      };

      request.onerror = () => {
        reject(new Error("Failed to get record"));
      };
    });
  }

  /**
   * Get all records from store
   */
  async getAll<T = any>(storeName: StoreName): Promise<T[]> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result;

        // Decrypt if encrypted
        if (ENCRYPT_PHI) {
          const decrypted = results.map((result) => {
            if (result.encrypted) {
              try {
                return decryptObject<T>(result.data);
              } catch (error) {
                console.error("Failed to decrypt record:", error);
                return null;
              }
            }
            return result as T;
          });

          resolve(decrypted.filter((r) => r !== null) as T[]);
        } else {
          resolve(results as T[]);
        }
      };

      request.onerror = () => {
        reject(new Error("Failed to get all records"));
      };
    });
  }

  /**
   * Get records by index
   */
  async getByIndex<T = any>(
    storeName: StoreName,
    indexName: string,
    value: any
  ): Promise<T[]> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => {
        const results = request.result;

        // Decrypt if encrypted
        if (ENCRYPT_PHI) {
          const decrypted = results.map((result) => {
            if (result.encrypted) {
              try {
                return decryptObject<T>(result.data);
              } catch (error) {
                console.error("Failed to decrypt record:", error);
                return null;
              }
            }
            return result as T;
          });

          resolve(decrypted.filter((r) => r !== null) as T[]);
        } else {
          resolve(results as T[]);
        }
      };

      request.onerror = () => {
        reject(new Error("Failed to get records by index"));
      };
    });
  }

  /**
   * Put record (add or update)
   */
  async put<T = any>(
    storeName: StoreName,
    data: T,
    encrypt = ENCRYPT_PHI
  ): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      // Encrypt if required
      const dataToStore = encrypt
        ? {
            id: (data as any).id,
            encrypted: true,
            data: encryptObject(data),
            lastModified: Date.now(),
          }
        : data;

      const request = store.put(dataToStore);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to put record"));
      };
    });
  }

  /**
   * Delete record by ID
   */
  async delete(storeName: StoreName, id: string): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to delete record"));
      };
    });
  }

  /**
   * Clear all records from store
   */
  async clear(storeName: StoreName): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to clear store"));
      };
    });
  }

  /**
   * Count records in store
   */
  async count(storeName: StoreName): Promise<number> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error("Failed to count records"));
      };
    });
  }

  /**
   * Get metadata value
   */
  async getMetadata(key: string): Promise<any> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(StoreName.METADATA, "readonly");
      const store = transaction.objectStore(StoreName.METADATA);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value);
      };

      request.onerror = () => {
        reject(new Error("Failed to get metadata"));
      };
    });
  }

  /**
   * Set metadata value
   */
  async setMetadata(key: string, value: any): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(StoreName.METADATA, "readwrite");
      const store = transaction.objectStore(StoreName.METADATA);
      const request = store.put({ key, value, timestamp: Date.now() });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to set metadata"));
      };
    });
  }

  /**
   * Delete entire database (for security/logout)
   */
  async deleteDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);

      request.onsuccess = () => {
        console.log("Database deleted successfully");
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to delete database"));
      };
    });
  }

  /**
   * Export all data (for backup/transfer)
   */
  async exportAllData(): Promise<Record<string, any[]>> {
    const db = await this.init();
    const storeNames = Array.from(db.objectStoreNames);
    const data: Record<string, any[]> = {};

    for (const storeName of storeNames) {
      try {
        data[storeName] = await this.getAll(storeName as StoreName);
      } catch (error) {
        console.error(`Failed to export ${storeName}:`, error);
        data[storeName] = [];
      }
    }

    return data;
  }

  /**
   * Get database size estimate
   */
  async getStorageEstimate(): Promise<{
    usage: number;
    quota: number;
    percentage: number;
  }> {
    if (!navigator.storage || !navigator.storage.estimate) {
      return { usage: 0, quota: 0, percentage: 0 };
    }

    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;

    return { usage, quota, percentage };
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

/**
 * Singleton instance
 */
let offlineStorage: OfflineStorage | null = null;

/**
 * Get offline storage instance
 */
export function getOfflineStorage(): OfflineStorage {
  if (!offlineStorage) {
    offlineStorage = new OfflineStorage();
  }
  return offlineStorage;
}

/**
 * Type-safe storage operations
 */
export interface StorageOperations<T> {
  get: (id: string) => Promise<T | null>;
  getAll: () => Promise<T[]>;
  put: (data: T) => Promise<void>;
  delete: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  count: () => Promise<number>;
}

/**
 * Create type-safe store accessor
 */
export function createStoreAccessor<T>(
  storeName: StoreName
): StorageOperations<T> {
  const storage = getOfflineStorage();

  return {
    get: (id: string) => storage.get<T>(storeName, id),
    getAll: () => storage.getAll<T>(storeName),
    put: (data: T) => storage.put<T>(storeName, data),
    delete: (id: string) => storage.delete(storeName, id),
    clear: () => storage.clear(storeName),
    count: () => storage.count(storeName),
  };
}
