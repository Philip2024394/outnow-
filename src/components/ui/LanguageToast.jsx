import { useEffect, useState } from 'react'
import { useLanguage, LANGUAGES } from '@/i18n'
import styles from './LanguageToast.module.css'

export default function LanguageToast({ _forceVisible = false }) {
  const { lang, setLang, t, isFirstPick, dismissFirstPick } = useLanguage()
  const [visible, setVisible] = useState(_forceVisible)

  // Slight delay so landing screen renders first
  useEffect(() => {
    if (_forceVisible) { setVisible(true); return }
    if (!isFirstPick) return
    const id = setTimeout(() => setVisible(true), 800)
    return () => clearTimeout(id)
  }, [isFirstPick, _forceVisible])

  if (!visible) return null

  const handleSelect = (code) => {
    setLang(code)
    setVisible(false)
  }

  const handleDismiss = () => {
    dismissFirstPick()
    setVisible(false)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.toast}>
        <p className={styles.label}>{t('lang.choose')}</p>
        <div className={styles.flags}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              className={`${styles.flagBtn} ${lang === l.code ? styles.flagActive : ''}`}
              onClick={() => handleSelect(l.code)}
              aria-label={l.label}
            >
              <span className={styles.flag}>{l.flag}</span>
              <span className={styles.flagLabel}>{l.label}</span>
            </button>
          ))}
        </div>
        <button className={styles.dismiss} onClick={handleDismiss}>✕</button>
      </div>
    </div>
  )
}
