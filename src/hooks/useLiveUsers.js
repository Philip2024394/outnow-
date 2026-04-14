import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { DEMO_SESSIONS, DEMO_SCHEDULED_SESSIONS, DEMO_INVITE_OUT_SESSIONS, DEMO_MAKER_SESSIONS, DEMO_CATEGORY_SESSIONS } from '@/demo/mockData'
import { useAuth } from './useAuth'
import { useBlockList } from './useBlockList'

// Normalise country strings for comparison (lowercase, trimmed)
function normaliseCountry(c) {
  return (c ?? '').toLowerCase().trim()
}

const FUZZ_MIN = Number(import.meta.env.VITE_FUZZ_MIN_METERS ?? 200)
const FUZZ_MAX = Number(import.meta.env.VITE_FUZZ_MAX_METERS ?? 500)

function fuzzCoord(lat, lng) {
  if (lat == null || lng == null) return { fuzzedLat: null, fuzzedLng: null }
  const r = (Math.random() * (FUZZ_MAX - FUZZ_MIN) + FUZZ_MIN) / 111320
  const angle = Math.random() * 2 * Math.PI
  return {
    fuzzedLat: lat + r * Math.cos(angle),
    fuzzedLng: lng + r * Math.sin(angle) / Math.cos(lat * Math.PI / 180),
  }
}

/** Map a Supabase sessions_with_profiles row to the app's session shape. */
function mapRow(row) {
  const { fuzzedLat, fuzzedLng } = fuzzCoord(row.lat, row.lng)
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    activityType: row.activity_type ?? null,
    activities: row.activities ?? [],
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    fuzzedLat,
    fuzzedLng,
    // placeName, placeId and venueCategory are intentionally NOT mapped here.
    // Venue details are private — they are used only for internal distance
    // calculation and must never be exposed to other users.
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
    userJoinedAt: row.profile_created_at ? new Date(row.profile_created_at).getTime() : null,
    isVerified: row.is_verified ?? false,
    idVerified: row.id_verified ?? false,
    market: row.market ?? null,
    priceMin: row.price_min ?? null,
    priceMax: row.price_max ?? null,
    brandName: row.brand_name ?? null,
    tradeRole: row.trade_role ?? null,
    relationshipGoal: row.relationship_goal ?? null,
    starSign: row.star_sign ?? null,
    height: row.height ?? null,
    speakingNative: row.speaking_native ?? null,
    speakingSecond: row.speaking_second ?? null,
    country: row.country ?? null,
    international: row.international ?? false,
    tags: row.tags ?? [],
    photos: row.extra_photos ?? [],
    instagram: row.instagram_handle ?? null,
    tiktok: row.tiktok_handle ?? null,
    facebook: row.facebook_handle ?? null,
    website: row.website_url ?? null,
    youtube: row.youtube_handle ?? null,
    tier: row.tier ?? null,
    cuisineType: row.cuisine_type ?? null,
    targetAudience: row.target_audience ?? [],
    shopType: row.shop_type ?? null,
    // contact_platform is public (badge display) — contact_number is never in the view
    contactPlatform: row.contact_platform ?? null,
    presenceStreak: row.presence_streak ?? 0,
  }
}

const ACTIVE_STATUSES = ['active', 'scheduled', 'invite_out']

