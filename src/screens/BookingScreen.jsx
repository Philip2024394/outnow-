import { useState, useEffect, useRef, useCallback } from 'react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useAuth } from '@/hooks/useAuth'
import { useGuestGate } from '@/contexts/GuestGateContext'
import {
  fetchNearbyDrivers, createBooking, expireBooking, markBookingStarted,
  completeBooking, cancelBooking, submitDriverReview,
} from '@/services/bookingService'
import {
  estimateFare, formatRp, DEFAULT_ZONES, DEFAULT_SETTINGS, fetchPricingZones, fetchGlobalSettings,
} from '@/services/pricingService'
import DriverMap from '@/components/driver/DriverMap'
import styles from './BookingScreen.module.css'

const BIKE_IMG = 'https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png'
const CAR_IMG  = 'https://ik.imagekit.io/nepgaxllc/Sporty%20green%20and%20black%20hatchback.png'

// ── Location suggestions (pickup + destination) ───────────────────────────────
const DEMO_PLACES = [
  { label: 'Malioboro Street',        address: 'Jl. Malioboro, Yogyakarta',         lat: -7.793, lng: 110.365 },
  { label: 'Prambanan Temple',        address: 'Jl. Raya Solo-Yogya, Sleman',       lat: -7.752, lng: 110.491 },
  { label: 'Borobudur Temple',        address: 'Jl. Badrawati, Magelang',           lat: -7.608, lng: 110.204 },
  { label: 'Yogyakarta Airport',      address: 'Kulon Progo, Yogyakarta',           lat: -7.900, lng: 110.057 },
  { label: 'Tugu Station',            address: 'Jl. Pasar Kembang, Yogyakarta',     lat: -7.789, lng: 110.363 },
  { label: 'UGM Campus',              address: 'Bulaksumur, Sleman',                lat: -7.771, lng: 110.377 },
  { label: 'Parangtritis Beach',      address: 'Bantul Regency, Yogyakarta',        lat: -8.024, lng: 110.331 },
  { label: 'Alun-Alun Kidul',         address: 'Kraton, Yogyakarta',                lat: -7.812, lng: 110.363 },
  { label: 'Alun-Alun Utara',         address: 'Ngupasan, Yogyakarta',              lat: -7.803, lng: 110.364 },
  { label: 'Kotagede',                address: 'Kotagede, Yogyakarta',              lat: -7.836, lng: 110.400 },
  { label: 'Sleman City Hall',        address: 'Jl. Magelang, Sleman',              lat: -7.726, lng: 110.356 },
  { label: 'Bantul Town Square',      address: 'Bantul, Yogyakarta',                lat: -7.890, lng: 110.328 },
  { label: 'Kaliurang Resort Area',   address: 'Kaliurang, Sleman',                 lat: -7.600, lng: 110.425 },
  { label: 'Soekarno-Hatta Airport',  address: 'Tangerang, Banten',                 lat: -6.126, lng: 106.656 },
  { label: 'Grand Indonesia Mall',    address: 'Jl. MH. Thamrin, Jakarta Pusat',    lat: -6.195, lng: 106.820 },
  { label: 'Ngurah Rai Airport',      address: 'Jl. Airport, Tuban, Bali',          lat: -8.748, lng: 115.167 },
  { label: 'Seminyak Beach',          address: 'Seminyak, Kuta, Bali',              lat: -8.692, lng: 115.156 },
  { label: 'Ubud Palace',             address: 'Jl. Raya Ubud, Bali',               lat: -8.507, lng: 115.262 },
]

function filterPlaces(query) {
  const q = query.trim().toLowerCase()
  if (!q) return DEMO_PLACES.slice(0, 6)
  return DEMO_PLACES.filter(p =>
    p.label.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
  ).slice(0, 8)
}

