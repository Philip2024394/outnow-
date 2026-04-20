import styles from '../RentalSearchScreen.module.css'

export default function SubCategoryLanding({ bg, title, tagline, heroSub, buttons, onSelect, onBack }) {
  return (
    <div className={styles.landing} style={{ backgroundImage: `url("${bg}")` }}>
      <div className={styles.landingOverlay} />
      <div className={styles.subHeader}>
        <div />
        <button className={styles.subHeaderBack} onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      </div>
      <div className={styles.landingContent}>
        <h1 className={styles.landingTitle} style={{ textAlign: 'left' }}><span style={{ background: 'linear-gradient(90deg, #fff 0%, #fff 58%, #8DC63F 58%, #8DC63F 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>INDOO</span> <span style={{ fontSize: '0.5em', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>DONE DEAL</span></h1>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F', margin: '4px 0 2px', letterSpacing: '0.03em' }}>Buy {'\u00b7'} Sell {'\u00b7'} Rent</p>
        <p className={styles.landingSub}>{heroSub || tagline}</p>
        <div className={styles.vehicleBtns}>
          {buttons.map(b => (
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
          ))}
        </div>
      </div>
    </div>
  )
}
