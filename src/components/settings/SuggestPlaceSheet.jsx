import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { submitVenueSuggestion } from '@/services/suggestVenueService'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import styles from './SuggestPlaceSheet.module.css'


export default function SuggestPlaceSheet({ open, onClose, showToast }) {
  const { user, userProfile } = useAuth()
  const [name,          setName]         = useState('')
  const [area,          setArea]         = useState('')
  const [activities,    setActivities]   = useState([])
  const [link,          setLink]         = useState('')
  const [openTime,      setOpenTime]     = useState('')
  const [closeTime,     setCloseTime]    = useState('')
  const [offersDiscount,  setOffersDiscount]  = useState(false)
  const [discountPercent, setDiscountPercent] = useState(10)
  const [discountType,    setDiscountType]    = useState(null)
  const [loading,         setLoading]         = useState(false)
  const [done,            setDone]            = useState(false)

  const DISCOUNT_TYPES = [
    { id: 'drinks',   label: '🍺 Drinks'    },
    { id: 'food',     label: '🍕 Food'      },
    { id: 'entry',    label: '🎟️ Entry'    },
    { id: 'all',      label: '🏷️ Full Menu' },
  ]

  const toggleActivity = (id) => {
    setActivities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const canSubmit = name.trim() && area.trim()

  const handleSubmit = async () => {
    if (!canSubmit || loading) return
    setLoading(true)
    try {
      await submitVenueSuggestion({
        name:          name.trim(),
        area:          area.trim(),
        activityTypes: activities,
        link:          link.trim(),
        openTime,
        closeTime,
        offersDiscount,
        discountPercent: offersDiscount ? discountPercent : null,
        discountType:    offersDiscount ? discountType    : null,
        userId:          user?.uid ?? 'demo',
        displayName:     userProfile?.displayName ?? 'Anonymous',
      })
      setDone(true)
      showToast?.('Thanks! We\'ll review your suggestion soon.', 'success')
    } catch {
      showToast?.('Could not submit. Try again.', 'error')
    }
    setLoading(false)
  }

  const handleClose = () => {
    setName(''); setArea(''); setActivities([]); setLink('')
    setOpenTime(''); setCloseTime(''); setDone(false)
    setOffersDiscount(false); setDiscountPercent(10); setDiscountType(null)
    onClose()
  }

  if (!open) return null

  return (
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={handleClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} onClick={handleClose} />

        <div className={styles.scrollContent}>
          {done ? (
            <div className={styles.doneWrap}>
              <div className={styles.doneIcon}>📍</div>
              <h2 className={styles.doneTitle}>Suggestion Received!</h2>
              <p className={styles.doneSub}>
                Our team will review it and add it to the map if it's a great spot.
                Thanks for helping grow the community.
              </p>
              <button className={styles.doneBtn} onClick={handleClose}>Done</button>
            </div>
          ) : (
            <>
              <h2 className={styles.title}>Suggest a Place</h2>
              <p className={styles.sub}>Know a great spot to meet? Tell us about it.</p>

              {/* Venue name */}
              <div className={styles.field}>
                <label className={styles.label}>Venue Name *</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. The Blue Anchor"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={80}
                />
              </div>

              {/* Area */}
              <div className={styles.field}>
                <label className={styles.label}>Area / Neighbourhood *</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. Shoreditch, London"
                  value={area}
                  onChange={e => setArea(e.target.value)}
                  maxLength={80}
                />
              </div>

              {/* Activity types */}
              <div className={styles.field}>
                <label className={styles.label}>Good For</label>
                <div className={styles.chipGrid}>
                  {ACTIVITY_TYPES.map(a => (
                    <button
                      key={a.id}
                      className={`${styles.chip} ${activities.includes(a.id) ? styles.chipActive : ''}`}
                      onClick={() => toggleActivity(a.id)}
                      type="button"
                    >
                      {a.emoji} {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opening hours */}
              <div className={styles.field}>
                <label className={styles.label}>Opening Hours (optional)</label>
                <div className={styles.timeRow}>
                  <div className={styles.timeField}>
                    <span className={styles.timeLabel}>Opens</span>
                    <input
                      className={styles.input}
                      type="time"
                      value={openTime}
                      onChange={e => setOpenTime(e.target.value)}
                    />
                  </div>
                  <div className={styles.timeField}>
                    <span className={styles.timeLabel}>Closes</span>
                    <input
                      className={styles.input}
                      type="time"
                      value={closeTime}
                      onChange={e => setCloseTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Link */}
              <div className={styles.field}>
                <label className={styles.label}>Instagram / Facebook / Google Maps (optional)</label>
                <input
                  className={styles.input}
                  type="url"
                  placeholder="Paste a link…"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                />
              </div>

              {/* Discount offer */}
              <div className={styles.discountBox}>
                <button
                  type="button"
                  className={styles.discountToggle}
                  onClick={() => setOffersDiscount(v => !v)}
                >
                  <div className={styles.discountToggleText}>
                    <span className={styles.discountToggleTitle}>🏷️ Offer a Hangger discount?</span>
                    <span className={styles.discountToggleSub}>
                      Venues with a discount get highlighted on the map
                    </span>
                  </div>
                  <div className={`${styles.toggle} ${offersDiscount ? styles.toggleOn : ''}`}>
                    <div className={styles.toggleThumb} />
                  </div>
                </button>

                {offersDiscount && (
                  <div className={styles.discountFields}>
                    <div className={styles.discountRow}>
                      <label className={styles.label}>Discount %</label>
                      <div className={styles.percentWrap}>
                        <input
                          className={`${styles.input} ${styles.percentInput}`}
                          type="number"
                          min={10}
                          max={100}
                          value={discountPercent}
                          onChange={e => setDiscountPercent(Math.max(10, Number(e.target.value)))}
                        />
                        <span className={styles.percentSign}>%</span>
                      </div>
                      {discountPercent < 10 && (
                        <span className={styles.discountWarn}>Minimum 10%</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Applies to</label>
                      <div className={styles.discountTypeRow}>
                        {DISCOUNT_TYPES.map(d => (
                          <button
                            key={d.id}
                            type="button"
                            className={`${styles.chip} ${discountType === d.id ? styles.chipDiscount : ''}`}
                            onClick={() => setDiscountType(d.id === discountType ? null : d.id)}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className={styles.discountNote}>
                      Our team will contact the venue to confirm this offer before it goes live.
                      Minimum discount for all countries is 10%.
                    </p>
                  </div>
                )}
              </div>

              <button
                className={`${styles.submitBtn} ${!canSubmit ? styles.submitDisabled : ''}`}
                disabled={!canSubmit || loading}
                onClick={handleSubmit}
              >
                {loading ? 'Submitting…' : '📍 Submit Suggestion'}
              </button>

              <p className={styles.disclaimer}>
                Suggestions are reviewed by our team before appearing on the map.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
