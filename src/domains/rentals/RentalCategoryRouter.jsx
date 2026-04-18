/**
 * RentalCategoryRouter — renders the correct listing form based on selected category.
 * Each category has its own dedicated multi-step form with category-specific fields.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import OwnerProfileForm from './forms/OwnerProfileForm'
import MotorbikeListingForm from './forms/MotorbikeListingForm'
import CarListingForm from './forms/CarListingForm'
import BicycleListingForm from './forms/BicycleListingForm'
import MassageEquipmentListingForm from './forms/MassageEquipmentListingForm'
import CampingGearListingForm from './forms/CampingGearListingForm'
import EventEquipmentListingForm from './forms/EventEquipmentListingForm'
import PropertyListingForm from './forms/PropertyListingForm'
import styles from './rentalFormStyles.module.css'

const CATEGORIES = [
  { id: 'motorbike', label: 'Motorbikes / Scooters', icon: '🏍️', img: 'https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237', desc: 'List your motorbike for daily or weekly rental', items: ['Matic', 'Sport', 'Trail', 'Classic', 'Cruiser'] },
  { id: 'car',       label: 'Cars',                  icon: '🚗', img: 'https://ik.imagekit.io/nepgaxllc/Sporty%20green%20and%20black%20hatchback.png?updatedAt=1775634925566', desc: 'Rent out cars with or without driver', items: ['City Car', 'MPV', 'SUV', 'Sedan', 'Van', 'Premium'] },
  { id: 'bicycle',   label: 'Bicycles',              icon: '🚲', desc: 'Mountain, road, city, e-bikes & folding bikes', items: ['Mountain', 'Road', 'City', 'E-Bike', 'Folding'] },
  { id: 'property',  label: 'Property / Vacation',   icon: '🏠', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2001_31_24%20AM.png', desc: 'Villas, kos, apartments — daily to monthly', items: ['Villa', 'Apartment', 'House', 'Room', 'Kos'] },
  { id: 'massage',   label: 'Massage Equipment',     icon: '💆', desc: 'Portable tables, chairs, accessories', items: ['Portable Table', 'Chair', 'Hot Stones', 'Accessories'] },
  { id: 'camping',   label: 'Camping Gear',          icon: '⛺', desc: 'Tents, sleeping bags, stoves & full kits', items: ['Tent', 'Sleeping Bag', 'Stove', 'Cooler', 'Full Set'] },
  { id: 'event',     label: 'Event Equipment',       icon: '🎉', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2001_29_12%20AM.png', desc: 'Sound, lighting, stage, tables & decor', items: ['PA System', 'Lighting', 'Stage', 'Tables', 'Tent'] },
]

export default function RentalCategoryRouter({ open, onClose, onSubmit }) {
  const [selectedCat, setSelectedCat] = useState(null)
  // DEV MODE: always show owner profile flow. Set to true for production: () => !!localStorage.getItem('indoo_rental_owner')
  const [ownerDone, setOwnerDone] = useState(false)

  if (!open) return null

  // First-time owner — show profile form
  if (!ownerDone) {
    return <OwnerProfileForm open onClose={onClose} onComplete={() => setOwnerDone(true)} />
  }

  // If a category form is open, render that form
  if (selectedCat === 'motorbike') return <MotorbikeListingForm open onClose={() => setSelectedCat(null)} onSubmit={onSubmit} />
  if (selectedCat === 'car') return <CarListingForm open onClose={() => setSelectedCat(null)} onSubmit={onSubmit} />
  if (selectedCat === 'bicycle') return <BicycleListingForm open onClose={() => setSelectedCat(null)} onSubmit={onSubmit} />
  if (selectedCat === 'property') return <PropertyListingForm open onClose={() => setSelectedCat(null)} onSubmit={onSubmit} />
  if (selectedCat === 'massage') return <MassageEquipmentListingForm open onClose={() => setSelectedCat(null)} onSubmit={onSubmit} />
  if (selectedCat === 'camping') return <CampingGearListingForm open onClose={() => setSelectedCat(null)} onSubmit={onSubmit} />
  if (selectedCat === 'event') return <EventEquipmentListingForm open onClose={() => setSelectedCat(null)} onSubmit={onSubmit} />

  // Category selection screen
  return createPortal(
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className={styles.headerTitle}>
          <span className={styles.headerName}>List a Rental</span>
          <span className={styles.headerSub}>Select what you want to list</span>
        </div>
      </div>

      <div className={styles.content}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 14px', minHeight: 80,
                background: 'rgba(255,255,255,0.04)',
                border: '1.5px solid rgba(255,255,255,0.06)',
                borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                transition: 'all 0.25s',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(141,198,63,0.3)'; e.currentTarget.style.background = 'rgba(141,198,63,0.04)' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{c.label}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{c.desc}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {c.items.map(item => (
                    <span key={item} style={{ padding: '2px 8px', background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#8DC63F' }}>{item}</span>
                  ))}
                </div>
              </div>
              {c.img
                ? <img src={c.img} alt={c.label} style={{ width: 64, height: 64, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
                : <span style={{ fontSize: 40, flexShrink: 0, width: 64, textAlign: 'center' }}>{c.icon}</span>
              }
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
