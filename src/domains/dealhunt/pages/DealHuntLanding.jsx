import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './DealHuntLanding.module.css';

// Component imports — will gracefully degrade if not yet built
let DealCard, DealFilters, CountdownTimer;
try { DealCard = require('../components/DealCard').default; } catch { DealCard = null; }
try { DealFilters = require('../components/DealFilters').default; } catch { DealFilters = null; }
try { CountdownTimer = require('../components/CountdownTimer').default; } catch { CountdownTimer = null; }

// Hook import — fallback to demo data
let useDeals;
try { useDeals = require('../hooks/useDeals').default; } catch { useDeals = null; }

// ── Demo data ──────────────────────────────────────────────
const DEMO_DEALS = [
  { id: 'd1', title: 'Nasi Goreng Spesial', domain: 'food', seller_name: 'Warung Bu Sari', original_price: 35000, deal_price: 19000, quantity_available: 50, quantity_claimed: 38, end_time: Date.now() + 3*3600000, images: ['https://picsum.photos/seed/deal1/400/300'], city: 'Yogyakarta', is_hot: true },
  { id: 'd2', title: 'Leather Wallet Handmade', domain: 'marketplace', seller_name: 'Kulit Asli', original_price: 250000, deal_price: 149000, quantity_available: 20, quantity_claimed: 14, end_time: Date.now() + 5*3600000, images: ['https://picsum.photos/seed/deal2/400/300'], city: 'Jakarta' },
  { id: 'd3', title: 'Full Body Massage 90min', domain: 'massage', seller_name: 'Zen Spa Jogja', original_price: 200000, deal_price: 120000, quantity_available: 15, quantity_claimed: 11, end_time: Date.now() + 2*3600000, images: ['https://picsum.photos/seed/deal3/400/300'], city: 'Yogyakarta', is_hot: true },
  { id: 'd4', title: 'Honda Vario 125 Sewa Harian', domain: 'rentals', seller_name: 'Jogja Rental', original_price: 100000, deal_price: 65000, quantity_available: 8, quantity_claimed: 5, end_time: Date.now() + 7*3600000, images: ['https://picsum.photos/seed/deal4/400/300'], city: 'Yogyakarta' },
  { id: 'd5', title: 'Bakso Jumbo + Es Teh', domain: 'food', seller_name: 'Bakso Pak Budi', original_price: 25000, deal_price: 15000, quantity_available: 100, quantity_claimed: 87, end_time: Date.now() + 1*3600000, images: ['https://picsum.photos/seed/deal5/400/300'], city: 'Semarang', is_hot: true },
  { id: 'd6', title: 'Wireless Earbuds Pro', domain: 'marketplace', seller_name: 'TechMax ID', original_price: 450000, deal_price: 279000, quantity_available: 30, quantity_claimed: 12, end_time: Date.now() + 6*3600000, images: ['https://picsum.photos/seed/deal6/400/300'], city: 'Jakarta' },
  { id: 'd7', title: 'Ojek Bandara Jogja', domain: 'rides', seller_name: 'GoJek Partner', original_price: 80000, deal_price: 45000, quantity_available: 25, quantity_claimed: 18, end_time: Date.now() + 4*3600000, images: ['https://picsum.photos/seed/deal7/400/300'], city: 'Yogyakarta' },
  { id: 'd8', title: 'Couple Massage + Sauna', domain: 'massage', seller_name: 'Bali Spa', original_price: 500000, deal_price: 299000, quantity_available: 10, quantity_claimed: 8, end_time: Date.now() + 1.5*3600000, images: ['https://picsum.photos/seed/deal8/400/300'], city: 'Bali', is_hot: true },
];

// ── Categories ─────────────────────────────────────────────
const CATEGORIES = [
  { key: 'all', label: 'Semua' },
  { key: 'food', label: '\u{1F37D}\uFE0F Food' },
  { key: 'marketplace', label: '\u{1F6CD}\uFE0F Market' },
  { key: 'massage', label: '\u{1F486} Massage' },
  { key: 'rentals', label: '\u{1F697} Rentals' },
  { key: 'rides', label: '\u{1F3CD}\uFE0F Rides' },
];

// ── Sort options ───────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'ending_soon', label: 'Segera Berakhir' },
  { value: 'newest', label: 'Terbaru' },
  { value: 'biggest_discount', label: 'Diskon Terbesar' },
  { value: 'lowest_price', label: 'Harga Terendah' },
];

