/**
 * Indoo Universal Wallet — one wallet for all services
 * Marketplace, Rentals, Rides, Food, Dating
 *
 * Commission: 10% flat across all services
 * Debt limit: Rp 50.000 for new accounts
 * Credit limit increases with trading history
 */

const WALLET_KEY = 'indoo_wallet'
const COMMISSION_RATE = 0.10
const DEFAULT_DEBT_LIMIT = 50000
const HISTORY_THRESHOLDS = [
  { orders: 50,  limit: 75000 },
  { orders: 100, limit: 100000 },
  { orders: 250, limit: 150000 },
  { orders: 500, limit: 200000 },
]

// Warning levels
const LEVEL_GREEN = 'green'   // 0 - 50% of limit
const LEVEL_YELLOW = 'yellow' // 50 - 80% of limit
const LEVEL_ORANGE = 'orange' // 80 - 100% of limit
const LEVEL_RED = 'red'       // at limit — paused

// ── Get or create wallet ────────────────────────────────────────────────────
export function getWallet(userId = 'default') {
  try {
    const data = JSON.parse(localStorage.getItem(WALLET_KEY) || '{}')
    if (!data[userId]) {
      data[userId] = {
        balance: 0,
        commissionOwed: 0,
        totalEarned: 0,
        totalCommissionPaid: 0,
        totalOrders: 0,
        debtLimit: DEFAULT_DEBT_LIMIT,
        freeOrdersLeft: 3,
        transactions: [],
        created_at: new Date().toISOString(),
      }
      localStorage.setItem(WALLET_KEY, JSON.stringify(data))
    }
    return data[userId]
  } catch {
    return {
      balance: 0, commissionOwed: 0, totalEarned: 0,
      totalCommissionPaid: 0, totalOrders: 0,
      debtLimit: DEFAULT_DEBT_LIMIT, freeOrdersLeft: 3,
      transactions: [], created_at: new Date().toISOString(),
    }
  }
}

function saveWallet(userId, wallet) {
  try {
    const data = JSON.parse(localStorage.getItem(WALLET_KEY) || '{}')
    data[userId] = wallet
    localStorage.setItem(WALLET_KEY, JSON.stringify(data))
  } catch {}
}

// ── Calculate debt limit based on history ────────────────────────────────────
function calcDebtLimit(totalOrders) {
  let limit = DEFAULT_DEBT_LIMIT
  for (const t of HISTORY_THRESHOLDS) {
    if (totalOrders >= t.orders) limit = t.limit
  }
  return limit
}

// ── Get warning level ───────────────────────────────────────────────────────
export function getWarningLevel(userId = 'default') {
  const w = getWallet(userId)
  const ratio = w.commissionOwed / w.debtLimit
  if (ratio >= 1) return { level: LEVEL_RED, message: `Orders paused — Pay Rp ${fmtK(w.commissionOwed)} to continue`, paused: true }
  if (ratio >= 0.8) return { level: LEVEL_ORANGE, message: `Please clear balance — Rp ${fmtK(w.commissionOwed)} due`, paused: false }
  if (ratio >= 0.5) return { level: LEVEL_YELLOW, message: `Top up soon — Rp ${fmtK(w.commissionOwed)} commission due`, paused: false }
  return { level: LEVEL_GREEN, message: w.commissionOwed > 0 ? `Commission due: Rp ${fmtK(w.commissionOwed)}` : 'Wallet clear', paused: false }
}

// ── Check if user can receive orders ────────────────────────────────────────
export function canReceiveOrders(userId = 'default') {
  const w = getWallet(userId)
  return w.commissionOwed < w.debtLimit
}

