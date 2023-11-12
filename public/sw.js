const assets = [
  "/",
  "style.css",
  "app.js",
  "register-sw.js",
  "https://fonts.googleapis.com/css2?family=Spline+Sans:wght@300;400;500;600;700&display=swap",
  "assets/logo.png",
  "assets/favicon.ico",
  "assets/logos/ATL.png",
  "assets/logos/BKN.png",
  "assets/logos/BOS.png",
  "assets/logos/CHA.png",
  "assets/logos/CHI.png",
  "assets/logos/CLE.png",
  "assets/logos/DAL.png",
  "assets/logos/DEN.png",
  "assets/logos/DET.png",
  "assets/logos/GSW.png",
  "assets/logos/HOU.png",
  "assets/logos/IND.png",
  "assets/logos/LAC.png",
  "assets/logos/LAL.png",
  "assets/logos/MEM.png",
  "assets/logos/MIA.png",
  "assets/logos/MIL.png",
  "assets/logos/MIN.png",
  "assets/logos/NOP.png",
  "assets/logos/NYK.png",
  "assets/logos/OKC.png",
  "assets/logos/ORL.png",
  "assets/logos/PHI.png",
  "assets/logos/PHX.png",
  "assets/logos/POR.png",
  "assets/logos/SAC.png",
  "assets/logos/SAS.png",
  "assets/logos/TOR.png",
  "assets/logos/UTA.png",
  "assets/logos/WAS.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("assets").then((cache) => {
      cache.addAll(assets);
    })
  );
});

// State while revalidate strategy
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Even if the response is in the cache, we fetch it
      // and update the cache for future usage
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open("assets").then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
      // We use the currently cached version if it's there
      return cachedResponse || fetchPromise; // cached or a network fetch
    })
  );
});

self.addEventListener("push", (event) => {
  const payload = event.data?.text() ?? "no payload";
  event.waitUntil(
    self.registration.showNotification("NBA Notifications", {
      body: payload,
    })
  );
});
