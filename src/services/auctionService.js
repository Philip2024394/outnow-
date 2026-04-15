/**
 * Auction Service
 * Manages auction creation, bidding, winner selection, payment enforcement.
 *
 * Rules:
 * - Seller sets: starting price, reserve price (optional), time window (max 6hrs)
 * - Bid increments: <50k = Rp1,000 | <500k = Rp5,000 | 500k+ = Rp10,000
 * - Winner has 1 hour to upload payment proof
 * - Non-payment = auction ban (30d / 90d / permanent)
 * - Second chance goes to runner-up
 */
import { supabase } from '@/lib/supabase'

// ── Bid increment calculator ─────────────────────────────────────────────────
export function getBidIncrement(currentPrice) {
  if (currentPrice < 50000) return 1000
  if (currentPrice < 500000) return 5000
  return 10000
}

// ── Ban durations by offence count ───────────────────────────────────────────
const BAN_DURATIONS = {
  1: 30 * 24 * 60 * 60 * 1000,  // 30 days
  2: 90 * 24 * 60 * 60 * 1000,  // 90 days
}
// 3+ = permanent

export function getBanDuration(offenceCount) {
  if (offenceCount >= 3) return Infinity
  return BAN_DURATIONS[offenceCount] ?? 30 * 24 * 60 * 60 * 1000
}

export function isAuctionBanned(profile) {
  if (!profile?.auctionBan) return false
  if (profile.auctionBan.permanent) return true
  if (!profile.auctionBan.until) return false
  return Date.now() < profile.auctionBan.until
}

// ── Auction statuses ─────────────────────────────────────────────────────────
export const AUCTION_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  ENDED: 'ended',
  AWAITING_PAYMENT: 'awaiting_payment',
  PAID: 'paid',
  FORFEITED: 'forfeited',
  SECOND_CHANCE: 'second_chance',
  UNSOLD: 'unsold',
}

// ── Demo auctions ────────────────────────────────────────────────────────────
const now = Date.now()
export const DEMO_AUCTIONS = [
  {
    id: 'auc-1',
    productId: 'demo-1',
    productName: 'Wireless Earbuds Pro',
    productImage: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaa.png',
    sellerId: 'seller-1',
    sellerName: 'SoundMax',
    startPrice: 10000,
    reservePrice: 200000,
    currentPrice: 185000,
    bidCount: 24,
    startTime: now - 2 * 60 * 60 * 1000,
    endTime: now + 4 * 60 * 60 * 1000,
    status: AUCTION_STATUS.LIVE,
    winnerId: null,
    winnerName: null,
    paymentDeadline: null,
    bids: [
      { id: 'b1', buyerId: 'u1', buyerName: 'Sarah M.', amount: 185000, time: now - 120000 },
      { id: 'b2', buyerId: 'u2', buyerName: 'Andi P.', amount: 175000, time: now - 300000 },
      { id: 'b3', buyerId: 'u3', buyerName: 'Dewi S.', amount: 160000, time: now - 600000 },
      { id: 'b4', buyerId: 'u4', buyerName: 'Budi R.', amount: 150000, time: now - 900000 },
      { id: 'b5', buyerId: 'u1', buyerName: 'Sarah M.', amount: 140000, time: now - 1200000 },
    ],
  },
  {
    id: 'auc-2',
    productId: 'demo-4',
    productName: 'Slim Card Wallet',
    productImage: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaassssdasdcxcasdasda.png',
    sellerId: 'seller-2',
    sellerName: 'Kulit Asli',
    startPrice: 5000,
    reservePrice: 150000,
    currentPrice: 95000,
    bidCount: 15,
    startTime: now - 1 * 60 * 60 * 1000,
    endTime: now + 5 * 60 * 60 * 1000,
    status: AUCTION_STATUS.LIVE,
    winnerId: null,
    winnerName: null,
    paymentDeadline: null,
    bids: [
      { id: 'b6', buyerId: 'u2', buyerName: 'Andi P.', amount: 95000, time: now - 60000 },
      { id: 'b7', buyerId: 'u5', buyerName: 'Rina K.', amount: 85000, time: now - 180000 },
      { id: 'b8', buyerId: 'u3', buyerName: 'Dewi S.', amount: 75000, time: now - 400000 },
    ],
  },
  {
    id: 'auc-3',
    productId: 'demo-5',
    productName: 'Bifold Leather Wallet',
    productImage: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaassssdasdcxcasdasdadfssdf.png',
    sellerId: 'seller-2',
    sellerName: 'Kulit Asli',
    startPrice: 1000,
    reservePrice: null,
    currentPrice: 220000,
    bidCount: 31,
    startTime: now - 5.5 * 60 * 60 * 1000,
    endTime: now - 30 * 60 * 1000,
    status: AUCTION_STATUS.AWAITING_PAYMENT,
    winnerId: 'u1',
    winnerName: 'Sarah M.',
    paymentDeadline: now + 30 * 60 * 1000,
    bids: [
      { id: 'b9', buyerId: 'u1', buyerName: 'Sarah M.', amount: 220000, time: now - 35 * 60 * 1000 },
      { id: 'b10', buyerId: 'u4', buyerName: 'Budi R.', amount: 210000, time: now - 40 * 60 * 1000 },
    ],
  },
]

