/**
 * AuctionPage — full-screen live auction page.
 * Shows active auctions, live bid feed, countdown, bid button.
 * Winner announcement + payment timer.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  getAuctions, placeBid, getBidLimits, isAuctionBanned,
  isBuyNowAvailable, buyNow, buyNowExpired, confirmBuyNowPayment,
  AUCTION_STATUS, fmtIDR,
} from '@/services/auctionService'
import { useAuth } from '@/hooks/useAuth'
import styles from './AuctionPage.module.css'

function formatTimer(ms) {
  if (ms <= 0) return '00:00:00'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

export default function AuctionPage({ open, onClose }) {
  const { user } = useAuth()
  const [auctions, setAuctions] = useState([])
  const [selected, setSelected] = useState(null)
  const [bidAmount, setBidAmount] = useState('')
  const [bidError, setBidError] = useState('')
  const [shareOpen, setShareOpen] = useState(null) // auction id when share menu open
  const [tick, setTick] = useState(0)
  const [productPreview, setProductPreview] = useState(null)
  const timerRef = useRef(null)

  const userId = user?.uid ?? user?.id ?? 'guest'
  const userName = user?.displayName ?? user?.display_name ?? 'You'
  const banned = isAuctionBanned(user)

  const refresh = useCallback(() => {
    setAuctions(getAuctions())
  }, [])

  useEffect(() => {
    if (!open) return
    refresh()
    timerRef.current = setInterval(() => { setTick(t => t + 1); refresh() }, 1000)
    return () => clearInterval(timerRef.current)
  }, [open, refresh])

  const handleBid = () => {
    if (!selected || banned) return
    const amount = parseInt(bidAmount)
    if (!amount || isNaN(amount)) { setBidError('Enter a valid amount'); return }
    const result = placeBid(selected.id, userId, userName, amount)
    if (result.error) { setBidError(result.error); return }
    setBidError('')
    setBidAmount('')
    refresh()
    setSelected(auctions.find(a => a.id === selected.id) ?? selected)
  }

  const handleBuyNow = () => {
    if (!selected || banned) return
    const result = buyNow(selected.id, userId, userName)
    if (result.error) { setBidError(result.error); return }
    refresh()
    setSelected(auctions.find(a => a.id === selected.id) ?? selected)
  }

  if (!open) return null

  const liveAuctions = auctions.filter(a => a.status === AUCTION_STATUS.LIVE && a.endTime > Date.now())
  const endedAuctions = auctions.filter(a => a.status !== AUCTION_STATUS.LIVE && a.status !== AUCTION_STATUS.SCHEDULED)

  // All recent bids across auctions for the live feed
  const allBids = auctions
    .filter(a => a.status === AUCTION_STATUS.LIVE)
    .flatMap(a => a.bids.slice(0, 3).map(b => ({ ...b, productName: a.productName })))
    .sort((a, b) => b.time - a.time)
    .slice(0, 8)

  const detail = selected ? auctions.find(a => a.id === selected.id) ?? selected : null
  const bidLimits = detail ? getBidLimits(detail.currentPrice) : { min: 0, max: 0 }
  const minBid = bidLimits.min
  const maxBid = bidLimits.max
  const canBuyNow = detail ? isBuyNowAvailable(detail) : false

  return createPortal(
    <div className={styles.page}>
      <div style={{ position: 'fixed', top: 6, left: 6, zIndex: 99990, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#000', boxShadow: '0 2px 8px rgba(141,198,63,0.4)' }}>M4</div><span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(141,198,63,0.6)' }}>AUCTION</span></div>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>🔨</span>
          <span className={styles.headerTitle}>Live Auctions</span>
        </div>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Banned banner */}
      {banned && (
        <div className={styles.bannedBanner}>
          You are currently banned from auctions due to non-payment. You can browse but not bid.
        </div>
      )}

      {/* Live bid feed */}
      {allBids.length > 0 && (
        <div className={styles.feedBar}>
          <span className={styles.feedIcon}>🔥</span>
          <div className={styles.feedScroll}>
            {allBids.map(b => (
              <span key={b.id} className={styles.feedItem}>
                <strong>{b.buyerName}</strong> bid {fmtIDR(b.amount)} on {b.productName} — {timeAgo(b.time)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detail view — selected auction */}
      {detail ? (
        <div className={styles.detail}>
          <button className={styles.detailBack} onClick={() => setSelected(null)}>← All auctions</button>

          <div className={styles.detailCard}>
            {detail.productImage && (
              <img src={detail.productImage} alt="" className={styles.detailImg} />
            )}
            <div className={styles.detailInfo}>
              <span className={styles.detailName}>{detail.productName}</span>
              <span className={styles.detailCondition}>
                {detail.itemCondition === 'used_good' ? '♻️ Used Good Condition'
                  : detail.itemCondition === 'needs_repair' ? '🔧 Needs Repair'
                  : '✨ New Unused'}
              </span>
              <span className={detail.reservePrice ? styles.reserveInCard : styles.noReserveInCard}>
                {detail.reservePrice ? '🔒 Price Reserve' : '🔓 No Reserve'}
              </span>
            </div>
            {/* Fingerprint button — bottom-right of product card */}
            <button className={styles.detailFingerprintBtn} onClick={() => setProductPreview(detail)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/><path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6 1 0 2 .2 3 .5"/><path d="M12 12c0 4-1 8-4 12"/><path d="M12 12c0 5 2 9.5 6 12"/><path d="M12 12c0-2 1-4 3-5.5"/><path d="M2 17a10 10 0 0 0 4.5 4.5"/>
              </svg>
            </button>
          </div>

          {/* Price + timer */}
          <div className={styles.priceBlock}>
            <div className={styles.priceLeft}>
              <span className={styles.priceLabel}>Current bid</span>
              <span className={styles.priceValue}>{fmtIDR(detail.currentPrice)}</span>
              <div className={styles.bidTimerRow}>
                <span className={styles.bidCount}>{detail.bidCount} bids</span>
                <span className={styles.timerValue}>
                  {detail.status === AUCTION_STATUS.AWAITING_PAYMENT
                    ? formatTimer((detail.paymentDeadline ?? 0) - Date.now())
                    : formatTimer(detail.endTime - Date.now())
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Delivery included label */}
          {detail.deliveryIncluded && (
            <div className={styles.deliveryIncluded}>📦 Price includes delivery within Indonesia</div>
          )}

          {/* Bid input — only for live auctions */}
          {detail.status === AUCTION_STATUS.LIVE && detail.endTime > Date.now() && !banned && (
            <div className={styles.bidSection}>
              <div className={styles.bidInputWrap}>
                <span className={styles.bidRp}>Rp</span>
                <input
                  type="number"
                  className={styles.bidInput}
                  value={bidAmount}
                  onChange={e => { setBidAmount(e.target.value); setBidError('') }}
                  placeholder={String(minBid)}
                  min={minBid}
                  max={maxBid}
                />
              </div>
              <button className={styles.bidBtn} onClick={handleBid}>
                Place Bid
              </button>
              {bidError && <span className={styles.bidError}>{bidError}</span>}
              <div className={styles.bidLimits}>
                <span>Min: {fmtIDR(minBid)}</span>
                <span>Max: {fmtIDR(maxBid)}</span>
              </div>

              {/* Buy Now */}
              {canBuyNow && (
                <button className={styles.buyNowBtn} onClick={handleBuyNow}>
                  Buy Now — {fmtIDR(detail.buyNowPrice)}
                </button>
              )}
            </div>
          )}

          {/* Buy Now payment window — 5 min countdown */}
          {detail.status === AUCTION_STATUS.PAUSED_BUY_NOW && (
            <div className={styles.buyNowBanner}>
              <span className={styles.buyNowBannerIcon}>⏱️</span>
              <div>
                <span className={styles.buyNowBannerTitle}>
                  {detail.buyNowBuyerId === userId ? 'Upload payment proof now!' : `${detail.winnerName} is buying now`}
                </span>
                <span className={styles.buyNowBannerTimer}>
                  {formatTimer((detail.buyNowDeadline ?? 0) - Date.now())} remaining
                </span>
                <span className={styles.buyNowBannerNote}>Auction paused — bidding resumes if not paid</span>
              </div>
            </div>
          )}

          {/* 5% commission info */}
          {detail.status === AUCTION_STATUS.PAID && detail.commission && (
            <div className={styles.commissionNote}>
              5% commission: {fmtIDR(detail.commission)} · Seller receives: {fmtIDR(detail.currentPrice - detail.commission)}
            </div>
          )}

          {/* Winner status */}
          {detail.status === AUCTION_STATUS.AWAITING_PAYMENT && (
            <div className={styles.winnerBanner}>
              <span className={styles.winnerIcon}>🏆</span>
              <div>
                <span className={styles.winnerName}>{detail.winnerName} won!</span>
                <span className={styles.winnerSub}>Payment due within 1 hour or forfeit</span>
              </div>
            </div>
          )}

          {detail.status === AUCTION_STATUS.PAID && (
            <div className={styles.paidBanner}>✅ Auction completed — payment received</div>
          )}

          {detail.status === AUCTION_STATUS.UNSOLD && (
            <div className={styles.unsoldBanner}>Auction ended — item unsold</div>
          )}

          {/* Bid history */}
          <div className={styles.bidHistory}>
            <span className={styles.bidHistoryTitle}>Bid History</span>
            {detail.bids.map((b, i) => (
              <div key={b.id} className={`${styles.bidRow} ${i === 0 ? styles.bidRowTop : ''}`}>
                {i === 0 && <span className={styles.topBidderCrown}>👑</span>}
                <span className={styles.bidRowName}>{b.buyerName}</span>
                <span className={styles.bidRowAmount}>{fmtIDR(b.amount)}</span>
                <span className={styles.bidRowTime}>{timeAgo(b.time)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Grid view — all auctions */
        <div className={styles.body}>
          {liveAuctions.length === 0 && endedAuctions.length === 0 && (
            <div className={styles.empty}>
              <span style={{ fontSize: 40, opacity: 0.3 }}>🔨</span>
              <span>No auctions right now</span>
              <span className={styles.emptySub}>Sellers can start auctions from their dashboard</span>
            </div>
          )}

          {liveAuctions.length > 0 && (
            <>
              <div className={styles.sectionLabelRow}>
                <span className={styles.sectionLabel}>🔴 Live Now</span>
                <span className={styles.liveCount}>{liveAuctions.length} live</span>
              </div>
              <div className={styles.grid}>
                {liveAuctions.map(a => (
                  <div key={a.id} className={styles.auctionCard} onClick={() => setSelected(a)}>
                    <div className={styles.cardImgWrap}>
                      {a.productImage ? <img src={a.productImage} alt="" className={styles.cardImg} /> : <div className={styles.cardImgPlaceholder}>📦</div>}
                      <span className={styles.cardLive}>LIVE</span>
                      <span className={styles.cardTimer}>{formatTimer(a.endTime - Date.now())}</span>
                      {/* Fingerprint — view product details */}
                      <button className={styles.fingerprintBtn} onClick={(e) => { e.stopPropagation(); setProductPreview(a) }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/><path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6 1 0 2 .2 3 .5"/><path d="M12 12c0 4-1 8-4 12"/><path d="M12 12c0 5 2 9.5 6 12"/><path d="M12 12c0-2 1-4 3-5.5"/><path d="M2 17a10 10 0 0 0 4.5 4.5"/>
                        </svg>
                      </button>
                    </div>
                    <div className={styles.cardInfo}>
                      <span className={styles.cardName}>{a.productName}</span>
                      <div className={styles.cardPriceRow}>
                        <span className={styles.cardPrice}>{fmtIDR(a.currentPrice)}</span>
                        <span className={styles.cardBids}>{a.bidCount} bids</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {endedAuctions.length > 0 && (
            <>
              <div className={styles.sectionLabel}>Recently Ended</div>
              <div className={styles.grid}>
                {endedAuctions.map(a => (
                  <button key={a.id} className={`${styles.auctionCard} ${styles.cardEnded}`} onClick={() => setSelected(a)}>
                    <div className={styles.cardImgWrap}>
                      {a.productImage ? <img src={a.productImage} alt="" className={styles.cardImg} /> : <div className={styles.cardImgPlaceholder}>📦</div>}
                      <span className={styles.cardStatus}>{a.status === AUCTION_STATUS.PAID ? '✅ Sold' : a.status === AUCTION_STATUS.AWAITING_PAYMENT ? '⏳ Awaiting' : '⏹ Ended'}</span>
                    </div>
                    <div className={styles.cardInfo}>
                      <span className={styles.cardName}>{a.productName}</span>
                      <span className={styles.cardPrice}>{fmtIDR(a.currentPrice)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Product preview popup */}
      {productPreview && (() => {
        const pp = productPreview
        const isLive = pp.status === AUCTION_STATUS.LIVE || pp.status === AUCTION_STATUS.PAUSED_BUY_NOW
        const hasRating = pp.rating && pp.rating > 0
        const shareText = `Check out this auction on Indoo Market: ${pp.productName} — currently at ${fmtIDR(pp.currentPrice)}`
        const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
        return (
        <div className={styles.previewBackdrop} onClick={() => setProductPreview(null)}>
          <div className={styles.previewModal} onClick={e => e.stopPropagation()}>

            {/* Main image with overlays */}
            <div className={styles.previewImgWrap}>
              {pp.productImage && (
                <img src={pp.productImage} alt={pp.productName} className={styles.previewMainImg} />
              )}
              {/* Top-left: bid count */}
              <span className={styles.previewBidCount}>{pp.bidCount} bids</span>
              {/* Top-right: star rating or Auction Listing badge */}
              {hasRating ? (
                <span className={styles.previewRating}>⭐ {pp.rating}</span>
              ) : (
                <span className={styles.previewAuctionBadge}>Auction Listing</span>
              )}
              {/* Bottom-left: NEW badge + product name + reserve status */}
              <div className={styles.previewImgNameWrap}>
                <span className={styles.previewImgName}>{pp.productName}</span>
                <span className={styles.previewImgReserve}>
                  {pp.reservePrice ? '🔒 Has Reserve' : '🔓 No Reserve'}
                </span>
              </div>
              {/* Bottom-right: share button */}
              <button className={styles.previewShare} onClick={e => { e.stopPropagation(); setShareOpen(shareOpen === pp.id ? null : pp.id) }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
              {/* Share menu */}
              {shareOpen === pp.id && (
                <div className={styles.shareMenu} onClick={e => e.stopPropagation()}>
                  <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className={styles.shareItem}>
                    <span className={styles.shareItemIcon}>💬</span> WhatsApp
                  </a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className={styles.shareItem}>
                    <span className={styles.shareItemIcon}>📘</span> Facebook
                  </a>
                  <a href={`https://www.instagram.com/`} target="_blank" rel="noopener noreferrer" className={styles.shareItem}>
                    <span className={styles.shareItemIcon}>📸</span> Instagram
                  </a>
                  <a href={`https://www.tiktok.com/`} target="_blank" rel="noopener noreferrer" className={styles.shareItem}>
                    <span className={styles.shareItemIcon}>🎵</span> TikTok
                  </a>
                  <a href={`mailto:?subject=${encodeURIComponent('Check this auction on Indoo Market')}&body=${encodeURIComponent(shareText)}`} className={styles.shareItem}>
                    <span className={styles.shareItemIcon}>✉️</span> Email
                  </a>
                </div>
              )}
            </div>

            {/* Product details below image */}
            <div className={styles.previewInfo}>
              {/* Price info */}
              <div className={styles.previewPriceRow}>
                <span className={styles.previewLabel}>Current bid</span>
                <span className={styles.previewPriceCurrent}>{fmtIDR(pp.currentPrice)}</span>
              </div>
              <div className={styles.previewPriceRow}>
                <span className={styles.previewLabel}>Starting price</span>
                <span className={styles.previewPrice}>{fmtIDR(pp.startPrice)}</span>
              </div>

              {/* Material / description / specs */}
              {pp.material && (
                <div className={styles.previewSpec}>
                  <span className={styles.previewSpecLabel}>Material</span>
                  <span className={styles.previewSpecVal}>{pp.material}</span>
                </div>
              )}
              {pp.description && (
                <div className={styles.previewDesc}>{pp.description}</div>
              )}
              <div className={styles.previewSpecs}>
                {pp.weight && (
                  <span className={styles.previewSpecChip}>⚖️ {pp.weight}</span>
                )}
                {pp.dimensions && (
                  <span className={styles.previewSpecChip}>📐 {pp.dimensions}</span>
                )}
                <span className={styles.previewSpecChip}>
                  {pp.condition === 'used' ? '♻️ Used' : '✨ New'}
                </span>
              </div>

              {/* Bid + Close — same row */}
              <div className={styles.previewBtnRow}>
                {isLive ? (
                  <button className={styles.previewSellerBtnActive} onClick={() => { /* TODO: place bid */ }}>
                    Place a Bid
                  </button>
                ) : (
                  <button className={styles.previewSellerBtn} disabled>
                    Auction Ended
                  </button>
                )}
                <button className={styles.previewCloseBtn} onClick={() => setProductPreview(null)}>
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
        )
      })()}
    </div>,
    document.body
  )
}
