import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import styles from './VenueListSheet.module.css'

const BG_URL = 'https://ik.imagekit.io/dateme/UntitledDFSDFASDFDFGSDFGsfdfasd.png'

export default function VenueListSheet({ open, venues = [], onClose, onSelectVenue }) {
  const sorted = [...venues].sort((a, b) => b.count - a.count)
  const [slide, setSlide] = useState(0)

  const prev = () => setSlide(s => Math.max(0, s - 1))
  const next = () => setSlide(s => Math.min(sorted.length - 1, s + 1))

  return (
    <BottomSheet open={open} onClose={onClose} title="Hot Venues">
      <div className={styles.container}>

        {/* Full-size background image */}
        <img src={BG_URL} alt="" className={styles.bgImage} />
        {/* Dark frosted overlay */}
        <div className={styles.frost} />

        {/* Content */}
        <div className={styles.inner}>
          {sorted.length === 0 ? (
            <div className={styles.empty}>No active venues right now</div>
          ) : (
            <>
              {/* Counter */}
              <div className={styles.counter}>
                <span className={styles.counterNum}>{slide + 1}</span>
                <span className={styles.counterSep}> / </span>
                <span className={styles.counterTotal}>{sorted.length}</span>
              </div>

              {/* Venue frosted glass card */}
              {(() => {
                const venue = sorted[slide]
                const isHot = venue.count >= 2
                return (
                  <button
                    className={styles.card}
                    onClick={() => { onSelectVenue?.(venue); onClose?.() }}
                  >
                    <div className={styles.cardTop}>
                      <span className={styles.cardEmoji}>{venue.emoji}</span>
                      <div className={styles.cardInfo}>
                        <span className={styles.cardName}>{venue.name}</span>
                        <span className={styles.cardType}>{venue.type} · {venue.address}</span>
                      </div>
                    </div>
                    <div className={styles.cardBottom}>
                      <div className={styles.cardCount}>
                        {isHot && <span className={styles.hotDot} />}
                        <span className={styles.countNum}>{venue.count}</span>
                        <span className={styles.countLabel}>{venue.count === 1 ? 'person here' : 'people here'}</span>
                      </div>
                      {venue.deal && <span className={styles.dealChip}>🏷️ {venue.deal.title}</span>}
                    </div>
                    <span className={styles.cardTap}>Tap to view →</span>
                  </button>
                )
              })()}

              {/* Nav */}
              {sorted.length > 1 && (
                <div className={styles.navRow}>
                  <button className={`${styles.navBtn} ${slide === 0 ? styles.navBtnDisabled : ''}`} onClick={prev} disabled={slide === 0}>‹</button>
                  <div className={styles.dots}>
                    {sorted.map((_, i) => (
                      <button key={i} className={`${styles.dot} ${i === slide ? styles.dotActive : ''}`} onClick={() => setSlide(i)} />
                    ))}
                  </div>
                  <button className={`${styles.navBtn} ${slide === sorted.length - 1 ? styles.navBtnDisabled : ''}`} onClick={next} disabled={slide === sorted.length - 1}>›</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}
