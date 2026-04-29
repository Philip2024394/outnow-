/**
 * SellRentSheet — Unified entry point for sellers/renters.
 * Shows category cards routing to existing listing flows.
 */
import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import IndooFooter from '@/components/ui/IndooFooter'

const CATEGORIES = [
  { id: 'vehicles', label: 'Vehicles', tags: ['rent', 'sell'], action: 'rental', desc: 'Motorbikes, Cars, Trucks, Buses', centerImg: 'https://ik.imagekit.io/nepgaxllc/bbbc-removebg-preview.png' },
  { id: 'property', label: 'Property', tags: ['rent', 'sell'], action: 'rental', desc: 'House, Factory, Kos, Villa', centerImg: 'https://ik.imagekit.io/nepgaxllc/bbbcd-removebg-preview.png' },
  { id: 'electronics', label: 'Electronics', tags: ['rent'], action: 'rental', desc: 'Cameras, Laptops & Gear', centerImg: 'https://ik.imagekit.io/nepgaxllc/bbbcddddgf-removebg-preview.png' },
  { id: 'audio', label: 'Audio & Sound', tags: ['rent'], action: 'rental', desc: 'Speakers, DJ & PA', centerImg: 'https://ik.imagekit.io/nepgaxllc/bbbcdddd-removebg-preview.png' },
  { id: 'equipment', label: 'Party & Event', tags: ['rent'], action: 'rental', desc: 'Tents, Decor & Catering', centerImg: 'https://ik.imagekit.io/nepgaxllc/bbbcddd-removebg-preview.png' },
  { id: 'fashion', label: 'Fashion', tags: ['rent'], action: 'rental', desc: 'Wedding & fashion clothes', centerImg: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2020,%202026,%2007_01_55%20AM.png', imgCover: true },
]

export default function SellRentSheet({ open, onClose, onOpenRentalListing, onOpenRentalSell, onJoinSellRent }) {
  useEffect(() => {
    if (document.getElementById('sellrent-styles')) return
    const el = document.createElement('style')
    el.id = 'sellrent-styles'
    el.textContent = `
      @keyframes hintLeft { 0% { background: #6ba32e; outline: 2px solid transparent; } 20% { background: #8DC63F; box-shadow: 0 0 20px rgba(250,204,21,0.6); outline: 2px solid #FACC15; outline-offset: 2px; } 40% { background: #6ba32e; box-shadow: none; outline: 2px solid transparent; } 100% { background: #6ba32e; outline: 2px solid transparent; } }
      @keyframes hintRight { 0%, 40% { background: #6ba32e; outline: 2px solid transparent; } 60% { background: #8DC63F; box-shadow: 0 0 20px rgba(250,204,21,0.6); outline: 2px solid #FACC15; outline-offset: 2px; } 80% { background: #6ba32e; box-shadow: none; outline: 2px solid transparent; } 100% { background: #6ba32e; outline: 2px solid transparent; } }
    `
    document.head.appendChild(el)
  }, [])

  if (!open) return null

  const handleSelect = (cat, mode) => {
    if (mode === 'sell') onOpenRentalSell?.(cat.id)
    else onOpenRentalListing?.(cat.id)
  }

  const renderCard = (cat, idx) => (
    <div key={cat.id} style={{ display: 'flex', width: '100%', borderRadius: 20, overflow: 'hidden', height: 110 }}>
      {/* Left — BUY */}
      <button
        onClick={() => handleSelect(cat, 'sell')}
        style={{ width: '25%', background: '#6ba32e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 6px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#fff', animation: idx === 0 ? 'hintLeft 4s ease-in-out infinite' : 'none' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>BUY</span>
      </button>

      {/* Center — label top, image, desc bottom */}
      <div style={{ flex: 1, position: 'relative', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', padding: '10px 10px 8px' }}>
        <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', zIndex: 1 }}>{cat.label}</span>
        {cat.centerImg && (
          <img src={cat.centerImg} alt={cat.label} style={{ flex: 1, width: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))' }} />
        )}
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, zIndex: 1 }}>{cat.desc}</span>
      </div>

      {/* Right — RENT */}
      <button
        onClick={() => handleSelect(cat, 'rent')}
        style={{ width: '25%', background: '#6ba32e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 6px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#fff', animation: idx === 0 ? 'hintRight 4s ease-in-out infinite' : 'none' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
        <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>RENT</span>
      </button>
    </div>
  )

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9500, background: '#080808 url("https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2007_06_22%20AM.png") center top / cover no-repeat', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: '16px 18px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: 0.04, textShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>
            SELL <span style={{ color: '#8DC63F' }}>/ RENT</span>
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', fontWeight: 600 }}>Choose a category to start listing</p>
        </div>
        <button
          onClick={() => onJoinSellRent?.()}
          style={{ padding: '8px 14px', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, boxShadow: '0 2px 10px rgba(141,198,63,0.3)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Join Sell/Rent
        </button>
      </div>

      {/* Category cards */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 16px 100px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CATEGORIES.map((cat, idx) => renderCard(cat, idx))}
        </div>
      </div>

      <IndooFooter label="Sell / Rent" onHome={onClose} />
    </div>,
    document.body
  )
}
