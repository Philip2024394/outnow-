/**
 * BookingLivePanel — all active-trip and pre-trip phases:
 *   searching, choose driver, driver detail sheet, waiting for driver,
 *   expired booking, active ride, cancelling, cancelled.
 */
import { useState } from 'react'
import styles from '../BookingScreen.module.css'
import DriverMap from '@/components/driver/DriverMap'

const BIKE_IMG = 'https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png'
const CAR_IMG  = 'https://ik.imagekit.io/nepgaxllc/Sporty%20green%20and%20black%20hatchback.png'
const BANNER_BIKE = 'https://ik.imagekit.io/nepgaxllc/Untitlediuooiuoi-removebg-preview.png'
const BANNER_CAR  = 'https://ik.imagekit.io/nepgaxllc/Untitlediuooiuoifsdfsdfdasdadasd-removebg-preview.png'

const CANCEL_REASONS = ['Driver didn\'t show', 'Wrong vehicle', 'Changed my mind', 'Safety concern', 'Other']

export default function BookingLivePanel({
  phase, setPhase,
  drivers,
  selectedDriver,
  sheetDriver, setSheetDriver,
  sheetService, setSheetService,
  packageNote, setPackageNote,
  packageWeight, setPackageWeight,
  pkgLength, setPkgLength,
  pkgWidth, setPkgWidth,
  pkgHeight, setPkgHeight,
  featuredIdx,
  bannerFade,
  vehicleType,
  pickupCoords,
  fare, formatRp,
  countdown,
  pickup, destination,
  cancelReason, setCancelReason,
  handleSelectDriver,
  handleTryAnother,
  handleJourneyComplete,
  handleCancelRide,
  onClose,
}) {
  const [contactRevealed, setContactRevealed] = useState(false)
  const [addStopOpen, setAddStopOpen] = useState(false)
  const [stopQuery, setStopQuery] = useState('')
  const [stops, setStops] = useState([]) // { address, waitMin }
  const [stopFareExtra, setStopFareExtra] = useState(0)

  const availableDrivers = drivers.filter(d => !d.driver_busy)
  const busyDrivers      = drivers.filter(d => d.driver_busy)
  const featured = availableDrivers[featuredIdx % Math.max(availableDrivers.length, 1)] ?? availableDrivers[0]

  // ── Phase: searching ─────────────────────────────────────────────────────────
  if (phase === 'searching') {
    return (
      <div className={styles.centered}>
        <div className={styles.spinner} />
        <p className={styles.searchingText}>Finding nearby drivers…</p>
      </div>
    )
  }

  // ── Phase: choose ────────────────────────────────────────────────────────────
  if (phase === 'choose') {
    return (
      <div className={styles.body}>
        {featured && (
          <button
            className={`${styles.featuredBanner} ${bannerFade ? styles.featuredBannerVisible : styles.featuredBannerHidden}`}
            onClick={() => { setSheetDriver(featured); setSheetService('ride'); setPackageNote('') }}
          >
            <div className={styles.featuredLeft}>
              <div className={styles.featuredTopBadge}>⭐ Top Rated Near You</div>
              <div className={styles.featuredProfileRow}>
                <div className={styles.featuredAvatarWrap}>
                  <img
                    src={featured.driver_type === 'car_taxi' ? CAR_IMG : BIKE_IMG}
                    alt={featured.display_name}
                    className={styles.featuredAvatarImg}
                  />
                </div>
                <div className={styles.featuredMeta}>
                  <p className={styles.featuredName}>{featured.display_name}</p>
                  <p className={styles.featuredAge}>Age {featured.driver_age ?? '—'}</p>
                  <div className={styles.featuredStars}>
                    {'★'.repeat(Math.floor(featured.rating ?? 4.8))}
                    <span className={styles.featuredRatingNum}> {featured.rating ?? '4.8'}</span>
                  </div>
                </div>
              </div>
              <div className={styles.featuredStats}>
                <span className={styles.featuredStat}>{featured.total_trips ?? 0} trips</span>
                <span className={styles.featuredStatDot}>·</span>
                <span className={styles.featuredStat}>{featured.distKm} km away</span>
              </div>
              <div className={styles.featuredVehicle}>
                {featured.vehicle_model} {featured.vehicle_year}
              </div>
              <div className={styles.featuredServiceIcons}>
                <span className={styles.serviceIcon}>👤 Ride</span>
                <span className={styles.serviceIcon}>📦 Delivery</span>
              </div>
            </div>
            <div className={styles.featuredRight}>
              <div className={styles.featuredPriceBadge}>{formatRp(fare)}</div>
              <img src={featured.driver_type === 'car_taxi' ? BANNER_CAR : BANNER_BIKE} alt="vehicle" className={styles.featuredBikeImg} />
            </div>
          </button>
        )}

        <p className={styles.chooseSubtitle}>Available drivers</p>
        <div className={styles.driverList}>
          {availableDrivers.map(d => (
            <button
              key={d.id}
              className={styles.driverListCard}
              onClick={() => { setSheetDriver(d); setSheetService('ride'); setPackageNote('') }}
            >
              <div className={styles.driverListAvatar}>
                <img src={d.driver_type === 'car_taxi' ? CAR_IMG : BIKE_IMG} alt={d.driver_type} className={styles.driverAvatarImg} />
              </div>
              <div className={styles.driverListInfo}>
                <div className={styles.driverListTopRow}>
                  <span className={styles.driverListName}>{d.display_name}</span>
                  <span className={styles.driverListPrice}>{formatRp(fare)}</span>
                </div>
                <div className={styles.driverListStars}>
                  {'★'.repeat(Math.floor(d.rating ?? 4.8))}
                  <span className={styles.driverRatingNum}> {d.rating ?? '4.8'}</span>
                  <span className={styles.driverListTrips}> · {d.total_trips ?? 0} trips</span>
                </div>
                <div className={styles.driverListBottom}>
                  <span className={styles.driverListVehicle}>{d.vehicle_model} {d.vehicle_year}</span>
                  <div className={styles.driverListServiceIcons}>
                    <span className={styles.serviceIconSm}>👤</span>
                    <span className={styles.serviceIconSm}>📦</span>
                  </div>
                </div>
              </div>
              <span className={styles.driverListArrow}>›</span>
            </button>
          ))}
        </div>

        {busyDrivers.length > 0 && (
          <>
            <p className={styles.busySubtitle}>🟠 On a trip — available soon</p>
            <div className={styles.driverList}>
              {busyDrivers.map(d => (
                <button
                  key={d.id}
                  className={`${styles.driverListCard} ${styles.driverListCardBusy}`}
                  onClick={() => { setSheetDriver(d); setSheetService('ride'); setPackageNote('') }}
                >
                  <div className={styles.driverListAvatar}>
                    <img src={d.driver_type === 'car_taxi' ? CAR_IMG : BIKE_IMG} alt={d.driver_type} className={`${styles.driverAvatarImg} ${styles.driverAvatarBusy}`} />
                  </div>
                  <div className={styles.driverListInfo}>
                    <div className={styles.driverListTopRow}>
                      <span className={styles.driverListName}>{d.display_name}</span>
                      <span className={styles.busyBadge}>On a trip</span>
                    </div>
                    <div className={styles.driverListStars}>
                      {'★'.repeat(Math.floor(d.rating ?? 4.8))}
                      <span className={styles.driverRatingNum}> {d.rating ?? '4.8'}</span>
                      <span className={styles.driverListTrips}> · {d.total_trips ?? 0} trips</span>
                    </div>
                    <div className={styles.driverListBottom}>
                      <span className={styles.driverListVehicle}>{d.vehicle_model} {d.vehicle_year}</span>
                    </div>
                  </div>
                  <span className={styles.driverListArrow}>›</span>
                </button>
              ))}
            </div>
          </>
        )}
        <button className={styles.cancelBtn} onClick={() => setPhase('select')}>Cancel</button>
      </div>
    )
  }

  // ── Driver detail sheet (overlay over choose phase) ──────────────────────────
  // Rendered from BookingScreen when sheetDriver is set (any phase)
  if (sheetDriver) {
    const d = sheetDriver
    return (
      <div className={styles.sheetOverlay} onClick={() => setSheetDriver(null)}>
        <div className={styles.sheetPanel} onClick={e => e.stopPropagation()}>
          <div className={styles.sheetHandle} />
          <div className={styles.sheetHero}>
            <div className={styles.sheetVehicleWrap}>
              <img src={d.driver_type === 'car_taxi' ? CAR_IMG : BIKE_IMG} alt={d.display_name} className={styles.sheetVehicleImg} />
            </div>
            <div className={styles.sheetDriverInfo}>
              <p className={styles.sheetDriverName}>{d.display_name}</p>
              <p className={styles.sheetDriverAge}>Age {d.driver_age ?? '—'}</p>
              <div className={styles.sheetStars}>
                {'★'.repeat(Math.floor(d.rating ?? 4.8))}
                <span className={styles.sheetRatingNum}> {d.rating ?? '4.8'}</span>
              </div>
            </div>
          </div>

          <div className={styles.sheetSpecsCard}>
            <div className={styles.sheetSpecRow}><span className={styles.sheetSpecLabel}>Vehicle</span><span className={styles.sheetSpecValue}>{d.vehicle_model} {d.vehicle_year}</span></div>
            <div className={styles.sheetSpecRow}><span className={styles.sheetSpecLabel}>Color</span><span className={styles.sheetSpecValue}>{d.vehicle_color ?? '—'}</span></div>
            <div className={styles.sheetSpecRow}><span className={styles.sheetSpecLabel}>Plate</span><span className={styles.sheetSpecValue}>{d.plate_prefix ?? '—'} ••</span></div>
            <div className={styles.sheetSpecRow}><span className={styles.sheetSpecLabel}>Experience</span><span className={styles.sheetSpecValue}>{d.years_experience != null ? `${d.years_experience}+ years` : '—'}</span></div>
            <div className={styles.sheetSpecRow}><span className={styles.sheetSpecLabel}>Languages</span>
              <span className={styles.sheetSpecValue}>
                {['id', ...(d.languages?.filter(l => l !== 'id') ?? [])].map(l =>
                  l === 'id' ? '🇮🇩 Indonesia' : l === 'en' ? '🇬🇧 English' : l === 'ar' ? '🇸🇦 Arabic' : l
                ).join('  ·  ')}
              </span>
            </div>
            <div className={styles.sheetSpecRow}><span className={styles.sheetSpecLabel}>Total Trips</span><span className={styles.sheetSpecValue}>{(d.total_trips ?? 0).toLocaleString()}</span></div>
            <div className={styles.sheetSpecRow}><span className={styles.sheetSpecLabel}>Insurance</span><span className={`${styles.sheetSpecValue} ${styles.sheetSpecInsured}`}>✅ Insured Driver</span></div>
            <div className={styles.sheetSpecRow}><span className={styles.sheetSpecLabel}>Fare</span><span className={`${styles.sheetSpecValue} ${styles.sheetSpecFare}`}>{formatRp(fare)}</span></div>
          </div>

          <p className={styles.sheetServicesLabel}>Select service</p>
          <div className={styles.sheetServiceBtns}>
            <button className={`${styles.sheetServiceBtn} ${sheetService === 'ride' ? styles.sheetServiceBtnActive : ''}`} onClick={() => setSheetService('ride')}>
              <span className={styles.sheetServiceBtnLabel}>Ride</span>
              <img src="https://ik.imagekit.io/nepgaxllc/Riders%20on%20a%20sleek%20scooter.png" alt="Ride" className={`${styles.sheetServiceImg} ${styles.sheetServiceImgRide}`} />
            </button>
            <button className={`${styles.sheetServiceBtn} ${sheetService === 'delivery' ? styles.sheetServiceBtnActive : ''}`} onClick={() => setSheetService('delivery')}>
              <span className={styles.sheetServiceBtnLabel}>Package</span>
              <img src="https://ik.imagekit.io/nepgaxllc/Untitlediuooiuoifsdfsdf-removebg-preview.png" alt="Package" className={styles.sheetServiceImg} />
            </button>
          </div>

          {sheetService === 'delivery' && (
            <div className={styles.sheetPackageFields}>
              <p className={styles.sheetPackageTitle}>Package details</p>
              <div className={styles.pkgFieldGroup}>
                <div className={styles.pkgFieldIcon}>⚖️</div>
                <div className={styles.pkgFieldBody}>
                  <label className={styles.pkgFieldLabel}>Weight</label>
                  <div className={styles.pkgInputRow}>
                    <input className={styles.pkgInput} type="number" min="1" step="1" value={packageWeight} onChange={e => setPackageWeight(e.target.value)} placeholder="0" />
                    <span className={styles.pkgUnit}>grams</span>
                  </div>
                </div>
              </div>
              <div className={styles.pkgFieldGroup}>
                <div className={styles.pkgFieldIcon}>📐</div>
                <div className={styles.pkgFieldBody}>
                  <label className={styles.pkgFieldLabel}>Size (cm)</label>
                  <div className={styles.pkgDimsRow}>
                    <div className={styles.pkgDimWrap}>
                      <input className={styles.pkgDimInput} type="number" min="1" value={pkgLength} onChange={e => setPkgLength(e.target.value)} placeholder="0" />
                      <span className={styles.pkgDimLabel}>Length</span>
                    </div>
                    <span className={styles.pkgDimSep}>×</span>
                    <div className={styles.pkgDimWrap}>
                      <input className={styles.pkgDimInput} type="number" min="1" value={pkgWidth} onChange={e => setPkgWidth(e.target.value)} placeholder="0" />
                      <span className={styles.pkgDimLabel}>Width</span>
                    </div>
                    <span className={styles.pkgDimSep}>×</span>
                    <div className={styles.pkgDimWrap}>
                      <input className={styles.pkgDimInput} type="number" min="1" value={pkgHeight} onChange={e => setPkgHeight(e.target.value)} placeholder="0" />
                      <span className={styles.pkgDimLabel}>Height</span>
                    </div>
                  </div>
                </div>
              </div>
              <textarea
                className={styles.sheetPackageNote}
                value={packageNote}
                onChange={e => setPackageNote(e.target.value)}
                placeholder="Any extra details? (fragile, keep upright, urgent…)"
                rows={2}
                maxLength={200}
              />
            </div>
          )}

          {d.driver_busy ? (
            <div className={styles.sheetBusyNotice}>
              <span className={styles.sheetBusyIcon}>🟠</span>
              <div>
                <p className={styles.sheetBusyTitle}>Driver is currently on a trip</p>
                <p className={styles.sheetBusyHint}>They will become available once they finish. Go back and choose an available driver or wait.</p>
              </div>
            </div>
          ) : (
            <>
              {(() => {
                const pkgSize       = pkgLength && pkgWidth && pkgHeight ? `${pkgLength} × ${pkgWidth} × ${pkgHeight} cm` : ''
                const deliveryReady = packageWeight && pkgLength && pkgWidth && pkgHeight
                return (
                  <>
                    <button
                      className={styles.sheetBookBtn}
                      disabled={sheetService === 'delivery' && !deliveryReady}
                      onClick={() => handleSelectDriver(d, sheetService, packageNote, packageWeight ? `${packageWeight}g` : '', pkgSize)}
                    >
                      Book Now
                      <span className={styles.sheetBookArrow}> →</span>
                    </button>
                    {sheetService === 'delivery' && !deliveryReady && (
                      <p className={styles.sheetBookHint}>Enter weight and all dimensions to continue</p>
                    )}
                  </>
                )
              })()}
            </>
          )}
          <button className={styles.sheetCancelBtn} onClick={() => setSheetDriver(null)}>Back to drivers</button>
        </div>
      </div>
    )
  }

  // ── Phase: waiting ───────────────────────────────────────────────────────────
  if (phase === 'waiting') {
    const isBike = selectedDriver?.driver_type !== 'car_taxi'
    const processingImg = isBike
      ? 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2006_44_19%20AM.png'
      : 'https://ik.imagekit.io/nepgaxllc/Untitledddddddddd.png'
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9900, display: 'flex', flexDirection: 'column' }}>
        {/* Full-screen background */}
        <img src={processingImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.6) 100%)' }} />

        {/* Bottom content */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, zIndex: 2 }}>
          {/* Driver card */}
          <div style={{ padding: 16, borderRadius: 20, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid #FACC15', animation: 'ping 2s ease-in-out infinite', opacity: 0.4 }} />
                <img src={selectedDriver?.photo_url ?? (isBike ? BIKE_IMG : CAR_IMG)} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #FACC15' }} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>{selectedDriver?.display_name}</span>
                <span style={{ fontSize: 12, color: '#FACC15', fontWeight: 700 }}>Connecting to driver...</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: 2 }}>{selectedDriver?.vehicle_color} {selectedDriver?.vehicle_model}</span>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(250,204,21,0.15)', border: '2px solid rgba(250,204,21,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{countdown}s</span>
              </div>
            </div>
          </div>

          {/* Status text */}
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#8DC63F', animation: 'dotDance 1.8s ease-in-out infinite' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#8DC63F', animation: 'dotDance 1.8s ease-in-out 0.3s infinite' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#8DC63F', animation: 'dotDance 1.8s ease-in-out 0.6s infinite' }} />
            </div>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Finding the best driver for you</span>
          </div>

          <button onClick={handleTryAnother} style={{ width: '100%', padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            Try Another Driver
          </button>
        </div>
        <style>{`
          @keyframes ping { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
          @keyframes dotDance { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        `}</style>
      </div>
    )
  }

  // ── Phase: expired ───────────────────────────────────────────────────────────
  if (phase === 'expired') {
    const isBike = selectedDriver?.driver_type !== 'car_taxi'
    const bgImg = isBike
      ? 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2006_44_19%20AM.png'
      : 'https://ik.imagekit.io/nepgaxllc/Untitledddddddddd.png'
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9900, display: 'flex', flexDirection: 'column' }}>
        <img src={bgImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.5) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, zIndex: 2, textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(250,204,21,0.15)', border: '2px solid rgba(250,204,21,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ fontSize: 28 }}>🔄</span>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>Driver is busy</h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 20px', lineHeight: 1.5 }}>Your driver is currently on another job. We're finding the next available driver for you.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FACC15', animation: 'dotDance 1.4s ease-in-out infinite' }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FACC15', animation: 'dotDance 1.4s ease-in-out 0.2s infinite' }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FACC15', animation: 'dotDance 1.4s ease-in-out 0.4s infinite' }} />
          </div>
          <button onClick={handleTryAnother} style={{ width: '100%', padding: 16, borderRadius: 16, background: '#8DC63F', border: 'none', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>
            Find Next Driver
          </button>
          <button onClick={() => setPhase('select')} style={{ width: '100%', padding: 12, borderRadius: 12, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
        <style>{`@keyframes dotDance { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }`}</style>
      </div>
    )
  }

  // ── Phase: active ────────────────────────────────────────────────────────────
  if (phase === 'active') {
    const isBike = selectedDriver?.driver_type !== 'car_taxi'
    const eta = selectedDriver?.etaMin ?? Math.max(2, Math.round((selectedDriver?.distKm ?? 2) * 2.5))
    const activeImg = isBike
      ? 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2006_05_25%20AM.png?updatedAt=1776812742688'
      : 'https://ik.imagekit.io/nepgaxllc/Untitledddddddddd.png'
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9850, background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>

        {/* Header — same as food delivery */}
        <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2012_07_28%20AM.png?updatedAt=1776532065659" alt="" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>INDOO {isBike ? 'Bike' : 'Car'}</span>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#8DC63F', animation: 'ping 1.5s ease-in-out infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 800, color: '#8DC63F', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live</span>
            </div>
            <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{pickup?.address ?? 'Pickup'} → {destination?.address ?? 'Destination'}</span>
          </div>
          <button onClick={() => setPhase('cancelling')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Cinematic image area */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
          <img src={activeImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeIn 0.8s ease' }} />

          {/* Status banner — top */}
          <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 4 }}>
            <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8DC63F', animation: 'ping 1.5s ease-in-out infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>Driver on the way to you</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F', flexShrink: 0 }}>~{eta} min</span>
            </div>
          </div>

          {/* Bottom stats: KM + Fare */}
          <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, zIndex: 4, display: 'flex', justifyContent: 'center', gap: 10 }}>
            <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', display: 'block' }}>{(selectedDriver?.distKm ?? 2.3).toFixed(1)}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>KM</span>
            </div>
            <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#FACC15', display: 'block' }}>{formatRp(fare + stopFareExtra)}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>FARE</span>
            </div>
          </div>
        </div>

        {/* Bottom panel — driver info + progress */}
        <div style={{ flexShrink: 0, padding: 16, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,10,0.95)' }}>
          {/* Driver card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid #8DC63F', animation: 'ping 2s ease-in-out infinite', opacity: 0.4 }} />
              <img src={selectedDriver?.photo_url ?? 'https://i.pravatar.cc/100?img=12'} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #8DC63F' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{selectedDriver?.display_name ?? 'Driver'}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>⭐ {selectedDriver?.rating ?? '4.8'}</span>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(141,198,63,0.7)', display: 'block', marginTop: 2, fontWeight: 700 }}>INDOO Verified Driver</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginTop: 2 }}>{selectedDriver?.vehicle_color} {selectedDriver?.vehicle_model} · <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{selectedDriver?.plate_prefix ?? ''}</span></span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
              <a href={`tel:${selectedDriver?.driver_phone ?? ''}`} style={{ width: 40, height: 40, borderRadius: 12, background: '#111', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </a>
              <button style={{ width: 40, height: 40, borderRadius: 12, background: '#8DC63F', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </button>
            </div>
          </div>

          {/* Progress steps */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span style={{ fontSize: 8, color: '#8DC63F', fontWeight: 700 }}>Confirmed</span>
            </div>
            <div style={{ flex: 1, height: 4, borderRadius: 2, margin: '0 6px 12px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, background: 'linear-gradient(90deg, #8DC63F, #FACC15)', borderRadius: 2, animation: 'journeyFill 8s ease-in-out infinite' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Pickup</span>
            </div>
            <div style={{ flex: 1, height: 4, borderRadius: 2, margin: '0 6px 12px', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>On Way</span>
            </div>
            <div style={{ flex: 1, height: 4, borderRadius: 2, margin: '0 6px 12px', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Arrived</span>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes ping { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
          @keyframes journeyFill { 0% { width: 0; } 50% { width: 100%; } 100% { width: 100%; } }
        `}</style>
      </div>
    )

  }

  // ── Phase: cancelling ────────────────────────────────────────────────────────
  if (phase === 'cancelling') {
    return (
      <div className={styles.centered}>
        <span className={styles.cancelIcon}>✕</span>
        <p className={styles.cancelTitle}>Cancel ride?</p>
        <p className={styles.cancelSub}>Let us know why — takes 2 seconds</p>
        <div className={styles.cancelReasonGrid}>
          {CANCEL_REASONS.map(r => (
            <button
              key={r}
              className={`${styles.cancelReason} ${cancelReason === r ? styles.cancelReasonActive : ''}`}
              onClick={() => setCancelReason(r)}
            >{r}</button>
          ))}
        </div>
        <button className={styles.confirmCancelBtn} onClick={() => handleCancelRide(cancelReason)}>Confirm Cancel</button>
        <button className={styles.backToSelectBtn} onClick={() => setPhase('active')}>Keep my ride</button>
      </div>
    )
  }

  // ── Phase: cancelled ─────────────────────────────────────────────────────────
  if (phase === 'cancelled') {
    return (
      <div className={styles.centered}>
        <span className={styles.cancelIcon}>✕</span>
        <p className={styles.cancelTitle}>Ride Cancelled</p>
        <p className={styles.cancelSub}>Sorry it didn't work out. Try booking again anytime.</p>
        <button className={styles.doneBtn} onClick={onClose}>Done</button>
      </div>
    )
  }

  return null
}
