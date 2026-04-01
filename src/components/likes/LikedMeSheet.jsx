import BottomSheet from '@/components/ui/BottomSheet'
import LikedUserCard from './LikedUserCard'
import { DEMO_LIKED_USERS } from '@/demo/mockData'
import styles from './LikedMeSheet.module.css'

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

export default function LikedMeSheet({ open, onClose, likedUsers }) {
  const users = IS_DEMO ? DEMO_LIKED_USERS : (likedUsers ?? [])
  const onlineCount = users.filter(u => u.online).length

  return (
    <BottomSheet open={open} onClose={onClose} title="">
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.title}>People who liked you</span>
          {onlineCount > 0 && (
            <span className={styles.onlineBadge}>
              <span className={styles.badgeDot} />
              {onlineCount} online
            </span>
          )}
        </div>
        <p className={styles.subtitle}>
          {users.length > 0
            ? `${users.length} ${users.length === 1 ? 'person' : 'people'} want to meet up`
            : 'No likes yet — go live to be discovered'}
        </p>
      </div>

      <div className={styles.list}>
        {users.map(user => (
          <LikedUserCard key={user.id} user={user} onSelect={onClose} />
        ))}
        {users.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>💚</span>
            <p>When someone likes your live session, they'll appear here.</p>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
