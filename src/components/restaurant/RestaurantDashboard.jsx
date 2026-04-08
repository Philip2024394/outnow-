import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './RestaurantDashboard.module.css'

const CUISINES   = ['Javanese','Indonesian','Chinese','Western','Japanese','Korean','Indian','Italian','Seafood','Vegetarian','Other']
const CATEGORIES = ['Main','Snacks','Drinks','Desserts','Sides']

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

// ── Demo stock photos — replace image_url with real Supabase uploads ──────────
// Style tags give owners a feel for the mood before buying
const DEMO_STOCK_PHOTOS = [
  { id: 1,  image_url: null, style_tag: 'Modern & Clean',    price: 100000, restaurant_id: null },
  { id: 2,  image_url: null, style_tag: 'Rustic Warung',     price: 100000, restaurant_id: null },
  { id: 3,  image_url: null, style_tag: 'Night Atmosphere',  price: 100000, restaurant_id: null },
  { id: 4,  image_url: null, style_tag: 'Street Food Energy',price: 100000, restaurant_id: null },
  { id: 5,  image_url: null, style_tag: 'Elegant Dining',    price: 100000, restaurant_id: null },
  { id: 6,  image_url: null, style_tag: 'Garden Setting',    price: 100000, restaurant_id: null },
  { id: 7,  image_url: null, style_tag: 'Bold & Colourful',  price: 100000, restaurant_id: null },
  { id: 8,  image_url: null, style_tag: 'Minimal & Dark',    price: 100000, restaurant_id: null },
  { id: 9,  image_url: null, style_tag: 'Family Kitchen',    price: 100000, restaurant_id: null },
  { id: 10, image_url: null, style_tag: 'Open Air',          price: 100000, restaurant_id: null },
]

