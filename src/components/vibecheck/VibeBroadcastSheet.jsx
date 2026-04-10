import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './VibeBroadcastSheet.module.css'

const VIBES = [
  { value: 'coffee',   emoji: '☕', label: 'Feeling like a coffee',    color: '#C8874A' },
  { value: 'hangout',  emoji: '👋', label: 'Who wants to hang out',    color: '#8DC63F' },
  { value: 'drink',    emoji: '🍸', label: 'Who wants to buy me a drink', color: '#A78BFA' },
  { value: 'party',    emoji: '🎉', label: 'Who wants to party',        color: '#F472B6' },
  { value: 'bite',     emoji: '🍜', label: 'Who wants to grab a bite',  color: '#F59E0B' },
]

export default function VibeBroadcastSheet({ open, onClose, userId, city }) {
  const [selected, setSelected] = useState(null)
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleSend = async () => {
    if (!selected || loading) return
    setLoading(true)
    try {
      if (supabase && userId) {
        await supabase.from('vibe_broadcasts').upsert({
          user_id:    userId,
          city:       city ?? null,
          vibe:       selected.value,
          label:      selected.label,
          emoji:      selected.emoji,
          expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'user_id' })
      }
    } catch { /* non-fatal — show confirmation anyway */ }
    setLoading(false)
    setSent(true)
  }

  const handleClose = () => {
    setSelected(null)
    setSent(false)
    setLoading(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={styles.sheet}>
        <div className={styles.handle} onClick={handleClose} />

        {sent ? (
          /* ── Confirmation ── */
          <div className={styles.confirmed}>
            <span className={styles.confirmedEmoji}>{selected.emoji}</span>
            <h2 className={styles.confirmedTitle}>Vibe is out!</h2>
            <p className={styles.confirmedSub}>
              Everyone in {city ? <strong>{city}</strong> : 'your city'} can see your vibe for the next 2 hours.
            </p>
            <button className={styles.doneBtn} onClick={handleClose}>Nice 🙌</button>
          </div>
        ) : (
          /* ── Vibe picker ── */
          <>
            <h2 className={styles.title}>What's your vibe?</h2>
            <p className={styles.sub}>
              Broadcast to everyone in {city ?? 'your city'} right now
            </p>

            <div className={styles.grid}>
              {VIBES.map(v => (
                <button
                  key={v.value}
                  className={`${styles.tile} ${selected?.value === v.value ? styles.tileSelected : ''}`}
                  style={{ '--vibe-color': v.color }}
                  onClick={() => setSelected(v)}
                >
                  <span className={styles.tileEmoji}>{v.emoji}</span>
                  <span className={styles.tileLabel}>{v.label}</span>
                </button>
              ))}
            </div>

            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!selected || loading}
            >
              {loading ? 'Sending…' : selected ? `Send "${selected.emoji} ${selected.label}"` : 'Pick a vibe first'}
            </button>

            <p className={styles.note}>Your vibe stays live for 2 hours then auto-expires</p>
          </>
        )}
      </div>
    </div>
  )
}
