/**
 * AgentDirectoryPage — Browse all property agents on desktop website.
 */
import { useState } from 'react'
import { ScrollReveal } from '../hooks/useScrollReveal'

const DEMO_AGENTS = [
  { id: 'a1', name: 'Ahmad Pratama', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', company: 'Ray White Yogyakarta', city: 'Yogyakarta', rating: 4.8, reviews: 34, sold: 45, yearsActive: 8, specializations: ['Villa', 'House', 'Land'], bio: 'Specialized in villa and residential properties. 8 years helping local and international buyers.', whatsapp: '081234567890', instagram: 'ahmadproperty', verified: true },
  { id: 'a2', name: 'Dewi Anggraini', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', company: 'Brighton Real Estate', city: 'Bali', rating: 4.9, reviews: 56, sold: 78, yearsActive: 12, specializations: ['Villa', 'Resort', 'Commercial'], bio: 'Bali villa specialist. Deep knowledge of Seminyak, Canggu, and Ubud markets.', whatsapp: '087654321098', instagram: 'dewibaliproperti', verified: true },
  { id: 'a3', name: 'Hendra Wijaya', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', company: 'ERA Indonesia', city: 'Yogyakarta', rating: 4.6, reviews: 21, sold: 22, yearsActive: 5, specializations: ['Kos', 'Apartment', 'House'], bio: 'Focus on student housing and apartments near UGM and UNY campuses.', whatsapp: '085111222333', verified: true },
  { id: 'a4', name: 'Sari Rahayu', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', company: 'Independent Agent', city: 'Yogyakarta', rating: 4.5, reviews: 14, sold: 12, yearsActive: 3, specializations: ['House', 'Land'], bio: 'Helping families find affordable homes in south Yogyakarta.', whatsapp: '089876543210', verified: false },
  { id: 'a5', name: 'Made Surya', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop', company: 'Century 21 Bali', city: 'Bali', rating: 4.7, reviews: 42, sold: 63, yearsActive: 10, specializations: ['Villa', 'Land', 'Commercial'], bio: 'South Bali specialist. Strong network with Japanese and Australian buyers.', whatsapp: '081999888777', instagram: 'madesurya_bali', verified: true },
  { id: 'a6', name: 'Rina Kusuma', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', company: 'Coldwell Banker', city: 'Jakarta', rating: 4.8, reviews: 38, sold: 52, yearsActive: 9, specializations: ['Apartment', 'House', 'Ruko'], bio: 'Jakarta property expert specializing in South Jakarta premium residential.', whatsapp: '081222333444', verified: true },
]

const CITIES = ['All', 'Yogyakarta', 'Bali', 'Jakarta']
const SPECS = ['All', 'Villa', 'House', 'Apartment', 'Kos', 'Land', 'Commercial']

export default function AgentDirectoryPage({ onSelectAgent, onBack }) {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('All')
  const [spec, setSpec] = useState('All')

  let agents = DEMO_AGENTS
  if (city !== 'All') agents = agents.filter(a => a.city === city)
  if (spec !== 'All') agents = agents.filter(a => a.specializations.includes(spec))
  if (search.trim()) { const q = search.toLowerCase(); agents = agents.filter(a => a.name.toLowerCase().includes(q) || a.company.toLowerCase().includes(q)) }

  const pill = (active) => ({ padding: '7px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, border: 'none', background: active ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)', color: active ? '#8DC63F' : 'rgba(255,255,255,0.4)', outline: active ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.06)' })

  return (
    <div style={{ padding: '32px 0 60px' }}>
      <div className="ws-container">
        {/* Header */}
        <ScrollReveal>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>🏢 Property <span style={{ color: '#8DC63F' }}>Agents</span></h1>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{agents.length} verified professionals ready to help</p>
            </div>
            {onBack && <button onClick={onBack} style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>}
          </div>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal delay={0.1}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..." style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 220 }} />
            <div style={{ display: 'flex', gap: 6 }}>{CITIES.map(c => <button key={c} onClick={() => setCity(c)} style={pill(city === c)}>{c}</button>)}</div>
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ display: 'flex', gap: 6 }}>{SPECS.map(s => <button key={s} onClick={() => setSpec(s)} style={pill(spec === s)}>{s}</button>)}</div>
          </div>
        </ScrollReveal>

        {/* Agent Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {agents.map((a, i) => (
            <ScrollReveal key={a.id} delay={i * 0.05}>
              <div className="ws-card" onClick={() => onSelectAgent?.(a)} style={{
                borderRadius: 20, overflow: 'hidden',
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.06)', padding: '24px',
              }}>
                {/* Top */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <img src={a.photo} alt={a.name} style={{ width: 64, height: 64, borderRadius: 18, objectFit: 'cover', border: '2.5px solid rgba(141,198,63,0.3)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{a.name}</span>
                      {a.verified && <span style={{ fontSize: 10, color: '#60A5FA' }}>✓</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{a.company}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>📍 {a.city} · {a.yearsActive}yr exp</div>
                  </div>
                </div>

                {/* Bio */}
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 14, minHeight: 40 }}>{a.bio}</div>

                {/* Specs */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
                  {a.specializations.map(s => <span key={s} style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)', fontSize: 11, fontWeight: 700, color: '#FACC15' }}>{s}</span>)}
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 10, background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>⭐ {a.rating}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{a.reviews} reviews</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 10, background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F' }}>{a.sold}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Sold</div>
                  </div>
                </div>

                {/* CTA */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`https://wa.me/${a.whatsapp.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '11px', borderRadius: 12, textDecoration: 'none', background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#fff', fontSize: 13, fontWeight: 900, textAlign: 'center' }}>💬 WhatsApp</a>
                  <button onClick={() => onSelectAgent?.(a)} style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1.5px solid rgba(141,198,63,0.3)', background: 'rgba(141,198,63,0.08)', color: '#8DC63F', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>View Profile</button>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {agents.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.25)', fontSize: 16 }}>No agents found</div>}
      </div>
    </div>
  )
}

export { DEMO_AGENTS }
