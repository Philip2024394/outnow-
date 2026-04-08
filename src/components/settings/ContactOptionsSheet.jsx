import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { saveContactOptions } from '@/services/profileService'
import { getMyContactNumber } from '@/services/contactUnlockService'
import { getPlatform } from '@/constants/messagingPlatforms'
import PlatformPicker from '@/components/ui/PlatformPicker'
import styles from './ContactOptionsSheet.module.css'

const MAKER_TIERS = ['listing', 'premium', 'business', 'pro', 'vip']

/**
 * Full-page overlay for business users to configure their contact options.
 * Embedded inside SettingsSheet (same pattern as VerifiedPage).
 */
export default function ContactOptionsSheet({ onBack, showToast }) {
  const { userProfile, user } = useAuth()

  const isPaid = MAKER_TIERS.includes(userProfile?.tier?.toLowerCase())

  // Load saved values from profile
  const [chatEnabled,     setChatEnabled]     = useState(userProfile?.chatEnabled ?? true)
  const [contactPlatform, setContactPlatform] = useState(userProfile?.contactPlatform ?? '')
  // contact_number lives in private_contacts — fetched separately on open
  const [contactNumber,   setContactNumber]   = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty,  setDirty]  = useState(false)

  useEffect(() => {
    setChatEnabled(userProfile?.chatEnabled ?? true)
    setContactPlatform(userProfile?.contactPlatform ?? '')
    setDirty(false)
  }, [userProfile])

  // Fetch user's own contact number from private_contacts on open
  useEffect(() => {
    if (!user?.id) return
    getMyContactNumber(user.id).then(num => setContactNumber(num ?? ''))
  }, [user?.id])

  const selectedPlatform = getPlatform(contactPlatform)


  function handleNumberChange(val) {
    setContactNumber(val)
    setDirty(true)
  }

  function handleChatToggle() {
    if (!isPaid) {
      showToast?.('Upgrade your plan to enable in-app chat.', 'info')
      return
    }
    setChatEnabled(v => !v)
    setDirty(true)
  }

  async function handleSave() {
    if (!contactPlatform && contactNumber.trim()) {
      showToast?.('Select a messaging platform first.', 'info')
      return
    }
    setSaving(true)
    try {
      await saveContactOptions(user?.id, {
        contactPlatform: contactPlatform || null,
        contactNumber:   contactNumber.trim() || null,
        chatEnabled,
      })
      setDirty(false)
      showToast?.('Contact options saved.', 'success')
    } catch {
      showToast?.('Could not save. Try again.', 'error')
    }
    setSaving(false)
  }

  async function handleDelete() {
    setSaving(true)
    try {
      await saveContactOptions(user?.id, {
        contactPlatform: null,
        contactNumber:   null,
        chatEnabled,
      })
      setContactPlatform('')
      setContactNumber('')
      setDirty(false)
      showToast?.('Contact number removed.', 'success')
    } catch {
      showToast?.('Could not remove. Try again.', 'error')
    }
    setSaving(false)
  }

  const hasContact = !!contactNumber.trim()

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.title}>Contact Options</span>
        <div style={{ width: 36 }} />
      </div>

      <div className={styles.body}>
        {/* In-app chat */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>In-App Chat</div>
          <div className={styles.row}>
            <div className={styles.rowText}>
              <span className={styles.rowTitle}>Enable chat</span>
              <span className={styles.rowSub}>
                {isPaid ? 'Users can message you directly in the app' : 'Requires a paid maker plan'}
              </span>
            </div>
            <button
              className={`${styles.toggle} ${chatEnabled && isPaid ? styles.toggleOn : ''} ${!isPaid ? styles.toggleLocked : ''}`}
              onClick={handleChatToggle}
              aria-label="Toggle in-app chat"
            >
              <div className={styles.toggleThumb} />
            </button>
          </div>
          {!isPaid && (
            <div className={styles.gateNote}>
              <span>🔒</span>
              <span>Upgrade to a paid maker plan to enable in-app chat</span>
            </div>
          )}
        </div>

        {/* Direct contact number */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Direct Contact</div>
          <div className={styles.sectionDesc}>
            Give buyers a way to reach you directly. They tap your number to open the app — only unlocked users can see it.
          </div>

          {/* Platform selector — inline horizontal strip */}
          <div className={styles.fieldLabel}>Messaging platform</div>
          <PlatformPicker
            selected={contactPlatform}
            onSelect={id => { setContactPlatform(id); setDirty(true) }}
          />

          {/* Number / handle input */}
          <div className={styles.fieldLabel} style={{ marginTop: 14 }}>
            Number or handle
          </div>
          <input
            className={styles.input}
            type="text"
            placeholder={selectedPlatform?.hint ?? 'e.g. +44 7700 900123 or @username'}
            value={contactNumber}
            onChange={e => handleNumberChange(e.target.value)}
            maxLength={120}
          />

          {/* Preview */}
          {selectedPlatform && contactNumber.trim() && (
            <div className={styles.preview}>
              <span className={styles.previewLabel}>Preview — how buyers see it:</span>
              <div className={styles.contactBadge}>
                <span
                  className={styles.badgeIcon}
                  style={{ background: selectedPlatform.color, color: selectedPlatform.textColor }}
                >
                  {selectedPlatform.abbr}
                </span>
                <div className={styles.badgeInfo}>
                  <span className={styles.badgePlatform}>{selectedPlatform.label}</span>
                  <span className={styles.badgeNumber}>{contactNumber}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {hasContact && (
            <button className={styles.deleteBtn} onClick={handleDelete} disabled={saving}>
              Remove contact number
            </button>
          )}
        </div>

        {/* Backend gate note */}
        <p className={styles.footNote}>
          Contact numbers are encrypted at rest and only revealed after payment is confirmed server-side. Backend endpoint: <code>POST /contact-unlock/reveal</code> validates the unlock record before returning the number.
        </p>
      </div>

    </div>
  )
}
