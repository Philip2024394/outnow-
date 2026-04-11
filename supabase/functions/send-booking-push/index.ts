/**
 * send-booking-push — Supabase Edge Function
 *
 * Triggered by a Database Webhook on bookings INSERT.
 * Looks up the assigned driver's push subscription and sends a Web Push
 * message so the driver's phone rings even when the app is closed.
 *
 * Setup:
 *  1. supabase secrets set VAPID_SUBJECT=mailto:you@example.com
 *  2. supabase secrets set VAPID_PRIVATE_KEY=<your-vapid-private-key>
 *  3. supabase secrets set VAPID_PUBLIC_KEY=<your-vapid-public-key>
 *  4. In Supabase Dashboard → Database → Webhooks:
 *       Table: bookings  |  Event: INSERT
 *       URL: https://<project>.supabase.co/functions/v1/send-booking-push
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')       ?? ''
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')      ?? ''
const VAPID_PUB     = Deno.env.get('VAPID_PUBLIC_KEY')   ?? ''
const VAPID_PRIV    = Deno.env.get('VAPID_PRIVATE_KEY')  ?? ''

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUB, VAPID_PRIV)

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

Deno.serve(async (req) => {
  try {
    const body    = await req.json()
    const booking = body.record   // Database Webhook payload

    if (!booking?.driver_id || booking.status !== 'pending') {
      return new Response('skip', { status: 200 })
    }

    // Look up driver's push subscription
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', booking.driver_id)
      .limit(1)

    if (!subs?.length) {
      return new Response('no subscription', { status: 200 })
    }

    // Look up passenger name for the notification body
    const { data: passenger } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', booking.user_id)
      .maybeSingle()

    const sub     = subs[0]
    const name    = passenger?.display_name ?? 'A passenger'
    const pickup  = booking.pickup_location ?? 'Pickup location'

    const payload = JSON.stringify({
      title:   '🏍️ New ride request',
      body:    `${name} needs a ride from ${pickup}. You have 60 seconds to accept.`,
      tag:     `booking-${booking.id}`,
      url:     '/?tab=driver',
    })

    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload,
    )

    return new Response('sent', { status: 200 })
  } catch (err) {
    console.error('[send-booking-push]', err)
    return new Response(String(err), { status: 500 })
  }
})
