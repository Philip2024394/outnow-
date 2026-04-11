// ── Hangger Service Worker ────────────────────────────────────────────────────
// Strategy: network-first for navigation (HTML), cache-first for static assets.
// This prevents the "blank on refresh" issue caused by stale cached HTML.

const CACHE_VERSION = 'hangger-v3'
const STATIC_CACHE  = `${CACHE_VERSION}-static`
const IMAGE_CACHE   = `${CACHE_VERSION}-images`

// Only cache the shell HTML — NOT dev paths like /src/main.jsx
const PRECACHE = ['/']

// ── Install: pre-cache shell only ────────────────────────────────────────────
self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      // Use 'reload' to bypass browser cache — ensures fresh HTML at deploy
      cache.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' })))
    ).catch(() => { /* non-fatal — app still works */ })
  )
})

// ── Activate: delete ALL old caches ──────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => !k.startsWith(CACHE_VERSION))
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// ── Fetch: network-first for HTML, cache-first for assets ────────────────────
self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // ── Navigation requests (HTML pages) — always network-first ──
  // This is the key fix: never serve stale HTML from cache.
  // Firebase hosting rewrites all paths to /index.html so this always works.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(response => {
          // Cache a fresh copy of the shell
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then(cache => cache.put('/', clone))
          }
          return response
        })
        .catch(() =>
          // Offline fallback — serve cached shell
          caches.match('/').then(cached => cached ?? Response.error())
        )
    )
    return
  }

  // ── Vite-built assets (/assets/*) — cache-first (they're content-hashed) ──
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) {
            // Clone immediately — before the body is consumed by return
            const toCache = response.clone()
            caches.open(STATIC_CACHE).then(cache => cache.put(request, toCache))
          }
          return response
        })
      })
    )
    return
  }

  // ── Images in /images/ or /public/ — cache-first ──
  if (url.pathname.startsWith('/images/') || request.destination === 'image') {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) {
            // Clone immediately — before the body is consumed by return
            const toCache = response.clone()
            caches.open(IMAGE_CACHE).then(cache => cache.put(request, toCache))
          }
          return response
        }).catch(() => Response.error())
      })
    )
    return
  }

  // Everything else — network only (Supabase, Stripe, Mapbox API calls)
})

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {}
  const title = data.title ?? 'Hangger'
  const isRide = (data.tag ?? '').startsWith('booking-')
  const options = {
    body: data.body ?? "Someone you liked is out now — go meet them!",
    icon: 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png',
    badge: 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png',
    tag: data.tag ?? 'hangger-general',
    renotify: true,
    // Ride requests use a more urgent vibration pattern
    vibrate: isRide ? [300, 100, 300, 100, 300] : [200, 100, 200],
    silent: false,          // ensure system plays default notification sound
    requireInteraction: isRide,  // ride alerts stay on screen until dismissed
    data: { url: data.url ?? '/' },
    actions: data.actions ?? [],
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url ?? '/'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin))
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})

// ── Background sync — weekly digest ──────────────────────────────────────────
self.addEventListener('sync', (e) => {
  if (e.tag === 'weekly-digest') e.waitUntil(sendDigestNotification())
})

async function sendDigestNotification() {
  const now = new Date()
  if (now.getDay() !== 5 || now.getHours() < 18) return
  await self.registration.showNotification('Your weekend starts tonight 🟢', {
    body: "People you liked this week — check who's going out tonight.",
    icon: 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png',
    tag: 'weekly-digest',
    vibrate: [300, 100, 300],
    data: { url: '/?tab=match' },
  })
}
