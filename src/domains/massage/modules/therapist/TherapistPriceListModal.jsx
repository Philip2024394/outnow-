/**
 * TherapistPriceListModal — Full-screen slide-up price menu.
 * Converted from src/modules/therapist/TherapistPriceListModal.tsx
 * TypeScript removed. Tailwind→CSS Modules. Logic identical.
 *
 * Two steps:
 * 1. 'menu': Scheduled/Book Now buttons + 60/90/120 price rows
 * 2. 'scheduled': Date/time picker + deposit notice (Indonesia)
 */
import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { getTherapistDisplayName } from '../../utils/therapistCardHelpers'
import { formatPrice } from '../../utils/therapistCardHelpers'
import styles from './TherapistPriceListModal.module.css'

export default function TherapistPriceListModal({
  showPriceListModal,
  setShowPriceListModal,
  therapist,
  menuData: legacyMenuData,
  onBookNow,
  onSchedule,
  chatLang = 'en',
}) {
  const [menuSliderStep, setMenuSliderStep] = useState('menu') // 'menu' | 'scheduled'
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [scheduledTime, setScheduledTime] = useState('12:00')

  const activeMenuData = useMemo(() => {
    if (!legacyMenuData?.length) return []
    return legacyMenuData
  }, [legacyMenuData])

  // Pricing for 60/90/120
  const pricing = useMemo(() => {
    const first = activeMenuData[0]
    if (first) {
      const toNum = (v) => (v != null && Number(v) > 0 ? Number(v) * 1000 : 0)
      return {
        60: toNum(first.price60 ?? first.price_60),
        90: toNum(first.price90 ?? first.price_90),
        120: toNum(first.price120 ?? first.price_120),
      }
    }
    const p = therapist
    const parse = (v) => (v != null && Number(v) > 0 ? (Number(v) < 1000 ? Number(v) * 1000 : Number(v)) : 0)
    if (typeof p?.pricing === 'object' && p.pricing !== null) {
      return { 60: parse(p.pricing['60']), 90: parse(p.pricing['90']), 120: parse(p.pricing['120']) }
    }
    return { 60: parse(p?.price60), 90: parse(p?.price90), 120: parse(p?.price120) }
  }, [activeMenuData, therapist])

  const treatmentsLabel = therapist?.services || (chatLang === 'id' ? 'Semua jenis pijat' : 'All Massage Types')
  const isId = chatLang === 'id'

  const closeSlider = () => {
    setShowPriceListModal(false)
    setMenuSliderStep('menu')
  }

  if (!showPriceListModal) return null

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Menu prices"
    >
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={closeSlider} aria-hidden />

      {/* Sheet */}
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        {/* Sticky header */}
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>
            {menuSliderStep === 'scheduled'
              ? (isId ? 'Pilih tanggal & waktu' : 'Select date & time')
              : `${getTherapistDisplayName(therapist.name)} – Menu`}
          </h3>
          <button
            type="button"
            onClick={closeSlider}
            className={styles.closeBtn}
            aria-label="Close"
          >
            <svg className={styles.closeBtnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          {menuSliderStep === 'scheduled' ? (
            <>
              {/* ═══ Scheduled step: date/time picker ═══ */}
              <p className={styles.scheduledDesc}>
                {isId ? 'Pilih tanggal dan waktu yang Anda inginkan untuk pijat.' : 'Choose your preferred date and time for the massage.'}
              </p>
              <div className={styles.scheduledFields}>
                <div>
                  <label className={styles.fieldLabel}>{isId ? 'Tanggal' : 'Date'}</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className={styles.fieldInput}
                  />
                </div>
                <div>
                  <label className={styles.fieldLabel}>{isId ? 'Waktu' : 'Time'}</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className={styles.fieldInput}
                  />
                </div>
              </div>

              {/* Deposit notice */}
              <div className={styles.depositNotice}>
                <p className={styles.depositTitle}>⚠️ 30% deposit required</p>
                <p className={styles.depositText}>
                  {isId
                    ? 'Deposit 30% diperlukan untuk booking pijat terjadwal. Dibayar ke admin untuk konfirmasi. (Indonesia)'
                    : 'A 30% deposit is required for all scheduled massage. Payable to admin for confirmation of booking. (Indonesia only)'}
                </p>
              </div>

              <div className={styles.scheduledActions}>
                <button
                  type="button"
                  onClick={() => {
                    onSchedule?.({
                      therapist,
                      date: scheduledDate,
                      time: scheduledTime,
                      pricing,
                    })
                    closeSlider()
                  }}
                  className={styles.confirmBtn}
                >
                  {isId ? 'Konfirmasi & lanjutkan' : 'Confirm & continue'}
                </button>
                <button
                  type="button"
                  onClick={() => setMenuSliderStep('menu')}
                  className={styles.backBtn}
                >
                  {isId ? 'Kembali' : 'Back'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* ═══ Menu step: Scheduled + Book Now buttons + price rows ═══ */}
              <div className={styles.actionGrid}>
                <button
                  type="button"
                  onClick={() => setMenuSliderStep('scheduled')}
                  className={styles.scheduleActionBtn}
                >
                  {/* Calendar icon — was lucide Calendar */}
                  <svg className={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {isId ? 'Terjadwal' : 'Scheduled'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onBookNow?.({ therapist, pricing })
                    closeSlider()
                  }}
                  className={styles.bookNowActionBtn}
                >
                  {/* Clock icon — was lucide Clock */}
                  <svg className={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {isId ? 'Pesan Sekarang' : 'Book Now'}
                </button>
              </div>

              <p className={styles.treatmentsLabel}>{treatmentsLabel}</p>

              {/* 60 / 90 / 120 price rows — same style as CityPlaceCard */}
              {[
                { label: '60 min', key: '60' },
                { label: '90 min', key: '90' },
                { label: '120 min', key: '120' },
              ].map(({ label, key }) => (
                <div key={key} className={styles.priceRow}>
                  <span className={styles.priceRowLabel}>Session · {label}</span>
                  <span className={styles.priceRowValue}>
                    {pricing[key] > 0 ? `IDR ${formatPrice(pricing[key])}` : (isId ? 'Hubungi' : 'Contact')}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
