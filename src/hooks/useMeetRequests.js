import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

function mapRow(row) {
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    sessionId: row.session_id,
    fromDisplayName: row.from_display_name ?? null,
    fromPhotoURL: row.from_photo_url ?? null,
    status: row.status,
    createdAt: row.created_at,
  }
}

export function useMeetRequests() {
  const { user } = useAuth()
  // User B: incoming pending request they need to accept/decline
  const [incomingMeetRequest, setIncomingMeetRequest] = useState(null)
  // User A: their outgoing request just got accepted
  const [acceptedMeetSession, setAcceptedMeetSession] = useState(null)
  const incomingRef = useRef(null)
  const outgoingRef = useRef(null)
  const demoTimerRef = useRef(null)

  // Listen for interests directed at me (User B side)
  useEffect(() => {
    if (!supabase || !user) return
    let mounted = true

    async function fetchIncoming() {
      const { data } = await supabase
        .from('interests')
        .select('*')
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (mounted) setIncomingMeetRequest(data ? mapRow(data) : null)
    }

    fetchIncoming()
    incomingRef.current = supabase
      .channel(`meet-incoming-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'interests',
        filter: `to_user_id=eq.${user.id}`,
      }, () => { if (mounted) fetchIncoming() })
      .subscribe()

    return () => {
      mounted = false
      if (incomingRef.current) {
        supabase.removeChannel(incomingRef.current)
        incomingRef.current = null
      }
    }
  }, [user])

  // Listen for my outgoing interests that got accepted (User A side)
  useEffect(() => {
    if (!supabase || !user) return
    let mounted = true

    async function fetchAccepted() {
      const { data } = await supabase
        .from('interests')
        .select('*')
        .eq('from_user_id', user.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (mounted && data) setAcceptedMeetSession(mapRow(data))
    }

    fetchAccepted()
    outgoingRef.current = supabase
      .channel(`meet-outgoing-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'interests',
        filter: `from_user_id=eq.${user.id}`,
      }, () => { if (mounted) fetchAccepted() })
      .subscribe()

    return () => {
      mounted = false
      if (outgoingRef.current) {
        supabase.removeChannel(outgoingRef.current)
        outgoingRef.current = null
      }
    }
  }, [user])

  /**
   * Demo mode: simulate the other person accepting after 5 seconds.
   * Called by DiscoveryCard when User A taps "Let's Meet Who Knows".
   */
  const simulateAcceptance = (session) => {
    clearTimeout(demoTimerRef.current)
    demoTimerRef.current = setTimeout(() => {
      setAcceptedMeetSession({
        id: `demo-meet-${Date.now()}`,
        sessionId: session.id,
        fromDisplayName: session.displayName,
        fromPhotoURL: session.photoURL,
        status: 'accepted',
      })
    }, 5000)
  }

  const clearAccepted = () => setAcceptedMeetSession(null)
  const clearIncoming = () => setIncomingMeetRequest(null)

  // Clean up demo timer on unmount
  useEffect(() => () => clearTimeout(demoTimerRef.current), [])

  return {
    incomingMeetRequest,
    acceptedMeetSession,
    simulateAcceptance,
    clearAccepted,
    clearIncoming,
  }
}
