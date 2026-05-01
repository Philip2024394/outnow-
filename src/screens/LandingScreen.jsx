import { useLanguage, LANGUAGES as LANG_LIST } from '@/i18n'
import styles from './LandingScreen.module.css'

const HERO_IMG = 'https://ik.imagekit.io/nepgaxllc/front%20app.png'
const LOGO_URL = 'https://ik.imagekit.io/nepgaxllc/Bold%203D%20_INDOO_%20logo%20design.png?updatedAt=1776203769926'

export default function LandingScreen({ onGetStarted, onSignIn, onBrowse }) {
  const { t, lang, setLang } = useLanguage()

  return (
    <div className={styles.screen}>
      <img src={HERO_IMG} alt="" className={styles.hero} />
      <div className={styles.overlayTop} />
      <div className={styles.overlayBottom} />

      <img src={LOGO_URL} alt="Indoo" className={styles.logo} />

      <div className={styles.bottom}>
        <div className={styles.taglineWrap}>
          <span className={styles.taglinePill}>{t('landing.tagline')}</span>
          <h1 className={styles.headline}>
            {t('landing.headline').split('\n').map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
          </h1>
          <p className={styles.sub}>{t('landing.sub')}</p>
        </div>

        {/* Language selector — flag image buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 14 }}>
          {LANG_LIST.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              style={{
                width: 44, height: 44, borderRadius: '50%', padding: 0, overflow: 'hidden',
                background: lang === l.code ? 'rgba(141,198,63,0.2)' : 'rgba(0,0,0,0.4)',
                border: lang === l.code ? '2.5px solid rgba(141,198,63,0.7)' : '2px solid rgba(255,255,255,0.12)',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: lang === l.code ? '0 0 14px rgba(141,198,63,0.4)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <img src={l.image} alt={l.label} style={{ width: 30, height: 30, objectFit: 'contain' }} />
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.getStartedBtn} onClick={onGetStarted}>
            <img src="https://ik.imagekit.io/nepgaxllc/dfggdfgees-removebg-preview.png" alt="" />
            <span>{t('landing.getStarted')}</span>
          </button>
        </div>

        <button className={styles.browseBtn} onClick={onBrowse}>
          {t('landing.browse')}
        </button>

        <p className={styles.legal}>{t('landing.legal')}</p>
      </div>
    </div>
  )
}
