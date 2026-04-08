import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getIncomingDateInvites } from '@/services/dateInviteService'

/**
 * Listens for incoming date invites for `userId`.
 * Uses Supabase realtime (INSERT on date_invites) + initial fetch on mount.
 * Returns null / no-ops when supabase is null (demo mode).
 */
export function useDateInvites(userId) {
  const [incomingInvite, setIncomingInvite] = useState(null)
  const seenIds = useRef(new Set())

  useEffect(() => {
    if (!userId || !supabase) return

    // Initial fetch — show oldest pending invite not yet seen
    getIncomingDateInvites(userId).then(invites => {
      const fresh = invites.find(inv => !seenIds.current.has(inv.id))
      if (fresh) {
        seenIds.current.add(fresh.id)
        setIncomingInvite(fresh)
      }
    })

    // Realtime: new invite inserted targeting this user
    const channel = supabase
      .channel(`date-invites-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'date_invites', filter: `to_user_id=eq.${userId}` },
        async (payload) => {
          const inv = payload.new
          if (seenIds.current.has(inv.id) || inv.status !== 'pending') return
          // Check it hasn't already expired
          if (inv.expires_at && new Date(inv.expires_at) < new Date()) return
          seenIds.current.add(inv.id)
          // Fetch enriched version with profile join
          const { data } = await supabase
            .from('date_invites')
            .select('*, profiles!from_user_id(display_name, photo_url, age, city)')
            .eq('id', inv.id)
            .single()
          if (data) setIncomingInvite(data)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return {
    incomingInvite,
    clearInvite: () => setIncomingInvite(null),
  }
}
