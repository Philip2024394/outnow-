/**
 * AuctionPage — full-screen live auction page.
 * Shows active auctions, live bid feed, countdown, bid button.
 * Winner announcement + payment timer.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  getAuctions, placeBid, getBidIncrement, isAuctionBanned,
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
  const minBid = detail ? detail.currentPrice + getBidIncrement(detail.currentPrice) : 0

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
              <img
                src={detail.productImage}
                alt=""
                className={styles.detailImg}
                onClick={() => setProductPreview(detail)}
                style={{ cursor: 'pointer' }}
              />
            )}
            <div className={styles.detailInfo}>
              <span className={styles.detailName}>{detail.productName}</span>
              {/* Seller hidden during live auction — revealed after end */}
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
              <button className={styles.viewProductBtn} onClick={() => setProductPreview(detail)}>
                View Product Details
              </button>
            </div>
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
                />
              </div>
              <button className={styles.bidBtn} onClick={handleBid}>
                Place Bid
              </button>
              {bidError && <span className={styles.bidError}>{bidError}</span>}
              <span className={styles.bidMin}>Min bid: {fmtIDR(minBid)}</span>
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
                  <button key={a.id} className={styles.auctionCard} onClick={() => setSelected(a)}>
                    <div className={styles.cardImgWrap}>
                      {a.productImage ? <img src={a.productImage} alt="" className={styles.cardImg} /> : <div className={styles.cardImgPlaceholder}>📦</div>}
                      <span className={styles.cardLive}>LIVE</span>
                      <span className={styles.cardTimer}>{formatTimer(a.endTime - Date.now())}</span>
                    </div>
                    <div className={styles.cardInfo}>
                      <span className={styles.cardName}>{a.productName}</span>
                      <div className={styles.cardPriceRow}>
                        <span className={styles.cardPrice}>{fmtIDR(a.currentPrice)}</span>
                        <span className={styles.cardBids}>{a.bidCount} bids</span>
                      </div>
                    </div>
                  </button>
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
      {productPreview && (
        <div className={styles.previewBackdrop} onClick={() => setProductPreview(null)}>
          <div className={styles.previewModal} onClick={e => e.stopPropagation()}>
            <button className={styles.previewClose} onClick={() => setProductPreview(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Main image */}
            {productPreview.productImage && (
              <img src={productPreview.productImage} alt={productPreview.productName} className={styles.previewMainImg} />
            )}

            {/* Product info — no seller shown during live */}
            <div className={styles.previewInfo}>
              <h3 className={styles.previewName}>{productPreview.productName}</h3>

              <div className={styles.previewPriceRow}>
                <span className={styles.previewLabel}>Starting price</span>
                <span className={styles.previewPrice}>{fmtIDR(productPreview.startPrice)}</span>
              </div>
              <div className={styles.previewPriceRow}>
                <span className={styles.previewLabel}>Current bid</span>
                <span className={styles.previewPriceCurrent}>{fmtIDR(productPreview.currentPrice)}</span>
              </div>
              <div className={styles.previewPriceRow}>
                <span className={styles.previewLabel}>Total bids</span>
                <span>{productPreview.bidCount}</span>
              </div>
              {productPreview.reservePrice && (
                <div className={styles.previewPriceRow}>
                  <span className={styles.previewLabel}>Reserve</span>
                  <span style={{ color: productPreview.currentPrice >= productPreview.reservePrice ? '#8DC63F' : '#FBBF24' }}>
                    {productPreview.currentPrice >= productPreview.reservePrice ? 'Met' : 'Not met'}
                  </span>
                </div>
              )}

              {/* Seller only shown after auction ends */}
              {productPreview.status !== AUCTION_STATUS.LIVE ? (
                <div className={styles.previewSeller}>
                  <span className={styles.previewLabel}>Seller</span>
                  <span>{productPreview.sellerName}</span>
                </div>
              ) : (
                <div className={styles.previewSellerHidden}>
                  Seller will be revealed when auction ends
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
