/**
 * useNativePush — Capacitor native push notifications (FCM on Android, APNs on iOS).
 * Works when app is closed/backgrounded. Falls back gracefully to web push on browsers.
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

let PushNotifications = null

// Dynamic import — only loads on native platforms
async function loadCapacitorPush() {
  try {
    const mod = await import('@capacitor/push-notifications')
    PushNotifications = mod.PushNotifications
    return true
  } catch {
    return false // Running in browser, not Capacitor
  }
}

export function useNativePush(userId) {
  const [fcmToken, setFcmToken] = useState(null)
  const [nativeAvailable, setNativeAvailable] = useState(false)

  useEffect(() => {
    if (!userId) return
    let cleanup = () => {}

    ;(async () => {
      const available = await loadCapacitorPush()
      if (!available || !PushNotifications) return
      setNativeAvailable(true)

      // Request permission
      const permResult = await PushNotifications.requestPermissions()
      if (permResult.receive !== 'granted') return

      // Register with FCM/APNs
      await PushNotifications.register()

      // Listen for registration token
      const regListener = await PushNotifications.addListener('registration', async (token) => {
        setFcmToken(token.value)
        // Store FCM token in Supabase alongside web push subscription
        if (supabase) {
          await supabase.from('push_subscriptions').upsert({
            user_id: userId,
            endpoint: `fcm:${token.value}`,
            p256dh: 'fcm',
            auth: 'fcm',
            platform: 'native',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,endpoint' }).catch(() => {})
        }
      })

      // Listen for registration errors
      const errListener = await PushNotifications.addListener('registrationError', (err) => {
        console.warn('[useNativePush] Registration failed:', err.error)
      })

      // Listen for incoming notifications (foreground)
      const fgListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        // Notification received while app is open — show in-app toast or banner
        console.log('[useNativePush] Foreground notification:', notification.title)
      })

      // Listen for notification taps (background/killed → user tapped)
      const tapListener = await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const data = action.notification?.data
        if (data?.url) window.location.href = data.url
      })

      cleanup = () => {
        regListener?.remove()
        errListener?.remove()
        fgListener?.remove()
        tapListener?.remove()
      }
    })()

    return () => cleanup()
  }, [userId])

  return { fcmToken, nativeAvailable }
}
