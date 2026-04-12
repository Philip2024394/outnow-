import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Commission Service
// Marketplace sellers  → 5%  commission on every completed sale
// Restaurant owners    → 10% commission on every completed order
// Chat goes read-only for seller/restaurant when commission is unpaid.
// ─────────────────────────────────────────────────────────────────────────────

export const COMMISSION_RATES = {
  marketplace:  0.05,   // 5%  — due within 72h
  restaurant:   0.10,   // 10% — due within 72h
  driver_bike:  0.10,   // 10% — due at next sign-in
  driver_car:   0.10,   // 10% — due at next sign-in
}

// ── Record a new commission when order is marked complete ─────────────────────
// type: 'marketplace' | 'restaurant'
export async function recordCommission(sellerId, orderId, orderTotal, type = 'marketplace') {
  if (!supabase) return null
  const rate = COMMISSION_RATES[type] ?? COMMISSION_RATES.marketplace
  try {
    const { data, error } = await supabase.rpc('record_commission', {
      p_seller_id:       sellerId,
      p_order_id:        orderId,
      p_order_total:     orderTotal,
      p_commission_type: type,
      p_rate:            rate,
    })
    if (error) throw error
    return { commissionId: data, amount: Math.round(orderTotal * rate), rate, type }
  } catch (e) {
    console.warn('[commissionService] recordCommission failed', e)
    return null
  }
}

// ── Check if seller has any unpaid commissions ────────────────────────────────
// type: null = any type,  'marketplace' | 'restaurant' to filter
export async function hasUnpaidCommission(sellerId, type = null) {
  if (!supabase) return false
  try {
    let q = supabase
      .from('seller_commissions')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .in('status', ['pending', 'overdue'])
    if (type) q = q.eq('commission_type', type)
    const { count, error } = await q
    return !error && (count ?? 0) > 0
  } catch {
    return false
  }
}

// ── Check if a specific order has an unpaid commission ────────────────────────
export async function orderHasUnpaidCommission(orderId) {
  if (!supabase) return false
  try {
    const { data, error } = await supabase
      .from('seller_commissions')
      .select('id, status')
      .eq('order_id', orderId)
      .in('status', ['pending', 'overdue'])
      .maybeSingle()
    if (error) return false
    return !!data
  } catch {
    return false
  }
}

// ── Get seller balance summary ────────────────────────────────────────────────
// type: null = combined, 'marketplace' | 'restaurant' to filter
export async function getSellerBalance(sellerId, type = null) {
  if (!supabase) return { totalOwed: 0, totalPaid: 0, pendingCount: 0, overdueCount: 0 }
  try {
    const params = { p_seller_id: sellerId }
    if (type) params.p_commission_type = type
    const { data, error } = await supabase.rpc('get_seller_commission_balance', params)
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    return {
      totalOwed:    Number(row?.total_owed    ?? 0),
      totalPaid:    Number(row?.total_paid    ?? 0),
      pendingCount: Number(row?.pending_count ?? 0),
      overdueCount: Number(row?.overdue_count ?? 0),
    }
  } catch {
    return { totalOwed: 0, totalPaid: 0, pendingCount: 0, overdueCount: 0 }
  }
}

