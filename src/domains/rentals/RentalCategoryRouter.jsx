/**
 * RentalCategoryRouter — renders the correct listing form based on selected category.
 * Each category has its own dedicated multi-step form with category-specific fields.
 */
import { useState } from 'react'
import OwnerProfileForm from './forms/OwnerProfileForm'
import MotorbikeListingForm from './forms/MotorbikeListingForm'
import CarListingForm from './forms/CarListingForm'
import BicycleListingForm from './forms/BicycleListingForm'
import BusListingForm from './forms/BusListingForm'
import TruckListingForm from './forms/TruckListingForm'
import EventEquipmentListingForm from './forms/EventEquipmentListingForm'
import PropertyListingForm from './forms/PropertyListingForm'
import styles from './rentalFormStyles.module.css'

const CATEGORIES = [
  { id: 'motorbike', label: 'Motorbikes', icon: '🏍️', img: 'https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237', desc: 'List your motorbike for daily or weekly rental', items: ['Matic', 'Sport', 'Trail', 'Classic', 'Cruiser'] },
  { id: 'car',       label: 'Cars',                  icon: '🚗', img: 'https://ik.imagekit.io/nepgaxllc/Sporty%20green%20and%20black%20hatchback.png?updatedAt=1775634925566', desc: 'Rent out cars with or without driver', items: ['City Car', 'MPV', 'SUV', 'Sedan', 'Van', 'Premium'] },
  { id: 'bicycle',   label: 'Bicycles',              icon: '🚲', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2008_50_14%20PM.png?updatedAt=1776520241679', desc: 'Mountain, road, city, e-bikes & folding bikes', items: ['Mountain', 'Road', 'City', 'E-Bike', 'Folding'] },
  { id: 'property',  label: 'Property / Vacation',   icon: '🏠', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaa33asdasdasd-removebg-preview.png', desc: 'Villas, kos, apartments — daily to monthly', items: ['Villa', 'Apartment', 'House', 'Room', 'Kos'] },
  { id: 'bus',       label: 'Bus / Minibus',          icon: '🚌', img: 'https://ik.imagekit.io/nepgaxllc/asdasdasssssddd-removebg-preview.png?updatedAt=1776445952804', desc: 'Shuttle, tour bus & minibus with or without driver', items: ['Minibus', 'Tour Bus', 'Shuttle', 'School Bus'] },
  { id: 'truck',     label: 'Trucks',                icon: '🚛', img: 'https://ik.imagekit.io/nepgaxllc/asdasdasssss-removebg-preview.png?updatedAt=1776445645373', desc: 'Pickup, box truck, flatbed & moving trucks', items: ['Pickup', 'Box Truck', 'Flatbed', 'Dump Truck'] },
  { id: 'event',     label: 'Event Equipment',       icon: '🎉', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsssbbb-removebg-preview.png', desc: 'Sound, lighting, stage, tables & decor', items: ['PA System', 'Lighting', 'Stage', 'Tables', 'Tent'] },
]

export default function RentalCategoryRouter({ open, onClose, onSubmit }) {
  const [selectedCat, setSelectedCat] = useState(null)
  const [editListingData, setEditListingData] = useState(null)
  const [listingMarket, setListingMarket] = useState(null) // 'rental' | 'selling'
  const [ownerDone, setOwnerDone] = useState(() => !!localStorage.getItem('indoo_rental_owner'))

  if (!open) return null

  // Category selected but no market chosen → show market selector
  if (selectedCat && !listingMarket && !editListingData) {
    return (
      <div className={styles.screen} style={{ backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2016,%202026,%2008_02_07%20PM.png?updatedAt=1776344543969)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px 20px' }}>

          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 6px', textAlign: 'center' }}>What would you like to do?</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '0 0 30px', textAlign: 'center' }}>Choose how you want to list your {selectedCat === 'motorbike' ? 'motorbike' : selectedCat === 'car' ? 'car' : selectedCat === 'truck' ? 'truck' : selectedCat === 'bus' ? 'bus' : selectedCat === 'property' ? 'property' : selectedCat === 'event' ? 'equipment' : 'item'}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 340 }}>
            {/* Rental Market */}
            <button onClick={() => setListingMarket('rental')} style={{
              padding: '20px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(141,198,63,0.2)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)',
              transition: 'all 0.25s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🔑</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#8DC63F' }}>Rental Market</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3, lineHeight: 1.4 }}>List for daily, weekly or monthly rental. Earn recurring income from your vehicle.</div>
                </div>
              </div>
            </button>

            {/* Selling Market */}
            <button onClick={() => setListingMarket('selling')} style={{
              padding: '20px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(255,215,0,0.15)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)',
              transition: 'all 0.25s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>💰</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#FFD700' }}>Selling Market</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3, lineHeight: 1.4 }}>Put your vehicle up for sale. Set your price and find a buyer.</div>
                </div>
              </div>
            </button>
          </div>

          <button onClick={() => setSelectedCat(null)} style={{ marginTop: 20, padding: '10px 24px', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Back to categories
          </button>
        </div>
      </div>
    )
  }

  // Market selected → check if owner profile is done
  if (selectedCat && listingMarket && !ownerDone) {
    return <OwnerProfileForm open onClose={() => { setSelectedCat(null); setListingMarket(null) }} onComplete={() => setOwnerDone(true)} />
  }

  const handleFormClose = (action, listing) => {
    if (action === 'edit' && listing) {
      const cat = selectedCat
      setSelectedCat(null)
      setEditListingData(listing)
      setListingMarket(listing.buy_now ? 'selling' : 'rental')
      setTimeout(() => setSelectedCat(cat), 50)
    } else if (action === 'viewMarketplace') {
      setSelectedCat(null)
      setEditListingData(null)
      setListingMarket(null)
      onClose('viewMarketplace')
    } else {
      setSelectedCat(null)
      setEditListingData(null)
      setListingMarket(null)
    }
  }

  // Owner done + category selected → show the listing form
  if (selectedCat === 'motorbike') return <MotorbikeListingForm open onClose={handleFormClose} onSubmit={onSubmit} editListing={editListingData} listingMarket={listingMarket} />
  if (selectedCat === 'car') return <CarListingForm open onClose={handleFormClose} onSubmit={onSubmit} editListing={editListingData} listingMarket={listingMarket} />
  if (selectedCat === 'bicycle') return <BicycleListingForm open onClose={handleFormClose} onSubmit={onSubmit} editListing={editListingData} listingMarket={listingMarket} />
  if (selectedCat === 'bus') return <BusListingForm open onClose={handleFormClose} onSubmit={onSubmit} editListing={editListingData} listingMarket={listingMarket} />
  if (selectedCat === 'truck') return <TruckListingForm open onClose={handleFormClose} onSubmit={onSubmit} editListing={editListingData} listingMarket={listingMarket} />
  if (selectedCat === 'property') return <PropertyListingForm open onClose={handleFormClose} onSubmit={onSubmit} editListing={editListingData} listingMarket={listingMarket} />
  if (selectedCat === 'event') return <EventEquipmentListingForm open onClose={handleFormClose} onSubmit={onSubmit} editListing={editListingData} listingMarket={listingMarket} />

  // Category selection screen
  return (
    <div className={styles.screen} style={{ backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2016,%202026,%2008_02_07%20PM.png?updatedAt=1776344543969)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />
      <div className={styles.header} style={{ position: 'relative', zIndex: 1 }}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className={styles.headerTitle}>
          <span className={styles.headerName}>List a Rental</span>
          <span className={styles.headerSub}>Select what you want to list</span>
        </div>
      </div>

      <div className={styles.content} style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 130 }}>
          {CATEGORIES.map(c => (
            <div key={c.id}>
              <button
                onClick={() => setSelectedCat(c.id)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 0, width: '100%',
                  padding: 0,
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: '1.5px solid rgba(141,198,63,0.15)',
                  borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  transition: 'all 0.25s', overflow: 'hidden',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                {/* Top: text + image */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 14px 8px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{c.label}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>{c.desc}</span>
                  </div>
                  {c.img
                    ? <img src={c.img} alt={c.label} style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }} />
                    : <span style={{ fontSize: 36, flexShrink: 0, width: 60, textAlign: 'center' }}>{c.icon}</span>
                  }
                </div>
                {/* Bottom: badges inside container */}
                <div style={{ display: 'flex', gap: 4, padding: '6px 14px 10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {c.items.map(item => (
                    <span key={item} style={{ padding: '3px 10px', background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.2)', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#8DC63F', whiteSpace: 'nowrap', flexShrink: 0 }}>{item}</span>
                  ))}
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
