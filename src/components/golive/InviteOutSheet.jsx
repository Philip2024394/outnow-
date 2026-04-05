import { useState } from 'react'
import { ACTIVITY_TYPES, ACTIVITY_CATEGORIES } from '@/firebase/collections'
import styles from './InviteOutSheet.module.css'

const VIBES = [
  { key: 'party',      label: 'Party',    emoji: '🎉' },
  { key: 'chill',      label: 'Chill',    emoji: '😎' },
  { key: 'networking', label: 'Network',  emoji: '💼' },
  { key: 'dates',      label: 'Dating',   emoji: '❤️' },
  { key: 'workout',    label: 'Active',   emoji: '💪' },
  { key: 'culture',    label: 'Culture',  emoji: '🎨' },
]

const STATUS_OPTIONS = [
  {
    id: 'live',
    emoji: '🟢',
    label: "I'm Out Now",
    sub: 'Go live — appear on the map right now',
    color: '#8DC63F',
    bg: 'rgba(141,198,63,0.1)',
    border: 'rgba(141,198,63,0.4)',
  },
  {
    id: 'invite',
    emoji: '🟡',
    label: 'Invite Out',
    sub: "Looking for plans — let others invite you",
    color: '#F5C518',
    bg: 'rgba(245,197,24,0.1)',
    border: 'rgba(245,197,24,0.4)',
  },
]

// currentStatus: 'invite' | 'live' | null
export default function InviteOutSheet({ open, onClose, onPost, onGoLive, currentStatus = null }) {
  const [step,             setStep]             = useState(0)   // 0 = status pick, 1 = activity/details
  const [chosenStatus,     setChosenStatus]     = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [activity,         setActivity]         = useState(null)
  const [message,          setMessage]          = useState('')
  const [vibe,             setVibe]             = useState(null)
  const [loading,          setLoading]          = useState(false)

  function reset() {
    setStep(0); setChosenStatus(null); setSelectedCategory(null)
    setActivity(null); setMessage(''); setVibe(null)
    setLoading(false)
  }

  function handleClose() { reset(); onClose() }

  function pickStatus(id) {
    setChosenStatus(id)
    setStep(1)
  }

  function goBack() {
    setStep(0)
    setSelectedCategory(null)
    setActivity(null)
  }

  async function handleConfirm() {
    if (loading) return
    setLoading(true)
    try {
      if (chosenStatus === 'invite') {
        await onPost?.(activity, message)
      } else {
        onGoLive?.()
      }
      reset()
      onClose()
    } catch { /* silent */ }
    setLoading(false)
  }

  if (!open) return null

  const chosen = STATUS_OPTIONS.find(s => s.id === chosenStatus)
  const canConfirm = true

  // Filter out current active status ('live' or 'invite')
  const visibleOptions = STATUS_OPTIONS.filter(s => s.id !== currentStatus)

  return (
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={handleClose} />

      <div className={styles.sheet}>
        <div className={styles.handle} onClick={handleClose} />

        {/* ── Step 0: Status selection ── */}
        <div className={`${styles.stepPane} ${step === 0 ? styles.stepVisible : styles.stepHidden}`}>
          <div className={styles.scrollContent}>
            <div className={styles.header}>
              <div className={styles.yellowDot} />
              <h2 className={styles.title}>Want to go out?</h2>
            </div>
            <p className={styles.sub}>
              Let people nearby know your plans. Pick how you want to appear on the map.
            </p>

            <div className={styles.statusCards}>
              {visibleOptions.map(({ id, emoji, label, sub, color, bg, border }) => (
                <button
                  key={id}
                  className={styles.statusCard}
                  style={{ '--s-color': color, '--s-bg': bg, '--s-border': border }}
                  onClick={() => pickStatus(id)}
                >
                  <div className={styles.statusCardLeft}>
                    <span className={styles.statusCardEmoji}>{emoji}</span>
                    <div className={styles.statusCardText}>
                      <span className={styles.statusCardLabel}>{label}</span>
                      <span className={styles.statusCardSub}>{sub}</span>
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.statusCardArrow}><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ))}
            </div>

            <p className={styles.disclaimer}>
              Your invite disappears when you go live or end your session.
            </p>
          </div>
        </div>

        {/* ── Step 1: Activity + details ── */}
        <div className={`${styles.stepPane} ${step === 1 ? styles.stepVisible : styles.stepHidden}`}>
          <div className={styles.scrollContent}>

            {/* Back + Status badge */}
            <div className={styles.stepHeader}>
              <button className={styles.backBtn} onClick={goBack}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              {chosen && (
                <span className={styles.statusBadge} style={{ color: chosen.color, borderColor: chosen.border, background: chosen.bg }}>
                  {chosen.emoji} {chosen.label}
                </span>
              )}
            </div>

            <div className={styles.stepHeading}>
              <h2 className={styles.title}>What are you up for?</h2>
              <p className={styles.sub}>Choose a category then pick your activity.</p>
            </div>

            {/* Category pills */}
            <div className={styles.section}>
              <span className={styles.label}>Category</span>
              <div className={styles.categoryRow}>
                {ACTIVITY_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`${styles.categoryPill} ${selectedCategory === cat.id ? styles.categoryPillActive : ''}`}
                    onClick={() => {
                      setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
                      setActivity(null)
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity chips */}
            {selectedCategory && (
              <div className={styles.section}>
                <span className={styles.label}>Activity</span>
                <div className={styles.chipGrid}>
                  {ACTIVITY_TYPES.filter(a => a.category === selectedCategory).map(a => (
                    <button
                      key={a.id}
                      type="button"
                      className={`${styles.chip} ${activity === a.id ? styles.chipActive : ''}`}
                      onClick={() => setActivity(a.id === activity ? null : a.id)}
                    >
                      {a.emoji ? `${a.emoji} ` : ''}{a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vibe */}
            <div className={styles.section}>
              <span className={styles.label}>Vibe</span>
              <div className={styles.vibeRow}>
                {VIBES.map(v => (
                  <button
                    key={v.key}
                    type="button"
                    className={`${styles.vibeChip} ${vibe === v.key ? styles.vibeChipActive : ''}`}
                    onClick={() => setVibe(prev => prev === v.key ? null : v.key)}
                  >
                    {v.emoji} {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional message */}
            <div className={styles.section}>
              <span className={styles.label}>Add a message (optional)</span>
              <textarea
                className={styles.textarea}
                placeholder="e.g. Anyone fancy a casual drink tonight?"
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={350}
                rows={2}
              />
            </div>

            {/* Confirm */}
            <button
              className={styles.confirmBtn}
              style={chosen ? { background: chosen.color, boxShadow: `0 4px 20px ${chosen.color}55` } : {}}
              onClick={handleConfirm}
              disabled={loading || !canConfirm}
            >
              {loading
                ? 'Setting up…'
                : chosenStatus === 'invite'
                ? '📍 Post Invite Out'
                : '🚀 Go Live Now'}
            </button>

            <button className={styles.skipBtn} onClick={handleClose}>
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
