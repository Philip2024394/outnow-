/**
 * In-app chat between passenger/customer and driver.
 * Real-time via Supabase with quick reply templates.
 */
import { supabase } from '@/lib/supabase'

const QUICK_REPLIES = {
  passenger: [
    'I\'m at the pickup point',
    'Please wait, coming down now',
    'Can you come to the lobby?',
    'I\'m wearing a red shirt',
    'How far are you?',
  ],
  driver: [
    'I\'m arriving in 2 minutes',
    'I\'m at the pickup location',
    'Traffic is heavy, please wait',
    'I\'m wearing a green jacket',
    'Food is picked up, on the way',
  ],
}

export { QUICK_REPLIES }

/**
 * Send a chat message.
 */
export async function sendMessage(bookingId, senderId, senderRole, text) {
  const message = {
    booking_id: bookingId,
    sender_id: senderId,
    sender_role: senderRole, // 'passenger' | 'driver'
    text: text.trim(),
    created_at: new Date().toISOString(),
  }

  if (!supabase) return { ...message, id: Date.now() }

  const { data, error } = await supabase
    .from('booking_messages')
    .insert(message)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get chat history for a booking.
 */
export async function getMessages(bookingId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('booking_messages')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })
  return data ?? []
}

/**
 * Subscribe to new messages in real-time.
 */
export function subscribeToMessages(bookingId, onMessage) {
  if (!supabase) return () => {}
  const ch = supabase
    .channel(`chat-${bookingId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'booking_messages',
      filter: `booking_id=eq.${bookingId}`,
    }, payload => onMessage(payload.new))
    .subscribe()
  return () => supabase.removeChannel(ch)
}
