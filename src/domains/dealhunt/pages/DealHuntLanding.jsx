import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import styles from './DealHuntLanding.module.css'
import DealReviewCarousel from '../components/DealReviewCarousel'

// ── Demo deals with larger images ─────────────────────────────────────────────
const DEMO_DEALS = [
  { id: 'd1', title: 'Nasi Goreng Spesial', domain: 'food', sub: 'Nasi goreng kampung dengan telur mata sapi, kerupuk, dan acar segar', seller_name: 'Warung Bu Sari', seller_photo: 'https://i.pravatar.cc/80?img=1', seller_rating: 4.8, original_price: 35000, deal_price: 19000, quantity_available: 50, quantity_claimed: 38, end_time: Date.now() + 3*3600000, images: ['https://picsum.photos/seed/nasgor/1080/1920'], city: 'Yogyakarta', is_hot: true },
  { id: 'd2', title: 'Leather Wallet Handmade', domain: 'marketplace', sub: 'Dompet kulit asli buatan tangan, jahitan rapi, tahan lama', seller_name: 'Kulit Asli', seller_photo: 'https://i.pravatar.cc/80?img=5', seller_rating: 4.6, original_price: 250000, deal_price: 149000, quantity_available: 20, quantity_claimed: 14, end_time: Date.now() + 5*3600000, images: ['https://picsum.photos/seed/wallet/1080/1920'], city: 'Jakarta' },
  { id: 'd3', title: 'Full Body Massage 90min', domain: 'massage', sub: 'Relaksasi total dengan aromaterapi dan hot stone pilihan', seller_name: 'Zen Spa Jogja', seller_photo: 'https://i.pravatar.cc/80?img=9', seller_rating: 4.9, original_price: 200000, deal_price: 120000, quantity_available: 15, quantity_claimed: 11, end_time: Date.now() + 2*3600000, images: ['https://picsum.photos/seed/massage/1080/1920'], city: 'Yogyakarta', is_hot: true },
  { id: 'd4', title: 'Honda Vario 125 Sewa Harian', domain: 'rentals', sub: 'Motor matic terawat, helm & jas hujan gratis, antar jemput', seller_name: 'Jogja Rental', seller_photo: 'https://i.pravatar.cc/80?img=14', seller_rating: 4.7, original_price: 100000, deal_price: 65000, quantity_available: 8, quantity_claimed: 5, end_time: Date.now() + 7*3600000, images: ['https://picsum.photos/seed/vario/1080/1920'], city: 'Yogyakarta' },
  { id: 'd5', title: 'Bakso Jumbo + Es Teh', domain: 'food', sub: 'Bakso urat jumbo dengan kuah kaldu sapi spesial, es teh manis', seller_name: 'Bakso Pak Budi', seller_photo: 'https://i.pravatar.cc/80?img=20', seller_rating: 4.8, original_price: 25000, deal_price: 15000, quantity_available: 100, quantity_claimed: 87, end_time: Date.now() + 1*3600000, images: ['https://picsum.photos/seed/bakso/1080/1920'], city: 'Semarang', is_hot: true },
  { id: 'd6', title: 'Wireless Earbuds Pro', domain: 'marketplace', sub: 'TWS noise cancelling, 30 jam battery, waterproof IPX5', seller_name: 'TechMax ID', seller_photo: 'https://i.pravatar.cc/80?img=25', seller_rating: 4.5, original_price: 450000, deal_price: 279000, quantity_available: 30, quantity_claimed: 12, end_time: Date.now() + 6*3600000, images: ['https://picsum.photos/seed/earbuds/1080/1920'], city: 'Jakarta' },
  { id: 'd7', title: 'Ojek Bandara Jogja', domain: 'rides', sub: 'Antar jemput bandara Adisucipto, motor bersih, driver ramah', seller_name: 'IndooRide Partner', seller_photo: 'https://i.pravatar.cc/80?img=33', seller_rating: 4.6, original_price: 80000, deal_price: 45000, quantity_available: 25, quantity_claimed: 18, end_time: Date.now() + 4*3600000, images: ['https://picsum.photos/seed/ojek/1080/1920'], city: 'Yogyakarta' },
  { id: 'd8', title: 'Couple Massage + Sauna', domain: 'massage', sub: 'Paket romantis 120 menit untuk berdua, include sauna & teh herbal', seller_name: 'Bali Spa', seller_photo: 'https://i.pravatar.cc/80?img=44', seller_rating: 4.9, original_price: 500000, deal_price: 299000, quantity_available: 10, quantity_claimed: 8, end_time: Date.now() + 1.5*3600000, images: ['https://picsum.photos/seed/couple/1080/1920'], city: 'Bali', is_hot: true },
]

