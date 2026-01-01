/**
 * Cache Strategies for PWA
 * Implements various caching patterns for offline-first healthcare application
 *
 * Features:
 * - Cache versioning with automatic migration
 * - Stale-while-revalidate for clinical data
 * - Cache invalidation patterns
 * - Smart preloading
 * - Cache warming for critical resources
 */

import { patientStore, appointmentStore } from './offline-store';

// ============================================================================
// Types
// ============================================================================

export interface CacheStrategy {
  name: string;
  match: (request: Request) => boolean;
  handler: (request: Request) => Promise<Response>;
}

export interface CacheConfig {
  version: string;
  maxAge: number;
  maxEntries: number;
  networkTimeoutSeconds: number;
}

export interface PrecacheAsset {
  url: string;
  revision: string;
}

// ============================================================================
// Cache Configuration
// ============================================================================

export const CACHE_CONFIG: Record<string, CacheConfig> = {
  static: {
    version: 'v1',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    maxEntries: 100,
    networkTimeoutSeconds: 5,
  },
  api: {
    version: 'v1',
    maxAge: 15 * 60, // 15 minutes
    maxEntries: 200,
    networkTimeoutSeconds: 10,
  },
  images: {
    version: 'v1',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    maxEntries: 50,
    networkTimeoutSeconds: 5,
  },
  clinical: {
    version: 'v1',
    maxAge: 5 * 60, // 5 minutes
    maxEntries: 100,
    networkTimeoutSeconds: 10,
  },
};

// ============================================================================
// Cache Helper Functions
// ============================================================================

/**
 * Check if response is fresh based on max age
 */
export function isFresh(response: Response, maxAge: number): boolean {
  const cachedTime = response.headers.get('sw-cache-time');
  if (!cachedTime) return false;

  const age = (Date.now() - new Date(cachedTime).getTime()) / 1000;
  return age < maxAge;
}

/**
 * Add cache metadata to response
 */
export function addCacheMetadata(response: Response, metadata?: Record<string, string>): Response {
  const headers = new Headers(response.headers);
  headers.set('sw-cache-time', new Date().toISOString());
  headers.set('sw-cache-version', CACHE_CONFIG.static.version);

  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      headers.set(`sw-${key}`, value);
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Create a timeout promise
 */
function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), ms);
  });
}

// ============================================================================
// Caching Strategies
// ============================================================================

/**
 * Cache First Strategy
 * Returns cached response if available, otherwise fetches from network
 */
export async function cacheFirst(
  request: Request,
  cacheName: string,
  config: CacheConfig
): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse && isFresh(cachedResponse, config.maxAge)) {
    console.log('[CacheStrategy] Cache hit (fresh):', request.url);
    return cachedResponse;
  }

  try {
    const networkResponse = await Promise.race([
      fetch(request),
      timeout(config.networkTimeoutSeconds * 1000),
    ]);

    if (networkResponse.ok) {
      const responseWithMetadata = addCacheMetadata(networkResponse.clone());
      await cache.put(request, responseWithMetadata);
      await limitCacheSize(cacheName, config.maxEntries);
    }

    return networkResponse;
  } catch (error) {
    // Network failed, return stale cache if available
    if (cachedResponse) {
      console.log('[CacheStrategy] Cache hit (stale fallback):', request.url);
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Network First Strategy
 * Tries network first, falls back to cache if offline
 */
export async function networkFirst(
  request: Request,
  cacheName: string,
  config: CacheConfig
): Promise<Response> {
  try {
    const networkResponse = await Promise.race([
      fetch(request),
      timeout(config.networkTimeoutSeconds * 1000),
    ]);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseWithMetadata = addCacheMetadata(networkResponse.clone());
      await cache.put(request, responseWithMetadata);
      await limitCacheSize(cacheName, config.maxEntries);
    }

    return networkResponse;
  } catch (error) {
    console.log('[CacheStrategy] Network failed, trying cache:', request.url);

    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[CacheStrategy] Cache hit (network failed):', request.url);
      return cachedResponse;
    }

    throw error;
  }
}

