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

const MARKET_LOGO = 'https://ik.imagekit.io/nepgaxllc/Indoo%20Market%20logo%20design.png?updatedAt=1776203793752'

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

const STEPS = ['role', 'categories', 'details', 'done']

export default function MarketplaceSignUpScreen({ open, onClose, onComplete }) {
  const { user } = useAuth()
  const [step, setStep] = useState('role')
  const [role, setRole] = useState('')
  const [categories, setCategories] = useState([])
  const [brandName, setBrandName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const toggleCat = (id) => setCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const isSeller = role === 'seller' || role === 'both'

  const handleNext = () => {
    if (step === 'role' && !role) return
    if (step === 'role') {
      if (role === 'buyer') {
        // Buyers skip to done
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
      payload.marketplacePhone = phone.trim()
    }

    // Save to Supabase
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

    // Save to localStorage as fallback
    const existing = JSON.parse(localStorage.getItem('hangger_profile') || '{}')
    localStorage.setItem('hangger_profile', JSON.stringify({ ...existing, ...payload }))

    setSaving(false)
    setStep('done')
  }

  const handleFinish = () => {
    onComplete?.({ role, categories, brandName, description, city, phone })
    onClose?.()
    // Reset
    setStep('role')
    setRole('')
    setCategories([])
    setBrandName('')
    setDescription('')
    setCity('')
    setPhone('')
  }

  const stepIndex = STEPS.indexOf(step)

  return createPortal(
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <img src={MARKET_LOGO} alt="Indoo Market" className={styles.headerLogo} />
        <div className={styles.headerText}>
          <span className={styles.headerTitle}>Join Indoo Market</span>
          <span className={styles.headerSub}>Step {Math.min(stepIndex + 1, 3)} of {isSeller ? 3 : 1}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progress}>
        <div className={styles.progressFill} style={{ width: step === 'done' ? '100%' : `${((stepIndex + 1) / (isSeller ? 3 : 1)) * 100}%` }} />
      </div>

      {/* Body */}
      <div className={styles.body}>

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
            <p className={styles.stepSub}>Select one or more categories</p>
            <div className={styles.catGrid}>
              {CATEGORIES.map(c => (
                <button key={c.id} className={`${styles.catCard} ${categories.includes(c.id) ? styles.catCardOn : ''}`} onClick={() => toggleCat(c.id)}>
                  <span className={styles.catEmoji}>{c.emoji}</span>
                  <span className={styles.catLabel}>{c.label}</span>
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
        {step !== 'role' && step !== 'done' && (
          <button className={styles.backBtn} onClick={() => {
            if (step === 'categories') setStep('role')
            if (step === 'details') setStep('categories')
          }}>Back</button>
        )}
        {step === 'done' ? (
          <button className={styles.enterBtn} onClick={handleFinish}>
            {isSeller ? 'Open Dashboard' : 'Start Shopping'} →
          </button>
        ) : (
          <button className={styles.enterBtn} onClick={handleNext}
            disabled={
              (step === 'role' && !role) ||
              (step === 'categories' && categories.length === 0) ||
              (step === 'details' && !brandName.trim()) ||
              saving
            }
          >
            {saving ? 'Saving...' : step === 'details' ? 'Create Account' : 'Continue'} →
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}
