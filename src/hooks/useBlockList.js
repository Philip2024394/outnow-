import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { BLOCKS_SUB } from '@/firebase/collections'
import { useAuth } from './useAuth'

export function useBlockList() {
  const { user } = useAuth()
  const [blockedIds, setBlockedIds] = useState(new Set())

  useEffect(() => {
    if (!db || !user) return

    getDocs(collection(db, BLOCKS_SUB(user.uid))).then((snapshot) => {
      const ids = new Set()
      snapshot.forEach(doc => ids.add(doc.id))
      setBlockedIds(ids)
    }).catch(() => {})
  }, [user])

  const addBlock = (userId) => {
    setBlockedIds(prev => new Set([...prev, userId]))
  }

  return { blockedIds, addBlock }
}
