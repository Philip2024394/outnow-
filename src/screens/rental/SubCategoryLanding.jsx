import styles from '../RentalSearchScreen.module.css'
import IndooFooter from '@/components/ui/IndooFooter'

export default function SubCategoryLanding({ bg, bgPosition, title, tagline, heroSub, buttons, onSelect, onBack, noScroll }) {
  return (
    <div className={styles.landing} style={{ backgroundImage: `url("${bg}")`, backgroundPosition: bgPosition || 'center' }}>
      <div className={styles.landingContent} style={noScroll ? { overflow: 'hidden' } : undefined}>
        {title && (
          <div style={{ marginTop: 20 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>{title}</h1>
            {heroSub && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', fontWeight: 600 }}>{heroSub}</p>}
          </div>
        )}
        <div className={styles.vehicleBtns} style={title ? { marginTop: 16 } : undefined}>
          {buttons.map(b => (
            b.heroCard ? (
              <button key={b.filter} className={styles.vehicleBtn} onClick={() => onSelect(b.filter)} style={{ padding: 0, overflow: 'hidden', flexDirection: 'row', gap: 0 }}>
                {/* Left — green with label + icon */}
                <div style={{ width: '30%', background: '#6ba32e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 8px', alignSelf: 'stretch' }}>
                  {b.heroIcon === 'house' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                  {b.heroIcon === 'factory' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20"/><path d="M6 20V8l6 4V8l6 4V4h2v16"/><path d="M2 20V14l4-2"/></svg>}
                  {b.heroIcon === 'kos' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><path d="M9 22v-4h6v4"/></svg>}
                  {b.heroIcon === 'villa' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/><path d="M1 22h22"/><circle cx="12" cy="7" r="1.5"/></svg>}
                  {b.heroIcon === 'wedding' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C9 2 7 4 7 7c0 2 1 3 2 4l-3 9h12l-3-9c1-1 2-2 2-4 0-3-2-5-5-5z"/><path d="M9 22h6"/><line x1="12" y1="2" x2="12" y2="5"/></svg>}
                  {b.heroIcon === 'fashion' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2l3 5h6l3-5"/><path d="M9 7v13a2 2 0 002 2h2a2 2 0 002-2V7"/><path d="M6 2C4 2 2 4 2 6l4 1"/><path d="M18 2c2 0 4 2 4 4l-4 1"/></svg>}
                  <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', textAlign: 'center' }}>{b.label}</span>
                </div>
                {/* Right — image 70% */}
                <div style={{ width: '70%', position: 'relative', overflow: 'hidden', minHeight: 90, alignSelf: 'stretch', background: '#111' }}>
                  <img src={b.heroImg} alt={b.label} style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', inset: 0, margin: 0, padding: 0, display: 'block' }} />
                </div>
              </button>
            ) : (
              <button key={b.filter} className={styles.vehicleBtn} onClick={() => onSelect(b.filter)}>
                {b.img
                  ? <img src={b.img} alt={b.label} className={styles.vehicleBtnImg} />
                  : <span className={styles.vehicleBtnIcon}>{b.icon}</span>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={styles.vehicleBtnLabel}>{b.label}</span>
                    {b.rating && <span style={{ fontSize: 12, fontWeight: 800, color: '#FFD700' }}>{'\u2605'} {b.rating}</span>}
                  </div>
                  {b.sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: 3 }}>{b.sub}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    {b.count && <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.2)', fontSize: 11, fontWeight: 800, color: '#8DC63F' }}>{b.count}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>Browse</span>
                    </span>
                  </div>
                </div>
              </button>
            )
          ))}
        </div>
      </div>
      <IndooFooter label={title || 'Rentals'} onBack={onBack} onHome={onBack} />
    </div>
  )
}
