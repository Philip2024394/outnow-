/**
 * MarketplaceHome — Single-screen e-commerce landing
 * No scrolling. Fully responsive to all phone sizes using flex.
 */
import { useState, useEffect } from 'react'

const HERO_BANNERS = [
  { id: 1, image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800', title: 'New Arrivals', sub: 'Fresh products added daily' },
  { id: 2, image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800', title: 'Flash Sale', sub: 'Up to 40% off selected items' },
  { id: 3, image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', title: 'Indonesian Craft', sub: 'Handmade batik, jewellery & more' },
]

const TICKER_ITEMS = [
  'New: Batik collection from Solo',
  'Flash Sale: Electronics 30% off',
  'Free shipping orders over Rp 100.000',
  'Verified sellers get export badge',
  'Spice export marketplace live',
]

export default function MarketplaceHome({ onSelectCategory, onSearch, onFlashSale, onProfile, onAlerts }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeBanner, setActiveBanner] = useState(0)
  const [liveCount] = useState(Math.floor(120 + Math.random() * 80))

  useEffect(() => {
    const id = setInterval(() => setActiveBanner(i => (i + 1) % HERO_BANNERS.length), 5000)
    return () => clearInterval(id)
  }, [])

  const handleSearch = () => {
    if (searchQuery.trim()) onSearch?.(searchQuery.trim())
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Background */}
      <img src="https://ik.imagekit.io/nepgaxllc/UntitledsssaaddddddddDADSASDSDASSSsdfsdf.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.12, pointerEvents: 'none' }} />

      {/* Header — fixed size */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 10px) 16px 8px', flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 28, fontWeight: 900 }}>
            <span style={{ background: 'linear-gradient(90deg, #fff 0%, #fff 58%, #8DC63F 58%, #8DC63F 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>INDOO</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>MARKET</span>
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onAlerts} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
            <button onClick={onProfile} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', height: 44, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search products, sellers, keywords..." style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
          </div>
          <button onClick={handleSearch} style={{ width: 44, height: 44, borderRadius: 12, background: '#8DC63F', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>
      </div>

      {/* Hero banner — flex grows with screen */}
      <div style={{ flex: 2, padding: '6px 16px', position: 'relative', zIndex: 1, minHeight: 0 }}>
        <div style={{ borderRadius: 16, overflow: 'hidden', height: '100%', position: 'relative' }}>
          <img src={HERO_BANNERS[activeBanner].image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.5s' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', display: 'block', lineHeight: 1.2 }}>{HERO_BANNERS[activeBanner].title}</span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', display: 'block', marginTop: 3 }}>{HERO_BANNERS[activeBanner].sub}</span>
          </div>
          <div style={{ position: 'absolute', bottom: 8, right: 12, display: 'flex', gap: 4 }}>
            {HERO_BANNERS.map((_, i) => (
              <div key={i} onClick={() => setActiveBanner(i)} style={{ width: i === activeBanner ? 20 : 6, height: 6, borderRadius: 3, background: i === activeBanner ? '#8DC63F' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s', cursor: 'pointer' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Ticker — fixed size */}
      <div style={{ overflow: 'hidden', padding: '4px 0', flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <style>{`@keyframes marketTicker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
        <div style={{ display: 'flex', animation: 'marketTicker 30s linear infinite', whiteSpace: 'nowrap', gap: 40 }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span key={i} style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8DC63F', flexShrink: 0 }} />{t}
            </span>
          ))}
        </div>
      </div>

      {/* 4 buttons — fixed size */}
      <div style={{ padding: '6px 16px', flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { label: 'Flash', icon: '⚡', sub: 'Deals', color: '#EF4444', action: onFlashSale },
            { label: 'Auction', icon: '🔨', sub: 'Bid now', color: '#F59E0B', action: () => onSearch?.('auction') },
            { label: 'Wanted', icon: '📢', sub: 'Requests', color: '#3B82F6', action: () => onSearch?.('wanted') },
            { label: 'Used', icon: '♻️', sub: 'Pre-owned', color: '#8DC63F', action: () => onSearch?.('used') },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action} style={{
              padding: '12px 4px', borderRadius: 14, cursor: 'pointer',
              background: `linear-gradient(135deg, ${btn.color}18 0%, ${btn.color}08 100%)`,
              border: `1.5px solid ${btn.color}30`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}>
              <span style={{ fontSize: 24 }}>{btn.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{btn.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: btn.color }}>{btn.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2 banners — flex grows */}
      <div style={{ flex: 1.5, padding: '6px 16px', display: 'flex', gap: 10, position: 'relative', zIndex: 1, minHeight: 0 }}>
        {HERO_BANNERS.slice(0, 2).map((banner, i) => (
          <button key={banner.id} onClick={() => onSearch?.(i === 0 ? 'new' : 'deals')} style={{
            flex: 1, padding: 0, borderRadius: 14, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', position: 'relative',
          }}>
            <img src={banner.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 100%)' }} />
            <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block', lineHeight: 1.2 }}>{banner.title}</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', display: 'block', marginTop: 2 }}>{banner.sub}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Rentals landscape banner — flex grows */}
      <div style={{ flex: 1.2, padding: '6px 16px calc(env(safe-area-inset-bottom, 0px) + 8px)', position: 'relative', zIndex: 1, minHeight: 0 }}>
        <button onClick={() => onSearch?.('rentals')} style={{
          padding: 0, borderRadius: 14, overflow: 'hidden', width: '100%', height: '100%',
          border: '1.5px solid rgba(141,198,63,0.2)', cursor: 'pointer', display: 'flex', background: 'none',
        }}>
          <img src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400" alt="" style={{ width: '35%', height: '100%', objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ flex: 1, padding: '12px 16px', background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block' }}>Rentals & Sales</span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', display: 'block', marginTop: 3 }}>Vehicles, cameras, equipment & more</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8DC63F', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 14, color: '#8DC63F', fontWeight: 700 }}>Rent or Buy</span>
            </div>
          </div>
        </button>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  )
}
