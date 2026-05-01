/**
 * WebsiteLanding — SEO-optimized landing page for desktop web.
 * Hero, featured listings, city sections, features grid, download CTA.
 * Hidden on mobile — app uses its own LandingScreen.
 */
import { useState, useEffect } from 'react'
import { useLanguage } from '@/i18n'
import { DEMO_LISTINGS } from '@/services/rentalService'

const LOGO = 'https://ik.imagekit.io/nepgaxllc/Bold%203D%20_INDOO_%20logo%20design.png?updatedAt=1776203769926'
const HERO_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2007_44_48%20PM.png'

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

const FEATURES = [
  { icon: '🏠', title: 'Property Sales & Rentals', desc: 'Houses, villas, apartments, kos, land, ruko, gudang — all in one place' },
  { icon: '🏍️', title: 'Bike & Car Rides', desc: 'Book a ride to any property or place with live pricing and GPS tracking' },
  { icon: '📍', title: 'Discover Places', desc: '280+ destinations — restaurants, temples, beaches, nightlife. Swipe to explore' },
  { icon: '🔥', title: 'Deal Hunt', desc: 'Daily deals from sellers. Property discounts, rental specials, food offers' },
  { icon: '🏗️', title: 'New Projects', desc: 'Pre-sale villas, apartments, housing — brochures, floor plans, payment schedules' },
  { icon: '🏢', title: 'Agent Directory', desc: 'Find verified property agents. View portfolios, testimonials, book consultations' },
  { icon: '💳', title: 'KPR Calculator', desc: 'Mortgage calculator with Syariah mode, bank comparison, take-over simulator' },
  { icon: '📊', title: 'Market Data', desc: 'Price history charts, property valuations, comparable sales — first in Indonesia' },
]