export function useLiveUsers({ browseCountry } = {}) {
  const { user, userProfile } = useAuth()
  const { blockedIds } = useBlockList()
  // browseCountry prop overrides the user's home country (Business tier browsing)
  const myCountry = normaliseCountry(browseCountry ?? userProfile?.country)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef(null)

  useEffect(() => {
    // Demo mode
    if (!supabase) {
      setSessions([...DEMO_SESSIONS, ...DEMO_SCHEDULED_SESSIONS, ...DEMO_INVITE_OUT_SESSIONS, ...DEMO_MAKER_SESSIONS, ...DEMO_CATEGORY_SESSIONS])
      setLoading(false)
      return
    }

    if (!user) {
      // Guest browsing — show demo profiles so the map isn't empty
      setSessions([...DEMO_SESSIONS, ...DEMO_SCHEDULED_SESSIONS, ...DEMO_INVITE_OUT_SESSIONS, ...DEMO_MAKER_SESSIONS, ...DEMO_CATEGORY_SESSIONS])
      setLoading(false)
      return
    }

    let mounted = true

    async function fetchAll() {
      let query = supabase
        .from('sessions_with_profiles')
        .select('*')
        .in('status', ACTIVE_STATUSES)
        .neq('user_id', user.id)

      // Country filter: Indonesia only
      query = query.or(`country.eq.indonesia,international.eq.true`)

      const now = new Date()
      const [{ data, error }, { data: affinities }, { data: predicted }] = await Promise.all([
        query,
        supabase.from('user_category_affinity').select('category, weight').eq('user_id', user.id),
        supabase.rpc('get_predicted_active_users', {
          p_day_of_week: now.getUTCDay(),
          p_hour_of_day: now.getUTCHours(),
        }),
      ])

      if (!mounted) return
      if (error) { setLoading(false); return }

      const affinityMap = Object.fromEntries((affinities ?? []).map(a => [a.category, a.weight]))

      const filtered = (data ?? [])
        .filter(row => !blockedIds.has(row.user_id))
        .map(row => ({ ...mapRow(row), affinityWeight: affinityMap[row.looking_for] ?? 1.0 }))

      // Predicted sessions: users historically active at this hour — shown as greyed pins
      const activeIds = new Set(filtered.map(s => s.userId))
      const predictedSessions = (predicted ?? [])
        .filter(p => !blockedIds.has(p.user_id) && !activeIds.has(p.user_id))
        .map(p => {
          const { fuzzedLat, fuzzedLng } = fuzzCoord(p.last_lat, p.last_lng)
          return {
            id:          `predicted-${p.user_id}`,
            userId:      p.user_id,
            status:      'predicted',
            displayName: p.display_name ?? 'Someone',
            photoURL:    p.photo_url ?? null,
            lat:         p.last_lat,
            lng:         p.last_lng,
            fuzzedLat,
            fuzzedLng,
            lookingFor:  p.looking_for ?? null,
            isSeeded:    false,
          }
        })

      // Always show category showcase profiles globally (isSeeded — not real users)
      setSessions([...filtered, ...predictedSessions, ...DEMO_CATEGORY_SESSIONS])
      setLoading(false)
    }

    fetchAll()

    // Helper: re-fetch a session row with profile join and update state
    async function refetchSession(sessionId) {
      const { data: full } = await supabase
        .from('sessions_with_profiles')
        .select('*')
        .eq('id', sessionId)
        .single()
      if (!mounted || !full) return
      const mapped = mapRow(full)
      setSessions(prev => [...prev.filter(s => s.id !== mapped.id), mapped])
    }

    // Real-time: subscribe to session AND profile changes
    channelRef.current = supabase
      .channel(`live-sessions-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        async (payload) => {
          if (!mounted) return

          if (payload.eventType === 'DELETE') {
            setSessions(prev => prev.filter(s => s.id !== payload.old.id || s.isSeeded))
            return
          }

          const row = payload.new
          if (!row) return
          if (row.user_id === user.id) return
          if (blockedIds.has(row.user_id)) return

          if (!ACTIVE_STATUSES.includes(row.status)) {
            setSessions(prev => prev.filter(s => s.id !== row.id || s.isSeeded))
            return
          }

          await refetchSession(row.id)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        async (payload) => {
          if (!mounted) return
          const updatedUserId = payload.new?.id
          if (!updatedUserId || updatedUserId === user.id) return
          // Find all sessions belonging to this user and refresh them
          setSessions(prev => {
            const affectedIds = prev.filter(s => s.userId === updatedUserId).map(s => s.id)
            affectedIds.forEach(id => refetchSession(id))
            return prev
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
  }, [user, userProfile, browseCountry, blockedIds, myCountry])

  return { sessions, loading }
}
