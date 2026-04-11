/**
 * BookingLivePanel — all active-trip and pre-trip phases:
 *   searching, choose driver, driver detail sheet, waiting for driver,
 *   expired booking, active ride, cancelling, cancelled.
 */
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
    return (
      <div className={styles.body}>
        <DriverMap userCoords={pickupCoords} driverType={vehicleType} selectedDriverId={selectedDriver?.id} />
        <div className={styles.waitingCard}>
          <div className={styles.waitingRow}>
            <img src={selectedDriver?.driver_type === 'car_taxi' ? CAR_IMG : BIKE_IMG} alt="vehicle" className={styles.waitingEmojiImg} />
            <div style={{ flex: 1 }}>
              <p className={styles.waitingName}>{selectedDriver?.display_name}</p>
              <p className={styles.waitingMeta}>Booking sent — waiting for response</p>
              {selectedDriver?.vehicle_model && (
                <p className={styles.waitingVehicle}>{selectedDriver.vehicle_color} {selectedDriver.vehicle_model} {selectedDriver.vehicle_year}</p>
              )}
              {selectedDriver?.plate_prefix && (
                <p className={styles.waitingPlate}>Plate: {selectedDriver.plate_prefix} ••</p>
              )}
            </div>
            <div className={styles.countdown}>{countdown}s</div>
          </div>
          <p className={styles.waitingNote}>⏱ Request sent to driver — they will accept or decline in-app. This will update automatically.</p>
        </div>
        <div className={styles.waitingActions}>
          <button className={styles.tryAnotherBtn} onClick={handleTryAnother}>Try Another Driver</button>
        </div>
      </div>
    )
  }

  // ── Phase: expired ───────────────────────────────────────────────────────────
  if (phase === 'expired') {
    return (
      <div className={styles.centered}>
        <span className={styles.expiredIcon}>⏱</span>
        <p className={styles.expiredTitle}>Driver didn't respond</p>
        <p className={styles.expiredSub}>{selectedDriver?.display_name} took too long. Try the next available driver.</p>
        <button className={styles.tryAnotherBtnLg} onClick={handleTryAnother}>📞 Try Another Driver</button>
        <button className={styles.backToSelectBtn} onClick={() => setPhase('select')}>Start Over</button>
      </div>
    )
  }

  // ── Phase: active ────────────────────────────────────────────────────────────
  if (phase === 'active') {
    return (
      <div className={styles.body}>
        <div className={styles.activeRideCard}>
          <div className={styles.activeRideBadge}>Ride Active</div>
          <div className={styles.activeRideDriver}>
            <img src={selectedDriver?.driver_type === 'car_taxi' ? CAR_IMG : BIKE_IMG} alt="vehicle" className={styles.activeRideVehicleImg} />
            <div className={styles.activeRideInfo}>
              <p className={styles.activeRideName}>{selectedDriver?.display_name}</p>
              <p className={styles.activeRideType}>{selectedDriver?.driver_type === 'car_taxi' ? '🚗 Car Taxi' : '🛵 Bike Ride'}</p>
              <div className={styles.activeRideStars}>
                {'★'.repeat(Math.floor(selectedDriver?.rating ?? 4.8))}
                <span className={styles.activeRideRatingNum}> {selectedDriver?.rating ?? '4.8'}</span>
              </div>
            </div>
          </div>
          <div className={styles.activeRideTripCard}>
            <div className={styles.activeRideTripRow}>
              <span className={`${styles.locationDot} ${styles.locationDotGreen}`} />
              <span className={styles.activeRideTripText}>{pickup?.address ?? 'Pickup location'}</span>
            </div>
            <div className={styles.activeRideTripConnector} />
            <div className={styles.activeRideTripRow}>
              <span className={`${styles.locationDot} ${styles.locationDotRed}`} />
              <span className={styles.activeRideTripText}>{destination?.address ?? 'Destination'}</span>
            </div>
            <div className={styles.activeRideTripMeta}>
              <span>{formatRp(fare)}</span>
            </div>
          </div>
        </div>
        <button className={styles.completeBtn} onClick={handleJourneyComplete}>✓ Journey Completed</button>
        <button className={styles.cancelRideBtn} onClick={() => setPhase('cancelling')}>Cancel Ride</button>
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
