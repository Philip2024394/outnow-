import { supabase } from '@/lib/supabase'

const delay = (ms) => new Promise(r => setTimeout(r, ms))

/**
 * Initiates a Stripe Checkout session to unlock a seller's contact details.
 * In demo mode (no supabase): simulates success after a short delay.
 */
export async function initiateContactUnlock({ buyerUserId, sellerUserId, sessionId, stripeAmount, stripeCurrency }) {
  if (!supabase) {
    // Demo mode — simulate payment
    await delay(1200)
    window.dispatchEvent(new CustomEvent('demo:contact-unlock-success', {
      detail: { sessionId, sellerUserId }
    }))
    return
  }

  const { data, error } = await supabase.functions.invoke('create-contact-checkout', {
    body: {
      buyerUserId,
      sellerUserId,
      sessionId,
      stripeAmount,
      stripeCurrency,
      successUrl: `${window.location.origin}/?contact_unlock=success&seller=${sellerUserId}`,
      cancelUrl: `${window.location.origin}/`,
    }
  })

  if (error || !data?.checkoutUrl) throw new Error(error?.message ?? 'Could not start payment')
  window.location.href = data.checkoutUrl
}

/**
 * Checks if the buyer has already unlocked a seller's contact.
 * Returns { unlocked: bool, whatsapp, phone }
 */
export async function getContactUnlock(buyerUserId, sellerUserId) {
  if (!supabase) return { unlocked: false }

  const { data } = await supabase
    .from('contact_unlocks')
    .select('id')
    .eq('buyer_id', buyerUserId)
    .eq('seller_id', sellerUserId)
    .maybeSingle()

  if (!data) return { unlocked: false }

  // Fetch seller contact details
  const { data: profile } = await supabase
    .from('profiles')
    .select('whatsapp, phone')
    .eq('id', sellerUserId)
    .single()

  return { unlocked: true, whatsapp: profile?.whatsapp ?? null, phone: profile?.phone ?? null }
}
