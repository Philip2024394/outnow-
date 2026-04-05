import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const { buyerUserId, sellerUserId, sessionId, stripeAmount, stripeCurrency, successUrl, cancelUrl } = await req.json()

  if (!buyerUserId || !sellerUserId || !stripeAmount || !stripeCurrency) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: CORS })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: stripeCurrency,
        product_data: { name: 'Seller Contact Unlock', description: 'Direct contact details — buy without middlemen' },
        unit_amount: stripeAmount,
      },
      quantity: 1,
    }],
    metadata: { buyerUserId, sellerUserId, sessionId: sessionId ?? '' },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return new Response(JSON.stringify({ checkoutUrl: session.url }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
