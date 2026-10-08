/* ==========================================================================
   TechPulse — Service Worker v20261005
   Network-first with multi-tier caching for offline support.
   ========================================================================== */
var CACHE_VERSION = 'techpulse-v3.0.0';
var STATIC_CACHE = CACHE_VERSION + '-static';
var DYNAMIC_CACHE = CACHE_VERSION + '-dynamic';
var TOOLS_CACHE = CACHE_VERSION + '-tools';

var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/article.html',
  '/academy.html',
  '/tools.html',
  '/best-picks.html',
  '/guides.html',
  '/qa.html',
  '/forum.html',
  '/news.html',
  '/about.html',
  '/contact.html',
  '/offline.html',
  '/css/style.css',
  '/js/common.js',
  '/js/i18n.js',
  '/js/main.js',
  '/js/article.js',
  '/js/live-news.js',
  '/manifest.json'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      return cache.addAll(STATIC_ASSETS.map(function (url) {
        return new Request(url, { credentials: 'same-origin' });
      })).catch(function (err) {
        console.warn('[SW] Some static assets failed to cache:', err);
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k.indexOf(CACHE_VERSION) === -1;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url = new URL(request.url);

  /* Skip non-http(s) schemes */
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  /* Skip Chrome extensions */
  if (url.protocol === 'chrome-extension:') return;

  /* Skip Supabase API — always network */
  if (url.hostname.indexOf('supabase.co') !== -1) return;

  /* Skip Disqus */
  if (url.hostname.indexOf('disqus.com') !== -1) return;

  /* Skip Buttondown */
  if (url.hostname.indexOf('buttondown.email') !== -1) return;

  /* Skip Hacker News API — needs fresh data */
  if (url.hostname.indexOf('hacker-news.firebaseio.com') !== -1) return;

  /* Skip Groq */
  if (url.hostname.indexOf('groq.com') !== -1) return;

  /* External URLs: network with dynamic cache fallback */
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(request).then(function (response) {
        if (response && response.status === 200) {
          var copy = response.clone();
          caches.open(DYNAMIC_CACHE).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return response;
      }).catch(function () {
        return caches.match(request);
      })
    );
    return;
  }

  /* HTML pages: network-first (fresh content) */
  if (request.headers.get('accept') && request.headers.get('accept').indexOf('text/html') !== -1) {
    event.respondWith(
      fetch(request).then(function (response) {
        if (response && response.status === 200) {
          var copy = response.clone();
          caches.open(DYNAMIC_CACHE).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return response;
      }).catch(function () {
        return caches.match(request).then(function (cached) {
          if (cached) return cached;
          return caches.match('/offline.html');
        });
      })
    );
    return;
  }

  /* Tools (calculators): cache-first */
  if (url.pathname.indexOf('/tools/') === 0) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        return cached || fetch(request).then(function (response) {
          if (response && response.status === 200) {
            var copy = response.clone();
            caches.open(TOOLS_CACHE).then(function (cache) {
              cache.put(request, copy);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  /* CSS, JS, fonts, images: cache-first with background update */
  event.respondWith(
    caches.match(request).then(function (cached) {
      var fetchPromise = fetch(request).then(function (response) {
        if (response && response.status === 200) {
          var copy = response.clone();
          caches.open(STATIC_CACHE).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return response;
      }).catch(function () {
        return cached;
      });
      return cached || fetchPromise;
    })
  );
});

/* Background sync (for offline likes/comments) */
self.addEventListener('sync', function (event) {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

async function syncPendingActions() {
  try {
    var db = await openIDB();
    var tx = db.transaction('pending', 'readwrite');
    var store = tx.objectStore('pending');
    var all = await store.getAll();
    for (var i = 0; i < all.length; i++) {
      var item = all[i];
      try {
        await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body
        });
        await store.delete(item.id);
      } catch (e) {
        console.warn('[SW] sync failed for item', item.id, e);
      }
    }
  } catch (e) {
    console.warn('[SW] sync error', e);
  }
}

function openIDB() {
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open('techpulse-sw', 1);
    req.onupgradeneeded = function () {
      var db = req.result;
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = function () { resolve(req.result); };
    req.onerror = function () { reject(req.error); };
  });
}

/* Push notifications (for future newsletter features) */
self.addEventListener('push', function (event) {
  if (!event.data) return;
  var data = event.data.json();
  var options = {
    body: data.body || 'New article published on TechPulse',
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
    data: { url: data.url || '/' }
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'TechPulse', options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if (clientList[i].url === targetUrl && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});