import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { COLLECTIONS, OTW_STATUS } from '@/firebase/collections'
import { useAuth } from './useAuth'

export function useOtwRequests() {
  const { user } = useAuth()
  const [incomingRequest, setIncomingRequest] = useState(null)
  const [myOutgoingRequest, setMyOutgoingRequest] = useState(null)

  useEffect(() => {
    if (!db || !user) return

    const q = query(
      collection(db, COLLECTIONS.OTW_REQUESTS),
      where('toUserId', '==', user.uid),
      where('status', '==', OTW_STATUS.PENDING)
    )

    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) { setIncomingRequest(null); return }
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      docs.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
      setIncomingRequest(docs[0])
    })

    return unsub
  }, [user])

  useEffect(() => {
    if (!db || !user) return

    const q = query(
      collection(db, COLLECTIONS.OTW_REQUESTS),
      where('fromUserId', '==', user.uid),
      where('status', 'in', [OTW_STATUS.PENDING, OTW_STATUS.ACCEPTED, OTW_STATUS.PAID, OTW_STATUS.PROCEEDING])
    )

    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) { setMyOutgoingRequest(null); return }
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      docs.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
      setMyOutgoingRequest(docs[0])
    })

    return unsub
  }, [user])

  return { incomingRequest, myOutgoingRequest }
}