// ── Inline countdown (fallback if CountdownTimer missing) ─
function InlineCountdown({ targetTime }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    function tick() {
      const diff = Math.max(0, targetTime - Date.now());
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setRemaining(`${h}:${m}:${s}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  return <span className={styles.countdownTime}>{remaining}</span>;
}

// ── Fallback DealCard ──────────────────────────────────────
function FallbackDealCard({ deal, onTap }) {
  const pct = Math.round(((deal.original_price - deal.deal_price) / deal.original_price) * 100);
  const claimed = Math.round((deal.quantity_claimed / deal.quantity_available) * 100);

  return (
    <div
      onClick={onTap}
      style={{
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid rgba(255,255,255,0.06)',
        transition: 'transform 0.2s',
      }}
    >
      <div style={{ position: 'relative' }}>
        <img
          src={deal.images?.[0] || 'https://picsum.photos/400/300'}
          alt={deal.title}
          style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
        {deal.is_hot && (
          <span style={{
            position: 'absolute', top: 6, left: 6,
            background: '#e53935', color: '#fff', fontSize: 10,
            fontWeight: 700, padding: '2px 7px', borderRadius: 4,
          }}>
            SEGERA HABIS
          </span>
        )}
        <span style={{
          position: 'absolute', top: 6, right: 6,
          background: '#8DC63F', color: '#000', fontSize: 11,
          fontWeight: 800, padding: '2px 7px', borderRadius: 4,
        }}>
          -{pct}%
        </span>
      </div>
      <div style={{ padding: '10px 10px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#eee', marginBottom: 4, lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {deal.title}
        </div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>{deal.seller_name}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#8DC63F' }}>
            Rp{deal.deal_price.toLocaleString('id-ID')}
          </span>
          <span style={{ fontSize: 11, color: '#666', textDecoration: 'line-through' }}>
            Rp{deal.original_price.toLocaleString('id-ID')}
          </span>
        </div>
        {/* Claim progress bar */}
        <div style={{
          marginTop: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 6,
          height: 6, overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            width: `${claimed}%`, height: '100%', borderRadius: 6,
            background: claimed > 75 ? '#e53935' : '#8DC63F',
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ fontSize: 10, color: '#777', marginTop: 4 }}>
          {deal.quantity_claimed}/{deal.quantity_available} terjual
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// DealHuntLanding
// ════════════════════════════════════════════════════════════
export default function DealHuntLanding({ open, onClose, onSelectDeal, onCreateDeal }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('ending_soon');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const categoryScrollRef = useRef(null);

  // Try hook, fall back to demo data
  const hookData = useDeals ? useDeals() : null;
  const rawDeals = hookData?.deals || DEMO_DEALS;

  // Batch expiry = earliest end_time among deals
  const batchExpiry = useMemo(() => {
    if (!rawDeals.length) return Date.now() + 3600000;
    return Math.min(...rawDeals.map(d => d.end_time));
  }, [rawDeals]);

  // Filter & sort
  const deals = useMemo(() => {
    let list = [...rawDeals];

    // Category filter
    if (activeCategory !== 'all') {
      list = list.filter(d => d.domain === activeCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.seller_name.toLowerCase().includes(q) ||
        d.city?.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'ending_soon':
        list.sort((a, b) => a.end_time - b.end_time);
        break;
      case 'newest':
        list.sort((a, b) => b.end_time - a.end_time);
        break;
      case 'biggest_discount':
        list.sort((a, b) => {
          const dA = (a.original_price - a.deal_price) / a.original_price;
          const dB = (b.original_price - b.deal_price) / b.original_price;
          return dB - dA;
        });
        break;
      case 'lowest_price':
        list.sort((a, b) => a.deal_price - b.deal_price);
        break;
      default:
        break;
    }

    return list;
  }, [rawDeals, activeCategory, sortBy, searchQuery]);

  // Auto-focus search input
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleCategoryTap = useCallback((key) => {
    setActiveCategory(key);
  }, []);

  // Don't render when closed
  if (!open) return null;

  const CardComponent = DealCard || FallbackDealCard;

  const content = (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={onClose} aria-label="Kembali">
            &#8592;
          </button>
          <span className={styles.brandTitle}>INDOO DEAL HUNT</span>
          <button className={styles.searchBtn} onClick={() => setSearchOpen(true)} aria-label="Cari">
            &#128269;
          </button>
        </header>

        {/* ── Countdown Banner ── */}
        <div className={styles.countdownBanner}>
          <span className={styles.fireIcon}>&#128293;</span>
          <span className={styles.countdownLabel}>Berakhir dalam</span>
          {CountdownTimer
            ? <CountdownTimer targetTime={batchExpiry} className={styles.countdownTime} />
            : <InlineCountdown targetTime={batchExpiry} />
          }
          <span className={styles.fireIcon}>&#128293;</span>
        </div>

        {/* ── Category Pills ── */}
        <div className={styles.categoryScroll} ref={categoryScrollRef}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              className={`${styles.categoryPill} ${activeCategory === cat.key ? styles.categoryPillActive : ''}`}
              onClick={() => handleCategoryTap(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── DealFilters (external) or inline Sort Bar ── */}
        {DealFilters ? (
          <DealFilters
            sortBy={sortBy}
            onSortChange={setSortBy}
            category={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        ) : (
          <div className={styles.sortBar}>
            <span className={styles.sortLabel}>Urutkan:</span>
            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── Deal Grid / Empty State ── */}
        {deals.length > 0 ? (
          <div className={styles.dealGrid}>
            {deals.map((deal, i) => (
              <div
                key={deal.id}
                className={styles.cardWrap}
                style={{ animationDelay: `${0.04 * (i + 1)}s` }}
              >
                <CardComponent
                  deal={deal}
                  onTap={() => onSelectDeal?.(deal)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIllustration}>&#128722;</div>
            <div className={styles.emptyTitle}>Belum ada deal</div>
            <div className={styles.emptySubtitle}>Cek lagi nanti ya!</div>
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <button className={styles.fab} onClick={onCreateDeal} aria-label="Buat deal baru">
        &#43;
      </button>

      {/* ── Search Overlay ── */}
      {searchOpen && (
        <div className={styles.searchOverlay}>
          <div className={styles.searchInputWrap}>
            <input
              ref={searchInputRef}
              className={styles.searchInput}
              type="text"
              placeholder="Cari deal, toko, atau kota..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button
              className={styles.searchClose}
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
