import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

const ACTIVE_OTW_STATUSES = ['pending', 'accepted', 'paid', 'proceeding']

function mapRow(row) {
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    sessionId: row.session_id,
    status: row.status,
    etaMinutes: row.eta_minutes ?? null,
    createdAt: row.created_at,
  }
}

export function useOtwRequests() {
  const { user } = useAuth()
  const [incomingRequest, setIncomingRequest] = useState(null)
  const [myOutgoingRequest, setMyOutgoingRequest] = useState(null)
  const incomingChannelRef = useRef(null)
  const outgoingChannelRef = useRef(null)

  // Incoming requests to me
  useEffect(() => {
    if (!supabase || !user) return
    let mounted = true

    async function fetchIncoming() {
      const { data } = await supabase
        .from('otw_requests')
        .select('*')
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (mounted) setIncomingRequest(data ? mapRow(data) : null)
    }

    fetchIncoming()

    incomingChannelRef.current = supabase
      .channel(`otw-incoming-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'otw_requests', filter: `to_user_id=eq.${user.id}` },
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

  // My outgoing requests
  useEffect(() => {
    if (!supabase || !user) return
    let mounted = true

    async function fetchOutgoing() {
      const { data } = await supabase
        .from('otw_requests')
        .select('*')
        .eq('from_user_id', user.id)
        .in('status', ACTIVE_OTW_STATUSES)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (mounted) setMyOutgoingRequest(data ? mapRow(data) : null)
    }

    fetchOutgoing()

    outgoingChannelRef.current = supabase
      .channel(`otw-outgoing-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'otw_requests', filter: `from_user_id=eq.${user.id}` },
        () => { if (mounted) fetchOutgoing() }
      )
      .subscribe()

    return () => {
      mounted = false
      if (outgoingChannelRef.current) {
        supabase.removeChannel(outgoingChannelRef.current)
        outgoingChannelRef.current = null
      }
    }
  }, [user])

  return { incomingRequest, myOutgoingRequest }
}