const DOMAIN_COLORS = { food: '#F97316', marketplace: '#8DC63F', massage: '#A855F7', rentals: '#3B82F6', rides: '#EAB308' }
const DOMAIN_LABELS = { food: '🍽️ Makanan', marketplace: '🛍️ Market', massage: '💆 Massage', rentals: '🚗 Rental', rides: '🏍️ Ojek' }

const DEMO_REVIEW_DATA = [
  { id: 'r1', deal_title: 'Nasi Goreng Spesial', stars: 5, photo_url: 'https://picsum.photos/seed/rev1/200/200', caption: 'Enak banget! Porsi besar', reviewer_name: 'Sari', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'r2', deal_title: 'Nasi Goreng Spesial', stars: 4, photo_url: 'https://picsum.photos/seed/rev2/200/200', caption: 'Sambalnya mantap', reviewer_name: 'Budi', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 'r3', deal_title: 'Leather Wallet Handmade', stars: 5, photo_url: 'https://picsum.photos/seed/rev3/200/200', caption: 'Kualitas kulit bagus', reviewer_name: 'Rina', created_at: new Date(Date.now() - 259200000).toISOString() },
  { id: 'r4', deal_title: 'Bakso Jumbo + Es Teh', stars: 5, photo_url: 'https://picsum.photos/seed/rev4/200/200', caption: 'Bakso terenak di Semarang!', reviewer_name: 'Agus', created_at: new Date(Date.now() - 345600000).toISOString() },
  { id: 'r5', deal_title: 'Full Body Massage 90min', stars: 4, photo_url: 'https://picsum.photos/seed/rev5/200/200', caption: 'Relax banget, recommended', reviewer_name: 'Dewi', created_at: new Date(Date.now() - 432000000).toISOString() },
]

function fmtRp(n) { return `Rp${(n ?? 0).toLocaleString('id-ID')}` }

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(endTime) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, endTime - now)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { h, m, s, expired: diff <= 0, urgent: diff < 3600000 && diff > 0 }
}

