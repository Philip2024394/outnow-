/**
 * FoodWishlistSheet.jsx
 * Profile owner manages their food cravings wishlist (up to 5 dishes).
 * Embedded food picker — tapping a dish pins it instead of ordering.
 * Rendered from DatingCard when user taps 🍔 on their OWN profile.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getMyWishlist, removeFromWishlist, addToWishlist } from '@/services/wishlistService'
import SellerProfileSheet from '@/components/commerce/SellerProfileSheet'
import ShopSearchScreen from '@/screens/ShopSearchScreen'
import styles from './FoodWishlistSheet.module.css'

function formatIDR(n) {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}jt IDR`
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}

function FoodItem({ item, onRemove, removing }) {
  return (
    <div className={styles.item}>
      {item.product_image
        ? <img src={item.product_image} alt={item.product_name} className={styles.itemImg} />
        : <div className={styles.itemImgFallback}>🍽️</div>
      }
      <div className={styles.itemBody}>
        <div className={styles.itemName}>{item.product_name}</div>
        <div className={styles.itemMeta}>
          <span className={styles.itemSeller}>{item.seller_name ?? 'Restaurant'}</span>
          <span className={styles.itemPrice}>{formatIDR(item.product_price)}</span>
        </div>
      </div>
      <button
        className={styles.removeBtn}
        onClick={() => onRemove(item)}
        disabled={removing === item.id}
        aria-label="Remove from cravings"
      >
        {removing === item.id ? '…' : '✕'}
      </button>
    </div>
  )
}

export default function FoodWishlistSheet({ open, onClose, showToast }) {
  const { user } = useAuth()
  const userId   = user?.uid ?? user?.id ?? null

  const [items,        setItems]        = useState([])
  const [loading,      setLoading]      = useState(false)
  const [removing,     setRemoving]     = useState(null)
  const [shopOpen,     setShopOpen]     = useState(false)
  const [pickerSeller, setPickerSeller] = useState(null)

  const MAX = 5

  const load = async () => {
    if (!userId) return
    setLoading(true)
    setItems(await getMyWishlist(userId, 'food'))
    setLoading(false)
  }

  useEffect(() => { if (open) load() }, [open, userId]) // eslint-disable-line

  const handleRemove = async (item) => {
    setRemoving(item.id)
    await removeFromWishlist(userId, item.product_id, 'food')
    setItems(prev => prev.filter(i => i.id !== item.id))
    setRemoving(null)
  }

  const handleFoodAdd = async (product, seller) => {
    if (items.length >= MAX) {
      showToast?.(`Cravings full — remove a dish first (max ${MAX})`, 'error')
      return
    }
    const result = await addToWishlist(product, seller, 'food')
    if (!result.ok) {
      if (result.msg === 'limit_reached') {
        showToast?.(`Cravings full — max ${MAX} dishes`, 'error')
      } else if (result.msg === 'already_added') {
        showToast?.('Already in your cravings', 'success')
      } else {
        showToast?.(result.msg, 'error')
      }
      return
    }
    showToast?.(`🍽️ "${product.name}" added to your cravings!`, 'success')
    setPickerSeller(null)
    setShopOpen(false)
    load()
  }

  if (!open) return null

  // ── Embedded food seller picker ───────────────────────────────────────────
  if (pickerSeller) {
    return (
      <SellerProfileSheet
        seller={pickerSeller}
        onClose={() => setPickerSeller(null)}
        wishlistMode
        onWishlistAdd={(product) => handleFoodAdd(product, pickerSeller)}
        showToast={showToast}
      />
    )
  }

  if (shopOpen) {
    return (
      <ShopSearchScreen
        onClose={() => setShopOpen(false)}
        wishlistMode
        onWishlistSelectSeller={(seller) => { setShopOpen(false); setPickerSeller(seller) }}
        showToast={showToast}
      />
    )
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerEmoji}>🍽️</span>
            <div>
              <h2 className={styles.title}>My Cravings</h2>
              <p className={styles.subtitle}>Pin dishes you'd love — admirers can send them to your door</p>
            </div>
          </div>
          <span className={styles.counter}>{items.length}/{MAX}</span>
        </div>

        {/* Privacy note */}
        <div className={styles.privacyNote}>
          🔒 Your delivery address is never shared with the person sending the meal.
        </div>

        {/* Items list */}
        {loading ? (
          <div className={styles.loadingRow}>
            {[1,2,3].map(i => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyEmoji}>🍜</span>
            <p className={styles.emptyText}>No cravings yet</p>
            <p className={styles.emptySub}>Browse food sellers and pin up to {MAX} dishes you'd love to receive</p>
          </div>
        ) : (
          <div className={styles.list}>
            {items.map(item => (
              <FoodItem
                key={item.id}
                item={item}
                onRemove={handleRemove}
                removing={removing}
              />
            ))}
          </div>
        )}

        {items.length < MAX && (
          <button className={styles.addBtn} onClick={() => setShopOpen(true)}>
            + Pin a Dish
          </button>
        )}

        {items.length >= MAX && (
          <div className={styles.fullNote}>
            Cravings full — remove a dish to add a new one
          </div>
        )}

        <button className={styles.doneBtn} onClick={onClose}>Done</button>

      </div>
    </div>
  )
}
