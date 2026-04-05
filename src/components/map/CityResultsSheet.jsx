import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import { COUNTRIES } from './CountrySearchSheet'
import styles from './CityResultsSheet.module.css'

/** Known cities per country — all shown even if count is 0 */
const COUNTRY_CITIES = {
  indonesia:       ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Bali', 'Makassar', 'Semarang', 'Palembang', 'Tangerang', 'Depok', 'Bogor', 'Bekasi', 'Yogyakarta', 'Malang', 'Batam'],
  'united kingdom':['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Bristol', 'Edinburgh', 'Sheffield', 'Newcastle', 'Nottingham', 'Leicester', 'Brighton', 'Cardiff', 'Belfast'],
  'united states': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Miami', 'Seattle', 'Denver'],
  australia:       ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle', 'Wollongong', 'Hobart'],
  canada:          ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Brampton'],
  india:           ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal'],
  malaysia:        ['Kuala Lumpur', 'Johor Bahru', 'Penang', 'Kota Kinabalu', 'Kuching', 'Ipoh', 'Shah Alam', 'Petaling Jaya', 'Subang Jaya', 'Melaka'],
  singapore:       ['Singapore'],
  uae:             ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Al Ain'],
  'saudi arabia':  ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Abha'],
  philippines:     ['Manila', 'Quezon City', 'Cebu', 'Davao', 'Makati', 'Taguig', 'Pasig', 'Cagayan de Oro', 'Zamboanga', 'Antipolo'],
  germany:         ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen'],
  france:          ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
  netherlands:     ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen'],
}

/** Get city list for a given country (case-insensitive). Returns empty array if unknown. */
function getCitiesForCountry(country) {
  if (!country) return []
  return COUNTRY_CITIES[country.toLowerCase()] ?? []
}

/** Extra keyword → emoji for terms that don't exactly match an activity id/label */
const KEYWORD_EMOJI = {
  handbag: '👜', bag: '👜', bags: '👜', purse: '👜', tote: '👜', clutch: '👜',
  shoe: '👟', shoes: '👟', sneaker: '👟', trainer: '👟', boot: '👢', footwear: '👟',
  jewel: '💍', jewelry: '💍', jewellery: '💍', ring: '💍', necklace: '📿', bracelet: '📿',
  watch: '⌚', watches: '⌚',
  cloth: '👗', clothing: '👗', dress: '👗', shirt: '👕', skirt: '👗', outfit: '👗',
  hat: '🎩', cap: '🧢',
  fabric: '🧵', textile: '🧵', sew: '🧵', stitch: '🧵', thread: '🧵',
  candle: '🕯️', soap: '🧴', skincare: '🧴', beauty: '💄', perfume: '🌸', cosmetic: '💄',
  cake: '🎂', bread: '🥖', bake: '🎂', pastry: '🥐', cookie: '🍪', chocolate: '🍫',
  plant: '🌱', flower: '💐', garden: '🌸', succulent: '🌱',
  wood: '🪵', furniture: '🪑', woodwork: '🪵',
  toy: '🧸', kids: '🧸', baby: '👶',
  art: '🎨', paint: '🎨', sketch: '✏️', illustration: '🖼️',
  print: '🖨️', poster: '🖼️', photo: '📷',
  book: '📚', stationery: '✏️', notebook: '📓',
  tech: '💻', phone: '📱', gadget: '📱',
  sport: '⚽', fitness: '🏋️',
  coffee: '☕', tea: '🍵',
  scarf: '🧣', glove: '🧤', sock: '🧦',
  wallet: '👛', leather: '🧳', leatherwork: '🧳',
  ceramic: '🏺', pottery: '🏺',
  lamp: '💡', decor: '🕯️', cushion: '🛋️',
  resin: '💎', crystal: '💎', gem: '💎',
}

/** Resolve a search query to an emoji icon using ACTIVITY_TYPES + keyword map */
function resolveQueryIcon(query) {
  if (!query) return null
  const q = query.toLowerCase().trim()

  // 1. Direct id match
  const byId = ACTIVITY_TYPES.find(a => a.id.toLowerCase() === q || q === a.label.toLowerCase())
  if (byId) return byId.emoji

  // 2. Partial match against id or label
  const partial = ACTIVITY_TYPES.find(a =>
    a.id.toLowerCase().includes(q) ||
    q.includes(a.id.toLowerCase()) ||
    a.label.toLowerCase().includes(q) ||
    q.includes(a.label.toLowerCase().split(' ')[0])
  )
  if (partial) return partial.emoji

  // 3. Broader keyword map
  for (const [kw, emoji] of Object.entries(KEYWORD_EMOJI)) {
    if (q.includes(kw) || kw.includes(q)) return emoji
  }

  return '🔍'
}

