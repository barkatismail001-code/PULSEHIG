/* TechPulse Service Worker — network-first (always fresh, offline fallback) */
const CACHE_NAME = 'techpulse-v2.0.0';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return; // Supabase, CDN, Disqus... go straight to network

  event.respondWith(
    fetch(request).then(response => {
      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, copy));
      }
      return response;
    }).catch(() => caches.match(request).then(r => r || caches.match('/index.html')))
  );
});
