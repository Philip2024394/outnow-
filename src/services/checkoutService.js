import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Stripe Price IDs — set these in your .env file after creating products in
// the Stripe dashboard (https://dashboard.stripe.com/products)
// ─────────────────────────────────────────────────────────────────────────────
const PRICE_IDS = {
  // Social subscriptions (monthly)
  social_boost:      import.meta.env.VITE_STRIPE_PRICE_SOCIAL_BOOST,
  social_pro:        import.meta.env.VITE_STRIPE_PRICE_SOCIAL_PRO,
  social_vip:        import.meta.env.VITE_STRIPE_PRICE_SOCIAL_VIP,
  // Social one-time
  social_lifetime:   import.meta.env.VITE_STRIPE_PRICE_SOCIAL_LIFETIME,
  // Maker subscriptions (monthly)
  maker_listing:     import.meta.env.VITE_STRIPE_PRICE_MAKER_LISTING,
  maker_premium:     import.meta.env.VITE_STRIPE_PRICE_MAKER_PREMIUM,
  maker_business:    import.meta.env.VITE_STRIPE_PRICE_MAKER_BUSINESS,
  // Maker contact unlock packs (one-time)
  maker_pack3:       import.meta.env.VITE_STRIPE_PRICE_MAKER_PACK3,
  maker_pack8:       import.meta.env.VITE_STRIPE_PRICE_MAKER_PACK8,
}

/**
 * Redirect the user to a Stripe Checkout session.
 *
 * @param {string} priceKey   — key from PRICE_IDS above
 * @param {'subscription'|'payment'} mode
 * @param {string} userId
 * @throws if the edge function call fails or the price ID is not configured
 */
export async function startCheckout(priceKey, mode, userId) {
  if (!supabase) throw new Error('Not available in demo mode')

  const priceId = PRICE_IDS[priceKey]
  if (!priceId) {
    throw new Error(
      `Stripe price ID not configured for "${priceKey}". ` +
      'Add VITE_STRIPE_PRICE_* to your .env file.'
    )
  }

  const successUrl = `${window.location.origin}?upgrade=success&plan=${priceKey}`
  const cancelUrl  = window.location.origin

  const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
    body: { priceId, mode, userId, successUrl, cancelUrl },
  })

  if (error || !data?.checkoutUrl) {
    throw new Error(error?.message ?? 'Could not start checkout — please try again')
  }

  // Redirect browser to Stripe-hosted checkout page
  window.location.href = data.checkoutUrl
}
