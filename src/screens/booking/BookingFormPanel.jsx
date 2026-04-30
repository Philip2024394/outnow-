/**
 * BookingFormPanel — pickup/dropoff form, location search autocomplete,
 * vehicle type selection (bike/car), fare preview, and the "Find a Driver" button.
 *
 * Sub-component LocationField is declared locally as it is only used here.
 */
import styles from '../BookingScreen.module.css'
import DriverMap from '@/components/driver/DriverMap'

import { useState, useEffect, useRef, useCallback } from 'react'
import DestinationDirectory from '@/components/booking/DestinationDirectory'
import { searchPlaces, getNearbyPlaces } from '@/services/placesService'

const BIKE_IMG = 'https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png'
const CAR_IMG  = 'https://ik.imagekit.io/nepgaxllc/Sporty%20green%20and%20black%20hatchback.png'

// Hourly hire pricing
const HOURLY_RATES = {
  bike: { perHour: 33000, packages: [
    { hours: 3, price: 99000,  label: '3 Hours' },
    { hours: 6, price: 180000, label: '6 Hours', badge: '~10% off' },
    { hours: 9, price: 250000, label: '9 Hours', badge: '~15% off' },
  ]},
  car: { perHour: 55000, packages: [
    { hours: 3, price: 165000, label: '3 Hours' },
    { hours: 6, price: 300000, label: '6 Hours', badge: '~10% off' },
    { hours: 9, price: 420000, label: '9 Hours', badge: '~15% off' },
  ]},
}

function formatRpStatic(n) {
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}

// Popular landmarks as instant fallback (before Overpass loads)
const POPULAR_PLACES = [
  { label: 'Malioboro Street',        address: 'Jl. Malioboro, Yogyakarta',         lat: -7.793, lng: 110.365, icon: '🛍️' },
  { label: 'Prambanan Temple',        address: 'Jl. Raya Solo-Yogya, Sleman',       lat: -7.752, lng: 110.491, icon: '🛕' },
  { label: 'Borobudur Temple',        address: 'Jl. Badrawati, Magelang',           lat: -7.608, lng: 110.204, icon: '🛕' },
  { label: 'Yogyakarta Airport',      address: 'Kulon Progo, Yogyakarta',           lat: -7.900, lng: 110.057, icon: '✈️' },
  { label: 'Tugu Station',            address: 'Jl. Pasar Kembang, Yogyakarta',     lat: -7.789, lng: 110.363, icon: '🚉' },
  { label: 'UGM Campus',              address: 'Bulaksumur, Sleman',                lat: -7.771, lng: 110.377, icon: '🎓' },
  { label: 'Parangtritis Beach',      address: 'Bantul Regency, Yogyakarta',        lat: -8.024, lng: 110.331, icon: '🏖️' },
  { label: 'Alun-Alun Kidul',         address: 'Kraton, Yogyakarta',                lat: -7.812, lng: 110.363, icon: '🏛️' },
]

