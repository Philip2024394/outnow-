import { useState, useEffect } from 'react'
import { initiateContactUnlock, getContactUnlock } from '@/services/contactUnlockService'
import { sendMeetRequest } from '@/services/meetService'
import { getUnlockPrice } from '@/utils/unlockPrice'
import { useAuth } from '@/hooks/useAuth'
import styles from './ContactUnlockSheet.module.css'

const DEMO_CONTACT = { whatsapp: '+62 812 3456 7890', phone: '+62 812 3456 7890' }

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
          setContact({ whatsapp: result.whatsapp, phone: result.phone })
        } else {
          setContact(DEMO_CONTACT)
        }
        setStep('revealed')
      }).catch(() => {
        setContact(DEMO_CONTACT)
        setStep('revealed')
      })
      return
    }

    // Same country + not activated — stay on confirm, buyer taps button to send message
    if (isSameCountry) return

    // Different country — check if already paid
    getContactUnlock(buyerUserId, session.userId).then(result => {
      if (result.unlocked) {
        setContact({ whatsapp: result.whatsapp, phone: result.phone })
        setStep('revealed')
      }
    })
  }, [open, session, buyerUserId, isSameCountry, sellerActivated])

  // Demo payment success event
  useEffect(() => {
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

  const brandName = session.brandName ?? session.displayName ?? 'Seller'

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

  const waNumber = contact?.whatsapp?.replace(/\D/g, '')

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
                  <div className={styles.includeRow}><span>📱</span><span>WhatsApp number — contact direct</span></div>
                  <div className={styles.includeRow}><span>💬</span><span>Chat and buy direct, no commission</span></div>
                  <div className={styles.includeRow}><span>🌍</span><span>Support local sellers in your area</span></div>
                </div>
                <button className={styles.payBtn} onClick={sellerActivated ? () => { setContact(DEMO_CONTACT); setStep('revealed') } : handleAutoMessage}>
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
                  <div className={styles.includeRow}><span>📱</span><span>WhatsApp number — contact direct</span></div>
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
              <span className={styles.contactIcon}>📱</span>
              <div className={styles.contactInfo}>
                <span className={styles.contactLabel}>WhatsApp</span>
                <span className={styles.contactNumber}>{contact.whatsapp ?? contact.phone ?? 'Not provided'}</span>
              </div>
              <button className={styles.copyBtn} onClick={() => handleCopy(contact.whatsapp ?? contact.phone ?? '')}>
                {copied ? '✓' : 'Copy'}
              </button>
            </div>

            {waNumber && (
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.waBtn}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.529 5.85L.057 23.571a.5.5 0 0 0 .372.615l5.857-1.537A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.953 9.953 0 0 1-5.09-1.392l-.364-.215-3.48.912.928-3.39-.236-.38A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Open WhatsApp
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
