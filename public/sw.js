// Tombstone for the legacy root-scoped worker. Older builds accidentally
// registered /sw.js for the whole site. As soon as Android checks for an update,
// this version deletes its caches and unregisters itself.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    await self.registration.unregister();
  })());
});
