/**
 * DashboardPage — User dashboard: my listings, bookings, analytics, profile.
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ScrollReveal } from '../hooks/useScrollReveal'
import { usePropertyListings } from '../hooks/usePropertyListings'

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

const glass = { background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }

export default function DashboardPage({ onBack, onSelectListing, onListProperty }) {
  const [tab, setTab] = useState('listings')
  const { listings: allListings } = usePropertyListings()
  const [user] = useState(() => { try { return JSON.parse(localStorage.getItem('indoo_web_user')) } catch { return null } })
  const [bookings, setBookings] = useState([])
  const [savedCount, setSavedCount] = useState(0)

  // Get user's own listings (from localStorage)
  const myListings = (() => {
    const keys = ['indoo_rental_listings_owner', 'indoo_my_property_listings']
    const all = []
    keys.forEach(key => { try { const d = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(d)) all.push(...d) } catch {} })
    return all
  })()

  const activeListings = myListings.filter(l => l.status === 'active' || l.status === 'live')
  const soldListings = myListings.filter(l => l.status === 'sold')
  const rentedListings = myListings.filter(l => l.status === 'rented')

  useEffect(() => {
    // Load bookings
    try { setBookings(JSON.parse(localStorage.getItem('indoo_rental_bookings') || '[]')) } catch {}
    // Load saved count
    try { setSavedCount(JSON.parse(localStorage.getItem('indoo_web_favorites') || '[]').length) } catch {}
  }, [])

  // Demo analytics
  const totalViews = myListings.reduce((s, l) => s + (l.view_count || Math.floor(Math.random() * 200 + 20)), 0)
  const totalInquiries = Math.round(totalViews * 0.08)

  return (
    <div style={{ padding: '32px 0 60px' }}>
      <div className="ws-container">
        {/* Header */}
        <ScrollReveal>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>My Dashboard</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Welcome back, {user?.name || 'User'}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onListProperty} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ List Property</button>
              {onBack && <button onClick={onBack} style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>}
            </div>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay={0.05}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { val: myListings.length, label: 'My Listings', color: '#fff' },
              { val: activeListings.length, label: 'Active', color: '#8DC63F' },
              { val: soldListings.length + rentedListings.length, label: 'Sold/Rented', color: '#FACC15' },
              { val: totalViews, label: 'Total Views', color: '#60A5FA' },
              { val: totalInquiries, label: 'Inquiries', color: '#A855F7' },
            ].map(s => (
              <div key={s.label} style={{ ...glass, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { id: 'listings', label: `My Listings (${myListings.length})` },
            { id: 'bookings', label: `Bookings (${bookings.length})` },
            { id: 'saved', label: `Saved (${savedCount})` },
            { id: 'profile', label: 'Profile' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '14px 24px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: 'transparent', color: tab === t.id ? '#8DC63F' : 'rgba(255,255,255,0.3)',
              fontSize: 14, fontWeight: 800, borderBottom: tab === t.id ? '2px solid #8DC63F' : '2px solid transparent',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ═══ MY LISTINGS ═══ */}
        {tab === 'listings' && (
          <div>
            {myListings.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>No listings yet</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>List your first property to start selling or renting</div>
                <button onClick={onListProperty} style={{ padding: '14px 32px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ List Property</button>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {myListings.map(l => {
                const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
                const isSoldRented = l.status === 'sold' || l.status === 'rented'
                return (
                  <div key={l.id || l.ref} style={{ ...glass, overflow: 'hidden' }}>
                    <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
                      {l.images?.[0] ? <img src={l.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🏠</div>}
                      {isSoldRented && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src={l.status === 'sold' ? 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%202,%202026,%2004_45_33%20AM.png' : 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%202,%202026,%2004_43_39%20AM.png'} alt="" style={{ width: '50%', objectFit: 'contain' }} /></div>}
                      <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 10px', borderRadius: 6, background: l.status === 'active' || l.status === 'live' ? '#8DC63F' : l.status === 'sold' ? '#EF4444' : l.status === 'rented' ? '#60A5FA' : '#F59E0B', fontSize: 10, fontWeight: 900, color: '#000' }}>{l.status || 'active'}</div>
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>📍 {l.city || '—'} · {l.sub_category || l.category}</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#FACC15', marginBottom: 10 }}>{fmtRp(price)}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => onSelectListing?.(l)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>View</button>
                        <button style={{ flex: 1, padding: '8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══ BOOKINGS ═══ */}
        {tab === 'bookings' && (
          <div>
            {bookings.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.25)' }}>No bookings yet</div>}
            {bookings.map((b, i) => (
              <div key={b.id || i} style={{ ...glass, padding: '16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{b.vehicleName || b.listingTitle || 'Booking'}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{b.startDate} → {b.endDate} · {b.days} days</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>{fmtRp(b.total)}</div>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800, background: b.status === 'confirmed' ? 'rgba(141,198,63,0.12)' : 'rgba(245,158,11,0.12)', color: b.status === 'confirmed' ? '#8DC63F' : '#F59E0B' }}>{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ SAVED ═══ */}
        {tab === 'saved' && (
          <div>
            {savedCount === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.25)' }}>No saved properties yet. Use the ❤️ button on listings to save them.</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {(() => {
                try {
                  const favIds = JSON.parse(localStorage.getItem('indoo_web_favorites') || '[]')
                  return allListings.filter(l => favIds.includes(l.id)).map(l => {
                    const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
                    return (
                      <div key={l.id} className="ws-card" onClick={() => onSelectListing?.(l)} style={{ ...glass, overflow: 'hidden', cursor: 'pointer' }}>
                        <div style={{ height: 140, overflow: 'hidden' }}><img src={l.images?.[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                        <div style={{ padding: '10px 14px' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{l.title}</div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>{fmtRp(price)}</div>
                        </div>
                      </div>
                    )
                  })
                } catch { return [] }
              })()}
            </div>
          </div>
        )}

        {/* ═══ PROFILE ═══ */}
        {tab === 'profile' && user && (
          <div style={{ maxWidth: 500 }}>
            <div style={{ ...glass, padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(141,198,63,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#8DC63F' }}>{(user.name || 'U')[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{user.name}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{user.email}</div>
                  {user.accountType && <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.1)', fontSize: 11, fontWeight: 800, color: '#8DC63F', marginTop: 4, display: 'inline-block' }}>{user.accountType}</span>}
                </div>
              </div>
              {[
                { label: 'Phone', value: user.phone || '—' },
                { label: 'City', value: user.city || '—' },
                { label: 'Account Type', value: user.accountType || 'buyer' },
                { label: 'Joined', value: user.createdAt?.split('T')[0] || '—' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
