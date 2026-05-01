/**
 * UniversalBusinessProfile — One profile for every module.
 * Shows business info, active modules, all listings, reviews, Visit Us ride buttons.
 * Used by: Property agents, rental owners, marketplace sellers, restaurant owners, etc.
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useGeolocation } from '@/hooks/useGeolocation'
import { calculateDirectoryPrice, fmtIDR } from '@/services/directoryService'
import IndooFooter from '@/components/ui/IndooFooter'

const glass = {
  background: 'rgba(0,0,0,0.7)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
}

const MODULE_BADGES = {
  property: { icon: '🏠', label: 'Property', color: '#8DC63F' },
  cars: { icon: '🚗', label: 'Cars', color: '#60A5FA' },
  motorcycles: { icon: '🏍️', label: 'Bikes', color: '#F59E0B' },
  trucks: { icon: '🚛', label: 'Trucks', color: '#F97316' },
  audio: { icon: '🔊', label: 'Audio', color: '#A855F7' },
  event: { icon: '🎪', label: 'Events', color: '#EC4899' },
  fashion: { icon: '👗', label: 'Fashion', color: '#E1306C' },
  marketplace: { icon: '🛍️', label: 'Market', color: '#FACC15' },
  restaurant: { icon: '🍽️', label: 'Food', color: '#EF4444' },
  massage: { icon: '💆', label: 'Massage', color: '#8B5CF6' },
  places: { icon: '📍', label: 'Places', color: '#8DC63F' },
}

function fmtK(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}jt`
  if (v >= 1e3) return `${Math.round(v / 1e3)}k`
  return String(v)
}

export default function UniversalBusinessProfile({ open, onClose, profile, listings = [], onChat, onBookRide }) {
  const { coords } = useGeolocation()
  const [activeTab, setActiveTab] = useState('listings')

  if (!open || !profile) return null

  const name = profile.businessName || profile.name || profile.brand || 'Business'
  const ownerName = profile.ownerName || profile.owner || ''
  const photo = profile.image || profile.photoURL || profile.avatar || ''
  const bio = profile.bio || profile.description || ''
  const city = profile.city || profile.location || ''
  const rating = profile.rating || profile.rating_avg || 0
  const reviewCount = profile.reviewCount || profile.rating_count || 0
  const verified = profile.verified || profile.tier === 'premium'
  const ownerType = profile.ownerType || profile.owner_type || 'owner'
  const whatsapp = profile.whatsapp || ''
  const instagram = profile.instagram || ''
  const facebook = profile.facebook || ''
  const tiktok = profile.tiktok || ''
  const primarySocial = profile.primarySocial || profile.primary_social || 'instagram'
  const discountPct = profile.discount_pct || profile.discount || 0
  const isPremium = profile.tier === 'premium'

  // Detect active modules from listings
  const activeModules = [...new Set(listings.map(l => {
    const cat = (l.category || '').toLowerCase()
    if (cat.includes('property')) return 'property'
    if (cat.includes('car')) return 'cars'
    if (cat.includes('motorcycle') || cat.includes('bike')) return 'motorcycles'
    if (cat.includes('truck')) return 'trucks'
    if (cat.includes('audio') || cat.includes('sound')) return 'audio'
    if (cat.includes('event') || cat.includes('party')) return 'event'
    if (cat.includes('fashion') || cat.includes('wedding')) return 'fashion'
    return 'marketplace'
  }))]
  if (profile.placesListing) activeModules.push('places')

  // Visit Us pricing
  const hasVisitUs = isPremium && coords && profile.lat && profile.lng
  const visitPricing = hasVisitUs ? calculateDirectoryPrice({ distanceKm: Math.round(Math.sqrt(Math.pow((coords.lat - profile.lat) * 111, 2) + Math.pow((coords.lng - profile.lng) * 111 * Math.cos(coords.lat * Math.PI / 180), 2)) * 10) / 10 }) : null

  // Social link
  const socialLink = primarySocial === 'instagram' && instagram ? `https://instagram.com/${instagram}`
    : primarySocial === 'facebook' && facebook ? `https://facebook.com/${facebook}`
    : primarySocial === 'tiktok' && tiktok ? `https://tiktok.com/@${tiktok}` : null
  const socialIcon = primarySocial === 'instagram' ? '📸' : primarySocial === 'facebook' ? '📘' : '🎵'
  const socialLabel = primarySocial === 'instagram' ? instagram : primarySocial === 'facebook' ? facebook : tiktok

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9500, background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Hero */}
      <div style={{ position: 'relative', height: 220, flexShrink: 0, overflow: 'hidden' }}>
        {photo ? (
          <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(141,198,63,0.2), rgba(0,0,0,0.8))' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.9))' }} />

        {/* Badges on hero */}
        <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 6 }}>
          {verified && (
            <div style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', color: '#60A5FA', fontSize: 11, fontWeight: 800 }}>✓ Verified</div>
          )}
          {isPremium && (
            <div style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.3)', color: '#FACC15', fontSize: 11, fontWeight: 800 }}>⭐ Premium</div>
          )}
          <div style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 800 }}>
            {ownerType === 'agent' ? '🏢 Agent' : '👤 Owner'}
          </div>
        </div>

        {/* Name on hero */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)', marginBottom: 2 }}>{name}</div>
          {ownerName && ownerName !== name && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>by {ownerName}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            {city && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 3 }}>📍 {city}</span>}
            {rating > 0 && <span style={{ fontSize: 12, color: '#FACC15', fontWeight: 800 }}>⭐ {rating} ({reviewCount})</span>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 100px' }}>

        {/* Active Modules */}
        {activeModules.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {activeModules.map(m => {
              const badge = MODULE_BADGES[m]
              if (!badge) return null
              return (
                <div key={m} style={{ padding: '5px 12px', borderRadius: 10, background: `${badge.color}15`, border: `1px solid ${badge.color}40`, color: badge.color, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {badge.icon} {badge.label}
                </div>
              )
            })}
          </div>
        )}

        {/* Discount */}
        {discountPct > 0 && (
          <div style={{ ...glass, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)' }}>
            <span style={{ fontSize: 22 }}>🏷️</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#FACC15' }}>Show on arrival — {discountPct}% OFF</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Present your Indoo app at this business for a discount</div>
            </div>
          </div>
        )}

        {/* Visit Us Ride Buttons (Premium only) */}
        {visitPricing && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button onClick={() => onBookRide?.({ name, lat: profile.lat, lng: profile.lng, distanceKm: visitPricing.oneWayKm }, 'bike_ride')} style={{
              flex: 1, padding: '10px 12px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
              color: '#000', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(141,198,63,0.3)',
            }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 900 }}>Visit Us</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{fmtIDR(visitPricing.bike)}</div>
              </div>
              <span style={{ fontSize: 20 }}>🏍️</span>
            </button>
            <button onClick={() => onBookRide?.({ name, lat: profile.lat, lng: profile.lng, distanceKm: visitPricing.oneWayKm }, 'car_taxi')} style={{
              flex: 1, padding: '10px 12px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
              color: '#000', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(141,198,63,0.3)',
            }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 900 }}>Visit Us</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{fmtIDR(visitPricing.car)}</div>
              </div>
              <span style={{ fontSize: 20 }}>🚗</span>
            </button>
          </div>
        )}

        {/* Bio */}
        {bio && (
          <div style={{ ...glass, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{bio}</div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {onChat && (
            <button onClick={() => onChat(profile)} style={{
              flex: 1, padding: '13px 0', borderRadius: 14,
              background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>💬 Chat</button>
          )}
          {socialLink && (
            <a href={socialLink} target="_blank" rel="noopener noreferrer" style={{
              flex: 1, padding: '13px 0', borderRadius: 14, textDecoration: 'none',
              background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: 14, fontWeight: 800, textAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>{socialIcon} {socialLabel}</a>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { id: 'listings', label: `Listings (${listings.length})` },
            { id: 'reviews', label: `Reviews (${reviewCount})` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: 'transparent', color: activeTab === tab.id ? '#8DC63F' : 'rgba(255,255,255,0.35)',
              fontSize: 13, fontWeight: 800, position: 'relative',
            }}>
              {tab.label}
              {activeTab === tab.id && <div style={{ position: 'absolute', bottom: 0, left: '25%', right: '25%', height: 2, borderRadius: 1, background: '#8DC63F' }} />}
            </button>
          ))}
        </div>

        {/* Listings */}
        {activeTab === 'listings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {listings.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No active listings</div>}
            {listings.map((l, i) => {
              const img = l.images?.[0] || l.image || ''
              const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day || 0
              const priceLabel = l.buy_now ? 'Sale' : l.price_month ? '/mo' : l.price_day ? '/day' : ''
              return (
                <div key={l.id || i} style={{ ...glass, padding: 0, overflow: 'hidden', display: 'flex', gap: 0 }}>
                  <div style={{ width: 90, height: 80, flexShrink: 0, overflow: 'hidden' }}>
                    {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.03)' }} />}
                  </div>
                  <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{l.sub_category || l.category}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#FACC15' }}>Rp {fmtK(price)} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{priceLabel}</span></div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Reviews placeholder */}
        {activeTab === 'reviews' && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{reviewCount > 0 ? `${reviewCount} reviews · ${rating} avg` : 'No reviews yet'}</div>
          </div>
        )}
      </div>

      <IndooFooter label="Profile" onBack={onClose} onHome={onClose} />
    </div>,
    document.body
  )
}
