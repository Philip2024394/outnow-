import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import FeatureIntro, { useFeatureIntro } from '@/components/ui/FeatureIntro'
import styles from './SettingsSheet.module.css'
import pStyles from './PrivacySheet.module.css'

// Persist privacy prefs in localStorage — replaced by Firestore when backend is wired
function usePref(key, defaultValue) {
  const storageKey = `privacy_${key}`
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(storageKey)
    return stored !== null ? JSON.parse(stored) : defaultValue
  })
  const set = (v) => {
    localStorage.setItem(storageKey, JSON.stringify(v))
    setValue(v)
  }
  return [value, set]
}

function Toggle({ label, sublabel, icon, value, onChange, warning }) {
  return (
    <button
      className={`${styles.row} ${warning ? pStyles.warningRow : ''}`}
      onClick={() => onChange(!value)}
    >
      <span className={styles.rowIcon}>{icon}</span>
      <div className={styles.rowText}>
        <span className={styles.rowLabel}>{label}</span>
        {sublabel && <span className={styles.rowSub}>{sublabel}</span>}
      </div>
      <div className={`${styles.toggle} ${value ? styles.toggleOn : ''}`}>
        <div className={styles.toggleThumb} />
      </div>
    </button>
  )
}

export default function PrivacySheet({ open, onClose }) {
  const { show: showIntro, dismiss: dismissIntro } = useFeatureIntro('privacy_controls')

  // Privacy preferences — all default to the safer option
  const [wasOutVisible,   setWasOutVisible]   = usePref('was_out_visible',   false)
  const [hideFrequency,   setHideFrequency]   = usePref('hide_frequency',    true)
  const [photosInChat,    setPhotosInChat]     = usePref('photos_in_chat',    true)
  const [hideLastSeen,    setHideLastSeen]     = usePref('hide_last_seen',    true)
  const [showAreaOnly,    setShowAreaOnly]     = usePref('show_area_only',    true)

  return (
    <BottomSheet open={open} onClose={onClose} title="">
      {showIntro && (
        <FeatureIntro
          emoji="🔒"
          title="Your Privacy, Your Rules"
          bullets={[
            'You control exactly what other people can see about you',
            'Photos shared in a venue group chat never leave that room',
            'Your going-out frequency is never shown to anyone by default',
            'You can change any of these settings at any time',
          ]}
          onDone={dismissIntro}
        />
      )}

      <div className={styles.sheet}>
        <div className={styles.header}>
          <span className={styles.title}>Privacy Controls</span>
        </div>

        {/* Visibility */}
        <div className={styles.divider}><span className={styles.dividerLabel}>Visibility</span></div>

        <Toggle
          icon="📍"
          label="Show area only"
          sublabel="Other users see your general area — never your exact location"
          value={showAreaOnly}
          onChange={setShowAreaOnly}
        />
        <Toggle
          icon="🕐"
          label="Hide 'last seen out'"
          sublabel="Others won't see when you were last out or how recently"
          value={hideLastSeen}
          onChange={setHideLastSeen}
        />
        <Toggle
          icon="📊"
          label="Hide activity frequency"
          sublabel="Don't show how often you go out — keeps your lifestyle private"
          value={hideFrequency}
          onChange={setHideFrequency}
        />
        <Toggle
          icon="🟢"
          label="Show 'Was Out' on profile"
          sublabel="Let others see you were recently active — off by default"
          value={wasOutVisible}
          onChange={setWasOutVisible}
          warning={wasOutVisible}
        />

        {/* Chat & Photos */}
        <div className={styles.divider}><span className={styles.dividerLabel}>Chat & Photos</span></div>

        <Toggle
          icon="📸"
          label="Keep photos inside chats"
          sublabel="Photos you send in venue group chats stay in that room only — no forwarding or saving"
          value={photosInChat}
          onChange={setPhotosInChat}
        />

        {/* Info rows */}
        <div className={styles.divider}><span className={styles.dividerLabel}>How Your Data Is Used</span></div>

        <div className={pStyles.infoCard}>
          <span className={pStyles.infoIcon}>📡</span>
          <p className={pStyles.infoText}>
            Your location is only active when you press <strong>I'M OUT NOW</strong>. The moment your session ends, location tracking stops completely.
          </p>
        </div>

        <div className={pStyles.infoCard}>
          <span className={pStyles.infoIcon}>🗑️</span>
          <p className={pStyles.infoText}>
            Venue group chats auto-delete when the night ends. Photos, messages — everything gone. Nothing is stored long-term.
          </p>
        </div>

        <div className={pStyles.infoCard}>
          <span className={pStyles.infoIcon}>👁️</span>
          <p className={pStyles.infoText}>
            Only your first name and area are shown to other users. Your full profile is never visible until you choose to share it.
          </p>
        </div>

        <div className={styles.divider}><span className={styles.dividerLabel}>Cookies & Storage</span></div>

        <div className={pStyles.infoCard}>
          <span className={pStyles.infoIcon}>🍪</span>
          <p className={pStyles.infoText}>
            Hangger uses essential browser storage (cookies and localStorage) solely to keep you signed in and remember your app preferences. We do not use advertising, tracking, or analytics cookies. No data is sold or shared with third parties. By using Hangger you agree to this essential use of storage as part of our Terms of Service.
          </p>
        </div>
      </div>
    </BottomSheet>
  )
}
