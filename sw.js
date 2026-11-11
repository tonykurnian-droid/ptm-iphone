const CACHE = "ptm-ios-final-v2.1.3";
const CORE = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "report-pdf.js",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon-180.png"
];
self.addEventListener("install", event => {
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    for(const path of CORE){
      try{const res=await fetch(new Request(path,{cache:"reload"}));if(res&&res.ok)await cache.put(path,res.clone())}catch(_){ }
    }
    await self.skipWaiting();
  })());
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch",event=>{
  const req=event.request;if(req.method!=="GET")return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  if(req.mode==="navigate"){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{const res=await fetch(req);if(res&&res.ok){await cache.put("index.html",res.clone());await cache.put("./",res.clone())}return res}catch(_){return (await cache.match("index.html"))||(await cache.match("./"))}
    })());return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(req,{ignoreSearch:true})||await cache.match(url.pathname.split('/').pop(),{ignoreSearch:true});
    if(cached)return cached;
    try{const res=await fetch(req);if(res&&res.ok)await cache.put(req,res.clone());return res}catch(_){return Response.error()}
  })());
});
