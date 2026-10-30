// Build replaces these markers with the version and exact emitted filenames.
const CACHE = 'courtly-__CACHE_VERSION__';
const ASSETS = __PRECACHE_ASSETS__;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const previous = keys.filter(key => key.startsWith('courtly-') && key !== CACHE);
    await self.clients.claim();
    // Older app versions have no controllerchange handler. Migrate those open
    // tabs too; their match is already persisted in localStorage on each point.
    if (previous.length) {
      const windows = await self.clients.matchAll({type:'window'});
      // Do not await navigation during activation: its fetch can wait for this
      // activation event itself to finish.
      windows.filter(client => client.url.startsWith(self.registration.scope))
        .forEach(client => {client.navigate(client.url).catch(() => {});});
    }
    await Promise.all(previous.map(key => caches.delete(key)));
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request, {cache:event.request.mode === 'navigate' ? 'no-store' : 'default'}).then(response => {
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
