import { useState } from 'react'
import { DEMO_MATCH_PROFILES } from '@/demo/mockData'
import ProfileCard from '@/components/match/ProfileCard'
import MatchModal from '@/components/match/MatchModal'
import WeeklyDigestCard from '@/components/digest/WeeklyDigestCard'
import { useWeeklyDigest } from '@/hooks/useWeeklyDigest'
import styles from './MatchScreen.module.css'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

const FILTERS = ['All', 'Meet now', 'Today', 'This week']
const LOOKING  = ['All', 'Date', 'Chat', 'Meet now']

export default function MatchScreen() {
  const [profiles, setProfiles]     = useState(DEMO_MATCH_PROFILES)
  const [speedFilter, setSpeed]     = useState('All')
  const [lookingFilter, setLooking] = useState('All')
  const [likedCount, setLikedCount] = useState(0)
  const [matchedProfile, setMatched] = useState(null)
  const { showDigest, digest, dismissDigest } = useWeeklyDigest()

  // Simulate ~50% chance of mutual match in demo
  const handleLike = (id) => {
    const profile = profiles.find(p => p.id === id)
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, liked: true } : p))
    setLikedCount(c => c + 1)
    if (Math.random() > 0.5) {
      setTimeout(() => setMatched(profile), 600)
    }
  }

  const filtered = profiles.filter(p => {
    const speedOk   = speedFilter  === 'All' || p.meetSpeed   === speedFilter
    const lookingOk = lookingFilter === 'All' || p.lookingFor  === lookingFilter
    return speedOk && lookingOk
  })

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <img src={LOGO_URL} alt="IMOUTNOW" className={styles.logo} />
        <span className={styles.headerTitle}>Discover</span>
        {likedCount > 0
          ? <span className={styles.likedCount}>❤️ {likedCount}</span>
          : <div style={{ width: 48 }} />
        }
      </div>

      {/* Filter bar */}
      <div className={styles.filters}>
        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>Speed</span>
          <div className={styles.filterChips}>
            {FILTERS.map(f => (
              <button
                key={f}
                className={`${styles.filterChip} ${speedFilter === f ? styles.filterActive : ''}`}
                onClick={() => setSpeed(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>Looking for</span>
          <div className={styles.filterChips}>
            {LOOKING.map(f => (
              <button
                key={f}
                className={`${styles.filterChip} ${lookingFilter === f ? styles.filterActive : ''}`}
                onClick={() => setLooking(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className={styles.scroll}>
        {showDigest && (
          <WeeklyDigestCard
            users={digest}
            onDismiss={dismissDigest}
          />
        )}

        {filtered.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🔍</span>
            <p className={styles.emptyText}>No profiles match</p>
            <p className={styles.emptySub}>Try adjusting your filters</p>
          </div>
        )}

        <div className={styles.grid}>
          {filtered.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onLike={handleLike}
            />
          ))}
        </div>
      </div>

      {matchedProfile && (
        <MatchModal
          profile={matchedProfile}
          onChat={() => setMatched(null)}
          onClose={() => setMatched(null)}
        />
      )}
    </div>
  )
}
