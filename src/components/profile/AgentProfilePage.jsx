/**
 * AgentProfilePage — Premium property agent profile.
 * Credibility, portfolio, testimonials, consultation booking, video intro.
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

// Demo testimonials
const DEMO_TESTIMONIALS = [
  { name: 'Rina Sari', text: 'Very professional agent. Helped us find our dream villa in just 2 weeks. Highly recommended!', rating: 5 },
  { name: 'Budi Hartono', text: 'Excellent negotiation skills. Got us a great price on our new house. Will use again.', rating: 5 },
  { name: 'Sarah Chen', text: 'As a foreigner, buying property in Bali was complicated. This agent made it easy and transparent.', rating: 4 },
]

export default function AgentProfilePage({ open, onClose, agent, listings = [], onSelectListing, onChat }) {
  const [activeTab, setActiveTab] = useState('listings')
  const [showConsult, setShowConsult] = useState(false)
  const [showValuation, setShowValuation] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [consultName, setConsultName] = useState('')
  const [consultPhone, setConsultPhone] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  const [valuationAddress, setValuationAddress] = useState('')
  const [formSent, setFormSent] = useState('')
  const [showVideo, setShowVideo] = useState(false)

  if (!open || !agent) return null

  const name = agent.name || agent.businessName || agent.ownerName || 'Agent'
  const photo = agent.photo || agent.image || agent.photoURL || ''
  const bio = agent.bio || agent.description || ''
  const city = agent.city || agent.location || ''
  const phone = agent.whatsapp || agent.phone || ''
  const email = agent.email || ''
  const instagram = agent.instagram || ''
  const companyName = agent.company || agent.companyName || ''
  const ownerType = agent.ownerType || agent.owner_type || 'agent'
  const isVerified = agent.verified || agent.tier === 'premium'
  const rating = agent.rating || 4.7
  const reviewCount = agent.reviewCount || agent.review_count || 12
  const videoUrl = agent.videoIntro || agent.video_url || null

  // Computed stats
  const activeListings = listings.filter(l => l.status !== 'sold' && l.status !== 'rented').slice(0, 10)
  const soldListings = listings.filter(l => l.status === 'sold' || l.status === 'rented')
  const totalSold = agent.totalSold || soldListings.length || 8
  const yearsActive = agent.yearsActive || agent.experience || 5
  const memberSince = agent.memberSince || '2024'
  const responseTime = agent.responseTime || '2 hours'
  const avgDaysToSell = agent.avgDaysToSell || 42
  const licenseNumber = agent.licenseNumber || null
  const languages = agent.languages || ['Bahasa Indonesia', 'English']
  const specializations = agent.specializations || ['Villa', 'House', 'Land']
  const areasServed = agent.areasServed || [city || 'Yogyakarta']
  const totalTransactionValue = agent.totalTransactionValue || 0
  const priceRangeMin = agent.priceRangeMin || (listings.length ? Math.min(...listings.map(l => Number(String(typeof l.buy_now === 'object' ? l.buy_now?.price : l.buy_now || l.price_month || 0).replace(/\./g, ''))).filter(Boolean)) : 500000000)
  const priceRangeMax = agent.priceRangeMax || (listings.length ? Math.max(...listings.map(l => Number(String(typeof l.buy_now === 'object' ? l.buy_now?.price : l.buy_now || l.price_month || 0).replace(/\./g, ''))).filter(Boolean)) : 3000000000)

  // Portfolio breakdown
  const typeCounts = {}
  listings.forEach(l => { const t = l.sub_category || l.extra_fields?.property_type || 'Other'; typeCounts[t] = (typeCounts[t] || 0) + 1 })
  const typeBreakdown = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const totalForPct = listings.length || 1

  const sendWhatsApp = (msg) => {
    window.open(`https://wa.me/${(phone || '').replace(/^0/, '62')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9500, background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ═══ Hero ═══ */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(141,198,63,0.12) 0%, rgba(0,0,0,0.9) 60%, #0a0a0a 100%)' }} />
        <div style={{ position: 'relative', padding: '20px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            {/* Photo */}
            <div style={{ position: 'relative' }}>
              <div style={{ width: 80, height: 80, borderRadius: 20, overflow: 'hidden', border: '2.5px solid rgba(141,198,63,0.4)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                {photo ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'rgba(141,198,63,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>👤</div>}
              </div>
              {videoUrl && (
                <button onClick={() => setShowVideo(true)} style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '50%', background: '#8DC63F', border: '2px solid #0a0a0a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <span style={{ fontSize: 12 }}>▶</span>
                </button>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>{name}</h1>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                {isVerified && <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', fontSize: 10, fontWeight: 800, color: '#60A5FA' }}>✓ Verified</span>}
                {agent.ktpVerified && <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.12)', border: '1px solid rgba(141,198,63,0.25)', fontSize: 10, fontWeight: 800, color: '#8DC63F' }}>🪪 KTP Verified</span>}
                <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>{ownerType === 'agent' ? '🏢 Agent' : '👤 Owner'}</span>
              </div>
              {companyName && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{companyName}</div>}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>📍 {city} · {yearsActive} years · Member since {memberSince}</div>
              {licenseNumber && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>License: {licenseNumber}</div>}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            {[
              { val: activeListings.length, label: 'Active', color: '#FACC15' },
              { val: totalSold, label: 'Sold', color: '#8DC63F' },
              { val: `${rating}⭐`, label: `${reviewCount} Reviews`, color: '#60A5FA' },
              { val: `~${avgDaysToSell}d`, label: 'Avg Sale', color: '#A855F7' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Body ═══ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px' }}>

        {/* Response time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 12px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8DC63F', boxShadow: '0 0 6px #8DC63F' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Usually replies within <strong style={{ color: '#8DC63F' }}>{responseTime}</strong></span>
        </div>

        {/* Bio */}
        {bio && <div style={{ ...glass, padding: '14px 16px', marginBottom: 12, fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{bio}</div>}

        {/* Specializations + Areas + Languages */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {specializations.map(s => <span key={s} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)', fontSize: 11, fontWeight: 700, color: '#FACC15', whiteSpace: 'nowrap', flexShrink: 0 }}>{s}</span>)}
          {areasServed.map(a => <span key={a} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)', fontSize: 11, fontWeight: 700, color: '#60A5FA', whiteSpace: 'nowrap', flexShrink: 0 }}>📍 {a}</span>)}
          {languages.map(l => <span key={l} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', flexShrink: 0 }}>🗣️ {l}</span>)}
        </div>

        {/* Portfolio breakdown */}
        {typeBreakdown.length > 0 && (
          <div style={{ ...glass, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Portfolio Breakdown</div>
            {typeBreakdown.map(([type, count]) => {
              const pct = Math.round(count / totalForPct * 100)
              return (
                <div key={type} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{type}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#FACC15' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: '#FACC15' }} />
                  </div>
                </div>
              )
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              <span>Price range: {fmtRp(priceRangeMin)} — {fmtRp(priceRangeMax)}</span>
              {totalTransactionValue > 0 && <span style={{ color: '#8DC63F', fontWeight: 700 }}>Total: {fmtRp(totalTransactionValue)}+ sold</span>}
            </div>
          </div>
        )}

        {/* Market insight */}
        <div style={{ ...glass, padding: '12px 16px', marginBottom: 12, background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.12)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA', marginBottom: 4 }}>📊 Market Insight</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
            Property prices in {city || 'this area'} have grown ~6-8% this year. {specializations[0] || 'Villa'} properties are in high demand with average sale time of {avgDaysToSell} days.
          </div>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={() => setShowConsult(true)} style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(141,198,63,0.3)' }}>📞 Free Consultation</button>
          <button onClick={() => setShowValuation(true)} style={{ flex: 1, padding: '13px 0', borderRadius: 14, background: 'rgba(250,204,21,0.1)', border: '1.5px solid rgba(250,204,21,0.3)', color: '#FACC15', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>🏷️ Get Valuation</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => setShowSchedule(true)} style={{ flex: 1, padding: '13px 0', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>📅 Schedule Viewing</button>
          {phone && (
            <a href={`https://wa.me/${phone.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '13px 0', borderRadius: 14, textDecoration: 'none', background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#fff', fontSize: 13, fontWeight: 900, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>💬 WhatsApp</a>
          )}
        </div>

        {/* Testimonials */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>⭐ Client Testimonials</div>
          {(agent.testimonials || DEMO_TESTIMONIALS).slice(0, 3).map((t, i) => (
            <div key={i} style={{ ...glass, padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{t.name}</span>
                <span style={{ fontSize: 12, color: '#FACC15' }}>{'⭐'.repeat(t.rating)}</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, fontStyle: 'italic' }}>"{t.text}"</div>
            </div>
          ))}
        </div>

        {/* Tabs: Listings */}
        <div style={{ display: 'flex', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { id: 'listings', label: `Active (${activeListings.length})` },
            { id: 'sold', label: `Sold (${soldListings.length || totalSold})` },
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
        {activeTab === 'listings' && activeListings.map((l, i) => {
          const img = l.images?.[0] || l.image || ''
          const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day || 0
          const priceLabel = l.buy_now ? 'Sale' : l.price_month ? '/mo' : '/day'
          const subCat = l.sub_category || l.extra_fields?.property_type || ''
          return (
            <button key={l.id || i} onClick={() => onSelectListing?.(l)} style={{ width: '100%', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0, background: 'none', marginBottom: 8 }}>
              <div style={{ ...glass, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: 110, height: 90, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                  {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏠</div>}
                  <div style={{ position: 'absolute', top: 4, left: 4, padding: '2px 6px', borderRadius: 4, background: l.buy_now ? 'rgba(250,204,21,0.2)' : 'rgba(141,198,63,0.2)', fontSize: 9, fontWeight: 800, color: l.buy_now ? '#FACC15' : '#8DC63F' }}>{l.buy_now ? 'SALE' : 'RENT'}</div>
                </div>
                <div style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>📍 {l.city} · {subCat}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#FACC15' }}>{fmtRp(price)} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{priceLabel}</span></div>
                </div>
              </div>
            </button>
          )
        })}
        {activeTab === 'listings' && activeListings.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No active listings</div>}

        {/* Sold */}
        {activeTab === 'sold' && (soldListings.length > 0 ? soldListings : [{ id: 'demo1', title: 'Villa Sunset Seminyak', city: 'Bali', status: 'sold', buy_now: 2800000000 }, { id: 'demo2', title: 'Rumah Minimalis Sleman', city: 'Yogyakarta', status: 'sold', buy_now: 850000000 }]).map((l, i) => (
          <div key={l.id || i} style={{ ...glass, padding: '10px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10, opacity: 0.6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.status === 'sold' ? '#EF4444' : '#60A5FA' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{l.title}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{l.city} · {l.status === 'sold' ? 'SOLD' : 'RENTED'}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{fmtRp(typeof l.buy_now === 'object' ? l.buy_now?.price : l.buy_now || l.price_month)}</span>
          </div>
        ))}
      </div>

      {/* ═══ Form Overlays ═══ */}
      {(showConsult || showValuation || showSchedule) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9600, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: '#0a0a0a', borderRadius: '20px 20px 0 0', border: '1px solid rgba(255,255,255,0.08)', padding: '20px 16px 32px', maxHeight: '60vh', overflowY: 'auto' }}>
            {formSent ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✓</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#8DC63F' }}>Sent via WhatsApp!</div>
                <button onClick={() => { setShowConsult(false); setShowValuation(false); setShowSchedule(false); setFormSent('') }} style={{ marginTop: 12, padding: '10px 24px', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 14 }}>
                  {showConsult ? '📞 Request Free Consultation' : showValuation ? '🏷️ Get Property Valuation' : '📅 Schedule Viewing'}
                </div>
                <input value={consultName} onChange={e => setConsultName(e.target.value)} placeholder="Your name" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
                <input value={consultPhone} onChange={e => setConsultPhone(e.target.value)} placeholder="WhatsApp number" type="tel" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
                {showValuation && <input value={valuationAddress} onChange={e => setValuationAddress(e.target.value)} placeholder="Property address for valuation" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />}
                {showSchedule && <input value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} type="date" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setShowConsult(false); setShowValuation(false); setShowSchedule(false) }} style={{ flex: 1, padding: '13px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button onClick={() => {
                    const msg = showConsult ? `Halo ${name}, saya ${consultName} ingin konsultasi gratis tentang properti. No HP: ${consultPhone}`
                      : showValuation ? `Halo ${name}, saya ${consultName} ingin valuasi properti di ${valuationAddress}. No HP: ${consultPhone}`
                      : `Halo ${name}, saya ${consultName} ingin jadwalkan viewing tanggal ${scheduleDate}. No HP: ${consultPhone}`
                    sendWhatsApp(msg); setFormSent('sent')
                  }} disabled={!consultName.trim() || !consultPhone.trim()} style={{
                    flex: 2, padding: '13px', borderRadius: 12, border: 'none',
                    background: consultName.trim() && consultPhone.trim() ? 'linear-gradient(135deg, #8DC63F, #6BA52A)' : 'rgba(255,255,255,0.06)',
                    color: consultName.trim() && consultPhone.trim() ? '#000' : 'rgba(255,255,255,0.2)',
                    fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                  }}>Send via WhatsApp</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <IndooFooter label="Agent" onBack={onClose} onHome={onClose} />
    </div>,
    document.body
  )
}
