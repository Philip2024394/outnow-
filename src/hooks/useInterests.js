import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useInterests() {
  const { user } = useAuth()
  const [myInterests, setMyInterests] = useState(new Set())
  const [mutualSessions, setMutualSessions] = useState(new Set())
  const [incomingInterests, setIncomingInterests] = useState([])
  const sentChannelRef = useRef(null)
  const incomingChannelRef = useRef(null)

  // Interests I've sent
  useEffect(() => {
    if (!supabase || !user) return
    let mounted = true

    async function fetchSent() {
      const { data } = await supabase
        .from('interests')
        .select('session_id, status')
        .eq('from_user_id', user.id)

      if (!mounted || !data) return
      const mine = new Set()
      const mutual = new Set()
      data.forEach(row => {
        mine.add(row.session_id)
        if (row.status === 'mutual') mutual.add(row.session_id)
      })
      setMyInterests(mine)
      setMutualSessions(mutual)
    }

    fetchSent()

    sentChannelRef.current = supabase
      .channel(`interests-sent-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interests', filter: `from_user_id=eq.${user.id}` },
        () => { if (mounted) fetchSent() }
      )
      .subscribe()

    return () => {
      mounted = false
      if (sentChannelRef.current) {
        supabase.removeChannel(sentChannelRef.current)
        sentChannelRef.current = null
      }
    }
  }, [user])

  // Interests sent to me
  useEffect(() => {
    if (!supabase || !user) return
    let mounted = true

    async function fetchIncoming() {
      const { data } = await supabase
        .from('interests')
        .select('*')
        .eq('to_user_id', user.id)
        .eq('status', 'pending')

      if (!mounted) return
      setIncomingInterests((data ?? []).map(row => ({
        id: row.id,
        fromUserId: row.from_user_id,
        toUserId: row.to_user_id,
        sessionId: row.session_id,
        status: row.status,
        gift: row.gift ?? null,
        message: row.message ?? '',
        createdAt: row.created_at,
      })))
    }

    fetchIncoming()

    incomingChannelRef.current = supabase
      .channel(`interests-incoming-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interests', filter: `to_user_id=eq.${user.id}` },
        () => { if (mounted) fetchIncoming() }
      )
      .subscribe()

    return () => {
      mounted = false
      if (incomingChannelRef.current) {
        supabase.removeChannel(incomingChannelRef.current)
        incomingChannelRef.current = null
      }
    }
  }, [user])

  return { myInterests, mutualSessions, incomingInterests }
}
