// Меняйте VERSION при обновлении приложения. Данные лежат в IndexedDB и не затрагиваются.
const VERSION = 'v1';
const CACHE = 'tracker-' + VERSION;
const SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('tracker-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Кеш сначала, в фоне обновляем (stale-while-revalidate); офлайн — отдаём index.html
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return hit || net;
    })
  );
});
