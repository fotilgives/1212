// The installable admin panel has its own worker and the narrow /admin scope.
// It intentionally does not cache responses, so deployments never become stale.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // Network passthrough.
});
