/* Heartbeat Ministries — Service Worker */
const VERSION = 'hb-v3';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

// App shell — precached on install.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/blog.html',
  '/games.html',
  '/give.html',
  '/prayer.html',
  '/manifest.webmanifest',
  '/images/icons/icon-192.png',
  '/images/icons/icon-512.png',
  '/images/icons/icon-512-maskable.png',
  '/og-image.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Only handle same-origin requests; let everything else (gtag, Supabase, etc.) pass through.
  if (url.origin !== self.location.origin) return;

  // Never intercept the admin panel or Netlify Identity / Git Gateway endpoints.
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/.netlify')) return;

  // CMS content: network-first so new posts/scripture show, fall back to cache offline.
  if (url.pathname.endsWith('/cms-data.json')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Page navigations: network-first, fall back to cached page, then offline shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets (images, css, js, fonts): cache-first.
  event.respondWith(cacheFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const cache = await caches.open(RUNTIME_CACHE);
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}
