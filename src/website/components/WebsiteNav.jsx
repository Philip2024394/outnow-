/**
 * WebsiteNav — Sticky top navigation for property website.
 */
import { useState } from 'react'
import { useLanguage, LANGUAGES } from '@/i18n'

const LOGO = 'https://ik.imagekit.io/nepgaxllc/Bold%203D%20_INDOO_%20logo%20design.png?updatedAt=1776203769926'

const NAV = [
  { id: 'home', label: 'Home', href: '/property' },
  { id: 'sale', label: 'For Sale' },
  { id: 'rent', label: 'For Rent' },
  { id: 'newprojects', label: 'New Projects' },
  { id: 'agents', label: 'Agents' },
  { id: 'kpr', label: 'KPR Calculator' },
]

export default function WebsiteNav({ activePage, onNavigate, onSearch }) {
  const { lang, setLang } = useLanguage()
  const [searchVal, setSearchVal] = useState('')
  const [showLang, setShowLang] = useState(false)

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 9999,
      background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '0 48px', height: 64, display: 'flex', alignItems: 'center', gap: 20,
    }}>
      <a href="/property" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0, marginRight: 8 }}>
        <img src={LOGO} alt="Indoo" style={{ height: 32 }} />
        <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>PROPERTY</span>
      </a>

      {NAV.map(item => (
        <button key={item.id} onClick={() => onNavigate?.(item.id)} style={{
          padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          background: activePage === item.id ? 'rgba(141,198,63,0.1)' : 'transparent',
          color: activePage === item.id ? '#8DC63F' : 'rgba(255,255,255,0.45)',
          fontSize: 13, fontWeight: 700, transition: 'all 0.15s', whiteSpace: 'nowrap',
        }}>{item.label}</button>
      ))}

      <div style={{ flex: 1 }} />

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 36, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, width: 220 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={searchVal} onChange={e => setSearchVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearch?.(searchVal)} placeholder="Search..."
          style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
      </div>

      {/* Language */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setShowLang(!showLang)} style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
        }}>
          <img src={LANGUAGES.find(l => l.code === lang)?.image} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'contain' }} />
        </button>
        {showLang && (
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden', minWidth: 130, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => { setLang(l.code); setShowLang(false) }} style={{
                width: '100%', padding: '8px 12px', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: l.code === lang ? 'rgba(141,198,63,0.08)' : 'none',
                color: l.code === lang ? '#8DC63F' : '#fff', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <img src={l.image} alt="" style={{ width: 16, height: 16, borderRadius: '50%' }} /> {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Download App */}
      <button style={{
        padding: '7px 18px', borderRadius: 10, border: 'none',
        background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
        color: '#000', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
      }}>📱 Get App</button>
    </nav>
  )
}
