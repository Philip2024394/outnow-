import { useLanguage } from '@/i18n'
import styles from './LandingScreen.module.css'

const HERO_IMG = 'https://ik.imagekit.io/nepgaxllc/front%20app.png'
const LOGO_URL = 'https://ik.imagekit.io/nepgaxllc/Bold%203D%20_INDOO_%20logo%20design.png?updatedAt=1776203769926'

export default function LandingScreen({ onGetStarted, onSignIn, onBrowse }) {
  const { t } = useLanguage()

  return (
    <div className={styles.screen}>
      <img src={HERO_IMG} alt="" className={styles.hero} />
      <div className={styles.overlayTop} />
      <div className={styles.overlayBottom} />

      <div className={styles.logoWrap}>
        <img src={LOGO_URL} alt="Indoo" className={styles.logo} />
      </div>

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

        <div className={styles.actions}>
          <button className={styles.getStartedBtn} onClick={onGetStarted}>
            {t('landing.getStarted')}
          </button>
          <button className={styles.signInBtn} onClick={onSignIn}>
            {t('landing.signIn')}
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
