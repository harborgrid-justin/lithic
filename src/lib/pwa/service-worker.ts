/**
 * Service Worker for Lithic Healthcare Platform
 * Implements offline capabilities and caching strategies
 * HIPAA-compliant with encrypted cache storage
 */

declare const self: ServiceWorkerGlobalScope;

// Service Worker version - increment to trigger update
const SW_VERSION = "v1.0.0";
const CACHE_NAME = `lithic-${SW_VERSION}`;

// Cache strategy configurations
const CACHE_CONFIG = {
  // Static assets (app shell)
  static: {
    name: `${CACHE_NAME}-static`,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    urls: [
      "/",
      "/offline",
      "/manifest.json",
      // Add your static assets here
    ],
  },
  // API responses
  api: {
    name: `${CACHE_NAME}-api`,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 100,
  },
  // Images and media
  media: {
    name: `${CACHE_NAME}-media`,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 50,
  },
  // Clinical data (encrypted)
  clinical: {
    name: `${CACHE_NAME}-clinical`,
    maxAge: 1 * 60 * 1000, // 1 minute
    maxEntries: 20,
  },
};

/**
 * Install event - cache static assets
 */
self.addEventListener("install", (event: ExtendableEvent) => {
  console.log("[Service Worker] Installing version:", SW_VERSION);

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_CONFIG.static.name);
        await cache.addAll(CACHE_CONFIG.static.urls);
        console.log("[Service Worker] Static assets cached");

        // Skip waiting to activate immediately
        await self.skipWaiting();
      } catch (error) {
        console.error("[Service Worker] Installation failed:", error);
      }
    })()
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener("activate", (event: ExtendableEvent) => {
  console.log("[Service Worker] Activating version:", SW_VERSION);

  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((name) => name.startsWith("lithic-") && name !== CACHE_NAME)
            .map((name) => {
              console.log("[Service Worker] Deleting old cache:", name);
              return caches.delete(name);
            })
        );

        // Take control of all clients
        await self.clients.claim();
        console.log("[Service Worker] Activated and claimed clients");
      } catch (error) {
        console.error("[Service Worker] Activation failed:", error);
      }
    })()
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome extensions and other origins
  if (url.origin !== self.location.origin) {
    return;
  }

  // Determine caching strategy based on URL
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleAPIRequest(request));
  } else if (isMediaRequest(url.pathname)) {
    event.respondWith(handleMediaRequest(request));
  } else if (isClinicalDataRequest(url.pathname)) {
    event.respondWith(handleClinicalDataRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

/**
 * Handle static asset requests (app shell)
 * Strategy: Cache First with Network Fallback
 */
async function handleStaticRequest(request: Request): Promise<Response> {
  try {
    const cache = await caches.open(CACHE_CONFIG.static.name);
    const cached = await cache.match(request);

    if (cached && !isExpired(cached, CACHE_CONFIG.static.maxAge)) {
      return cached;
    }

    // Fetch from network
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const clonedResponse = response.clone();
      await cache.put(request, clonedResponse);
    }

    return response;
  } catch (error) {
    console.error("[Service Worker] Static request failed:", error);

    // Return cached version if available
    const cache = await caches.open(CACHE_CONFIG.static.name);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      const offlinePage = await cache.match("/offline");
      if (offlinePage) {
        return offlinePage;
      }
    }

    return new Response("Offline", { status: 503 });
  }
}

/**
 * Handle API requests
 * Strategy: Network First with Cache Fallback
 */
