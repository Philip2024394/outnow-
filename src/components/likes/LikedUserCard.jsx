import styles from './LikedUserCard.module.css'
import { activityEmoji } from '@/firebase/collections'

export default function LikedUserCard({ user, onSelect }) {
  return (
    <div className={styles.card} onClick={() => onSelect?.(user)}>
      <div className={styles.avatarWrap}>
        {user.photoURL
          ? <img src={user.photoURL} alt={user.displayName} className={styles.avatar} />
          : <div className={styles.avatarFallback}>{user.emoji ?? user.displayName?.[0]?.toUpperCase()}</div>
        }
        {user.online && <span className={styles.onlineDot} />}
      </div>

      <div className={styles.info}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{user.displayName}</span>
          {user.age && <span className={styles.age}>{user.age}</span>}
        </div>
        <div className={styles.meta}>
          <span className={styles.emoji}>{activityEmoji(user.activityType)}</span>
          <span className={styles.area}>{user.area}</span>
        </div>
      </div>

      <div className={styles.arrow}>›</div>
    </div>
  )
}
