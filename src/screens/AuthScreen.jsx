import styles from './AuthScreen.module.css'

const BRAND_URL = 'https://ik.imagekit.io/nepgaxllc/Untitledxczxc-removebg-preview.png?updatedAt=1775162044064'
const HERO_URL  = 'https://ik.imagekit.io/nepgaxllc/Untitledxzxczcxzxcdassdasdvvvvv.png'

const MEMBER_PHOTOS = [
  'https://ik.imagekit.io/nepgaxllc/uk1.png',
  'https://ik.imagekit.io/nepgaxllc/uk2.png',
  'https://ik.imagekit.io/nepgaxllc/uk3.png',
  'https://ik.imagekit.io/nepgaxllc/uk4.png',
  'https://ik.imagekit.io/nepgaxllc/uk5.png',
  'https://ik.imagekit.io/nepgaxllc/uk6.png',
  'https://ik.imagekit.io/nepgaxllc/uk7.png',
  'https://ik.imagekit.io/nepgaxllc/uk8.png',
]

export default function AuthScreen({ onGuest, onAdminDev }) {
  return (
    <div className={styles.container}>
      <img src={HERO_URL} alt="" className={styles.hero} />
      <div className={styles.overlay} />

      <div className={styles.logoWrap}>
        <img src={BRAND_URL} alt="Hangger" className={styles.logo} />
        <p className={styles.tagline}>Meet People Out Near You</p>
      </div>

      <div className={styles.footer}>
        <div className={styles.membersBlock}>
          <p className={styles.membersLabel}>Members waiting to connect</p>
          <div className={styles.memberAvatars}>
            {MEMBER_PHOTOS.map((src, i) => (
              <img key={i} src={src} alt="" className={styles.memberAvatar} />
            ))}
          </div>
        </div>
        <button className={styles.enterBtn} onClick={onGuest}>
          Enter App
        </button>
        <p className={styles.terms}>
          By continuing you agree to our Terms &amp; Privacy Policy. Must be 18+.
        </p>
        <button className={styles.devBtn} onClick={onAdminDev}>
          ⚡ Admin
        </button>
      </div>
    </div>
  )
}
