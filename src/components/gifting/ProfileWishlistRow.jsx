/**
 * ProfileWishlistRow.jsx
 * Shown inside a DatingCard when the profile owner has wishlist items.
 * Displays a horizontal scroll of pinned products; tapping one opens
 * GiftOrderSheet pre-filled with that product.
 */
import { useState } from 'react'
import GiftOrderSheet from './GiftOrderSheet'
import styles from './ProfileWishlistRow.module.css'

function formatIDR(n) {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}jt`
  return `${Number(n).toLocaleString('id-ID')}rp`
}

export default function ProfileWishlistRow({ items = [], recipient, showToast }) {
  const [giftItem, setGiftItem] = useState(null)

  if (!items.length) return null

  // Build a minimal seller object from wishlist item fields
  const sellerFor = (item) => ({
    id:          item.seller_id,
    displayName: item.seller_name ?? 'Marketplace',
    brandName:   item.seller_name ?? 'Marketplace',
  })

  // Build a minimal product object compatible with GiftOrderSheet
  const productFor = (item) => ({
    id:        item.product_id,
    name:      item.product_name,
    price:     item.product_price,
    currency:  item.product_currency ?? 'IDR',
    image:     item.product_image ?? null,
    image_url: item.product_image ?? null,
  })

  return (
    <>
      <div className={styles.row}>
        <div className={styles.label}>
          <span className={styles.labelEmoji}>🎁</span>
          <span className={styles.labelText}>Gift Wishlist</span>
          <span className={styles.labelCount}>{items.length}</span>
        </div>

        <div className={styles.scroll}>
          {items.map(item => (
            <button
              key={item.id}
              className={styles.item}
              onClick={() => setGiftItem(item)}
            >
              {item.product_image
                ? <img src={item.product_image} alt={item.product_name} className={styles.itemImg} />
                : <div className={styles.itemImgFallback}>📦</div>
              }
              <div className={styles.itemName}>{item.product_name}</div>
              <div className={styles.itemPrice}>{formatIDR(item.product_price)}</div>
            </button>
          ))}
        </div>

        <div className={styles.hint}>Tap an item to send it anonymously</div>
      </div>

      <GiftOrderSheet
        open={!!giftItem}
        product={giftItem ? productFor(giftItem) : null}
        seller={giftItem ? sellerFor(giftItem) : null}
        giftFor={recipient}
        onClose={() => setGiftItem(null)}
        showToast={showToast}
      />
    </>
  )
}
