// Service Worker KILL-SWITCH — se autodestruye y libera todos los clientes
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({type:'window'}))
      .then(clients => clients.forEach(c => c.navigate(c.url)))
      .catch(() => {})
  );
});
// Sin handler de fetch: todas las peticiones van directo a la red
