import { createContext, useContext, useEffect, useState } from 'react'
import en from './en'
import id from './id'
import ar from './ar'
import zh from './zh'

export const LANGUAGES = [
  { code: 'en', label: 'English',  flag: '🇬🇧', dir: 'ltr' },
  { code: 'id', label: 'Bahasa',   flag: '🇮🇩', dir: 'ltr' },
  { code: 'ar', label: 'عربي',     flag: '🇸🇦', dir: 'rtl' },
  { code: 'zh', label: '中文',     flag: '🇨🇳', dir: 'ltr' },
]

const TRANSLATIONS = { en, id, ar, zh }
const STORAGE_KEY  = 'hangger_lang'

/** Detect best default language from browser settings */
function detectLang() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && TRANSLATIONS[saved]) return saved

  const browser = navigator.language?.slice(0, 2).toLowerCase()
  if (browser === 'id') return 'id'
  if (browser === 'ar') return 'ar'
  if (browser === 'zh') return 'zh'
  return 'en'
}

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
  isFirstPick: false,
  dismissFirstPick: () => {},
})

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectLang)
  // Show language toast on very first visit (no explicit selection yet)
  const [isFirstPick, setIsFirstPick] = useState(
    () => !localStorage.getItem(STORAGE_KEY)
  )

  const setLang = (code) => {
    localStorage.setItem(STORAGE_KEY, code)
    setLangState(code)
    setIsFirstPick(false)
    // Apply RTL/LTR to document
    const langMeta = LANGUAGES.find(l => l.code === code)
    document.documentElement.dir = langMeta?.dir ?? 'ltr'
    document.documentElement.lang = code
  }

  const dismissFirstPick = () => {
    localStorage.setItem(STORAGE_KEY, lang)
    setIsFirstPick(false)
  }

  // Apply dir on mount
  useEffect(() => {
    const langMeta = LANGUAGES.find(l => l.code === lang)
    document.documentElement.dir = langMeta?.dir ?? 'ltr'
    document.documentElement.lang = lang
  }, [])

  const t = (key) => {
    const dict = TRANSLATIONS[lang] ?? TRANSLATIONS.en
    return dict[key] ?? TRANSLATIONS.en[key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isFirstPick, dismissFirstPick }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
