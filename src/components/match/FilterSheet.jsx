import BottomSheet from '@/components/ui/BottomSheet'
import styles from './FilterSheet.module.css'

const SPEED_OPTIONS   = ['All', 'Meet now', 'Today', 'This week']
const LOOKING_OPTIONS = ['All', 'Date', 'Chat', 'Meet now']
const DISTANCE_OPTIONS = ['Any', '< 1km', '< 3km', '< 5km', '< 10km']
const AGE_OPTIONS = ['Any', '18–25', '26–32', '33–40', '40+']

function ChipGroup({ label, options, value, onChange }) {
  return (
    <div className={styles.group}>
      <span className={styles.groupLabel}>{label}</span>
      <div className={styles.chips}>
        {options.map(o => (
          <button
            key={o}
            className={`${styles.chip} ${value === o ? styles.chipActive : ''}`}
            onClick={() => onChange(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function FilterSheet({ open, onClose, filters, onChange, onReset }) {
  const hasActive = filters.speed !== 'All' || filters.looking !== 'All'
    || filters.distance !== 'Any' || filters.age !== 'Any'

  return (
    <BottomSheet open={open} onClose={onClose} title="">
      <div className={styles.sheet}>
        <div className={styles.header}>
          <span className={styles.title}>Filter Profiles</span>
          {hasActive && (
            <button className={styles.resetBtn} onClick={onReset}>Reset all</button>
          )}
        </div>

        <ChipGroup
          label="Availability"
          options={SPEED_OPTIONS}
          value={filters.speed}
          onChange={v => onChange({ ...filters, speed: v })}
        />
        <ChipGroup
          label="Looking for"
          options={LOOKING_OPTIONS}
          value={filters.looking}
          onChange={v => onChange({ ...filters, looking: v })}
        />
        <ChipGroup
          label="Distance"
          options={DISTANCE_OPTIONS}
          value={filters.distance}
          onChange={v => onChange({ ...filters, distance: v })}
        />
        <ChipGroup
          label="Age"
          options={AGE_OPTIONS}
          value={filters.age}
          onChange={v => onChange({ ...filters, age: v })}
        />

        <button className={styles.applyBtn} onClick={onClose}>
          Show Results
        </button>
      </div>
    </BottomSheet>
  )
}
