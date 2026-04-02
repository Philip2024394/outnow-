import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

function mapNotif(row) {
  return {
    id:          row.id,
    type:        row.type,
    title:       row.title,
    body:        row.body ?? '',
    fromUserId:  row.from_user_id ?? null,
    sessionId:   row.session_id ?? null,
    read:        row.read ?? false,
    createdAt:   row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    // Profile join (if queried with from_profile)
    fromName:    row.from_profile?.display_name ?? null,
    fromPhoto:   row.from_profile?.photo_url ?? null,
  }
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [profileViews, setProfileViews] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!supabase || !user) return
    let mounted = true

    async function fetchAll() {
      // Fetch notifications
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*, from_profile:profiles!from_user_id(display_name, photo_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      // Fetch profile views (who viewed me — last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: views } = await supabase
        .from('profile_views')
        .select('*, viewer:profiles!viewer_id(display_name, photo_url, age, city)')
        .eq('viewed_id', user.id)
        .gte('created_at', weekAgo)
        .order('created_at', { ascending: false })

      if (!mounted) return
      const mapped = (notifs ?? []).map(mapNotif)
      setNotifications(mapped)
      setUnreadCount(mapped.filter(n => !n.read).length)
      setProfileViews((views ?? []).map(v => ({
        id:          v.id,
        viewerId:    v.viewer_id,
        displayName: v.viewer?.display_name ?? 'Someone',
        photoURL:    v.viewer?.photo_url ?? null,
        age:         v.viewer?.age ?? null,
        city:        v.viewer?.city ?? null,
        createdAt:   new Date(v.created_at).getTime(),
      })))
    }

    fetchAll()

    channelRef.current = supabase
      .channel(`notifs-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => { if (mounted) fetchAll() }
      )
      .subscribe()

    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user])

  async function markAllRead() {
    if (!supabase || !user) return
    await supabase.rpc('mark_notifications_read')
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return { notifications, profileViews, unreadCount, markAllRead }
}
