import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './QAFeedScreen.module.css'

const INDOO_LOGO = 'https://ik.imagekit.io/nepgaxllc/Indoo%20Market%20logo%20design.png?updatedAt=1776203793752'

// ── Demo marketplace products (fallback when Supabase is empty) ───────────────
const DEMO_MKT_PRODUCTS = [
  { id: 'dm1', name: 'Handmade Batik Scarf',     price: 180000, currency: 'IDR', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', user_id: null, sellerName: 'Bali Crafts Co'    },
  { id: 'dm2', name: 'Rattan Beach Bag',          price: 250000, currency: 'IDR', image_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&q=80', user_id: null, sellerName: 'Island Weavers'   },
  { id: 'dm3', name: 'Silver Kecak Bracelet',     price: 120000, currency: 'IDR', image_url: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=400&q=80', user_id: null, sellerName: 'Silver Bali'       },
  { id: 'dm4', name: 'Coconut Shell Bowl Set',    price: 95000,  currency: 'IDR', image_url: 'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?w=400&q=80', user_id: null, sellerName: 'Eco Bali'          },
  { id: 'dm5', name: 'Hand-painted Sarong',       price: 210000, currency: 'IDR', image_url: 'https://images.unsplash.com/photo-1592492152545-9695d3f473f4?w=400&q=80', user_id: null, sellerName: 'Ubud Textiles'     },
  { id: 'dm6', name: 'Aromatherapy Candle Gift',  price: 85000,  currency: 'IDR', image_url: 'https://images.unsplash.com/photo-1603905078522-f9be3e1c2f1b?w=400&q=80', user_id: null, sellerName: 'Scents of Bali'   },
  { id: 'dm7', name: 'Bamboo Sunglasses',         price: 145000, currency: 'IDR', image_url: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&q=80', user_id: null, sellerName: 'Green Island Co'  },
  { id: 'dm8', name: 'Organic Lulur Body Scrub',  price: 75000,  currency: 'IDR', image_url: 'https://images.unsplash.com/photo-1570194065650-d99fb4b38614?w=400&q=80', user_id: null, sellerName: 'Spa Naturals Bali' },
]

export default function LiveMarketplaceFeed({ onClose, onSelectProduct }) {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [query,    setQuery]    = useState('')

  useEffect(() => {
    async function load() {
      try {
        if (!supabase) throw new Error('no supabase')
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, currency, image_url, description, user_id')
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(60)
        if (error) throw error
        setProducts(data?.length ? data : DEMO_MKT_PRODUCTS)
      } catch {
        setProducts(DEMO_MKT_PRODUCTS)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = !query.trim()
    ? products
    : products.filter(p => p.name?.toLowerCase().includes(query.trim().toLowerCase()))

  function fmtPrice(p) {
    const n = Number(p.price)
    if (p.currency === 'IDR') return `Rp ${n.toLocaleString('id-ID')}`
    return `${p.currency ?? ''} ${n.toLocaleString()}`
  }

  return (
    <div className={styles.lmScreen}>
      {/* ── Header — logo + live pill only ── */}
      <div className={styles.lmHeader}>
        <div className={styles.lmLogoWrap}>
          <img src={INDOO_LOGO} alt="Indoo Market" className={styles.lmLogo} />
        </div>
        <span className={styles.lmLivePill}>
          <span className={styles.lmLiveDot} />
          LIVE
        </span>
      </div>

      {/* ── Search bar — close button on the right ── */}
      <div className={styles.lmSearchRow}>
        <div className={styles.lmSearchWrap}>
          <svg className={styles.lmSearchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.lmSearchInput}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products…"
          />
          {query && (
            <button className={styles.lmSearchClear} onClick={() => setQuery('')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
        {/* Close button — right of search bar */}
        <button className={styles.lmCloseBtn} onClick={onClose} aria-label="Close marketplace">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
      </div>

      {/* ── Product grid ── */}
      {loading ? (
        <div className={styles.lmLoading}>
          <div className={styles.lmDot} /><div className={styles.lmDot} /><div className={styles.lmDot} />
        </div>
      ) : filtered.length === 0 ? (
        <p className={styles.lmEmpty}>No products found for "{query}"</p>
      ) : (
        <div className={styles.lmGrid}>
          {filtered.map(p => (
            <button key={p.id} className={styles.lmCard} onClick={() => onSelectProduct(p)}>
              <div className={styles.lmCardImgWrap}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} className={styles.lmCardImg} />
                  : <div className={styles.lmCardImgFallback}>🛍️</div>
                }
                <div className={styles.lmCardImgOverlay} />
              </div>
              <div className={styles.lmCardBody}>
                <span className={styles.lmCardName}>{p.name}</span>
                <span className={styles.lmCardPrice}>{fmtPrice(p)}</span>
                {p.sellerName && <span className={styles.lmCardSeller}>{p.sellerName}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
