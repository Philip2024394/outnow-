/**
 * ProfileFoodRow.jsx
 * "Cravings" strip shown inside a DatingCard when the profile has food wishlist items.
 * Tapping a dish opens FoodOrderSheet pre-filled with that dish.
 */
import { useState } from 'react'
import FoodOrderSheet from './FoodOrderSheet'
import styles from './ProfileFoodRow.module.css'

function formatIDR(n) {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}jt`
  return `${Number(n).toLocaleString('id-ID')}rp`
}

export default function ProfileFoodRow({ items = [], recipient, showToast }) {
  const [orderItem, setOrderItem] = useState(null)

  if (!items.length) return null

  const sellerFor  = (item) => ({
    id:          item.seller_id,
    displayName: item.seller_name ?? 'Restaurant',
    brandName:   item.seller_name ?? 'Restaurant',
  })

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
          <span className={styles.labelEmoji}>🍽️</span>
          <span className={styles.labelText}>Cravings</span>
          <span className={styles.labelCount}>{items.length}</span>
        </div>

        <div className={styles.scroll}>
          {items.map(item => (
            <button
              key={item.id}
              className={styles.item}
              onClick={() => setOrderItem(item)}
            >
              {item.product_image
                ? <img src={item.product_image} alt={item.product_name} className={styles.itemImg} />
                : <div className={styles.itemImgFallback}>🍜</div>
              }
              <div className={styles.itemName}>{item.product_name}</div>
              <div className={styles.itemPrice}>{formatIDR(item.product_price)}</div>
            </button>
          ))}
        </div>

        <div className={styles.hint}>Tap a dish to send it anonymously</div>
      </div>

      <FoodOrderSheet
        open={!!orderItem}
        product={orderItem ? productFor(orderItem) : null}
        seller={orderItem ? sellerFor(orderItem) : null}
        giftFor={recipient}
        onClose={() => setOrderItem(null)}
        showToast={showToast}
      />
    </>
  )
}
