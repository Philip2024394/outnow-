import styles from './CountrySearchSheet.module.css'

export const COUNTRIES = [
  { name: 'Indonesia',       flag: '🇮🇩' },
  { name: 'United Kingdom',  flag: '🇬🇧' },
  { name: 'United States',   flag: '🇺🇸' },
  { name: 'Australia',       flag: '🇦🇺' },
  { name: 'Canada',          flag: '🇨🇦' },
  { name: 'UAE',             flag: '🇦🇪' },
  { name: 'Ireland',         flag: '🇮🇪' },
  { name: 'Germany',         flag: '🇩🇪' },
  { name: 'France',          flag: '🇫🇷' },
  { name: 'Netherlands',     flag: '🇳🇱' },
  { name: 'Spain',           flag: '🇪🇸' },
  { name: 'Italy',           flag: '🇮🇹' },
  { name: 'Japan',           flag: '🇯🇵' },
  { name: 'South Korea',     flag: '🇰🇷' },
  { name: 'Singapore',       flag: '🇸🇬' },
  { name: 'Malaysia',        flag: '🇲🇾' },
  { name: 'Thailand',        flag: '🇹🇭' },
  { name: 'Philippines',     flag: '🇵🇭' },
  { name: 'Vietnam',         flag: '🇻🇳' },
  { name: 'India',           flag: '🇮🇳' },
  { name: 'Pakistan',        flag: '🇵🇰' },
  { name: 'Bangladesh',      flag: '🇧🇩' },
  { name: 'Sri Lanka',       flag: '🇱🇰' },
  { name: 'Saudi Arabia',    flag: '🇸🇦' },
  { name: 'Qatar',           flag: '🇶🇦' },
  { name: 'Kuwait',          flag: '🇰🇼' },
  { name: 'Bahrain',         flag: '🇧🇭' },
  { name: 'Turkey',          flag: '🇹🇷' },
  { name: 'South Africa',    flag: '🇿🇦' },
  { name: 'Nigeria',         flag: '🇳🇬' },
  { name: 'Kenya',           flag: '🇰🇪' },
  { name: 'Ghana',           flag: '🇬🇭' },
  { name: 'Egypt',           flag: '🇪🇬' },
  { name: 'Brazil',          flag: '🇧🇷' },
  { name: 'Mexico',          flag: '🇲🇽' },
  { name: 'Argentina',       flag: '🇦🇷' },
  { name: 'Colombia',        flag: '🇨🇴' },
  { name: 'Chile',           flag: '🇨🇱' },
  { name: 'New Zealand',     flag: '🇳🇿' },
  { name: 'Sweden',          flag: '🇸🇪' },
  { name: 'Norway',          flag: '🇳🇴' },
  { name: 'Denmark',         flag: '🇩🇰' },
  { name: 'Switzerland',     flag: '🇨🇭' },
  { name: 'Belgium',         flag: '🇧🇪' },
  { name: 'Portugal',        flag: '🇵🇹' },
  { name: 'Poland',          flag: '🇵🇱' },
  { name: 'China',           flag: '🇨🇳' },
  { name: 'Hong Kong',       flag: '🇭🇰' },
  { name: 'Taiwan',          flag: '🇹🇼' },
]

export default function CountrySearchSheet({ open, onClose, currentCountry, onSelect }) {
  if (!open) return null

  function handleSelect(country) {
    onSelect(country.name)
    onClose()
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} onClick={onClose} />

        <div className={styles.section}>
          <div className={styles.allCountriesHeader}>
            <div className={styles.allCountriesTitle}>All countries <span className={styles.sectionCount}>{COUNTRIES.length}</span></div>
            <p className={styles.allCountriesSub}>Global Countries waiting to connect</p>
          </div>
          <ul className={styles.list}>
            {COUNTRIES.map(c => {
              const active = currentCountry === c.name
              return (
                <li key={c.name}>
                  <button
                    className={`${styles.countryRow} ${active ? styles.countryRowActive : ''}`}
                    onClick={() => handleSelect(c)}
                  >
                    <span className={styles.flag}>{c.flag}</span>
                    <span className={styles.countryName}>{c.name}</span>
                    {active && <span className={styles.check}>✓</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>


      </div>
    </div>
  )
}
