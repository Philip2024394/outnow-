/**
 * MassageScreen — browse and book massage therapists.
 * Landing page → search/filter → therapist cards.
 * Same flow as massage app, dark glass theme.
 */
import { useState } from 'react'
import { MASSAGE_TYPES, getTherapists, searchTherapists, AVAILABILITY } from '@/services/massageService'
import SectionCTAButton from '@/components/ui/SectionCTAButton'
import TherapistCard from '@/domains/massage/components/TherapistCard'
import MassageHeroNav from '@/domains/massage/components/MassageHeroNav'
import styles from './MassageScreen.module.css'

const MASSAGE_LANDING_BG = '' // User will provide landing page image

export default function MassageScreen({ onClose }) {
  const [showLanding, setShowLanding] = useState(true)
  const [search, setSearch] = useState('')
  const [massageType, setMassageType] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [mainTab, setMainTab] = useState('home-service') // 'home-service' | 'places'
  const [serviceButton, setServiceButton] = useState('massage') // 'massage' | 'facial' | 'beautician'

  const therapists = searchTherapists({
    query: search,
    massageType,
    status: statusFilter,
  })

  if (showLanding) {
    return (
      <div className={styles.landingPage} style={MASSAGE_LANDING_BG ? { backgroundImage: `url("${MASSAGE_LANDING_BG}")` } : { background: '#0a0a0a' }}>
        <div className={styles.landingOverlay} />
        <div className={styles.landingContent}>
          <h1 className={styles.landingTitle}>Indoo Massage</h1>
          <p className={styles.landingSub}>Professional massage therapists — home, hotel & villa service</p>
          <button className={styles.landingBtn} onClick={() => setShowLanding(false)}>
            Find a Therapist
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <SectionCTAButton
            section="massage"
            className={styles.landingBtnOutline}
            onReady={() => setShowLanding(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Header with search */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => setShowLanding(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className={styles.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search therapists..." />
        </div>
      </div>

      {/* Hero nav — Home Massage / Places toggle + Massage / Facial / Beauty */}
      <MassageHeroNav
        mainTab={mainTab}
        onMainTabChange={setMainTab}
        serviceButton={serviceButton}
        onServiceChange={setServiceButton}
        onFilterClick={() => { /* TODO: open filter drawer */ }}
      />

      {/* Massage type filter chips */}
      <div className={styles.filters}>
        <button className={`${styles.filterChip} ${massageType === 'all' ? styles.filterChipActive : ''}`} onClick={() => setMassageType('all')}>
          All Types
        </button>
        {MASSAGE_TYPES.map(t => (
          <button key={t} className={`${styles.filterChip} ${massageType === t ? styles.filterChipActive : ''}`} onClick={() => setMassageType(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className={styles.statusFilters}>
        {['all', 'Available', 'Busy'].map(s => (
          <button key={s} className={`${styles.statusChip} ${statusFilter === s ? styles.statusChipActive : ''}`} onClick={() => setStatusFilter(s)}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Therapist cards */}
      <div className={styles.body}>
        <span className={styles.resultCount}>{therapists.length} therapist{therapists.length !== 1 ? 's' : ''} found</span>

        {therapists.length === 0 && <div className={styles.empty}>No therapists found</div>}

        {therapists.map(t => (
          <TherapistCard
            key={t.id}
            therapist={t}
            onBookNow={(data) => { /* TODO: open in-app chat booking */ }}
            onSchedule={(data) => { /* TODO: open scheduled booking */ }}
            onShare={(therapist) => { /* TODO: share profile */ }}
            language="en"
          />
        ))}
      </div>
    </div>
  )
}
