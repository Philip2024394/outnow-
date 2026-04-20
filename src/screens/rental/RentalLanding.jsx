import styles from '../RentalSearchScreen.module.css'

export default function RentalLanding({ onEnter, onClose, onDashboard, onSignUp }) {
  return (
    <div className={styles.landing}>
      {/* Floating side nav */}
      <div className={styles.floatNav}>
        <button className={styles.floatNavBtn} onClick={onClose} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <img src="https://ik.imagekit.io/nepgaxllc/Untitledsssaa-removebg-preview.png" alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.03em' }}>Home</span>
        </button>
        <button className={`${styles.floatNavBtn} ${styles.floatNavBtnAccent}`} onClick={onSignUp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <img src="https://ik.imagekit.io/nepgaxllc/Untitledsssaaddd-removebg-preview.png" alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.03em' }}>Profile</span>
        </button>
      </div>

      <div className={styles.landingMain}>
        <div className={styles.landingHeader}>
          <span className={styles.landingBrandText}><span>INDOO</span><span className={styles.landingBrandGreen}>DONE DEAL</span></span>
        </div>

        <div className={styles.landingSearchRow}>
          <div className={styles.landingSearchWrap}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className={styles.landingSearchInput} placeholder="Search done deals..." readOnly onClick={onEnter} />
          </div>
        </div>

        <div className={styles.landingContent} style={{ justifyContent: 'flex-end', paddingBottom: 40 }}>
          <h1 className={styles.landingTitle}>Indoo Done Deal</h1>
          <p className={styles.landingSub}>Rentals & Sales {'\u2014'} motors, cars, villas, equipment and more</p>
          <button className={styles.landingBtn} onClick={onEnter}>
            Browse Deals
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
