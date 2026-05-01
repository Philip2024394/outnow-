/**
 * PropertyDetailPage — Desktop 2-panel property detail.
 * Gallery left, details right. Integrates existing app components.
 */
import { useState, useRef, useEffect } from 'react'
import { usePropertyListings } from '../hooks/usePropertyListings'
import KPRCalculator from '@/components/property/KPRCalculator'
import PriceHistoryChart from '@/components/property/PriceHistoryChart'
import PropertyValuation from '@/components/property/PropertyValuation'
import ComparableSales from '@/components/property/ComparableSales'
import NeighborhoodGuide from '@/components/property/NeighborhoodGuide'
import TransportProximity from '@/components/property/TransportProximity'
import { ScrollReveal } from '../hooks/useScrollReveal'
import FavoriteButton from '../components/FavoriteButton'
import ShareButtons from '../components/ShareButtons'

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

const glass = { background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }

const DETAIL_ICONS = {
  Certificate: '📜', Furnished: '🛋️', Facing: '🧭', Floors: '🏢', 'Year Built': '📅',
  Electricity: '⚡', Water: '💧', Parking: '🅿️', Pool: '🏊',
}

export default function PropertyDetailPage({ listing, onBack, onSelectListing }) {
  const [activeImg, setActiveImg] = useState(0)
  const [showKPR, setShowKPR] = useState(false)
  const { listings: allListings } = usePropertyListings()

  if (!listing) return null

  const images = listing.images?.length ? listing.images : [listing.image || '']
  const ef = listing.extra_fields || {}
  const price = listing.buy_now ? (typeof listing.buy_now === 'object' ? listing.buy_now.price : listing.buy_now) : listing.price_month || listing.price_day || listing.price_year
  const priceLabel = listing.buy_now ? 'For Sale' : listing.price_month ? '/ month' : listing.price_day ? '/ day' : listing.price_year ? '/ year' : ''
  const isProperty = true
  const phone = ef.whatsapp || listing.whatsapp || '081234567890'

  // Similar listings from Supabase/demo
  const similar = allListings.filter(l => l.id !== listing.id && (l.city === listing.city || l.sub_category === listing.sub_category)).slice(0, 6)

  // Detail rows
  const details = [
    ef.certificate && ['Certificate', ef.certificate],
    ef.furnished && ['Furnished', ef.furnished],
    (ef.facing || ef.facingDirection) && ['Facing', ef.facing || ef.facingDirection],
    (ef.floors || ef.numFloors) && ['Floors', ef.floors || ef.numFloors],
    (ef.yearBuilt || ef.year_built) && ['Year Built', ef.yearBuilt || ef.year_built],
    ef.electricityCapacity && ['Electricity', ef.electricityCapacity],
    ef.waterType && ['Water', ef.waterType],
    ef.parking && ['Parking', `${ef.parking} spots`],
    ef.pool && ['Pool', 'Yes'],
    ef.zoning && ['Zoning', ef.zoning],
  ].filter(Array.isArray)

  // Rental periods
  const periods = []
  if (!listing.buy_now) {
    if (listing.price_day) periods.push({ label: 'Day', price: listing.price_day })
    if (listing.price_week) periods.push({ label: 'Week', price: listing.price_week })
    if (listing.price_month) periods.push({ label: 'Month', price: listing.price_month })
    if (listing.price_year) periods.push({ label: 'Year', price: listing.price_year })
  }

  return (
    <div style={{ padding: '24px 0 60px' }}>
      {/* Breadcrumb */}
      <div className="ws-container" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#8DC63F', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, padding: 0 }}>← Properties</button>
          <span>›</span>
          <span>{listing.buy_now ? 'For Sale' : 'For Rent'}</span>
          <span>›</span>
          <span>{listing.sub_category}</span>
          <span>›</span>
          <span style={{ color: '#fff' }}>{listing.title}</span>
        </div>
      </div>

      {/* ═══ SECTION 1: Gallery + Info ═══ */}
      <div className="ws-container" style={{ display: 'flex', gap: 28, marginBottom: 32 }}>
        {/* Left — Gallery */}
        <ScrollReveal style={{ width: '55%' }}>
          <div style={{ ...glass, overflow: 'hidden' }}>
            <div style={{ height: 420, overflow: 'hidden', position: 'relative' }}>
              <img src={images[activeImg]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }} />
              <div style={{ position: 'absolute', top: 14, left: 14, padding: '6px 16px', borderRadius: 10, background: listing.buy_now ? '#FACC15' : '#8DC63F', fontSize: 13, fontWeight: 900, color: '#000' }}>{listing.buy_now ? 'FOR SALE' : 'FOR RENT'}</div>
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, padding: '12px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} style={{ width: 72, height: 52, borderRadius: 10, overflow: 'hidden', border: activeImg === i ? '2.5px solid #8DC63F' : '1.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: 0, flexShrink: 0, opacity: activeImg === i ? 1 : 0.6 }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Right — Info */}
        <ScrollReveal delay={0.1} style={{ width: '45%' }}>
          <div style={{ ...glass, padding: '28px 24px' }}>
            {/* Badges + Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', fontSize: 11, fontWeight: 800, color: '#60A5FA' }}>✓ Verified</span>
                <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>{listing.sub_category}</span>
                {listing.owner_type === 'agent' && <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(96,165,250,0.08)', fontSize: 11, fontWeight: 800, color: '#60A5FA' }}>🏢 Agent</span>}
              </div>
              <FavoriteButton listingId={listing.id} size="md" />
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 6px', lineHeight: 1.2 }}>{listing.title}</h1>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>📍 {listing.address || listing.city}</div>

            {/* Price */}
            <div style={{ fontSize: 36, fontWeight: 900, color: '#FACC15', marginBottom: 4 }}>{fmtRp(price)}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>{priceLabel}{ef.land_area ? ` · ${fmtRp(Math.round(Number(String(price).replace(/\./g, '')) / parseInt(String(ef.land_area).replace(/[^\d]/g, ''), 10) || 1))}/m²` : ''}</div>
            <div style={{ marginBottom: 20 }}><ShareButtons title={listing.title} price={fmtRp(price)} /></div>

            {/* Specs grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {[
                ef.bedrooms && { icon: '🛏️', val: ef.bedrooms, label: 'Beds' },
                ef.bathrooms && { icon: '🚿', val: ef.bathrooms, label: 'Bath' },
                ef.land_area && { icon: '📐', val: ef.land_area, label: 'Land' },
                ef.building_area && { icon: '🏗️', val: ef.building_area, label: 'Building' },
                ef.certificate && { icon: '📜', val: ef.certificate, label: 'Cert' },
                ef.furnished && { icon: '🛋️', val: ef.furnished, label: 'Furnished' },
              ].filter(Boolean).map(s => (
                <div key={s.label} style={{ padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
                  <div style={{ fontSize: 16 }}>{s.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginTop: 2 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <a href={`https://wa.me/${phone.replace(/^0/, '62')}?text=${encodeURIComponent(`Halo, saya tertarik dengan ${listing.title}`)}`} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: 14, textDecoration: 'none',
              background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#fff', fontSize: 15, fontWeight: 900, marginBottom: 10,
            }}>💬 Chat via WhatsApp</a>

            {listing.buy_now && (
              <button onClick={() => setShowKPR(true)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #FACC15, #F59E0B)', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🏦 KPR Calculator</button>
            )}
          </div>
        </ScrollReveal>
      </div>

      {/* ═══ SECTION 2: Description + Details ═══ */}
      <div className="ws-container" style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        <ScrollReveal style={{ flex: 1 }}>
          <div style={{ ...glass, padding: '24px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 14px' }}>Description</h3>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{listing.description || 'No description available.'}</div>
            {listing.features?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Features</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {listing.features.map(f => <span key={f} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 12, fontWeight: 700, color: '#8DC63F' }}>{f}</span>)}
                </div>
              </div>
            )}
            {periods.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                {periods.map(p => (
                  <div key={p.label} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.12)', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{p.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#FACC15', marginTop: 4 }}>{fmtRp(p.price)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.1} style={{ width: 340, flexShrink: 0 }}>
          <div style={{ ...glass, padding: '20px', overflow: 'hidden' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>Property Details</h3>
            {details.map(([label, value], i) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < details.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>{DETAIL_ICONS[label] || '•'} {label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{value}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>

      {/* ═══ SECTION 3: Analytics ═══ */}
      {listing.buy_now && (
        <div className="ws-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
          <ScrollReveal><div style={{ ...glass, padding: 20 }}><PriceHistoryChart listing={listing} /></div></ScrollReveal>
          <ScrollReveal delay={0.1}><div style={{ ...glass, padding: 20 }}><PropertyValuation listing={listing} /></div></ScrollReveal>
          <ScrollReveal delay={0.2}><div style={{ ...glass, padding: 20 }}><ComparableSales listing={listing} /></div></ScrollReveal>
        </div>
      )}

      {/* ═══ SECTION 4: Location ═══ */}
      <div className="ws-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
        <ScrollReveal><div style={{ ...glass, padding: 20 }}><NeighborhoodGuide listing={listing} /></div></ScrollReveal>
        <ScrollReveal delay={0.1}><div style={{ ...glass, padding: 20 }}><TransportProximity listing={listing} /></div></ScrollReveal>
      </div>

      {/* ═══ SECTION 5: Similar ═══ */}
      {similar.length > 0 && (
        <div className="ws-container" style={{ marginBottom: 32 }}>
          <ScrollReveal>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>Similar Properties</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {similar.map(l => {
                const p = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
                return (
                  <div key={l.id} className="ws-card" onClick={() => { onSelectListing?.(l); window.scrollTo(0, 0) }} style={{ borderRadius: 14, overflow: 'hidden', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ height: 140, overflow: 'hidden' }}><img src={l.images?.[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /></div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>📍 {l.city}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#FACC15', marginTop: 4 }}>{fmtRp(p)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollReveal>
        </div>
      )}

      {/* KPR overlay */}
      {showKPR && <KPRCalculator open onClose={() => setShowKPR(false)} propertyPrice={price ? Number(String(price).replace(/\./g, '')) : 500000000} />}
    </div>
  )
}