// ── Get commission history for a seller ──────────────────────────────────────
export async function getSellerCommissions(sellerId, { limit = 50, type = null } = {}) {
  if (!supabase) return []
  try {
    let q = supabase
      .from('seller_commissions')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (type) q = q.eq('commission_type', type)
    const { data, error } = await q
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

// ── Admin: get all pending/overdue commissions ────────────────────────────────
export async function getAllPendingCommissions(type = null) {
  if (!supabase) return []
  try {
    let q = supabase
      .from('seller_commissions')
      .select('*, profiles:seller_id ( display_name, avatar_url, phone )')
      .in('status', ['pending', 'overdue'])
      .order('due_at', { ascending: true })
    if (type) q = q.eq('commission_type', type)
    const { data, error } = await q
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

// ── Admin: get all commissions (full history) ─────────────────────────────────
export async function getAllCommissions(filters = {}) {
  if (!supabase) return []
  try {
    let q = supabase
      .from('seller_commissions')
      .select('*, profiles:seller_id ( display_name, avatar_url )')
      .order('created_at', { ascending: false })
      .limit(200)

    if (filters.status) q = q.eq('status', filters.status)
    if (filters.sellerId) q = q.eq('seller_id', filters.sellerId)
    if (filters.type) q = q.eq('commission_type', filters.type)

    const { data, error } = await q
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

// ── Admin: mark all unpaid commissions paid for a seller ──────────────────────
export async function markSellerCommissionsPaid(sellerId, notes = '', type = null) {
  if (!supabase) return false
  try {
    let q = supabase
      .from('seller_commissions')
      .update({ status: 'paid', paid_at: new Date().toISOString(), notes })
      .eq('seller_id', sellerId)
      .in('status', ['pending', 'overdue'])
    if (type) q = q.eq('commission_type', type)
    const { error } = await q
    if (error) throw error
    return true
  } catch {
    return false
  }
}

// ── Admin: mark a single commission paid ─────────────────────────────────────
export async function markCommissionPaid(commissionId, notes = '') {
  if (!supabase) return false
  try {
    const { data, error } = await supabase
      .from('seller_commissions')
      .update({ status: 'paid', paid_at: new Date().toISOString(), notes })
      .eq('id', commissionId)
      .select('order_id, commission_type')
      .single()
    if (error) throw error

    const table = data?.commission_type === 'restaurant' ? 'restaurant_orders' : 'orders'
    if (data?.order_id) {
      await supabase
        .from(table)
        .update({ commission_status: 'paid' })
        .eq('id', data.order_id)
        .catch(() => {})
    }
    return true
  } catch {
    return false
  }
}

// ── Block an account ──────────────────────────────────────────────────────────
export async function blockAccount({ phone, userId, reason = 'commission_avoidance', notes = '' }) {
  if (!supabase) return false
  try {
    const payload = { reason, notes }
    if (phone)  payload.phone   = phone
    if (userId) payload.user_id = userId
    const { error } = await supabase
      .from('blocked_accounts')
      .upsert(payload, { onConflict: phone ? 'phone' : 'user_id' })
    return !error
  } catch {
    return false
  }
}

// ── Check if phone/user is blocked ───────────────────────────────────────────
export async function isAccountBlocked({ phone, userId }) {
  if (!supabase) return false
  try {
    let q = supabase
      .from('blocked_accounts')
      .select('id', { head: true, count: 'exact' })
      .is('unblocked_at', null)
    if (userId)     q = q.eq('user_id', userId)
    else if (phone) q = q.eq('phone', phone)
    else return false
    const { count, error } = await q
    return !error && (count ?? 0) > 0
  } catch {
    return false
  }
}

// ── Unblock an account ────────────────────────────────────────────────────────
export async function unblockAccount({ phone, userId }) {
  if (!supabase) return false
  try {
    let q = supabase.from('blocked_accounts').update({ unblocked_at: new Date().toISOString() })
    if (userId)     q = q.eq('user_id', userId)
    else if (phone) q = q.eq('phone', phone)
    const { error } = await q
    return !error
  } catch {
    return false
  }
}

// ── Delivery options helpers ──────────────────────────────────────────────────
// Marketplace sellers can use couriers. Food delivery is Hangger Ride only.
export const DELIVERY_SERVICES = [
  { type: 'hangger_ride', label: 'Hangger Ride 🚲', cityOnly: true,  baseFare: 15000, perKm: 3000, food: true  },
  { type: 'jne',          label: 'JNE',              cityOnly: false, baseFare: 9000,  perKm: 0,    food: false },
  { type: 'jnt',          label: 'J&T Express',      cityOnly: false, baseFare: 8000,  perKm: 0,    food: false },
  { type: 'sicepat',      label: 'SiCepat',          cityOnly: false, baseFare: 8000,  perKm: 0,    food: false },
  { type: 'ninja',        label: 'Ninja Express',    cityOnly: false, baseFare: 9000,  perKm: 0,    food: false },
  { type: 'pos',          label: 'Kantor Pos',       cityOnly: false, baseFare: 7000,  perKm: 0,    food: false },
]

// Food delivery only uses Hangger Ride (bike) — couriers don't deliver hot food.
export const FOOD_DELIVERY_SERVICES = DELIVERY_SERVICES.filter(s => s.food)

export async function saveDeliveryOptions(userId, options) {
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from('businesses')
      .upsert({ user_id: userId, delivery_options: options }, { onConflict: 'user_id' })
    return !error
  } catch {
    return false
  }
}

export async function fetchDeliveryOptions(userId) {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('delivery_options')
      .eq('user_id', userId)
      .single()
    if (error || !data) return []
    return data.delivery_options ?? []
  } catch {
    return []
  }
}

// ── IDR formatter ─────────────────────────────────────────────────────────────
export function fmtIDR(amount) {
  if (!amount) return 'Rp 0'
  return 'Rp ' + Number(amount).toLocaleString('id-ID')
}
