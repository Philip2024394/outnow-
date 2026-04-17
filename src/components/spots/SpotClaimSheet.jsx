import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { checkPostcode, isProtected } from '@/services/spotService'
import { startCheckout } from '@/services/checkoutService'
import styles from './SpotClaimSheet.module.css'

const PLANS = [
  {
    id: 'personal',
    name: 'My Spot',
    icon: '👤',
    tagline: 'Claim your neighbourhood',
    monthly: { key: 'spot_user_monthly',  price: '$1.99', label: '$1.99/month' },
    annual:  { key: 'spot_user_annual',   price: '$19.99', label: '$19.99/year', saving: 'Save 2 months' },
    features: [
      'Your postcode — exclusively yours',
      'Round avatar pin permanently on the map',
      'No one can claim your area while active',
      '10 profile boosts included (annual only)',
      'Admin verified within 72 hours',
    ],
  },
  {
    id: 'business',
    name: 'Business Spot',
    icon: '🏪',
    tagline: 'Own your business location',
    badge: 'MOST POPULAR',
    monthly: { key: 'spot_business_monthly', price: '$1.99', label: '$1.99/month' },
    annual:  { key: 'spot_business_annual',  price: '$19.99', label: '$19.99/year', saving: 'Save 2 months' },
    features: [
      'Your business postcode — exclusively yours',
      'Pill badge pin with your category label',
      'Visible to every nearby user on the map',
      '10 profile boosts included (annual only)',
      'Admin verified — builds immediate buyer trust',
    ],
  },
]

