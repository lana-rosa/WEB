/* Lana Rosa — servicio mínimo para poder instalar la web como app.
   Solo atiende la navegación entre páginas: si no hay internet, muestra /offline.html.
   Todo lo demás (productos, pagos, cuenta, imágenes) va directo a la red, sin guardar copias.
   Única excepción (28-oct-2026): la Agenda para tejedoras es una app instalable que debe abrir sin internet (sus datos ya viven en el dispositivo).
   Su página y los archivos que ella carga (código, estilos, fuentes e imágenes) se guardan, primero se pide a la red y la copia solo se usa si no hay conexión,
   así las actualizaciones llegan de inmediato. Nunca se guardan datos de la base ni pagos (van a otros dominios). */
const VERSION = 'lr-app-v5';
const AGENDA = 'lr-agenda-v2';
const OFFLINE = '/offline.html';
const PAGINA_AGENDA = '/agenda-rosina.html';

function deLaAgenda(req, url) {
  if (url.origin !== self.location.origin) return false;
  if (req.mode === 'navigate') return url.pathname === PAGINA_AGENDA;
  if (/^\/(fonts|css)\//.test(url.pathname) || /^\/js\/(vendor\/|cuenta\.js|consentimiento\.js)/.test(url.pathname)) return true;
  try { return new URL(req.referrer).pathname === PAGINA_AGENDA; } catch (e) { return false; }
}

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll([OFFLINE, '/img/mini/rosina-saludo.webp']); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION && k !== AGENDA; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (deLaAgenda(req, url)) {
    e.respondWith(fetch(req).then(function (r) {
      if (r && r.status === 200 && r.type === 'basic') { var copia = r.clone(); caches.open(AGENDA).then(function (c) { c.put(req, copia); }); }
      return r;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(function (c) { return c || (req.mode === 'navigate' ? caches.match(OFFLINE) : Response.error()); });
    }));
    return;
  }
  if (req.mode !== 'navigate') return;   // solo páginas; lo demás no se toca
  e.respondWith(fetch(req).catch(function () { return caches.match(OFFLINE); }));
});
