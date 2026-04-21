/**
 * send-booking-push — Supabase Edge Function
 *
 * Indonesia-grade notification delivery with retry + fallback cascade:
 * 1. Try FCM (native push) — works when app is killed
 * 2. Try Web Push (VAPID) — works in browser
 * 3. Log failure for SMS fallback (future)
 *
 * Retry: 3 attempts with exponential backoff (1s, 3s, 9s)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')       ?? ''
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')      ?? ''
const VAPID_PUB     = Deno.env.get('VAPID_PUBLIC_KEY')   ?? ''
const VAPID_PRIV    = Deno.env.get('VAPID_PRIVATE_KEY')  ?? ''
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY')     ?? ''

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUB, VAPID_PRIV)

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Retry helper with exponential backoff
async function withRetry(fn: () => Promise<any>, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt === maxRetries) throw err
      const delay = Math.pow(3, attempt - 1) * 1000 // 1s, 3s, 9s
      await new Promise(r => setTimeout(r, delay))
    }
  }
}

// Send via FCM (native Android/iOS)
async function sendFCM(token: string, payload: any) {
  if (!FCM_SERVER_KEY) return false
  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Authorization': `key=${FCM_SERVER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      priority: 'high',
      notification: {
        title: payload.title,
        body: payload.body,
        sound: 'default',
        click_action: 'FCM_PLUGIN_ACTIVITY',
      },
      data: payload,
    }),
  })
  const data = await res.json()
  return data.success === 1
}

// Send via Web Push (VAPID)
async function sendWebPush(sub: any, payload: any) {
  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify(payload),
  )
  return true
}

Deno.serve(async (req) => {
  try {
    const body = await req.json()
    const booking = body.record

    if (!booking?.driver_id || booking.status !== 'pending') {
      return new Response('skip', { status: 200 })
    }

    // Look up ALL push subscriptions for this driver (FCM + Web Push)
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, platform')
      .eq('user_id', booking.driver_id)

    if (!subs?.length) {
      // Log failed delivery for SMS fallback
      await supabase.from('failed_notifications').insert({
        user_id: booking.driver_id,
        type: 'ride_request',
        booking_id: booking.id,
        reason: 'no_push_subscription',
        created_at: new Date().toISOString(),
      }).catch(() => {})
      return new Response('no subscription', { status: 200 })
    }

    // Look up passenger name
    const { data: passenger } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', booking.user_id)
      .maybeSingle()

    const name   = passenger?.display_name ?? 'A passenger'
    const pickup = booking.pickup_location ?? 'Pickup location'

    const payload = {
      title: '🏍️ New ride request',
      body: `${name} needs a ride from ${pickup}. You have 60 seconds to accept.`,
      tag: `booking-${booking.id}`,
      url: '/?tab=driver',
      booking_id: booking.id,
      ttl: 60, // seconds — ride request expires after this
    }

    let delivered = false

    // 1. Try FCM first (native push — most reliable in Indonesia)
    const fcmSubs = subs.filter(s => s.endpoint?.startsWith('fcm:'))
    for (const sub of fcmSubs) {
      try {
        const token = sub.endpoint.replace('fcm:', '')
        delivered = await withRetry(() => sendFCM(token, payload))
        if (delivered) break
      } catch { /* continue to next */ }
    }

    // 2. Fallback to Web Push
    if (!delivered) {
      const webSubs = subs.filter(s => !s.endpoint?.startsWith('fcm:'))
      for (const sub of webSubs) {
        try {
          delivered = await withRetry(() => sendWebPush(sub, payload))
          if (delivered) break
        } catch { /* continue to next */ }
      }
    }

    // 3. If all failed, log for SMS fallback
    if (!delivered) {
      await supabase.from('failed_notifications').insert({
        user_id: booking.driver_id,
        type: 'ride_request',
        booking_id: booking.id,
        reason: 'all_push_failed',
        created_at: new Date().toISOString(),
      }).catch(() => {})
    }

    return new Response(delivered ? 'delivered' : 'failed_all_channels', { status: 200 })
  } catch (err) {
    console.error('[send-booking-push]', err)
    return new Response(String(err), { status: 500 })
  }
})
