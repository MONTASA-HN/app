// MONTASA Handling Co. — Service Worker
// Estrategia: Network First — siempre descarga la versión más nueva de GitHub
// Si no hay red, usa caché como fallback

const CACHE_NAME = 'montasa-v1';

const ASSETS_TO_CACHE = [
  '/app/',
  '/app/index.html',
  '/app/MONTASA_Tecnicos.html',
  '/app/MONTASA_Logistica.html',
  '/app/MONTASA_Comercial.html',
  '/app/manifest.json',
  '/app/manifest_tecnicos.json',
  '/app/manifest_logistica.json',
  '/app/manifest_comercial.json',
];

// Instalación — pre-cachear assets principales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Si falla alguno no bloqueamos la instalación
      });
    })
  );
  self.skipWaiting();
});

// Activación — limpiar cachés viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — Network First
self.addEventListener('fetch', event => {
  // Solo interceptar GET del mismo origen
  if (event.request.method !== 'GET') return;

  // No interceptar Firebase ni APIs externas
  const url = new URL(event.request.url);
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, actualizamos la caché
        if (response && response.status === 200 && response.type !== 'opaque') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Sin red — usar caché
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback genérico para navegación
          if (event.request.mode === 'navigate') {
            return caches.match('/app/');
          }
        });
      })
  );
});