// ── Process commission for an order ─────────────────────────────────────────
export function processCommission(userId = 'default', service, orderId, orderAmount) {
  const w = getWallet(userId)
  const commission = Math.round(orderAmount * COMMISSION_RATE)

  // Free orders for new accounts
  if (w.freeOrdersLeft > 0) {
    w.freeOrdersLeft--
    w.totalOrders++
    w.totalEarned += orderAmount
    w.transactions.push({
      id: `tx_${Date.now()}`,
      type: 'free_order',
      service,
      orderId,
      amount: orderAmount,
      commission: 0,
      note: `Free order (${w.freeOrdersLeft} left)`,
      date: new Date().toISOString(),
    })
    // Update debt limit based on history
    w.debtLimit = calcDebtLimit(w.totalOrders)
    saveWallet(userId, w)
    return { success: true, free: true, freeLeft: w.freeOrdersLeft, commission: 0 }
  }

  // Try deduct from wallet balance first
  if (w.balance >= commission) {
    w.balance -= commission
    w.totalCommissionPaid += commission
    w.totalOrders++
    w.totalEarned += orderAmount
    w.transactions.push({
      id: `tx_${Date.now()}`,
      type: 'commission_paid',
      service,
      orderId,
      amount: orderAmount,
      commission,
      note: 'Auto-deducted from wallet',
      date: new Date().toISOString(),
    })
    w.debtLimit = calcDebtLimit(w.totalOrders)
    saveWallet(userId, w)
    return { success: true, free: false, deducted: true, commission, balanceLeft: w.balance }
  }

  // Partial deduct + add to debt
  const fromWallet = w.balance
  const remaining = commission - fromWallet
  w.balance = 0
  w.commissionOwed += remaining
  w.totalCommissionPaid += fromWallet
  w.totalOrders++
  w.totalEarned += orderAmount
  w.transactions.push({
    id: `tx_${Date.now()}`,
    type: 'commission_owed',
    service,
    orderId,
    amount: orderAmount,
    commission,
    paid: fromWallet,
    owed: remaining,
    note: fromWallet > 0 ? `Rp ${fmtK(fromWallet)} from wallet, Rp ${fmtK(remaining)} owed` : `Rp ${fmtK(remaining)} added to debt`,
    date: new Date().toISOString(),
  })
  w.debtLimit = calcDebtLimit(w.totalOrders)
  saveWallet(userId, w)

  return {
    success: w.commissionOwed < w.debtLimit,
    free: false,
    deducted: false,
    commission,
    owed: w.commissionOwed,
    paused: w.commissionOwed >= w.debtLimit,
  }
}

// ── Top up wallet ───────────────────────────────────────────────────────────
export function topUpWallet(userId = 'default', amount) {
  const w = getWallet(userId)

  // Clear debt first
  if (w.commissionOwed > 0) {
    if (amount >= w.commissionOwed) {
      amount -= w.commissionOwed
      w.totalCommissionPaid += w.commissionOwed
      w.commissionOwed = 0
    } else {
      w.commissionOwed -= amount
      w.totalCommissionPaid += amount
      amount = 0
    }
  }

  // Remaining goes to balance
  w.balance += amount
  w.transactions.push({
    id: `tx_${Date.now()}`,
    type: 'top_up',
    amount: amount,
    note: `Wallet topped up`,
    date: new Date().toISOString(),
  })
  saveWallet(userId, w)
  return { balance: w.balance, commissionOwed: w.commissionOwed }
}

// ── Get transaction history ─────────────────────────────────────────────────
export function getTransactions(userId = 'default', limit = 20) {
  const w = getWallet(userId)
  return w.transactions.slice(-limit).reverse()
}

// ── Get wallet summary ──────────────────────────────────────────────────────
export function getWalletSummary(userId = 'default') {
  const w = getWallet(userId)
  const warning = getWarningLevel(userId)
  return {
    balance: w.balance,
    commissionOwed: w.commissionOwed,
    debtLimit: w.debtLimit,
    totalEarned: w.totalEarned,
    totalCommissionPaid: w.totalCommissionPaid,
    totalOrders: w.totalOrders,
    freeOrdersLeft: w.freeOrdersLeft,
    commissionRate: COMMISSION_RATE,
    warning,
    canReceiveOrders: w.commissionOwed < w.debtLimit,
  }
}

// ── Format helpers ──────────────────────────────────────────────────────────
function fmtK(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'jt'
  return n.toLocaleString('id-ID')
}

export function fmtIDR(n) {
  if (!n) return 'Rp 0'
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

export { COMMISSION_RATE, DEFAULT_DEBT_LIMIT }
