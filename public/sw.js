// Cache SW for category/product APIs
const CACHE_NAME = 'daruri-api-cache-v1';
const CACHE_TTL_MS = 10 * 60 * 1000;
const API_PATTERNS = [
  /https:\/\/darurialese\.ro\/wp-json\/sarbu\/api-landing\//,
  /https:\/\/darurialese\.ro\/wp-json\/sarbu\/api-subcategories\//,
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const isApiRequest = (url) => API_PATTERNS.some((pattern) => pattern.test(url));

const isFresh = (response) => {
  const cachedAt = response.headers.get('x-sw-cached-at');
  if (!cachedAt) return false;
  return Date.now() - Number(cachedAt) < CACHE_TTL_MS;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = request.url;
  if (!isApiRequest(url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached && isFresh(cached)) {
        return cached;
      }

      try {
        const networkResponse = await fetch(request);
        const responseToCache = networkResponse.clone();
        const headers = new Headers(responseToCache.headers);
        headers.set('x-sw-cached-at', Date.now().toString());
        const cachedResponse = new Response(await responseToCache.clone().blob(), {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers,
        });
        cache.put(request, cachedResponse);
        return networkResponse;
      } catch (error) {
        if (cached) return cached;
        throw error;
      }
    })
  );
});
