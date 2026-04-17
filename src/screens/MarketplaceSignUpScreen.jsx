/**
 * MarketplaceSignUpScreen
 * Full sign-up flow for marketplace accounts:
 * Step 1: Choose role (Buyer / Seller / Both)
 * Step 2: Select selling categories (seller/both only)
 * Step 3: Business details (seller/both only)
 * → Routes to seller dashboard or buyer dashboard
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import styles from './MarketplaceSignUpScreen.module.css'

const MARKET_LOGO = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdsd-removebg-preview.png'

const CATEGORIES = [
  { id: 'womens_fashion',    emoji: '👗', label: "Women's Fashion" },
  { id: 'mens_fashion',      emoji: '👔', label: "Men's Fashion" },
  { id: 'shoes',             emoji: '👟', label: 'Shoes' },
  { id: 'bags',              emoji: '👜', label: 'Bags & Luggage' },
  { id: 'watches_jewellery', emoji: '⌚', label: 'Watches & Jewellery' },
  { id: 'muslim_fashion',    emoji: '🧕', label: 'Muslim Fashion' },
  { id: 'phones_accessories',emoji: '📱', label: 'Phones & Accessories' },
  { id: 'computers',         emoji: '💻', label: 'Computers & Laptops' },
  { id: 'electronics',       emoji: '🔌', label: 'Electronics' },
  { id: 'cameras',           emoji: '📷', label: 'Cameras & Photography' },
  { id: 'tv_appliances',     emoji: '📺', label: 'TV & Home Appliances' },
  { id: 'beauty',            emoji: '💄', label: 'Beauty & Skincare' },
  { id: 'health',            emoji: '💊', label: 'Health & Personal Care' },
  { id: 'food_beverages',    emoji: '🍔', label: 'Food & Beverages' },
  { id: 'groceries',         emoji: '🛒', label: 'Groceries' },
  { id: 'mom_baby',          emoji: '👶', label: 'Mom & Baby' },
  { id: 'toys_games',        emoji: '🎮', label: 'Toys & Games' },
  { id: 'sports_outdoor',    emoji: '⚽', label: 'Sports & Outdoors' },
  { id: 'home_living',       emoji: '🏠', label: 'Home & Living' },
  { id: 'furniture',         emoji: '🛋️', label: 'Furniture & Decor' },
  { id: 'tools_garden',      emoji: '🔧', label: 'Tools & Garden' },
  { id: 'automotive',        emoji: '🚗', label: 'Automotive & Motorcycles' },
  { id: 'books_stationery',  emoji: '📚', label: 'Books & Stationery' },
  { id: 'pet_supplies',      emoji: '🐾', label: 'Pet Supplies' },
  { id: 'hobbies',           emoji: '🎨', label: 'Hobbies & Collections' },
  { id: 'vouchers_services', emoji: '🎫', label: 'Vouchers & Services' },
]

const STEPS = ['account', 'role', 'categories', 'details', 'done']

export default function MarketplaceSignUpScreen({ open, onClose, onComplete }) {
  const { user } = useAuth()
  const [step, setStep] = useState('account')
  const [phoneNum, setPhoneNum] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [role, setRole] = useState('')
  const [categories, setCategories] = useState([])
  const [brandName, setBrandName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [saving, setSaving] = useState(false)
  const [isLogin, setIsLogin] = useState(false)

  if (!open) return null

  const selectCat = (id) => setCategories([id])

  const isSeller = role === 'seller' || role === 'both'

  const phoneValid = phoneNum.replace(/\D/g, '').length >= 10
  const passwordValid = password.length >= 6
  const passwordsMatch = password === confirmPassword

  const handleAccountNext = async () => {
    setAuthError('')
    if (!phoneValid) { setAuthError('Enter a valid phone number (10+ digits)'); return }
    if (!passwordValid) { setAuthError('Password must be at least 6 characters'); return }
    if (!isLogin && !passwordsMatch) { setAuthError('Passwords do not match'); return }

    setSaving(true)
    const cleanPhone = phoneNum.replace(/\D/g, '').replace(/^0/, '62')
    const fakeEmail = `${cleanPhone}@indoo.market`

    if (supabase) {
      if (isLogin) {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password })
        if (error) {
          setAuthError(error.message === 'Invalid login credentials' ? 'Wrong phone number or password' : error.message)
          setSaving(false)
          return
        }
      } else {
        // Sign up
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

    // Save phone to localStorage
    const existing = JSON.parse(localStorage.getItem('hangger_profile') || '{}')
    existing.phone = cleanPhone
    localStorage.setItem('hangger_profile', JSON.stringify(existing))

    setSaving(false)
    setStep('role')
  }

  const handleNext = () => {
    if (step === 'account') { handleAccountNext(); return }
    if (step === 'role' && !role) return
    if (step === 'role') {
      if (role === 'buyer') {
        setStep('done')
      } else {
        setStep('categories')
      }
      return
    }
    if (step === 'categories') {
      if (categories.length === 0) return
      setStep('details')
      return
    }
    if (step === 'details') {
      handleSubmit()
      return
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    const payload = {
      marketplaceSetup: true,
      marketplaceRole: role,
      marketplaceCategories: categories,
    }
    if (isSeller) {
      payload.brandName = brandName.trim()
      payload.marketplaceDescription = description.trim()
      payload.marketplaceCity = city.trim()
    }

    if (supabase && user?.id) {
      await supabase.from('profiles').update({
        marketplace_setup: true,
        marketplace_role: role,
        marketplace_categories: categories,
        brand_name: brandName.trim() || null,
        bio: description.trim() || null,
        city: city.trim() || null,
      }).eq('id', user.id).catch(() => {})
    }

    const existing = JSON.parse(localStorage.getItem('hangger_profile') || '{}')
    localStorage.setItem('hangger_profile', JSON.stringify({ ...existing, ...payload }))

    setSaving(false)
    setStep('done')
  }

  const handleFinish = () => {
    onComplete?.({ role, categories, brandName, description, city, phone: phoneNum })
    onClose?.()
    setStep('account')
    setPhoneNum('')
    setPassword('')
    setConfirmPassword('')
    setRole('')
    setCategories([])
    setBrandName('')
    setDescription('')
    setCity('')
    setAuthError('')
  }

  const stepIndex = STEPS.indexOf(step)

  return createPortal(
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <img src={MARKET_LOGO} alt="Indoo Market" className={styles.headerLogo} />
      </div>

      {/* Progress bar — full width */}
      <div className={styles.progress}>
        <div className={styles.progressFill} style={{ width: step === 'done' ? '100%' : `${((stepIndex + 1) / (isSeller ? 4 : 2)) * 100}%` }} />
      </div>

      {/* Body */}
      <div className={styles.body}>

        {/* ═══ STEP 0: Account (Phone + Password) ═══ */}
        {step === 'account' && (
          <>
            <h2 className={styles.stepTitle}>{isLogin ? 'Sign In' : 'Create Account'}</h2>
            <p className={styles.stepSub}>Use your phone number to {isLogin ? 'sign in' : 'get started'}</p>

            <div className={styles.fields}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Phone Number</label>
                <div className={styles.phoneInputWrap}>
                  <span className={styles.phonePrefix}>+62</span>
                  <input
                    className={styles.phoneInput}
                    value={phoneNum}
                    onChange={e => setPhoneNum(e.target.value)}
                    placeholder="812 3456 7890"
                    type="tel"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Password</label>
                <div className={styles.passwordWrap}>
                  <input
                    className={styles.fieldInput}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={isLogin ? 'Enter password' : 'Min 6 characters'}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  <button className={styles.eyeBtn} onClick={() => setShowPassword(v => !v)} type="button">
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Confirm Password</label>
                  <input
                    className={styles.fieldInput}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                  />
                </div>
              )}
            </div>

            {authError && <p className={styles.authError}>{authError}</p>}
          </>
        )}

        {/* ═══ STEP 1: Role ═══ */}
        {step === 'role' && (
          <>
            <h2 className={styles.stepTitle}>How will you use the marketplace?</h2>
            <p className={styles.stepSub}>You can change this later in settings</p>
            <div className={styles.roleCards}>
              <button className={`${styles.roleCard} ${role === 'buyer' ? styles.roleCardOn : ''}`} onClick={() => setRole('buyer')}>
                <span className={styles.roleEmoji}>🛒</span>
                <span className={styles.roleLabel}>Buyer</span>
                <span className={styles.roleDesc}>Browse and purchase products from sellers</span>
              </button>
              <button className={`${styles.roleCard} ${role === 'seller' ? styles.roleCardOn : ''}`} onClick={() => setRole('seller')}>
                <span className={styles.roleEmoji}>🏪</span>
                <span className={styles.roleLabel}>Seller</span>
                <span className={styles.roleDesc}>List products, manage orders, earn money</span>
              </button>
              <button className={`${styles.roleCard} ${role === 'both' ? styles.roleCardOn : ''}`} onClick={() => setRole('both')}>
                <span className={styles.roleEmoji}>🔄</span>
                <span className={styles.roleLabel}>Both</span>
                <span className={styles.roleDesc}>Buy from others and sell your own products</span>
              </button>
            </div>
          </>
        )}

        {/* ═══ STEP 2: Categories ═══ */}
        {step === 'categories' && (
          <>
            <h2 className={styles.stepTitle}>What will you {role === 'seller' ? 'sell' : 'buy & sell'}?</h2>
            <p className={styles.stepSub}>Select your main category</p>
            <div className={styles.catGrid}>
              {CATEGORIES.map(c => (
                <button key={c.id} className={`${styles.catCard} ${categories.includes(c.id) ? styles.catCardOn : ''}`} onClick={() => selectCat(c.id)}>
                  <span className={styles.catEmoji}>{c.emoji}</span>
                  <span className={styles.catLabel}>{c.label}</span>
                  {categories.includes(c.id) && <span className={styles.catTick}>&#10003;</span>}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ═══ STEP 3: Business Details ═══ */}
        {step === 'details' && (
          <>
            <h2 className={styles.stepTitle}>Your business details</h2>
            <p className={styles.stepSub}>Help buyers find and trust your store</p>
            <div className={styles.fields}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Business / Brand Name *</label>
                <input className={styles.fieldInput} value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. Bali Crafts Co." maxLength={50} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Description</label>
                <textarea className={styles.fieldTextarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell buyers what you sell and what makes your store special..." rows={3} maxLength={300} />
                <span className={styles.charCount}>{description.length}/300</span>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>City / Location</label>
                <input className={styles.fieldInput} value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Yogyakarta" />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>WhatsApp Number (optional)</label>
                <input className={styles.fieldInput} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+62 812 3456 7890" type="tel" />
              </div>
            </div>
          </>
        )}

        {/* ═══ STEP 4: Done ═══ */}
        {step === 'done' && (
          <div className={styles.doneWrap}>
            <span className={styles.doneEmoji}>{isSeller ? '🎉' : '🛒'}</span>
            <h2 className={styles.doneTitle}>
              {isSeller ? 'Your store is ready!' : 'Welcome to Indoo Market!'}
            </h2>
            <p className={styles.doneSub}>
              {isSeller
                ? 'Start adding products and managing your orders from the seller dashboard.'
                : 'Browse products, discover sellers, and start shopping.'}
            </p>
            {isSeller && (
              <div className={styles.doneFeatures}>
                <div className={styles.doneFeature}><span>📦</span> Add unlimited products</div>
                <div className={styles.doneFeature}><span>📊</span> Sales analytics dashboard</div>
                <div className={styles.doneFeature}><span>🚚</span> Order & shipping management</div>
                <div className={styles.doneFeature}><span>⚡</span> Flash sales & auctions</div>
                <div className={styles.doneFeature}><span>💰</span> 5% commission per sale</div>
              </div>
            )}
            {!isSeller && (
              <div className={styles.doneFeatures}>
                <div className={styles.doneFeature}><span>🛍️</span> Browse thousands of products</div>
                <div className={styles.doneFeature}><span>🛡️</span> Safe Trade buyer protection</div>
                <div className={styles.doneFeature}><span>💬</span> Chat directly with sellers</div>
                <div className={styles.doneFeature}><span>📦</span> Track your orders</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        {step === 'account' && (
          <div className={styles.authBtnRow}>
            <button
              className={`${styles.authBtn} ${!isLogin ? styles.authBtnActive : styles.authBtnInactive}`}
              onClick={() => { setIsLogin(false); setAuthError('') }}
            >
              Create Account
            </button>
            <button
              className={`${styles.authBtn} ${isLogin ? styles.authBtnActive : styles.authBtnInactive}`}
              onClick={() => { setIsLogin(true); setAuthError('') }}
            >
              Sign In
            </button>
          </div>
        )}
        {step === 'account' && (
          <button className={styles.enterBtn} onClick={handleNext}
            disabled={!phoneValid || !passwordValid || (!isLogin && !passwordsMatch) || saving}
          >
            {saving ? (isLogin ? 'Signing in...' : 'Creating account...') : 'Continue'} →
          </button>
        )}
        {step !== 'account' && step !== 'done' && (
          <button className={styles.backBtn} onClick={() => {
            if (step === 'role') setStep('account')
            if (step === 'categories') setStep('role')
            if (step === 'details') setStep('categories')
          }}>Back</button>
        )}
        {step !== 'account' && step !== 'done' && (
          <button className={styles.enterBtn} onClick={handleNext}
            disabled={(step === 'role' && !role) || (step === 'categories' && categories.length === 0) || (step === 'details' && !brandName.trim()) || saving}
          >
            {saving ? 'Saving...' : step === 'details' ? 'Finish Setup' : 'Continue'} →
          </button>
        )}
        {step === 'done' && (
          <button className={styles.enterBtn} onClick={handleFinish}>
            {isSeller ? 'Open Dashboard' : 'Start Shopping'} →
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}
