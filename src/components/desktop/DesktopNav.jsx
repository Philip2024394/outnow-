/**
 * DesktopNav — Top navigation bar for desktop web view.
 * Hidden on mobile (< 768px). Shows logo, nav links, search, language, sign in.
 */
import { useState } from 'react'
import { useLanguage, LANGUAGES } from '@/i18n'

const LOGO = 'https://ik.imagekit.io/nepgaxllc/Bold%203D%20_INDOO_%20logo%20design.png?updatedAt=1776203769926'

const NAV_ITEMS = [
  { id: 'property', label: 'Property', icon: '🏠' },
  { id: 'rentals', label: 'Rentals', icon: '🔑' },
  { id: 'places', label: 'Places', icon: '📍' },
  { id: 'agents', label: 'Agents', icon: '🏢' },
  { id: 'newprojects', label: 'New Projects', icon: '🏗️' },
  { id: 'dealhunt', label: 'Deal Hunt', icon: '🔥' },
]

export default function DesktopNav({ activeSection, onNavigate, onSearch }) {
  const { lang, setLang } = useLanguage()
  const [searchVal, setSearchVal] = useState('')
  const [showLang, setShowLang] = useState(false)

  return (
    <nav style={{
      display: 'none', position: 'sticky', top: 0, zIndex: 9999,
      background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '0 32px', height: 64, alignItems: 'center', gap: 24,
    }}
    className="desktop-nav"
    >
      {/* Logo */}
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
        <img src={LOGO} alt="Indoo" style={{ height: 36, objectFit: 'contain' }} />
      </a>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => onNavigate?.(item.id)} style={{
            padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: activeSection === item.id ? 'rgba(141,198,63,0.12)' : 'transparent',
            color: activeSection === item.id ? '#8DC63F' : 'rgba(255,255,255,0.5)',
            fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', height: 38, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, width: 260 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch?.(searchVal)}
          placeholder="Search properties, rentals..."
          style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
        />
      </div>

      {/* Language */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setShowLang(!showLang)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
          borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
        }}>
          <img src={LANGUAGES.find(l => l.code === lang)?.image} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'contain' }} />
          {LANGUAGES.find(l => l.code === lang)?.label}
        </button>
        {showLang && (
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', minWidth: 140, boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => { setLang(l.code); setShowLang(false) }} style={{
                width: '100%', padding: '10px 14px', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: l.code === lang ? 'rgba(141,198,63,0.1)' : 'none',
                color: l.code === lang ? '#8DC63F' : '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
              }}>
                <img src={l.image} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'contain' }} />
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sign In */}
      <button style={{
        padding: '8px 20px', borderRadius: 10, border: 'none',
        background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
        color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 2px 10px rgba(141,198,63,0.3)',
      }}>Sign In</button>

      <style>{`
        @media (min-width: 768px) { .desktop-nav { display: flex !important; } }
      `}</style>
    </nav>
  )
}
