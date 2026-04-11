/**
 * notificationService.js
 * Inserts rows into the `notifications` Supabase table.
 * The `useNotifications` hook picks these up via realtime and fires
 * local browser push for online users. The service worker handles
 * true background push for offline users via Web Push API.
 */
import { supabase } from '@/lib/supabase'

async function send(toUserId, { type, title, body, fromUserId, sessionId, data }) {
  if (!supabase || !toUserId) return
  const { error } = await supabase.from('notifications').insert({
    id:           `NOTIF_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    user_id:      toUserId,
    type,
    title,
    body:         body ?? null,
    from_user_id: fromUserId ?? null,
    session_id:   sessionId ?? null,
    data:         data ?? null,
    read:         false,
    created_at:   new Date().toISOString(),
  })
  if (error) console.warn('[notificationService]', error.message)
}

// ── Date invite ───────────────────────────────────────────────────────────────

export function notifyDateInvite(toUserId, { fromName, ideaTitle, fromUserId }) {
  return send(toUserId, {
    type:       'date_invite',
    title:      `💕 Date invite from ${fromName}`,
    body:       `${fromName} wants to take you on a date: ${ideaTitle}. Tap to view and accept.`,
    fromUserId,
    data:       { action: 'open_chat' },
  })
}

export function notifyDateAccepted(toUserId, { fromName, ideaTitle, fromUserId }) {
  return send(toUserId, {
    type:       'date_accepted',
    title:      `🎉 ${fromName} accepted your date invite!`,
    body:       `${ideaTitle} is on! Chat is open — start planning.`,
    fromUserId,
    data:       { action: 'open_chat' },
  })
}

// ── Social / meet ─────────────────────────────────────────────────────────────

export function notifyWave(toUserId, { fromName, fromUserId, sessionId }) {
  return send(toUserId, {
    type:       'wave',
    title:      `👋 ${fromName} wants to meet!`,
    body:       `${fromName} sent you a wave — they're out now. Tap to view their profile.`,
    fromUserId,
    sessionId,
    data:       { action: 'open_discovery' },
  })
}

export function notifyLiked(toUserId, { fromName, fromUserId }) {
  return send(toUserId, {
    type:       'like',
    title:      `💚 ${fromName} liked your profile`,
    body:       `${fromName} is out now and liked you — check them out!`,
    fromUserId,
    data:       { action: 'open_discovery' },
  })
}

// ── Chat / messages ───────────────────────────────────────────────────────────

export function notifyNewMessage(toUserId, { fromName, preview, fromUserId, convId }) {
  return send(toUserId, {
    type:       'message',
    title:      `💬 ${fromName}`,
    body:       preview,
    fromUserId,
    data:       { action: 'open_chat', convId },
  })
}

// ── Ride ──────────────────────────────────────────────────────────────────────

export function notifyRideRequest(toUserId, { passengerName, pickup, fromUserId, bookingId }) {
  return send(toUserId, {
    type:       'ride',
    title:      `🏍️ New ride request`,
    body:       `${passengerName} needs a ride from ${pickup}. You have 60 seconds to accept.`,
    fromUserId,
    data:       { action: 'open_ride', bookingId },
  })
}

export function notifyRideAccepted(toUserId, { driverName, eta, fromUserId, bookingId }) {
  return send(toUserId, {
    type:       'ride_accepted',
    title:      `🏍️ Driver on the way!`,
    body:       `${driverName} accepted your ride request. ETA: ${eta ?? 'a few minutes'}.`,
    fromUserId,
    data:       { action: 'open_ride', bookingId },
  })
}

export function notifyRideExpired(toUserId, { bookingId }) {
  return send(toUserId, {
    type:       'ride',
    title:      `⏱️ No drivers available right now`,
    body:       `Your ride request timed out. Try again or choose a different driver.`,
    fromUserId: null,
    data:       { action: 'open_ride', bookingId },
  })
}

// ── Gift orders ───────────────────────────────────────────────────────────────

/** Tell the seller they have an anonymous gift order. Buyer identity is NOT included. */
export function notifyGiftToSeller(toUserId, { productName, orderId, fromUserId }) {
  return send(toUserId, {
    type:       'gift_order',
    title:      `🎁 New anonymous gift order!`,
    body:       `Someone sent "${productName}" as an anonymous gift. Open your orders to confirm and prepare.`,
    fromUserId, // stored for internal reference, not shown to seller
    data:       { action: 'open_gift_orders', orderId },
  })
}

/** Tell the recipient a gift is on its way. Sender identity is NOT included. */
export function notifyGiftToRecipient(toUserId, { sellerName, productName, orderId, fromUserId }) {
  return send(toUserId, {
    type:       'gift_received',
    title:      `🎁 You have an anonymous gift!`,
    body:       `Someone sent you "${productName}" from ${sellerName}. Set your delivery address to receive it.`,
    fromUserId, // stored for internal reference, not shown to recipient
    data:       { action: 'open_gift_address', orderId },
  })
}

/** Tell recipient they have a gift waiting but need to set their delivery address first. */
export function notifyGiftAddressRequired(toUserId, { sellerName, fromUserId, orderId }) {
  return send(toUserId, {
    type:       'gift_address_required',
    title:      `🎁 You have a surprise gift waiting!`,
    body:       `Someone sent you an anonymous gift from ${sellerName}. Add your delivery address in Settings → Gift Delivery Address to receive it.`,
    fromUserId,
    data:       { action: 'open_gift_address', orderId },
  })
}

/** Tell buyer their gift order status changed. */
export function notifyGiftStatusUpdate(toUserId, { status, productName, orderId }) {
  const msgs = {
    seller_acknowledged: { title: '✅ Gift acknowledged!',       body: `The seller confirmed your gift of "${productName}" and is preparing it.` },
    preparing:           { title: '📦 Gift being prepared',      body: `Your gift of "${productName}" is being packed up.` },
    out_for_delivery:    { title: '🏍️ Gift is on its way!',      body: `Your anonymous gift of "${productName}" is out for delivery!` },
    delivered:           { title: '🎉 Gift delivered!',          body: `Your anonymous gift of "${productName}" has been delivered.` },
    cancelled:           { title: '❌ Gift order cancelled',     body: `The gift order for "${productName}" was cancelled.` },
  }
  const msg = msgs[status]
  if (!msg) return Promise.resolve()
  return send(toUserId, {
    type:       'gift_update',
    title:      msg.title,
    body:       msg.body,
    fromUserId: null,
    data:       { action: 'open_gift_orders', orderId },
  })
}

// ── Date suggestions (admin) ──────────────────────────────────────────────────

export function notifyDateSuggestionAccepted(toUserId, { ideaTitle }) {
  return send(toUserId, {
    type:       'system',
    title:      `💡 Your date idea was accepted!`,
    body:       `"${ideaTitle}" is now live in the Date Ideas section. Start inviting!`,
    data:       { action: 'open_dating' },
  })
}
