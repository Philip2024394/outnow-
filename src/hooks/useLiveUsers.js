import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { COLLECTIONS, SESSION_STATUS } from '@/firebase/collections'
import { DEMO_SESSIONS, DEMO_SCHEDULED_SESSIONS } from '@/demo/mockData'
import { useAuth } from './useAuth'
import { useBlockList } from './useBlockList'

export function useLiveUsers() {
  const { user } = useAuth()
  const { blockedIds } = useBlockList()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Demo mode — return mock sessions
    if (!db) {
      setSessions([...DEMO_SESSIONS, ...DEMO_SCHEDULED_SESSIONS])
      setLoading(false)
      return
    }

    if (!user) {
      setSessions([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, COLLECTIONS.SESSIONS),
      where('status', 'in', [SESSION_STATUS.ACTIVE, 'scheduled'])
    )

    const unsub = onSnapshot(q, (snapshot) => {
      const active = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (data.userId === user.uid) return
        if (blockedIds.has(data.userId)) return
        active.push({
          id: doc.id,
          ...data,
          expiresAtMs: data.expiresAt?.toMillis?.() ?? 0,
          startedAtMs: data.startedAt?.toMillis?.() ?? 0,
        })
      })
      setSessions(active)
      setLoading(false)
    }, () => setLoading(false))

    return unsub
  }, [user, blockedIds])

  return { sessions, loading }
}
