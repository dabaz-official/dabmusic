/*
 * DabMusic offline shell.
 *
 * Bump VERSION whenever the caching strategy changes so old caches are dropped
 * on activate. Audio is deliberately left alone: the browser issues Range
 * requests for seeking, and replaying those from a full cached response breaks
 * scrubbing on iOS Safari.
 */
const VERSION = 'v1';
const SHELL_CACHE = `dabmusic-shell-${VERSION}`;
const PAGE_CACHE = `dabmusic-pages-${VERSION}`;
const ASSET_CACHE = `dabmusic-assets-${VERSION}`;

const SHELL_URLS = [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
];

const IMMUTABLE_ASSET = /\/_next\/static\/|\.(?:woff2?|ttf|otf)$/;
const RUNTIME_ASSET = /\.(?:png|jpe?g|webp|avif|gif|svg|ico|css|js|lrc)$/;
const AUDIO = /\.(?:mp3|m4a|aac|ogg|wav)$/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);

      await Promise.all(
        SHELL_URLS.map(async (url) => {
          try {
            await cache.add(new Request(url, { cache: 'reload' }));
          } catch {
            // An unavailable icon must not fail the whole install.
          }
        }),
      );

      // Cache the app shell and the hashed chunks its HTML references, so the
      // very first offline reload has everything it needs.
      try {
        const response = await fetch('/', { cache: 'reload' });
        if (response.ok) {
          const html = await response.clone().text();
          await cache.put('/', response);
          const chunks = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"?#]+)"/g)].map(
            (match) => match[1],
          );
          await Promise.all(
            [...new Set(chunks)].map(async (url) => {
              try {
                await cache.add(url);
              } catch {
                // Skip chunks that disappeared between HTML and install.
              }
            }),
          );
        }
      } catch {
        // Offline install: the next online navigation fills the shell.
      }

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, PAGE_CACHE, ASSET_CACHE]);
      const names = await caches.keys();
      await Promise.all(names.filter((name) => !keep.has(name)).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error('offline and not cached');
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refreshed = fetch(request)
    .then(async (response) => {
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached ?? (await refreshed) ?? Response.error();
}

async function handleNavigation(event) {
  try {
    const response = await fetch(event.request);
    if (response.ok) {
      const cache = await caches.open(PAGE_CACHE);
      await cache.put(event.request, response.clone());
    }
    return response;
  } catch {
    const pageCache = await caches.open(PAGE_CACHE);
    const shellCache = await caches.open(SHELL_CACHE);
    return (
      (await pageCache.match(event.request)) ??
      (await shellCache.match('/')) ??
      (await pageCache.match('/')) ??
      Response.error()
    );
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/sw.js') return;

  // Audio: network only (see the note at the top of this file).
  if (AUDIO.test(url.pathname) || request.headers.has('range')) return;

  // Router prefetches are cheap to drop and expensive to get wrong.
  if (request.headers.get('Next-Router-Prefetch') === '1') return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event));
    return;
  }

  // React Server Component payloads power client-side navigation.
  if (url.searchParams.has('_rsc')) {
    event.respondWith(
      networkFirst(request, PAGE_CACHE).catch(() => Response.error()),
    );
    return;
  }

  if (IMMUTABLE_ASSET.test(url.pathname)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // Covers are served through the Next image optimizer.
  if (url.pathname === '/_next/image') {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
    return;
  }

  if (RUNTIME_ASSET.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
  }
});
