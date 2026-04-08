import { useState, useEffect, useRef, useCallback } from 'react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useAuth } from '@/hooks/useAuth'
import { useGuestGate } from '@/contexts/GuestGateContext'
import {
  fetchNearbyDrivers, createBooking, expireBooking, markBookingStarted,
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
  const countdownRef = useRef(null)

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
    setPhase('started')
  }

  useEffect(() => () => clearInterval(countdownRef.current), [])

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
          label="Pickup Location"
          query={pickupQuery}
          setQuery={setPickupQuery}
          value={pickup}
          setValue={setPickup}
          showSuggest={showPickupSuggest}
          setShowSuggest={setShowPickupSuggest}
          placeholder="Enter pickup address or use GPS"
          isPickup={true}
          gpsLoading={gpsLoading}
          gpsError={gpsError}
          onGps={handleGps}
        />

        {/* Connector dot */}
        <div className={styles.fieldConnector} />

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

  const renderChoose = () => (
    <div className={styles.body}>
      <DriverMap userCoords={pickupCoords} driverType={vehicleType} selectedDriverId={null} />
      <h3 className={styles.chooseTitle}>Choose a Driver</h3>
      <div className={styles.driverGrid}>
        {drivers.map(d => (
          <button key={d.id} className={styles.driverGridCard} onClick={() => handleSelectDriver(d)}>
            {/* Square profile image area */}
            <div className={styles.driverAvatar}>
              <img src={d.driver_type === 'car_taxi' ? CAR_IMG : BIKE_IMG} alt={d.driver_type} className={styles.driverAvatarImg} />
            </div>
            {/* Name */}
            <span className={styles.driverGridName}>{d.display_name.split(' ')[0]}</span>
            {/* Star rating in yellow */}
            <div className={styles.driverStars}>
              {'★'.repeat(Math.floor(d.rating ?? 4.8))}
              <span className={styles.driverRatingNum}> {d.rating ?? '4.8'}</span>
            </div>
            {/* Distance only */}
            <span className={styles.driverDist}>{formatDist(d.distKm)} away</span>
          </button>
        ))}
      </div>
      <button className={styles.cancelBtn} onClick={() => setPhase('select')}>Cancel</button>
    </div>
  )

  const renderWaiting = () => (
    <div className={styles.body}>
      <DriverMap userCoords={pickupCoords} driverType={vehicleType} selectedDriverId={selectedDriver?.id} />
      <div className={styles.waitingCard}>
        <div className={styles.waitingRow}>
          <img src={selectedDriver?.driver_type === 'car_taxi' ? CAR_IMG : BIKE_IMG} alt="vehicle" className={styles.waitingEmojiImg} />
          <div>
            <p className={styles.waitingName}>{selectedDriver?.display_name}</p>
            <p className={styles.waitingMeta}>Booking sent via WhatsApp</p>
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

  const renderStarted = () => (
    <div className={styles.centered}>
      <span className={styles.successIcon}>✅</span>
      <p className={styles.successTitle}>Ride Started!</p>
      <p className={styles.successSub}>Your driver {selectedDriver?.display_name} is on the way. Enjoy your ride!</p>
      <p className={styles.bookingId}>Booking: {booking?.id}</p>
      <button className={styles.doneBtn} onClick={onClose}>Done</button>
    </div>
  )

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
          {phase === 'select'    && renderSelect()}
          {phase === 'searching' && renderSearching()}
          {phase === 'choose'    && renderChoose()}
          {phase === 'waiting'   && renderWaiting()}
          {phase === 'expired'   && renderExpired()}
          {phase === 'started'   && renderStarted()}
        </>
      )}
    </div>
  )
}