/**
 * Stale While Revalidate Strategy
 * Returns cached response immediately, then updates cache in background
 */
export async function staleWhileRevalidate(
  request: Request,
  cacheName: string,
  config: CacheConfig
): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Trigger background update
  const fetchPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        const responseWithMetadata = addCacheMetadata(networkResponse.clone());
        await cache.put(request, responseWithMetadata);
        await limitCacheSize(cacheName, config.maxEntries);
      }
      return networkResponse;
    })
    .catch((error) => {
      console.error('[CacheStrategy] Background revalidation failed:', error);
      return cachedResponse;
    });

  // Return cached response immediately if available
  if (cachedResponse) {
    console.log('[CacheStrategy] Returning cached response, revalidating in background');
    return cachedResponse;
  }

  // Wait for network if no cache
  return fetchPromise;
}

/**
 * Network Only Strategy
 * Always fetches from network, no caching
 */
export async function networkOnly(request: Request): Promise<Response> {
  return fetch(request);
}

/**
 * Cache Only Strategy
 * Only returns cached responses
 */
export async function cacheOnly(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (!cachedResponse) {
    throw new Error('No cached response available');
  }

  return cachedResponse;
}

/**
 * Limit cache size by removing oldest entries
 */
async function limitCacheSize(cacheName: string, maxEntries: number): Promise<void> {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxEntries) {
    // Get all entries with their cache times
    const entries = await Promise.all(
      keys.map(async (key) => {
        const response = await cache.match(key);
        const cacheTime = response?.headers.get('sw-cache-time');
        return {
          key,
          time: cacheTime ? new Date(cacheTime).getTime() : 0,
        };
      })
    );

    // Sort by time (oldest first)
    entries.sort((a, b) => a.time - b.time);

    // Delete oldest entries
    const toDelete = entries.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map(({ key }) => cache.delete(key)));

    console.log('[CacheStrategy] Deleted', toDelete.length, 'old entries from', cacheName);
  }
}

// ============================================================================
// Cache Invalidation
// ============================================================================

/**
 * Invalidate cache for specific URL pattern
 */
export async function invalidateCache(pattern: string | RegExp): Promise<void> {
  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    for (const request of keys) {
      const match =
        typeof pattern === 'string'
          ? request.url.includes(pattern)
          : pattern.test(request.url);

      if (match) {
        await cache.delete(request);
        console.log('[CacheStrategy] Invalidated:', request.url);
      }
    }
  }
}

/**
 * Invalidate cache for specific patient
 */
export async function invalidatePatientCache(patientId: string): Promise<void> {
  await invalidateCache(`/api/patients/${patientId}`);
  await patientStore.delete(patientId);
}

/**
 * Invalidate cache for specific appointment
 */
export async function invalidateAppointmentCache(appointmentId: string): Promise<void> {
  await invalidateCache(`/api/scheduling/appointments/${appointmentId}`);
  await appointmentStore.delete(appointmentId);
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  console.log('[CacheStrategy] All caches cleared');
}

// ============================================================================
// Cache Warming
// ============================================================================

/**
 * Precache critical assets
 */
export async function precacheCriticalAssets(): Promise<void> {
  const criticalAssets: PrecacheAsset[] = [
    { url: '/', revision: CACHE_CONFIG.static.version },
    { url: '/offline', revision: CACHE_CONFIG.static.version },
    { url: '/manifest.json', revision: CACHE_CONFIG.static.version },
  ];

  const cache = await caches.open(`lithic-${CACHE_CONFIG.static.version}-static`);

  await Promise.all(
    criticalAssets.map(async (asset) => {
      try {
        const response = await fetch(asset.url);
        if (response.ok) {
          const responseWithMetadata = addCacheMetadata(response, {
            revision: asset.revision,
          });
          await cache.put(asset.url, responseWithMetadata);
        }
      } catch (error) {
        console.error('[CacheStrategy] Failed to precache:', asset.url, error);
      }
    })
  );

  console.log('[CacheStrategy] Precached', criticalAssets.length, 'critical assets');
}

