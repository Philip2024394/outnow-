import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { COLLECTIONS, unlockId } from '@/firebase/collections'
import { useAuth } from './useAuth'

/**
 * Watches for a venue unlock doc after payment.
 * Once Stripe webhook fires and Cloud Function writes the doc, this resolves.
 */
export function useVenueUnlock(sessionId) {
  const { user } = useAuth()
  const [unlock, setUnlock] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !sessionId) {
      setUnlock(null)
      setLoading(false)
      return
    }

    const docRef = doc(db, COLLECTIONS.VENUE_UNLOCKS, unlockId(user.uid, sessionId))

    const unsub = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setUnlock({ id: snapshot.id, ...snapshot.data() })
      } else {
        setUnlock(null)
      }
      setLoading(false)
    })

    return unsub
  }, [user, sessionId])

  return { unlock, loading }
}
