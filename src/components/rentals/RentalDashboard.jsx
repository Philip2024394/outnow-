/**
 * RentalDashboard — Owner dashboard for creating & managing rental listings.
 * Supports bikes, cars, trucks, buses with full pricing, driver, extras.
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  VEHICLE_TYPES, FUEL_OPTIONS,
  createListing, getMyListings, deleteListing, toggleListingStatus, fmtPrice,
} from '@/services/rentalListingService'
import styles from './RentalDashboard.module.css'

function Toggle({ value, onChange }) {
  return (
    <button className={`${styles.toggle} ${value ? styles.toggleOn : ''}`} onClick={() => onChange(!value)}>
      <span className={styles.toggleDot} />
    </button>
  )
}

function Counter({ value, onChange, min = 0, max = 10 }) {
  return (
    <div className={styles.counter}>
      <button className={styles.counterBtn} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span className={styles.counterVal}>{value}</span>
      <button className={styles.counterBtn} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  )
}

function ListingForm({ onSubmit, onClose }) {
  const [vehicleType, setVehicleType] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [cc, setCc] = useState('')
  const [color, setColor] = useState('')
  const [plateNo, setPlateNo] = useState('')

  // Pricing
  const [priceDaily, setPriceDaily] = useState('')
  const [priceWeekly, setPriceWeekly] = useState('')
  const [priceMonthly, setPriceMonthly] = useState('')
  const [withDriver, setWithDriver] = useState(false)
  const [driverDaily, setDriverDaily] = useState('')
  const [fuel, setFuel] = useState('excluded')

  // Bike extras
  const [helmets, setHelmets] = useState(2)
  const [raincoats, setRaincoats] = useState(0)

  // Car/Bus extras
  const [seats, setSeats] = useState(5)

  // Services
  const [hotelDelivery, setHotelDelivery] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState('')
  const [airportPickup, setAirportPickup] = useState(false)
  const [airportDropoff, setAirportDropoff] = useState(false)
  const [airportFee, setAirportFee] = useState('')

  // Contact
  const [whatsapp, setWhatsapp] = useState('')
  const [location, setLocation] = useState('')

  const isBike = vehicleType === 'motorcycle'
  const canSubmit = vehicleType && brand && model && priceDaily && whatsapp

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit({
      vehicleType,
      brand, model, year, cc: Number(cc) || 0, color, plateNo,
      priceDaily: Number(priceDaily) || 0,
      priceWeekly: Number(priceWeekly) || 0,
      priceMonthly: Number(priceMonthly) || 0,
      withDriver, driverDaily: Number(driverDaily) || 0,
      fuel,
      helmets: isBike ? helmets : 0,
      raincoats: isBike ? raincoats : 0,
      seats: isBike ? 0 : Number(seats) || 0,
      hotelDelivery, deliveryFee: Number(deliveryFee) || 0,
      airportPickup, airportDropoff, airportFee: Number(airportFee) || 0,
      whatsapp, location,
    })
  }

  return createPortal(
    <div className={styles.formOverlay} onClick={onClose}>
      <div className={styles.formSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.formHeader}>
          <span className={styles.formTitle}>New Listing</span>
          <button className={styles.backBtn} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.form}>
          {/* Vehicle Type */}
          <div className={styles.field}>
            <span className={styles.label}>What are you listing?</span>
            <div className={styles.typeGrid}>
              {VEHICLE_TYPES.map(t => (
                <button key={t.id} className={`${styles.typeBtn} ${vehicleType === t.id ? styles.typeBtnActive : ''}`} onClick={() => setVehicleType(t.id)}>
                  <span className={styles.typeBtnIcon}>{t.icon}</span>
                  <span className={styles.typeBtnLabel}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle details */}
          <span className={styles.formSection}>Vehicle Details</span>
          <div className={styles.row}>
            <div className={styles.field}>
              <span className={styles.label}>Brand *</span>
              <input className={styles.input} value={brand} onChange={e => setBrand(e.target.value)} placeholder="Honda, Toyota..." />
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Model *</span>
              <input className={styles.input} value={model} onChange={e => setModel(e.target.value)} placeholder="Beat, Avanza..." />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <span className={styles.label}>Year</span>
              <input className={styles.input} value={year} onChange={e => setYear(e.target.value)} placeholder="2023" type="number" />
            </div>
            <div className={styles.field}>
              <span className={styles.label}>CC</span>
              <input className={styles.input} value={cc} onChange={e => setCc(e.target.value)} placeholder="150" type="number" />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <span className={styles.label}>Color</span>
              <input className={styles.input} value={color} onChange={e => setColor(e.target.value)} placeholder="Black" />
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Plate No.</span>
              <input className={styles.input} value={plateNo} onChange={e => setPlateNo(e.target.value)} placeholder="AB 1234 CD" />
            </div>
          </div>

          {!isBike && (
            <div className={styles.field}>
              <span className={styles.label}>Seats</span>
              <Counter value={seats} onChange={setSeats} min={2} max={50} />
            </div>
          )}

          {/* Pricing */}
          <span className={styles.formSection}>Pricing</span>
          <div className={styles.row}>
            <div className={styles.field}>
              <span className={styles.label}>Daily Rate *</span>
              <input className={styles.input} value={priceDaily} onChange={e => setPriceDaily(e.target.value)} placeholder="75000" type="number" />
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Weekly Rate</span>
              <input className={styles.input} value={priceWeekly} onChange={e => setPriceWeekly(e.target.value)} placeholder="450000" type="number" />
            </div>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Monthly Rate</span>
            <input className={styles.input} value={priceMonthly} onChange={e => setPriceMonthly(e.target.value)} placeholder="1500000" type="number" />
          </div>

          {/* Fuel */}
          <div className={styles.field}>
            <span className={styles.label}>Fuel</span>
            <div className={styles.fuelBtns}>
              {FUEL_OPTIONS.map(f => (
                <button key={f.id} className={`${styles.fuelBtn} ${fuel === f.id ? styles.fuelBtnActive : ''}`} onClick={() => setFuel(f.id)}>
                  {f.id === 'included' ? '⛽ ' : ''}{f.label}
                </button>
              ))}
            </div>
          </div>

          {/* With Driver */}
          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>Available with driver</span>
            <Toggle value={withDriver} onChange={setWithDriver} />
          </div>
          {withDriver && (
            <div className={styles.field}>
              <span className={styles.label}>With Driver Daily Rate</span>
              <input className={styles.input} value={driverDaily} onChange={e => setDriverDaily(e.target.value)} placeholder="200000" type="number" />
            </div>
          )}

          {/* Bike extras */}
          {isBike && (
            <>
              <span className={styles.formSection}>Bike Extras</span>
              <div className={styles.row}>
                <div className={styles.field}>
                  <span className={styles.label}>🪖 Helmets</span>
                  <Counter value={helmets} onChange={setHelmets} min={1} max={2} />
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>🧥 Raincoats</span>
                  <Counter value={raincoats} onChange={setRaincoats} min={0} max={2} />
                </div>
              </div>
            </>
          )}

          {/* Services */}
          <span className={styles.formSection}>Services</span>
          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>🏨 Hotel / Villa delivery</span>
            <Toggle value={hotelDelivery} onChange={setHotelDelivery} />
          </div>
          {hotelDelivery && (
            <div className={styles.field}>
              <span className={styles.label}>Delivery Fee</span>
              <input className={styles.input} value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} placeholder="0 = free delivery" type="number" />
            </div>
          )}

          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>✈️ Airport pickup</span>
            <Toggle value={airportPickup} onChange={setAirportPickup} />
          </div>
          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>✈️ Airport drop-off</span>
            <Toggle value={airportDropoff} onChange={setAirportDropoff} />
          </div>
          {(airportPickup || airportDropoff) && (
            <div className={styles.field}>
              <span className={styles.label}>Airport Service Fee</span>
              <input className={styles.input} value={airportFee} onChange={e => setAirportFee(e.target.value)} placeholder="50000" type="number" />
            </div>
          )}

          {/* Contact */}
          <span className={styles.formSection}>Contact</span>
          <div className={styles.field}>
            <span className={styles.label}>WhatsApp Number *</span>
            <input className={styles.input} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+62 812 3456 7890" type="tel" />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Location / Area</span>
            <input className={styles.input} value={location} onChange={e => setLocation(e.target.value)} placeholder="Sleman, Yogyakarta" />
          </div>

          <button className={styles.submitBtn} disabled={!canSubmit} onClick={handleSubmit}>
            Create Listing
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function RentalDashboard({ open, onClose }) {
  const [listings, setListings] = useState([])
  const [tab, setTab] = useState('all')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { if (open) setListings(getMyListings()) }, [open])

  if (!open) return null

  const filtered = tab === 'all' ? listings
    : tab === 'active' ? listings.filter(l => l.status === 'active')
    : listings.filter(l => l.status === 'paused')

  function handleCreate(data) {
    createListing(data)
    setListings(getMyListings())
    setShowForm(false)
  }

  function handleDelete(id) {
    deleteListing(id)
    setListings(getMyListings())
  }

  function handleToggle(id) {
    toggleListingStatus(id)
    setListings(getMyListings())
  }

  const typeIcon = (t) => VEHICLE_TYPES.find(v => v.id === t)?.icon || '🚗'

  return createPortal(
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={styles.headerTitle}>My Rentals</span>
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>
          + New Listing
        </button>
      </div>

      <div className={styles.tabs}>
        {['all', 'active', 'paused'].map(t => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)} ({t === 'all' ? listings.length : listings.filter(l => l.status === (t === 'active' ? 'active' : 'paused')).length})
          </button>
        ))}
      </div>

      <div className={styles.body}>
        {filtered.length === 0 && <div className={styles.empty}>No listings yet. Tap "+ New Listing" to add your first vehicle.</div>}

        {filtered.map(l => (
          <div key={l.id} className={styles.listingCard}>
            <div className={styles.listingImgPlaceholder}>{typeIcon(l.vehicleType)}</div>
            <div className={styles.listingBody}>
              <span className={styles.listingName}>{l.brand} {l.model} {l.year}</span>
              <span className={styles.listingMeta}>{l.cc}cc · {l.color} · {l.plateNo}</span>
              <span className={styles.listingPrice}>{fmtPrice(l.priceDaily)}/day</span>
              <div className={styles.listingTags}>
                <span className={styles.listingTag}>{l.fuel === 'included' ? '⛽ Fuel incl.' : '⛽ No fuel'}</span>
                {l.withDriver && <span className={`${styles.listingTag} ${styles.listingTagGreen}`}>🧑‍✈️ Driver {fmtPrice(l.driverDaily)}/day</span>}
                {l.vehicleType === 'motorcycle' && <span className={styles.listingTag}>🪖 {l.helmets} helmet{l.helmets > 1 ? 's' : ''}</span>}
                {l.vehicleType === 'motorcycle' && l.raincoats > 0 && <span className={styles.listingTag}>🧥 {l.raincoats} raincoat{l.raincoats > 1 ? 's' : ''}</span>}
                {l.hotelDelivery && <span className={`${styles.listingTag} ${styles.listingTagGreen}`}>🏨 Hotel delivery</span>}
                {l.airportPickup && <span className={`${styles.listingTag} ${styles.listingTagGreen}`}>✈️ Airport</span>}
              </div>
            </div>
            <div className={styles.listingActions}>
              <span className={`${styles.statusBadge} ${l.status === 'active' ? styles.statusActive : styles.statusPaused}`}>
                {l.status === 'active' ? 'Active' : 'Paused'}
              </span>
              <button className={styles.listingEditBtn} onClick={() => handleToggle(l.id)}>
                {l.status === 'active' ? 'Pause' : 'Resume'}
              </button>
              <button className={styles.listingDeleteBtn} onClick={() => handleDelete(l.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && <ListingForm onSubmit={handleCreate} onClose={() => setShowForm(false)} />}
    </div>,
    document.body
  )
}
