/**
 * TherapistLanguages — Flag emoji + 2-letter code pills.
 * Converted from src/modules/therapist/TherapistLanguages.tsx
 * Shows up to 3 languages with "+N" indicator.
 */
import styles from './TherapistLanguages.module.css'

// Exact language map from source (lines 42-74)
const langMap = {
  english: { flag: '🇬🇧', name: 'EN' },
  indonesian: { flag: '🇮🇩', name: 'ID' },
  mandarin: { flag: '🇨🇳', name: 'ZH' },
  japanese: { flag: '🇯🇵', name: 'JP' },
  korean: { flag: '🇰🇷', name: 'KR' },
  thai: { flag: '🇹🇭', name: 'TH' },
  vietnamese: { flag: '🇻🇳', name: 'VI' },
  french: { flag: '🇫🇷', name: 'FR' },
  german: { flag: '🇩🇪', name: 'DE' },
  spanish: { flag: '🇪🇸', name: 'ES' },
  portuguese: { flag: '🇵🇹', name: 'PT' },
  italian: { flag: '🇮🇹', name: 'IT' },
  russian: { flag: '🇷🇺', name: 'RU' },
  arabic: { flag: '🇸🇦', name: 'AR' },
  hindi: { flag: '🇮🇳', name: 'HI' },
  javanese: { flag: '🇮🇩', name: 'JV' },
  // Also support language codes
  en: { flag: '🇬🇧', name: 'EN' },
  id: { flag: '🇮🇩', name: 'ID' },
  zh: { flag: '🇨🇳', name: 'ZH' },
  ja: { flag: '🇯🇵', name: 'JP' },
  ko: { flag: '🇰🇷', name: 'KR' },
  th: { flag: '🇹🇭', name: 'TH' },
  vi: { flag: '🇻🇳', name: 'VI' },
  fr: { flag: '🇫🇷', name: 'FR' },
  de: { flag: '🇩🇪', name: 'DE' },
  es: { flag: '🇪🇸', name: 'ES' },
  pt: { flag: '🇵🇹', name: 'PT' },
  it: { flag: '🇮🇹', name: 'IT' },
  ru: { flag: '🇷🇺', name: 'RU' },
  ar: { flag: '🇸🇦', name: 'AR' },
  hi: { flag: '🇮🇳', name: 'HI' },
}

function parseLanguages(raw) {
  if (Array.isArray(raw) && raw.length > 0) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    } catch {
      return raw.split(',').map(s => s.trim()).filter(Boolean)
    }
  }
  return []
}

export default function TherapistLanguages({ therapist, translatedDescriptionLength = 200 }) {
  const rawLanguages = therapist.languages
    ? parseLanguages(therapist.languages)
    : []

  // Always include Indonesian as standard
  const languages = rawLanguages.length > 0 ? rawLanguages : ['Indonesian']

  if (!languages || !Array.isArray(languages) || languages.length === 0) return null

  // Dynamic spacing
  const spacingClass = translatedDescriptionLength < 200 ? styles.spacingSmall
    : translatedDescriptionLength < 300 ? styles.spacingMedium : styles.spacingLarge

  return (
    <div className={`${styles.wrap} ${spacingClass}`}>
      <h4 className={styles.title}>Languages</h4>
      <div className={styles.list}>
        {languages.slice(0, 3).map(lang => {
          const langKey = lang.toLowerCase()
          const langInfo = langMap[langKey] || { flag: '🌐', name: lang.slice(0, 2).toUpperCase() }
          return (
            <span key={lang} className={styles.pill}>
              <span className={styles.flag}>{langInfo.flag}</span>
              <span className={styles.code}>{langInfo.name}</span>
            </span>
          )
        })}
        {languages.length > 3 && (
          <span className={styles.more}>+{languages.length - 3}</span>
        )}
      </div>
    </div>
  )
}
