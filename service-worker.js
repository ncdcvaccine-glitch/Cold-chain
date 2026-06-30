const CACHE_NAME = "coldchain-inventory-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./supervisor.html",
  "./admin.html",
  "./styles.css",
  "./data.js",
  "./firebase-config.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// استراتيجية: شبكة أولاً للبيانات الحيّة (Firebase)، وذاكرة تخزين مؤقت لباقي الملفات
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // لا تتدخل في طلبات Firebase / Google APIs — يجب أن تذهب دائماً للشبكة
  if (url.hostname.includes("googleapis.com") || url.hostname.includes("firebaseio.com") || url.hostname.includes("gstatic.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && event.request.method === "GET") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
