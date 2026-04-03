import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { DEMO_CONVERSATIONS } from '@/demo/mockData'

function mapConv(row, userId) {
  const isA = row.user_a_id === userId
  return {
    id: row.id,
    userId: isA ? row.user_b_id : row.user_a_id,
    displayName: (isA ? row.profile_b : row.profile_a)?.display_name ?? 'Unknown',
    photoURL: (isA ? row.profile_b : row.profile_a)?.photo_url ?? null,
    age: (isA ? row.profile_b : row.profile_a)?.age ?? null,
    area: (isA ? row.profile_b : row.profile_a)?.city ?? null,
    online: false,
    status: row.status,
    unread: isA ? (row.unread_a ?? 0) : (row.unread_b ?? 0),
    lastMessage: row.last_message,
    lastMessageTime: row.last_message_at ? new Date(row.last_message_at).getTime() : null,
    unlockedAt: row.unlocked_at ? new Date(row.unlocked_at).getTime() : null,
    openedAt: row.opened_at ? new Date(row.opened_at).getTime() : null,
    isUserA: isA,
    messages: [],
  }
}

export function useConversations() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const channelARef = useRef(null)
  const channelBRef = useRef(null)

  useEffect(() => {
    if (!supabase) {
      setConversations(DEMO_CONVERSATIONS)
      setLoading(false)
      return
    }

    if (!user) return

    let mounted = true

    async function fetchConvs() {
      const { data, error } = await supabase
        .from('conversations')
        .select(`*, profile_a:profiles!conversations_user_a_id_fkey(display_name,photo_url,age,city), profile_b:profiles!conversations_user_b_id_fkey(display_name,photo_url,age,city)`)
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (!mounted) return
      if (error) { setLoading(false); return }

      setConversations((data ?? []).map(row => mapConv(row, user.id)))
      setLoading(false)
    }

    fetchConvs()

    channelARef.current = supabase
      .channel(`convs-user-a-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `user_a_id=eq.${user.id}` },
        () => { if (mounted) fetchConvs() }
      )
      .subscribe()

    channelBRef.current = supabase
      .channel(`convs-user-b-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `user_b_id=eq.${user.id}` },
        () => { if (mounted) fetchConvs() }
      )
      .subscribe()

    return () => {
      mounted = false
      if (channelARef.current) {
        supabase.removeChannel(channelARef.current)
        channelARef.current = null
      }
      if (channelBRef.current) {
        supabase.removeChannel(channelBRef.current)
        channelBRef.current = null
      }
    }
  }, [user])

  function updateConversation(convId, updates) {
    setConversations(prev =>
      prev.map(conv => conv.id === convId ? { ...conv, ...updates } : conv)
    )
  }

  return { conversations, loading, setConversations, updateConversation }
}
