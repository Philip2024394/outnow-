import { getDirectory } from '@/services/vehicleDirectoryService'
import IndooFooter from '@/components/ui/IndooFooter'
import styles from '../RentalSearchScreen.module.css'

const BIKE_DIR_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2003_29_38%20AM.png?updatedAt=1777408195502'
const CAR_DIR_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2003_31_56%20AM.png?updatedAt=1777408335834'
const TRUCK_DIR_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2003_29_38%20AM.png?updatedAt=1777408195502'
const BUS_DIR_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2003_29_38%20AM.png?updatedAt=1777408195502'

export { BIKE_DIR_BG, CAR_DIR_BG, TRUCK_DIR_BG, BUS_DIR_BG }

export default function VehicleDirectory({ vehicleType, onSelectModel, onBack, listingMode }) {
  const directory = getDirectory(vehicleType)
  const isBike = vehicleType === 'Motorcycles'
  const isTruck = vehicleType === 'Trucks'
  const isBus = vehicleType === 'Buses'
  const title = isBike ? 'Motorbikes' : isTruck ? 'Trucks' : isBus ? 'Buses' : 'Cars'
  const bgUrl = isBike ? BIKE_DIR_BG : isTruck ? TRUCK_DIR_BG : isBus ? BUS_DIR_BG : CAR_DIR_BG
  const bgStyle = bgUrl ? { backgroundImage: `url("${bgUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}

  return (
    <div className={styles.dirPage} style={bgStyle}>
      <div className={styles.dirHero}>
        <h1 className={styles.dirHeroTitle}>{listingMode === 'sale' ? `${title} to Buy` : listingMode === 'rent' ? `${title} to Rent` : title}</h1>
        <p className={styles.dirHeroSub}>
          {(() => { const c = (() => { try { return JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}').city } catch { return '' } })() || 'your city'; return isBike ? `Find your perfect ride in ${c}` : isTruck ? `Heavy-duty vehicles in ${c}` : isBus ? `Group travel in ${c}` : `Drive in comfort in ${c}` })()}
        </p>
      </div>
      <div className={styles.dirBody}>
        <div className={styles.dirGrid}>
          {directory.map((v, idx) => (
            <button key={v.id} className={styles.dirCard} onClick={() => onSelectModel(v)} style={{ animationDelay: `${idx * 0.08}s` }}>
              <div className={styles.dirCardAccent} />
              <div className={styles.dirCardImgWrap}>
                {v.image ? (
                  <img src={v.image} alt={v.name} className={styles.dirCardImg} />
                ) : (
                  <span className={styles.dirCardPlaceholder}>{isBike ? '\ud83c\udfcd\ufe0f' : isTruck ? '\ud83d\ude9b' : isBus ? '\ud83d\ude8c' : '\ud83d\ude97'}</span>
                )}
                <div className={styles.dirCardReflection} />
              </div>
              <div className={styles.dirCardInfo}>
                <span className={styles.dirCardName}>{v.name}</span>
                <div className={styles.dirCardChips}>
                  <span className={styles.dirCardChip}>{v.cc}cc</span>
                  <span className={styles.dirCardChip}>{v.type}</span>
                  {v.seats && <span className={styles.dirCardChip}>{v.seats} seat{v.seats > 1 ? 's' : ''}</span>}
                  {v.payload && <span className={styles.dirCardChip}>{v.payload}</span>}
                </div>
                {v.priceFrom && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F' }}>Rp {(v.priceFrom/1000).toFixed(0)}k</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>-</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F' }}>{(v.priceTo/1000).toFixed(0)}k</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>/ Day</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#FFD700' }}>{v.listings}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>Available Now</span>
                </div>
              </div>
              {!isBike && (
                <div className={styles.dirCardDriver} title="Driver available">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
                </div>
              )}
              <div className={styles.dirCardArrow}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>
          ))}
        </div>
      </div>
      <IndooFooter label={title} onBack={onBack} onHome={onBack} />
    </div>
  )
}
