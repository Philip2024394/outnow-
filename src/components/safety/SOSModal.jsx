import { useState } from 'react'
import { getSafetyContact } from './SafetySheet'
import styles from './SOSModal.module.css'

// Deep link builders per platform
function buildLink(platform, phone, message) {
  const encoded = encodeURIComponent(message)
  switch (platform) {
    case 'whatsapp':  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encoded}`
    case 'sms':       return `sms:${phone}?body=${encoded}`
    case 'imessage':  return `sms:${phone}&body=${encoded}`
    case 'telegram':  return `https://t.me/${phone.replace(/\D/g, '')}?text=${encoded}`
    case 'signal':    return `sms:${phone}?body=${encoded}` // Signal intercepts SMS on Android
    case 'wechat':    return `weixin://` // WeChat has no public deep link for pre-filled messages
    default:          return `sms:${phone}?body=${encoded}`
  }
}

export default function SOSModal({ open, onClose, session }) {
  const [confirmed, setConfirmed] = useState(false)
  const contact = getSafetyContact()

  if (!open) return null

  const venueName = session?.placeName ?? 'a nearby venue'
  const area      = session?.area ?? 'my current location'
  const message   = `🆘 I need help! I'm at ${venueName}, ${area}. Please check on me immediately. I'm using IMOUTNOW.`

  const handleSend = () => {
    if (!contact) return
    setConfirmed(true)
    const link = buildLink(contact.platform ?? 'sms', contact.phone ?? contact.contact, message)
    setTimeout(() => {
      window.open(link, '_blank')
      setTimeout(() => { setConfirmed(false); onClose() }, 1500)
    }, 600)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${confirmed ? styles.modalSent : ''}`} onClick={e => e.stopPropagation()}>

        {!confirmed ? (
          <>
            <div className={styles.iconWrap}>
              <span className={styles.icon}>🆘</span>
            </div>

            <h1 className={styles.title}>Request Help?</h1>
            <p className={styles.sub}>This will send an emergency message to your trusted contact.</p>

            {contact ? (
              <div className={styles.contactCard}>
                <span className={styles.contactIcon}>{platformEmoji(contact.platform)}</span>
                <div className={styles.contactInfo}>
                  <span className={styles.contactName}>{contact.name}</span>
                  <span className={styles.contactPlatform}>{platformLabel(contact.platform)} · {contact.phone ?? contact.contact}</span>
                </div>
              </div>
            ) : (
              <div className={styles.noContact}>
                ⚠️ No trusted contact set. Add one in Settings → Safety Check-In first.
              </div>
            )}

            <div className={styles.messagePreview}>
              <span className={styles.messageLabel}>Message that will be sent:</span>
              <p className={styles.messageText}>{message}</p>
            </div>

            <button
              className={styles.confirmBtn}
              onClick={handleSend}
              disabled={!contact}
            >
              ✅ Yes — Send Help Request
            </button>

            <button className={styles.cancelBtn} onClick={onClose}>
              Cancel — I'm OK
            </button>
          </>
        ) : (
          <div className={styles.sentWrap}>
            <span className={styles.sentIcon}>✅</span>
            <h2 className={styles.sentTitle}>Help Requested</h2>
            <p className={styles.sentSub}>Opening {platformLabel(contact?.platform)} to send your message to {contact?.name}.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function platformEmoji(p) {
  const map = { whatsapp: '💬', sms: '📱', imessage: '💬', telegram: '✈️', signal: '🔒', wechat: '🟢' }
  return map[p] ?? '📱'
}

function platformLabel(p) {
  const map = { whatsapp: 'WhatsApp', sms: 'SMS', imessage: 'iMessage', telegram: 'Telegram', signal: 'Signal', wechat: 'WeChat' }
  return map[p] ?? 'SMS'
}
