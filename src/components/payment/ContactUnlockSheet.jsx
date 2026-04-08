import { useState, useEffect } from 'react'
import { initiateContactUnlock, getContactUnlock } from '@/services/contactUnlockService'
import { sendMeetRequest } from '@/services/meetService'
import { getUnlockPrice } from '@/utils/unlockPrice'
import { useAuth } from '@/hooks/useAuth'
import { getPlatform, getPlatformLink } from '@/constants/messagingPlatforms'
import styles from './ContactUnlockSheet.module.css'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const DEMO_CONTACT = {
  whatsapp: '+62 812 3456 7890',
  phone: '+62 812 3456 7890',
  contactPlatform: 'whatsapp',
  contactNumber: '+62 812 3456 7890',
}

export default function ContactUnlockSheet({ open, session, buyerUserId, buyerCountry, onClose }) {
  const { user } = useAuth()
  const [step, setStep]       = useState('confirm') // confirm | loading | revealed | messaged
  const [contact, setContact] = useState(null)
  const [copied, setCopied]   = useState(false)

  const price = getUnlockPrice(buyerCountry)
  const isSameCountry = (buyerCountry ?? '').toLowerCase().trim() === (session?.country ?? '').toLowerCase().trim()
  const sellerActivated = !!session?.tier

  async function handleAutoMessage() {
    try {
      await sendMeetRequest(
        { id: user?.id, displayName: user?.displayName ?? null, photoURL: user?.photoURL ?? null },
        session.userId, session.id
      )
    } catch { /* silent — demo always succeeds */ }
    setStep('messaged')
  }

  // Check existing unlock on open
  useEffect(() => {
    if (!open || !session || !buyerUserId) return
    setStep('confirm')
    setContact(null)

    // Same country + activated — reveal contact for free immediately
    if (isSameCountry && sellerActivated) {
      getContactUnlock(buyerUserId, session.userId).then(result => {
        if (result.unlocked) {
          setContact({ contactNumber: result.contactNumber, contactPlatform: result.contactPlatform })
          setStep('revealed')
        } else if (DEMO_MODE) {
          setContact(DEMO_CONTACT)
          setStep('revealed')
        }
        // else: production — no unlock record yet, stay on confirm
      }).catch(() => {
        if (DEMO_MODE) {
          setContact(DEMO_CONTACT)
          setStep('revealed')
        }
        // else: production — RPC error, stay on confirm
      })
      return
    }

    // Same country + not activated — stay on confirm, buyer taps button to send message
    if (isSameCountry) return

    // Different country — check if already paid
    getContactUnlock(buyerUserId, session.userId).then(result => {
      if (result.unlocked) {
        setContact({ contactNumber: result.contactNumber, contactPlatform: result.contactPlatform })
        setStep('revealed')
      }
    })
  }, [open, session, buyerUserId, isSameCountry, sellerActivated])

  // Demo payment success event — only active in demo mode
  useEffect(() => {
    if (!DEMO_MODE) return
    const handler = (e) => {
      if (e.detail?.sellerUserId === session?.userId) {
        setContact(DEMO_CONTACT)
        setStep('revealed')
      }
    }
    window.addEventListener('demo:contact-unlock-success', handler)
    return () => window.removeEventListener('demo:contact-unlock-success', handler)
  }, [session])

  if (!open || !session) return null

  const brandName      = session.brandName ?? session.displayName ?? 'Seller'
  const sessionPlatform = getPlatform(session.contactPlatform ?? 'whatsapp')
  const platformLabel   = sessionPlatform?.label ?? 'contact'

  async function handlePay() {
    setStep('loading')
    try {
      await initiateContactUnlock({
        buyerUserId,
        sellerUserId: session.userId,
        sessionId: session.id,
        stripeAmount: price.stripeAmount,
        stripeCurrency: price.stripeCurrency,
      })
      // Real Stripe: page redirects. Demo: event fires, step set to revealed above.
    } catch {
      setStep('confirm')
    }
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Resolve platform — prefer new contact_platform field, fall back to 'whatsapp'
  const platformId = contact?.contactPlatform ?? 'whatsapp'
  const platform   = getPlatform(platformId)
  const number     = contact?.contactNumber ?? ''
  const deepLink   = getPlatformLink(platformId, number)

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} onClick={onClose} />

        {/* Seller preview */}
        <div className={styles.sellerRow}>
          {session.photoURL
            ? <img src={session.photoURL} alt={brandName} className={styles.sellerPhoto} />
            : <div className={styles.sellerPhotoFallback}>{brandName[0]}</div>
          }
          <div className={styles.sellerInfo}>
            <span className={styles.sellerName}>{brandName}</span>
            <span className={styles.sellerCity}>{session.city ?? session.area}</span>
          </div>
          {session.isVerified && (
            <span className={styles.verifiedBadge} title="Verified Seller">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#F5C518" stroke="#F5C518" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </span>
          )}
        </div>

        {step === 'confirm' && (
          <>
            {isSameCountry ? (
              <>
                <div className={styles.freeBlock}>
                  <span className={styles.freeIcon}>🤝</span>
                  <span className={styles.freeLabel}>Free Local Contact</span>
                  <span className={styles.freeSub}>You're both in {session.country} — connect for free</span>
                </div>
                <div className={styles.includes}>
                  <div className={styles.includeRow}><span>📱</span><span>{platformLabel} — contact direct</span></div>
                  <div className={styles.includeRow}><span>💬</span><span>Chat and buy direct, no commission</span></div>
                  <div className={styles.includeRow}><span>🌍</span><span>Support local sellers in your area</span></div>
                </div>
                <button className={styles.payBtn} onClick={sellerActivated ? () => { if (DEMO_MODE) { setContact(DEMO_CONTACT); setStep('revealed') } } : handleAutoMessage}>
                  Connect Now — Free
                </button>
                <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              </>
            ) : (
              <>
                <div className={styles.priceBlock}>
                  <span className={styles.priceAmount}>{price.display}</span>
                  <span className={styles.priceLabel}>one-time contact unlock</span>
                </div>
                <div className={styles.includes}>
                  <div className={styles.includeRow}><span>📱</span><span>{platformLabel} — contact direct</span></div>
                  <div className={styles.includeRow}><span>💬</span><span>Buy direct, no platform commission</span></div>
                  <div className={styles.includeRow}><span>🔒</span><span>Secure payment via Stripe</span></div>
                </div>
                <button className={styles.payBtn} onClick={handlePay}>
                  Unlock Contact — {price.display}
                </button>
                <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                <p className={styles.note}>One-time fee. No subscription. No recurring charge.</p>
              </>
            )}
          </>
        )}

        {step === 'loading' && (
          <div className={styles.loadingBlock}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Opening secure payment…</p>
          </div>
        )}

        {step === 'revealed' && contact && (
          <>
            <div className={styles.successBadge}>{isSameCountry ? '🤝 Free Local Contact' : '✓ Contact Unlocked'}</div>

            <div className={styles.contactCard}>
              {platform && (
                <span
                  className={styles.contactIcon}
                  style={{ background: platform.color, color: platform.textColor,
                    width: 36, height: 36, borderRadius: 9, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, letterSpacing: -0.5, flexShrink: 0 }}
                >
                  {platform.abbr}
                </span>
              )}
              <div className={styles.contactInfo}>
                <span className={styles.contactLabel}>{platform?.label ?? 'Contact'}</span>
                <span className={styles.contactNumber}>{number || 'Not provided'}</span>
              </div>
              <button className={styles.copyBtn} onClick={() => handleCopy(number)}>
                {copied ? '✓' : 'Copy'}
              </button>
            </div>

            {deepLink && (
              <a
                href={deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.waBtn}
                style={platform ? { background: platform.color, color: platform.textColor } : {}}
              >
                Open {platform?.label ?? 'App'}
              </a>
            )}

            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </>
        )}

        {step === 'messaged' && (
          <>
            <div className={styles.successBadge}>📩 Message Sent</div>
            <div className={styles.messagedBlock}>
              <p className={styles.messagedText}>
                We've let <strong>{brandName}</strong> know you want to connect. You'll hear back soon.
              </p>
            </div>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </>
        )}
      </div>
    </div>
  )
}
