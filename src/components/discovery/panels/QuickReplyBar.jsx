import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import styles from './QuickReplyBar.module.css'

const REACTIONS = [
  { emoji: '👍', label: 'Nice' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '😍', label: 'Wow' },
  { emoji: '🙈', label: 'Shy' },
  { emoji: '👋', label: 'Hey' },
  { emoji: '🔥', label: 'Hot' },
]

export default function QuickReplyBar({ targetSession, showToast, onGuestAction }) {
  const { user } = useAuth()
  const [sent, setSent] = useState(null) // emoji that was sent

  const handleReact = async (reaction) => {
    if (!user?.id) { onGuestAction?.(); return }
    if (sent) return

    setSent(reaction.emoji)

    if (supabase && targetSession?.userId) {
      // Insert as a quick-reply message in the messages/meet_requests table
      await supabase.from('quick_replies').insert({
        from_user:   user.id,
        to_user:     targetSession.userId,
        session_id:  targetSession.id,
        emoji:       reaction.emoji,
        label:       reaction.label,
        created_at:  new Date().toISOString(),
      })
    }

    showToast?.(`${reaction.emoji} Sent to ${targetSession?.displayName ?? 'them'}!`, 'success')

    // Reset after 3s so they can send another
    setTimeout(() => setSent(null), 3000)
  }

  return (
    <div className={styles.bar}>
      {REACTIONS.map(r => (
        <button
          key={r.emoji}
          className={`${styles.reactionBtn} ${sent === r.emoji ? styles.reactionBtnSent : ''}`}
          onClick={() => handleReact(r)}
          aria-label={r.label}
          disabled={!!sent}
        >
          <span className={styles.reactionEmoji}>{r.emoji}</span>
          {sent === r.emoji && <span className={styles.sentPop}>✓</span>}
        </button>
      ))}
    </div>
  )
}
