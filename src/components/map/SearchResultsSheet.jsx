import { useEffect, useRef, useState } from 'react'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import { supabase } from '@/lib/supabase'
import { isMakerSession } from '@/utils/sessionCategory'
import styles from './SearchResultsSheet.module.css'

const MAKER_CRAFT_IMG = 'https://ik.imagekit.io/nepgaxllc/UntitledsdfasdfdddfsdfsdzxcZXcxxx.png'
const MAKER_CATEGORIES = ['handmade', 'craft_supplies', 'property', 'professional']

// All country names for keyword detection
const COUNTRY_NAMES = [
  'Indonesia', 'United Kingdom', 'United States', 'Australia', 'Canada', 'UAE',
  'Ireland', 'Germany', 'France', 'Netherlands', 'Spain', 'Italy', 'Japan',
  'South Korea', 'Singapore', 'Malaysia', 'Thailand', 'Philippines', 'Vietnam',
  'India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Saudi Arabia', 'Qatar',
  'Kuwait', 'Bahrain', 'Turkey', 'South Africa', 'Nigeria', 'Kenya', 'Ghana',
  'Egypt', 'Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'New Zealand',
  'Sweden', 'Norway', 'Denmark', 'Switzerland', 'Belgium', 'Portugal', 'Poland',
  'China', 'Hong Kong', 'Taiwan',
]

/** Detect a country name in the query. Returns { country, remainder } or null. */
function detectCountry(q) {
  const lower = q.toLowerCase()
  // Try longest match first to handle "united kingdom" vs "united"
  const sorted = [...COUNTRY_NAMES].sort((a, b) => b.length - a.length)
  for (const name of sorted) {
    if (lower.includes(name.toLowerCase())) {
      return {
        country: name,
        remainder: lower.replace(name.toLowerCase(), '').trim(),
      }
    }
  }
  return null
}

/** Minimal mapper for global search rows */
function mapGlobalRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    activityType: row.activity_type ?? null,
    displayName: row.display_name ?? 'Someone',
    photoURL: row.photo_url ?? null,
    age: row.age ?? null,
    area: row.area ?? null,
    city: row.profile_city ?? row.city ?? null,
    lookingFor: row.looking_for ?? null,
    brandName: row.brand_name ?? null,
    country: row.country ?? null,
  }
}

function statusLabel(status) {
  if (status === 'invite_out') return { text: 'Invite Out', color: '#F5C518' }
  if (status === 'scheduled')  return { text: 'Out Later',  color: '#E8890C' }
  return                              { text: 'Out Now',    color: '#8DC63F' }
}

