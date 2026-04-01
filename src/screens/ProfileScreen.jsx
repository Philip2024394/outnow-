import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMySession } from '@/hooks/useMySession'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import styles from './ProfileScreen.module.css'

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

const STATUS_CONFIG = {
  live:      { label: "I'M OUT NOW",   cls: 'bannerLive',      dot: 'dotLive'      },
  scheduled: { label: "I'M OUT LATER", cls: 'bannerScheduled', dot: 'dotScheduled' },
  online:    { label: "I'M ONLINE",    cls: 'bannerOnline',    dot: 'dotOnline'    },
}

const CITIES   = ['All Cities', 'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Edinburgh', 'Bristol', 'Liverpool', 'Sheffield']
const GENDERS  = ['Everyone', 'Men', 'Women', 'Non-binary']
const AGE_OPTS = ['Any Age', '18–24', '25–30', '31–35', '36–40', '40+']

export default function ProfileScreen() {
  const { user, userProfile } = useAuth()
  const { session: mySession } = useMySession()
  const [selectedActivities, setSelectedActivities] = useState(['drinks', 'coffee', 'food'])
  const [name, setName]     = useState(userProfile?.displayName ?? user?.displayName ?? 'You')
  const [age, setAge]       = useState('28')
  const [city, setCity]     = useState('London')
  const [bio, setBio]       = useState('Always down for spontaneous plans 🌆')
  const [editMode, setEditMode] = useState(false)

  // Discovery filters
  const [filterCity,   setFilterCity]   = useState('All Cities')
  const [filterGender, setFilterGender] = useState('Everyone')
  const [filterAge,    setFilterAge]    = useState('Any Age')

  const statusKey = mySession?.status === 'active'    ? 'live'
                  : mySession?.status === 'scheduled' ? 'scheduled'
                  : 'online'
  const status = STATUS_CONFIG[statusKey]

  const toggleActivity = (id) =>
    setSelectedActivities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )

  const handleSignOut = () => {
    if (IS_DEMO) { alert('Sign out disabled in demo mode.'); return }
    import('@/services/authService').then(m => m.signOutUser?.())
  }

  return (
    <div className={styles.screen}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>My Profile</span>
        <button
          className={`${styles.editBtn} ${editMode ? styles.editBtnActive : ''}`}
          onClick={() => setEditMode(v => !v)}
        >
          {editMode ? 'Done' : 'Edit'}
        </button>
      </div>

      {/* ── Discovery filter bar ── */}
      <div className={styles.filterBar}>
        {/* City — left */}
        <div className={styles.filterSelectWrap}>
          <svg className={styles.filterSelectIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <select
            className={styles.filterSelect}
            value={filterCity}
            onChange={e => setFilterCity(e.target.value)}
          >
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <svg className={styles.filterChevron} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        <div className={styles.filterDivider} />

        {/* Gender */}
        <div className={styles.filterSelectWrap}>
          <svg className={styles.filterSelectIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          <select
            className={styles.filterSelect}
            value={filterGender}
            onChange={e => setFilterGender(e.target.value)}
          >
            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <svg className={styles.filterChevron} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        <div className={styles.filterDivider} />

        {/* Age */}
        <div className={styles.filterSelectWrap}>
          <svg className={styles.filterSelectIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          </svg>
          <select
            className={styles.filterSelect}
            value={filterAge}
            onChange={e => setFilterAge(e.target.value)}
          >
            {AGE_OPTS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <svg className={styles.filterChevron} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      <div className={styles.scroll}>

        {/* ── Profile card ── */}
        <div className={styles.profileCard}>

          {/* Avatar */}
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>
              {user?.photoURL
                ? <img src={user.photoURL} alt={name} className={styles.avatarImg} />
                : <span className={styles.avatarInitial}>{name?.[0]?.toUpperCase() ?? '?'}</span>
              }
            </div>
            {editMode && (
              <button className={styles.cameraBtn} aria-label="Change photo">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
            )}
          </div>

          {/* Status banner */}
          <div className={`${styles.statusBanner} ${styles[status.cls]}`}>
            <span className={`${styles.statusDot} ${styles[status.dot]}`} />
            {status.label}
          </div>

          {/* Name */}
          {editMode
            ? <input className={styles.nameInput} value={name} onChange={e => setName(e.target.value)} autoFocus />
            : <h1 className={styles.name}>{name}</h1>
          }

          {/* Age · City */}
          <div className={styles.identityRow}>
            {editMode ? (
              <>
                <input
                  className={styles.inlineInput}
                  value={age}
                  onChange={e => setAge(e.target.value.replace(/\D/, ''))}
                  placeholder="Age"
                  inputMode="numeric"
                  maxLength={2}
                  style={{ width: 52 }}
                />
                <span className={styles.identitySep}>·</span>
                <input
                  className={styles.inlineInput}
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="City"
                  style={{ flex: 1 }}
                />
              </>
            ) : (
              <span className={styles.identityText}>{age} · {city}</span>
            )}
          </div>

          {/* Stats — sessions & meetups only */}
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statNum}>12</span>
              <span className={styles.statLabel}>Sessions</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNum}>4</span>
              <span className={styles.statLabel}>Meetups</span>
            </div>
          </div>
        </div>

        {/* ── Bio ── */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>About me</span>
          {editMode ? (
            <>
              <textarea
                className={styles.bioInput}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell people what you're about…"
                rows={3}
                maxLength={150}
              />
              <span className={styles.bioCount}>{bio.length}/150</span>
            </>
          ) : (
            <p className={styles.bioText}>{bio || <span className={styles.bioEmpty}>No bio yet</span>}</p>
          )}
        </div>

        {/* ── I'm out for ── */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>I&apos;m out for</span>
          <div className={styles.activitiesGrid}>
            {ACTIVITY_TYPES.map(a => (
              <button
                key={a.id}
                className={`${styles.activityChip} ${selectedActivities.includes(a.id) ? styles.activityActive : ''}`}
                onClick={editMode ? () => toggleActivity(a.id) : undefined}
                disabled={!editMode}
              >
                <span className={styles.activityEmoji}>{a.emoji}</span>
                <span className={styles.activityLabel}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Sign out ── */}
        <div className={styles.section}>
          <button className={styles.signOutBtn} onClick={handleSignOut}>Sign Out</button>
        </div>

      </div>
    </div>
  )
}
