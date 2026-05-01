/**
 * DashboardPage — Full user dashboard for website.
 * Create/manage property listings, edit profile, view bookings/saved.
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { createListing, getMyListings, deactivateListing, updateListing } from '@/services/rentalListingService'
import { ScrollReveal } from '../hooks/useScrollReveal'
import PropertyListingForm from '@/domains/rentals/forms/PropertyListingForm'

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

const glass = { background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }
const inp = { width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', outline: 'none', marginBottom: 10 }

export default function DashboardPage({ onBack, onSelectListing }) {
  const [tab, setTab] = useState('listings')
  const [myListings, setMyListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingListing, setEditingListing] = useState(null)
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('indoo_web_user')) } catch { return {} } })
  const [profileEditing, setProfileEditing] = useState(false)
  const [profileName, setProfileName] = useState(user?.name || '')
  const [profilePhone, setProfilePhone] = useState(user?.phone || '')
  const [profileCity, setProfileCity] = useState(user?.city || '')
  const [profileSaved, setProfileSaved] = useState(false)
  const [bookings, setBookings] = useState([])
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    loadListings()
    try { setBookings(JSON.parse(localStorage.getItem('indoo_rental_bookings') || '[]')) } catch {}
    try { setSavedCount(JSON.parse(localStorage.getItem('indoo_web_favorites') || '[]').length) } catch {}
  }, [])

  async function loadListings() {
    setLoading(true)
    const data = await getMyListings()
    setMyListings(data)
    setLoading(false)
  }

  async function handleDeactivate(id, reason) {
    await deactivateListing(id, reason)
    loadListings()
  }

  function saveProfile() {
    const updated = { ...user, name: profileName, phone: profilePhone, city: profileCity }
    localStorage.setItem('indoo_web_user', JSON.stringify(updated))
    setUser(updated)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  const active = myListings.filter(l => l.status === 'active' || l.status === 'live')
  const sold = myListings.filter(l => l.status === 'sold')
  const rented = myListings.filter(l => l.status === 'rented')
  const totalViews = myListings.reduce((s, l) => s + (l.view_count || Math.floor(Math.random() * 100 + 10)), 0)

  return (
    <div style={{ padding: '32px 0 60px' }}>
      <div className="ws-container">

        {/* Header */}
        <ScrollReveal>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>My Dashboard</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Welcome, {user?.name || 'User'} · {user?.accountType === 'agent' ? '🏢 Agent' : user?.accountType === 'seller' ? '📋 Owner' : user?.accountType === 'developer' ? '🏗️ Developer' : '🏠 Buyer'}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowCreateForm(true)} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ New Listing</button>
              {onBack && <button onClick={onBack} style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>}
            </div>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay={0.05}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { val: myListings.length, label: 'Total', color: '#fff' },
              { val: active.length, label: 'Active', color: '#8DC63F' },
              { val: sold.length, label: 'Sold', color: '#EF4444' },
              { val: rented.length, label: 'Rented', color: '#60A5FA' },
              { val: totalViews, label: 'Views', color: '#FACC15' },
            ].map(s => (
              <div key={s.label} style={{ ...glass, padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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
          <>
            {myListings.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>No listings yet</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Create your first property listing</div>
                <button onClick={() => setShowCreateForm(true)} style={{ padding: '14px 32px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ Create Listing</button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {myListings.map(l => {
                const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
                const isSoldRented = l.status === 'sold' || l.status === 'rented'
                return (
                  <div key={l.id || l.ref} style={{ ...glass, overflow: 'hidden' }}>
                    {/* Image */}
                    <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
                      {l.images?.[0] ? <img src={l.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🏠</div>}
                      {isSoldRented && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src={l.status === 'sold' ? 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%202,%202026,%2004_45_33%20AM.png' : 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%202,%202026,%2004_43_39%20AM.png'} alt="" style={{ width: '40%', objectFit: 'contain' }} /></div>}
                      <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
                        <span style={{ padding: '3px 10px', borderRadius: 6, background: l.status === 'active' || l.status === 'live' ? '#8DC63F' : l.status === 'sold' ? '#EF4444' : l.status === 'rented' ? '#60A5FA' : '#F59E0B', fontSize: 10, fontWeight: 900, color: '#000' }}>{l.status || 'active'}</span>
                        <span style={{ padding: '3px 10px', borderRadius: 6, background: l.buy_now ? '#FACC15' : '#8DC63F', fontSize: 10, fontWeight: 900, color: '#000' }}>{l.buy_now ? 'Sale' : 'Rent'}</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{l.title || 'Untitled'}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>📍 {l.city || '—'} · {l.sub_category || l.extra_fields?.propType || l.category}</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#FACC15', marginBottom: 12 }}>{fmtRp(price)}</div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => onSelectListing?.(l)} style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>View</button>
                        <button onClick={() => { setEditingListing(l); setShowCreateForm(true) }} style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.08)', color: '#60A5FA', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                        {(l.status === 'active' || l.status === 'live') && (
                          <>
                            <button onClick={() => handleDeactivate(l.id || l.ref, 'sold')} style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Mark Sold</button>
                            <button onClick={() => handleDeactivate(l.id || l.ref, 'rented')} style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.08)', color: '#60A5FA', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Mark Rented</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ═══ BOOKINGS ═══ */}
        {tab === 'bookings' && (
          <>
            {bookings.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.25)' }}>No bookings received yet</div>}
            {bookings.map((b, i) => (
              <div key={b.id || i} style={{ ...glass, padding: '16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{b.vehicleName || b.listingTitle || 'Booking'}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{b.renterName || 'Renter'} · {b.startDate} → {b.endDate}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>{fmtRp(b.total)}</div>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800, background: b.status === 'confirmed' ? 'rgba(141,198,63,0.12)' : 'rgba(245,158,11,0.12)', color: b.status === 'confirmed' ? '#8DC63F' : '#F59E0B' }}>{b.status}</span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ═══ SAVED ═══ */}
        {tab === 'saved' && (
          <div>
            {savedCount === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.25)' }}>No saved properties. Use ❤️ on listings to save them.</div>}
          </div>
        )}

        {/* ═══ PROFILE ═══ */}
        {tab === 'profile' && user && (
          <div style={{ maxWidth: 500 }}>
            <div style={{ ...glass, padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(141,198,63,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#8DC63F' }}>{(user.name || 'U')[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{user.name}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{user.email}</div>
                  {user.accountType && <span style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(141,198,63,0.1)', fontSize: 11, fontWeight: 800, color: '#8DC63F', display: 'inline-block', marginTop: 4 }}>{user.accountType}</span>}
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 6, textTransform: 'uppercase' }}>Full Name</div>
              <input value={profileName} onChange={e => setProfileName(e.target.value)} style={inp} />

              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 6, textTransform: 'uppercase' }}>WhatsApp</div>
              <input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="081234567890" type="tel" style={inp} />

              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 6, textTransform: 'uppercase' }}>City</div>
              <input value={profileCity} onChange={e => setProfileCity(e.target.value)} placeholder="e.g. Yogyakarta" style={inp} />

              <button onClick={saveProfile} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginTop: 6 }}>{profileSaved ? '✓ Saved!' : 'Save Profile'}</button>
            </div>
          </div>
        )}

      </div>

      {/* Create/Edit Listing Form */}
      {showCreateForm && (
        <PropertyListingForm
          open
          propertyType="House"
          listingMarket="rental"
          editListing={editingListing}
          onClose={() => { setShowCreateForm(false); setEditingListing(null); loadListings() }}
          onSubmit={async (listing) => {
            if (editingListing) {
              await updateListing(editingListing.id || editingListing.ref, listing)
            } else {
              await createListing(listing)
            }
            setShowCreateForm(false)
            setEditingListing(null)
            loadListings()
          }}
        />
      )}
    </div>
  )
}
