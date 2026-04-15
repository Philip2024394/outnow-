/**
 * AuctionAdminTab — Admin dashboard tab for auction monitoring.
 * Shows: live auctions, completed, non-payment bans, activity feed, stats.
 */
import { useState, useEffect } from 'react'
import { getAuctionStats, fmtIDR, AUCTION_STATUS } from '@/services/auctionService'
import styles from './AuctionAdminTab.module.css'

function timeAgo(ts) {
  const d = Date.now() - ts
  if (d < 60000) return `${Math.floor(d / 1000)}s ago`
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`
  return `${Math.floor(d / 3600000)}h ago`
}

function formatTimer(ms) {
  if (ms <= 0) return 'Ended'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}

const STATUS_COLORS = {
  live: '#8DC63F',
  ended: '#818CF8',
  awaiting_payment: '#FBBF24',
  paid: '#8DC63F',
  forfeited: '#EF4444',
  second_chance: '#FF9500',
  unsold: 'rgba(255,255,255,0.3)',
  scheduled: '#60A5FA',
}

export default function AuctionAdminTab() {
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('all') // all | live | ended | awaiting

  useEffect(() => {
    setStats(getAuctionStats())
    const id = setInterval(() => setStats(getAuctionStats()), 5000)
    return () => clearInterval(id)
  }, [])

  if (!stats) return <div className={styles.loading}>Loading...</div>

  const filtered = filter === 'all' ? stats.auctions
    : filter === 'live' ? stats.auctions.filter(a => a.status === AUCTION_STATUS.LIVE)
    : filter === 'awaiting' ? stats.auctions.filter(a => a.status === AUCTION_STATUS.AWAITING_PAYMENT)
    : stats.auctions.filter(a => [AUCTION_STATUS.PAID, AUCTION_STATUS.UNSOLD, AUCTION_STATUS.FORFEITED].includes(a.status))

  return (
    <div className={styles.tab}>
      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statVal}>{stats.total}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statVal} style={{ color: '#8DC63F' }}>{stats.live}</span>
          <span className={styles.statLabel}>Live</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statVal} style={{ color: '#FBBF24' }}>{stats.awaiting}</span>
          <span className={styles.statLabel}>Awaiting Pay</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statVal}>{stats.totalBids}</span>
          <span className={styles.statLabel}>Total Bids</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statVal} style={{ color: '#F59E0B' }}>{fmtIDR(stats.totalRevenue)}</span>
          <span className={styles.statLabel}>Revenue</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className={styles.filterRow}>
        {['all', 'live', 'awaiting', 'ended'].map(f => (
          <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'live' ? '🔴 Live' : f === 'awaiting' ? '⏳ Awaiting' : '✅ Ended'}
          </button>
        ))}
      </div>

      {/* Auction list */}
      <div className={styles.list}>
        {filtered.length === 0 && <div className={styles.empty}>No auctions in this category</div>}
        {filtered.map(a => (
          <div key={a.id} className={styles.auctionRow}>
            <div className={styles.rowLeft}>
              {a.productImage && <img src={a.productImage} alt="" className={styles.rowImg} />}
              <div className={styles.rowInfo}>
                <span className={styles.rowName}>{a.productName}</span>
                <span className={styles.rowSeller}>Seller: {a.sellerName}</span>
                <div className={styles.rowMeta}>
                  <span>Bids: {a.bidCount}</span>
                  <span>Start: {fmtIDR(a.startPrice)}</span>
                  {a.reservePrice && <span>Reserve: {fmtIDR(a.reservePrice)}</span>}
                </div>
              </div>
            </div>
            <div className={styles.rowRight}>
              <span className={styles.rowPrice}>{fmtIDR(a.currentPrice)}</span>
              <span className={styles.rowStatus} style={{ color: STATUS_COLORS[a.status] ?? '#fff' }}>
                {a.status.replace(/_/g, ' ')}
              </span>
              {a.status === AUCTION_STATUS.LIVE && (
                <span className={styles.rowTimer}>{formatTimer(a.endTime - Date.now())}</span>
              )}
              {a.winnerId && (
                <span className={styles.rowWinner}>Winner: {a.winnerName}</span>
              )}
            </div>

            {/* Bid activity */}
            {a.bids.length > 0 && (
              <div className={styles.rowBids}>
                {a.bids.slice(0, 5).map(b => (
                  <div key={b.id} className={styles.bidEntry}>
                    <span className={styles.bidName}>{b.buyerName}</span>
                    <span className={styles.bidAmt}>{fmtIDR(b.amount)}</span>
                    <span className={styles.bidTime}>{timeAgo(b.time)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