function LocationField({ label, query, setQuery, value, setValue, showSuggest, setShowSuggest, placeholder, isPickup, gpsLoading, gpsError, onGps }) {
  const [suggestions, setSuggestions] = useState(POPULAR_PLACES)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  // Debounced search — queries Overpass places + falls back to popular
  const doSearch = useCallback((q) => {
    clearTimeout(debounceRef.current)
    const trimmed = q.trim()

    if (!trimmed) {
      setSuggestions(POPULAR_PLACES)
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(trimmed, null, 10)
        const mapped = results.map(p => ({
          label: p.name,
          address: p.address || `${p.category} · ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`,
          lat: p.lat,
          lng: p.lng,
          icon: p.icon,
        }))

        // Also check popular places
        const popularMatches = POPULAR_PLACES.filter(p =>
          p.label.toLowerCase().includes(trimmed.toLowerCase()) ||
          p.address.toLowerCase().includes(trimmed.toLowerCase())
        )

        // Merge: popular matches first, then Overpass results (deduped)
        const seen = new Set(popularMatches.map(p => p.label.toLowerCase()))
        const merged = [
          ...popularMatches,
          ...mapped.filter(p => !seen.has(p.label.toLowerCase())),
        ].slice(0, 10)

        setSuggestions(merged.length ? merged : [])
      } catch {
        // Fallback to popular places filter
        const fallback = POPULAR_PLACES.filter(p =>
          p.label.toLowerCase().includes(trimmed.toLowerCase()) ||
          p.address.toLowerCase().includes(trimmed.toLowerCase())
        )
        setSuggestions(fallback)
      }
      setLoading(false)
    }, 280)
  }, [])

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
            onChange={e => { setQuery(e.target.value); setShowSuggest(true); doSearch(e.target.value); if (!e.target.value) setValue(null) }}
            onFocus={() => { setShowSuggest(true); doSearch(query) }}
            onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
          />
          {query && (
            <button className={styles.clearBtn} onMouseDown={e => { e.preventDefault(); setQuery(''); setValue(null); setSuggestions(POPULAR_PLACES) }}>✕</button>
          )}
          {showSuggest && (
            <div className={styles.suggestions}>
              {loading && <div className={styles.suggestionEmpty}>Searching...</div>}
              {!loading && suggestions.length ? suggestions.map((d, i) => (
                <button
                  key={i}
                  className={styles.suggestion}
                  onMouseDown={e => { e.preventDefault(); setValue(d); setQuery(d.label); setShowSuggest(false) }}
                >
                  <span className={styles.suggestionIcon}>{d.icon || '📍'}</span>
                  <div className={styles.suggestionText}>
                    <span className={styles.suggestionLabel}>{d.label}</span>
                    <span className={styles.suggestionAddr}>{d.address}</span>
                  </div>
                </button>
              )) : null}
              {!loading && !suggestions.length && (
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

function gpsDistanceKm(lat1, lng1, lat2, lng2) {
  const dLat = (lat2 - lat1) * 111
  const dLng = (lng2 - lng1) * 111 * Math.cos(lat1 * Math.PI / 180)
  return Math.sqrt(dLat * dLat + dLng * dLng)
}

export default function BookingFormPanel({
  vehicleType, setVehicleType, setHasPickedVehicle,
  pickupQuery, setPickupQuery,
  pickup, setPickup,
  showPickupSuggest, setShowPickupSuggest,
  gpsLoading, gpsError, handleGps,
  destQuery, setDestQuery,
  destination, setDestination,
  showDestSuggest, setShowDestSuggest,
  pickupCoords,
  gpsCoords,
  fare, distanceKm,
  rideEtaText,
  formatRp, estimateFare,
  zones, settings,
  handleFindDriver,
  initialVehicle,
}) {
  const [hireMode, setHireMode] = useState(false)
  const [directoryOpen, setDirectoryOpen] = useState(false)
  const [selectedHirePackage, setSelectedHirePackage] = useState(null)
  const isBikeMode = !initialVehicle || initialVehicle === 'bike_ride'
  const hireRates = isBikeMode ? HOURLY_RATES.bike : HOURLY_RATES.car

  const isManualPickup = pickup && pickup.address !== 'Current location (GPS)'
  const gpsMismatchKm  = isManualPickup && gpsCoords && pickup.lat && pickup.lng
    ? gpsDistanceKm(pickup.lat, pickup.lng, gpsCoords.lat, gpsCoords.lng)
    : 0
  const showMismatch = gpsMismatchKm > 1

  return (
    <div className={styles.body}>
      {/* Map + side buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <DriverMap userCoords={pickupCoords} driverType={vehicleType} selectedDriverId={null} />
        </div>
        {/* Side buttons — Hire + Places (standard height) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, justifyContent: 'center' }}>
          <button
            onClick={() => { setHireMode(true); setVehicleType(isBikeMode ? 'bike_hire' : 'car_hire'); setHasPickedVehicle(true) }}
            style={{
              width: 52, padding: '10px 0', borderRadius: 12, cursor: 'pointer',
              backgroundColor: hireMode ? 'rgba(245,158,11,0.15)' : 'rgba(0,0,0,0.7)',
              border: `1.5px solid ${hireMode ? '#F59E0B' : 'rgba(255,255,255,0.1)'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}
          >
            <span style={{ fontSize: 18 }}>⏱️</span>
            <span style={{ fontSize: 8, fontWeight: 800, color: hireMode ? '#F59E0B' : 'rgba(255,255,255,0.5)' }}>Hire</span>
          </button>
          <button
            onClick={() => { setHireMode(false); setDirectoryOpen(true) }}
            style={{
              width: 52, padding: '10px 0', borderRadius: 12, cursor: 'pointer',
              backgroundColor: 'rgba(0,0,0,0.7)', border: '1.5px solid rgba(255,255,255,0.1)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}
          >
            <span style={{ fontSize: 18 }}>📍</span>
            <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>Places</span>
          </button>
        </div>
      </div>

      {/* Main service buttons — Ride + Package with vehicle images */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {(!initialVehicle || initialVehicle === 'bike_ride') && (
          <>
            <button
              className={`${styles.vehicleTab} ${!hireMode && vehicleType === 'bike_ride' ? styles.vehicleTabActive : ''}`}
              onClick={() => { setHireMode(false); setVehicleType('bike_ride'); setHasPickedVehicle(true) }}
              style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: 8, padding: '10px 12px', textAlign: 'left' }}
            >
              <img src={BIKE_IMG} alt="" style={{ width: 40, height: 32, objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <span className={styles.vehicleTabLabel} style={{ display: 'block' }}>Bike Ride</span>
                <span className={styles.vehicleTabPrice}>{formatRp(estimateFare('bike_ride', 'Yogyakarta', distanceKm, zones, settings))}</span>
                {rideEtaText && vehicleType === 'bike_ride' && <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>~{rideEtaText}</span>}
              </div>
            </button>
            <button
              className={`${styles.vehicleTab} ${!hireMode && vehicleType === 'bike_parcel' ? styles.vehicleTabActive : ''}`}
              onClick={() => { setHireMode(false); setVehicleType('bike_parcel'); setHasPickedVehicle(true) }}
              style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: 8, padding: '10px 12px', textAlign: 'left' }}
            >
              <img src={BIKE_IMG} alt="" style={{ width: 40, height: 32, objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <span className={styles.vehicleTabLabel} style={{ display: 'block' }}>Package</span>
                <span className={styles.vehicleTabPrice}>{formatRp(estimateFare('bike_ride', 'Yogyakarta', distanceKm, zones, settings))}</span>
              </div>
            </button>
          </>
        )}
        {initialVehicle === 'car_taxi' && (
          <>
            <button
              className={`${styles.vehicleTab} ${!hireMode && vehicleType === 'car_taxi' ? styles.vehicleTabActive : ''}`}
              onClick={() => { setHireMode(false); setVehicleType('car_taxi'); setHasPickedVehicle(true) }}
              style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: 8, padding: '10px 12px', textAlign: 'left' }}
            >
              <img src={CAR_IMG} alt="" style={{ width: 40, height: 32, objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <span className={styles.vehicleTabLabel} style={{ display: 'block' }}>Car Ride</span>
                <span className={styles.vehicleTabPrice}>{formatRp(estimateFare('car_taxi', 'Yogyakarta', distanceKm, zones, settings))}</span>
                {rideEtaText && vehicleType === 'car_taxi' && <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>~{rideEtaText}</span>}
              </div>
            </button>
            <button
              className={`${styles.vehicleTab} ${!hireMode && vehicleType === 'car_parcel' ? styles.vehicleTabActive : ''}`}
              onClick={() => { setHireMode(false); setVehicleType('car_parcel'); setHasPickedVehicle(true) }}
              style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: 8, padding: '10px 12px', textAlign: 'left' }}
            >
              <img src={CAR_IMG} alt="" style={{ width: 40, height: 32, objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <span className={styles.vehicleTabLabel} style={{ display: 'block' }}>Package</span>
                <span className={styles.vehicleTabPrice}>{formatRp(estimateFare('car_taxi', 'Yogyakarta', distanceKm, zones, settings))}</span>
              </div>
            </button>
          </>
        )}
      </div>

      {/* ── Hourly Hire panel ── */}
      {hireMode && (
        <div className={styles.hirePanel}>
          <div className={styles.hireTitleRow}>
            <span className={styles.hireTitle}>{isBikeMode ? '🏍️' : '🚗'} Hire {isBikeMode ? 'Bike' : 'Car'} + Driver</span>
            <button className={styles.hireBack} onClick={() => { setHireMode(false); setSelectedHirePackage(null); setVehicleType(isBikeMode ? 'bike_ride' : 'car_taxi') }}>
              ← Back
            </button>
          </div>

          <div className={styles.hirePackages}>
            {hireRates.packages.map(pkg => (
              <button
                key={pkg.hours}
                className={`${styles.hirePackage} ${selectedHirePackage === pkg.hours ? styles.hirePackageActive : ''}`}
                onClick={() => setSelectedHirePackage(pkg.hours)}
              >
                <span className={styles.hirePackageHours}>{pkg.label}</span>
                <span className={styles.hirePackagePrice}>{formatRpStatic(pkg.price)}</span>
                {pkg.badge && <span className={styles.hirePackageBadge}>{pkg.badge}</span>}
              </button>
            ))}
          </div>

          <div className={styles.hireRules}>
            <div className={styles.hireRule}>📸 Fuel gauge photo at start & end — buyer pays fuel difference</div>
            <div className={styles.hireRule}>📍 Driver returns you to pickup location</div>
            <div className={styles.hireRule}>🔄 Unlimited km — go wherever you want</div>
            <div className={styles.hireRule}>⏱️ Timer starts when driver arrives</div>
            <div className={styles.hireRule}>➕ Extend +1hr at {formatRpStatic(hireRates.perHour)}/hr during trip</div>
          </div>

          {selectedHirePackage && (
            <div className={styles.hireSummary}>
              <span className={styles.hireSummaryLabel}>Total hire fee</span>
              <span className={styles.hireSummaryPrice}>
                {formatRpStatic(hireRates.packages.find(p => p.hours === selectedHirePackage)?.price ?? 0)}
              </span>
              <span className={styles.hireSummaryFuel}>+ fuel (paid separately at end of trip)</span>
            </div>
          )}
        </div>
      )}

      {/* Location fields — hidden in hire mode */}
      {!hireMode && (<>
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

        {/* GPS mismatch warning */}
        {showMismatch && (
          <div className={styles.gpsMismatchWarn} style={{ margin: '8px 0 0' }}>
            ⚠️ Your pickup is {gpsMismatchKm.toFixed(1)} km from your GPS position — is this correct?
          </div>
        )}

        {/* Fare — inside location container */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 0', marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Estimated Fare</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{formatRp(fare)}</span>
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
      {/* Demo shortcut — skip to active ride to preview Add Stop */}
      <button onClick={() => {
        setVehicleType(initialVehicle ?? 'bike_ride')
        setHasPickedVehicle(true)
        if (!pickup) { setPickup({ label: 'Demo Pickup', address: 'Jl. Malioboro 45, Yogyakarta', lat: -7.797, lng: 110.370 }); setPickupQuery('Jl. Malioboro 45') }
        if (!destination) { setDestination({ label: 'Demo Dest', address: 'Prambanan Temple, Klaten', lat: -7.752, lng: 110.491 }); setDestQuery('Prambanan Temple') }
        handleFindDriver()
      }} style={{ padding: '8px 12px', borderRadius: 8, backgroundColor: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)', color: '#FACC15', fontSize: 11, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
        ⚡ Demo: Quick Book
      </button>
      </>)}

      {/* Hire mode — find driver with pickup only */}
      {hireMode && selectedHirePackage && (
        <div className={styles.fieldGroup}>
          <LocationField
            label="Pickup Location"
            query={pickupQuery} setQuery={setPickupQuery}
            value={pickup} setValue={setPickup}
            showSuggest={showPickupSuggest} setShowSuggest={setShowPickupSuggest}
            placeholder="Where should the driver pick you up?"
            isPickup
            gpsLoading={gpsLoading} gpsError={gpsError} onGps={handleGps}
          />
          <button
            className={styles.findBtn}
            disabled={!pickup}
            onClick={handleFindDriver}
          >
            Find a Driver — {formatRpStatic(hireRates.packages.find(p => p.hours === selectedHirePackage)?.price ?? 0)}
          </button>
        </div>
      )}

      <DestinationDirectory
        open={directoryOpen}
        onClose={() => setDirectoryOpen(false)}
        vehicleMode={initialVehicle}
        onSelectDestination={(dest) => {
          setHireMode(false)
          setDestination({ label: dest.name, address: dest.address, lat: dest.lat, lng: dest.lng })
          setDestQuery(dest.name)
          setVehicleType(isBikeMode ? 'bike_ride' : 'car_taxi')
          setHasPickedVehicle(true)
        }}
      />
    </div>
  )
}
