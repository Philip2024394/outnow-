import styles from './WeeklyDigestCard.module.css'
import { activityEmoji } from '@/firebase/collections'

export default function WeeklyDigestCard({ users = [], onDismiss, onViewProfile }) {
  if (users.length === 0) return null

  const day = new Date().getDay()
  const tonight = day === 5 ? 'tonight' : day === 6 ? 'this weekend' : 'this weekend'

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.fire}>🔥</span>
          <div>
            <p className={styles.title}>Liked you this week</p>
            <p className={styles.sub}>{users.length} people — some could be out {tonight}</p>
          </div>
        </div>
        <button className={styles.dismissBtn} onClick={onDismiss} aria-label="Dismiss">✕</button>
      </div>

      <div className={styles.rail}>
        {users.map((u) => (
          <button key={u.id} className={styles.userCard} onClick={() => onViewProfile?.(u)}>
            <div className={styles.avatarWrap}>
              {u.photoURL
                ? <img src={u.photoURL} alt={u.displayName} className={styles.avatarImg} />
                : <span className={styles.avatarEmoji}>{u.emoji ?? u.displayName?.[0]?.toUpperCase()}</span>
              }
              {u.online && <span className={styles.onlineDot} />}
              <span className={styles.activityBadge}>{activityEmoji(u.activityType)}</span>
            </div>
            <span className={styles.userName}>{u.displayName?.split(' ')[0]}</span>
            <span className={styles.userArea}>{u.area ?? ''}</span>
          </button>
        ))}
      </div>

      <div className={styles.footer}>
        <span className={styles.footerDot} />
        <span className={styles.footerText}>Hit I'M OUT NOW to let them know you're out tonight</span>
      </div>
    </div>
  )
}
