const CACHE = 'techpulse-v1';
const ASSETS = [
  '/', '/index.html', '/article.html', '/admin.html',
  '/css/style.css', '/js/main.js', '/js/article.js', '/js/admin.js',
  '/favicon.ico'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(r => {
      if (r && r.status === 200 && r.type === 'basic') {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return r;
    }).catch(() => caches.match('/index.html')))
  );
});