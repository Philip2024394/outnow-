import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useBlockList() {
  const { user } = useAuth()
  const [blockedIds, setBlockedIds] = useState(new Set())

  useEffect(() => {
    if (!supabase || !user) return

    supabase
      .from('blocks')
      .select('blocked_user_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return
        setBlockedIds(new Set(data.map(row => row.blocked_user_id)))
      })
  }, [user])

  const addBlock = (userId) => {
    setBlockedIds(prev => new Set([...prev, userId]))
    if (supabase && user) {
      supabase.from('blocks').insert({ user_id: user.id, blocked_user_id: userId }).then(() => {})
    }
  }

  return { blockedIds, addBlock }
}
