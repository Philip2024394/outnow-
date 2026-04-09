import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

/**
 * Watches for a venue unlock row after Stripe payment.
 * Once the webhook fires and the unlock row is written, this resolves.
 */
export function useVenueUnlock(sessionId) {
  const { user } = useAuth()
  const [unlock, setUnlock] = useState(null)
  const [loading, setLoading] = useState(true)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!supabase || !user || !sessionId) {
      setUnlock(null)
      setLoading(false)
      return
    }

    let mounted = true

    // Initial check
    supabase
      .from('venue_unlocks')
      .select('*')
      .eq('buyer_id', user.id)
      .eq('session_id', sessionId)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted) {
          setUnlock(data ?? null)
          setLoading(false)
        }
      })

    // Real-time: listen for the unlock being written after payment
    channelRef.current = supabase
      .channel(`venue-unlock-${user.id}-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'venue_unlocks',
          filter: `buyer_id=eq.${user.id}`,
        },
        (payload) => {
          if (!mounted) return
          if (payload.new?.session_id === sessionId) {
            setUnlock(payload.new)
          }
        }
      )
      .subscribe()

    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user, sessionId])

  return { unlock, loading }
}
