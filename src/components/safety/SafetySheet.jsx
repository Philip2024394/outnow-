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

const PLATFORMS = [
  { id: 'whatsapp',  label: 'WhatsApp',  emoji: '💬' },
  { id: 'sms',       label: 'SMS',        emoji: '📱' },
  { id: 'imessage',  label: 'iMessage',   emoji: '💬' },
  { id: 'telegram',  label: 'Telegram',   emoji: '✈️' },
  { id: 'signal',    label: 'Signal',     emoji: '🔒' },
  { id: 'wechat',    label: 'WeChat',     emoji: '🟢' },
]

export default function SafetySheet({ open, onClose, onSave }) {
  const { show: showIntro, dismiss: dismissIntro } = useFeatureIntro('safety_checkin')
  const existing = getSafetyContact()

  const [name,       setName]       = useState(existing?.name       ?? '')
  const [phone,      setPhone]      = useState(existing?.phone      ?? existing?.contact ?? '')
  const [platform,   setPlatform]   = useState(existing?.platform   ?? 'whatsapp')
  const [smsBackup,  setSmsBackup]  = useState(existing?.smsBackup  ?? true)
  const [saved,      setSaved]      = useState(!!existing)
  const [error,      setError]      = useState(null)

  const handleSave = () => {
    if (!name.trim())  { setError('Add a name for your contact'); return }
    if (!phone.trim()) { setError('Add their phone number'); return }
    saveSafetyContact({ name: name.trim(), phone: phone.trim(), platform, smsBackup, contact: phone.trim() })
    setSaved(true)
    setError(null)
    onSave?.()
  }

  const handleClear = () => {
    clearSafetyContact()
    setName(''); setPhone(''); setPlatform('whatsapp'); setSmsBackup(true); setSaved(false)
  }

  const savedData = getSafetyContact()
  const pl = PLATFORMS.find(p => p.id === (savedData?.platform ?? 'whatsapp'))

  return (
    <BottomSheet open={open} onClose={onClose} title="">
      {showIntro && (
        <FeatureIntro
          emoji="🛡️"
          title="Your Safety Net"
          bullets={[
            'Add one trusted person — a friend, family member, anyone you trust',
            'When you go live they\'ll know you\'re out and which area you\'re in',
            'One tap "Alert My Contact" sends them a help message with your venue',
            'SMS backup means it works even without internet — always there for you',
          ]}
          onDone={dismissIntro}
        />
      )}

      <div className={styles.sheet}>
        <div className={styles.header}>
          <span className={styles.headerEmoji}>🛡️</span>
          <div>
            <h2 className={styles.title}>Your Safety Net</h2>
            <p className={styles.sub}>Set once — always there when you need it</p>
          </div>
        </div>

        {saved && savedData ? (
          <div className={styles.activeCard}>
            <div className={styles.activeTop}>
              <span className={styles.activeDot} />
              <span className={styles.activeLabel}>Safety Net Active</span>
            </div>
            <div className={styles.activeContact}>
              <span className={styles.activeEmoji}>{pl?.emoji ?? '📱'}</span>
              <div className={styles.activeInfo}>
                <span className={styles.activeName}>{savedData.name}</span>
                <span className={styles.activeMeta}>{pl?.label}{savedData.smsBackup && platform !== 'sms' ? ' + SMS backup' : ''} · {savedData.phone}</span>
              </div>
            </div>
            <div className={styles.activeFeatures}>
              <div className={styles.activeFeat}>
                <span>✅</span>
                <span>Goes live check-in sent to {savedData.name}</span>
              </div>
              <div className={styles.activeFeat}>
                <span>✅</span>
                <span>One-tap alert with venue + area on SOS</span>
              </div>
              {savedData.smsBackup && savedData.platform !== 'sms' && (
                <div className={styles.activeFeat}>
                  <span>✅</span>
                  <span>SMS backup — works offline too</span>
                </div>
              )}
            </div>
            <p className={styles.activeNote}>
              This is a one-time setup. Your safety net is always active whenever you go out.
            </p>
            <button className={styles.changeBtn} onClick={() => setSaved(false)}>Edit contact</button>
            <button className={styles.removeBtn} onClick={handleClear}>Remove safety net</button>
          </div>
        ) : (
          <>
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Trusted contact name</label>
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
                <label className={styles.label}>Alert them via</label>
                <div className={styles.platformGrid}>
                  {PLATFORMS.map(p => (
                    <button
                      key={p.id}
                      className={`${styles.platformBtn} ${platform === p.id ? styles.platformBtnActive : ''}`}
                      onClick={() => setPlatform(p.id)}
                    >
                      <span className={styles.platformEmoji}>{p.emoji}</span>
                      <span className={styles.platformLabel}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  {platform === 'telegram' ? 'Telegram phone or username' : 'Their phone number'}
                </label>
                <input
                  className={styles.input}
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(null) }}
                  placeholder={platform === 'telegram' ? '@username or +44 7700 000000' : '+44 7700 000000'}
                  autoComplete="off"
                  inputMode="tel"
                />
              </div>

              {/* SMS backup toggle — only shown when non-SMS platform selected */}
              {platform !== 'sms' && (
                <div className={styles.backupRow}>
                  <div className={styles.backupText}>
                    <span className={styles.backupTitle}>📱 SMS backup</span>
                    <span className={styles.backupSub}>Also send via SMS — works offline and without internet</span>
                  </div>
                  <button
                    className={`${styles.toggle} ${smsBackup ? styles.toggleOn : ''}`}
                    onClick={() => setSmsBackup(v => !v)}
                  >
                    <div className={styles.toggleThumb} />
                  </button>
                </div>
              )}

              {platform === 'wechat' && (
                <p className={styles.wechatNote}>
                  ⚠️ WeChat doesn't support pre-filled messages — SOS will open the app but you'll need to find your contact. SMS backup is recommended.
                </p>
              )}

              {error && <p className={styles.error}>{error}</p>}
            </div>

            <div className={styles.infoCards}>
              <div className={styles.infoCard}>
                <span>🆘</span>
                <p>SOS sends one-tap help alert with your venue name and area — never your exact GPS coordinates</p>
              </div>
              <div className={styles.infoCard}>
                <span>🔒</span>
                <p>One-time setup — your safety net stays active every time you go out, no need to set it again</p>
              </div>
            </div>

            <button className={styles.saveBtn} onClick={handleSave}>
              Activate Safety Net 🛡️
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
