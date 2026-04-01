import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase/config'

const delay = (ms) => new Promise(r => setTimeout(r, ms))

export async function unlockVenuePayment(otwRequestId, sessionId) {
  if (!functions) {
    // Demo mode: simulate Stripe redirect by showing venue reveal directly
    await delay(1000)
    // Dispatch a custom event the app shell listens to
    window.dispatchEvent(new CustomEvent('demo:payment-success', {
      detail: { sessionId, otwRequestId }
    }))
    return
  }

  const fn = httpsCallable(functions, 'createCheckoutSession')
  const result = await fn({
    otwRequestId,
    sessionId,
    successUrl: `${window.location.origin}/?unlock=success&session=${sessionId}`,
    cancelUrl: `${window.location.origin}/?unlock=cancelled`,
  })
  window.location.href = result.data.checkoutUrl
}