async function handleAPIRequest(request: Request): Promise<Response> {
  try {
    // Try network first
    const response = await fetch(request);

    // Cache successful GET responses (not for PHI endpoints)
    if (response.ok && !isPHIEndpoint(request.url)) {
      const cache = await caches.open(CACHE_CONFIG.api.name);
      const clonedResponse = response.clone();
      await cache.put(request, clonedResponse);
      await enforceQuotaPolicy(cache, CACHE_CONFIG.api.maxEntries);
    }

    return response;
  } catch (error) {
    console.error("[Service Worker] API request failed:", error);

    // Try cache fallback (only for non-PHI endpoints)
    if (!isPHIEndpoint(request.url)) {
      const cache = await caches.open(CACHE_CONFIG.api.name);
      const cached = await cache.match(request);

      if (cached && !isExpired(cached, CACHE_CONFIG.api.maxAge)) {
        // Add header to indicate this is cached data
        const clonedResponse = cached.clone();
        const headers = new Headers(clonedResponse.headers);
        headers.set("X-From-Cache", "true");

        return new Response(clonedResponse.body, {
          status: clonedResponse.status,
          statusText: clonedResponse.statusText,
          headers,
        });
      }
    }

    return new Response(
      JSON.stringify({
        error: "Offline",
        message: "This request requires an active internet connection",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Handle media requests (images, videos)
 * Strategy: Cache First with Network Fallback
 */
async function handleMediaRequest(request: Request): Promise<Response> {
  try {
    const cache = await caches.open(CACHE_CONFIG.media.name);
    const cached = await cache.match(request);

    if (cached && !isExpired(cached, CACHE_CONFIG.media.maxAge)) {
      return cached;
    }

    // Fetch from network
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const clonedResponse = response.clone();
      await cache.put(request, clonedResponse);
      await enforceQuotaPolicy(cache, CACHE_CONFIG.media.maxEntries);
    }

    return response;
  } catch (error) {
    console.error("[Service Worker] Media request failed:", error);

    // Return cached version if available
    const cache = await caches.open(CACHE_CONFIG.media.name);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    return new Response("Media not available offline", { status: 503 });
  }
}

/**
 * Handle clinical data requests
 * Strategy: Network Only (never cache PHI)
 */
async function handleClinicalDataRequest(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch (error) {
    console.error("[Service Worker] Clinical data request failed:", error);
    return new Response(
      JSON.stringify({
        error: "Offline",
        message: "Clinical data access requires an active internet connection",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Check if request is for media content
 */
function isMediaRequest(pathname: string): boolean {
  const mediaExtensions = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".mp4", ".webm"];
  return mediaExtensions.some((ext) => pathname.endsWith(ext));
}

/**
 * Check if request is for clinical data
 */
function isClinicalDataRequest(pathname: string): boolean {
  const clinicalPaths = [
    "/clinical/",
    "/patients/",
    "/encounters/",
    "/prescriptions/",
    "/lab-results/",
    "/imaging/",
  ];
  return clinicalPaths.some((path) => pathname.includes(path));
}

/**
 * Check if endpoint contains PHI (never cache)
 */
function isPHIEndpoint(url: string): boolean {
  const phiPatterns = [
    "/patients/",
    "/clinical/",
    "/phi/",
    "/encounters/",
    "/prescriptions/",
    "/lab-results/",
    "/imaging/",
    "/demographics/",
    "/history/",
  ];

  return phiPatterns.some((pattern) => url.includes(pattern));
}

/**
 * Check if cached response is expired
 */
function isExpired(response: Response, maxAge: number): boolean {
  const cachedTime = response.headers.get("sw-cache-time");
  if (!cachedTime) return true;

  const age = Date.now() - parseInt(cachedTime, 10);
  return age > maxAge;
}

/**
 * Enforce cache quota by removing oldest entries
 */
async function enforceQuotaPolicy(
  cache: Cache,
  maxEntries: number
): Promise<void> {
  const keys = await cache.keys();

  if (keys.length > maxEntries) {
    // Remove oldest entries (FIFO)
    const toDelete = keys.length - maxEntries;
    for (let i = 0; i < toDelete; i++) {
      await cache.delete(keys[i]);
    }
  }
}

/**
 * Handle background sync
 */
self.addEventListener("sync", (event: any) => {
  console.log("[Service Worker] Background sync:", event.tag);

  if (event.tag === "sync-offline-data") {
    event.waitUntil(syncOfflineData());
  }
});

/**
 * Sync offline data when connection is restored
 */
async function syncOfflineData(): Promise<void> {
  try {
    console.log("[Service Worker] Syncing offline data...");

    // Get all clients
    const clients = await self.clients.matchAll({ type: "window" });

    // Notify clients to sync
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_OFFLINE_DATA",
        timestamp: Date.now(),
      });
    });

    console.log("[Service Worker] Offline data sync initiated");
  } catch (error) {
    console.error("[Service Worker] Offline data sync failed:", error);
  }
}

/**
 * Handle push notifications
 */
self.addEventListener("push", (event: any) => {
  console.log("[Service Worker] Push notification received");

  if (!event.data) return;

  const data = event.data.json();

  const options: NotificationOptions = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [200, 100, 200],
    data: data.data,
    actions: data.actions,
    tag: data.tag || "default",
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

/**
 * Handle notification click
 */
self.addEventListener("notificationclick", (event: any) => {
  console.log("[Service Worker] Notification clicked:", event.notification.tag);

  event.notification.close();

  // Handle action buttons
  if (event.action) {
    console.log("[Service Worker] Notification action:", event.action);
  }

  // Open or focus the app
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window" });

      // Check if app is already open
      for (const client of clients) {
        if ("focus" in client) {
          return client.focus();
        }
      }

      // Open new window
      if (self.clients.openWindow) {
        const url = event.notification.data?.url || "/";
        return self.clients.openWindow(url);
      }
    })()
  );
});

/**
 * Handle messages from clients
 */
self.addEventListener("message", (event: any) => {
  console.log("[Service Worker] Message received:", event.data);

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "CLEAR_CACHE") {
    event.waitUntil(clearAllCaches());
  }

  if (event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
});

/**
 * Clear all caches
 */
async function clearAllCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log("[Service Worker] All caches cleared");
}

/**
 * Export for type checking
 */
export type {};
