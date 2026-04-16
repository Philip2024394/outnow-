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
import MenuSlider from '@/domains/massage/components/MenuSlider'
import styles from './MassageScreen.module.css'

const MASSAGE_LANDING_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2017,%202026,%2001_03_53%20AM.png'

export default function MassageScreen({ onClose }) {
  const [showLanding, setShowLanding] = useState(true)
  const [search, setSearch] = useState('')
  const [massageType, setMassageType] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [mainTab, setMainTab] = useState('home-service')
  const [menuTherapist, setMenuTherapist] = useState(null)

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
      {/* Hero nav — Indoo Massage title + Home Massage / Massage Places toggle */}
      <MassageHeroNav
        mainTab={mainTab}
        onMainTabChange={setMainTab}
      />

      {/* Search bar — under the toggle */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search therapists..." />
        </div>
      </div>

      {/* Therapist cards */}
      <div className={styles.body}>
        <span className={styles.resultCount}>{therapists.length} therapist{therapists.length !== 1 ? 's' : ''} found</span>

        {therapists.length === 0 && <div className={styles.empty}>No therapists found</div>}

        {therapists.map(t => (
          <TherapistCard
            key={t.id}
            therapist={t}
            onBookNow={(therapist) => { /* TODO: open booking with 10% commission */ }}
            onMenu={(therapist) => setMenuTherapist(therapist)}
            onTap={(therapist) => { /* TODO: open full profile */ }}
          />
        ))}
      </div>

      {/* Menu slider */}
      <MenuSlider
        open={!!menuTherapist}
        onClose={() => setMenuTherapist(null)}
        therapist={menuTherapist}
        onBook={(therapist, service) => { /* TODO: book specific service */ setMenuTherapist(null) }}
      />
    </div>
  )
}