export default function SpotClaimSheet({ open, onClose, showToast }) {
  const { user } = useAuth()
  const [postcode, setPostcode]     = useState('')
  const [checking, setChecking]     = useState(false)
  const [status, setStatus]         = useState(null)   // null | 'available' | 'taken' | 'protected'
  const [selectedPlan, setSelected] = useState('personal')
  const [billing, setBilling]       = useState('monthly') // 'monthly' | 'annual'
  const [paying, setPaying]         = useState(false)

  if (!open) return null

  async function handleCheck() {
    const code = postcode.trim()
    if (code.length < 3) return
    setChecking(true)
    setStatus(null)
    try {
      const protected_ = await isProtected(code)
      if (protected_) { setStatus('protected'); setChecking(false); return }
      const { available } = await checkPostcode(code)
      setStatus(available ? 'available' : 'taken')
    } catch (e) {
      showToast?.(e.message)
    } finally {
      setChecking(false)
    }
  }

  async function handleClaim() {
    if (paying) return
    setPaying(true)
    const plan = PLANS.find(p => p.id === selectedPlan)
    const priceKey = billing === 'annual' ? plan.annual.key : plan.monthly.key
    try {
      await startCheckout(priceKey, 'subscription', user?.id)
    } catch (e) {
      showToast?.(e.message ?? 'Payment unavailable — try again')
      setPaying(false)
    }
  }

  const plan    = PLANS.find(p => p.id === selectedPlan)
  const pricing = billing === 'annual' ? plan.annual : plan.monthly

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.mapIcon}>📍</div>
          <h2 className={styles.title}>Claim Your Map Spot</h2>
          <p className={styles.subtitle}>First come, first served — your postcode, yours forever</p>
        </div>

        {/* Postcode search */}
        <div className={styles.searchWrap}>
          <div className={styles.searchRow}>
            <input
              className={styles.input}
              placeholder="Enter postcode…"
              value={postcode}
              onChange={e => { setPostcode(e.target.value); setStatus(null) }}
              onKeyDown={e => e.key === 'Enter' && handleCheck()}
              maxLength={10}
            />
            <button
              className={styles.checkBtn}
              onClick={handleCheck}
              disabled={checking || postcode.trim().length < 3}
            >
              {checking ? '…' : 'Check'}
            </button>
          </div>
        </div>

        {/* Availability result */}
        {status === 'available' && (
          <div className={`${styles.result} ${styles.resultAvail}`}>
            <span className={styles.resultDot} />
            <div className={styles.resultText}>
              <p className={styles.resultTitle}>Available — claim it now</p>
              <p className={styles.resultSub}>{postcode.trim().toUpperCase()} is unclaimed. Be the first.</p>
            </div>
          </div>
        )}
        {status === 'taken' && (
          <div className={`${styles.result} ${styles.resultTaken}`}>
            <span className={styles.resultDot} />
            <div className={styles.resultText}>
              <p className={styles.resultTitle}>Already claimed</p>
              <p className={styles.resultSub}>Try a nearby postcode — every area needs only one owner.</p>
            </div>
          </div>
        )}
        {status === 'protected' && (
          <div className={`${styles.result} ${styles.resultProtected}`}>
            <span className={styles.resultDot} />
            <div className={styles.resultText}>
              <p className={styles.resultTitle}>Protected location</p>
              <p className={styles.resultSub}>Government, royal, and public buildings cannot be claimed.</p>
            </div>
          </div>
        )}

        {/* Plans + billing — shown only when available */}
        {status === 'available' && (
          <>
            {/* Billing toggle */}
            <div className={styles.billingToggle}>
              <button
                className={`${styles.billingBtn} ${billing === 'monthly' ? styles.billingBtnActive : ''}`}
                onClick={() => setBilling('monthly')}
              >
                Monthly
              </button>
              <button
                className={`${styles.billingBtn} ${billing === 'annual' ? styles.billingBtnActive : ''}`}
                onClick={() => setBilling('annual')}
              >
                Annual
                <span className={styles.billingBadge}>+10 boosts</span>
              </button>
            </div>

            {/* Annual savings callout */}
            {billing === 'annual' && (
              <div className={styles.savingsBanner}>
                <span className={styles.savingsIcon}>🎉</span>
                <span className={styles.savingsText}>Save 2 months + get <strong>10 free profile boosts</strong> — $19.99/year</span>
              </div>
            )}

            {/* Plan cards */}
            <p className={styles.plansTitle}>Choose your spot type</p>
            <div className={styles.plans}>
              {PLANS.map(p => {
                const px = billing === 'annual' ? p.annual : p.monthly
                return (
                  <button
                    key={p.id}
                    className={`${styles.planCard} ${selectedPlan === p.id ? styles.planCardSelected : ''}`}
                    onClick={() => setSelected(p.id)}
                  >
                    <div className={styles.planTop}>
                      <div className={styles.planLeft}>
                        <div className={styles.planRadio}>
                          {selectedPlan === p.id && <div className={styles.planRadioDot} />}
                        </div>
                        <span className={styles.planIcon}>{p.icon}</span>
                        <div>
                          <div className={styles.planName}>{p.name}</div>
                          <div className={styles.planTagline}>{p.tagline}</div>
                        </div>
                        {p.badge && <span className={styles.planBadge}>{p.badge}</span>}
                      </div>
                      <div className={styles.planPricing}>
                        <span className={styles.planPrice}>{px.price}</span>
                        <span className={styles.planPeriod}>{billing === 'annual' ? '/yr' : '/mo'}</span>
                        {billing === 'annual' && (
                          <span className={styles.planSaving}>{p.annual.saving}</span>
                        )}
                      </div>
                    </div>
                    <ul className={styles.planFeatures}>
                      {p.features.map((f, i) => (
                        <li key={i} className={`${styles.planFeature} ${f.includes('annual only') && billing === 'monthly' ? styles.planFeatureDim : ''}`}>
                          <span className={styles.planTick}>{f.includes('annual only') && billing === 'monthly' ? '–' : '✓'}</span>
                          {f.replace(' (annual only)', billing === 'annual' ? '' : ' (annual plan)')}
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>

            {/* Postcode pill */}
            <div className={styles.postcodePill}>
              <span className={styles.postcodePillPin}>📍</span>
              <div className={styles.postcodePillText}>
                Your spot: <span className={styles.postcodePillCode}>{postcode.trim().toUpperCase()}</span>
              </div>
            </div>

            <button className={styles.ctaBtn} onClick={handleClaim} disabled={paying}>
              {paying
                ? 'Redirecting to checkout…'
                : `Claim ${postcode.trim().toUpperCase()} — ${pricing.label}`}
            </button>
            <p className={styles.ctaSub}>
              {billing === 'annual'
                ? 'Billed once yearly · Cancel anytime · Pin live immediately'
                : 'Billed monthly · Cancel anytime · Pin live immediately'}
            </p>
          </>
        )}

        {status === 'protected' && (
          <div className={styles.protectedNotice}>
            <p>Government buildings, royal estates, airports, and public landmarks are preserved as neutral zones on the Indoo map.</p>
          </div>
        )}

      </div>
    </div>
  )
}
