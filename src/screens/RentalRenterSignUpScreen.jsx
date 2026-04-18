/**
 * RentalRenterSignUpScreen — sign up / sign in for rental renters.
 * Same auth system as marketplace (phone + password via Supabase).
 * One-time unlock — stays signed in until app uninstall.
 */
import { useState } from 'react'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import styles from './RentalRenterSignUpScreen.module.css'

const MARKET_LOGO = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdsd-removebg-preview.png'
const BG_IMAGE = 'https://ik.imagekit.io/nepgaxllc/Untitledsdfasdfdddfsdfsdsdfsdfadsasda.png?updatedAt=1776095672208'

const RENTAL_INTERESTS = [
  { id: 'motorcycles', label: 'Motorcycles',      img: 'https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237', desc: 'Matic, sport, trail, classic & cruiser bikes', items: ['Matic', 'Sport', 'Trail', 'Classic', 'Adventure'] },
  { id: 'cars',        label: 'Cars',             img: 'https://ik.imagekit.io/nepgaxllc/Sporty%20green%20and%20black%20hatchback.png?updatedAt=1775634925566', desc: 'City cars, MPV, SUV, sedan — with or without driver', items: ['City Car', 'MPV', 'SUV', 'Sedan', 'Van', 'Premium'] },
  { id: 'trucks',      label: 'Trucks',           img: 'https://ik.imagekit.io/nepgaxllc/asdasdasssss-removebg-preview.png', desc: 'Pickup, box truck, flatbed for cargo & moving', items: ['Pickup', 'Box Truck', 'Flatbed', 'Double Cab'] },
  { id: 'property',    label: 'Property',         img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2001_31_24%20AM.png', desc: 'Villas, kos, apartments — daily to monthly', items: ['Villa', 'Kos', 'Apartment', 'Room', 'House'] },
  { id: 'fashion',     label: 'Fashion',          img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2001_44_22%20AM.png', desc: 'Kebaya, suits, gowns for weddings & events', items: ['Kebaya', 'Suit', 'Wedding Gown', 'Batik Set'] },
  { id: 'electronics', label: 'Electronics',      emoji: '📷', desc: 'Cameras, laptops, projectors, drones', items: ['DSLR', 'Laptop', 'Projector', 'Drone', 'GoPro'] },
  { id: 'audio',       label: 'Audio & Sound',    img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2001_50_12%20AM.png', desc: 'PA systems, DJ setup, speakers for events', items: ['PA System', 'DJ Setup', 'Speaker', 'Wireless Mic'] },
  { id: 'party',       label: 'Party & Event',    img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2001_29_12%20AM.png', desc: 'Tents, stages, tables, decor for any occasion', items: ['Tent', 'Stage', 'Table Set', 'Lighting', 'Decor'] },
]

export default function RentalRenterSignUpScreen({ open, onClose, onComplete }) {
  const { user } = useAuth()
  const [step, setStep] = useState('account') // account | interests | done
  const [phoneNum, setPhoneNum] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isLogin, setIsLogin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [interests, setInterests] = useState([])
  const [city, setCity] = useState('')

  if (!open) return null

  const phoneValid = phoneNum.replace(/\D/g, '').length >= 10
  const passwordValid = password.length >= 6
  const passwordsMatch = password === confirmPassword

  const toggleInterest = (id) => {
    setInterests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleAuth = async () => {
    setAuthError('')
    if (!phoneValid) { setAuthError('Enter a valid phone number (10+ digits)'); return }
    if (!passwordValid) { setAuthError('Password must be at least 6 characters'); return }
    if (!isLogin && !passwordsMatch) { setAuthError('Passwords do not match'); return }

    setSaving(true)
    const cleanPhone = phoneNum.replace(/\D/g, '').replace(/^0/, '62')
    const fakeEmail = `${cleanPhone}@indoo.market`

    if (supabase) {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password })
        if (error) {
          setAuthError(error.message === 'Invalid login credentials' ? 'Wrong phone number or password' : error.message)
          setSaving(false)
          return
        }
        // Existing user — mark as rental unlocked and done
        const existing = JSON.parse(localStorage.getItem('indoo_profile') || '{}')
        existing.rentalUnlocked = true
        localStorage.setItem('indoo_profile', JSON.stringify(existing))
        setSaving(false)
        setStep('done')
        return
      } else {
        const { error } = await supabase.auth.signUp({
          email: fakeEmail,
          password,
          options: { data: { phone: cleanPhone, display_name: cleanPhone } }
        })
        if (error) {
          if (error.message.includes('already registered')) {
            setAuthError('This phone number is already registered. Try signing in.')
            setSaving(false)
            return
          }
          setAuthError(error.message)
          setSaving(false)
          return
        }
      }
    }

    const existing = JSON.parse(localStorage.getItem('indoo_profile') || '{}')
    existing.phone = cleanPhone
    existing.rentalUnlocked = true
    existing.rentalRole = 'renter'
    localStorage.setItem('indoo_profile', JSON.stringify(existing))

    setSaving(false)
    setStep('interests')
  }

  const handleFinish = async () => {
    // Save interests to profile
    if (supabase && user?.id) {
      await supabase.from('profiles').update({
        rental_setup: true,
        rental_role: 'renter',
        rental_interests: interests,
        city: city.trim() || null,
      }).eq('id', user.id).catch(() => {})
    }

    const existing = JSON.parse(localStorage.getItem('indoo_profile') || '{}')
    existing.rentalSetup = true
    existing.rentalInterests = interests
    if (city.trim()) existing.rentalCity = city.trim()
    localStorage.setItem('indoo_profile', JSON.stringify(existing))

    onComplete?.({ interests, city })
    onClose?.()
  }

  return (
    <div className={styles.screen} style={{ backgroundImage: `url("${BG_IMAGE}")` }}>
      <div className={styles.overlay} />

      <div className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <img src={MARKET_LOGO} alt="Indoo Rentals" className={styles.headerLogo} />
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>

          {/* ═══ STEP 1: Phone + Password ═══ */}
          {step === 'account' && (
            <>
              <div className={styles.hero}>
                <h1 className={styles.heroTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                <p className={styles.heroSub}>{isLogin ? 'Sign in to access Indoo Rentals' : 'One-time sign up to unlock Indoo Rentals — always available after'}</p>
              </div>

              <div className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label}>Phone Number</label>
                  <input className={styles.input} value={phoneNum} onChange={e => setPhoneNum(e.target.value)} placeholder="08123456789" type="tel" />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Password</label>
                  <div className={styles.passwordWrap}>
                    <input className={styles.input} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" type={showPassword ? 'text' : 'password'} />
                    <button className={styles.eyeBtn} onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className={styles.field}>
                    <label className={styles.label}>Confirm Password</label>
                    <input className={styles.input} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" type={showPassword ? 'text' : 'password'} />
                    {confirmPassword && !passwordsMatch && <span className={styles.errorSmall}>Passwords don't match</span>}
                    {confirmPassword && passwordsMatch && <span className={styles.matchSmall}>Passwords match ✓</span>}
                  </div>
                )}

                {authError && <div className={styles.error}>{authError}</div>}

                <button className={styles.submitBtn} onClick={handleAuth} disabled={saving || !phoneValid || !passwordValid || (!isLogin && !passwordsMatch)}>
                  {saving ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                </button>

                <button className={styles.switchBtn} onClick={() => { setIsLogin(v => !v); setAuthError('') }}>
                  {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                </button>
              </div>
            </>
          )}

          {/* ═══ STEP 2: Interests ═══ */}
          {step === 'interests' && (
            <>
              <div className={styles.hero}>
                <h1 className={styles.heroTitle}>What do you want to rent?</h1>
                <p className={styles.heroSub}>Select your interests — we'll show you the best deals</p>
              </div>

              <div className={styles.interestList}>
                {RENTAL_INTERESTS.map(i => (
                  <button key={i.id} className={`${styles.interestBanner} ${interests.includes(i.id) ? styles.interestBannerActive : ''}`} onClick={() => toggleInterest(i.id)}>
                    <div className={styles.interestBannerLeft}>
                      <span className={styles.interestBannerTitle}>{i.label}</span>
                      <span className={styles.interestBannerDesc}>{i.desc}</span>
                      {interests.includes(i.id) && (
                        <div className={styles.interestBannerItems}>
                          {i.items?.map(item => <span key={item} className={styles.interestBannerItem}>{item}</span>)}
                        </div>
                      )}
                    </div>
                    {i.img
                      ? <img src={i.img} alt={i.label} className={styles.interestBannerImg} />
                      : <span className={styles.interestBannerEmoji}>{i.emoji}</span>
                    }
                    {interests.includes(i.id) && <span className={styles.interestBannerCheck}>✓</span>}
                  </button>
                ))}
              </div>

              <div className={styles.field} style={{ marginTop: 16 }}>
                <label className={styles.label}>Your City</label>
                <input className={styles.input} value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Yogyakarta, Bali" />
              </div>

              <button className={styles.submitBtn} onClick={handleFinish} style={{ marginTop: 16 }}>
                Start Browsing →
              </button>
            </>
          )}

          {/* ═══ DONE ═══ */}
          {step === 'done' && (
            <div className={styles.done}>
              <span className={styles.doneIcon}>🎉</span>
              <h2 className={styles.doneTitle}>You're In!</h2>
              <p className={styles.doneSub}>Your Indoo Rentals account is unlocked. Browse motors, cars, villas and more.</p>
              <button className={styles.submitBtn} onClick={() => { onComplete?.(); onClose?.() }}>
                Browse Rentals →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
