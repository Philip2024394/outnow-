import BottomSheet from '@/components/ui/BottomSheet'
import styles from './MapFilterSheet.module.css'

const ACTIVITIES = ['All', 'Drinks', 'Food', 'Coffee', 'Walk', 'Hangout', 'Cinema', 'Shopping']
const GENDERS    = ['All', 'Men', 'Women', 'Gay', 'Lesbian', 'Bisexual', 'Non-binary', 'Trans', 'Queer']
const STATUSES   = ['All', 'Out Now', 'Out Later']
const CITIES     = ['All', 'Soho', 'Shoreditch', 'Camden', 'Notting Hill', 'Brixton', 'Dalston', 'Covent Garden', 'Bloomsbury', 'Fitzrovia', 'Oxford Street', 'Leicester Sq', 'Hyde Park']

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
  const isActive = Object.entries(filters).some(([k, v]) => v !== DEFAULT_MAP_FILTERS[k])

  return (
    <BottomSheet open={open} onClose={onClose} title="">
      <div className={styles.sheet}>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>Map Filters</span>
          {isActive && (
            <button className={styles.resetBtn} onClick={onReset}>Reset all</button>
          )}
        </div>

        {/* Country — read-only */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Country</label>
          <div className={styles.countryRow}>
            <span className={styles.flag}>🇬🇧</span>
            <span className={styles.countryName}>{filters.country}</span>
            <span className={styles.countryLock}>Auto-detected</span>
          </div>
        </div>

        <Dropdown
          label="City"
          options={CITIES}
          value={filters.city}
          onChange={v => onChange({ ...filters, city: v })}
        />

        <Dropdown
          label="Who's Out"
          options={STATUSES}
          value={filters.status}
          onChange={v => onChange({ ...filters, status: v })}
        />

        <Dropdown
          label="Activity"
          options={ACTIVITIES}
          value={filters.activity}
          onChange={v => onChange({ ...filters, activity: v })}
        />

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
    </BottomSheet>
  )
}