/** Check if a session matches the search query */
function sessionMatchesQuery(s, q) {
  if (!q) return true
  const lower = q.toLowerCase()
  const actLabel = ACTIVITY_TYPES.find(a => a.id === s.activityType)?.label ?? ''
  return (
    s.displayName?.toLowerCase().includes(lower) ||
    s.brandName?.toLowerCase().includes(lower) ||
    actLabel.toLowerCase().includes(lower) ||
    s.lookingFor?.toLowerCase().includes(lower) ||
    (s.tags ?? []).some(t => t.toLowerCase().includes(lower))
  )
}

/** Build city counts from already-loaded sessions, filling in 0 for known cities */
function buildLocalCityCounts(sessions, query, country) {
  const counts = {}
  const countryLower = (country ?? '').toLowerCase()
  sessions.forEach(s => {
    if (countryLower && (s.country ?? '').toLowerCase() !== countryLower) return
    if (!sessionMatchesQuery(s, query)) return
    const city = s.city || s.area
    if (!city) return
    counts[city] = (counts[city] ?? 0) + 1
  })

  // Merge with the full known city list so all cities appear (even with count 0)
  const knownCities = getCitiesForCountry(country)
  knownCities.forEach(city => {
    if (!(city in counts)) counts[city] = 0
  })

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([city, count]) => ({ city, count }))
}

/** Merge Supabase counts with full city list, filling in 0 for missing cities */
function mergeWithKnownCities(counts, country) {
  const knownCities = getCitiesForCountry(country)
  const merged = { ...counts }
  knownCities.forEach(city => {
    if (!(city in merged)) merged[city] = 0
  })
  return Object.entries(merged)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([city, count]) => ({ city, count }))
}

export default function CityResultsSheet({ open, query, sessions, browseCountry, onSelectCity, onClose }) {
  const sheetRef = useRef(null)
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(false)

  const countryFlag = browseCountry
    ? (COUNTRIES.find(c => c.name.toLowerCase() === browseCountry.toLowerCase())?.flag ?? null)
    : null

  useEffect(() => {
    if (!open || !query.trim()) return

    // Try global Supabase query first if we have a country
    if (supabase && browseCountry) {
      setLoading(true)
      const q = query.toLowerCase().trim()
      const countryLower = browseCountry.toLowerCase()
      supabase
        .from('sessions_with_profiles')
        .select('profile_city, activity_type, looking_for, brand_name, tags, display_name, country')
        .in('status', ['active', 'invite_out', 'scheduled'])
        .limit(500)
        .then(({ data, error }) => {
          if (error || !data) {
            setCities(buildLocalCityCounts(sessions, query, browseCountry))
            setLoading(false)
            return
          }
          const counts = {}
          data.filter(row => row.country?.toLowerCase() === countryLower).forEach(row => {
            const city = row.profile_city
            if (!city) return
            const actLabel = ACTIVITY_TYPES.find(a => a.id === row.activity_type)?.label ?? ''
            const matches =
              row.display_name?.toLowerCase().includes(q) ||
              row.brand_name?.toLowerCase().includes(q) ||
              actLabel.toLowerCase().includes(q) ||
              row.looking_for?.toLowerCase().includes(q) ||
              (row.tags ?? []).some(t => t.toLowerCase().includes(q))
            if (matches) counts[city] = (counts[city] ?? 0) + 1
          })
          setCities(mergeWithKnownCities(counts, browseCountry))
          setLoading(false)
        })
        .catch(() => {
          setCities(buildLocalCityCounts(sessions, query, browseCountry))
          setLoading(false)
        })
    } else {
      // Demo / no Supabase — use loaded sessions
      setCities(buildLocalCityCounts(sessions, query, browseCountry))
    }
  }, [open, query, browseCountry]) // eslint-disable-line

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

  const productIcon = resolveQueryIcon(query)
  const totalSellers = cities.reduce((sum, { count }) => sum + count, 0)

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={sheetRef} className={styles.sheet}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <div className={styles.titleRow}>
            <p className={styles.title}>
              {productIcon && <span className={styles.titleIcon}>{productIcon}</span>}
              {browseCountry ? `Cities in ${browseCountry}` : 'Nearby cities'}
            </p>
            {totalSellers > 0 && (
              <span className={styles.totalBadge}>{totalSellers} sellers</span>
            )}
          </div>
          <p className={styles.subtitle}>
            Showing results for <strong>"{query}"</strong>
          </p>
        </div>

        {loading ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>Searching…</p>
          </div>
        ) : cities.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>{productIcon ?? '🔍'}</span>
            <p className={styles.emptyText}>No results for "{query}"</p>
            <p className={styles.emptyHint}>Try a broader search term</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {cities.map(({ city, count }) => (
              <li key={city}>
                <button className={styles.row} onClick={() => { onSelectCity(city); onClose() }}>
                  {countryFlag
                    ? <span className={styles.cityIcon}>{countryFlag}</span>
                    : <span className={styles.cityIcon}>📍</span>
                  }
                  <span className={styles.cityName}>{city}</span>
                  <span className={`${styles.cityCount} ${count === 0 ? styles.cityCountZero : ''}`}>{count}</span>
                  {productIcon && <span className={styles.productIcon}>{productIcon}</span>}
                  <svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
