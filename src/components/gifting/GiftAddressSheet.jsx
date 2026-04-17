/**
 * GiftAddressSheet.jsx
 * Lets a user set their private gift delivery address.
 * This address is NEVER shown to gift senders — only to sellers
 * after they acknowledge the order (via reveal_gift_address RPC),
 * and only within the 7-day delivery window.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { saveGiftAddress, getMyGiftAddress } from '@/services/giftService'
import styles from './GiftAddressSheet.module.css'

export default function GiftAddressSheet({ open, onClose, showToast }) {
  const { user } = useAuth()
  const userId   = user?.uid ?? user?.id ?? null

  const [street,       setStreet]       = useState('')
  const [district,     setDistrict]     = useState('')
  const [city,         setCity]         = useState('')
  const [postalCode,   setPostalCode]   = useState('')
  const [country,      setCountry]      = useState('Indonesia')
  const [instructions, setInstructions] = useState('')
  const [saving,       setSaving]       = useState(false)
  const [loaded,       setLoaded]       = useState(false)

  // Load existing address on open
  useEffect(() => {
    if (!open || !userId || loaded) return
    getMyGiftAddress(userId).then(addr => {
      if (addr) {
        setStreet(addr.street ?? '')
        setDistrict(addr.district ?? '')
        setCity(addr.city ?? '')
        setPostalCode(addr.postal_code ?? '')
        setCountry(addr.country ?? 'Indonesia')
        setInstructions(addr.instructions ?? '')
      }
      setLoaded(true)
    })
  }, [open, userId, loaded])

  // Reset loaded flag when sheet closes so it refreshes next time
  useEffect(() => { if (!open) setLoaded(false) }, [open])

  if (!open) return null

  const valid = street.trim() && district.trim() && city.trim()

  const handleSave = async () => {
    if (!valid || !userId) return
    setSaving(true)
    const { error } = await saveGiftAddress(userId, {
      street, district, city, postalCode, country, instructions,
    })
    setSaving(false)
    if (error) {
      showToast?.(error, 'error')
    } else {
      showToast?.('Gift address saved 🔒', 'success')
      onClose?.()
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.lockIcon}>🔒</div>
          <div className={styles.headerText}>
            <h2 className={styles.title}>Gift Delivery Address</h2>
            <p className={styles.subtitle}>
              Private — only used when someone sends you a gift via Indoo
            </p>
          </div>
        </div>

        {/* Privacy notice */}
        <div className={styles.privacyCard}>
          <p className={styles.privacyText}>
            <strong>Your privacy is protected.</strong> Gift senders <em>never</em> see your address.
            Only the seller sees it — district-level first, full address only after they acknowledge
            the order. It auto-deletes 7 days after delivery.
          </p>
        </div>

        {/* Form */}
        <div className={styles.form}>

          <label className={styles.fieldLabel}>
            Street address
            <span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            value={street}
            onChange={e => setStreet(e.target.value)}
            placeholder="Jl. Kemang Raya No. 45, RT 03/RW 02"
          />

          <label className={styles.fieldLabel}>
            District / Area
            <span className={styles.required}>*</span>
            <span className={styles.hint}> (shown to seller before full address)</span>
          </label>
          <input
            className={styles.input}
            value={district}
            onChange={e => setDistrict(e.target.value)}
            placeholder="Kemang, Mampang Prapatan"
          />

          <div className={styles.rowFields}>
            <div className={styles.rowField}>
              <label className={styles.fieldLabel}>
                City <span className={styles.required}>*</span>
              </label>
              <input
                className={styles.input}
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Jakarta Selatan"
              />
            </div>
            <div className={styles.rowField}>
              <label className={styles.fieldLabel}>Postal code</label>
              <input
                className={styles.input}
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                placeholder="12730"
              />
            </div>
          </div>

          <label className={styles.fieldLabel}>Country</label>
          <input
            className={styles.input}
            value={country}
            onChange={e => setCountry(e.target.value)}
            placeholder="Indonesia"
          />

          <label className={styles.fieldLabel}>
            Delivery instructions
            <span className={styles.hint}> (optional)</span>
          </label>
          <textarea
            className={styles.textarea}
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder="e.g. Ring bell 3 times, leave with security, call on arrival"
            rows={2}
            maxLength={200}
          />

        </div>

        {/* Actions */}
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!valid || saving}
        >
          {saving ? <span className={styles.spinner} /> : '🔒 Save Private Address'}
        </button>

        <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>

      </div>
    </div>
  )
}
