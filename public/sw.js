/* TradeX service worker: makes the app load offline once it has been opened online.
 * Bump CACHE_VERSION to force clients to drop old caches. */
const CACHE_VERSION = 'tradex-v1'
const SCOPE = self.registration.scope
const SHELL = ['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'favicon.svg']

/** The hashed JS/CSS the page needs, read from index.html. On first visit the page has already
 * fetched them before this worker exists, so they must be cached explicitly or the first
 * offline launch would be a blank page. */
async function precache() {
  const cache = await caches.open(CACHE_VERSION)
  await cache.addAll(SHELL.map((p) => new URL(p, SCOPE).href))
  const html = await (await fetch(new URL('./', SCOPE).href, { cache: 'reload' })).text()
  const assets = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map(
    (m) => new URL(m[1], SCOPE).href,
  )
  await cache.addAll(assets)
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(new URL('./', SCOPE).href, response.clone())
    return response
  } catch {
    // Offline: serve the cached app shell for any navigation.
    return (await cache.match(new URL('./', SCOPE).href)) || Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION)
  const hit = await cache.match(request)
  if (hit) return hit
  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone())
  return response
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION)
  const hit = await cache.match(request)
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => undefined)
  return hit || (await refresh) || Response.error()
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
  } else if (url.pathname.includes('/assets/')) {
    // Vite fingerprints these filenames, so a cached copy never goes stale.
    event.respondWith(cacheFirst(request))
  } else {
    event.respondWith(staleWhileRevalidate(request))
  }
})