function formatDist(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

// ── Auth wall ─────────────────────────────────────────────────────────────────
function AuthWall({ onClose, onSignUp }) {
  return (
    <div className={styles.authWall}>
      <img
        src="https://ik.imagekit.io/nepgaxllc/Green%20and%20black%20speed%20machines.png"
        alt="Ride services"
        className={styles.authHeroImg}
      />
      <h2 className={styles.authTitle}>Account Required</h2>
      <p className={styles.authSub}>
        Ride hailing services are available to registered members only.
        Create a free account to book a driver.
      </p>
      <ul className={styles.authFeatures}>
        <li>🛵 Instant bike rides</li>
        <li>🚗 Car taxi bookings</li>
        <li>💬 Direct WhatsApp contact</li>
        <li>📍 Live driver tracking</li>
      </ul>
      <button className={styles.authSignUpBtn} onClick={() => { onClose(); onSignUp() }}>
        Create Account — It's Free
      </button>
      <button className={styles.authCancelBtn} onClick={onClose}>
        Maybe Later
      </button>
    </div>
  )
}

// ── Location field ────────────────────────────────────────────────────────────
function LocationField({ label, query, setQuery, value, setValue, showSuggest, setShowSuggest, placeholder, isPickup, gpsLoading, gpsError, onGps }) {
  const filtered = filterPlaces(query)
  return (
    <div className={styles.locFieldWrap}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.locInputRow}>
        <div className={styles.locDotWrap}>
          <span className={`${styles.locationDot} ${isPickup ? styles.locationDotGreen : styles.locationDotRed}`} />
        </div>
        <div className={styles.destWrap} style={{ flex: 1 }}>
          <input
            className={`${styles.destInput} ${value ? styles.destInputFilled : ''}`}
            placeholder={placeholder}
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSuggest(true); if (!e.target.value) setValue(null) }}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
          />
          {query && (
            <button className={styles.clearBtn} onMouseDown={e => { e.preventDefault(); setQuery(''); setValue(null) }}>✕</button>
          )}
          {showSuggest && (
            <div className={styles.suggestions}>
              {filtered.length ? filtered.map((d, i) => (
                <button
                  key={i}
                  className={styles.suggestion}
                  onMouseDown={e => { e.preventDefault(); setValue(d); setQuery(d.label); setShowSuggest(false) }}
                >
                  <span className={styles.suggestionIcon}>📍</span>
                  <div className={styles.suggestionText}>
                    <span className={styles.suggestionLabel}>{d.label}</span>
                    <span className={styles.suggestionAddr}>{d.address}</span>
                  </div>
                </button>
              )) : (
                <div className={styles.suggestionEmpty}>No places found</div>
              )}
            </div>
          )}
        </div>
        {isPickup && (
          <button
            className={`${styles.gpsBtn} ${gpsLoading ? styles.gpsBtnLoading : ''}`}
            onClick={onGps}
            disabled={gpsLoading}
            title="Use my GPS location"
          >
            {gpsLoading ? <span className={styles.gpsDot} /> : '⊕'}
          </button>
        )}
      </div>
      {isPickup && gpsError && <p className={styles.gpsError}>{gpsError}</p>}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BookingScreen({ onClose }) {
  const { user }              = useAuth()
  const { openSignUp }        = useGuestGate()
  const { coords: gpsCoords } = useGeolocation()

  // In demo/dev mode bypass the auth wall so admin can test all features
  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  const isGuest  = !demoMode && (!user || user.uid === 'demo-me')

  // ── Pricing ────────────────────────────────────────────────────────────────
  const [zones,    setZones]    = useState(DEFAULT_ZONES)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  useEffect(() => {
    Promise.all([fetchPricingZones(), fetchGlobalSettings()])
      .then(([z, s]) => { setZones(z); setSettings(s) })
  }, [])

  // ── Form state ─────────────────────────────────────────────────────────────
  const [vehicleType, setVehicleType] = useState(null)

  // Pickup
  const [pickupQuery,        setPickupQuery]        = useState('')
  const [pickup,             setPickup]             = useState(null)   // { label, address, lat, lng }
  const [showPickupSuggest,  setShowPickupSuggest]  = useState(false)
  const [gpsLoading,         setGpsLoading]         = useState(false)
  const [gpsError,           setGpsError]           = useState('')

  // Destination
  const [destQuery,     setDestQuery]     = useState('')
  const [destination,   setDestination]   = useState(null)
  const [showDestSuggest, setShowDestSuggest] = useState(false)

  // Booking flow
  const [phase,          setPhase]          = useState('select')
  const [drivers,        setDrivers]        = useState([])
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [booking,        setBooking]        = useState(null)
  const [countdown,      setCountdown]      = useState(0)
  const [triedIds,       setTriedIds]       = useState([])
  const [rideStartedAt,  setRideStartedAt]  = useState(null)
  const countdownRef = useRef(null)

  // Review state
  const [reviewStars,       setReviewStars]       = useState(0)
  const [reviewHover,       setReviewHover]       = useState(0)
  const [reviewComment,     setReviewComment]     = useState('')
  const [reviewSubmitting,  setReviewSubmitting]  = useState(false)

  // Cancel state
  const [cancelReason, setCancelReason] = useState('')

  // Featured driver banner rotation
  const [featuredIdx,  setFeaturedIdx]  = useState(0)
  const [bannerFade,   setBannerFade]   = useState(true)
  const bannerRef = useRef(null)

  // Auto-fill pickup when GPS coords arrive (only if not already manually set)
  useEffect(() => {
    if (gpsCoords && !pickup) {
      setPickup({ label: 'My GPS Location', address: 'Current location (GPS)', lat: gpsCoords.lat, lng: gpsCoords.lng })
      setPickupQuery('My GPS Location')
    }
  }, [gpsCoords]) // eslint-disable-line

  // ── GPS button handler ─────────────────────────────────────────────────────
  const handleGps = () => {
    if (!navigator.geolocation) { setGpsError('GPS not supported on this device'); return }
    setGpsLoading(true)
    setGpsError('')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { label: 'My GPS Location', address: 'Current location (GPS)', lat: pos.coords.latitude, lng: pos.coords.longitude }
        setPickup(loc)
        setPickupQuery('My GPS Location')
        setShowPickupSuggest(false)
        setGpsLoading(false)
      },
      err => {
        setGpsError(err.code === 1 ? 'Location access denied. Enter manually.' : 'GPS unavailable. Enter manually.')
        setGpsLoading(false)
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  // ── Fare estimate ──────────────────────────────────────────────────────────
  const pickupCoords = pickup ?? gpsCoords
  const distanceKm = destination && pickupCoords
    ? Math.max(0.5, Math.round(
        Math.sqrt(
          Math.pow((destination.lat - pickupCoords.lat) * 111, 2) +
          Math.pow((destination.lng - pickupCoords.lng) * 111 * Math.cos(pickupCoords.lat * Math.PI / 180), 2)
        ) * 10
      ) / 10)
    : 3

  const fare = estimateFare(vehicleType ?? 'bike_ride', 'Yogyakarta', distanceKm, zones, settings)

  // ── Find a driver ──────────────────────────────────────────────────────────
  const handleFindDriver = useCallback(async () => {
    setPhase('searching')
    try {
      const nearby = await fetchNearbyDrivers(
        pickupCoords?.lat ?? -7.797,
        pickupCoords?.lng ?? 110.370,
        vehicleType,
        triedIds,
      )
      if (!nearby.length) {
        alert('No drivers available right now. Try again shortly.')
        setPhase('select')
        return
      }
      setDrivers(nearby)
      setPhase('choose')
    } catch {
      alert('Could not fetch drivers.')
      setPhase('select')
    }
  }, [pickupCoords, vehicleType, triedIds])

  // ── Select driver → WhatsApp ───────────────────────────────────────────────
  const handleSelectDriver = useCallback(async (driver) => {
    setSelectedDriver(driver)
    const book = await createBooking({
      userId:          user?.id ?? user?.uid ?? 'guest',
      driverId:        driver.id,
      pickupAddress:   pickup?.address ?? 'My Location',
      dropoffAddress:  destination?.address ?? 'Destination',
      pickupCoords:    pickupCoords ?? null,
      dropoffCoords:   destination ? { lat: destination.lat, lng: destination.lng } : null,
      fare,
      distanceKm,
      timeoutSeconds:  settings.driver_timeout_seconds ?? 45,
    })
    setBooking(book)

    const msg = [
      `Hi ${driver.display_name},`,
      ``,
      `I need a ride via Hangger App:`,
      ``,
      `📍 Pickup: ${pickup?.address ?? 'My current location'}`,
      `📍 Destination: ${destination?.address ?? 'To be confirmed'}`,
      `${vehicleType === 'car_taxi' ? '🚗 Car Taxi' : '🛵 Bike Ride'}`,
      `💰 Fare: ${formatRp(fare)}`,
      `📏 Distance: ${distanceKm} km`,
      ``,
      `Can you pick me up?`,
      ``,
      `Booking ID: ${book.id}`,
    ].join('\n')

    const win = window.open(`https://wa.me/${driver.phone ?? ''}?text=${encodeURIComponent(msg)}`, '_blank')
    if (!win) alert('WhatsApp could not open. Please contact the driver via in-app chat.')

    const secs = settings.driver_timeout_seconds ?? 45
    setCountdown(secs)
    setPhase('waiting')
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current)
          expireBooking(book.id)
          setPhase('expired')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [pickup, destination, pickupCoords, fare, distanceKm, vehicleType, settings, user])

  // ── Try another driver ─────────────────────────────────────────────────────
  const handleTryAnother = useCallback(async () => {
    clearInterval(countdownRef.current)
    if (booking) expireBooking(booking.id)
    setBooking(null)
    setSelectedDriver(null)
    const newTried = [...triedIds, selectedDriver?.id].filter(Boolean)
    setTriedIds(newTried)
    setPhase('searching')
    try {
      const nearby = await fetchNearbyDrivers(
        pickupCoords?.lat ?? -7.797,
        pickupCoords?.lng ?? 110.370,
        vehicleType,
        newTried,
      )
      if (!nearby.length) {
        alert('No more drivers available. Try again later.')
        setPhase('select')
        setTriedIds([])
        return
      }
      setDrivers(nearby)
      setPhase('choose')
    } catch {
      setPhase('select')
    }
  }, [booking, selectedDriver, triedIds, pickupCoords, vehicleType])

  const handleRideStarted = async () => {
    clearInterval(countdownRef.current)
    if (booking) await markBookingStarted(booking.id)
    setRideStartedAt(new Date())
    setPhase('active')
  }

  const handleJourneyComplete = async () => {
    if (booking) await completeBooking(booking.id)
    setPhase('review')
  }

  const handleCancelRide = async (reason) => {
    if (booking) await cancelBooking(booking.id, reason)
    setPhase('cancelled')
  }

  const handleSubmitReview = async () => {
    setReviewSubmitting(true)
    await submitDriverReview({
      bookingId: booking?.id,
      driverId:  selectedDriver?.id,
      userId:    user?.id ?? user?.uid,
      stars:     reviewStars,
      comment:   reviewComment,
    })
    setReviewSubmitting(false)
    onClose()
  }

  useEffect(() => () => clearInterval(countdownRef.current), [])

  // Rotate featured driver banner every 3s when on choose phase
  useEffect(() => {
    if (phase !== 'choose' || drivers.length < 2) return
    bannerRef.current = setInterval(() => {
      setBannerFade(false)
      setTimeout(() => {
        setFeaturedIdx(i => {
          const next = Math.floor(Math.random() * drivers.length)
          return next === i ? (i + 1) % drivers.length : next
        })
        setBannerFade(true)
      }, 250)
    }, 3000)
    return () => clearInterval(bannerRef.current)
  }, [phase, drivers.length]) // eslint-disable-line

  // ── Render phases ──────────────────────────────────────────────────────────
  const renderSelect = () => (
    <div className={styles.body}>
      <DriverMap userCoords={pickupCoords} driverType={vehicleType} selectedDriverId={null} />

      {/* Vehicle tabs */}
      <div className={styles.vehicleTabs}>
        <button
          className={`${styles.vehicleTab} ${vehicleType === 'bike_ride' ? styles.vehicleTabActive : ''}`}
          onClick={() => setVehicleType('bike_ride')}
        >
          <span className={styles.vehicleTabLabel}>Bike Ride</span>
          <span className={styles.vehicleTabPrice}>{formatRp(estimateFare('bike_ride', 'Yogyakarta', distanceKm, zones, settings))}</span>
          <img src={BIKE_IMG} alt="Bike" className={styles.vehicleTabImg} />
        </button>
        <button
          className={`${styles.vehicleTab} ${vehicleType === 'car_taxi' ? styles.vehicleTabActive : ''}`}
          onClick={() => setVehicleType('car_taxi')}
        >
          <span className={styles.vehicleTabLabel}>Car Taxi</span>
          <span className={styles.vehicleTabPrice}>{formatRp(estimateFare('car_taxi', 'Yogyakarta', distanceKm, zones, settings))}</span>
          <img src={CAR_IMG} alt="Car" className={`${styles.vehicleTabImg} ${styles.vehicleTabImgCar}`} />
        </button>
      </div>

      {/* Location fields */}
      <div className={styles.fieldGroup}>
        <LocationField
          label="Destination"
          query={destQuery}
          setQuery={setDestQuery}
          value={destination}
          setValue={setDestination}
          showSuggest={showDestSuggest}
          setShowSuggest={setShowDestSuggest}
          placeholder="Where are you going?"
          isPickup={false}
          gpsLoading={false}
          gpsError=""
          onGps={null}
        />

        {/* Connector dot */}
        <div className={styles.fieldConnector} />

        <LocationField
          label="Pickup Location"
          query={pickupQuery}
          setQuery={setPickupQuery}
          value={pickup}
          setValue={setPickup}
          showSuggest={showPickupSuggest}
          setShowSuggest={setShowPickupSuggest}
          placeholder="Enter pickup or use GPS ⊕"
          isPickup={true}
          gpsLoading={gpsLoading}
          gpsError={gpsError}
          onGps={handleGps}
        />
      </div>

      {/* Fare preview */}
      <div className={styles.fareRow}>
        <div className={styles.fareItem}>
          <span className={styles.fareItemLabel}>Estimated Fare</span>
          <span className={styles.fareItemValue}>{formatRp(fare)}</span>
        </div>
        <div className={styles.fareItem}>
          <span className={styles.fareItemLabel}>Distance</span>
          <span className={styles.fareItemValue}>{distanceKm} km</span>
        </div>
      </div>

      <button
        className={styles.findBtn}
        disabled={!destination || !pickup || !vehicleType}
        onClick={handleFindDriver}
      >
        Find a Driver
      </button>
      {!pickup && <p className={styles.fieldHint}>Set your pickup location to continue</p>}
    </div>
  )

  const renderSearching = () => (
    <div className={styles.centered}>
      <div className={styles.spinner} />
      <p className={styles.searchingText}>Finding nearby drivers…</p>
    </div>
  )

  const BANNER_BIKE = 'https://ik.imagekit.io/nepgaxllc/Untitlediuooiuoi-removebg-preview.png'

  const renderChoose = () => {
    const featured = drivers[featuredIdx] ?? drivers[0]
    return (
      <div className={styles.body}>

        {/* ── Featured driver banner ── */}
        {featured && (
          <button
            className={`${styles.featuredBanner} ${bannerFade ? styles.featuredBannerVisible : styles.featuredBannerHidden}`}
            onClick={() => handleSelectDriver(featured)}
          >
            {/* Left: profile + details */}
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
                <span className={styles.featuredStat}>{formatDist(featured.distKm)} away</span>
              </div>
              <div className={styles.featuredVehicle}>
                {featured.vehicle_model} {featured.vehicle_year} · {featured.vehicle_color}
              </div>
              <div className={styles.featuredPlate}>Plate: {featured.plate_prefix ?? '—'} ••</div>
              <div className={styles.featuredPrice}>{formatRp(fare)}</div>
            </div>

            {/* Right: bike image */}
            <div className={styles.featuredRight}>
              <img src={BANNER_BIKE} alt="bike" className={styles.featuredBikeImg} />
            </div>
          </button>
        )}

        {/* ── All drivers list ── */}
        <p className={styles.chooseSubtitle}>All available drivers</p>
        <div className={styles.driverList}>
          {drivers.map(d => (
            <button key={d.id} className={styles.driverListCard} onClick={() => handleSelectDriver(d)}>
              {/* Avatar */}
              <div className={styles.driverListAvatar}>
                <img src={d.driver_type === 'car_taxi' ? CAR_IMG : BIKE_IMG} alt={d.driver_type} className={styles.driverAvatarImg} />
              </div>
              {/* Info */}
              <div className={styles.driverListInfo}>
                <div className={styles.driverListTopRow}>
                  <span className={styles.driverListName}>{d.display_name}</span>
                  <span className={styles.driverListPrice}>{formatRp(fare)}</span>
                </div>
                <div className={styles.driverListStars}>
                  {'★'.repeat(Math.floor(d.rating ?? 4.8))}
                  <span className={styles.driverRatingNum}> {d.rating ?? '4.8'}</span>
                  <span className={styles.driverListTrips}> · {d.total_trips ?? 0} trips</span>
                  <span className={styles.driverListDist}> · {formatDist(d.distKm)}</span>
                </div>
                <div className={styles.driverListVehicle}>
                  {d.vehicle_model} {d.vehicle_year} · {d.vehicle_color} · {d.plate_prefix ?? '—'} ••
                </div>
              </div>
              {/* Book arrow */}
              <span className={styles.driverListArrow}>›</span>
            </button>
          ))}
        </div>

        <button className={styles.cancelBtn} onClick={() => setPhase('select')}>Cancel</button>
      </div>
    )
  }

  const renderWaiting = () => (
    <div className={styles.body}>
      <DriverMap userCoords={pickupCoords} driverType={vehicleType} selectedDriverId={selectedDriver?.id} />
      <div className={styles.waitingCard}>
        <div className={styles.waitingRow}>
          <img src={selectedDriver?.driver_type === 'car_taxi' ? CAR_IMG : BIKE_IMG} alt="vehicle" className={styles.waitingEmojiImg} />
          <div style={{ flex: 1 }}>
            <p className={styles.waitingName}>{selectedDriver?.display_name}</p>
            <p className={styles.waitingMeta}>Booking sent via WhatsApp</p>
            {selectedDriver?.vehicle_model && (
              <p className={styles.waitingVehicle}>
                {selectedDriver.vehicle_color} {selectedDriver.vehicle_model} {selectedDriver.vehicle_year}
              </p>
            )}
            {selectedDriver?.plate_prefix && (
              <p className={styles.waitingPlate}>Plate: {selectedDriver.plate_prefix} ••</p>
            )}
          </div>
          <div className={styles.countdown}>{countdown}s</div>
        </div>
        <p className={styles.waitingNote}>
          ⏱ Waiting for driver to accept… WhatsApp has been opened with your ride details.
        </p>
      </div>
      <div className={styles.waitingActions}>
        <button className={styles.startedBtn} onClick={handleRideStarted}>✓ Ride Started</button>
        <button className={styles.tryAnotherBtn} onClick={handleTryAnother}>📞 Try Another Driver</button>
      </div>
    </div>
  )

  const renderExpired = () => (
    <div className={styles.centered}>
      <span className={styles.expiredIcon}>⏱</span>
      <p className={styles.expiredTitle}>Driver didn't respond</p>
      <p className={styles.expiredSub}>{selectedDriver?.display_name} took too long. Try the next available driver.</p>
      <button className={styles.tryAnotherBtnLg} onClick={handleTryAnother}>📞 Try Another Driver</button>
      <button className={styles.backToSelectBtn} onClick={() => { setPhase('select'); setTriedIds([]) }}>Start Over</button>
    </div>
  )

  const CANCEL_REASONS = ['Driver didn\'t show', 'Wrong vehicle', 'Changed my mind', 'Safety concern', 'Other']
  const STAR_LABELS    = ['', 'Poor', 'Below average', 'OK', 'Good', 'Excellent']

  const renderActiveRide = () => (
    <div className={styles.body}>
      {/* Active ride card */}
      <div className={styles.activeRideCard}>
        <div className={styles.activeRideBadge}>Ride Active</div>
        <div className={styles.activeRideDriver}>
          <img
            src={selectedDriver?.driver_type === 'car_taxi' ? CAR_IMG : BIKE_IMG}
            alt="vehicle"
            className={styles.activeRideVehicleImg}
          />
          <div className={styles.activeRideInfo}>
            <p className={styles.activeRideName}>{selectedDriver?.display_name}</p>
            <p className={styles.activeRideType}>{selectedDriver?.driver_type === 'car_taxi' ? '🚗 Car Taxi' : '🛵 Bike Ride'}</p>
            <div className={styles.activeRideStars}>
              {'★'.repeat(Math.floor(selectedDriver?.rating ?? 4.8))}
              <span className={styles.activeRideRatingNum}> {selectedDriver?.rating ?? '4.8'}</span>
            </div>
          </div>
        </div>

        {/* Trip summary */}
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
            <span>{distanceKm} km</span>
          </div>
        </div>
      </div>

      {/* WhatsApp re-open */}
      <a
        className={styles.whatsappBtn}
        href={`https://wa.me/${selectedDriver?.phone ?? ''}?text=${encodeURIComponent(`Hi ${selectedDriver?.display_name}, I'm on my way!`)}`}
        target="_blank"
        rel="noreferrer"
      >
        💬 Open WhatsApp
      </a>

      {/* Actions */}
      <button className={styles.completeBtn} onClick={handleJourneyComplete}>
        ✓ Journey Completed
      </button>
      <button className={styles.cancelRideBtn} onClick={() => setPhase('cancelling')}>
        Cancel Ride
      </button>
    </div>
  )

  const renderCancelling = () => (
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
      <button
        className={styles.confirmCancelBtn}
        onClick={() => handleCancelRide(cancelReason)}
      >
        Confirm Cancel
      </button>
      <button className={styles.backToSelectBtn} onClick={() => setPhase('active')}>
        Keep my ride
      </button>
    </div>
  )

  const renderCancelled = () => (
    <div className={styles.centered}>
      <span className={styles.cancelIcon}>✕</span>
      <p className={styles.cancelTitle}>Ride Cancelled</p>
      <p className={styles.cancelSub}>Sorry it didn't work out. Try booking again anytime.</p>
      <button className={styles.doneBtn} onClick={onClose}>Done</button>
    </div>
  )

  const renderReview = () => {
    const activeStars = reviewHover || reviewStars
    return (
      <div className={styles.body}>
        <div className={styles.reviewCard}>
          {/* Driver */}
          <div className={styles.reviewDriver}>
            <img
              src={selectedDriver?.driver_type === 'car_taxi' ? CAR_IMG : BIKE_IMG}
              alt="driver"
              className={styles.reviewDriverImg}
            />
            <div>
              <p className={styles.reviewDriverName}>{selectedDriver?.display_name}</p>
              <p className={styles.reviewDriverType}>{selectedDriver?.driver_type === 'car_taxi' ? '🚗 Car Taxi' : '🛵 Bike Ride'}</p>
            </div>
          </div>

          {/* Trip receipt */}
          <div className={styles.reviewReceipt}>
            <div className={styles.reviewReceiptRow}>
              <span className={styles.reviewReceiptLabel}>From</span>
              <span className={styles.reviewReceiptValue}>{pickup?.label ?? 'Pickup'}</span>
            </div>
            <div className={styles.reviewReceiptRow}>
              <span className={styles.reviewReceiptLabel}>To</span>
              <span className={styles.reviewReceiptValue}>{destination?.label ?? 'Destination'}</span>
            </div>
            <div className={styles.reviewReceiptRow}>
              <span className={styles.reviewReceiptLabel}>Fare</span>
              <span className={styles.reviewReceiptValue}>{formatRp(fare)}</span>
            </div>
            <div className={styles.reviewReceiptRow}>
              <span className={styles.reviewReceiptLabel}>Distance</span>
              <span className={styles.reviewReceiptValue}>{distanceKm} km</span>
            </div>
          </div>
        </div>

        {/* Stars */}
        <div className={styles.reviewStarsCard}>
          <p className={styles.reviewAsk}>Rate your driver</p>
          <div className={styles.reviewStarsRow}>
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                className={`${styles.reviewStar} ${n <= activeStars ? styles.reviewStarActive : ''}`}
                onClick={() => setReviewStars(n)}
                onMouseEnter={() => setReviewHover(n)}
                onMouseLeave={() => setReviewHover(0)}
              >★</button>
            ))}
          </div>
          {activeStars > 0 && (
            <p className={styles.reviewStarLabel}>{STAR_LABELS[activeStars]}</p>
          )}
        </div>

        {/* Comment — show after star selected */}
        {reviewStars > 0 && (
          <textarea
            className={styles.reviewComment}
            value={reviewComment}
            onChange={e => setReviewComment(e.target.value)}
            placeholder="Add a comment (optional)…"
            rows={3}
            maxLength={300}
          />
        )}

        <button
          className={styles.submitReviewBtn}
          onClick={handleSubmitReview}
          disabled={!reviewStars || reviewSubmitting}
        >
          {reviewSubmitting ? 'Saving…' : 'Submit Review'}
        </button>
        <button className={styles.skipReviewBtn} onClick={onClose}>
          Skip — close
        </button>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.headerBrand}>
          <img
            src="https://ik.imagekit.io/nepgaxllc/Untitleddsfsdf-removebg-preview.png?updatedAt=1775450555245"
            alt="Hangger"
            className={styles.headerLogo}
          />
        </div>
        <button className={styles.backBtn} onClick={onClose}>✕</button>
      </div>

      {/* Auth wall — shown to guests */}
      {isGuest ? (
        <AuthWall onClose={onClose} onSignUp={openSignUp} />
      ) : (
        <>
          {phase === 'select'     && renderSelect()}
          {phase === 'searching'  && renderSearching()}
          {phase === 'choose'     && renderChoose()}
          {phase === 'waiting'    && renderWaiting()}
          {phase === 'expired'    && renderExpired()}
          {phase === 'active'     && renderActiveRide()}
          {phase === 'cancelling' && renderCancelling()}
          {phase === 'cancelled'  && renderCancelled()}
          {phase === 'review'     && renderReview()}
        </>
      )}
    </div>
  )
}