const CITIES = [
  { name: 'Yogyakarta', listings: 142, image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=250&fit=crop' },
  { name: 'Bali', listings: 89, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop' },
  { name: 'Jakarta', listings: 56, image: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=400&h=250&fit=crop' },
  { name: 'Surabaya', listings: 34, image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop' },
]

const STATS = [
  { val: '282+', label: 'Places' },
  { val: '13', label: 'Property Types' },
  { val: '5', label: 'Banks in KPR' },
  { val: '40+', label: 'Business Categories' },
]

export default function WebsiteLanding({ onBrowse, onSearch }) {
  const { t } = useLanguage()
  const [searchVal, setSearchVal] = useState('')

  const propertyListings = DEMO_LISTINGS.filter(l => l.category === 'Property').slice(0, 8)

  return (
    <div className="website-landing" style={{ display: 'none', background: '#0a0a0a', minHeight: '100vh' }}>

      {/* ═══ HERO ═══ */}
      <section style={{
        position: 'relative', minHeight: '80vh', display: 'flex', alignItems: 'center',
        background: `#0a0a0a url("${HERO_BG}") center/cover no-repeat`,
        padding: '80px 48px',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.4))' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700 }}>
          <h1 style={{ fontSize: 56, fontWeight: 900, color: '#fff', margin: '0 0 16px', lineHeight: 1.1 }}>
            Indonesia's <span style={{ color: '#8DC63F' }}>Super App</span> for Property, Rides & Places
          </h1>
          <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)', margin: '0 0 32px', lineHeight: 1.6, maxWidth: 550 }}>
            Buy, sell, rent property. Book bike & car rides. Discover 282+ destinations. All in one app — built for Indonesia.
          </p>

          {/* Search bar */}
          <div style={{ display: 'flex', gap: 0, maxWidth: 560, marginBottom: 24 }}>
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSearch?.(searchVal)}
              placeholder="Search properties, villas, apartments, kos..."
              style={{ flex: 1, padding: '16px 20px', borderRadius: '14px 0 0 14px', border: '2px solid rgba(141,198,63,0.3)', borderRight: 'none', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 16, fontFamily: 'inherit', outline: 'none' }}
            />
            <button onClick={() => onSearch?.(searchVal)} style={{
              padding: '16px 28px', borderRadius: '0 14px 14px 0', border: 'none',
              background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
              color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
            }}>Search</button>
          </div>

          {/* Quick links */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {['Villa', 'House', 'Apartment', 'Kos', 'Land', 'New Projects'].map(type => (
              <button key={type} onClick={() => onBrowse?.(type)} style={{
                padding: '8px 18px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)',
                color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>{type}</button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ flex: 1, maxWidth: 200, padding: '20px 16px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#8DC63F' }}>{s.val}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURED PROPERTIES ═══ */}
      <section style={{ padding: '60px 48px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: 0 }}>Featured Properties</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>Latest listings from verified agents and owners</p>
          </div>
          <button onClick={() => onBrowse?.('all')} style={{
            padding: '10px 24px', borderRadius: 12, border: '1.5px solid rgba(141,198,63,0.3)',
            background: 'rgba(141,198,63,0.08)', color: '#8DC63F', fontSize: 14, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>View All →</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {propertyListings.map(l => {
            const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
            return (
              <div key={l.id} onClick={() => onBrowse?.(l.id)} style={{
                borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.2s',
              }}>
                <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                  <img src={l.images?.[0]} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', borderRadius: 8, background: l.buy_now ? 'rgba(250,204,21,0.9)' : 'rgba(141,198,63,0.9)', fontSize: 11, fontWeight: 800, color: '#000' }}>{l.buy_now ? 'FOR SALE' : 'FOR RENT'}</div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>📍 {l.city} · {l.sub_category}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmtRp(price)}{!l.buy_now && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{l.price_month ? '/mo' : '/day'}</span>}</div>
                  {l.extra_fields?.bedrooms && <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{l.extra_fields.bedrooms}BR · {l.extra_fields.bathrooms || 1}BA{l.extra_fields.land_area ? ` · ${l.extra_fields.land_area}` : ''}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══ BROWSE BY CITY ═══ */}
      <section style={{ padding: '60px 48px', background: 'rgba(255,255,255,0.02)', maxWidth: 1400, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 32px' }}>Browse by City</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {CITIES.map(city => (
            <div key={city.name} onClick={() => onBrowse?.(city.name)} style={{
              borderRadius: 16, overflow: 'hidden', cursor: 'pointer', position: 'relative', height: 200,
              transition: 'transform 0.2s',
            }}>
              <img src={city.image} alt={city.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.8))' }} />
              <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{city.name}</div>
                <div style={{ fontSize: 13, color: '#8DC63F', fontWeight: 700 }}>{city.listings} listings</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section style={{ padding: '60px 48px', maxWidth: 1400, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>Everything You Need</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', margin: '0 0 40px' }}>One app for property, transport, and local discovery in Indonesia</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              padding: '24px 20px', borderRadius: 16,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{
        padding: '80px 48px', textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(141,198,63,0.08), rgba(0,0,0,0.9))',
        borderTop: '1px solid rgba(141,198,63,0.1)',
      }}>
        <h2 style={{ fontSize: 40, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>Ready to Explore Indonesia?</h2>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', margin: '0 0 32px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
          Download INDOO and discover property, rides, and places — all in one app.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button style={{ padding: '16px 32px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 18, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(141,198,63,0.3)' }}>
            📱 Download for Android
          </button>
          <button style={{ padding: '16px 32px', borderRadius: 14, border: '2px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 18, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
            🍎 Download for iOS
          </button>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: '40px 48px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1400, margin: '0 auto' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>IND<span style={{ color: '#8DC63F' }}>OO</span></div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Indonesia's Super App · Property · Rides · Places</div>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>About</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 Indoo Indonesia</div>
      </footer>

      <style>{`
        @media (min-width: 768px) { .website-landing { display: block !important; } }
        @media (max-width: 1024px) {
          .website-landing section { padding-left: 24px !important; padding-right: 24px !important; }
          .website-landing h1 { font-size: 40px !important; }
        }
      `}</style>
    </div>
  )
}