export default function SearchResultsSheet({ open, query, sessions, mapCategory = 'all', userCity = null, onSelect, onClose }) {
  const sheetRef = useRef(null)

  const [globalResults, setGlobalResults] = useState(null)  // null = not triggered
  const [globalCountry, setGlobalCountry] = useState(null)
  const [globalLoading, setGlobalLoading] = useState(false)

  // Reset global results when query changes
  useEffect(() => {
    if (!open) { setGlobalResults(null); setGlobalCountry(null); return }

    const detected = detectCountry(query)
    if (!detected) { setGlobalResults(null); setGlobalCountry(null); return }

    setGlobalCountry(detected.country)
    if (!supabase) { setGlobalResults([]); return }

    setGlobalLoading(true)
    const remainder = detected.remainder

    supabase
      .from('sessions_with_profiles')
      .select('*')
      .in('status', ['active', 'scheduled', 'invite_out'])
      .ilike('country', detected.country)
      .limit(80)
      .then(({ data }) => {
        const rows = (data ?? []).map(mapGlobalRow)
        // Filter by the non-country part of the query
        const filtered = remainder
          ? rows.filter(s =>
              s.displayName?.toLowerCase().includes(remainder) ||
              s.area?.toLowerCase().includes(remainder) ||
              s.brandName?.toLowerCase().includes(remainder) ||
              ACTIVITY_TYPES.find(a => a.id === s.activityType)?.label?.toLowerCase().includes(remainder) ||
              s.lookingFor?.toLowerCase().includes(remainder)
            )
          : rows
        // Apply category filter
        const categorised = mapCategory === 'maker'
          ? filtered.filter(isMakerSession)
          : filtered
        setGlobalResults(categorised)
        setGlobalLoading(false)
      })
  }, [query, mapCategory]) // eslint-disable-line

  // Local search across loaded sessions
  const q = query.toLowerCase().trim()
  const allLocalMatches = !q ? [] : sessions.filter(s => (
    s.displayName?.toLowerCase().includes(q) ||
    s.area?.toLowerCase().includes(q) ||
    s.city?.toLowerCase().includes(q) ||
    s.brandName?.toLowerCase().includes(q) ||
    ACTIVITY_TYPES.find(a => a.id === s.activityType)?.label?.toLowerCase().includes(q) ||
    s.lookingFor?.toLowerCase().includes(q) ||
    (s.tags ?? []).some(tag => tag.toLowerCase().includes(q))
  ))

  // City-first: narrow to user's city when no country keyword detected
  const cityLower = userCity?.toLowerCase().trim()
  const cityResults = cityLower
    ? allLocalMatches.filter(s =>
        s.city?.toLowerCase() === cityLower ||
        s.area?.toLowerCase().includes(cityLower)
      )
    : []
  // If city produces results, show them; otherwise fall back to country-wide local results
  const localResults = cityResults.length > 0 ? cityResults : allLocalMatches
  const showingCity = cityResults.length > 0 && !!cityLower

  // If global search fired, use those results; otherwise use local
  const results = globalResults !== null ? globalResults : localResults

  // Swipe down to close
  const startYRef = useRef(null)
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const onTouchStart = e => { startYRef.current = e.touches[0].clientY }
    const onTouchEnd   = e => {
      if (startYRef.current !== null && e.changedTouches[0].clientY - startYRef.current > 80) onClose()
      startYRef.current = null
    }
    sheet.addEventListener('touchstart', onTouchStart, { passive: true })
    sheet.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      sheet.removeEventListener('touchstart', onTouchStart)
      sheet.removeEventListener('touchend',   onTouchEnd)
    }
  }, [onClose])

  if (!open) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={sheetRef} className={styles.sheet}>
        <div className={styles.handle} />

        {/* Global search banner */}
        {globalCountry && (
          <div className={styles.globalBanner}>
            <span className={styles.globalIcon}>🌍</span>
            <span>
              {globalLoading
                ? `Searching ${globalCountry}…`
                : `Results from ${globalCountry}${mapCategory === 'maker' ? ' · Makers only' : ''}`
              }
            </span>
          </div>
        )}

        {globalLoading ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>Searching…</p>
          </div>
        ) : results.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🔍</span>
            <p className={styles.emptyText}>No results for "{query}"</p>
          </div>
        ) : (
          <>
            <p className={styles.count}>
              {results.length} result{results.length !== 1 ? 's' : ''}
              {showingCity ? <span className={styles.countCity}> · 📍 {userCity}</span> : null}
            </p>
            <ul className={styles.list}>
              {results.map(s => {
                const activity = ACTIVITY_TYPES.find(a => a.id === s.activityType)
                const activityCategory = activity?.category
                const isMaker = MAKER_CATEGORIES.includes(s.lookingFor) || activityCategory === 'handmade'
                const avatarSrc = s.photoURL || (isMaker ? MAKER_CRAFT_IMG : null)
                const initial = (s.displayName ?? 'U')[0].toUpperCase()
                const { text: sText, color: sColor } = statusLabel(s.status)

                return (
                  <li key={s.id}>
                    <button className={styles.row} onClick={() => { onSelect(s); onClose() }}>
                      <div className={styles.avatar}>
                        {avatarSrc
                          ? <img src={avatarSrc} alt={s.displayName} className={styles.avatarImg} />
                          : <span className={styles.avatarInitial}>{initial}</span>
                        }
                        <span className={styles.statusDot} style={{ background: sColor }} />
                      </div>
                      <div className={styles.info}>
                        <span className={styles.name}>
                          {s.displayName ?? 'Someone'}
                          {s.age ? <span className={styles.age}>, {s.age}</span> : null}
                        </span>
                        <span className={styles.meta}>
                          {activity ? `${activity.emoji} ${activity.label}` : ''}
                          {s.area ? ` · 📍 ${s.area}` : ''}
                          {globalCountry && s.country ? ` · ${s.country}` : ''}
                        </span>
                      </div>
                      <span className={styles.status} style={{ color: sColor }}>{sText}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
