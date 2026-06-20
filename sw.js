/*
 * File Path: sw.js
 * File Version: SPRAD v2.8-production | profile-menu.1
 * Update Info: 2026-06-21 - Bump cache untuk menu profil topbar dan asset helper baharu.
 */
const CACHE_NAME = "sprad-v2.8-profile-menu.1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./login.html",
  "./dashboard.html",
  "./form.html",
  "./ai-intake.html",
  "./findings.html",
  "./corrective-actions.html",
  "./reports.html",
  "./users.html",
  "./settings.html",
  "./brand.css",
  "./assets/js/config.js",
  "./assets/js/core/spa-navigation.js",
  "./assets/js/components/app-shell.js",
  "./assets/js/components/profile-menu.js",
  "./assets/js/pages/dashboard-page.js",
  "./assets/js/pages/form-page.js",
  "./assets/js/pages/audit-workspace-page.js",
  "./assets/js/pages/reports-page.js",
  "./assets/js/pages/ai-intake-page.js",
  "./assets/js/pages/data-master-page.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  const network = fetch(request)
    .then(response => {
      if (response && response.ok) {
        caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached);

  return cached || network;
}
