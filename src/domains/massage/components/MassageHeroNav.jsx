/**
 * MassageHeroNav — Hero toggle: Home Massage / Massage Places
 * Simplified: massage only (facial/beautician removed)
 * "Indoo Massage" title at top
 */
import styles from './MassageHeroNav.module.css'

export default function MassageHeroNav({
  mainTab = 'home-service', // 'home-service' | 'places'
  onMainTabChange,
  language = 'en',
}) {
  const isId = language === 'id'
  const homeLabel = isId ? 'Pijat Rumah' : 'Home Massage'
  const placesLabel = isId ? 'Tempat Pijat' : 'Massage Places'

  return (
    <div className={styles.hero}>
      <div className={styles.inner}>

        {/* Title */}
        <h2 className={styles.title}>Indoo Massage</h2>

        {/* Home Massage / Massage Places toggle */}
        <div className={styles.row1}>
          <button
            onClick={() => onMainTabChange?.('home-service')}
            className={`${styles.row1Btn} ${mainTab === 'home-service' ? styles.row1BtnActive : styles.row1BtnInactive}`}
          >
            <svg className={styles.row1Icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className={styles.row1Label}>{homeLabel}</span>
          </button>
          <button
            onClick={() => onMainTabChange?.('places')}
            className={`${styles.row1Btn} ${mainTab === 'places' ? styles.row1BtnActive : styles.row1BtnInactive}`}
          >
            <svg className={styles.row1Icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>
            </svg>
            <span className={styles.row1Label}>{placesLabel}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
