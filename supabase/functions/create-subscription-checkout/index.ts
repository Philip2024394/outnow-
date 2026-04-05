import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { priceId, mode, userId, successUrl, cancelUrl } = await req.json()

    if (!priceId || !mode || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: priceId, mode, userId' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    if (!['subscription', 'payment'].includes(mode)) {
      return new Response(
        JSON.stringify({ error: 'mode must be "subscription" or "payment"' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId },
      client_reference_id: userId,
      success_url: successUrl ?? `${req.headers.get('origin')}?upgrade=success`,
      cancel_url:  cancelUrl  ?? req.headers.get('origin') ?? '',
      // Allow promo codes in the Stripe-hosted UI
      allow_promotion_codes: true,
    })

    return new Response(
      JSON.stringify({ checkoutUrl: session.url }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[create-subscription-checkout]', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  }
})
