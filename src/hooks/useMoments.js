import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { DEMO_MOMENTS } from '@/demo/mockData'

function mapRow(row, profileMap = {}) {
  const profile = profileMap[row.user_id] ?? {}
  return {
    id:          row.id,
    userId:      row.user_id,
    sessionId:   row.session_id ?? null,
    photoURL:    row.photo_url ?? profile.photo_url ?? null,
    caption:     row.caption ?? '',
    emoji:       row.emoji ?? '✨',
    gradient:    row.gradient ?? 'linear-gradient(135deg,#667eea,#764ba2)',
    expiresAt:   row.expires_at ? new Date(row.expires_at).getTime() : null,
    createdAt:   row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    displayName: profile.display_name ?? 'Someone',
  }
}

// Fetch moments then enrich with profile data via separate query
async function fetchWithProfiles() {
  const { data: rows } = await supabase
    .from('moments')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(30)

  if (!rows?.length) return []

  // Get unique user ids and fetch their profiles
  const userIds = [...new Set(rows.map(r => r.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, photo_url')
    .in('id', userIds)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  return rows.map(r => mapRow(r, profileMap))
}

export function useMoments() {
  const { user } = useAuth()
  const [moments, setMoments] = useState([])
  const channelRef = useRef(null)

  useEffect(() => {
    if (!supabase) {
      setMoments(DEMO_MOMENTS)
      return
    }

    let mounted = true

    fetchWithProfiles().then(mapped => {
      if (mounted) setMoments(mapped)
    })

    channelRef.current = supabase
      .channel('moments-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'moments' }, async (payload) => {
        if (!mounted) return
        if (payload.eventType === 'DELETE') {
          setMoments(prev => prev.filter(m => m.id !== payload.old.id))
          return
        }
        // Re-fetch the changed row with profile
        const { data: row } = await supabase
          .from('moments')
          .select('*')
          .eq('id', payload.new.id)
          .single()
        if (!mounted || !row) return

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, photo_url')
          .eq('id', row.user_id)
        const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
        const mapped = mapRow(row, profileMap)

        setMoments(prev => {
          const without = prev.filter(m => m.id !== mapped.id)
          return [mapped, ...without]
        })
      })
      .subscribe()

    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user])

  async function addMoment({ emoji, gradient, caption, photoFile, sessionId }) {
    if (!supabase || !user) return

    let photoUrl = null

    if (photoFile) {
      const ext  = photoFile.name?.split('.').pop() || 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('moments')
        .upload(path, photoFile, { contentType: photoFile.type })
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('moments').getPublicUrl(path)
        photoUrl = publicUrl
      }
    }

    await supabase.from('moments').insert({
      user_id:    user.id,
      session_id: sessionId ?? null,
      photo_url:  photoUrl,
      caption:    caption ?? '',
      emoji:      emoji ?? '✨',
      gradient:   gradient ?? null,
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    })
  }

  return { moments, addMoment }
}
