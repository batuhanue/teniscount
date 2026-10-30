// Build replaces these markers with the version and exact emitted filenames.
const CACHE = 'courtly-__CACHE_VERSION__';
const ASSETS = __PRECACHE_ASSETS__;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('courtly-') && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
    }
    return response;
  }).catch(async () => {
    // Immutable, same-origin build assets have identical contents regardless of
    // the Origin header added by module requests (Vite serves Vary: Origin).
    const isBuildAsset = ASSETS.includes(new URL(event.request.url).pathname);
    const cached = await caches.match(event.request, {ignoreVary:isBuildAsset});
    return cached || (event.request.mode === 'navigate' ? await caches.match('/', {ignoreVary:true}) : null) || Response.error();
  }));
});
