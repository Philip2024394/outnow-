/**
 * TherapistSpecialties — "Treatments: Traditional, Deep Tissue, Aromatherapy, Hot Stone"
 * Converted from src/modules/therapist/TherapistSpecialties.tsx
 * Same layout as Massage City Places card.
 */
import styles from './TherapistSpecialties.module.css'

const DEFAULT_TREATMENTS = 'Traditional, Deep Tissue, Aromatherapy, Hot Stone'

function parseMassageTypes(raw) {
  if (Array.isArray(raw)) return raw
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

export default function TherapistSpecialties({ therapist }) {
  const massageTypes = therapist.massageTypes
    ? parseMassageTypes(therapist.massageTypes)
    : []

  const treatmentsLabel =
    Array.isArray(massageTypes) && massageTypes.length > 0
      ? massageTypes.join(', ')
      : DEFAULT_TREATMENTS

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <p className={styles.text}>
          <span className={styles.bold}>Treatments:</span> {treatmentsLabel}
        </p>
      </div>
    </div>
  )
}
