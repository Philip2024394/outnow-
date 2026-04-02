import { useState, useRef, useEffect } from 'react'
import { useMySession } from '@/hooks/useMySession'
import styles from './MapHeader.module.css'

const LOGO_URL = 'https://ik.imagekit.io/nepgaxllc/Untitledxczxc-removebg-preview.png'

const CITIES_BY_COUNTRY = {
  'United Kingdom': ['All', 'London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Bristol', 'Leeds', 'Liverpool'],
  'United States':  ['All', 'New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco', 'Las Vegas', 'Austin', 'Seattle'],
  'UAE':            ['All', 'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
  'Ireland':        ['All', 'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford'],
  'Australia':      ['All', 'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast'],
  'Canada':         ['All', 'Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
}

const COUNTRY_FLAGS = {
  'United Kingdom': '🇬🇧',
  'United States':  '🇺🇸',
  'UAE':            '🇦🇪',
  'Ireland':        '🇮🇪',
  'Australia':      '🇦🇺',
  'Canada':         '🇨🇦',
}

export default function MapHeader({
  onOpenNotifications,
  notifCount = 0,
  onOpenSettings,
  onOpenFilter,
  hasActiveFilter = false,
  selectedCountry = 'United Kingdom',
  selectedCity    = 'All',
  onCityChange,
  mapAreaLabel,
}) {
  const { isLive } = useMySession()
  const [cityOpen, setCityOpen] = useState(false)
  const dropRef = useRef(null)

  const cities = CITIES_BY_COUNTRY[selectedCountry] ?? ['All']
  const displayCity = mapAreaLabel ?? (selectedCity === 'All' ? (CITIES_BY_COUNTRY[selectedCountry]?.[1] ?? selectedCountry) : selectedCity)
  const flag = COUNTRY_FLAGS[selectedCountry] ?? '🌍'

  useEffect(() => {
    if (!cityOpen) return
    function handle(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setCityOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [cityOpen])

  return (
    <div className={styles.header}>
      {/* Logo + city picker — left side */}
      <div className={styles.logoArea}>
        <img src={LOGO_URL} alt="IMOUTNOW" className={styles.logo} />
        <div className={styles.countryWrap} ref={dropRef}>
          <button
            className={styles.countryPill}
            onClick={() => setCityOpen(o => !o)}
            aria-label="Select city"
          >
            <span>{flag}</span>
            <span className={styles.countryName}>📍 {displayCity}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {cityOpen && (
            <ul className={styles.countryDropdown}>
              {cities.map(city => (
                <li key={city}>
                  <button
                    className={`${styles.countryOption} ${city === selectedCity ? styles.countryOptionActive : ''}`}
                    onClick={() => { onCityChange?.(city); setCityOpen(false) }}
                  >
                    <span className={styles.cityDot}>📍</span>
                    <span>{city === 'All' ? `All of ${selectedCountry}` : city}</span>
                    {city === selectedCity && <span className={styles.countryCheck}>✓</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={styles.right}>
        {isLive && (
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            LIVE
          </div>
        )}

        {/* Notifications */}
        <button className={styles.settingsBtn} onClick={onOpenNotifications} aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {notifCount > 0 && (
            <span className={styles.notifBadge}>{notifCount > 9 ? '9+' : notifCount}</span>
          )}
        </button>

        {/* Filter */}
        <button className={`${styles.settingsBtn} ${hasActiveFilter ? styles.settingsBtnActive : ''}`} onClick={onOpenFilter} aria-label="Filter map">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          {hasActiveFilter && <span className={styles.filterDot} />}
        </button>

        {/* Settings */}
        <button className={styles.settingsBtn} onClick={onOpenSettings} aria-label="Settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
