/**
 * RentalCategoryRouter — renders the correct listing form based on selected category.
 * Each category has its own dedicated multi-step form with category-specific fields.
 */
import { useState, useEffect } from 'react'
import IndooFooter from '@/components/ui/IndooFooter'
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
  { id: 'property',  label: 'Property',              icon: '🏠', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaa33asdasdasd-removebg-preview.png', desc: 'House, Factory, Kos, Villa', items: ['Villa', 'House', 'Factory', 'Kos'] },
  { id: 'bus',       label: 'Bus / Minibus',          icon: '🚌', img: 'https://ik.imagekit.io/nepgaxllc/asdasdasssssddd-removebg-preview.png?updatedAt=1776445952804', desc: 'Shuttle, tour bus & minibus with or without driver', items: ['Minibus', 'Tour Bus', 'Shuttle', 'School Bus'] },
  { id: 'truck',     label: 'Trucks',                icon: '🚛', img: 'https://ik.imagekit.io/nepgaxllc/asdasdasssss-removebg-preview.png?updatedAt=1776445645373', desc: 'Pickup, box truck, flatbed & moving trucks', items: ['Pickup', 'Box Truck', 'Flatbed', 'Dump Truck'] },
  { id: 'event',     label: 'Event Equipment',       icon: '🎉', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsssbbb-removebg-preview.png', desc: 'Sound, lighting, stage, tables & decor', items: ['PA System', 'Lighting', 'Stage', 'Tables', 'Tent'] },
  { id: 'fashion',   label: 'Fashion & Wedding',     icon: '👗', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2020,%202026,%2007_01_55%20AM.png', desc: 'Kebaya, suits, gowns & traditional wear', items: ['Wedding', 'Formal', 'Traditional', 'Costume', 'Accessories'] },
  { id: 'electronics', label: 'Electronics',          icon: '📸', img: 'https://ik.imagekit.io/nepgaxllc/bbbcddddgf-removebg-preview.png', desc: 'Cameras, laptops, phones & gear', items: ['Camera', 'Laptop', 'Phone', 'Drone', 'Console'] },
  { id: 'audio',     label: 'Audio & Sound',          icon: '🔊', img: 'https://ik.imagekit.io/nepgaxllc/bbbcdddd-removebg-preview.png', desc: 'Speakers, DJ equipment & PA systems', items: ['Speaker', 'DJ Set', 'PA System', 'Microphone', 'Mixer'] },
]

export default function RentalCategoryRouter({ open, onClose, onSubmit }) {
  const [selectedCat, setSelectedCat] = useState(null)
  const [editListingData, setEditListingData] = useState(null)
  const [listingMarket, setListingMarket] = useState(null) // 'rental' | 'selling'
  const [ownerDone, setOwnerDone] = useState(() => !!localStorage.getItem('indoo_rental_owner'))
  const [showWelcome, setShowWelcome] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [settingUp, setSettingUp] = useState(false)

  // Inject keyframes once via DOM
  useEffect(() => {
    if (document.getElementById('rental-cat-styles')) return
    const el = document.createElement('style')
    el.id = 'rental-cat-styles'
    el.textContent = `
      @keyframes setupRing { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      @keyframes setupRing2 { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
      @keyframes setupGlow { 0%, 100% { box-shadow: 0 0 20px rgba(141,198,63,0.2); } 50% { box-shadow: 0 0 40px rgba(141,198,63,0.5), 0 0 80px rgba(141,198,63,0.2); } }
      @keyframes setupFade { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      @keyframes setupSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes setupProgress { from { width: 0%; } to { width: 100%; } }
      @keyframes sellerRimGlow { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
    `
    document.head.appendChild(el)
  }, [])

  if (!open) return null

  // ── Setting up animation ──
  if (settingUp) {
    return (
      <div key="setup" style={{ position: 'fixed', inset: 0, zIndex: 9900, background: "#080808 url('https://ik.imagekit.io/nepgaxllc/Untitledfsdsss.png?updatedAt=1777336271626') center / cover no-repeat", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
        <div style={{ position: 'relative', width: 90, height: 90, animation: 'setupGlow 2s ease-in-out infinite' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(141,198,63,0.1)', borderTopColor: '#8DC63F', borderRightColor: '#8DC63F', animation: 'setupRing 1.2s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '3px solid rgba(250,204,21,0.1)', borderBottomColor: '#FACC15', borderLeftColor: '#FACC15', animation: 'setupRing2 1.8s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 18, borderRadius: '50%', border: '2px solid rgba(141,198,63,0.1)', borderTopColor: '#8DC63F', animation: 'setupRing 0.9s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
        </div>
        <div style={{ textAlign: 'center', animation: 'setupSlideUp 0.5s ease-out' }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#fff', display: 'block', letterSpacing: 0.5, animation: 'setupFade 2s ease-in-out infinite' }}>Processing Account</span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'block', marginTop: 8 }}>Preparing your seller dashboard...</span>
        </div>
        <div style={{ width: '60%', maxWidth: 240, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #8DC63F, #FACC15, #8DC63F)', animation: 'setupProgress 5s ease-in-out forwards' }} />
        </div>
      </div>
    )
  }

  // ── Welcome / How it works popup ──
  if (showWelcome) {
    return (
      <div key="welcome" style={{ position: 'fixed', inset: 0, zIndex: 9900, background: "#080808 url('https://ik.imagekit.io/nepgaxllc/Untitledfsdsss.png?updatedAt=1777336271626') center / cover no-repeat", overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px 20px 40px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        {/* Green running rim container */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 380, borderRadius: 24, padding: 2 }}>
          {/* Animated rim */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 24, background: 'linear-gradient(90deg, rgba(141,198,63,0.1), rgba(141,198,63,0.6), rgba(250,204,21,0.4), rgba(141,198,63,0.6), rgba(141,198,63,0.1))', backgroundSize: '200% 100%', animation: 'sellerRimGlow 3s linear infinite' }} />
          {/* Inner content */}
          <div style={{ position: 'relative', borderRadius: 22, background: '#0a0a0a', padding: '28px 22px 22px', overflow: 'hidden' }}>
            {/* Header */}
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px', textAlign: 'center' }}>INDOO <span style={{ color: '#8DC63F' }}>Seller Terms</span></h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 18px', textAlign: 'center', fontWeight: 600 }}>Read and agree to continue</p>

            {/* Content blocks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* What we do */}
              <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>What We Do</span>
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5 }}>INDOO operates across 12+ Indonesian cities with active marketing channels, promoted ads, and premium placement. We bring buyers directly to your listings. Our platform is built for results.</p>
              </div>

              {/* Commission Rates */}
              <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Commission Rates</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <span style={{ flex: 1, padding: '8px', borderRadius: 10, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', textAlign: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F', display: 'block' }}>10%</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Rentals</span>
                  </span>
                  <span style={{ flex: 1, padding: '8px', borderRadius: 10, background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.15)', textAlign: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#FACC15', display: 'block' }}>5%</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Sales</span>
                  </span>
                </div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.4 }}>These rates apply to all completed transactions. Established accounts with proven track records may qualify for adjusted rates.</p>
              </div>

              {/* Wallet */}
              <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Wallet Requirement</span>
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5 }}>A Rp 25,000 wallet top-up is required to activate your account. This is your money — it remains in your wallet and covers commission on your first transaction. Your account stays active as long as your wallet balance is positive.</p>
              </div>

              {/* The Process */}
              <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>The Process</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    'You list your item with photos and pricing',
                    'Buyers reach you through our secure chat',
                    'You choose to share your WhatsApp — this confirms the deal',
                    'Commission is deducted from your wallet automatically',
                  ].map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#8DC63F', flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unlimited */}
              <div style={{ padding: '10px 14px', background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.15)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>♾️</span>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F', display: 'block' }}>Unlimited Listings</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>No cap on how many items you list</span>
                </div>
              </div>

              {/* Rules */}
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#EF4444', display: 'block', marginBottom: 4 }}>Platform Rules</span>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.5 }}>Sharing personal contact details, phone numbers, or social media links in chat before selecting "Share WhatsApp" is strictly prohibited. All conversations are monitored. Violations result in account suspension.</p>
              </div>
            </div>

            {/* Agree checkbox */}
            <label onClick={() => setAgreed(!agreed)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16, cursor: 'pointer', userSelect: 'none' }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: agreed ? '2px solid #8DC63F' : '2px solid rgba(255,255,255,0.2)', background: agreed ? '#8DC63F' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                {agreed && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>I agree to INDOO's <span style={{ color: '#8DC63F', fontWeight: 700 }}>Terms & Conditions</span>, commission rates, and platform guidelines for sellers.</span>
            </label>

            {/* Continue button */}
            <button
              disabled={!agreed}
              onClick={() => { if (!agreed) return; setShowWelcome(false); setAgreed(false); setSettingUp(true); setTimeout(() => setSettingUp(false), 5000) }}
              style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 14, background: agreed ? '#8DC63F' : 'rgba(141,198,63,0.2)', border: 'none', color: agreed ? '#000' : 'rgba(0,0,0,0.3)', fontSize: 15, fontWeight: 900, cursor: agreed ? 'pointer' : 'default', fontFamily: 'inherit', boxShadow: agreed ? '0 4px 20px rgba(141,198,63,0.3)' : 'none', transition: 'all 0.2s' }}
            >
              Agree & Continue
            </button>
            <button
              onClick={onClose}
              style={{ width: '100%', marginTop: 8, padding: 10, borderRadius: 14, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Category selected but no market chosen → show market selector
  if (selectedCat && !listingMarket && !editListingData) {
    const catLabel = CATEGORIES.find(c => c.id === selectedCat)?.label || 'Item'
    return (
      <div key="market" className={styles.screen} style={{ backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/Untitledfsdsss.png?updatedAt=1777336271626)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />

        {/* Hero header */}
        <div style={{ position: 'relative', zIndex: 1, padding: '20px 20px 0' }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, textShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>Select</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0', fontWeight: 600 }}>Rent or For Sale</p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 360 }}>
            {/* Rental */}
            <button onClick={() => setListingMarket('rental')} style={{
              padding: '22px 20px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(141,198,63,0.2)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F' }}>For Rent</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3, lineHeight: 1.4 }}>Daily, weekly or monthly rental. Earn recurring income.</div>
                  <span style={{ display: 'inline-block', marginTop: 6, padding: '3px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.2)', fontSize: 11, fontWeight: 800, color: '#8DC63F' }}>10% commission</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>

            {/* Selling */}
            <button onClick={() => setListingMarket('selling')} style={{
              padding: '22px 20px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(255,215,0,0.15)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#FFD700' }}>For Sale</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3, lineHeight: 1.4 }}>Set your price and find a buyer. One-time sale.</div>
                  <span style={{ display: 'inline-block', marginTop: 6, padding: '3px 10px', borderRadius: 8, background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', fontSize: 11, fontWeight: 800, color: '#FFD700' }}>5% commission</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>
          </div>
        </div>

        <IndooFooter label={catLabel} onBack={() => setSelectedCat(null)} onHome={onClose} />
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
    <div key="catgrid" className={styles.screen} style={{ backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/Untitledfsdsss.png?updatedAt=1777336271626)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />

      {/* Hero header */}
      <div style={{ position: 'relative', zIndex: 1, padding: '20px 20px 10px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0, textShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>Select a <span style={{ color: '#8DC63F' }}>Category</span></h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', fontWeight: 600 }}>List a rental or for sale</p>
      </div>

      <div className={styles.content} style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 10 }}>
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
      <IndooFooter label="Sell / Rent" onHome={onClose} />
    </div>
  )
}
