// Piano Cottage v19 offline shell. AI assets require first-time network access.
const CACHE='piano-cottage-v19';
const ASSETS=['./assets/peeking-kitten-v18.webp','./assets/sleeping-garden-v18.webp','./dashboards-v18.css?v=19','./assets/weekly-garden-v18.webp','./assets/botanical-paper-v18.webp','./','./index.html','./app.js?v=19','./v7.js?v=19','./v7.css?v=19','./cottage.css?v=19','./mobile.css?v=19','./storybook-details.css?v=19','./cottage-v15.css?v=19','./i18n.js?v=19','./assets/keyboard-kitten-v15.png','./assets/avatars-watercolor-v15.png','./assets/fonts/cottage-playful.woff2','./assets/fonts/cottage-text.woff2','./assets/fonts/cottage-hand.woff2','./cottage.js?v=19','./assets/cottage-watercolor.png','./assets/garden-watercolor.png','./assets/cat-companions.png','./assets/timer-parchment-v14.png','./assets/girl-avatar-v14.png','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('piano-cottage-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 event.respondWith(fetch(event.request).then(response=>{
  if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
  return response;
 }).catch(()=>caches.match(event.request).then(cached=>cached||Response.error())));
});