export default function RestaurantDashboard({ userId, onClose }) {
  const [restaurant, setRestaurant] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [tab,        setTab]        = useState('profile') // profile | menu | photos
  const [toast,      setToast]      = useState(null)
  const [stockPhotos,setStockPhotos] = useState(DEMO_STOCK_PHOTOS)
  const [buyingPhoto,setBuyingPhoto] = useState(null) // photo being purchased

  // Profile fields
  const [name,         setName]         = useState('')
  const [cuisine,      setCuisine]      = useState('')
  const [address,      setAddress]      = useState('')
  const [phone,        setPhone]        = useState('')
  const [description,  setDescription]  = useState('')
  const [openingHours, setOpeningHours] = useState('')
  const [isOpen,       setIsOpen]       = useState(false)

  // Menu management
  const [menuItems,    setMenuItems]    = useState([])
  const [editingItem,  setEditingItem]  = useState(null) // null | {} | { id }
  const [itemName,     setItemName]     = useState('')
  const [itemDesc,     setItemDesc]     = useState('')
  const [itemPrice,    setItemPrice]    = useState('')
  const [itemPrep,     setItemPrep]     = useState('')
  const [itemCategory, setItemCategory] = useState('Main')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const load = useCallback(async () => {
    setLoading(true)
    if (!supabase) { setLoading(false); return }
    const { data } = await supabase
      .from('restaurants')
      .select('*, menu_items(*)')
      .eq('owner_id', userId)
      .maybeSingle()
    if (data) {
      setRestaurant(data)
      setName(data.name ?? '')
      setCuisine(data.cuisine_type ?? '')
      setAddress(data.address ?? '')
      setPhone(data.phone ?? '')
      setDescription(data.description ?? '')
      setOpeningHours(data.opening_hours ?? '')
      setIsOpen(data.is_open ?? false)
      setMenuItems(data.menu_items ?? [])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  // Load stock photos from Supabase (falls back to demo)
  useEffect(() => {
    if (!supabase) return
    supabase.from('stock_photos').select('*').order('created_at', { ascending: true })
      .then(({ data }) => { if (data?.length) setStockPhotos(data) })
  }, [])

  const handleBuyPhoto = (photo) => {
    if (!restaurant?.id) { showToast('Save your profile first'); return }
    const msg = `Hi, I'd like to purchase the cover photo "${photo.style_tag}" (ID: ${photo.id}) for my restaurant *${name || 'my restaurant'}* on Hangger.\n\nPayment: Rp 100,000`
    window.open(`https://wa.me/62XXXXXXXXXX?text=${encodeURIComponent(msg)}`, '_blank')
    setBuyingPhoto(photo.id)
  }

  const saveProfile = async () => {
    if (!supabase) return showToast('Not connected')
    setSaving(true)
    const payload = {
      owner_id: userId, name, cuisine_type: cuisine, address, phone,
      description, opening_hours: openingHours, is_open: isOpen,
      updated_at: new Date().toISOString(),
    }
    if (restaurant?.id) {
      await supabase.from('restaurants').update(payload).eq('id', restaurant.id)
    } else {
      const { data } = await supabase.from('restaurants').insert({ ...payload, status: 'pending' }).select().single()
      setRestaurant(data)
    }
    showToast(restaurant?.id ? 'Saved ✓' : 'Application submitted — pending admin approval')
    setSaving(false)
  }

  const toggleOpen = async () => {
    const next = !isOpen
    setIsOpen(next)
    if (supabase && restaurant?.id) {
      await supabase.from('restaurants').update({ is_open: next }).eq('id', restaurant.id)
    }
  }

  const openItemEditor = (item = null) => {
    setEditingItem(item ?? {})
    setItemName(item?.name ?? '')
    setItemDesc(item?.description ?? '')
    setItemPrice(item?.price ?? '')
    setItemPrep(item?.prep_time_min ?? '')
    setItemCategory(item?.category ?? 'Main')
  }

  const saveItem = async () => {
    if (!itemName.trim() || !itemPrice) return
    if (!supabase || !restaurant?.id) { showToast('Save restaurant profile first'); return }
    const payload = {
      restaurant_id: restaurant.id,
      name: itemName.trim(),
      description: itemDesc.trim() || null,
      price: Number(itemPrice),
      prep_time_min: Number(itemPrep) || null,
      category: itemCategory,
    }
    if (editingItem?.id) {
      await supabase.from('menu_items').update(payload).eq('id', editingItem.id)
      setMenuItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...payload } : i))
    } else {
      const { data } = await supabase.from('menu_items').insert(payload).select().single()
      if (data) setMenuItems(prev => [...prev, data])
    }
    setEditingItem(null)
    showToast('Menu item saved ✓')
  }

  const deleteItem = async (id) => {
    if (!supabase) return
    await supabase.from('menu_items').delete().eq('id', id)
    setMenuItems(prev => prev.filter(i => i.id !== id))
  }

  const toggleItemAvailable = async (item) => {
    const next = !item.is_available
    if (supabase) await supabase.from('menu_items').update({ is_available: next }).eq('id', item.id)
    setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: next } : i))
  }

  const statusColor = { pending: '#F5C518', approved: '#8DC63F', rejected: '#ff6b6b' }

  if (loading) return <div className={styles.screen}><div className={styles.loading}>Loading…</div></div>

  return (
    <div className={styles.screen}>

      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className={styles.headerText}>
          <span className={styles.headerTitle}>Restaurant Dashboard</span>
          {restaurant?.status && (
            <span className={styles.statusPill} style={{ color: statusColor[restaurant.status], borderColor: statusColor[restaurant.status] }}>
              {restaurant.status}
            </span>
          )}
        </div>
      </div>

      {/* Open/closed toggle — only for approved */}
      {restaurant?.status === 'approved' && (
        <button className={`${styles.openToggle} ${isOpen ? styles.openToggleOn : styles.openToggleOff}`} onClick={toggleOpen}>
          <span className={styles.openToggleDot} />
          {isOpen ? '🟢 You are OPEN — accepting orders' : '🔴 You are CLOSED'}
        </button>
      )}

      {/* Pending notice */}
      {restaurant?.status === 'pending' && (
        <div className={styles.pendingNotice}>
          ⏳ Your application is under review. We'll notify you when approved.
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tabBtn} ${tab === 'profile' ? styles.tabActive : ''}`} onClick={() => setTab('profile')}>🏪 Profile</button>
        <button className={`${styles.tabBtn} ${tab === 'menu'    ? styles.tabActive : ''}`} onClick={() => setTab('menu')}>🍽 Menu</button>
        <button className={`${styles.tabBtn} ${tab === 'photos'  ? styles.tabActive : ''}`} onClick={() => setTab('photos')}>📸 Cover Photo</button>
      </div>

      <div className={styles.scroll}>

        {/* ── Profile tab ── */}
        {tab === 'profile' && (
          <div className={styles.form}>
            <Field label="Restaurant Name *" value={name} onChange={setName} placeholder="e.g. Warung Bu Sari" />
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Cuisine Type</label>
              <select className={styles.select} value={cuisine} onChange={e => setCuisine(e.target.value)}>
                <option value="">Select cuisine…</option>
                {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Field label="Full Address *"    value={address}      onChange={setAddress}      placeholder="Jl. Malioboro 45, Yogyakarta" />
            <Field label="WhatsApp Number *" value={phone}        onChange={setPhone}        placeholder="628xxx — no + or spaces" type="tel" />
            <Field label="Opening Hours"     value={openingHours} onChange={setOpeningHours} placeholder="e.g. 07:00–22:00" />
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Short Description</label>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What makes your restaurant special?"
                rows={3}
              />
            </div>

            <button className={styles.saveBtn} onClick={saveProfile} disabled={saving || !name.trim() || !phone.trim()}>
              {saving ? 'Saving…' : restaurant?.id ? '💾 Save Changes' : '📝 Submit for Approval'}
            </button>
          </div>
        )}

        {/* ── Cover Photos tab ── */}
        {tab === 'photos' && (
          <div className={styles.photosSection}>

            {/* Current cover */}
            <div className={styles.currentCover}>
              {restaurant?.cover_url
                ? <img src={restaurant.cover_url} alt="Current cover" className={styles.currentCoverImg} />
                : <div className={styles.currentCoverEmpty}>
                    <span>No cover photo yet</span>
                    <span className={styles.currentCoverSub}>Your restaurant listing uses a plain background</span>
                  </div>
              }
            </div>

            {/* Pitch */}
            <div className={styles.photosPitch}>
              <p className={styles.photosPitchTitle}>Stand out with a professional cover</p>
              <p className={styles.photosPitchSub}>
                Each photo is exclusive — once you buy it, no other restaurant can use it.
                Pay once, yours forever. We update the library regularly with new styles.
              </p>
            </div>

            {/* Price callout */}
            <div className={styles.priceCallout}>
              <span className={styles.priceCalloutAmount}>Rp 100.000</span>
              <span className={styles.priceCalloutLabel}>per photo · one-time · exclusive ownership</span>
            </div>

            {/* Photo grid */}
            <div className={styles.photoGrid}>
              {stockPhotos.map(photo => {
                const isMine    = photo.restaurant_id === restaurant?.id
                const isTaken   = photo.restaurant_id && !isMine
                const isPending = buyingPhoto === photo.id

                return (
                  <div
                    key={photo.id}
                    className={`${styles.photoCard} ${isTaken ? styles.photoCardTaken : ''} ${isMine ? styles.photoCardMine : ''}`}
                  >
                    {/* Image or placeholder */}
                    <div className={styles.photoThumb}>
                      {photo.image_url
                        ? <img src={photo.image_url} alt={photo.style_tag} className={styles.photoThumbImg} />
                        : <div className={styles.photoThumbPlaceholder}>
                            <span className={styles.photoThumbIcon}>🖼</span>
                          </div>
                      }

                      {/* Sold overlay */}
                      {isTaken && (
                        <div className={styles.soldOverlay}>
                          <span className={styles.soldText}>Sold</span>
                        </div>
                      )}

                      {/* Mine badge */}
                      {isMine && (
                        <div className={styles.mineBadge}>✓ Your Photo</div>
                      )}
                    </div>

                    {/* Style tag + action */}
                    <div className={styles.photoInfo}>
                      <span className={styles.photoStyle}>{photo.style_tag}</span>
                      {!isTaken && !isMine && (
                        <button
                          className={`${styles.buyBtn} ${isPending ? styles.buyBtnPending : ''}`}
                          onClick={() => handleBuyPhoto(photo)}
                        >
                          {isPending ? 'Request sent ✓' : 'Buy — Rp 100k'}
                        </button>
                      )}
                      {isMine && (
                        <span className={styles.ownedLabel}>Active on your listing</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <p className={styles.photosNote}>
              Tap Buy → sends a WhatsApp request to our team → we confirm payment and activate your photo within 24 hours.
            </p>
          </div>
        )}

        {/* ── Menu tab ── */}
        {tab === 'menu' && (
          <div className={styles.menuSection}>
            {!restaurant?.id && (
              <div className={styles.menuLock}>Save your profile first to manage menu items.</div>
            )}

            {restaurant?.id && (
              <>
                <button className={styles.addItemBtn} onClick={() => openItemEditor(null)}>+ Add Dish</button>

                {menuItems.length === 0 && (
                  <div className={styles.menuEmpty}>No dishes yet — add your first item above.</div>
                )}

                {menuItems.map(item => (
                  <div key={item.id} className={`${styles.menuItemRow} ${!item.is_available ? styles.menuItemRowOff : ''}`}>
                    <div className={styles.menuItemInfo}>
                      <span className={styles.menuItemName}>{item.name}</span>
                      <span className={styles.menuItemMeta}>
                        {fmtRp(item.price)}
                        {item.prep_time_min ? ` · ⏱ ${item.prep_time_min} min` : ''}
                        {item.category ? ` · ${item.category}` : ''}
                      </span>
                      {item.description && <span className={styles.menuItemDesc}>{item.description}</span>}
                    </div>
                    <div className={styles.menuItemActions}>
                      <button
                        className={`${styles.availBtn} ${item.is_available ? styles.availBtnOn : styles.availBtnOff}`}
                        onClick={() => toggleItemAvailable(item)}
                        title={item.is_available ? 'Mark as sold out' : 'Mark as available'}
                      >
                        {item.is_available ? 'Available' : 'Sold Out'}
                      </button>
                      <button className={styles.editBtn} onClick={() => openItemEditor(item)}>Edit</button>
                      <button className={styles.deleteBtn} onClick={() => deleteItem(item.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Item editor modal */}
      {editingItem !== null && (
        <div className={styles.modalBackdrop} onClick={() => setEditingItem(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{editingItem?.id ? 'Edit Dish' : 'New Dish'}</h3>
            <Field label="Dish Name *"    value={itemName}  onChange={setItemName}  placeholder="e.g. Nasi Gudeg Komplit" />
            <Field label="Description"    value={itemDesc}  onChange={setItemDesc}  placeholder="Brief description of the dish" />
            <Field label="Price (Rp) *"   value={itemPrice} onChange={setItemPrice} placeholder="25000" type="number" />
            <Field label="Prep Time (min)" value={itemPrep}  onChange={setItemPrep}  placeholder="15" type="number" />
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Category</label>
              <select className={styles.select} value={itemCategory} onChange={e => setItemCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.saveBtn} onClick={saveItem} disabled={!itemName.trim() || !itemPrice}>Save Dish</button>
              <button className={styles.cancelBtn} onClick={() => setEditingItem(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.label}>{label}</label>
      <input
        className={styles.input}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
