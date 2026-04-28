import { useState } from 'react'
import { useMySession } from '@/hooks/useMySession'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage, LANGUAGES } from '@/i18n'
import styles from './MapHeader.module.css'

const LOGO_URL = 'https://ik.imagekit.io/nepgaxllc/Bold%203D%20_INDOO_%20logo%20design.png?updatedAt=1776203769926'

export default function MapHeader({
  onOpenNotifications,
  notifCount = 0,
  onAccountClick,
}) {
  const { isLive } = useMySession()
  const { user } = useAuth()
  const { lang, setLang } = useLanguage()
  const [langOpen, setLangOpen] = useState(false)

  const currentLang = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[1]

  return createPortal(
    <div className={styles.header}>
      {/* Logo — left side */}
      <div className={styles.logoArea}>
        <img src={LOGO_URL} alt="Indoo" className={styles.logo} />
      </div>

      {/* Language selector — right side */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setLangOpen(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
          borderRadius: 12, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
        }}>
          <span style={{ fontSize: 20 }}>{currentLang.flag}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{currentLang.label}</span>
        </button>

        {langOpen && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 6,
            background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 16,
            overflow: 'hidden', zIndex: 99999, minWidth: 160,
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false) }} style={{
                width: '100%', padding: '12px 16px', background: l.code === lang ? 'rgba(141,198,63,0.1)' : 'none',
                border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              }}>
                <span style={{ fontSize: 20 }}>{l.flag}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: l.code === lang ? '#8DC63F' : '#fff' }}>{l.label}</span>
                {l.code === lang && <span style={{ marginLeft: 'auto', fontSize: 14, color: '#8DC63F' }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
