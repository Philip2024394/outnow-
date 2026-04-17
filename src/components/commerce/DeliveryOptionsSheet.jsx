/**
 * DeliveryOptionsSheet
 * Bottom sheet for sellers to toggle which delivery services they offer
 * and set a base fare for Indoo Ride.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  DELIVERY_SERVICES,
  FOOD_DELIVERY_SERVICES,
  fetchDeliveryOptions,
  saveDeliveryOptions,
} from '@/services/commissionService'
import styles from './DeliveryOptionsSheet.module.css'

function fmtIDR(n) {
  return 'Rp ' + Number(n ?? 0).toLocaleString('id-ID')
}

export default function DeliveryOptionsSheet({ open, onClose, onSaved, mode = 'marketplace' }) {
  const services = mode === 'food' ? FOOD_DELIVERY_SERVICES : DELIVERY_SERVICES
  const { user } = useAuth()
  const [enabled, setEnabled] = useState({})    // { type: true/false }
  const [fareEdit, setFareEdit] = useState({})   // { type: '15000' }
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load saved options on open
  useEffect(() => {
    if (!open) return
    const uid = user?.uid ?? user?.id
    if (!uid) {
      // Demo: pre-toggle a few
      setEnabled({ indoo_ride: true, jnt: true, jne: true })
      setFareEdit({ indoo_ride: '15000' })
      return
    }
    fetchDeliveryOptions(uid).then(opts => {
      const en = {}
      const fe = {}
      opts.forEach(o => {
        en[o.type] = true
        if (o.base_fare) fe[o.type] = String(o.base_fare)
      })
      setEnabled(en)
      setFareEdit(fe)
    })
  }, [open, user])

  const toggle = (type) => setEnabled(prev => ({ ...prev, [type]: !prev[type] }))

  const handleSave = async () => {
    setSaving(true)
    const opts = services
      .filter(s => enabled[s.type])
      .map(s => ({
        type:      s.type,
        label:     s.label,
        city_only: s.cityOnly,
        base_fare: fareEdit[s.type] ? Number(fareEdit[s.type]) : s.baseFare,
        per_km:    s.perKm,
      }))

    const uid = user?.uid ?? user?.id
    if (uid) await saveDeliveryOptions(uid, opts)

    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); onSaved?.(opts); onClose?.() }, 900)
  }

  if (!open) return null

  const activeCount = services.filter(s => enabled[s.type]).length

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        <div className={styles.handle} />

        <div className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>Delivery Options</span>
          <span className={styles.sheetSub}>Choose which services you offer buyers</span>
        </div>

        <div className={styles.list}>
          {services.map(service => {
            const on = !!enabled[service.type]
            return (
              <div
                key={service.type}
                className={`${styles.row} ${on ? styles.rowOn : ''}`}
                onClick={() => toggle(service.type)}
              >
                <div className={styles.rowLeft}>
                  <span className={styles.rowLabel}>{service.label}</span>
                  <div className={styles.rowMeta}>
                    {service.cityOnly && (
                      <span className={styles.cityBadge}>City only</span>
                    )}
                    {!service.cityOnly && (
                      <span className={styles.nationalBadge}>Nationwide</span>
                    )}
                    <span className={styles.rowFareBase}>
                      Base from {fmtIDR(service.baseFare)}
                    </span>
                  </div>
                </div>

                <div className={styles.rowRight}>
                  {/* Custom base fare for Indoo Ride when enabled */}
                  {on && service.type === 'indoo_ride' && (
                    <div
                      className={styles.fareInputWrap}
                      onClick={e => e.stopPropagation()}
                    >
                      <span className={styles.farePrefix}>Rp</span>
                      <input
                        className={styles.fareInput}
                        type="number"
                        value={fareEdit['indoo_ride'] ?? ''}
                        onChange={e => setFareEdit(p => ({ ...p, indoo_ride: e.target.value }))}
                        placeholder="15000"
                        min="0"
                      />
                    </div>
                  )}
                  {/* Toggle */}
                  <div className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}>
                    <div className={styles.toggleThumb} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className={styles.footer}>
          <span className={styles.footerCount}>
            {activeCount} service{activeCount !== 1 ? 's' : ''} enabled
          </span>
          <button
            className={`${styles.saveBtn} ${saved ? styles.saveBtnSaved : ''}`}
            onClick={handleSave}
            disabled={saving || saved}
          >
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Options'}
          </button>
        </div>
      </div>
    </div>
  )
}
