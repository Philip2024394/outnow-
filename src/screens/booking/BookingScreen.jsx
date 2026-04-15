/**
 * BookingScreen — thin orchestrator shell.
 * All state and handlers live here; panels receive only what they need.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useAuth } from '@/hooks/useAuth'
import { useGuestGate } from '@/contexts/GuestGateContext'
import {
  fetchNearbyDrivers, createBooking, expireBooking,
  completeBooking, cancelBooking, submitDriverReview,
  subscribeToBooking,
} from '@/services/bookingService'
import {
  estimateFare, formatRp, DEFAULT_ZONES, DEFAULT_SETTINGS, fetchPricingZones, fetchGlobalSettings,
} from '@/services/pricingService'
import { notifyRideRequest } from '@/services/notificationService'
import styles from '../BookingScreen.module.css'

import BookingFormPanel   from './BookingFormPanel'
import BookingLivePanel   from './BookingLivePanel'
import BookingReceiptPanel from './BookingReceiptPanel'

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
        <li>💬 In-app driver messaging</li>
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

export default function BookingScreen({ onClose, initialVehicle }) {
  const { user }              = useAuth()
  const { openSignUp }        = useGuestGate()
  const { coords: gpsCoords } = useGeolocation()

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
  const [vehicleType,      setVehicleType]      = useState(initialVehicle ?? null)
  const [hasPickedVehicle, setHasPickedVehicle] = useState(!!initialVehicle)

  const [pickupQuery,       setPickupQuery]       = useState('')
  const [pickup,            setPickup]            = useState(null)
  const [showPickupSuggest, setShowPickupSuggest] = useState(false)
  const [gpsLoading,        setGpsLoading]        = useState(false)
  const [gpsError,          setGpsError]          = useState('')

  const [destQuery,       setDestQuery]       = useState('')
  const [destination,     setDestination]     = useState(null)
  const [showDestSuggest, setShowDestSuggest] = useState(false)

  // ── Booking flow ────────────────────────────────────────────────────────────
  const [phase,          setPhase]          = useState('select')
  const [drivers,        setDrivers]        = useState([])
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [booking,        setBooking]        = useState(null)
  const [countdown,      setCountdown]      = useState(0)
  const [triedIds,       setTriedIds]       = useState([])
  const countdownRef  = useRef(null)
  const bookingSubRef = useRef(null)

  // ── Review ─────────────────────────────────────────────────────────────────
  const [reviewStars,      setReviewStars]      = useState(0)
  const [reviewHover,      setReviewHover]      = useState(0)
  const [reviewComment,    setReviewComment]    = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  // ── Cancel ─────────────────────────────────────────────────────────────────
  const [cancelReason, setCancelReason] = useState('')

  // ── Driver detail sheet ─────────────────────────────────────────────────────
  const [sheetDriver,   setSheetDriver]   = useState(null)
  const [sheetService,  setSheetService]  = useState('ride')
  const [packageNote,   setPackageNote]   = useState('')
  const [packageWeight, setPackageWeight] = useState('')
  const [pkgLength,     setPkgLength]     = useState('')
  const [pkgWidth,      setPkgWidth]      = useState('')
  const [pkgHeight,     setPkgHeight]     = useState('')

  // ── Featured driver banner rotation ────────────────────────────────────────
  const [featuredIdx, setFeaturedIdx] = useState(0)
  const [bannerFade,  setBannerFade]  = useState(true)
  const bannerRef = useRef(null)

  // Auto-fill pickup from GPS
  useEffect(() => {
    if (gpsCoords && !pickup) {
      setPickup({ label: 'My GPS Location', address: 'Current location (GPS)', lat: gpsCoords.lat, lng: gpsCoords.lng })
      setPickupQuery('My GPS Location')
    }
  }, [gpsCoords]) // eslint-disable-line

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

  // ── Find driver ────────────────────────────────────────────────────────────
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

  // ── Select driver → in-app booking ───────────────────────────────────────────
  const handleSelectDriver = useCallback(async (driver, serviceType = 'ride', pkgNote = '', pkgWt = '', pkgSize = '') => {
    setSheetDriver(null)
    setSelectedDriver(driver)

    const secs = settings.driver_timeout_seconds ?? 45
    const book = await createBooking({
      userId:          user?.id ?? user?.uid ?? 'guest',
      driverId:        driver.id,
      pickupAddress:   pickup?.address ?? 'My Location',
      dropoffAddress:  destination?.address ?? 'Destination',
      pickupCoords:    pickupCoords ?? null,
      dropoffCoords:   destination ? { lat: destination.lat, lng: destination.lng } : null,
      fare,
      distanceKm,
      serviceType,
      packageNote:     pkgNote  || null,
      packageWeight:   pkgWt    || null,
      packageSize:     pkgSize  || null,
      timeoutSeconds:  secs,
    })
    setBooking(book)
    setCountdown(secs)
    setPhase('waiting')

    // Notify driver of the new booking (in-app notification row + triggers push)
    notifyRideRequest(driver.id, {
      passengerName: user?.display_name ?? 'A passenger',
      pickup:        pickup?.address ?? 'Pickup location',
      fromUserId:    user?.id ?? user?.uid ?? null,
      bookingId:     book.id,
    })

    // Subscribe to real-time status changes
    if (bookingSubRef.current) bookingSubRef.current()
    bookingSubRef.current = subscribeToBooking(book.id, (updated) => {
      if (updated.status === 'accepted' || updated.status === 'in_progress') {
        clearInterval(countdownRef.current)
        bookingSubRef.current?.()
        setPhase('active')
      } else if (updated.status === 'cancelled' || updated.status === 'expired') {
        clearInterval(countdownRef.current)
        bookingSubRef.current?.()
        setPhase('expired')
      }
    })

    // Countdown — auto-expire if driver doesn't respond in time
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

const handleJourneyComplete = async () => {
    if (booking) await completeBooking(booking.id, selectedDriver?.id)
    setPhase('review')
  }

  const handleCancelRide = async (reason) => {
    if (booking) await cancelBooking(booking.id, reason, selectedDriver?.id)
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

  useEffect(() => () => {
    clearInterval(countdownRef.current)
    bookingSubRef.current?.()
  }, [])

  // Rotate featured driver banner every 4s on choose phase
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
      }, 500)
    }, 4000)
    return () => clearInterval(bannerRef.current)
  }, [phase, drivers.length]) // eslint-disable-line

  // ── Background image ───────────────────────────────────────────────────────
  const bgImage = (() => {
    const h = new Date().getHours()
    const isNight = h >= 18 || h < 6
    if (!hasPickedVehicle) {
      return isNight
        ? 'url("https://ik.imagekit.io/nepgaxllc/Untitledddddddddddsfsdfadsfasdfsdfs.png")'
        : 'url("https://ik.imagekit.io/nepgaxllc/Untitledddddddddddsfsdfadsfasdf.png")'
    }
    if (vehicleType === 'car_taxi') {
      return isNight
        ? 'url("https://ik.imagekit.io/nepgaxllc/Untitledddddddddddsfsdf.png")'
        : 'url("https://ik.imagekit.io/nepgaxllc/Untitledddddddddd.png")'
    }
    return isNight
      ? 'url("https://ik.imagekit.io/nepgaxllc/Untitleddfsadfasdfdasdasdasdsdfasd.png")'
      : 'url("https://ik.imagekit.io/nepgaxllc/Untitledddddddddddsfsdfadsfasdf.png")'
  })()

  return (
    <div className={styles.screen} style={{ backgroundImage: bgImage }}>
      <div className={styles.header}>
        <div className={styles.headerBrand}>
          <img
            src="https://ik.imagekit.io/nepgaxllc/Untitleddsfsdf-removebg-preview.png"
            alt="Hangger"
            className={styles.headerLogo}
          />
        </div>
        <button className={styles.backBtn} onClick={onClose}>✕</button>
      </div>

      {isGuest ? (
        <AuthWall onClose={onClose} onSignUp={openSignUp} />
      ) : (
        <>
          {/* Form panel */}
          {phase === 'select' && (
            <BookingFormPanel
              vehicleType={vehicleType}
              setVehicleType={setVehicleType}
              setHasPickedVehicle={setHasPickedVehicle}
              pickupQuery={pickupQuery} setPickupQuery={setPickupQuery}
              pickup={pickup} setPickup={setPickup}
              showPickupSuggest={showPickupSuggest} setShowPickupSuggest={setShowPickupSuggest}
              gpsLoading={gpsLoading} gpsError={gpsError} handleGps={handleGps}
              destQuery={destQuery} setDestQuery={setDestQuery}
              destination={destination} setDestination={setDestination}
              showDestSuggest={showDestSuggest} setShowDestSuggest={setShowDestSuggest}
              pickupCoords={pickupCoords}
              gpsCoords={gpsCoords}
              fare={fare} distanceKm={distanceKm}
              formatRp={formatRp} estimateFare={estimateFare}
              zones={zones} settings={settings}
              handleFindDriver={handleFindDriver}
            />
          )}

          {/* Live panel: searching / choose / waiting / expired / active / cancelling / cancelled */}
          {['searching','choose','waiting','expired','active','cancelling','cancelled'].includes(phase) && (
            <BookingLivePanel
              phase={phase} setPhase={setPhase}
              drivers={drivers}
              selectedDriver={selectedDriver}
              sheetDriver={sheetDriver} setSheetDriver={setSheetDriver}
              sheetService={sheetService} setSheetService={setSheetService}
              packageNote={packageNote} setPackageNote={setPackageNote}
              packageWeight={packageWeight} setPackageWeight={setPackageWeight}
              pkgLength={pkgLength} setPkgLength={setPkgLength}
              pkgWidth={pkgWidth} setPkgWidth={setPkgWidth}
              pkgHeight={pkgHeight} setPkgHeight={setPkgHeight}
              featuredIdx={featuredIdx}
              bannerFade={bannerFade}
              vehicleType={vehicleType}
              pickupCoords={pickupCoords}
              fare={fare} formatRp={formatRp}
              countdown={countdown}
              pickup={pickup} destination={destination}
              cancelReason={cancelReason} setCancelReason={setCancelReason}
              handleSelectDriver={handleSelectDriver}
              handleTryAnother={handleTryAnother}

              handleJourneyComplete={handleJourneyComplete}
              handleCancelRide={handleCancelRide}
              onClose={onClose}
            />
          )}

          {/* Driver detail sheet — rendered on top of choose phase */}
          {sheetDriver && phase === 'choose' && (
            <BookingLivePanel
              phase="sheet"
              drivers={drivers}
              selectedDriver={selectedDriver}
              sheetDriver={sheetDriver} setSheetDriver={setSheetDriver}
              sheetService={sheetService} setSheetService={setSheetService}
              packageNote={packageNote} setPackageNote={setPackageNote}
              packageWeight={packageWeight} setPackageWeight={setPackageWeight}
              pkgLength={pkgLength} setPkgLength={setPkgLength}
              pkgWidth={pkgWidth} setPkgWidth={setPkgWidth}
              pkgHeight={pkgHeight} setPkgHeight={setPkgHeight}
              featuredIdx={featuredIdx}
              bannerFade={bannerFade}
              vehicleType={vehicleType}
              pickupCoords={pickupCoords}
              fare={fare} formatRp={formatRp}
              countdown={countdown}
              pickup={pickup} destination={destination}
              cancelReason={cancelReason} setCancelReason={setCancelReason}
              handleSelectDriver={handleSelectDriver}
              handleTryAnother={handleTryAnother}

              handleJourneyComplete={handleJourneyComplete}
              handleCancelRide={handleCancelRide}
              onClose={onClose}
              setPhase={setPhase}
            />
          )}

          {/* Receipt panel */}
          {phase === 'review' && (
            <BookingReceiptPanel
              selectedDriver={selectedDriver}
              pickup={pickup} destination={destination}
              fare={fare} formatRp={formatRp}
              reviewStars={reviewStars} setReviewStars={setReviewStars}
              reviewHover={reviewHover} setReviewHover={setReviewHover}
              reviewComment={reviewComment} setReviewComment={setReviewComment}
              reviewSubmitting={reviewSubmitting}
              handleSubmitReview={handleSubmitReview}
              onClose={onClose}
            />
          )}
        </>
      )}
    </div>
  )
}
