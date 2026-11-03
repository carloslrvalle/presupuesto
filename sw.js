/* Presupuesto: funciona sin conexión.
   Con internet siempre pide la versión más reciente (así las actualizaciones llegan solas);
   sin internet usa la última copia guardada. La sincronización con Google Sheets no pasa por aquí. */
const CACHE_PREFIX = 'presupuesto:' + new URL(self.registration.scope).pathname + ':';
const CACHE = CACHE_PREFIX + '1.10.34';
const CORE = ["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./app.css","./sync-core.js","./app/bootstrap.js","./vendor/chart.umd.js","./app/finance.js","./app/storage.js","./app/utils.js","./app/dates.js","./app/state.js","./app/domain.js","./app/ui.js","./app/dashboard.js","./app/movements.js","./app/budget.js","./app/recurring.js","./app/goals.js","./app/analysis.js","./app/appearance.js","./app/data.js","./app/sync.js","./app/profiles.js","./app/settings.js","./app/main.js","./fonts.css","./fonts/dmsans-400.woff2","./fonts/ibmplexmono-400.woff2","./fonts/ibmplexmono-500.woff2","./fonts/ibmplexmono-600.woff2","./fonts/ibmplexmono-700.woff2","./fonts/ibmplexsans-400.woff2","./fonts/inter-400.woff2","./fonts/manrope-400.woff2","./fonts/nunito-400.woff2","./fonts/roboto-400.woff2","./fonts/sourceserif4-400.woff2","./fonts/spacegrotesk-400.woff2","./fonts/geist-font/Geist/webfonts/Geist%5Bwght%5D.woff2","./fonts/geist-font/Geist/webfonts/Geist-Italic%5Bwght%5D.woff2","./fonts/geist-font/GeistMono/webfonts/GeistMono%5Bwght%5D.woff2","./fonts/geist-font/GeistMono/webfonts/GeistMono-Italic%5Bwght%5D.woff2","./fonts/geist-font/GeistSerif/webfonts/GeistSerif-Regular.woff2","./fonts/googlesans-variable.woff2","./fonts/publicsans-variable.woff2","./fonts/plusjakarta-400.woff2","./fonts/plusjakarta-500.woff2","./fonts/plusjakarta-600.woff2","./fonts/plusjakarta-700.woff2"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req, {cache: 'no-cache'})
      .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
      .catch(() => caches.open(CACHE).then(c => c.match(req).then(r => r || (req.mode === 'navigate' ? c.match('./index.html') : undefined))))
  );
});
