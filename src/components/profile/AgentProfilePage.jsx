/**
 * AgentProfilePage — Professional agent profile for property sellers.
 * Shows agent photo, bio, credentials, up to 10 active listings with price + location.
 * Premium design matching high-end property portal standard.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import IndooFooter from '@/components/ui/IndooFooter'

const glass = { background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

export default function AgentProfilePage({ open, onClose, agent, listings = [], onSelectListing, onChat }) {
  const [activeTab, setActiveTab] = useState('listings')

  if (!open || !agent) return null

  const name = agent.name || agent.businessName || agent.ownerName || 'Agent'
  const photo = agent.photo || agent.image || agent.photoURL || agent.avatar || ''
  const bio = agent.bio || agent.description || ''
  const city = agent.city || agent.location || ''
  const phone = agent.whatsapp || agent.phone || ''
  const email = agent.email || ''
  const instagram = agent.instagram || ''
  const experience = agent.experience || agent.yearEstablished ? `Since ${agent.yearEstablished}` : ''
  const companyName = agent.company || agent.companyName || ''
  const ownerType = agent.ownerType || agent.owner_type || 'agent'
  const isVerified = agent.verified || agent.tier === 'premium'
  const rating = agent.rating || 0
  const reviewCount = agent.reviewCount || agent.review_count || 0
  const totalSold = agent.totalSold || agent.soldCount || 0
  const totalListings = listings.length

  // Show up to 10 active listings
  const activeListings = listings.filter(l => l.status !== 'sold' && l.status !== 'rented').slice(0, 10)
  const soldListings = listings.filter(l => l.status === 'sold' || l.status === 'rented')

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9500, background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ═══ Hero Section ═══ */}
      <div style={{ flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        {/* Background gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(141,198,63,0.15) 0%, rgba(0,0,0,0.9) 60%, #0a0a0a 100%)' }} />

        <div style={{ position: 'relative', padding: '20px 16px 16px' }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            {/* Photo */}
            <div style={{ width: 80, height: 80, borderRadius: 20, overflow: 'hidden', flexShrink: 0, border: '2.5px solid rgba(141,198,63,0.4)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              {photo ? (
                <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'rgba(141,198,63,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>👤</div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>{name}</h1>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                {isVerified && <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', fontSize: 10, fontWeight: 800, color: '#60A5FA' }}>✓ Verified</span>}
                <span style={{ padding: '2px 8px', borderRadius: 6, background: ownerType === 'agent' ? 'rgba(96,165,250,0.1)' : 'rgba(141,198,63,0.1)', border: `1px solid ${ownerType === 'agent' ? 'rgba(96,165,250,0.2)' : 'rgba(141,198,63,0.2)'}`, fontSize: 10, fontWeight: 800, color: ownerType === 'agent' ? '#60A5FA' : '#8DC63F' }}>{ownerType === 'agent' ? '🏢 Agent' : '👤 Owner'}</span>
              </div>
              {companyName && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{companyName}</div>}
              {city && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}>📍 {city}{experience ? ` · ${experience}` : ''}</div>}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FACC15' }}>{totalListings}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase' }}>Listings</div>
            </div>
            <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#8DC63F' }}>{totalSold || soldListings.length}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase' }}>Sold</div>
            </div>
            <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#60A5FA' }}>{rating > 0 ? `${rating}⭐` : '—'}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase' }}>{reviewCount} Reviews</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Body ═══ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px' }}>

        {/* Bio */}
        {bio && (
          <div style={{ ...glass, padding: '14px 16px', marginTop: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{bio}</div>
          </div>
        )}

        {/* Contact buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {phone && (
            <a href={`https://wa.me/${phone.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" style={{
              flex: 1, padding: '13px 0', borderRadius: 14, textDecoration: 'none',
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              color: '#fff', fontSize: 14, fontWeight: 900, textAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
            }}>💬 WhatsApp</a>
          )}
          {onChat && (
            <button onClick={() => onChat(agent)} style={{
              flex: 1, padding: '13px 0', borderRadius: 14,
              background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>💬 Chat</button>
          )}
          {instagram && (
            <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" style={{
              width: 50, height: 50, borderRadius: 14, textDecoration: 'none', flexShrink: 0,
              background: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 20 }}>📸</span>
            </a>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { id: 'listings', label: `Active (${activeListings.length})` },
            { id: 'sold', label: `Sold (${soldListings.length})` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: 'transparent', color: activeTab === tab.id ? '#8DC63F' : 'rgba(255,255,255,0.3)',
              fontSize: 13, fontWeight: 800, position: 'relative',
            }}>
              {tab.label}
              {activeTab === tab.id && <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, borderRadius: 1, background: '#8DC63F' }} />}
            </button>
          ))}
        </div>

        {/* Active Listings */}
        {activeTab === 'listings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeListings.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No active listings</div>}
            {activeListings.map((l, i) => {
              const img = l.images?.[0] || l.image || ''
              const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day || 0
              const priceLabel = l.buy_now ? 'Sale' : l.price_month ? '/mo' : l.price_day ? '/day' : ''
              const subCat = l.sub_category || l.extra_fields?.property_type || l.category || ''

              return (
                <button key={l.id || i} onClick={() => onSelectListing?.(l)} style={{
                  width: '100%', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'left', padding: 0, background: 'none',
                }}>
                  <div style={{ ...glass, overflow: 'hidden', display: 'flex' }}>
                    {/* Image */}
                    <div style={{ width: 110, height: 100, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                      {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏠</div>}
                      {l.buy_now && <div style={{ position: 'absolute', top: 6, left: 6, padding: '2px 8px', borderRadius: 6, background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.3)', fontSize: 9, fontWeight: 800, color: '#FACC15' }}>SALE</div>}
                      {!l.buy_now && <div style={{ position: 'absolute', top: 6, left: 6, padding: '2px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)', fontSize: 9, fontWeight: 800, color: '#8DC63F' }}>RENT</div>}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        📍 {l.city || '—'} · {subCat}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>{fmtRp(price)}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{priceLabel}</span>
                      </div>
                      {l.extra_fields?.land_area && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>📐 {l.extra_fields.land_area}{l.extra_fields?.bedrooms ? ` · ${l.extra_fields.bedrooms}BR` : ''}</div>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Sold Listings */}
        {activeTab === 'sold' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {soldListings.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No sold/rented properties yet</div>}
            {soldListings.map((l, i) => (
              <div key={l.id || i} style={{ ...glass, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, opacity: 0.6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.status === 'sold' ? '#EF4444' : '#60A5FA', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{l.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{l.city} · {l.status === 'sold' ? 'SOLD' : 'RENTED'}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{fmtRp(l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <IndooFooter label="Agent" onBack={onClose} onHome={onClose} />
    </div>,
    document.body
  )
}
