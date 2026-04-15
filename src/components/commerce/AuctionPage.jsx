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
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className={styles.headerCenter}>
          <span className={styles.headerIcon}>🔨</span>
          <span className={styles.headerTitle}>Live Auctions</span>
        </div>
        <span className={styles.liveCount}>{liveAuctions.length} live</span>
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
              {detail.status === AUCTION_STATUS.LIVE ? (
                <span className={styles.detailSellerHidden}>Seller revealed after auction ends</span>
              ) : (
                <span className={styles.detailSeller}>by {detail.sellerName}</span>
              )}
              {detail.reservePrice && detail.currentPrice < detail.reservePrice && (
                <span className={styles.reserveInCard}>Reserve not met</span>
              )}
              {detail.reservePrice && detail.currentPrice >= detail.reservePrice && (
                <span className={styles.reserveMetInCard}>Reserve met</span>
              )}
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
              <span className={styles.bidCount}>{detail.bidCount} bids</span>
            </div>
            <div className={styles.priceRight}>
              <span className={styles.timerLabel}>
                {detail.status === AUCTION_STATUS.AWAITING_PAYMENT ? 'Payment due' : 'Ends in'}
              </span>
              <span className={styles.timerValue}>
                {detail.status === AUCTION_STATUS.AWAITING_PAYMENT
                  ? formatTimer((detail.paymentDeadline ?? 0) - Date.now())
                  : formatTimer(detail.endTime - Date.now())
                }
              </span>
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
              <div className={styles.sectionLabel}>🔴 Live Now</div>
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
                {pp.condition !== 'used' && <span className={styles.previewNewBadge}>NEW</span>}
                <span className={styles.previewImgName}>{pp.productName}</span>
                <span className={styles.previewImgReserve}>
                  {pp.reservePrice ? '🔒 Has Reserve' : '🔓 No Reserve'}
                </span>
              </div>
              {/* Bottom-right: share to WhatsApp */}
              <a href={shareUrl} target="_blank" rel="noopener noreferrer" className={styles.previewShare} onClick={e => e.stopPropagation()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" stroke="none">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                </svg>
              </a>
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

              {/* Seller button — orange, only after auction */}
              {isLive ? (
                <button className={styles.previewSellerBtn} disabled>
                  Sellers Details After Auction Success
                </button>
              ) : (
                <button className={styles.previewSellerBtnActive} onClick={() => { setProductPreview(null) }}>
                  View Seller Details
                </button>
              )}

              {/* Close button */}
              <button className={styles.previewCloseBtn} onClick={() => setProductPreview(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
        )
      })()}
    </div>,
    document.body
  )
}
