const CACHE_NAME = 'movie-mash-v2';
const APP_SHELL = ['./', './index.html', './favicon.svg', './icons.svg', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    }),
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CACHE_URLS') {
    return;
  }

  const urls = event.data.urls.filter((url) => typeof url === 'string');
  const replyPort = event.ports[0];

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return Promise.all(
          urls.map((url) => {
            return fetch(url)
              .then((response) => {
                if (response.ok) {
                  return cache.put(url, response);
                }

                return undefined;
              })
              .catch(() => undefined);
          }),
        );
      })
      .finally(() => {
        replyPort?.postMessage({ type: 'CACHE_URLS_DONE' });
      }),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(new URL('./index.html', self.location.href).href, copy));
          return response;
        })
        .catch(() => caches.match(new URL('./index.html', self.location.href).href).then((cached) => cached ?? caches.match('./index.html'))),
    );
    return;
  }

  event.respondWith(
    caches.match(request.url).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request.url, copy));
        }

        return response;
      });
    }),
  );
});
