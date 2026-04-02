import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { DEMO_SESSIONS, DEMO_SCHEDULED_SESSIONS, DEMO_INVITE_OUT_SESSIONS } from '@/demo/mockData'
import { useAuth } from './useAuth'
import { useBlockList } from './useBlockList'

/** Map a Supabase sessions_with_profiles row to the app's session shape. */
function mapRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    activityType: row.activity_type ?? null,
    activities: row.activities ?? [],
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    placeId: row.place_id ?? null,
    placeName: row.place_name ?? null,
    venueCategory: row.venue_category ?? null,
    expiresAtMs: row.expires_at ? new Date(row.expires_at).getTime() : 0,
    scheduledFor: row.scheduled_for ? new Date(row.scheduled_for).getTime() : null,
    needsCheckIn: row.needs_check_in ?? false,
    isGroup: row.is_group ?? false,
    groupSize: row.group_size ?? null,
    groupMembers: row.group_members ?? [],
    vibe: row.vibe ?? null,
    area: row.area ?? null,
    message: row.message ?? '',
    // Profile fields (from JOIN or view)
    displayName: row.display_name ?? 'Someone',
    photoURL: row.photo_url ?? null,
    age: row.age ?? null,
    lookingFor: row.looking_for ?? null,
    city: row.profile_city ?? row.city ?? null,
  }
}

const ACTIVE_STATUSES = ['active', 'scheduled', 'invite_out']

export function useLiveUsers() {
  const { user } = useAuth()
  const { blockedIds } = useBlockList()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef(null)

  useEffect(() => {
    // Demo mode
    if (!supabase) {
      setSessions([...DEMO_SESSIONS, ...DEMO_SCHEDULED_SESSIONS, ...DEMO_INVITE_OUT_SESSIONS])
      setLoading(false)
      return
    }

    if (!user) {
      setSessions([])
      setLoading(false)
      return
    }

    let mounted = true

    async function fetchAll() {
      const { data, error } = await supabase
        .from('sessions_with_profiles')
        .select('*')
        .in('status', ACTIVE_STATUSES)
        .neq('user_id', user.id)

      if (!mounted) return
      if (error) { setLoading(false); return }

      const filtered = (data ?? [])
        .filter(row => !blockedIds.has(row.user_id))
        .map(mapRow)

      setSessions(filtered)
      setLoading(false)
    }

    fetchAll()

    // Real-time: subscribe to ALL session changes, filter client-side
    channelRef.current = supabase
      .channel(`live-sessions-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        async (payload) => {
          if (!mounted) return

          if (payload.eventType === 'DELETE') {
            setSessions(prev => prev.filter(s => s.id !== payload.old.id))
            return
          }

          const row = payload.new
          if (!row) return

          // Skip own sessions
          if (row.user_id === user.id) return
          // Skip blocked
          if (blockedIds.has(row.user_id)) return

          if (!ACTIVE_STATUSES.includes(row.status)) {
            // Session ended/expired — remove from list
            setSessions(prev => prev.filter(s => s.id !== row.id))
            return
          }

          // Re-fetch with profile join to get display data
          const { data: full } = await supabase
            .from('sessions_with_profiles')
            .select('*')
            .eq('id', row.id)
            .single()

          if (!mounted || !full) return
          const mapped = mapRow(full)

          setSessions(prev => {
            const without = prev.filter(s => s.id !== mapped.id)
            return [...without, mapped]
          })
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
  }, [user, blockedIds])

  return { sessions, loading }
}
