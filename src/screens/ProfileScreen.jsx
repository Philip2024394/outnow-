import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMySession } from '@/hooks/useMySession'
import { useCoins } from '@/hooks/useCoins'
import { ACTIVITY_TYPES, ACTIVITY_CATEGORIES } from '@/firebase/collections'
import ActivityIcon from '@/components/ui/ActivityIcon'
import Toast from '@/components/ui/Toast'
import { saveProfile, uploadAvatar, uploadGalleryPhoto } from '@/services/profileService'
import GoOutSetup from './GoOutSetup'
import { clearPhotoViewCount } from '@/services/photoNudgeService'
import styles from './ProfileScreen.module.css'

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_MB    = 5
const MAX_BYTES = MAX_MB * 1024 * 1024

// { name, flag } — flag is the emoji flag for the country
const COUNTRIES = [
  { name: 'Afghanistan',             flag: '🇦🇫' },
  { name: 'Albania',                 flag: '🇦🇱' },
  { name: 'Algeria',                 flag: '🇩🇿' },
  { name: 'Andorra',                 flag: '🇦🇩' },
  { name: 'Angola',                  flag: '🇦🇴' },
  { name: 'Argentina',               flag: '🇦🇷' },
  { name: 'Armenia',                 flag: '🇦🇲' },
  { name: 'Australia',               flag: '🇦🇺' },
  { name: 'Austria',                 flag: '🇦🇹' },
  { name: 'Azerbaijan',              flag: '🇦🇿' },
  { name: 'Bahamas',                 flag: '🇧🇸' },
  { name: 'Bahrain',                 flag: '🇧🇭' },
  { name: 'Bangladesh',              flag: '🇧🇩' },
  { name: 'Belarus',                 flag: '🇧🇾' },
  { name: 'Belgium',                 flag: '🇧🇪' },
  { name: 'Belize',                  flag: '🇧🇿' },
  { name: 'Benin',                   flag: '🇧🇯' },
  { name: 'Bolivia',                 flag: '🇧🇴' },
  { name: 'Bosnia and Herzegovina',  flag: '🇧🇦' },
  { name: 'Botswana',                flag: '🇧🇼' },
  { name: 'Brazil',                  flag: '🇧🇷' },
  { name: 'Brunei',                  flag: '🇧🇳' },
  { name: 'Bulgaria',                flag: '🇧🇬' },
  { name: 'Burkina Faso',            flag: '🇧🇫' },
  { name: 'Cambodia',                flag: '🇰🇭' },
  { name: 'Cameroon',                flag: '🇨🇲' },
  { name: 'Canada',                  flag: '🇨🇦' },
  { name: 'Chile',                   flag: '🇨🇱' },
  { name: 'China',                   flag: '🇨🇳' },
  { name: 'Colombia',                flag: '🇨🇴' },
  { name: 'Congo',                   flag: '🇨🇬' },
  { name: 'Costa Rica',              flag: '🇨🇷' },
  { name: 'Croatia',                 flag: '🇭🇷' },
  { name: 'Cuba',                    flag: '🇨🇺' },
  { name: 'Cyprus',                  flag: '🇨🇾' },
  { name: 'Czech Republic',          flag: '🇨🇿' },
  { name: 'Denmark',                 flag: '🇩🇰' },
  { name: 'Dominican Republic',      flag: '🇩🇴' },
  { name: 'Ecuador',                 flag: '🇪🇨' },
  { name: 'Egypt',                   flag: '🇪🇬' },
  { name: 'El Salvador',             flag: '🇸🇻' },
  { name: 'Estonia',                 flag: '🇪🇪' },
  { name: 'Ethiopia',                flag: '🇪🇹' },
  { name: 'Fiji',                    flag: '🇫🇯' },
  { name: 'Finland',                 flag: '🇫🇮' },
  { name: 'France',                  flag: '🇫🇷' },
  { name: 'Georgia',                 flag: '🇬🇪' },
  { name: 'Germany',                 flag: '🇩🇪' },
  { name: 'Ghana',                   flag: '🇬🇭' },
  { name: 'Greece',                  flag: '🇬🇷' },
  { name: 'Guatemala',               flag: '🇬🇹' },
  { name: 'Honduras',                flag: '🇭🇳' },
  { name: 'Hungary',                 flag: '🇭🇺' },
  { name: 'Iceland',                 flag: '🇮🇸' },
  { name: 'India',                   flag: '🇮🇳' },
  { name: 'Indonesia',               flag: '🇮🇩' },
  { name: 'Iran',                    flag: '🇮🇷' },
  { name: 'Iraq',                    flag: '🇮🇶' },
  { name: 'Ireland',                 flag: '🇮🇪' },
  { name: 'Israel',                  flag: '🇮🇱' },
  { name: 'Italy',                   flag: '🇮🇹' },
  { name: 'Jamaica',                 flag: '🇯🇲' },
  { name: 'Japan',                   flag: '🇯🇵' },
  { name: 'Jordan',                  flag: '🇯🇴' },
  { name: 'Kazakhstan',              flag: '🇰🇿' },
  { name: 'Kenya',                   flag: '🇰🇪' },
  { name: 'Kosovo',                  flag: '🇽🇰' },
  { name: 'Kuwait',                  flag: '🇰🇼' },
  { name: 'Kyrgyzstan',              flag: '🇰🇬' },
  { name: 'Latvia',                  flag: '🇱🇻' },
  { name: 'Lebanon',                 flag: '🇱🇧' },
  { name: 'Libya',                   flag: '🇱🇾' },
  { name: 'Lithuania',               flag: '🇱🇹' },
  { name: 'Luxembourg',              flag: '🇱🇺' },
  { name: 'Malaysia',                flag: '🇲🇾' },
  { name: 'Maldives',                flag: '🇲🇻' },
  { name: 'Malta',                   flag: '🇲🇹' },
  { name: 'Mexico',                  flag: '🇲🇽' },
  { name: 'Moldova',                 flag: '🇲🇩' },
  { name: 'Monaco',                  flag: '🇲🇨' },
  { name: 'Mongolia',                flag: '🇲🇳' },
  { name: 'Montenegro',              flag: '🇲🇪' },
  { name: 'Morocco',                 flag: '🇲🇦' },
  { name: 'Mozambique',              flag: '🇲🇿' },
  { name: 'Myanmar',                 flag: '🇲🇲' },
  { name: 'Nepal',                   flag: '🇳🇵' },
  { name: 'Netherlands',             flag: '🇳🇱' },
  { name: 'New Zealand',             flag: '🇳🇿' },
  { name: 'Nicaragua',               flag: '🇳🇮' },
  { name: 'Nigeria',                 flag: '🇳🇬' },
  { name: 'North Macedonia',         flag: '🇲🇰' },
  { name: 'Norway',                  flag: '🇳🇴' },
  { name: 'Oman',                    flag: '🇴🇲' },
  { name: 'Pakistan',                flag: '🇵🇰' },
  { name: 'Panama',                  flag: '🇵🇦' },
  { name: 'Paraguay',                flag: '🇵🇾' },
  { name: 'Peru',                    flag: '🇵🇪' },
  { name: 'Philippines',             flag: '🇵🇭' },
  { name: 'Poland',                  flag: '🇵🇱' },
  { name: 'Portugal',                flag: '🇵🇹' },
  { name: 'Qatar',                   flag: '🇶🇦' },
  { name: 'Romania',                 flag: '🇷🇴' },
  { name: 'Russia',                  flag: '🇷🇺' },
  { name: 'Rwanda',                  flag: '🇷🇼' },
  { name: 'Saudi Arabia',            flag: '🇸🇦' },
  { name: 'Senegal',                 flag: '🇸🇳' },
  { name: 'Serbia',                  flag: '🇷🇸' },
  { name: 'Singapore',               flag: '🇸🇬' },
  { name: 'Slovakia',                flag: '🇸🇰' },
  { name: 'Slovenia',                flag: '🇸🇮' },
  { name: 'Somalia',                 flag: '🇸🇴' },
  { name: 'South Africa',            flag: '🇿🇦' },
  { name: 'South Korea',             flag: '🇰🇷' },
  { name: 'Spain',                   flag: '🇪🇸' },
  { name: 'Sri Lanka',               flag: '🇱🇰' },
  { name: 'Sudan',                   flag: '🇸🇩' },
  { name: 'Sweden',                  flag: '🇸🇪' },
  { name: 'Switzerland',             flag: '🇨🇭' },
  { name: 'Syria',                   flag: '🇸🇾' },
  { name: 'Taiwan',                  flag: '🇹🇼' },
  { name: 'Tanzania',                flag: '🇹🇿' },
  { name: 'Thailand',                flag: '🇹🇭' },
  { name: 'Tunisia',                 flag: '🇹🇳' },
  { name: 'Turkey',                  flag: '🇹🇷' },
  { name: 'Uganda',                  flag: '🇺🇬' },
  { name: 'Ukraine',                 flag: '🇺🇦' },
  { name: 'United Arab Emirates',    flag: '🇦🇪' },
  { name: 'United Kingdom',          flag: '🇬🇧' },
  { name: 'United States',           flag: '🇺🇸' },
  { name: 'Uruguay',                 flag: '🇺🇾' },
  { name: 'Uzbekistan',              flag: '🇺🇿' },
  { name: 'Venezuela',               flag: '🇻🇪' },
  { name: 'Vietnam',                 flag: '🇻🇳' },
  { name: 'Yemen',                   flag: '🇾🇪' },
  { name: 'Zambia',                  flag: '🇿🇲' },
  { name: 'Zimbabwe',                flag: '🇿🇼' },
]

function validateFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `"${file.name}" can't be uploaded. Accepted formats: JPG, PNG, WEBP.`
  }
  if (file.size > MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1)
    return `"${file.name}" is ${mb}MB — maximum file size is ${MAX_MB}MB.`
  }
  return null
}

// ── Inline help tip ──────────────────────────────────────────────────────────
function HelpTip({ text }) {
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)

  const toggle = useCallback(() => {
    setOpen(p => {
      if (!p) {
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setOpen(false), 6000)
      }
      return !p
    })
  }, [])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <span className={helpStyles.wrap}>
      <button className={helpStyles.btn} onClick={toggle} aria-label="Help" type="button">?</button>
      {open && <span className={helpStyles.tip}>{text}</span>}
    </span>
  )
}

// Inline CSS object for HelpTip — keeps it self-contained
const helpStyles = {
  wrap:  { display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative', verticalAlign: 'middle' },
  btn:   { width: 18, height: 18, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)', color: '#8DC63F', fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1, fontFamily: 'inherit', padding: 0 },
  tip:   { position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 60, background: '#1c1c1c', border: '1px solid rgba(141,198,63,0.25)', borderRadius: 12, padding: '10px 13px', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, whiteSpace: 'normal', width: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' },
}

// ── Required field validation ─────────────────────────────────────────────────
function validateProfile({ name, dobDay, dobMonth, dobYear, country, city }) {
  if (!name.trim())                          return 'Please enter your display name so others can find you.'
  if (!dobDay || !dobMonth || !dobYear)      return 'Please complete your date of birth — you must be 18 or over to use IMOUTNOW.'
  if (!country)                              return 'Please select your country so we can show you to the right people.'
  if (!city.trim())                          return 'Please add your city or area — without it you won\'t appear in map searches near you.'
  return null
}

const STATUS_CONFIG = {
  live:      { label: "I'M OUT NOW",   cls: 'bannerLive',      dot: 'dotLive'      },
  scheduled: { label: "I'M OUT LATER", cls: 'bannerScheduled', dot: 'dotScheduled' },
  online:    { label: "I'M ONLINE",    cls: 'bannerOnline',    dot: 'dotOnline'    },
}

export default function ProfileScreen({ onClose }) {
  const { user, userProfile } = useAuth()
  const { session: mySession } = useMySession()
  const { earn } = useCoins()

  const [selectedActivity, setSelectedActivity] = useState(
    userProfile?.activities?.[0] ?? null
  )
  const [name,    setName]    = useState(userProfile?.displayName ?? user?.displayName ?? 'You')
  const [country,    setCountry]    = useState(userProfile?.country ?? '')
  const [city,       setCity]       = useState(userProfile?.city ?? '')
  const [lookingFor, setLookingFor] = useState(userProfile?.lookingFor ?? '')
  const [bio,        setBio]        = useState(userProfile?.bio ?? '')

  // Status buttons
  const [pendingStatus,   setPendingStatus]   = useState(null) // 'im_out' | 'invite_out' | 'later_out'
  const [particles,       setParticles]       = useState([])
  const [showGoOutSetup,  setShowGoOutSetup]  = useState(false)
  // DOB — parsed from stored "YYYY-MM-DD" string
  const parseDob = (dobStr) => {
    if (!dobStr) return { day: '', month: '', year: '' }
    const [y, m, d] = dobStr.split('-')
    return { day: String(parseInt(d, 10)), month: String(parseInt(m, 10)), year: y }
  }
  const initDob = parseDob(userProfile?.dob)
  const [dobDay,   setDobDay]   = useState(initDob.day)
  const [dobMonth, setDobMonth] = useState(initDob.month)
  const [dobYear,  setDobYear]  = useState(initDob.year)
  const [saving, setSaving] = useState(false)

  // Main photo
  const [photoURL,      setPhotoURL]      = useState(userProfile?.photoURL ?? user?.photoURL ?? null)
  const [photoFile,     setPhotoFile]     = useState(null)
  const [photoOffsetX,  setPhotoOffsetX]  = useState(userProfile?.photoOffsetX ?? 50)
  const [photoOffsetY,  setPhotoOffsetY]  = useState(userProfile?.photoOffsetY ?? 50)
  const [photoZoom,     setPhotoZoom]     = useState(userProfile?.photoZoom ?? 1)
  const [photoEditOpen, setPhotoEditOpen] = useState(false)

  // Extra gallery photos (4 slots)
  const [extraPhotos,     setExtraPhotos]     = useState(
    userProfile?.extraPhotos?.length ? [...userProfile.extraPhotos, null, null, null, null].slice(0, 4) : [null, null, null, null]
  )
  const [extraPhotoFiles, setExtraPhotoFiles] = useState([null, null, null, null])

  // Country typeahead
  const [countryQuery, setCountryQuery] = useState(userProfile?.country ?? '')
  const [countryOpen,  setCountryOpen]  = useState(false)
  const countryRef = useRef(null)

  // Toast
  const [toast, setToast] = useState(null)

  // File inputs
  const mainInputRef = useRef(null)
  const extra0 = useRef(null)
  const extra1 = useRef(null)
  const extra2 = useRef(null)
  const extra3 = useRef(null)
  const extraInputRefs = [extra0, extra1, extra2, extra3]

  const filteredCountries = countryQuery.length > 0
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(countryQuery.toLowerCase())).slice(0, 8)
    : COUNTRIES.slice(0, 8)

  // Close country dropdown on outside click
  useEffect(() => {
    function onOut(e) {
      if (countryRef.current && !countryRef.current.contains(e.target)) {
        setCountryOpen(false)
      }
    }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [])

  // Re-sync when userProfile loads
  useEffect(() => {
    if (!userProfile) return
    setName(userProfile.displayName ?? user?.displayName ?? 'You')
    const pd = parseDob(userProfile.dob)
    setDobDay(pd.day); setDobMonth(pd.month); setDobYear(pd.year)
    setCountry(userProfile.country ?? '')
    setCountryQuery(userProfile.country ?? '')
    setCity(userProfile.city ?? '')
    setLookingFor(userProfile.lookingFor ?? '')
    setBio(userProfile.bio ?? '')
    setPhotoURL(userProfile.photoURL ?? null)
    setPhotoOffsetX(userProfile.photoOffsetX ?? 50)
    setPhotoOffsetY(userProfile.photoOffsetY ?? 50)
    setPhotoZoom(userProfile.photoZoom ?? 1)
    setSelectedActivity(userProfile.activities?.[0] ?? null)
    const ep = userProfile.extraPhotos ?? []
    setExtraPhotos([ep[0] ?? null, ep[1] ?? null, ep[2] ?? null, ep[3] ?? null])
  }, [userProfile]) // eslint-disable-line

  function showToast(msg) {
    setToast({ message: msg, type: 'error' })
  }

  function handleMainPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateFile(file)
    if (err) { showToast(err); e.target.value = ''; return }
    setPhotoFile(file)
    setPhotoURL(URL.createObjectURL(file))
    setPhotoOffsetX(50); setPhotoOffsetY(50); setPhotoZoom(1)
    setPhotoEditOpen(true)
    clearPhotoViewCount(user?.id)
    e.target.value = ''
  }

  function handleExtraPhoto(idx, e) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateFile(file)
    if (err) { showToast(err); e.target.value = ''; return }
    setExtraPhotos(prev => { const n = [...prev]; n[idx] = URL.createObjectURL(file); return n })
    setExtraPhotoFiles(prev => { const n = [...prev]; n[idx] = file; return n })
    e.target.value = ''
  }

  function triggerParticles(type) {
    const chars = type === 'im_out'     ? ['❤️','💕','💗','💖']
                : type === 'invite_out' ? ['💌','💕','❤️','💝']
                :                        ['🕐','⏰','🕑','🕒']
    const newP = Array.from({ length: 14 }, (_, i) => ({
      id:    Date.now() + i,
      char:  chars[i % chars.length],
      left:  `${4 + (i * 6.5) % 88}%`,
      dur:   `${1.1 + (i * 0.12) % 0.7}s`,
      delay: `${(i * 0.07) % 0.55}s`,
    }))
    setParticles(newP)
    setTimeout(() => setParticles([]), 2200)
  }

  const handleDone = async () => {
    const validationError = validateProfile({ name, dobDay, dobMonth, dobYear, country, city })
    if (validationError) { showToast(validationError); return }
    setSaving(true)
    try {
      if (photoFile && user?.id) {
        const url = await uploadAvatar(user.id, photoFile)
        if (url) setPhotoURL(url)
        earn('PROFILE_PHOTO')
      }

      const savedExtra = [...extraPhotos]
      for (let i = 0; i < 4; i++) {
        if (extraPhotoFiles[i] && user?.id) {
          const url = await uploadGalleryPhoto(user.id, extraPhotoFiles[i], i)
          if (url) savedExtra[i] = url
        }
      }
      setExtraPhotos(savedExtra)
      setExtraPhotoFiles([null, null, null, null])

      const dob = (dobYear && dobMonth && dobDay)
        ? `${dobYear}-${String(dobMonth).padStart(2,'0')}-${String(dobDay).padStart(2,'0')}`
        : null
      await saveProfile({
        userId:      user?.id,
        displayName: name,
        dob,
        bio,
        city,
        country,
        activities:  selectedActivity ? [selectedActivity] : [],
        lookingFor,
        extraPhotos: savedExtra,
        photoOffsetX,
        photoOffsetY,
        photoZoom,
      })
      if (bio.trim().length > 0)       earn('BIO_WRITTEN')
      if (selectedActivity)            earn('ACTIVITIES_SET')
      // After successful save, open the go-out setup if user selected a status
      if (pendingStatus) setShowGoOutSetup(true)
    } catch { /* silent */ }
    setSaving(false)
    setPhotoFile(null)
  }

  const statusKey = mySession?.status === 'active'    ? 'live'
                  : mySession?.status === 'scheduled' ? 'scheduled'
                  : 'online'
  const status = STATUS_CONFIG[statusKey]

  const toggleActivity = (id) =>
    setSelectedActivity(prev => prev === id ? null : id)

  return (
    <div className={styles.screen}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.headerCameraIcon}>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span className={styles.headerTitle}>Profile Details</span>
        </div>
        <button className={styles.homeBtn} onClick={onClose} aria-label="Back to map">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
      </div>

      {/* ── Toast ── */}
      <Toast
        message={toast?.message}
        type="error"
        onDismiss={() => setToast(null)}
        duration={4500}
      />

      <div className={styles.scroll}>

        {/* ── Photo grid ── */}
        <div className={styles.photoSection}>

          <div className={styles.photoSectionHeader}>
            <div className={styles.photoSectionLeft}>
              <div className={styles.photoSectionTitleRow}>
                <span className={styles.photoSectionTitle}>Profile Photos</span>
                <HelpTip text="Your main photo appears on the map — make it clear and friendly. Add up to 4 extra photos so matches can get a better sense of who you are. Accepted: JPG, PNG, WEBP. Max 5MB each." />
              </div>
              <span className={styles.photoSectionSub}>Complete profiles gain 70% more exposure</span>
            </div>
            <div className={`${styles.statusBadge} ${styles[status.cls]}`}>
              <span className={`${styles.statusDot} ${styles[status.dot]}`} />
              <span className={styles.statusBadgeLabel}>{status.label}</span>
            </div>
          </div>

          {/* Main photo slot */}
          <div className={styles.mainSlot} onClick={() => mainInputRef.current?.click()}>
            {photoURL
              ? <img
                  src={photoURL}
                  alt="Main"
                  className={styles.mainSlotImg}
                  style={{
                    transform: `translate(${(photoOffsetX - 50) * 0.6}%, ${(photoOffsetY - 50) * 0.6}%) scale(${photoZoom})`,
                    transformOrigin: 'center',
                  }}
                />
              : <div className={styles.slotEmpty}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span className={styles.slotLabel}>Tap to add main photo</span>
                </div>
            }
            {/* Camera overlay button */}
            <div className={styles.mainSlotOverlay}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <input ref={mainInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: 'none' }} onChange={handleMainPhoto} />
          </div>

          {/* 4 thumbnail slots */}
          <div className={styles.thumbsRow}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={styles.thumbSlot} onClick={() => extraInputRefs[i].current?.click()}>
                {extraPhotos[i]
                  ? <img src={extraPhotos[i]} alt={`Photo ${i + 2}`} className={styles.thumbImg} />
                  : <span className={styles.thumbPlus}>+</span>
                }
                <input
                  ref={extraInputRefs[i]}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  style={{ display: 'none' }}
                  onChange={e => handleExtraPhoto(i, e)}
                />
              </div>
            ))}
          </div>

          {/* File format hint */}
          <p className={styles.fileHint}>
            Accepted: JPG · PNG · WEBP &nbsp;·&nbsp; Max {MAX_MB}MB per photo
          </p>

          {photoURL && (
            <button className={styles.adjustBtn} onClick={() => setPhotoEditOpen(true)}>
              Adjust main photo position
            </button>
          )}
        </div>

        {/* ── Details section ── */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Your details</span>

          {/* Name */}
          <div className={styles.fieldRow}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Display Name</label>
              <HelpTip text="Shown on the map and in messages. Use your first name or a nickname — real names build more trust with matches." />
            </div>
            <input
              className={styles.fieldInput}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              disabled={false}
            />
          </div>

          {/* Date of Birth */}
          <div className={styles.fieldRow}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Date of Birth <span className={styles.requiredStar}>*</span></label>
              <HelpTip text="Required — used to confirm you're 18+ and to show your age to matches. Your exact birthday is never shared publicly." />
            </div>
            <div className={styles.dobRow}>
              <select className={styles.dobSelect} value={dobDay} onChange={e => setDobDay(e.target.value)}>
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select className={styles.dobSelect} value={dobMonth} onChange={e => setDobMonth(e.target.value)}>
                <option value="">Month</option>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
              <select className={styles.dobSelect} value={dobYear} onChange={e => setDobYear(e.target.value)}>
                <option value="">Year</option>
                {Array.from({ length: 82 }, (_, i) => new Date().getFullYear() - 18 - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Country typeahead */}
          <div className={styles.fieldRow} ref={countryRef}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Country <span className={styles.requiredStar}>*</span></label>
              <HelpTip text="Required — helps us show your profile to people in the right region. Update this if you're travelling." />
            </div>
            <div className={styles.countryWrap}>
              <input
                className={styles.fieldInput}
                value={countryQuery}
                onChange={e => { setCountryQuery(e.target.value); setCountryOpen(true) }}
                onFocus={() => setCountryOpen(true)}
                placeholder="Type to search country…"
                disabled={false}
                autoComplete="off"
              />
              {countryOpen && filteredCountries.length > 0 && (
                <ul className={styles.countryDropdown}>
                  {filteredCountries.map(c => (
                    <li
                      key={c.name}
                      className={styles.countryOption}
                      onMouseDown={() => {
                        setCountry(c.name)
                        setCountryQuery(c.name)
                        setCountryOpen(false)
                      }}
                    >
                      <span className={styles.countryFlag}>{c.flag}</span>
                      {c.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Location / City */}
          <div className={styles.fieldRow}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Location <span className={styles.requiredStar}>*</span></label>
              <HelpTip text="Required — your city or area is used only to calculate distance between you and other users. It is never shown publicly. Without it you won't appear in local map searches." />
            </div>
            <input
              className={styles.fieldInput}
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Your city or area…"
              disabled={false}
            />
            <div className={styles.locationPrivacy}>
              <span className={styles.locationPrivacyIcon}>🔒</span>
              <span className={styles.locationPrivacyText}>
                Your location is <strong>never shared</strong> publicly — it is only used to calculate km distance for your dating experience. Not setting a location will cause errors on the map and prevent you from appearing in matches near you.
              </span>
            </div>
          </div>

          {/* What I'm here for */}
          <div className={styles.fieldRow}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>I&apos;m here for</label>
              <HelpTip text="Helps people understand your vibe before they connect with you. No wrong answer — you can change this any time." />
            </div>
            <div className={styles.hereForGrid}>
              {[
                { value: 'friends',      emoji: '👋', label: 'Friends & Social' },
                { value: 'activity',     emoji: '⚡', label: 'Activity Partner' },
                { value: 'open',         emoji: '🌍', label: 'Open to Everything' },
                { value: 'culture',      emoji: '🎭', label: 'Culture & Events' },
                { value: 'wellness',     emoji: '🧘', label: 'Wellness Social' },
                { value: 'professional', emoji: '💼', label: 'Networking' },
                { value: 'travel',       emoji: '✈️', label: 'Travel Companion' },
                { value: 'dating',       emoji: '💕', label: 'Dating' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.hereForChip} ${lookingFor === opt.value ? styles.hereForChipActive : ''}`}
                  onClick={() => setLookingFor(prev => prev === opt.value ? '' : opt.value)}
                >
                  <span className={styles.hereForEmoji}>{opt.emoji}</span>
                  <span className={styles.hereForLabel}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bio ── */}
        <div className={styles.section}>
          <div className={styles.sectionLabelRow}>
            <span className={styles.sectionLabel}>About me</span>
            <HelpTip text="Tell people what makes you interesting! Profiles with a bio get 3× more messages. Keep it genuine — mention your interests, vibe, or what you're looking for tonight." />
          </div>
          <textarea
            className={styles.bioInput}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell people what you're about…"
            rows={3}
            maxLength={350}
          />
          <span className={styles.bioCount}>{bio.length}/350</span>
        </div>

        {/* ── Interests For Going Out ── */}
        <div className={styles.section}>
          <div className={styles.sectionLabelRow}>
            <span className={styles.sectionLabel}>Interests For Going Out</span>
            <HelpTip text="Pick what best describes your plans — one selection. People with matching interests will find you on the map." />
          </div>
          <p className={styles.activityHint}>Tap one activity that best describes your plans</p>
          {ACTIVITY_CATEGORIES.map(cat => {
            const items = ACTIVITY_TYPES.filter(a => a.category === cat.id)
            if (!items.length) return null
            return (
              <div key={cat.id} className={styles.activityCategoryGroup}>
                <span className={styles.activityCategoryLabel}>{cat.emoji} {cat.label}</span>
                <div className={styles.activitiesGrid}>
                  {items.map(a => (
                    <button
                      key={a.id}
                      className={`${styles.activityChip} ${selectedActivity === a.id ? styles.activityActive : ''}`}
                      onClick={() => toggleActivity(a.id)}
                    >
                      <ActivityIcon activity={a} size={22} className={styles.activityEmoji} />
                      <span className={styles.activityLabel}>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Online status ── */}
        <div className={styles.section}>
          <div className={styles.sectionLabelRow}>
            <span className={styles.sectionLabel}>Set Your Status</span>
            <HelpTip text="I'm Out — you're out right now. Invite Out — you want someone to invite you out. Later Out — set a time for when you'll be going out. We'll check in every 3 hours and auto-switch to Invite Out if you don't respond." />
          </div>
          <p className={styles.activityHint}>Let people know you're available — your status is set when you save your profile</p>

          {/* Particle container */}
          <div className={styles.particleContainer}>
            {particles.map(p => (
              <span
                key={p.id}
                className={styles.particle}
                style={{ left: p.left, animationDuration: p.dur, animationDelay: p.delay }}
              >
                {p.char}
              </span>
            ))}

            <div className={styles.statusBtnRow}>
              {/* I'm Out */}
              <button
                className={`${styles.statusBtn} ${pendingStatus === 'im_out' ? styles.statusBtnGreen : mySession?.status === 'active' && !pendingStatus ? styles.statusBtnGreen : ''}`}
                onClick={() => { setPendingStatus('im_out'); triggerParticles('im_out') }}
              >
                <span className={styles.statusBtnEmoji}>🚀</span>
                <span className={styles.statusBtnLabel}>I&apos;m Out</span>
              </button>

              {/* Invite Out */}
              <button
                className={`${styles.statusBtn} ${pendingStatus === 'invite_out' ? styles.statusBtnYellow : mySession?.status === 'invite_out' && !pendingStatus ? styles.statusBtnYellow : ''}`}
                onClick={() => { setPendingStatus('invite_out'); triggerParticles('invite_out') }}
              >
                <span className={styles.statusBtnEmoji}>💌</span>
                <span className={styles.statusBtnLabel}>Invite Out</span>
              </button>

              {/* Later Out */}
              <button
                className={`${styles.statusBtn} ${pendingStatus === 'later_out' ? styles.statusBtnOrange : mySession?.status === 'scheduled' && !pendingStatus ? styles.statusBtnOrange : ''}`}
                onClick={() => { setPendingStatus('later_out'); triggerParticles('later_out') }}
              >
                <span className={styles.statusBtnEmoji}>🕐</span>
                <span className={styles.statusBtnLabel}>Later Out</span>
              </button>
            </div>
          </div>

          {/* Selected status confirmation note */}
          {pendingStatus && (
            <p className={styles.statusSelectedNote}>
              {pendingStatus === 'im_out'     && '🚀 You\'ll be set live — save your profile to continue to location setup'}
              {pendingStatus === 'invite_out' && '💌 You\'ll appear as wanting an invite — save your profile to confirm'}
              {pendingStatus === 'later_out'  && '🕐 You\'re going out later — save your profile to set your time & place'}
            </p>
          )}
        </div>

        {/* ── Save button ── */}
        <div className={styles.saveRow}>
          <button className={styles.saveBtn} onClick={handleDone} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

      </div>

      {/* ── Go Out Setup overlay ── */}
      {showGoOutSetup && (
        <GoOutSetup
          pendingStatus={pendingStatus}
          activityType={selectedActivity}
          userCity={city}
          onDone={() => { setShowGoOutSetup(false); onClose?.() }}
          onSkip={() => { setShowGoOutSetup(false); onClose?.() }}
        />
      )}

      {/* ── Photo reposition panel ── */}
      {photoEditOpen && (
        <div className={styles.photoEditPanel}>
          <div className={styles.photoEditHeader}>
            <button className={styles.photoEditHomeBtn} onClick={() => setPhotoEditOpen(false)} aria-label="Close editor">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </button>
            <div className={styles.photoEditTitleRow}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span className={styles.photoEditTitle}>Photo Editor</span>
            </div>
          </div>
          <div className={styles.photoEditPreviewWrap}>
            <img
              src={photoURL}
              alt="Preview"
              className={styles.photoEditPreviewImg}
              style={{ transform: `translate(${(photoOffsetX - 50) * 0.8}%, ${(photoOffsetY - 50) * 0.8}%) scale(${photoZoom})` }}
            />
            <div className={styles.photoEditOverlayLabel}>
              <span className={styles.photoEditOverlayTitle}>Adjust Photo</span>
              <span className={styles.photoEditOverlaySub}>Adjust for best position</span>
            </div>
          </div>
          <div className={styles.photoEditSliders}>
            <div className={styles.photoEditSliderBlock}>
              <div className={styles.photoEditSliderHeader}>
                <span className={styles.photoEditSliderName}>HORIZONTAL</span>
                <span className={styles.photoEditSliderValue}>{photoOffsetX > 50 ? `R ${photoOffsetX - 50}` : photoOffsetX < 50 ? `L ${50 - photoOffsetX}` : 'CENTER'}</span>
              </div>
              <div className={styles.photoEditRow}>
                <span className={styles.photoEditLabel}>↔</span>
                <input type="range" min={0} max={100} value={photoOffsetX} onChange={e => setPhotoOffsetX(Number(e.target.value))} className={styles.photoEditSlider} />
              </div>
            </div>
            <div className={styles.photoEditSliderBlock}>
              <div className={styles.photoEditSliderHeader}>
                <span className={styles.photoEditSliderName}>VERTICAL</span>
                <span className={styles.photoEditSliderValue}>{photoOffsetY > 50 ? `DOWN ${photoOffsetY - 50}` : photoOffsetY < 50 ? `UP ${50 - photoOffsetY}` : 'CENTER'}</span>
              </div>
              <div className={styles.photoEditRow}>
                <span className={styles.photoEditLabel}>↕</span>
                <input type="range" min={0} max={100} value={photoOffsetY} onChange={e => setPhotoOffsetY(Number(e.target.value))} className={styles.photoEditSlider} />
              </div>
            </div>
            <div className={styles.photoEditSliderBlock}>
              <div className={styles.photoEditSliderHeader}>
                <span className={styles.photoEditSliderName}>ZOOM</span>
                <span className={styles.photoEditSliderValue}>{Math.round(photoZoom * 100)}%</span>
              </div>
              <div className={styles.photoEditRow}>
                <span className={styles.photoEditLabel}>🔍</span>
                <input type="range" min={100} max={250} value={Math.round(photoZoom * 100)} onChange={e => setPhotoZoom(Number(e.target.value) / 100)} className={styles.photoEditSlider} />
              </div>
            </div>
          </div>
          <div className={styles.photoEditFooter}>
            <p className={styles.photoEditHint}>Drag sliders to reposition · zoom in to fill the frame</p>
            <button className={styles.photoSaveBtn} onClick={() => setPhotoEditOpen(false)}>
              Save Photo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