/**
 * Warm cache with user's recent data
 */
export async function warmUserCache(userId: string): Promise<void> {
  try {
    // Fetch and cache user's recent appointments
    const appointmentsResponse = await fetch(
      `/api/scheduling/appointments?userId=${userId}&limit=10`
    );

    if (appointmentsResponse.ok) {
      const appointments = await appointmentsResponse.json();

      for (const appointment of appointments) {
        await appointmentStore.set(
          appointment.id,
          appointment.patientId,
          appointment,
          'synced'
        );
      }
    }

    // Fetch and cache user's recent patients
    const patientsResponse = await fetch(`/api/patients?userId=${userId}&limit=20`);

    if (patientsResponse.ok) {
      const patients = await patientsResponse.json();

      for (const patient of patients) {
        await patientStore.set(patient.id, patient.mrn, patient);
      }
    }

    console.log('[CacheStrategy] Warmed cache for user:', userId);
  } catch (error) {
    console.error('[CacheStrategy] Failed to warm user cache:', error);
  }
}

// ============================================================================
// Clinical Data Caching
// ============================================================================

/**
 * Cache clinical data with special handling
 * Uses stale-while-revalidate with shorter TTL for safety
 */
export async function cacheClinicalData(
  request: Request,
  resourceType: 'medications' | 'allergies' | 'vitals' | 'labs'
): Promise<Response> {
  const cacheName = `lithic-${CACHE_CONFIG.clinical.version}-clinical-${resourceType}`;

  return staleWhileRevalidate(request, cacheName, CACHE_CONFIG.clinical);
}

/**
 * Invalidate all clinical caches for a patient
 */
export async function invalidatePatientClinicalCache(patientId: string): Promise<void> {
  const resourceTypes = ['medications', 'allergies', 'vitals', 'labs'];

  for (const resourceType of resourceTypes) {
    await invalidateCache(`/api/clinical/${resourceType}?patientId=${patientId}`);
  }
}

// ============================================================================
// Cache Statistics
// ============================================================================

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  caches: Array<{
    name: string;
    size: number;
    count: number;
  }>;
  totalSize: number;
  totalCount: number;
}> {
  const cacheNames = await caches.keys();
  const cacheStats = await Promise.all(
    cacheNames.map(async (name) => {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      let size = 0;

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          size += blob.size;
        }
      }

      return {
        name,
        size,
        count: keys.length,
      };
    })
  );

  const totalSize = cacheStats.reduce((sum, cache) => sum + cache.size, 0);
  const totalCount = cacheStats.reduce((sum, cache) => sum + cache.count, 0);

  return {
    caches: cacheStats,
    totalSize,
    totalCount,
  };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// Cache Cleanup
// ============================================================================

/**
 * Clean up old caches
 */
export async function cleanupOldCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  const currentVersion = CACHE_CONFIG.static.version;

  const oldCaches = cacheNames.filter(
    (name) => name.startsWith('lithic-') && !name.includes(currentVersion)
  );

  await Promise.all(oldCaches.map((name) => caches.delete(name)));

  if (oldCaches.length > 0) {
    console.log('[CacheStrategy] Cleaned up', oldCaches.length, 'old caches');
  }
}

/**
 * Clean up expired entries
 */
export async function cleanupExpiredEntries(): Promise<void> {
  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    // Determine max age based on cache name
    let maxAge = CACHE_CONFIG.static.maxAge;
    if (cacheName.includes('api')) maxAge = CACHE_CONFIG.api.maxAge;
    if (cacheName.includes('clinical')) maxAge = CACHE_CONFIG.clinical.maxAge;
    if (cacheName.includes('images')) maxAge = CACHE_CONFIG.images.maxAge;

    for (const request of keys) {
      const response = await cache.match(request);
      if (response && !isFresh(response, maxAge)) {
        await cache.delete(request);
      }
    }
  }

  console.log('[CacheStrategy] Cleaned up expired entries');
}

// Auto cleanup on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    cleanupOldCaches().catch(console.error);
    cleanupExpiredEntries().catch(console.error);
  });
}
