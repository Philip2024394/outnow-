import { useState, useEffect } from 'react'

export function usePushNotifications() {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  )

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) return 'denied'
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }

  // Show a local notification immediately (for demo / in-app triggers)
  const notify = (title, options = {}) => {
    if (permission !== 'granted') return
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        icon: 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png',
        badge: 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png',
        vibrate: [200, 100, 200],
        ...options,
      })
    }).catch(() => {
      // Fallback to basic Notification API
      new Notification(title, options)
    })
  }

  // Schedule Friday 6pm digest via background sync
  const scheduleFridayDigest = () => {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return
    navigator.serviceWorker.ready.then(reg => {
      reg.sync.register('weekly-digest').catch(() => {})
    })
  }

  return { permission, requestPermission, notify, scheduleFridayDigest }
}
