/**
 * Storage Service - localStorage and sessionStorage wrapper
 */

export interface StorageOptions {
  ttl?: number; // Time to live in seconds
  encrypt?: boolean;
}

interface StorageItem<T> {
  value: T;
  expiresAt?: number;
}

class StorageService {
  private prefix: string = 'lithic_';

  /**
   * Set item in localStorage
   */
  setLocal<T>(key: string, value: T, options?: StorageOptions): void {
    this.setItem(localStorage, key, value, options);
  }

  /**
   * Get item from localStorage
   */
  getLocal<T>(key: string): T | null {
    return this.getItem<T>(localStorage, key);
  }

  /**
   * Remove item from localStorage
   */
  removeLocal(key: string): void {
    this.removeItem(localStorage, key);
  }

  /**
   * Set item in sessionStorage
   */
  setSession<T>(key: string, value: T, options?: StorageOptions): void {
    this.setItem(sessionStorage, key, value, options);
  }

  /**
   * Get item from sessionStorage
   */
  getSession<T>(key: string): T | null {
    return this.getItem<T>(sessionStorage, key);
  }

  /**
   * Remove item from sessionStorage
   */
  removeSession(key: string): void {
    this.removeItem(sessionStorage, key);
  }

  /**
   * Clear all items from localStorage
   */
  clearLocal(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Clear all items from sessionStorage
   */
  clearSession(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        sessionStorage.removeItem(key);
      }
    });
  }

  /**
   * Clear all storage
   */
  clearAll(): void {
    this.clearLocal();
    this.clearSession();
  }

  /**
   * Check if key exists in localStorage
   */
  hasLocal(key: string): boolean {
    return localStorage.getItem(this.prefix + key) !== null;
  }

  /**
   * Check if key exists in sessionStorage
   */
  hasSession(key: string): boolean {
    return sessionStorage.getItem(this.prefix + key) !== null;
  }

  /**
   * Get all keys from localStorage
   */
  getLocalKeys(): string[] {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(this.prefix))
      .map((key) => key.replace(this.prefix, ''));
  }

  /**
   * Get all keys from sessionStorage
   */
  getSessionKeys(): string[] {
    return Object.keys(sessionStorage)
      .filter((key) => key.startsWith(this.prefix))
      .map((key) => key.replace(this.prefix, ''));
  }

  /**
   * Generic set item
   */
  private setItem<T>(
    storage: Storage,
    key: string,
    value: T,
    options?: StorageOptions
  ): void {
    try {
      const item: StorageItem<T> = {
        value,
      };

      if (options?.ttl) {
        item.expiresAt = Date.now() + options.ttl * 1000;
      }

      const serialized = JSON.stringify(item);
      storage.setItem(this.prefix + key, serialized);
    } catch (error) {
      console.error(`Failed to set storage item: ${key}`, error);
    }
  }

  /**
   * Generic get item
   */
  private getItem<T>(storage: Storage, key: string): T | null {
    try {
      const serialized = storage.getItem(this.prefix + key);

      if (!serialized) {
        return null;
      }

      const item: StorageItem<T> = JSON.parse(serialized);

      // Check if item has expired
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.removeItem(storage, key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error(`Failed to get storage item: ${key}`, error);
      return null;
    }
  }

  /**
   * Generic remove item
   */
  private removeItem(storage: Storage, key: string): void {
    try {
      storage.removeItem(this.prefix + key);
    } catch (error) {
      console.error(`Failed to remove storage item: ${key}`, error);
    }
  }

  /**
   * Check storage availability
   */
  isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

export const storage = new StorageService();
export default storage;
