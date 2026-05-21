// Bel Viaggio Service Worker v0.4 — Android-first
// Cache-first for static, network-first for APIs, share_target handler, push support

const CACHE_NAME = 'bv-v0.4';
const RUNTIME_CACHE = 'bv-runtime-v0.4';
const IMAGE_CACHE = 'bv-images-v0.4';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
];

const NETWORK_FIRST_HOSTS = [
  'api.anthropic.com',
  'api.frankfurter.app',
];

const IMAGE_HOSTS = [
  'upload.wikimedia.org',
  'commons.wikimedia.org',
];

// ─── Install ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[SW] Precache failed:', err))
  );
});

// ─── Activate: clean old caches ────────────────────────────
self.addEventListener('activate', (event) => {
  const validCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !validCaches.includes(k)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch routing ─────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' && event.request.method !== 'POST') return;
  const url = new URL(event.request.url);

  // Web Share Target handler (POST from Android share menu)
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(handleShareTarget(event.request));
    return;
  }

  if (event.request.method !== 'GET') return;

  // Wikipedia images: cache aggressively, network fallback
  if (IMAGE_HOSTS.some((h) => url.hostname.includes(h))) {
    event.respondWith(imageCache(event.request));
    return;
  }

  // External API: network-first, cache fallback
  if (NETWORK_FIRST_HOSTS.includes(url.hostname)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Same-origin static: cache-first with background revalidation
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(event.request));
  }
});

// ─── Cache strategies ──────────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Stale-while-revalidate
    fetch(request).then((resp) => {
      if (resp.ok) caches.open(CACHE_NAME).then((c) => c.put(request, resp.clone()));
    }).catch(() => {});
    return cached;
  }
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    if (request.mode === 'navigate') {
      return caches.match('/') || caches.match('/index.html');
    }
    throw err;
  }
}

async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function imageCache(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    throw err;
  }
}

// ─── Web Share Target handler ──────────────────────────────
// When user shares an image from another app (gallery, camera, browser),
// we receive it as multipart/form-data and redirect to the app with the image
// stored in a temporary IndexedDB-backed slot via postMessage to all clients.
async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('shared_image');
    const title = formData.get('title') || '';
    const text = formData.get('text') || '';

    if (file && file.size > 0) {
      // Stash file in cache temporarily under a special key
      const cache = await caches.open(RUNTIME_CACHE);
      const blob = file.slice(0, file.size, file.type);
      const response = new Response(blob, {
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      await cache.put('/shared-image-pending', response);
    }

    // Redirect to home with a query flag, app will pick up the pending image
    return Response.redirect('/?shared=1', 303);
  } catch (err) {
    return Response.redirect('/?shared=error', 303);
  }
}

// ─── Notification handlers ─────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = data.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICK', data });
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(target);
      })
  );
});

// ─── Push event (for server-sent notifications, optional) ──
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = { title: 'Bel Viaggio', body: '' };
  try { payload = event.data.json(); } catch { payload.body = event.data.text(); }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-monochrome.png',
      tag: payload.tag || 'bv-push',
      vibrate: [100, 50, 100],
      data: payload.data || {},
      actions: payload.actions || [],
    })
  );
});

// ─── App ↔ SW messaging ────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
  if (event.data?.type === 'GET_SHARED_IMAGE') {
    caches.open(RUNTIME_CACHE).then((cache) =>
      cache.match('/shared-image-pending').then((resp) => {
        if (resp) {
          resp.blob().then((blob) => {
            event.source?.postMessage({ type: 'SHARED_IMAGE', blob });
            cache.delete('/shared-image-pending');
          });
        }
      })
    );
  }
});
