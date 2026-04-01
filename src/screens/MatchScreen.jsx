import { useState } from 'react'
import { DEMO_MATCH_PROFILES } from '@/demo/mockData'
import ProfileCard from '@/components/match/ProfileCard'
import MatchModal from '@/components/match/MatchModal'
import FilterSheet from '@/components/match/FilterSheet'
import WeeklyDigestCard from '@/components/digest/WeeklyDigestCard'
import { useWeeklyDigest } from '@/hooks/useWeeklyDigest'
import styles from './MatchScreen.module.css'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

const DEFAULT_FILTERS = { speed: 'All', looking: 'All', distance: 'Any', age: 'Any' }

export default function MatchScreen() {
  const [profiles, setProfiles]   = useState(DEMO_MATCH_PROFILES)
  const [filters, setFilters]     = useState(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [likedCount, setLikedCount] = useState(0)
  const [matchedProfile, setMatched] = useState(null)
  const { showDigest, digest, dismissDigest } = useWeeklyDigest()

  const hasActiveFilters = filters.speed !== 'All' || filters.looking !== 'All'
    || filters.distance !== 'Any' || filters.age !== 'Any'

  const handleLike = (id) => {
    const profile = profiles.find(p => p.id === id)
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, liked: true } : p))
    setLikedCount(c => c + 1)
    if (Math.random() > 0.5) setTimeout(() => setMatched(profile), 600)
  }

  const filtered = profiles.filter(p => {
    const speedOk   = filters.speed   === 'All' || p.meetSpeed  === filters.speed
    const lookingOk = filters.looking === 'All' || p.lookingFor === filters.looking
    return speedOk && lookingOk
  })

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        {/* Logo — left aligned */}
        <img src={LOGO_URL} alt="IMOUTNOW" className={styles.logo} />

        <span className={styles.headerTitle}>Discover</span>

        {/* Right side — filter button + liked count */}
        <div className={styles.headerRight}>
          {likedCount > 0 && (
            <span className={styles.likedCount}>❤️ {likedCount}</span>
          )}
          <button
            className={`${styles.filterBtn} ${hasActiveFilters ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterOpen(true)}
            aria-label="Filter"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            {hasActiveFilters && <span className={styles.filterDot} />}
          </button>
        </div>
      </div>

      {/* Active filter chips summary — only when filters applied */}
      {hasActiveFilters && (
        <div className={styles.activeSummary}>
          {filters.speed   !== 'All'  && <span className={styles.activeChip}>{filters.speed}</span>}
          {filters.looking !== 'All'  && <span className={styles.activeChip}>{filters.looking}</span>}
          {filters.distance !== 'Any' && <span className={styles.activeChip}>{filters.distance}</span>}
          {filters.age      !== 'Any' && <span className={styles.activeChip}>{filters.age}</span>}
          <button className={styles.clearBtn} onClick={() => setFilters(DEFAULT_FILTERS)}>✕ Clear</button>
        </div>
      )}

      {/* Grid */}
      <div className={styles.scroll}>
        {showDigest && (
          <WeeklyDigestCard users={digest} onDismiss={dismissDigest} />
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
            <ProfileCard key={profile.id} profile={profile} onLike={handleLike} />
          ))}
        </div>
      </div>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

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
