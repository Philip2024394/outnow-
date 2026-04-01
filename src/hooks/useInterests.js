import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { COLLECTIONS } from '@/firebase/collections'
import { useAuth } from './useAuth'

export function useInterests() {
  const { user } = useAuth()
  const [myInterests, setMyInterests] = useState(new Set())
  const [mutualSessions, setMutualSessions] = useState(new Set())
  const [incomingInterests, setIncomingInterests] = useState([])

  useEffect(() => {
    if (!db || !user) return

    const q = query(collection(db, COLLECTIONS.INTERESTS), where('fromUserId', '==', user.uid))
    const unsub = onSnapshot(q, (snapshot) => {
      const mine = new Set()
      const mutual = new Set()
      snapshot.forEach(doc => {
        const data = doc.data()
        mine.add(data.sessionId)
        if (data.status === 'mutual') mutual.add(data.sessionId)
      })
      setMyInterests(mine)
      setMutualSessions(mutual)
    })
    return unsub
  }, [user])

  useEffect(() => {
    if (!db || !user) return

    const q = query(
      collection(db, COLLECTIONS.INTERESTS),
      where('toUserId', '==', user.uid),
      where('status', '==', 'pending')
    )
    const unsub = onSnapshot(q, (snapshot) => {
      setIncomingInterests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [user])

  return { myInterests, mutualSessions, incomingInterests }
}
