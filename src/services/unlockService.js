import { supabase } from '@/lib/supabase'

const DEMO = !supabase

// ── Plan limits ──────────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  free:     { products: 3,  images: 3,  unlimitedChat: false, boost: false },
  standard: { products: 50, images: 20, unlimitedChat: true,  boost: false },
  premium:  { products: Infinity, images: Infinity, unlimitedChat: true, boost: true },
}

export const PLAN_PRICES = {
  standard: { idr: 40000, label: '40.000 rp/bln' },
  premium:  { idr: 79000, label: '79.000 rp/bln' },
}

export const UNLOCK_PACK = { credits: 2, usd: 1.99, label: '2 unlocks — $1.99' }

// ── Chat session ─────────────────────────────────────────────────────────────

/** Start or fetch the chat session for this conversation.
 *  Returns { startedAt, unlockedAt } — unlockedAt null means still in free window */
export async function getChatSession(conversationId, userId) {
  if (DEMO) {
    const key = `cs_${conversationId}_${userId}`
    const raw = sessionStorage.getItem(key)
    if (raw) return JSON.parse(raw)
    const session = { startedAt: Date.now(), unlockedAt: null }
    sessionStorage.setItem(key, JSON.stringify(session))
    return session
  }

  // Upsert on first open
  const { data, error } = await supabase
    .from('chat_sessions')
    .upsert(
      { conversation_id: conversationId, user_id: userId },
      { onConflict: 'conversation_id,user_id', ignoreDuplicates: false }
    )
    .select('started_at, unlocked_at')
    .single()

  if (error) throw error
  return {
    startedAt:  new Date(data.started_at).getTime(),
    unlockedAt: data.unlocked_at ? new Date(data.unlocked_at).getTime() : null,
  }
}

/** Mark a chat session as unlocked (after payment or subscription check) */
export async function markChatUnlocked(conversationId, userId, unlockType) {
  if (DEMO) {
    const key = `cs_${conversationId}_${userId}`
    const raw = sessionStorage.getItem(key)
    const session = raw ? JSON.parse(raw) : { startedAt: Date.now() }
    session.unlockedAt = Date.now()
    sessionStorage.setItem(key, JSON.stringify(session))
    return
  }

  await supabase
    .from('chat_sessions')
    .update({ unlocked_at: new Date().toISOString(), unlock_type: unlockType })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
}

// ── Subscription ─────────────────────────────────────────────────────────────

/** Fetch the active subscription for the current user. Returns null if none. */
export async function getActiveSubscription(userId) {
  if (DEMO) return null

  const { data } = await supabase
    .from('seller_subscriptions')
    .select('plan, status, renews_at, boost_used_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('renews_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data ?? null
}

/** Get the seller_plan field from profiles (synced by webhook / admin). */
export async function getSellerPlan(userId) {
  if (DEMO) return 'free'

  const { data } = await supabase
    .from('profiles')
    .select('seller_plan')
    .eq('id', userId)
    .single()

  return data?.seller_plan ?? 'free'
}

// ── Unlock credits ────────────────────────────────────────────────────────────

/** How many unlock credits does the user have left? */
export async function getUnlockBalance(userId) {
  if (DEMO) {
    return parseInt(localStorage.getItem('demo_unlock_balance') ?? '0', 10)
  }

  const { data, error } = await supabase.rpc('get_unlock_balance', { p_user_id: userId })
  if (error) return 0
  return data ?? 0
}

/** Consume one credit. Returns true if successful, false if none available. */
export async function consumeUnlockCredit(userId) {
  if (DEMO) {
    const bal = parseInt(localStorage.getItem('demo_unlock_balance') ?? '0', 10)
    if (bal <= 0) return false
    localStorage.setItem('demo_unlock_balance', String(bal - 1))
    return true
  }

  const { data, error } = await supabase.rpc('consume_unlock_credit', { p_user_id: userId })
  if (error) return false
  return data === true
}

/** Record a purchase of 2 unlock credits (called after Stripe confirms). */
export async function recordUnlockPurchase(userId, stripePaymentIntentId) {
  if (DEMO) {
    const bal = parseInt(localStorage.getItem('demo_unlock_balance') ?? '0', 10)
    localStorage.setItem('demo_unlock_balance', String(bal + UNLOCK_PACK.credits))
    return
  }

  await supabase.from('chat_unlocks').insert({
    user_id:      userId,
    credits_total: UNLOCK_PACK.credits,
    price_usd:    UNLOCK_PACK.usd,
    stripe_pi_id: stripePaymentIntentId ?? null,
  })
}

// ── Stripe checkout helpers ───────────────────────────────────────────────────

/** Open Stripe Checkout for 2 unlock credits ($1.99).
 *  In demo mode: simulates purchase immediately. */
export async function purchaseUnlockPack(userId, onSuccess) {
  if (DEMO) {
    await recordUnlockPurchase(userId, null)
    onSuccess?.()
    return
  }

  // TODO: call your Supabase Edge Function / backend to create Stripe session
  // const res = await fetch('/api/create-checkout', { method: 'POST', body: JSON.stringify({ type: 'unlock_pack', userId }) })
  // const { url } = await res.json()
  // window.location.href = url

  // For now: demo fallback
  await recordUnlockPurchase(userId, null)
  onSuccess?.()
}

/** Open Stripe Checkout for a monthly subscription.
 *  plan = 'standard' | 'premium' */
export async function purchaseSubscription(userId, plan, onSuccess) {
  if (DEMO) {
    // Demo: just update localStorage tier
    localStorage.setItem('demo_seller_plan', plan)
    onSuccess?.()
    return
  }

  // TODO: call backend
  // const res = await fetch('/api/create-checkout', { method: 'POST', body: JSON.stringify({ type: 'subscription', plan, userId }) })
  // const { url } = await res.json()
  // window.location.href = url

  localStorage.setItem('demo_seller_plan', plan)
  onSuccess?.()
}

/** Mark the monthly boost as used for this billing period. */
export async function useMonthlyBoost(userId) {
  if (DEMO) {
    localStorage.setItem('demo_boost_used', new Date().toISOString())
    return
  }

  await supabase
    .from('seller_subscriptions')
    .update({ boost_used_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'active')
}
