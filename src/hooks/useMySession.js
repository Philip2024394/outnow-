import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { COLLECTIONS, SESSION_STATUS } from '@/firebase/collections'
import { useAuth } from './useAuth'

export function useMySession() {
  const { user } = useAuth()
  const [session, setSession] = useState(undefined)
  const [needsCheckIn, setNeedsCheckIn] = useState(false)

  useEffect(() => {
    // Demo / no Firebase → no active session by default
    if (!db) {
      setSession(null)
      return
    }

    if (!user) {
      setSession(null)
      return
    }

    const q = query(
      collection(db, COLLECTIONS.SESSIONS),
      where('userId', '==', user.uid),
      where('status', '==', SESSION_STATUS.ACTIVE),
      limit(1)
    )

    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setSession(null)
        setNeedsCheckIn(false)
        return
      }
      const doc = snapshot.docs[0]
      const data = doc.data()
      setSession({
        id: doc.id,
        ...data,
        expiresAtMs: data.expiresAt?.toMillis?.() ?? 0,
        startedAtMs: data.startedAt?.toMillis?.() ?? 0,
      })
      setNeedsCheckIn(data.needsCheckIn === true)
    })

    return unsub
  }, [user])

  return {
    session,
    needsCheckIn,
    isLive: !!session,
    loading: session === undefined,
  }
}
