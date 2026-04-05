import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
const webhookSecret = Deno.env.get('STRIPE_CONTACT_WEBHOOK_SECRET')!

serve(async (req) => {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response(JSON.stringify({ received: true }))
  }

  const session = event.data.object as Stripe.Checkout.Session
  const { buyerUserId, sellerUserId, sessionId } = session.metadata ?? {}

  if (!buyerUserId || !sellerUserId) {
    return new Response('Missing metadata', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  await supabase.from('contact_unlocks').upsert({
    buyer_id:          buyerUserId,
    seller_id:         sellerUserId,
    session_id:        sessionId || null,
    stripe_session_id: session.id,
    amount:            session.amount_total ?? 0,
    currency:          session.currency ?? 'usd',
  }, { onConflict: 'stripe_session_id' })

  return new Response(JSON.stringify({ received: true }))
})
