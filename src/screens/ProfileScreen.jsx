import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMySession } from '@/hooks/useMySession'
import { useCoins } from '@/hooks/useCoins'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import ActivityIcon from '@/components/ui/ActivityIcon'
import { saveProfile, uploadAvatar } from '@/services/profileService'
import styles from './ProfileScreen.module.css'

const STATUS_CONFIG = {
  live:      { label: "I'M OUT NOW",   cls: 'bannerLive',      dot: 'dotLive'      },
  scheduled: { label: "I'M OUT LATER", cls: 'bannerScheduled', dot: 'dotScheduled' },
  online:    { label: "I'M ONLINE",    cls: 'bannerOnline',    dot: 'dotOnline'    },
}

export default function ProfileScreen({ onClose }) {
  const { user, userProfile } = useAuth()
  const { session: mySession } = useMySession()
  const { earn } = useCoins()

  // Initialise from Supabase profile (userProfile is loaded by AuthContext)
  const [selectedActivities, setSelectedActivities] = useState(userProfile?.activities ?? ['drinks', 'coffee', 'food'])
  const [name,     setName]     = useState(userProfile?.displayName ?? user?.displayName ?? 'You')
  const [age,      setAge]      = useState(userProfile?.age ? String(userProfile.age) : '')
  const [city,     setCity]     = useState(userProfile?.city ?? '')
  const [bio,      setBio]      = useState(userProfile?.bio ?? '')
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL ?? user?.photoURL ?? null)
  const [editMode, setEditMode] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [photoFile, setPhotoFile] = useState(null)  // raw File for upload
  const fileInputRef = useRef(null)

  // Re-sync if userProfile loads after mount
  useEffect(() => {
    if (!userProfile) return
    setName(userProfile.displayName ?? user?.displayName ?? 'You')
    setAge(userProfile.age ? String(userProfile.age) : '')
    setCity(userProfile.city ?? '')
    setBio(userProfile.bio ?? '')
    setPhotoURL(userProfile.photoURL ?? null)
    setSelectedActivities(userProfile.activities?.length ? userProfile.activities : ['drinks', 'coffee', 'food'])
  }, [userProfile]) // eslint-disable-line

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoURL(URL.createObjectURL(file))
  }

  const handleDone = async () => {
    setSaving(true)
    try {
      // Upload photo first if a new file was selected
      if (photoFile && user?.id) {
        await uploadAvatar(user.id, photoFile)
        earn('PROFILE_PHOTO')
      }
      // Save text fields
      await saveProfile({
        userId:     user?.id,
        displayName: name,
        age,
        bio,
        city,
        activities: selectedActivities,
      })
      if (bio.trim().length > 0)         earn('BIO_WRITTEN')
      if (selectedActivities.length > 0) earn('ACTIVITIES_SET')
    } catch { /* silent — profile saves best-effort */ }
    setSaving(false)
    setPhotoFile(null)
    setEditMode(false)
  }

  const statusKey = mySession?.status === 'active'    ? 'live'
                  : mySession?.status === 'scheduled' ? 'scheduled'
                  : 'online'
  const status = STATUS_CONFIG[statusKey]

  const toggleActivity = (id) =>
    setSelectedActivities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )

  return (
    <div className={styles.screen}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <button className={styles.homeBtn} onClick={onClose} aria-label="Back to map">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
        <span className={styles.headerTitle}>My Profile</span>
        <button
          className={`${styles.editBtn} ${editMode ? styles.editBtnActive : ''}`}
          disabled={saving}
          onClick={() => {
            if (editMode) { handleDone(); return }
            setEditMode(true)
          }}
        >
          {saving ? '…' : editMode ? 'Done' : 'Edit'}
        </button>
      </div>

      <div className={styles.scroll}>

        {/* ── Profile card ── */}
        <div className={styles.profileCard}>

          {/* Avatar */}
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>
              {photoURL
                ? <img src={photoURL} alt={name} className={styles.avatarImg} />
                : <span className={styles.avatarInitial}>{name?.[0]?.toUpperCase() ?? '?'}</span>
              }
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
            {editMode && (
              <button
                className={styles.cameraBtn}
                aria-label="Change photo"
                onClick={() => fileInputRef.current?.click()}
              >
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
              <span className={styles.identityText}>
                {[age, city].filter(Boolean).join(' · ') || 'Add age & city'}
              </span>
            )}
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
                maxLength={350}
              />
              <span className={styles.bioCount}>{bio.length}/350</span>
            </>
          ) : (
            <p className={styles.bioText}>{bio || <span className={styles.bioEmpty}>No bio yet — tap Edit to add one</span>}</p>
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
                <ActivityIcon activity={a} size={22} className={styles.activityEmoji} />
                <span className={styles.activityLabel}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
