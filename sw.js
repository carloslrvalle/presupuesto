/* Presupuesto: funciona sin conexión.
   Con internet siempre pide la versión más reciente (así las actualizaciones llegan solas);
   sin internet usa la última copia guardada. La sincronización con Google Sheets no pasa por aquí. */
const CACHE_PREFIX = 'presupuesto:' + new URL(self.registration.scope).pathname + ':';
const CACHE = CACHE_PREFIX + '1.10.107';
const CORE = ["./","./index.html","./manifest.webmanifest","./favicon-16.png","./favicon-32.png","./logo.png","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./app.css","./sync-core.js","./app/bootstrap.js","./vendor/chart.umd.js","./app/finance.js","./app/storage.js","./app/utils.js","./app/dates.js","./app/state.js","./app/domain.js","./app/ui.js","./app/dashboard.js","./app/movements.js","./app/budget.js","./app/goals.js","./app/analysis.js","./app/appearance.js","./app/data.js","./app/sync.js","./app/profiles.js","./app/settings.js","./app/main.js"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  const googleFont = (url.origin === 'https://fonts.googleapis.com' && req.destination === 'style') ||
    (url.origin === 'https://fonts.gstatic.com' && req.destination === 'font');
  if (req.method !== 'GET' || (url.origin !== self.location.origin && !googleFont)) return;
  e.respondWith(
    fetch(req, {cache: 'no-cache'})
      .then(res => { if (res.ok || (googleFont && res.type === 'opaque')) { const copy = res.clone(); e.waitUntil(caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {})); } return res; })
      // Sin conexión: copia guardada; las páginas ignoran parámetros (?v=…) y vuelven a index.html. Nunca responde undefined.
      .catch(() => caches.open(CACHE).then(c => c.match(req, {ignoreSearch: req.mode === 'navigate'}).then(r => r || (req.mode === 'navigate' ? c.match('./index.html') : undefined))).then(r => r || Response.error()))
  );
});
