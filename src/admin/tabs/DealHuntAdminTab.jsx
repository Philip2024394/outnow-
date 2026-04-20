/**
 * DealHuntAdminTab
 * Admin management for Deal Hunt — flash deals across all domains.
 * - 10% commission on each claimed deal
 * - Manage deal lifecycle: active, expired, sold out, cancelled
 */
import { useState } from 'react'
import styles from './DealHuntAdminTab.module.css'

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

// ── Demo deals ──────────────────────────────────────────────────────────────────
const DEMO_DEALS = [
  {
    id: 'dh1', title: 'Nasi Goreng Spesial Bundle', seller: 'Warung Sari Rasa', sellerId: 's1',
    domain: 'food', image: 'https://picsum.photos/seed/deal1/100/100',
    priceOriginal: 45000, priceDeal: 29000, discount: 36,
    claimed: 18, total: 25, status: 'active',
    createdAt: '2026-04-18T10:00:00Z', expiresAt: '2026-04-22T23:59:00Z',
  },
  {
    id: 'dh2', title: 'Batik Kemeja Premium', seller: 'Toko Batik Mega', sellerId: 's2',
    domain: 'marketplace', image: 'https://picsum.photos/seed/deal2/100/100',
    priceOriginal: 350000, priceDeal: 199000, discount: 43,
    claimed: 12, total: 20, status: 'active',
    createdAt: '2026-04-17T08:00:00Z', expiresAt: '2026-04-25T23:59:00Z',
  },
  {
    id: 'dh3', title: 'Full Body Massage 90min', seller: 'Bali Zen Spa', sellerId: 's3',
    domain: 'services', image: 'https://picsum.photos/seed/deal3/100/100',
    priceOriginal: 280000, priceDeal: 150000, discount: 46,
    claimed: 30, total: 30, status: 'sold_out',
    createdAt: '2026-04-15T09:00:00Z', expiresAt: '2026-04-21T23:59:00Z',
  },
  {
    id: 'dh4', title: 'Ayam Geprek + Es Teh', seller: 'Ayam Geprek Mbak Rina', sellerId: 's4',
    domain: 'food', image: 'https://picsum.photos/seed/deal4/100/100',
    priceOriginal: 32000, priceDeal: 19900, discount: 38,
    claimed: 45, total: 50, status: 'active',
    createdAt: '2026-04-19T12:00:00Z', expiresAt: '2026-04-23T23:59:00Z',
  },
  {
    id: 'dh5', title: 'Wireless Earbuds Pro', seller: 'Toko Elektronik Jaya', sellerId: 's5',
    domain: 'marketplace', image: 'https://picsum.photos/seed/deal5/100/100',
    priceOriginal: 450000, priceDeal: 249000, discount: 45,
    claimed: 8, total: 15, status: 'expired',
    createdAt: '2026-04-10T10:00:00Z', expiresAt: '2026-04-16T23:59:00Z',
  },
  {
    id: 'dh6', title: 'Hair Treatment + Blow', seller: 'Salon Cantik Dewi', sellerId: 's6',
    domain: 'beauty', image: 'https://picsum.photos/seed/deal6/100/100',
    priceOriginal: 200000, priceDeal: 99000, discount: 51,
    claimed: 0, total: 10, status: 'cancelled',
    createdAt: '2026-04-14T11:00:00Z', expiresAt: '2026-04-20T23:59:00Z',
  },
  {
    id: 'dh7', title: 'Bakso Jumbo 2 Porsi', seller: 'Bakso Pak Budi', sellerId: 's7',
    domain: 'food', image: 'https://picsum.photos/seed/deal7/100/100',
    priceOriginal: 40000, priceDeal: 25000, discount: 38,
    claimed: 22, total: 40, status: 'active',
    createdAt: '2026-04-19T07:00:00Z', expiresAt: '2026-04-24T23:59:00Z',
  },
  {
    id: 'dh8', title: 'Karaoke Room 2 Jam', seller: 'Happy Voice KTV', sellerId: 's8',
    domain: 'entertainment', image: 'https://picsum.photos/seed/deal8/100/100',
    priceOriginal: 150000, priceDeal: 79000, discount: 47,
    claimed: 15, total: 15, status: 'sold_out',
    createdAt: '2026-04-16T14:00:00Z', expiresAt: '2026-04-22T23:59:00Z',
  },
  {
    id: 'dh9', title: 'Handmade Silver Ring', seller: 'Handmade by Dewi', sellerId: 's9',
    domain: 'marketplace', image: 'https://picsum.photos/seed/deal9/100/100',
    priceOriginal: 175000, priceDeal: 99000, discount: 43,
    claimed: 3, total: 10, status: 'expired',
    createdAt: '2026-04-08T10:00:00Z', expiresAt: '2026-04-14T23:59:00Z',
  },
  {
    id: 'dh10', title: 'Sate Kambing 20 Tusuk', seller: 'Sate & Gule Pak Sabar', sellerId: 's10',
    domain: 'food', image: 'https://picsum.photos/seed/deal10/100/100',
    priceOriginal: 80000, priceDeal: 55000, discount: 31,
    claimed: 10, total: 30, status: 'active',
    createdAt: '2026-04-20T06:00:00Z', expiresAt: '2026-04-26T23:59:00Z',
  },
]

