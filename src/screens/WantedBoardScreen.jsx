/**
 * WantedBoardScreen — buyers post items they're looking for.
 * Sellers can respond with "I have this" → opens chat.
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import { fetchWantedItems, createWantedItem } from '@/services/wantedService'
import styles from './WantedBoardScreen.module.css'

const CATEGORIES = [
  { id: '', label: 'Select category...' },
  { id: 'phones_accessories', label: 'Phones & Accessories' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'cameras', label: 'Cameras' },
  { id: 'womens_fashion', label: "Women's Fashion" },
  { id: 'mens_fashion', label: "Men's Fashion" },
  { id: 'bags', label: 'Bags' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'automotive', label: 'Automotive & Motorcycles' },
  { id: 'home_living', label: 'Home & Living' },
  { id: 'furniture', label: 'Furniture' },
  { id: 'mom_baby', label: 'Mom & Baby' },
  { id: 'sports_outdoor', label: 'Sports & Outdoors' },
  { id: 'beauty', label: 'Beauty & Skincare' },
  { id: 'tools_garden', label: 'Tools & Garden' },
  { id: 'hobbies', label: 'Hobbies & Collections' },
]

function fmtRp(n) { return n ? `Rp ${Number(n).toLocaleString('id-ID')}` : '' }

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function WantedBoardScreen({ open, onClose, onOpenChat, onAlerts, onProfile }) {
  const { user, userProfile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [condPref, setCondPref] = useState('either')
  const [targetPrice, setTargetPrice] = useState('')
  const [city, setCity] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetchWantedItems().then(w => { setItems(w); setLoading(false) })
  }, [open])

  if (!open) return null

  const filtered = search.trim()
    ? items.filter(w => w.title.toLowerCase().includes(search.toLowerCase()) || w.description?.toLowerCase().includes(search.toLowerCase()))
    : items

  const handleSubmit = async () => {
    if (!title.trim() || !user?.id) return
    setSubmitting(true)
    const item = await createWantedItem(user.id, {
      title: title.trim(),
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      category: category || null,
      condition_pref: condPref,
      target_price: targetPrice ? Number(targetPrice) : null,
      city: city.trim() || userProfile?.city || null,
    })
    if (item) {
      item.user = { display_name: userProfile?.displayName ?? user.displayName ?? 'You', avatar_url: userProfile?.photoURL ?? null }
      setItems(prev => [item, ...prev])
    }
    setTitle(''); setDescription(''); setCategory(''); setCondPref('either'); setTargetPrice(''); setCity(''); setImageUrl('')
    setShowForm(false)
    setSubmitting(false)
  }

  return createPortal(
    <div className={styles.screen}>
      <div style={{ position: 'fixed', top: 6, left: 6, zIndex: 99990, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#000', boxShadow: '0 2px 8px rgba(141,198,63,0.4)' }}>M6</div><span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(141,198,63,0.6)' }}>WANTED</span></div>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className={styles.headerText}>
          <h1 className={styles.title}>👀 Wanted Board</h1>
          <span className={styles.subtitle}>Post what you're looking for</span>
        </div>
        <button className={styles.addBtn} onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕' : '+ Post'}
        </button>
      </div>

      {/* Post form */}
      {showForm && (
        <div className={styles.form}>
          <input className={styles.formInput} value={title} onChange={e => setTitle(e.target.value)} placeholder="What are you looking for? *" maxLength={100} />
          <textarea className={styles.formTextarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what you need (brand, size, specs...)" rows={3} maxLength={500} />
          <div className={styles.formRow}>
            <select className={styles.formSelect} value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className={styles.formRow}>
            <div className={styles.condRow}>
              {['new', 'used', 'either'].map(c => (
                <button key={c} className={`${styles.condBtn} ${condPref === c ? styles.condBtnOn : ''}`} onClick={() => setCondPref(c)}>
                  {c === 'new' ? 'New Only' : c === 'used' ? 'Used OK' : 'Either'}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.formRow}>
            <input className={styles.formInput} value={targetPrice} onChange={e => setTargetPrice(e.target.value.replace(/\D/g, ''))} placeholder="Target price (Rp)" type="text" inputMode="numeric" />
            <input className={styles.formInput} value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
          </div>
          <input className={styles.formInput} value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL (required)" style={!imageUrl.trim() ? { borderColor: 'rgba(239,68,68,0.3)' } : {}} />
          {!imageUrl.trim() && <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>At least 1 image is required</span>}
          <button className={styles.formSubmit} onClick={handleSubmit} disabled={!title.trim() || !imageUrl.trim() || submitting}>
            {submitting ? 'Posting...' : 'Post to Wanted Board'}
          </button>
        </div>
      )}

      {/* Search */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search wanted items..." />
        </div>
      </div>

      {/* Feed */}
      <div className={styles.content}>
        {loading && <div className={styles.empty}>Loading...</div>}
        {!loading && filtered.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📋</span>
            <span>No wanted posts yet</span>
            <span className={styles.emptySub}>Be the first to post what you need</span>
          </div>
        )}
        {filtered.length > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 8, letterSpacing: '0.02em' }}>{filtered.length} wanted post{filtered.length !== 1 ? 's' : ''}</div>}
        {filtered.map(w => (
          <div key={w.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardUser}>
                {w.user?.avatar_url
                  ? <img src={w.user.avatar_url} alt="" className={styles.cardAvatar} />
                  : <div className={styles.cardAvatarFallback}>{(w.user?.display_name ?? 'U')[0]}</div>
                }
                <div className={styles.cardUserInfo}>
                  <span className={styles.cardUserName}>{w.user?.display_name ?? 'User'}</span>
                  <span className={styles.cardTime}>{timeAgo(w.created_at)}{w.city ? ` · ${w.city}` : ''}</span>
                </div>
              </div>
              <div className={styles.cardBadges}>
                <span className={`${styles.condPill} ${w.condition_pref === 'new' ? styles.condPillNew : w.condition_pref === 'used' ? styles.condPillUsed : styles.condPillEither}`}>
                  {w.condition_pref === 'new' ? 'New Only' : w.condition_pref === 'used' ? 'Used OK' : 'New or Used'}
                </span>
              </div>
            </div>
            <h3 className={styles.cardTitle}>{w.title}</h3>
            {w.description && <p className={styles.cardDesc}>{w.description}</p>}
            {w.image_url && <img src={w.image_url} alt="" className={styles.cardImage} />}
            <div className={styles.cardFooter}>
              {w.target_price > 0 && <span className={styles.cardBudget}>Budget: {fmtRp(w.target_price)}</span>}
              {w.category && <span className={styles.cardCat}>{CATEGORIES.find(c => c.id === w.category)?.label ?? w.category}</span>}
              {w.user_id !== user?.id && (
                <button className={styles.haveItBtn} onClick={() => onOpenChat?.({ buyerId: w.user_id, displayName: w.user?.display_name ?? 'Buyer' })}>
                  I Have This →
                </button>
              )}
            </div>
          </div>
        ))}
        {/* Bottom spacer for footer nav */}
        <div style={{ height: 80 }} />
      </div>

      {/* Floating footer nav */}
      <div style={{
        position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 99998, display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 30, padding: '6px 8px',
      }}>
        {[
          { label: 'Home', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, action: onClose },
          { label: 'Wanted', active: true, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, action: () => {} },
          { label: 'Alerts', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>, action: () => onAlerts?.(), badge: true },
          { label: 'Profile', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, action: () => onProfile?.() },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2, padding: '8px 16px', borderRadius: 22,
            background: btn.active ? 'rgba(141,198,63,0.12)' : 'transparent',
            border: 'none', cursor: 'pointer',
            color: btn.active ? '#8DC63F' : 'rgba(255,255,255,0.45)',
            transition: 'all 0.2s',
          }}>
            <div style={{ position: 'relative' }}>
              {btn.icon}
              {btn.badge && <span style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: '#EF4444', border: '1.5px solid #0e0e0e' }} />}
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.03em' }}>{btn.label}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body
  )
}
