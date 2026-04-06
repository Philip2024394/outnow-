/**
 * stripe-spot-webhook
 *
 * Handles Stripe webhook events for map spot subscriptions.
 * Events handled:
 *   - checkout.session.completed   → activate pending spot
 *   - customer.subscription.deleted → cancel spot
 *   - invoice.payment_failed        → flag for follow-up (future)
 *
 * Set STRIPE_SPOT_WEBHOOK_SECRET in Supabase edge function secrets.
 * Register this endpoint in Stripe Dashboard → Webhooks.
 */

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
const webhookSecret = Deno.env.get('STRIPE_SPOT_WEBHOOK_SECRET')!

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Spot plan price IDs → billing period
const ANNUAL_PRICE_IDS = new Set([
  Deno.env.get('STRIPE_PRICE_SPOT_USER_ANNUAL'),
  Deno.env.get('STRIPE_PRICE_SPOT_BUSINESS_ANNUAL'),
])

serve(async (req) => {
  const sig  = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, webhookSecret)
  } catch (err) {
    console.error('[stripe-spot-webhook] Signature verification failed:', err)
    return new Response('Webhook signature invalid', { status: 400 })
  }

  try {
    switch (event.type) {

      // ── Checkout completed → activate spot immediately ──────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (!session.subscription) break   // not a subscription checkout

        const userId = session.client_reference_id ?? session.metadata?.userId
        if (!userId) {
          console.error('[stripe-spot-webhook] No userId in session metadata')
          break
        }

        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = sub.items.data[0]?.price?.id ?? ''
        const billingPeriod = ANNUAL_PRICE_IDS.has(priceId) ? 'annual' : 'monthly'
        const boostCredits  = billingPeriod === 'annual' ? 10 : 0

        // Activate the pending spot for this user
        const { error } = await supabase
          .from('spots')
          .update({
            status:                 'active',
            verified_at:            new Date().toISOString(),
            stripe_subscription_id: sub.id,
            stripe_customer_id:     sub.customer as string,
            billing_period:         billingPeriod,
            boost_credits:          boostCredits,
            next_billing_at:        new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('user_id', userId)
          .eq('status',  'pending')

        if (error) console.error('[stripe-spot-webhook] Update spot failed:', error)
        else console.log(`[stripe-spot-webhook] Spot activated for user ${userId} (${billingPeriod})`)
        break
      }

      // ── Subscription cancelled → mark spot cancelled ────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const { error } = await supabase
          .from('spots')
          .update({
            status:       'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id)

        if (error) console.error('[stripe-spot-webhook] Cancel spot failed:', error)
        else console.log(`[stripe-spot-webhook] Spot cancelled for subscription ${sub.id}`)
        break
      }

      // ── Subscription renewed → refresh next_billing_at ─────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.subscription) break

        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string)
        await supabase
          .from('spots')
          .update({
            status:          'active',
            next_billing_at: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      // ── Payment failed → keep spot active but flag it ───────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.warn(`[stripe-spot-webhook] Payment failed for subscription ${invoice.subscription}`)
        // Stripe will retry — spot remains active during grace period
        // Add notification logic here if needed
        break
      }

      default:
        console.log(`[stripe-spot-webhook] Unhandled event: ${event.type}`)
    }
  } catch (err) {
    console.error('[stripe-spot-webhook] Handler error:', err)
    return new Response('Internal error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