const DOMAIN_OPTIONS = [
  { key: 'all',           label: 'All Domains' },
  { key: 'food',          label: 'Food' },
  { key: 'marketplace',   label: 'Marketplace' },
  { key: 'services',      label: 'Services' },
  { key: 'beauty',        label: 'Beauty' },
  { key: 'entertainment', label: 'Entertainment' },
]

const STATUS_OPTIONS = [
  { key: 'all',       label: 'All Status' },
  { key: 'active',    label: 'Active' },
  { key: 'expired',   label: 'Expired' },
  { key: 'sold_out',  label: 'Sold Out' },
  { key: 'cancelled', label: 'Cancelled' },
]

const DOMAIN_STYLE = {
  food:          styles => styles.domainFood,
  marketplace:   styles => styles.domainMarketplace,
  services:      styles => styles.domainServices,
  beauty:        styles => styles.domainBeauty,
  entertainment: styles => styles.domainEntertainment,
}

const DOMAIN_ICONS = {
  food: '🍽️', marketplace: '🛍️', services: '🔧', beauty: '💅', entertainment: '🎤',
}

const STATUS_LABELS = {
  active: 'Active', expired: 'Expired', sold_out: 'Sold Out', cancelled: 'Cancelled',
}

export default function DealHuntAdminTab() {
  const [deals, setDeals]         = useState(DEMO_DEALS)
  const [statusFilter, setStatusFilter] = useState('all')
  const [domainFilter, setDomainFilter] = useState('all')
  const [search, setSearch]       = useState('')

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalDeals  = deals.length
  const activeDeals = deals.filter(d => d.status === 'active').length
  const claimedTotal = deals.reduce((s, d) => s + d.claimed, 0)
  const expiredDeals = deals.filter(d => d.status === 'expired').length

  // Revenue = 10% commission on all claimed deal prices
  const totalRevenue = deals.reduce((s, d) => s + (d.priceDeal * d.claimed * 0.10), 0)

  // Claims today (demo: count claims from deals created today)
  const todayStr = new Date().toISOString().slice(0, 10)
  const claimsToday = deals
    .filter(d => d.createdAt.slice(0, 10) === todayStr)
    .reduce((s, d) => s + d.claimed, 0)

  // Top seller by claimed volume
  const sellerClaims = {}
  deals.forEach(d => {
    sellerClaims[d.seller] = (sellerClaims[d.seller] || 0) + d.claimed
  })
  const topSeller = Object.entries(sellerClaims).sort((a, b) => b[1] - a[1])[0]

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = deals.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    if (domainFilter !== 'all' && d.domain !== domainFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!d.title.toLowerCase().includes(q) && !d.seller.toLowerCase().includes(q)) return false
    }
    return true
  })

  // ── Actions ───────────────────────────────────────────────────────────────
  const handlePause = (id) => {
    setDeals(prev => prev.map(d => d.id === id && d.status === 'active'
      ? { ...d, status: 'expired' } : d))
  }

  const handleCancel = (id) => {
    setDeals(prev => prev.map(d => d.id === id && d.status !== 'cancelled'
      ? { ...d, status: 'cancelled' } : d))
  }

  const getDomainClass = (domain) => {
    const map = {
      food: styles.domainFood,
      marketplace: styles.domainMarketplace,
      services: styles.domainServices,
      beauty: styles.domainBeauty,
      entertainment: styles.domainEntertainment,
    }
    return map[domain] || ''
  }

  const getStatusClass = (status) => {
    const map = {
      active: styles.statusActive,
      expired: styles.statusExpired,
      sold_out: styles.statusSoldOut,
      cancelled: styles.statusCancelled,
    }
    return map[status] || ''
  }

  return (
    <div className={styles.wrap}>

      {/* ── Summary cards ── */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Revenue (10%)</span>
          <span className={styles.summaryValue} style={{ color: '#34C759' }}>{fmtRp(totalRevenue)}</span>
          <span className={styles.summarySub}>commission earned</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Active Deals</span>
          <span className={styles.summaryValue} style={{ color: '#00E5FF' }}>{activeDeals}</span>
          <span className={styles.summarySub}>{totalDeals} total deals</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Claims Today</span>
          <span className={styles.summaryValue} style={{ color: '#FF9500' }}>{claimsToday}</span>
          <span className={styles.summarySub}>{claimedTotal} all time</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Top Seller</span>
          <span className={styles.summaryValue} style={{ color: '#A855F7', fontSize: 16 }}>
            {topSeller ? topSeller[0] : '—'}
          </span>
          <span className={styles.summarySub}>{topSeller ? `${topSeller[1]} claims` : ''}</span>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{
        display: 'flex', gap: 14, padding: '10px 14px',
        background: 'rgba(255,255,255,0.02)', borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.06)', fontSize: 13,
        color: 'rgba(255,255,255,0.5)', alignItems: 'center',
      }}>
        <span>Total: <strong style={{ color: '#fff' }}>{totalDeals}</strong></span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
        <span>Active: <strong style={{ color: '#34C759' }}>{activeDeals}</strong></span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
        <span>Claimed: <strong style={{ color: '#FF9500' }}>{claimedTotal}</strong></span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
        <span>Expired: <strong style={{ color: 'rgba(255,255,255,0.4)' }}>{expiredDeals}</strong></span>
      </div>

      {/* ── Filters ── */}
      <div className={styles.filtersRow}>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={domainFilter}
          onChange={e => setDomainFilter(e.target.value)}
        >
          {DOMAIN_OPTIONS.map(o => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search by title or seller..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── Deal table ── */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Domain</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Claims</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.emptyRow}>No deals match this filter</td>
              </tr>
            )}
            {filtered.map(d => (
              <tr key={d.id}>
                <td>
                  <img src={d.image} alt={d.title} className={styles.thumb} />
                </td>
                <td className={styles.titleCell}>
                  <span className={styles.dealTitle}>{d.title}</span>
                  <span className={styles.dealSeller}>{d.seller}</span>
                </td>
                <td>
                  <span className={`${styles.domainPill} ${getDomainClass(d.domain)}`}>
                    {DOMAIN_ICONS[d.domain] || ''} {d.domain}
                  </span>
                </td>
                <td className={styles.priceCell}>
                  <span className={styles.priceOriginal}>{fmtRp(d.priceOriginal)}</span>
                  <br />
                  <span className={styles.priceDeal}>{fmtRp(d.priceDeal)}</span>
                </td>
                <td>
                  <span className={styles.discountBadge}>-{d.discount}%</span>
                </td>
                <td className={styles.claimsCell}>
                  <span className={styles.claimsCurrent}>{d.claimed}</span>
                  <span className={styles.claimsTotal}>/{d.total}</span>
                </td>
                <td>
                  <span className={`${styles.statusPill} ${getStatusClass(d.status)}`}>
                    {STATUS_LABELS[d.status]}
                  </span>
                </td>
                <td>
                  <div className={styles.actionBtns}>
                    <button className={styles.btnView} onClick={() => alert(`View deal: ${d.title}`)}>
                      View
                    </button>
                    {d.status === 'active' && (
                      <>
                        <button className={styles.btnPause} onClick={() => handlePause(d.id)}>
                          Pause
                        </button>
                        <button className={styles.btnCancel} onClick={() => handleCancel(d.id)}>
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