// ── Auction CRUD (demo/localStorage for now, Supabase in production) ─────────
const STORAGE_KEY = 'indoo_auctions'

export function getAuctions() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return stored ?? DEMO_AUCTIONS
  } catch { return DEMO_AUCTIONS }
}

export function saveAuctions(auctions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auctions))
}

export function createAuction({ productId, productName, productImage, sellerId, sellerName, startPrice, reservePrice, startTime, endTime }) {
  const auctions = getAuctions()
  const auction = {
    id: `auc-${Date.now()}`,
    productId, productName, productImage, sellerId, sellerName,
    startPrice, reservePrice: reservePrice || null,
    currentPrice: startPrice,
    bidCount: 0,
    startTime, endTime,
    status: Date.now() >= startTime ? AUCTION_STATUS.LIVE : AUCTION_STATUS.SCHEDULED,
    winnerId: null, winnerName: null, paymentDeadline: null,
    bids: [],
  }
  auctions.push(auction)
  saveAuctions(auctions)
  return auction
}

export function placeBid(auctionId, buyerId, buyerName, amount) {
  const auctions = getAuctions()
  const auc = auctions.find(a => a.id === auctionId)
  if (!auc || auc.status !== AUCTION_STATUS.LIVE) return { error: 'Auction not active' }
  if (Date.now() > auc.endTime) return { error: 'Auction has ended' }
  const minBid = auc.currentPrice + getBidIncrement(auc.currentPrice)
  if (amount < minBid) return { error: `Minimum bid is Rp ${minBid.toLocaleString('id-ID')}` }

  auc.bids.unshift({ id: `b-${Date.now()}`, buyerId, buyerName, amount, time: Date.now() })
  auc.currentPrice = amount
  auc.bidCount++
  saveAuctions(auctions)
  return { success: true, auction: auc }
}

export function endAuction(auctionId) {
  const auctions = getAuctions()
  const auc = auctions.find(a => a.id === auctionId)
  if (!auc) return null

  if (auc.bids.length === 0) {
    auc.status = AUCTION_STATUS.UNSOLD
  } else {
    const winner = auc.bids[0]
    const reserveMet = !auc.reservePrice || winner.amount >= auc.reservePrice
    if (reserveMet) {
      auc.status = AUCTION_STATUS.AWAITING_PAYMENT
      auc.winnerId = winner.buyerId
      auc.winnerName = winner.buyerName
      auc.paymentDeadline = Date.now() + 60 * 60 * 1000 // 1 hour
    } else {
      auc.status = AUCTION_STATUS.UNSOLD
    }
  }
  saveAuctions(auctions)
  return auc
}

export function forfeitWinner(auctionId) {
  const auctions = getAuctions()
  const auc = auctions.find(a => a.id === auctionId)
  if (!auc) return null

  // Move to second chance — next bidder
  const runnerUp = auc.bids.find(b => b.buyerId !== auc.winnerId)
  if (runnerUp) {
    auc.status = AUCTION_STATUS.SECOND_CHANCE
    auc.winnerId = runnerUp.buyerId
    auc.winnerName = runnerUp.buyerName
    auc.currentPrice = runnerUp.amount
    auc.paymentDeadline = Date.now() + 60 * 60 * 1000
  } else {
    auc.status = AUCTION_STATUS.UNSOLD
  }
  saveAuctions(auctions)
  return auc
}

export function markAuctionPaid(auctionId) {
  const auctions = getAuctions()
  const auc = auctions.find(a => a.id === auctionId)
  if (!auc) return null
  auc.status = AUCTION_STATUS.PAID
  saveAuctions(auctions)
  return auc
}

// ── Admin: get all auction stats ─────────────────────────────────────────────
export function getAuctionStats() {
  const auctions = getAuctions()
  const live = auctions.filter(a => a.status === AUCTION_STATUS.LIVE)
  const ended = auctions.filter(a => [AUCTION_STATUS.PAID, AUCTION_STATUS.UNSOLD, AUCTION_STATUS.FORFEITED].includes(a.status))
  const awaiting = auctions.filter(a => a.status === AUCTION_STATUS.AWAITING_PAYMENT)
  const totalBids = auctions.reduce((s, a) => s + a.bidCount, 0)
  const totalRevenue = auctions.filter(a => a.status === AUCTION_STATUS.PAID).reduce((s, a) => s + a.currentPrice, 0)
  return { total: auctions.length, live: live.length, ended: ended.length, awaiting: awaiting.length, totalBids, totalRevenue, auctions }
}

export function fmtIDR(n) {
  if (!n && n !== 0) return '—'
  n = Number(n)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}jt`
  return `Rp ${n.toLocaleString('id-ID')}`
}
