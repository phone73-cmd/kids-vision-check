const CACHE='eye-garden-v1.0.1';
const FILES=['./','./index.html','./styles.css','./app.js','./vision.js','./icon.svg','./apple-touch-icon.png','./manifest.webmanifest','./assets/flowers/daisy.webp','./assets/flowers/tulip.webp','./assets/flowers/cosmos.webp','./assets/scene/sun.webp','./assets/scene/cloud.webp','./assets/scene/butterfly-flying.webp','./assets/friend-v1.0.1.webp','./assets/fonts/eye-garden-subset.woff'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('message',e=>{if(e.data==='ACTIVATE')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('eye-garden-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)));});
