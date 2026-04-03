import { useState } from 'react'
import { acceptMeetRequest, declineMeetRequest } from '@/services/meetService'
import Spinner from '@/components/ui/Spinner'
import styles from './MeetRequestBanner.module.css'


/**
 * User B sees this banner when someone sends them a "Let's Meet" request.
 * Accept → chat opens for both, greeting fires as first message.
 * Decline → silent dismiss.
 */
export default function MeetRequestBanner({ request, onAccepted, onDeclined, onViewProfile }) {
  const [loading,  setLoading]  = useState(null) // 'accept' | 'decline'
  const [greeting, setGreeting] = useState('')

  const handle = async (accept) => {
    setLoading(accept ? 'accept' : 'decline')
    try {
      if (accept) {
        await acceptMeetRequest(request.id)
        onAccepted?.(request, greeting.trim())
      } else {
        await declineMeetRequest(request.id)
        onDeclined?.(request)
      }
    } catch {
      // non-critical
    }
    setLoading(null)
  }

  return (
    <div className={styles.banner}>

      {/* ── Top row: avatar + name + buttons ── */}
      <div className={styles.bannerTop}>
        <div className={styles.left}>
          <div className={styles.avatarWrap}>
            <button className={styles.avatar} onClick={() => onViewProfile?.()} aria-label="View profile">
              {request.fromPhotoURL
                ? <img src={request.fromPhotoURL} alt="" className={styles.avatarImg} />
                : <span className={styles.avatarInitial}>
                    {request.fromDisplayName?.[0]?.toUpperCase() ?? '?'}
                  </span>
              }
            </button>
            <div className={styles.heartsField} aria-hidden="true">
              {[...Array(6)].map((_, i) => (
                <span key={i} className={styles.floatHeart} style={{ '--i': i }}>♥</span>
              ))}
            </div>
          </div>
          <div className={styles.text}>
            <span className={styles.name}>{request.fromDisplayName ?? 'Someone'}</span>
            <span className={styles.sub}>wants to meet up 💌</span>
          </div>
        </div>
        <button
          className={[styles.btn, styles.decline].join(' ')}
          onClick={() => handle(false)}
          disabled={!!loading}
        >
          {loading === 'decline' ? <Spinner size={14} /> : '✕'}
        </button>
      </div>

      {/* ── Greeting row ── */}
      <div className={styles.greetingRow}>
        <span className={styles.greetingHint}>Send a short message</span>
        <input
          className={styles.greetingInput}
          value={greeting}
          onChange={e => setGreeting(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && handle(true)}
          placeholder="Say something when you accept… (optional)"
          maxLength={100}
        />
        <button
          className={styles.sendBtn}
          onClick={() => handle(true)}
          disabled={!!loading}
        >
          {loading === 'accept' ? <Spinner size={14} color="#000" /> : "Let's Meet"}
        </button>
      </div>

    </div>
  )
}
