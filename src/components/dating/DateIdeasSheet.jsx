import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { DATE_IDEAS, SECTION_LABELS, sendDateInvite } from '@/services/dateInviteService'
import styles from './DateIdeasSheet.module.css'

const SECTION_ORDER = ['culture', 'outdoor', 'social', 'dining']

function FingerprintIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a9 9 0 0 0-9 9" />
      <path d="M12 3a9 9 0 0 1 9 9" />
      <path d="M12 7a5 5 0 0 0-5 5" />
      <path d="M12 7a5 5 0 0 1 5 5" />
      <path d="M12 11a1 1 0 0 0-1 1v3" />
      <path d="M12 11a1 1 0 0 1 1 1v3" />
      <path d="M9 17a4 4 0 0 0 6 0" />
      <path d="M7 14c0 3 2 5 5 6" />
      <path d="M17 14c0 3-2 5-5 6" />
    </svg>
  )
}

export default function DateIdeasSheet({ open, _forceOpen = false, targetSession, onClose }) {
  const { user } = useAuth()
  const [modalIdea, setModalIdea] = useState(null)
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)

  const openModal  = (idea) => { setModalIdea(idea); setSent(false) }
  const closeModal = ()     => { setModalIdea(null); setSent(false); setSending(false) }

  const handleInvite = async () => {
    if (sending) return
    setSending(true)
    await sendDateInvite({
      fromUserId:   user?.id ?? user?.uid ?? 'demo',
      fromName:     user?.displayName ?? 'Someone',
      toUserId:     targetSession?.userId ?? targetSession?.id ?? 'unknown',
      ideaId:       modalIdea?.id,
      proposedDate: null,
      proposedTime: null,
    })
    setSending(false)
    setSent(true)
  }

  if (!open && !_forceOpen) return null

  return (
    <>
      {/* ── LEFT DRAWER ── */}
      <div
        className={styles.drawerOverlay}
        onClick={(e) => { if (e.target === e.currentTarget && !modalIdea) onClose() }}
      >
        <div className={styles.drawer}>
          {/* Header */}
          <div className={styles.drawerHeader}>
            <div className={styles.drawerTitleWrap}>
              <span className={styles.drawerTitle}>💕 Date Ideas</span>
              <span className={styles.drawerSubtitle}>Simply select and invite</span>
            </div>
            <button className={styles.drawerClose} onClick={onClose} aria-label="Close">✕</button>
          </div>

          {/* Scrollable grid */}
          <div className={styles.drawerBody}>
            {SECTION_ORDER.map(sec => {
              const ideas = DATE_IDEAS.filter(d => d.section === sec)
              if (!ideas.length) return null
              return (
                <div key={sec}>
                  <div className={styles.sectionLabel}>{SECTION_LABELS[sec]}</div>
                  <div className={styles.grid}>
                    {ideas.map(idea => (
                      <div key={idea.id} className={styles.card} onClick={() => openModal(idea)}>
                        <div className={styles.cardImgWrap}>
                          <img src={idea.image_url} alt={idea.title} className={styles.cardImg} />
                          <div className={styles.cardOverlay}>
                            <div className={styles.cardNameWrap}>
                              <span className={styles.cardName}>{idea.title}</span>
                              <span className={styles.cardCount}>💕 {idea.popularity} dates planned</span>
                            </div>
                            <span className={styles.cardStars}>
                              {'★'.repeat(Math.min(5, Math.max(3, Math.round(idea.popularity / 80))))}{'☆'.repeat(Math.max(0, 5 - Math.min(5, Math.max(3, Math.round(idea.popularity / 80)))))}
                            </span>
                          </div>
                          <button
                            className={styles.fingerprintBtn}
                            onClick={(e) => { e.stopPropagation(); openModal(idea) }}
                            aria-label={`Open ${idea.title}`}
                          >
                            <FingerprintIcon />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── CENTER MODAL — idea detail + invite ── */}
      {modalIdea && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className={styles.modal}>
            {sent ? (
              /* ── Sent state ── */
              <div className={styles.sentWrap}>
                <span className={styles.sentIcon}>💌</span>
                <p className={styles.sentTitle}>Invite Sent!</p>
                <p className={styles.sentSub}>
                  Your invite for <strong>{modalIdea.title}</strong> has been sent
                  {targetSession ? ` to ${targetSession.displayName}` : ''}.
                </p>
                <button className={styles.inviteBtn} onClick={closeModal}>Done</button>
              </div>
            ) : (
              /* ── Idea detail ── */
              <>
                <div className={styles.modalSpacer} />
                <div className={styles.modalBody}>
                  <div className={styles.modalHeader}>
                    <span className={styles.modalHeaderIcon}>♥</span>
                    <span className={styles.modalHeaderTitle}>Date Idea</span>
                    <span className={styles.modalHeaderStars}>
                      {'★'.repeat(Math.min(5, Math.max(3, Math.round(modalIdea.popularity / 80))))}{'☆'.repeat(Math.max(0, 5 - Math.min(5, Math.max(3, Math.round(modalIdea.popularity / 80)))))}
                    </span>
                  </div>
                  <img src={modalIdea.image_url} alt={modalIdea.title} className={styles.modalIdeaImg} />
                  <p className={styles.modalTitle}>{modalIdea.title}</p>
                  <p className={styles.modalDesc}>{modalIdea.description}</p>
                  <button
                    className={styles.inviteBtn}
                    disabled={sending}
                    onClick={handleInvite}
                  >
                    {[...Array(10)].map((_, i) => (
                      <span key={i} className={styles.floatHeart} style={{
                        '--x':    `${5 + (i * 37 + i * i * 13) % 88}%`,
                        '--d':    `${(i * 0.31 + (i % 3) * 0.18).toFixed(2)}s`,
                        '--s':    `${0.7 + (i % 4) * 0.15}`,
                        '--drift':`${-18 + (i * 29 + 7) % 36}px`,
                        '--dur':  `${1.4 + (i % 3) * 0.35}s`,
                      }}>♥</span>
                    ))}
                    {sending ? 'Sending…' : '💕 Invite Me'}
                  </button>
                  <button className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
