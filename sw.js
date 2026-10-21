const VERSION='1.5.0';
const CACHE='eye-garden-v'+VERSION;
const FILES=['./','./index.html','./styles.css','./app.js','./vision.js','./optotypes.js','./number-glyphs.js','./navigation.js','./progress.js','./scene.js','./offline.js','./records.js','./icon.svg','./apple-touch-icon.png','./manifest.webmanifest','./assets/status/network-base.webp','./assets/status/network-slash.webp','./assets/status/device-base.webp','./assets/status/badge-ready.webp','./assets/status/badge-unavailable.webp','./assets/status/offline-guide.webp','./assets/flowers/daisy.webp','./assets/flowers/tulip.webp','./assets/flowers/cosmos.webp','./assets/scene/grasshopper.webp','./assets/scene/sun.webp','./assets/scene/moon.webp','./assets/scene/cloud.webp','./assets/scene/butterfly-flying.webp','./assets/friend-v1.0.1.webp','./assets/fonts/eye-garden-subset.woff'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
async function status(){const cache=await caches.open(CACHE);const found=await Promise.all(FILES.map(file=>cache.match(file)));return {type:'EYE_STATUS',version:VERSION,complete:found.every(Boolean),missing:FILES.filter((file,i)=>!found[i])};}
self.addEventListener('message',e=>{
 const type=typeof e.data==='string'?e.data:e.data?.type;
 if(!['ACTIVATE','EYE_STATUS','EYE_REPAIR'].includes(type))return;
 e.waitUntil((async()=>{
  let result;
  try{if(type==='EYE_REPAIR'){const cache=await caches.open(CACHE);await cache.addAll(FILES);}result=await status();}
  catch{result={type:'EYE_STATUS',version:VERSION,complete:false,error:'오프라인 파일을 준비하지 못했어요.'};}
  if(type==='ACTIVATE'&&result.complete)await self.skipWaiting();
  const port=e.ports?.[0];if(port)port.postMessage(result);else e.source?.postMessage(result);
 })());
});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('eye-garden-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(caches.open(CACHE).then(cache=>cache.match(e.request)).then(hit=>hit||fetch(e.request)));});
