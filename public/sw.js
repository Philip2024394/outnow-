const CACHE = 'imoutnow-v1'
const SHELL = ['/', '/src/main.jsx']

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Push notification handler
self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {}
  const title = data.title ?? 'IMOUTNOW'
  const options = {
    body: data.body ?? "Someone you liked is out now — go meet them!",
    icon: 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png',
    badge: 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png',
    tag: data.tag ?? 'imoutnow-general',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url ?? '/' },
    actions: data.actions ?? [],
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

// Notification click — open or focus the app
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

// Background sync — weekly digest reminder check
self.addEventListener('sync', (e) => {
  if (e.tag === 'weekly-digest') {
    e.waitUntil(sendDigestNotification())
  }
})

async function sendDigestNotification() {
  const now = new Date()
  const isFriday = now.getDay() === 5
  const hour = now.getHours()
  if (!isFriday || hour < 18) return
  await self.registration.showNotification('Your weekend starts tonight 🟢', {
    body: "People you liked this week — check who's going out tonight.",
    icon: 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png',
    tag: 'weekly-digest',
    vibrate: [300, 100, 300],
    data: { url: '/?tab=match' },
  })
}
