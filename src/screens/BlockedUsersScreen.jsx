import { useState } from 'react'
import styles from './BlockedUsersScreen.module.css'

const DEMO_BLOCKED = [
  { id: 'b1', displayName: 'Alex K.',   emoji: '😐', area: 'Camden',    blockedAt: '3 days ago' },
  { id: 'b2', displayName: 'Tom R.',    emoji: '😶', area: 'Hackney',   blockedAt: '1 week ago' },
]

export default function BlockedUsersScreen({ onClose }) {
  const [blocked, setBlocked] = useState(DEMO_BLOCKED)
  const [unblocking, setUnblocking] = useState(null)

  const handleUnblock = async (id) => {
    setUnblocking(id)
    await new Promise(r => setTimeout(r, 700))
    setBlocked(prev => prev.filter(u => u.id !== id))
    setUnblocking(null)
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.title}>Blocked Users</span>
        {blocked.length > 0 && (
          <span className={styles.countBadge}>{blocked.length}</span>
        )}
      </div>

      {/* Info banner */}
      <div className={styles.infoBanner}>
        <span className={styles.infoIcon}>🚫</span>
        <p className={styles.infoText}>
          Blocked users will not appear in your feed — and you will not appear in theirs — unless you unblock them.
        </p>
      </div>

      <div className={styles.scroll}>
        {blocked.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>✅</span>
            <p className={styles.emptyText}>No blocked users</p>
            <p className={styles.emptySub}>Users you block will appear here</p>
          </div>
        ) : (
          blocked.map(u => (
            <div key={u.id} className={styles.row}>
              <div className={styles.avatar}>{u.emoji}</div>
              <div className={styles.meta}>
                <span className={styles.name}>{u.displayName}</span>
                <span className={styles.sub}>{u.area} · Blocked {u.blockedAt}</span>
              </div>
              <button
                className={`${styles.unblockBtn} ${unblocking === u.id ? styles.unblockBusy : ''}`}
                onClick={() => handleUnblock(u.id)}
                disabled={!!unblocking}
              >
                {unblocking === u.id ? '…' : 'Unblock'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
