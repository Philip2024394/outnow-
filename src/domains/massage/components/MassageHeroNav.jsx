/**
 * MassageHeroNav — Hero toggle navigation from HomePage.tsx
 * Converted from lines 1982-2051 of src/pages/HomePage.tsx
 *
 * Row 1: "Home Massage" / "Massage Places" toggle (changes with service type)
 * Row 2: "Massage" / "Facial" / "Beauty" / Filter buttons
 */
import styles from './MassageHeroNav.module.css'

export default function MassageHeroNav({
  mainTab = 'home-service', // 'home-service' | 'places'
  onMainTabChange,
  serviceButton = 'massage', // 'massage' | 'facial' | 'beautician'
  onServiceChange,
  onFilterClick,
  language = 'en',
}) {
  const isId = language === 'id'

  // Row 1 labels change based on selected service — exact from source line 1987-1991
  const row1Labels = {
    massage: {
      home: isId ? 'Pijat Rumah' : 'Home Massage',
      places: isId ? 'Tempat Pijat' : 'Massage Places',
    },
    facial: {
      home: isId ? 'Facial Rumah' : 'Home Facial',
      places: isId ? 'Tempat Facial' : 'Facial Places',
    },
    beautician: {
      home: isId ? 'Kecantikan Rumah' : 'Home Beauty',
      places: isId ? 'Tempat Kecantikan' : 'Beauty Places',
    },
  }

  const { home: homeLabel, places: placesLabel } = row1Labels[serviceButton]

  return (
    <div className={styles.hero}>
      <div className={styles.inner}>

        {/* Row 1: Home Service / Places toggle */}
        {/* Was: flex bg-gray-200 rounded-full p-1 */}
        <div className={styles.row1}>
          <button
            onClick={() => onMainTabChange?.('home-service')}
            className={`${styles.row1Btn} ${mainTab === 'home-service' ? styles.row1BtnActive : styles.row1BtnInactive}`}
          >
            {/* Home icon — was lucide HomeIcon */}
            <svg className={styles.row1Icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className={styles.row1Label}>{homeLabel}</span>
          </button>
          <button
            onClick={() => onMainTabChange?.('places')}
            className={`${styles.row1Btn} ${mainTab === 'places' ? styles.row1BtnActive : styles.row1BtnInactive}`}
          >
            {/* Building icon — was lucide Building */}
            <svg className={styles.row1Icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>
            </svg>
            <span className={styles.row1Label}>{placesLabel}</span>
          </button>
        </div>

        {/* Row 2: Massage / Facial / Beauty / Filter */}
        {/* Was: max-w-2xl mx-auto mt-4 flex gap-2 */}
        <div className={styles.row2}>
          <button
            onClick={() => onServiceChange?.('massage')}
            className={`${styles.serviceBtn} ${serviceButton === 'massage' ? styles.serviceBtnActive : styles.serviceBtnInactive}`}
          >
            {/* Home icon for massage */}
            <svg className={styles.serviceIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className={styles.serviceLabel}>{isId ? 'Pijat' : 'Massage'}</span>
          </button>
          <button
            onClick={() => onServiceChange?.('facial')}
            className={`${styles.serviceBtn} ${serviceButton === 'facial' ? styles.serviceBtnActive : styles.serviceBtnInactive}`}
          >
            {/* Sparkles icon for facial */}
            <svg className={styles.serviceIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
            <span className={styles.serviceLabel}>{isId ? 'Facial' : 'Facial'}</span>
          </button>
          <button
            onClick={() => onServiceChange?.('beautician')}
            className={`${styles.serviceBtn} ${serviceButton === 'beautician' ? styles.serviceBtnActive : styles.serviceBtnInactive}`}
          >
            {/* Scissors icon for beauty */}
            <svg className={styles.serviceIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>
            </svg>
            <span className={styles.serviceLabel}>Beauty</span>
          </button>
          <button
            type="button"
            onClick={onFilterClick}
            className={styles.filterBtn}
            title="Filter"
            aria-label="Open filters"
          >
            {/* SlidersHorizontal icon */}
            <svg className={styles.filterIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/><line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/><line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/><line x1="14" y1="2" x2="14" y2="6"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="16" y1="18" x2="16" y2="22"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
