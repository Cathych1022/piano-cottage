// Piano Cottage v13 offline shell. AI assets require first-time network access.
const CACHE='piano-cottage-v13';
const ASSETS=['./','./index.html','./app.js?v=13','./v7.js?v=13','./v7.css?v=13','./cottage.css?v=13','./mobile.css?v=13','./cottage.js?v=13','./assets/cottage-watercolor.png','./assets/garden-watercolor.png','./assets/cat-companions.png','./manifest.webmanifest','./icon.svg'];
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