// ── Single full-screen deal slide ─────────────────────────────────────────────
function DealSlide({ deal, isActive, onClaim, onChat }) {
  const { h, m, s, expired, urgent } = useCountdown(deal.end_time)
  const pct = Math.round((deal.quantity_claimed / deal.quantity_available) * 100)
  const discount = Math.round((1 - deal.deal_price / deal.original_price) * 100)
  const almostGone = pct >= 80
  const dealReviews = useMemo(() => DEMO_REVIEW_DATA.filter(r => r.deal_title === deal.title), [deal.title])
  const [reviewsOpen, setReviewsOpen] = useState(false)

  return (
    <div className={styles.slide}>
      {/* Full-screen background image */}
      <div className={styles.slideBg} style={{ backgroundImage: `url("${deal.images?.[0] ?? ''}")` }} />
      <div className={styles.slideScrim} />

      {/* Discount badge — top right */}
      <div className={styles.discountBadge}>-{discount}%</div>

      {/* HOT badge — top left */}
      {deal.is_hot && <div className={styles.hotBadge}>🔥 HOT</div>}

      {/* Right-side action buttons (TikTok style) */}
      <div className={styles.sideActions}>
        <button className={styles.sideBtn} onClick={() => onChat?.(deal)}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>Chat</span>
        </button>
        <button className={styles.sideBtn} onClick={() => setReviewsOpen(true)}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>{dealReviews.length || ''}</span>
          <span>Reviews</span>
        </button>
        <button className={styles.sideBtn} onClick={() => { try { navigator.share?.({ title: deal.title, text: `${deal.title} cuma ${fmtRp(deal.deal_price)}! 🔥`, url: window.location.href }) } catch {} }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" stroke="none"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="#fff" strokeWidth="1.5"/></svg>
          <span>Share</span>
        </button>
      </div>

      {/* Reviews panel — slides up from bottom */}
      {reviewsOpen && (
        <div className={styles.reviewsOverlay} onClick={() => setReviewsOpen(false)}>
          <div className={styles.reviewsPanel} onClick={e => e.stopPropagation()}>
            <div className={styles.reviewsHeader}>
              <span className={styles.reviewsTitle}>Reviews ({dealReviews.length})</span>
              <button className={styles.reviewsClose} onClick={() => setReviewsOpen(false)}>✕</button>
            </div>
            {dealReviews.length === 0 ? (
              <p className={styles.reviewsEmpty}>Belum ada review untuk deal ini</p>
            ) : (
              <div className={styles.reviewsList}>
                {dealReviews.map(r => (
                  <div key={r.id} className={styles.reviewItem}>
                    <img src={r.photo_url} alt="" className={styles.reviewImg} />
                    <div className={styles.reviewInfo}>
                      <div className={styles.reviewStars}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</div>
                      <p className={styles.reviewCaption}>{r.caption}</p>
                      <span className={styles.reviewerName}>— {r.reviewer_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom overlay — deal info */}
      <div className={styles.slideBottom}>
        {/* Title */}
        <h2 className={styles.slideTitle}>{deal.title}</h2>

        {/* Description */}
        <p className={styles.slideSub}>{deal.sub}</p>

        {/* Seller + location */}
        <div className={styles.sellerRow}>
          <img src={deal.seller_photo ?? 'https://i.pravatar.cc/40'} alt="" className={styles.sellerThumb} />
          <span className={styles.sellerName}>{deal.seller_name}</span>
          {deal.seller_rating && <span className={styles.sellerRating}>★ {deal.seller_rating}</span>}
        </div>

        {/* Price row */}
        <div className={styles.priceRow}>
          <span className={styles.dealPrice}>{fmtRp(deal.deal_price)}</span>
          <span className={styles.origPrice}>{fmtRp(deal.original_price)}</span>
          <span className={styles.saveBadge}>Hemat {fmtRp(deal.original_price - deal.deal_price)}</span>
        </div>

        {/* Progress bar */}
        <div className={styles.progressWrap}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{
                width: `${pct}%`,
                background: pct > 80 ? '#EF4444' : pct > 50 ? '#F59E0B' : '#8DC63F',
              }}
            />
          </div>
          <div className={styles.progressInfo}>
            <span>{deal.quantity_claimed} dari {deal.quantity_available} diklaim</span>
            {almostGone && <span className={styles.almostGone}>Segera Habis!</span>}
          </div>
        </div>

        {/* Countdown */}
        <div className={`${styles.countdown} ${urgent ? styles.countdownUrgent : ''}`}>
          <span>⏰</span>
          <span className={styles.countdownDigits}>
            {expired ? 'EXPIRED' : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
          </span>
        </div>

        {/* Claim button */}
        <button
          className={`${styles.claimBtn} ${expired || pct >= 100 ? styles.claimBtnDisabled : ''}`}
          onClick={() => !expired && pct < 100 && onClaim?.(deal)}
          disabled={expired || pct >= 100}
        >
          {pct >= 100 ? 'Habis!' : expired ? 'Deal Berakhir' : `🔥 Claim Sekarang — ${fmtRp(deal.deal_price)}`}
        </button>

        {/* Social proof */}
        <p className={styles.socialProof}>{Math.floor(Math.random() * 200 + 50)} orang melihat deal ini</p>
      </div>
    </div>
  )
}

// ── Main TikTok-style feed ────────────────────────────────────────────────────
export default function DealHuntLanding({ open, onClose, onSelectDeal, onCreateDeal }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef(null)
  const deals = DEMO_DEALS

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const idx = Math.round(el.scrollTop / el.clientHeight)
    if (idx !== activeIndex && idx >= 0 && idx < deals.length) setActiveIndex(idx)
  }, [activeIndex, deals.length])

  if (!open) return null

  return createPortal(
    <div className={styles.screen}>
      {/* Back button */}
      <button className={styles.backBtn} onClick={onClose}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>

      {/* Title + category/city context */}
      <div className={styles.headerTitle}>
        <span className={styles.headerBrand}>DEAL <span style={{ color: '#8DC63F' }}>HUNT</span></span>
        <span className={styles.headerLive}>● LIVE</span>
      </div>
      <div className={styles.headerSub}>
        <span className={styles.headerCategory}>{DOMAIN_LABELS[deals[activeIndex]?.domain] ?? ''}</span>
        <span className={styles.headerDot}>·</span>
        <span className={styles.headerCity}>{deals[activeIndex]?.city ?? 'Indonesia'}</span>
      </div>

      {/* Dot indicator — right side */}
      <div className={styles.dots}>
        {deals.map((_, i) => (
          <div key={i} className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`} />
        ))}
      </div>

      {/* Snap-scroll vertical feed */}
      <div className={styles.feed} ref={containerRef} onScroll={handleScroll}>
        {deals.map((deal, i) => (
          <DealSlide
            key={deal.id}
            deal={deal}
            isActive={i === activeIndex}
            onClaim={(d) => onSelectDeal?.(d)}
            onChat={(d) => onSelectDeal?.(d)}
          />
        ))}
      </div>

      {/* FAB — create deal */}
      <button className={styles.fab} onClick={onCreateDeal}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>,
    document.body
  )
}
