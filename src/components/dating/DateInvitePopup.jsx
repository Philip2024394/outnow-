import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { acceptDateInvite, declineDateInvite, DATE_IDEAS } from '@/services/dateInviteService'
import styles from './DateInvitePopup.module.css'

/**
 * Slides in from bottom when User B receives a date invite.
 * Props:
 *   invite  — { id, from_user_id, idea_id, proposed_date, proposed_time, profiles: { display_name, photo_url, age, city } }
 *   onAccept(invite) — called after accept; parent should open chat
 *   onDismiss()
 */
export default function DateInvitePopup({ invite, onAccept, onDismiss }) {
  const [phase,    setPhase]    = useState('enter')  // 'enter' | 'exit'
  const [loading,  setLoading]  = useState(false)

  const idea    = DATE_IDEAS.find(d => d.id === invite?.idea_id) ?? DATE_IDEAS[0]
  const profile = invite?.profiles ?? {}
  const name    = profile.display_name ?? 'Someone'
  const age     = profile.age
  const city    = profile.city

  // Auto-start exit animation — popup stays until user acts
  useEffect(() => {
    if (phase === 'exit') {
      const t = setTimeout(onDismiss, 500)
      return () => clearTimeout(t)
    }
  }, [phase, onDismiss])

  const handleAccept = async () => {
    setLoading(true)
    await acceptDateInvite(invite.id, {
      fromUserId:   invite.from_user_id,
      acceptorName: profile.display_name ?? 'Someone',
      ideaId:       invite.idea_id,
    })
    setLoading(false)
    onAccept?.(invite)
  }

  const handleDecline = async () => {
    await declineDateInvite(invite.id)
    setPhase('exit')
  }

  if (!invite) return null

  return createPortal(
    <div className={`${styles.popup} ${phase === 'exit' ? styles.popupExit : ''}`}>
      {/* Date idea image banner */}
      <div className={styles.ideaBanner}>
        <img src={idea.image_url} alt={idea.title} className={styles.ideaBannerImg} />
        <div className={styles.ideaBannerOverlay}>
          <span className={styles.ideaBannerTag}>💕 Date Invite</span>
          <span className={styles.ideaBannerTitle}>{idea.title}</span>
        </div>
      </div>

      {/* Inviter info */}
      <div className={styles.inviterRow}>
        <div className={styles.inviterAvatar}>
          {profile.photo_url
            ? <img src={profile.photo_url} alt={name} className={styles.inviterImg} />
            : <span className={styles.inviterInitial}>{name[0]}</span>
          }
        </div>
        <div className={styles.inviterInfo}>
          <span className={styles.inviterName}>{name}{age ? `, ${age}` : ''}</span>
          <span className={styles.inviterMeta}>
            has invited you on a date
            {city ? ` · 📍 ${city}` : ''}
          </span>
        </div>
      </div>

      {/* Proposed time if set */}
      {(invite.proposed_date || invite.proposed_time) && (
        <div className={styles.proposedTime}>
          {invite.proposed_date && (
            <span>📅 {new Date(invite.proposed_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          )}
          {invite.proposed_time && <span>🕐 {invite.proposed_time}</span>}
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={styles.acceptBtn}
          onClick={handleAccept}
          disabled={loading}
        >
          {loading ? '…' : '💕 Accept — Open Chat'}
        </button>
        <button className={styles.declineBtn} onClick={handleDecline}>
          Not this time
        </button>
      </div>
    </div>,
    document.body
  )
}
