/* Lana Rosa — servicio mínimo para poder instalar la web como app.
   Solo atiende la navegación entre páginas: si no hay internet, muestra /offline.html.
   Todo lo demás (productos, pagos, cuenta, imágenes) va directo a la red, sin guardar copias. */
const VERSION = 'lr-app-v1';
const OFFLINE = '/offline.html';

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll([OFFLINE, '/img/mini/rosina-saludo.webp']); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.mode !== 'navigate') return;   // solo páginas; lo demás no se toca
  e.respondWith(fetch(e.request).catch(function () { return caches.match(OFFLINE); }));
});
