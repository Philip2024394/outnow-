import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import { DEMO_LIKED_USERS } from '@/demo/mockData'
import styles from './ProfileScreen.module.css'

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

const SETTINGS_ROWS = [
  { icon: '🔔', label: 'Notifications', sub: 'Manage alerts' },
  { icon: '🔒', label: 'Privacy', sub: 'Who can see you' },
  { icon: '🚫', label: 'Blocked Users', sub: 'Manage blocks' },
  { icon: '💬', label: 'Help & Feedback', sub: 'Get support' },
  { icon: '⭐', label: 'Rate IMOUTNOW', sub: 'Leave a review' },
]

export default function ProfileScreen() {
  const { user, userProfile } = useAuth()
  const [selectedActivities, setSelectedActivities] = useState(['drinks', 'coffee', 'food'])
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(userProfile?.displayName ?? user?.displayName ?? 'You')
  const [age, setAge] = useState('28')
  const [bio, setBio] = useState('Always down for spontaneous plans 🌆')

  const toggleActivity = (id) => {
    setSelectedActivities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const handleSignOut = () => {
    if (IS_DEMO) {
      alert('Sign out disabled in demo mode.')
      return
    }
    import('@/services/authService').then(m => m.signOutUser?.())
  }

  const likesCount = IS_DEMO ? DEMO_LIKED_USERS.length : 0

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <img src={LOGO_URL} alt="IMOUTNOW" className={styles.logo} />
        <span className={styles.headerTitle}>Profile</span>
        <button className={styles.editBtn} onClick={() => setEditingName(true)}>Edit</button>
      </div>

      <div className={styles.scroll}>
        {/* Avatar + identity */}
        <div className={styles.heroSection}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>
              {user?.photoURL
                ? <img src={user.photoURL} alt={name} className={styles.avatarImg} />
                : <span className={styles.avatarInitial}>{name?.[0]?.toUpperCase() ?? '?'}</span>
              }
            </div>
            <button className={styles.cameraBtn} aria-label="Change photo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
          </div>

          {editingName ? (
            <input
              className={styles.nameInput}
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => setEditingName(false)}
              autoFocus
            />
          ) : (
            <h1 className={styles.name} onClick={() => setEditingName(true)}>{name}</h1>
          )}

          <div className={styles.ageRow}>
            <span className={styles.ageLabel}>Age</span>
            <input
              className={styles.ageInput}
              value={age}
              onChange={e => setAge(e.target.value)}
              maxLength={3}
              inputMode="numeric"
              placeholder="--"
            />
          </div>

          {/* Stats row */}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>12</span>
              <span className={styles.statLabel}>Sessions</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>{likesCount}</span>
              <span className={styles.statLabel}>Likes</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>4</span>
              <span className={styles.statLabel}>Meetups</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>About</span>
          </div>
          <textarea
            className={styles.bioInput}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell people what you're about…"
            rows={3}
            maxLength={150}
          />
          <span className={styles.bioCount}>{bio.length}/150</span>
        </div>

        {/* Activity preferences */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>I'm into</span>
            <span className={styles.sectionSub}>Tap to select</span>
          </div>
          <div className={styles.activitiesGrid}>
            {ACTIVITY_TYPES.map(a => (
              <button
                key={a.id}
                className={`${styles.activityChip} ${selectedActivities.includes(a.id) ? styles.activityActive : ''}`}
                onClick={() => toggleActivity(a.id)}
              >
                <span className={styles.activityEmoji}>{a.emoji}</span>
                <span className={styles.activityLabel}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings rows */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Settings</span>
          </div>
          <div className={styles.settingsList}>
            {SETTINGS_ROWS.map(row => (
              <button key={row.label} className={styles.settingsRow}>
                <span className={styles.settingsIcon}>{row.icon}</span>
                <div className={styles.settingsText}>
                  <span className={styles.settingsLabel}>{row.label}</span>
                  <span className={styles.settingsSub}>{row.sub}</span>
                </div>
                <span className={styles.settingsChevron}>›</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <div className={styles.section}>
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            Sign Out
          </button>
          <p className={styles.version}>IMOUTNOW v0.1 · demo mode</p>
        </div>
      </div>
    </div>
  )
}
