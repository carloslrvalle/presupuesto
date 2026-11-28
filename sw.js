/* Presupuesto: funciona sin conexión.
   Con internet siempre pide la versión más reciente (así las actualizaciones llegan solas);
   sin internet usa la última copia guardada. La sincronización con Google Sheets no pasa por aquí. */
const CACHE_PREFIX = 'presupuesto:' + new URL(self.registration.scope).pathname + ':';
const CACHE = CACHE_PREFIX + '1.10.197';
const CORE = ["./","./index.html","./manifest.webmanifest","./favicon-16.png","./favicon-32.png","./logo.png","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./app.css","./sync-core.js","./app/bootstrap.js","./vendor/chart.umd.js","./app/finance.js","./app/storage.js","./app/utils.js","./app/dates.js","./app/state.js","./app/domain.js","./app/ui.js","./app/dashboard.js","./app/movements.js","./app/budget.js","./app/goals.js","./app/analysis.js","./app/appearance.js","./app/data.js","./app/sync.js","./app/profiles.js","./app/settings.js","./app/mobile.js","./app/desktop.js","./app/main.js","./fonts.css","./fonts/geist/geist-latin-variable.woff2","./fonts/geist/OFL.txt","./fonts/inter/inter-latin-variable.woff2","./fonts/inter/OFL.txt"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith((async()=>{
    const navigation=req.mode==='navigate';
    const network=await fetch(req,{cache:'no-cache'}).catch(()=>null);
    if(network?.ok){
      const copy=network.clone();
      e.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{}));
      return network;
    }
    if(network&&(!navigation||network.status<500))return network;
    const cache=await caches.open(CACHE);
    const cached=await cache.match(req,{ignoreSearch:navigation});
    return cached||(navigation&&await cache.match('./index.html'))||network||Response.error();
  })());
});
