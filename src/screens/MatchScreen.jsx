import { useState } from 'react'
import { DEMO_MATCH_PROFILES } from '@/demo/mockData'
import ProfileCard from '@/components/match/ProfileCard'
import DiscoveryCard from '@/components/discovery/DiscoveryCard'
import styles from './MatchScreen.module.css'

function toSession(p) {
  return {
    id:           p.id,
    displayName:  p.displayName,
    age:          p.age,
    photoURL:     p.photoURL ?? null,
    area:         p.area,
    status:       p.online ? 'active' : 'invite_out',
    activityType: p.activityType ?? p.firstMeet?.[0]?.toLowerCase() ?? null,
    message:      p.tagline ?? null,
    distanceKm:   p.distanceKm,
  }
}


export default function MatchScreen({ onClose }) {
  const [profiles] = useState(DEMO_MATCH_PROFILES)
  const [viewingProfile, setViewingProfile] = useState(null)

  return (
    <div className={styles.screen}>

      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>Discover</span>
        <button className={styles.homeBtn} onClick={onClose} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
      </div>

      <div className={styles.scroll}>

        <div className={styles.sectionDivider}>
          <span className={styles.sectionLabel}>All Members</span>
        </div>

        <div className={styles.grid}>
          {profiles.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onView={() => setViewingProfile(profile)}
            />
          ))}
        </div>
      </div>

      <DiscoveryCard
        open={!!viewingProfile}
        session={viewingProfile ? toSession(viewingProfile) : null}
        onClose={() => setViewingProfile(null)}
      />
    </div>
  )
}
