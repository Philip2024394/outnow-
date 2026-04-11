/**
 * Supabase Edge Function: midtrans-create-token
 *
 * Creates a Midtrans Snap token server-side so the server key is never
 * exposed to the browser.
 *
 * Required secrets (set via: supabase secrets set KEY=value):
 *   MIDTRANS_SERVER_KEY   — server key from Midtrans dashboard (sk-...)
 *   MIDTRANS_IS_PRODUCTION — "true" | "false"
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const serverKey   = Deno.env.get('MIDTRANS_SERVER_KEY') ?? ''
    const isProd      = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true'
    const baseUrl     = isProd
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

    if (!serverKey) throw new Error('MIDTRANS_SERVER_KEY not set')

    const { orderId, grossAmount, itemDetails, customerDetails } = await req.json()

    const body = {
      transaction_details: { order_id: orderId, gross_amount: grossAmount },
      item_details:        itemDetails,
      customer_details:    customerDetails,
      credit_card:         { secure: true },
      // Enable all Indonesia payment channels
      enabled_payments: [
        'credit_card', 'bca_va', 'bni_va', 'bri_va', 'mandiri_va',
        'permata_va', 'other_va', 'gopay', 'shopeepay', 'qris',
        'alfamart', 'indomaret',
      ],
    }

    const encoded = btoa(`${serverKey}:`)
    const res = await fetch(baseUrl, {
      method:  'POST',
      headers: { 'Authorization': `Basic ${encoded}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error_messages?.join(', ') ?? 'Midtrans error')

    return new Response(JSON.stringify({ snapToken: data.token, redirectUrl: data.redirect_url }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
