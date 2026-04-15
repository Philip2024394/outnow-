/**
 * BookingFormPanel — pickup/dropoff form, location search autocomplete,
 * vehicle type selection (bike/car), fare preview, and the "Find a Driver" button.
 *
 * Sub-component LocationField is declared locally as it is only used here.
 */
import styles from '../BookingScreen.module.css'
import DriverMap from '@/components/driver/DriverMap'

import { useState } from 'react'
import DestinationDirectory from '@/components/booking/DestinationDirectory'

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
      <DriverMap userCoords={pickupCoords} driverType={vehicleType} selectedDriverId={null} />

      {/* Vehicle tabs — bike page shows bike options only, car page shows car options only */}
      <div className={styles.vehicleTabs}>
        {(!initialVehicle || initialVehicle === 'bike_ride') && (
          <>
            <button
              className={`${styles.vehicleTab} ${!hireMode && vehicleType === 'bike_ride' ? styles.vehicleTabActive : ''}`}
              onClick={() => { setHireMode(false); setVehicleType('bike_ride'); setHasPickedVehicle(true) }}
            >
              <span className={styles.vehicleTabLabel}>Bike Ride</span>
              <span className={styles.vehicleTabPrice}>{formatRp(estimateFare('bike_ride', 'Yogyakarta', distanceKm, zones, settings))}</span>
              <img src={BIKE_IMG} alt="Bike" className={styles.vehicleTabImg} />
            </button>
            <button
              className={`${styles.vehicleTab} ${!hireMode && vehicleType === 'bike_parcel' ? styles.vehicleTabActive : ''}`}
              onClick={() => { setHireMode(false); setVehicleType('bike_parcel'); setHasPickedVehicle(true) }}
            >
              <span className={styles.vehicleTabLabel}>Bike Parcel</span>
              <span className={styles.vehicleTabPrice}>{formatRp(estimateFare('bike_ride', 'Yogyakarta', distanceKm, zones, settings))}</span>
              <img src={BIKE_IMG} alt="Bike Parcel" className={styles.vehicleTabImg} />
            </button>
          </>
        )}
        {initialVehicle === 'car_taxi' && (
          <>
            <button
              className={`${styles.vehicleTab} ${!hireMode && vehicleType === 'car_taxi' ? styles.vehicleTabActive : ''}`}
              onClick={() => { setHireMode(false); setVehicleType('car_taxi'); setHasPickedVehicle(true) }}
            >
              <span className={styles.vehicleTabLabel}>Car Taxi</span>
              <span className={styles.vehicleTabPrice}>{formatRp(estimateFare('car_taxi', 'Yogyakarta', distanceKm, zones, settings))}</span>
              <img src={CAR_IMG} alt="Car" className={`${styles.vehicleTabImg} ${styles.vehicleTabImgCar}`} />
            </button>
            <button
              className={`${styles.vehicleTab} ${!hireMode && vehicleType === 'car_parcel' ? styles.vehicleTabActive : ''}`}
              onClick={() => { setHireMode(false); setVehicleType('car_parcel'); setHasPickedVehicle(true) }}
            >
              <span className={styles.vehicleTabLabel}>Car Package</span>
              <span className={styles.vehicleTabPrice}>{formatRp(estimateFare('car_taxi', 'Yogyakarta', distanceKm, zones, settings))}</span>
              <img src={CAR_IMG} alt="Car Package" className={`${styles.vehicleTabImg} ${styles.vehicleTabImgCar}`} />
            </button>
          </>
        )}

        {/* Hire by Hour tab */}
        <button
          className={`${styles.vehicleTab} ${hireMode ? styles.vehicleTabActive : ''}`}
          onClick={() => { setHireMode(true); setVehicleType(isBikeMode ? 'bike_hire' : 'car_hire'); setHasPickedVehicle(true) }}
          style={hireMode ? { borderColor: '#F59E0B' } : {}}
        >
          <span className={styles.vehicleTabLabel}>⏰ Hire</span>
          <span className={styles.vehicleTabPrice}>{formatRpStatic(hireRates.perHour)}/hr</span>
        </button>
      </div>

      {/* Directory button */}
      <button className={styles.directoryBtn} onClick={() => setDirectoryOpen(true)}>
        <span>📍</span>
        <span>Browse Destinations</span>
        <span className={styles.directoryArrow}>→</span>
      </button>

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
      </div>

      {/* GPS mismatch warning */}
      {showMismatch && (
        <div className={styles.gpsMismatchWarn}>
          ⚠️ Your pickup is {gpsMismatchKm.toFixed(1)} km from your GPS position — is this correct?
        </div>
      )}

      {/* Fare preview */}
      <div className={styles.fareRow}>
        <div className={styles.fareItem}>
          <span className={styles.fareItemLabel}>Estimated Fare</span>
          <span className={styles.fareItemValue}>{formatRp(fare)}</span>
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
