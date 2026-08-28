/** TRENCH PWA service worker — same install pattern as JellyNest / Pop Vault. */
const CACHE_NAME = "trench-static-v5";
const ASSET_V = "5";

const CORE_ASSETS = [
  "./",
  "index.html",
  `manifest.webmanifest?v=${ASSET_V}`,
  "icon.svg",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
];

function networkFirst(request, fallbackUrl) {
  return fetch(request, { cache: "no-cache" })
    .then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })
    .catch(() =>
      caches.match(request).then((cached) => cached || (fallbackUrl ? caches.match(fallbackUrl) : undefined)),
    );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;

  const path = url.pathname;
  const isHtmlNav =
    event.request.mode === "navigate" || path.endsWith("/") || path.endsWith("/index.html") || path.endsWith("/FitCoach");

  if (isHtmlNav) {
    event.respondWith(networkFirst(event.request, "index.html"));
    return;
  }

  if (path.endsWith("/service-worker.js")) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(networkFirst(event.request));
});
