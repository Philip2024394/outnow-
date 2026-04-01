import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import FeatureIntro, { useFeatureIntro } from '@/components/ui/FeatureIntro'
import styles from './SafetySheet.module.css'

const STORAGE_KEY = 'safety_contact'

export function getSafetyContact() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

export function saveSafetyContact(contact) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contact))
}

export function clearSafetyContact() {
  localStorage.removeItem(STORAGE_KEY)
}

export default function SafetySheet({ open, onClose }) {
  const { show: showIntro, dismiss: dismissIntro } = useFeatureIntro('safety_checkin')
  const existing = getSafetyContact()

  const [name,    setName]    = useState(existing?.name    ?? '')
  const [contact, setContact] = useState(existing?.contact ?? '')
  const [saved,   setSaved]   = useState(!!existing)
  const [error,   setError]   = useState(null)

  const handleSave = () => {
    if (!name.trim())    { setError('Add a name for your contact'); return }
    if (!contact.trim()) { setError('Add a phone number or email'); return }
    saveSafetyContact({ name: name.trim(), contact: contact.trim() })
    setSaved(true)
    setError(null)
  }

  const handleClear = () => {
    clearSafetyContact()
    setName('')
    setContact('')
    setSaved(false)
  }

  const isEmail = contact.includes('@')

  return (
    <BottomSheet open={open} onClose={onClose} title="">
      {showIntro && (
        <FeatureIntro
          emoji="🛡️"
          title="Safety Check-In"
          bullets={[
            'Add a trusted person — a friend, family member, anyone you trust',
            'When you go live, they get a message so they know you\'re out',
            'When your session ends safely, they\'re notified you\'re home',
            'Your exact location is never shared — only that you\'re out and safe',
          ]}
          onDone={dismissIntro}
        />
      )}

      <div className={styles.sheet}>
        <div className={styles.header}>
          <span className={styles.headerEmoji}>🛡️</span>
          <div>
            <h2 className={styles.title}>Safety Check-In</h2>
            <p className={styles.sub}>Someone who knows you're out</p>
          </div>
        </div>

        {saved && existing ? (
          <div className={styles.savedCard}>
            <div className={styles.savedInfo}>
              <span className={styles.savedIcon}>✅</span>
              <div>
                <span className={styles.savedName}>{existing.name}</span>
                <span className={styles.savedContact}>{existing.contact}</span>
              </div>
            </div>
            <p className={styles.savedNote}>
              {isEmail
                ? `${existing.name} will receive an email when you go live and when you end your session safely.`
                : `${existing.name} will receive an SMS when you go live and when you end your session safely.`
              }
            </p>
            <button className={styles.changeBtn} onClick={() => setSaved(false)}>Change contact</button>
            <button className={styles.removeBtn} onClick={handleClear}>Remove</button>
          </div>
        ) : (
          <>
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Their name</label>
                <input
                  className={styles.input}
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(null) }}
                  placeholder="Mum, Best friend, Flatmate…"
                  autoComplete="off"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Phone number or email</label>
                <input
                  className={styles.input}
                  type="text"
                  value={contact}
                  onChange={e => { setContact(e.target.value); setError(null) }}
                  placeholder="+44 7700 000000 or email@example.com"
                  autoComplete="off"
                  inputMode="email"
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}
            </div>

            <div className={styles.infoCards}>
              <div className={styles.infoCard}>
                <span>📡</span>
                <p>They never see your exact location — only that you're out and which area</p>
              </div>
              <div className={styles.infoCard}>
                <span>🔕</span>
                <p>They only get two messages per outing — one when you go live, one when you finish</p>
              </div>
            </div>

            <button className={styles.saveBtn} onClick={handleSave}>
              Save Contact
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
