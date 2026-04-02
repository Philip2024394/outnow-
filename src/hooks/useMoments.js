import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { DEMO_MOMENTS } from '@/demo/mockData'

function mapRow(row) {
  return {
    id:          row.id,
    userId:      row.user_id,
    sessionId:   row.session_id ?? null,
    photoURL:    row.photo_url ?? null,
    caption:     row.caption ?? '',
    emoji:       row.emoji ?? '✨',
    gradient:    row.gradient ?? 'linear-gradient(135deg,#667eea,#764ba2)',
    expiresAt:   row.expires_at ? new Date(row.expires_at).getTime() : null,
    createdAt:   row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    displayName: row.profile?.display_name ?? 'Someone',
    photoURL:    row.photo_url ?? row.profile?.photo_url ?? null,
  }
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

    async function fetchMoments() {
      const { data } = await supabase
        .from('moments')
        .select('*, profile:profiles(display_name, photo_url)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(30)

      if (!mounted) return
      setMoments((data ?? []).map(mapRow))
    }

    fetchMoments()

    channelRef.current = supabase
      .channel('moments-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'moments' }, async (payload) => {
        if (!mounted) return
        if (payload.eventType === 'DELETE') {
          setMoments(prev => prev.filter(m => m.id !== payload.old.id))
          return
        }
        // Re-fetch with profile join
        const { data } = await supabase
          .from('moments')
          .select('*, profile:profiles(display_name, photo_url)')
          .eq('id', payload.new.id)
          .single()
        if (!mounted || !data) return
        const mapped = mapRow(data)
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

  /**
   * Post a new moment. Optionally uploads a photo file to Storage first.
   */
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

    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()

    await supabase.from('moments').insert({
      user_id:    user.id,
      session_id: sessionId ?? null,
      photo_url:  photoUrl,
      caption:    caption ?? '',
      emoji:      emoji ?? '✨',
      gradient:   gradient ?? null,
      expires_at: expiresAt,
    })
  }

  return { moments, addMoment }
}
