import { useLanguage } from '@/i18n'
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

        {/* Language selector */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
          {[
            { code: 'en', flag: '🇬🇧', label: 'English' },
            { code: 'id', flag: '🇮🇩', label: 'Bahasa' },
            { code: 'zh', flag: '🇨🇳', label: '中文' },
            { code: 'ar', flag: '🇸🇦', label: 'العربية' },
          ].map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              style={{
                padding: '6px 12px', borderRadius: 12,
                background: lang === l.code ? 'rgba(141,198,63,0.2)' : 'rgba(0,0,0,0.4)',
                border: lang === l.code ? '1.5px solid rgba(141,198,63,0.5)' : '1.5px solid rgba(255,255,255,0.1)',
                color: lang === l.code ? '#8DC63F' : 'rgba(255,255,255,0.6)',
                fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span style={{ fontSize: 16 }}>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.getStartedBtn} onClick={onGetStarted}>
            {t('landing.getStarted')}
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
