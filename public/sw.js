/**
 * Service Worker for Lithic Enterprise Healthcare Platform
 * PWA implementation with offline-first capabilities and HIPAA compliance
 *
 * Features:
 * - Cache-first for static assets
 * - Network-first for API calls with offline fallback
 * - Background sync for offline mutations
 * - Push notifications for clinical alerts
 * - Secure data handling for PHI
 */

const CACHE_VERSION = 'lithic-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
];

// API routes that should be cached for offline access
const CACHEABLE_API_ROUTES = [
  '/api/patients',
  '/api/clinical/medications',
  '/api/clinical/allergies',
  '/api/scheduling/appointments',
];

// Maximum cache sizes
const MAX_CACHE_SIZE = {
  dynamic: 50,
  api: 100,
  images: 30,
};

// Maximum cache age (in milliseconds)
const MAX_CACHE_AGE = {
  static: 7 * 24 * 60 * 60 * 1000, // 7 days
  dynamic: 24 * 60 * 60 * 1000, // 24 hours
  api: 15 * 60 * 1000, // 15 minutes
  images: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[ServiceWorker] Installation complete');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[ServiceWorker] Installation failed:', error);
    })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('lithic-') &&
                   !cacheName.startsWith(CACHE_VERSION);
          })
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[ServiceWorker] Activation complete');
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // API requests - Network First with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Images - Cache First with network fallback
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Static assets - Cache First
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // HTML pages - Network First with cache fallback
  if (request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
    return;
  }

  // Default - Network First
  event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

/**
 * Cache-first strategy
 * Returns cached response if available, otherwise fetches from network
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Check if cache is stale
      const cacheTime = new Date(cachedResponse.headers.get('sw-cache-time') || 0);
      const maxAge = MAX_CACHE_AGE[getCacheType(cacheName)];

      if (Date.now() - cacheTime.getTime() < maxAge) {
        console.log('[ServiceWorker] Cache hit:', request.url);
        return cachedResponse;
      }
    }

    // Fetch from network
    const networkResponse = await fetch(request);

    // Clone response before caching
    const responseToCache = networkResponse.clone();

    // Add cache timestamp
    const headers = new Headers(responseToCache.headers);
    headers.set('sw-cache-time', new Date().toISOString());

    const modifiedResponse = new Response(responseToCache.body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers: headers,
    });

    // Cache the response
    cache.put(request, modifiedResponse);

    // Limit cache size
    limitCacheSize(cacheName, MAX_CACHE_SIZE[getCacheType(cacheName)]);

    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Cache-first fetch failed:', error);

    // Try to return cached version even if stale
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for documents
    if (request.destination === 'document') {
      const offlineCache = await caches.open(STATIC_CACHE);
      return offlineCache.match('/offline');
    }

    throw error;
  }
}

/**
 * Network-first strategy
 * Tries network first, falls back to cache if offline
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request, {
      credentials: 'same-origin',
    });

    // Only cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();

      // Add cache timestamp
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', new Date().toISOString());

      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });

      cache.put(request, modifiedResponse);

      // Limit cache size
      limitCacheSize(cacheName, MAX_CACHE_SIZE[getCacheType(cacheName)]);
    }

    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', request.url);

    // Try cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[ServiceWorker] Cache hit (offline):', request.url);
      return cachedResponse;
    }

    // Return offline page for documents
    if (request.destination === 'document') {
      const offlineCache = await caches.open(STATIC_CACHE);
      return offlineCache.match('/offline');
    }

    throw error;
  }
}

/**
 * Stale-while-revalidate strategy
 * Returns cached response immediately, then updates cache in background
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();

      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', new Date().toISOString());

      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });

      cache.put(request, modifiedResponse);
    }
    return networkResponse;
  }).catch((error) => {
    console.error('[ServiceWorker] Background fetch failed:', error);
    return cachedResponse;
  });

  return cachedResponse || fetchPromise;
}

/**
 * Limit cache size by removing oldest entries
 */
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxSize) {
    // Sort by cache time (oldest first)
    const keysWithTime = await Promise.all(
      keys.map(async (key) => {
        const response = await cache.match(key);
        const cacheTime = new Date(response.headers.get('sw-cache-time') || 0);
        return { key, time: cacheTime.getTime() };
      })
    );

    keysWithTime.sort((a, b) => a.time - b.time);

    // Delete oldest entries
    const toDelete = keysWithTime.slice(0, keys.length - maxSize);
    await Promise.all(toDelete.map(({ key }) => cache.delete(key)));
  }
}

/**
 * Get cache type from cache name
 */
function getCacheType(cacheName) {
  if (cacheName.includes('static')) return 'static';
  if (cacheName.includes('dynamic')) return 'dynamic';
  if (cacheName.includes('api')) return 'api';
  if (cacheName.includes('images')) return 'images';
  return 'dynamic';
}

/**
 * Background Sync - for offline mutations
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);

  if (event.tag === 'sync-appointments') {
    event.waitUntil(syncAppointments());
  } else if (event.tag === 'sync-clinical-notes') {
    event.waitUntil(syncClinicalNotes());
  } else if (event.tag === 'sync-all') {
    event.waitUntil(syncAll());
  }
});

/**
 * Sync appointments from IndexedDB to server
 */
async function syncAppointments() {
  try {
    // Implementation will be handled by sync-manager.ts
    console.log('[ServiceWorker] Syncing appointments...');

    // Notify clients that sync is happening
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_START',
        resource: 'appointments',
      });
    });

    // Actual sync logic will be in sync-manager.ts
    // This is just the service worker hook

    return true;
  } catch (error) {
    console.error('[ServiceWorker] Appointment sync failed:', error);
    throw error;
  }
}

/**
 * Sync clinical notes from IndexedDB to server
 */
async function syncClinicalNotes() {
  try {
    console.log('[ServiceWorker] Syncing clinical notes...');

    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_START',
        resource: 'clinical-notes',
      });
    });

    return true;
  } catch (error) {
    console.error('[ServiceWorker] Clinical notes sync failed:', error);
    throw error;
  }
}

/**
 * Sync all pending changes
 */
async function syncAll() {
  try {
    console.log('[ServiceWorker] Syncing all pending changes...');

    await Promise.all([
      syncAppointments(),
      syncClinicalNotes(),
    ]);

    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
      });
    });

    return true;
  } catch (error) {
    console.error('[ServiceWorker] Sync all failed:', error);
    throw error;
  }
}

/**
 * Push Notification - for clinical alerts
 */
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received:', event);

  let data = {
    title: 'Lithic Healthcare',
    body: 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'default',
    requireInteraction: false,
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (error) {
      console.error('[ServiceWorker] Failed to parse push data:', error);
    }
  }

  // Set requireInteraction for critical alerts
  if (data.priority === 'critical' || data.category === 'clinical-alert') {
    data.requireInteraction = true;
    data.vibrate = [200, 100, 200];
  }

  const promiseChain = self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    requireInteraction: data.requireInteraction,
    vibrate: data.vibrate,
    data: data.data,
    actions: data.actions || [],
  });

  event.waitUntil(promiseChain);
});

/**
 * Notification Click - handle user interaction
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CLAIM_CLIENTS') {
    self.clients.claim();
  } else if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('lithic-'))
            .map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  } else if (event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ size });
      })
    );
  }
});

/**
 * Get total cache size
 */
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const cacheName of cacheNames) {
    if (cacheName.startsWith('lithic-')) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }
  }

  return totalSize;
}

console.log('[ServiceWorker] Loaded successfully');
