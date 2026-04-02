import { supabase } from '@/lib/supabase'

const delay = (ms) => new Promise(r => setTimeout(r, ms))

export async function goLive({ lat, lng, placeId, placeName, venueCategory, activityType, activities, isGroup, groupSize, vibe, area }) {
  if (!supabase) {
    await delay(1200)
    return { sessionId: `demo-my-session-${Date.now()}` }
  }
  const { data, error } = await supabase.rpc('go_live', {
    p_activity_type:  activityType ?? null,
    p_activities:     activities ?? [],
    p_lat:            lat ?? null,
    p_lng:            lng ?? null,
    p_place_id:       placeId ?? null,
    p_place_name:     placeName ?? null,
    p_venue_category: venueCategory ?? null,
    p_duration_min:   parseInt(import.meta.env.VITE_SESSION_DURATION_MINUTES ?? '90', 10),
    p_is_group:       isGroup ?? false,
    p_group_size:     groupSize ?? null,
    p_vibe:           vibe ?? null,
    p_area:           area ?? null,
  })
  if (error) throw new Error(error.message)
  return { sessionId: data }
}

export async function endSession(sessionId) {
  if (!supabase) { await delay(400); return }
  const { error } = await supabase.rpc('end_session', { p_session_id: sessionId })
  if (error) throw new Error(error.message)
}

export async function confirmCheckIn(sessionId) {
  if (!supabase) { await delay(300); return }
  const { error } = await supabase
    .from('sessions')
    .update({ needs_check_in: false })
    .eq('id', sessionId)
  if (error) throw new Error(error.message)
}

export async function scheduleLive({ lat, lng, placeId, placeName, venueCategory, activityType, activities, durationMinutes, socialLink, scheduledFor, vibe }) {
  if (!supabase) {
    await delay(800)
    return { sessionId: `demo-my-scheduled-${Date.now()}`, scheduledFor }
  }
  const { data, error } = await supabase.rpc('schedule_live', {
    p_activity_type:  activityType ?? null,
    p_activities:     activities ?? [],
    p_lat:            lat ?? null,
    p_lng:            lng ?? null,
    p_place_id:       placeId ?? null,
    p_place_name:     placeName ?? null,
    p_venue_category: venueCategory ?? null,
    p_duration_min:   durationMinutes ?? 90,
    p_scheduled_for:  scheduledFor ? new Date(scheduledFor).toISOString() : null,
    p_social_link:    socialLink ?? null,
    p_vibe:           vibe ?? null,
  })
  if (error) throw new Error(error.message)
  return { sessionId: data, scheduledFor }
}

export async function cancelScheduled(sessionId) {
  if (!supabase) { await delay(300); return }
  await endSession(sessionId)
}
