/* TechPulse Service Worker — Offline-first caching */
const CACHE_NAME = 'techpulse-v1.0.0';
const RUNTIME_CACHE = 'techpulse-runtime';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/news.html',
  '/forum.html',
  '/about.html',
  '/contact.html',
  '/css/style.css',
  '/js/common.js',
  '/js/i18n.js',
  '/js/main.js',
  '/js/live-news.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.url.includes('supabase.co')) return;
  if (request.url.includes('disqus.com')) return;
  if (request.url.includes('google-analytics.com')) return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
