import { useEffect, useRef, useState } from 'react'
import styles from './MapFilterSheet.module.css'
import { ALL_COUNTRIES } from '@/utils/countries'
import { ACTIVITY_TYPES, ACTIVITY_CATEGORIES } from '@/firebase/collections'

const BG_URL = 'https://ik.imagekit.io/dateme/UntitledDFSDFASDFDFGSDFGsfdfasdsadas.png'

const GENDERS    = ['All', 'Men', 'Women', 'Gay', 'Lesbian', 'Bisexual', 'Non-binary', 'Trans', 'Queer']
const STATUSES   = ['All', 'Out Now', 'Out Later']

export const DEFAULT_MAP_FILTERS = {
  status:   'All',
  activity: 'All',
  gender:   'All',
  radiusKm: 10,
  country:  'United Kingdom',
  city:     'All',
}

function Dropdown({ label, options, value, onChange }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.selectWrap}>
        <select
          className={styles.select}
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <svg className={styles.selectArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  )
}

function RadiusSlider({ value, onChange }) {
  const pct = ((value - 1) / (50 - 1)) * 100
  return (
    <div className={styles.field}>
      <div className={styles.sliderHeader}>
        <label className={styles.fieldLabel}>Search Radius</label>
        <span className={styles.sliderValue}>{value} km</span>
      </div>
      <div className={styles.sliderWrap}>
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className={styles.slider}
          style={{ '--pct': `${pct}%` }}
        />
        <div className={styles.sliderTicks}>
          {[1, 10, 20, 30, 40, 50].map(v => (
            <span key={v} className={styles.sliderTick}>{v}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MapFilterSheet({ open, onClose, filters, onChange, onReset }) {
  const sheetRef = useRef(null)
  const startYRef = useRef(null)
  const currentYRef = useRef(0)
  const isActive = Object.entries(filters).some(([k, v]) => v !== DEFAULT_MAP_FILTERS[k])
  const [activeCategory, setActiveCategory] = useState('all')

  const visibleActivities = activeCategory === 'all'
    ? ACTIVITY_TYPES
    : ACTIVITY_TYPES.filter(a => a.category === activeCategory)

  // Swipe to dismiss
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const onTouchStart = (e) => { startYRef.current = e.touches[0].clientY }
    const onTouchMove  = (e) => {
      if (startYRef.current === null) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0) {
        currentYRef.current = delta
        sheet.style.transform = `translateY(${delta}px)`
        sheet.style.transition = 'none'
      }
    }
    const onTouchEnd = () => {
      sheet.style.transition = ''
      if (currentYRef.current > 120) onClose()
      else sheet.style.transform = ''
      startYRef.current = null
      currentYRef.current = 0
    }
    sheet.addEventListener('touchstart', onTouchStart, { passive: true })
    sheet.addEventListener('touchmove',  onTouchMove,  { passive: true })
    sheet.addEventListener('touchend',   onTouchEnd)
    return () => {
      sheet.removeEventListener('touchstart', onTouchStart)
      sheet.removeEventListener('touchmove',  onTouchMove)
      sheet.removeEventListener('touchend',   onTouchEnd)
    }
  }, [onClose])

  if (!open) return null

  return (
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />

      <div ref={sheetRef} className={styles.sheet}>
        {/* Full-bleed background image */}
        <img src={BG_URL} alt="" className={styles.bgImage} />
        {/* Dark overlay */}
        <div className={styles.frost} />

        {/* Drag handle */}
        <div className={styles.handle} onClick={onClose} />

        {/* Scrollable content */}
        <div className={styles.content}>

          {/* Header */}
          <div className={styles.header}>
            <span className={styles.title}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, verticalAlign: 'middle', color: '#8DC63F' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Map Filters
            </span>
            {isActive && (
              <button className={styles.resetBtn} onClick={onReset}>Reset all</button>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Country</label>
            <div className={styles.selectWrap}>
              <select
                className={styles.select}
                value={filters.country}
                onChange={e => onChange({ ...filters, country: e.target.value })}
              >
                {ALL_COUNTRIES.map(c => (
                  <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                ))}
              </select>
              <svg className={styles.selectArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <Dropdown
            label="Who's Out"
            options={STATUSES}
            value={filters.status}
            onChange={v => onChange({ ...filters, status: v })}
          />

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Activity</label>
            {/* Category pills */}
            <div className={styles.categoryRow}>
              <button
                className={`${styles.categoryPill} ${activeCategory === 'all' ? styles.categoryPillActive : ''}`}
                onClick={() => { setActiveCategory('all'); onChange({ ...filters, activity: 'All' }) }}
              >
                All
              </button>
              {ACTIVITY_CATEGORIES.map(c => (
                <button
                  key={c.id}
                  className={`${styles.categoryPill} ${activeCategory === c.id ? styles.categoryPillActive : ''}`}
                  onClick={() => setActiveCategory(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {/* Activity chips filtered by category */}
            <div className={styles.activityGrid}>
              {visibleActivities.map(a => (
                <button
                  key={a.id}
                  className={`${styles.activityChip} ${filters.activity === a.id ? styles.activityChipActive : ''}`}
                  onClick={() => onChange({ ...filters, activity: a.id })}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <Dropdown
            label="Gender"
            options={GENDERS}
            value={filters.gender}
            onChange={v => onChange({ ...filters, gender: v })}
          />

          <RadiusSlider
            value={filters.radiusKm}
            onChange={v => onChange({ ...filters, radiusKm: v })}
          />

          <button className={styles.applyBtn} onClick={onClose}>
            Show Results
          </button>
        </div>
      </div>
    </div>
  )
}
