/**
 * WishlistSheet.jsx
 * Profile owner manages their gift wishlist (up to 5 items).
 * Has an embedded marketplace picker mode — tapping a product adds it to the
 * wishlist instead of opening the normal gift/purchase flow.
 *
 * Rendered from GiftSetupPrompt when user taps "My Wishlist".
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getMyWishlist, removeFromWishlist, addToWishlist } from '@/services/wishlistService'
import SellerProfileSheet from '@/components/commerce/SellerProfileSheet'
import ShopSearchScreen from '@/screens/ShopSearchScreen'
import styles from './WishlistSheet.module.css'

function formatIDR(n) {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}jt IDR`
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}

function WishlistItem({ item, onRemove, removing }) {
  return (
    <div className={styles.item}>
      {item.product_image
        ? <img src={item.product_image} alt={item.product_name} className={styles.itemImg} />
        : <div className={styles.itemImgFallback}>📦</div>
      }
      <div className={styles.itemBody}>
        <div className={styles.itemName}>{item.product_name}</div>
        <div className={styles.itemMeta}>
          <span className={styles.itemSeller}>{item.seller_name ?? 'Marketplace'}</span>
          <span className={styles.itemPrice}>{formatIDR(item.product_price)}</span>
        </div>
      </div>
      <button
        className={styles.removeBtn}
        onClick={() => onRemove(item)}
        disabled={removing === item.id}
        aria-label="Remove from wishlist"
      >
        {removing === item.id ? '…' : '✕'}
      </button>
    </div>
  )
}

export default function WishlistSheet({ open, onClose, showToast }) {
  const { user } = useAuth()
  const userId   = user?.uid ?? user?.id ?? null

  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(false)
  const [removing,    setRemoving]    = useState(null)
  const [shopOpen,    setShopOpen]    = useState(false)  // embedded marketplace picker
  const [pickerSeller, setPickerSeller] = useState(null) // seller selected in picker

  const MAX = 5

  const load = async () => {
    if (!userId) return
    setLoading(true)
    setItems(await getMyWishlist(userId, 'product'))
    setLoading(false)
  }

  useEffect(() => { if (open) load() }, [open, userId]) // eslint-disable-line

  const handleRemove = async (item) => {
    setRemoving(item.id)
    await removeFromWishlist(userId, item.product_id, 'product')
    setItems(prev => prev.filter(i => i.id !== item.id))
    setRemoving(null)
  }

  // Called from embedded SellerProfileSheet when a product is tapped in picker mode
  const handleWishlistAdd = async (product, seller) => {
    if (items.length >= MAX) {
      showToast?.(`Wishlist full — remove an item first (max ${MAX})`, 'error')
      return
    }
    const result = await addToWishlist(product, seller, 'product')
    if (!result.ok) {
      if (result.msg === 'limit_reached') {
        showToast?.(`Wishlist full — max ${MAX} items`, 'error')
      } else if (result.msg === 'already_added') {
        showToast?.('Already in your wishlist', 'success')
      } else {
        showToast?.(result.msg, 'error')
      }
      return
    }
    showToast?.(`🎁 "${product.name}" added to your wishlist!`, 'success')
    setPickerSeller(null)
    setShopOpen(false)
    load() // refresh list
  }

  if (!open) return null

  // ── Embedded marketplace picker ────────────────────────────────────────────
  if (pickerSeller) {
    return (
      <SellerProfileSheet
        seller={pickerSeller}
        onClose={() => setPickerSeller(null)}
        wishlistMode
        onWishlistAdd={(product) => handleWishlistAdd(product, pickerSeller)}
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

  // ── Main wishlist manager ──────────────────────────────────────────────────
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerEmoji}>🎁</span>
            <div>
              <h2 className={styles.title}>My Wishlist</h2>
              <p className={styles.subtitle}>Pin items you'd love to receive — admirers can send them anonymously</p>
            </div>
          </div>
          <span className={styles.counter}>{items.length}/{MAX}</span>
        </div>

        {/* Privacy note */}
        <div className={styles.privacyNote}>
          🔒 Your wishlist is visible on your dating profile. Gifts are always delivered anonymously.
        </div>

        {/* Items list */}
        {loading ? (
          <div className={styles.loadingRow}>
            {[1,2,3].map(i => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyEmoji}>🛍️</span>
            <p className={styles.emptyText}>No items yet</p>
            <p className={styles.emptySub}>Browse the marketplace and pin up to {MAX} things you'd love to receive</p>
          </div>
        ) : (
          <div className={styles.list}>
            {items.map(item => (
              <WishlistItem
                key={item.id}
                item={item}
                onRemove={handleRemove}
                removing={removing}
              />
            ))}
          </div>
        )}

        {/* Add button */}
        {items.length < MAX && (
          <button className={styles.addBtn} onClick={() => setShopOpen(true)}>
            + Add from Marketplace
          </button>
        )}

        {items.length >= MAX && (
          <div className={styles.fullNote}>
            Wishlist full — remove an item to add a new one
          </div>
        )}

        <button className={styles.doneBtn} onClick={onClose}>Done</button>

      </div>
    </div>
  )
}
