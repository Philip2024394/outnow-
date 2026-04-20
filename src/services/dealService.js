import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Deal Hunt — data layer
// All functions gracefully return demo data when Supabase is null / missing table
// ─────────────────────────────────────────────────────────────────────────────

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateVoucher() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

function hoursFromNow(h) {
  return new Date(Date.now() + h * 60 * 60 * 1000).toISOString()
}

// ── Demo deals ──────────────────────────────────────────────────────────────

const DEMO_DEALS = [
  {
    id: 'deal-1', seller_id: 'demo-seller-1', domain: 'food', sub_category: 'nasi',
    title: 'Nasi Goreng Spesial Pak Budi', description: 'Nasi goreng seafood jumbo + es teh manis. Porsi besar, rasa mantap!',
    original_price: 45000, deal_price: 25000, discount_pct: 44.4,
    quantity_available: 20, quantity_claimed: 12, quantity_per_user: 2,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(3),
    redemption_method: 'qr', terms: 'Berlaku untuk dine-in saja. Tidak bisa digabung promo lain.',
    status: 'active', seller_name: 'Warung Pak Budi', seller_photo: null, seller_rating: 4.8,
    city: 'Jakarta', lat: -6.2088, lng: 106.8456, view_count: 342, claim_count: 12, is_hot: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-2', seller_id: 'demo-seller-2', domain: 'food', sub_category: 'minuman',
    title: 'Kopi Susu Gula Aren 1L', description: 'Kopi susu gula aren fresh, botol 1 liter. Arabika Toraja pilihan.',
    original_price: 65000, deal_price: 35000, discount_pct: 46.2,
    quantity_available: 50, quantity_claimed: 31, quantity_per_user: 3,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(5),
    redemption_method: 'voucher', terms: 'Ambil di outlet. Berlaku semua cabang Jakarta.',
    status: 'active', seller_name: 'Kopi Kenangan Lokal', seller_photo: null, seller_rating: 4.6,
    city: 'Jakarta', lat: -6.1751, lng: 106.8650, view_count: 578, claim_count: 31, is_hot: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-3', seller_id: 'demo-seller-3', domain: 'marketplace', sub_category: 'fashion',
    title: 'Kaos Polos Premium Cotton 30s', description: 'Kaos polos bahan cotton combed 30s. Tersedia ukuran S-XXL, 12 warna.',
    original_price: 120000, deal_price: 59000, discount_pct: 50.8,
    quantity_available: 100, quantity_claimed: 67, quantity_per_user: 5,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(6),
    redemption_method: 'chat', terms: 'Gratis ongkir Jabodetabek. Tukar ukuran 1x gratis.',
    status: 'active', seller_name: 'Toko Baju Murah', seller_photo: null, seller_rating: 4.5,
    city: 'Bandung', lat: -6.9175, lng: 107.6191, view_count: 1203, claim_count: 67, is_hot: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-4', seller_id: 'demo-seller-4', domain: 'massage', sub_category: 'full_body',
    title: 'Full Body Massage 90 Menit', description: 'Pijat seluruh badan 90 menit oleh terapis bersertifikat. Termasuk aromaterapi.',
    original_price: 350000, deal_price: 175000, discount_pct: 50.0,
    quantity_available: 10, quantity_claimed: 6, quantity_per_user: 1,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(4),
    redemption_method: 'voucher', terms: 'Booking via chat minimal H-1. Berlaku Senin-Jumat.',
    status: 'active', seller_name: 'Relax Spa Bali', seller_photo: null, seller_rating: 4.9,
    city: 'Denpasar', lat: -8.6500, lng: 115.2167, view_count: 189, claim_count: 6, is_hot: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-5', seller_id: 'demo-seller-5', domain: 'rentals', sub_category: 'motor',
    title: 'Sewa Motor Harian Honda Vario', description: 'Sewa motor Honda Vario 125cc per hari. Helm & jas hujan included.',
    original_price: 100000, deal_price: 55000, discount_pct: 45.0,
    quantity_available: 8, quantity_claimed: 3, quantity_per_user: 1,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(7),
    redemption_method: 'chat', terms: 'KTP/paspor sebagai jaminan. Bensin tanggung sendiri.',
    status: 'active', seller_name: 'Bali Motor Rental', seller_photo: null, seller_rating: 4.3,
    city: 'Kuta', lat: -8.7180, lng: 115.1690, view_count: 95, claim_count: 3, is_hot: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-6', seller_id: 'demo-seller-6', domain: 'rides', sub_category: 'airport',
    title: 'Antar Jemput Bandara Ngurah Rai', description: 'Layanan antar-jemput bandara. Mobil AC, driver ramah, free WiFi.',
    original_price: 250000, deal_price: 125000, discount_pct: 50.0,
    quantity_available: 15, quantity_claimed: 9, quantity_per_user: 2,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(8),
    redemption_method: 'chat', terms: 'Booking minimal 3 jam sebelum. Area Kuta/Seminyak/Ubud.',
    status: 'active', seller_name: 'Bali Driver Pro', seller_photo: null, seller_rating: 4.7,
    city: 'Denpasar', lat: -8.7467, lng: 115.1708, view_count: 267, claim_count: 9, is_hot: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-7', seller_id: 'demo-seller-7', domain: 'food', sub_category: 'bakso',
    title: 'Bakso Urat Jumbo Isi 10', description: 'Bakso urat sapi asli, frozen, isi 10 butir. Bumbu kuah spesial included.',
    original_price: 85000, deal_price: 49000, discount_pct: 42.4,
    quantity_available: 30, quantity_claimed: 18, quantity_per_user: 3,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(2),
    redemption_method: 'qr', terms: 'Ambil di toko. Simpan freezer tahan 3 bulan.',
    status: 'active', seller_name: 'Bakso Mas Joko', seller_photo: null, seller_rating: 4.4,
    city: 'Surabaya', lat: -7.2575, lng: 112.7521, view_count: 412, claim_count: 18, is_hot: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-8', seller_id: 'demo-seller-8', domain: 'marketplace', sub_category: 'elektronik',
    title: 'TWS Earbuds Bluetooth 5.3', description: 'Earbuds wireless bass tebal, baterai 30 jam, waterproof IPX5.',
    original_price: 450000, deal_price: 199000, discount_pct: 55.8,
    quantity_available: 25, quantity_claimed: 19, quantity_per_user: 2,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(4),
    redemption_method: 'voucher', terms: 'Garansi 6 bulan. Gratis ongkir seluruh Indonesia.',
    status: 'active', seller_name: 'Gadget Murah ID', seller_photo: null, seller_rating: 4.2,
    city: 'Jakarta', lat: -6.2000, lng: 106.8166, view_count: 834, claim_count: 19, is_hot: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-9', seller_id: 'demo-seller-9', domain: 'massage', sub_category: 'reflexology',
    title: 'Refleksi Kaki 60 Menit', description: 'Pijat refleksi kaki tradisional Jawa. Terapis pengalaman 10+ tahun.',
    original_price: 150000, deal_price: 75000, discount_pct: 50.0,
    quantity_available: 12, quantity_claimed: 5, quantity_per_user: 1,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(5),
    redemption_method: 'voucher', terms: 'Walk-in atau booking. Berlaku setiap hari.',
    status: 'active', seller_name: 'Pijat Sehat Yogya', seller_photo: null, seller_rating: 4.8,
    city: 'Yogyakarta', lat: -7.7956, lng: 110.3695, view_count: 156, claim_count: 5, is_hot: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-10', seller_id: 'demo-seller-10', domain: 'rentals', sub_category: 'villa',
    title: 'Villa Private Pool 2BR Ubud', description: 'Villa private pool 2 kamar tidur, view sawah. Sarapan included.',
    original_price: 1500000, deal_price: 750000, discount_pct: 50.0,
    quantity_available: 3, quantity_claimed: 1, quantity_per_user: 1,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(6),
    redemption_method: 'chat', terms: 'Minimal 2 malam. Berlaku weekday only. Check-in 14:00.',
    status: 'active', seller_name: 'Ubud Villa Escape', seller_photo: null, seller_rating: 4.9,
    city: 'Ubud', lat: -8.5069, lng: 115.2625, view_count: 523, claim_count: 1, is_hot: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
]

// In-memory demo claims store
let demoClaims = []

// ── Fetch active deals ──────────────────────────────────────────────────────

export async function fetchActiveDeals({ domain, sort, search, limit = 20, offset = 0 } = {}) {
  if (!supabase) {
    let filtered = [...DEMO_DEALS]
    if (domain) filtered = filtered.filter(d => d.domain === domain)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.seller_name?.toLowerCase().includes(q)
      )
    }
    if (sort === 'end_time')     filtered.sort((a, b) => new Date(a.end_time) - new Date(b.end_time))
    if (sort === 'discount_pct') filtered.sort((a, b) => b.discount_pct - a.discount_pct)
    if (sort === 'deal_price')   filtered.sort((a, b) => a.deal_price - b.deal_price)
    return filtered.slice(offset, offset + limit)
  }

  try {
    let q = supabase
      .from('deals')
      .select('*')
      .eq('status', 'active')
      .gte('end_time', new Date().toISOString())

    if (domain) q = q.eq('domain', domain)
    if (search) q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%,seller_name.ilike.%${search}%`)

    if (sort === 'end_time')     q = q.order('end_time', { ascending: true })
    else if (sort === 'discount_pct') q = q.order('discount_pct', { ascending: false })
    else if (sort === 'deal_price')   q = q.order('deal_price', { ascending: true })
    else q = q.order('created_at', { ascending: false })

    q = q.range(offset, offset + limit - 1)

    const { data, error } = await q
    if (error || !data?.length) return DEMO_DEALS.slice(0, limit)
    return data
  } catch {
    return DEMO_DEALS.slice(0, limit)
  }
}

// ── Fetch single deal ───────────────────────────────────────────────────────

export async function fetchDealById(id) {
  if (!supabase) {
    return DEMO_DEALS.find(d => d.id === id) ?? null
  }

  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return DEMO_DEALS.find(d => d.id === id) ?? null
    return data
  } catch {
    return DEMO_DEALS.find(d => d.id === id) ?? null
  }
}

// ── Create deal ─────────────────────────────────────────────────────────────

export async function createDeal(dealData) {
  if (!supabase) {
    const newDeal = {
      id: 'deal-' + Date.now(),
      ...dealData,
      quantity_claimed: 0,
      view_count: 0,
      claim_count: 0,
      is_hot: false,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    DEMO_DEALS.push(newDeal)
    return newDeal
  }

  try {
    const { data, error } = await supabase
      .from('deals')
      .insert(dealData)
      .select()
      .single()
    if (error) throw error
    return data
  } catch (e) {
    console.warn('[dealService] createDeal failed', e)
    return null
  }
}

// ── Claim deal ──────────────────────────────────────────────────────────────

export async function claimDeal(dealId, buyerId) {
  if (!supabase) {
    const deal = DEMO_DEALS.find(d => d.id === dealId)
    if (!deal) return { error: 'Deal tidak ditemukan' }
    if (deal.status !== 'active') return { error: 'Deal sudah tidak aktif' }
    if (deal.quantity_claimed >= deal.quantity_available) return { error: 'Deal sudah habis' }

    const buyerClaims = demoClaims.filter(c => c.deal_id === dealId && c.buyer_id === buyerId && c.status === 'active')
    if (buyerClaims.length >= deal.quantity_per_user) return { error: 'Sudah mencapai batas klaim' }

    const claim = {
      id: 'claim-' + Date.now(),
      deal_id: dealId,
      buyer_id: buyerId,
      voucher_code: generateVoucher(),
      status: 'active',
      claimed_at: new Date().toISOString(),
      redeemed_at: null,
      expires_at: deal.end_time,
    }
    demoClaims.push(claim)
    deal.quantity_claimed += 1
    deal.claim_count += 1
    return { claim }
  }

  try {
    // Check availability
    const { data: deal, error: dealErr } = await supabase
      .from('deals')
      .select('quantity_available, quantity_claimed, quantity_per_user, end_time, status')
      .eq('id', dealId)
      .single()
    if (dealErr || !deal) return { error: 'Deal tidak ditemukan' }
    if (deal.status !== 'active') return { error: 'Deal sudah tidak aktif' }
    if (deal.quantity_claimed >= deal.quantity_available) return { error: 'Deal sudah habis' }

    // Check per-user limit
    const { count } = await supabase
      .from('deal_claims')
      .select('id', { count: 'exact', head: true })
      .eq('deal_id', dealId)
      .eq('buyer_id', buyerId)
      .eq('status', 'active')
    if ((count ?? 0) >= deal.quantity_per_user) return { error: 'Sudah mencapai batas klaim' }

    // Insert claim
    const voucherCode = generateVoucher()
    const { data: claim, error: claimErr } = await supabase
      .from('deal_claims')
      .insert({
        deal_id: dealId,
        buyer_id: buyerId,
        voucher_code: voucherCode,
        expires_at: deal.end_time,
      })
      .select()
      .single()
    if (claimErr) throw claimErr

    // Increment quantity_claimed + claim_count
    await supabase
      .from('deals')
      .update({
        quantity_claimed: deal.quantity_claimed + 1,
        claim_count: (deal.claim_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId)

    return { claim }
  } catch (e) {
    console.warn('[dealService] claimDeal failed', e)
    return { error: 'Gagal klaim deal' }
  }
}

// ── Cancel claim (within 15 min) ────────────────────────────────────────────

export async function cancelClaim(claimId) {
  if (!supabase) {
    const claim = demoClaims.find(c => c.id === claimId)
    if (!claim) return { error: 'Klaim tidak ditemukan' }
    const elapsed = Date.now() - new Date(claim.claimed_at).getTime()
    if (elapsed > 15 * 60 * 1000) return { error: 'Batas waktu pembatalan 15 menit sudah lewat' }
    claim.status = 'cancelled'
    const deal = DEMO_DEALS.find(d => d.id === claim.deal_id)
    if (deal) {
      deal.quantity_claimed = Math.max(0, deal.quantity_claimed - 1)
      deal.claim_count = Math.max(0, deal.claim_count - 1)
    }
    return { success: true }
  }

  try {
    const { data: claim, error: fetchErr } = await supabase
      .from('deal_claims')
      .select('*')
      .eq('id', claimId)
      .single()
    if (fetchErr || !claim) return { error: 'Klaim tidak ditemukan' }

    const elapsed = Date.now() - new Date(claim.claimed_at).getTime()
    if (elapsed > 15 * 60 * 1000) return { error: 'Batas waktu pembatalan 15 menit sudah lewat' }

    const { error: updateErr } = await supabase
      .from('deal_claims')
      .update({ status: 'cancelled' })
      .eq('id', claimId)
    if (updateErr) throw updateErr

    // Restore quantity
    const { data: deal } = await supabase
      .from('deals')
      .select('quantity_claimed, claim_count')
      .eq('id', claim.deal_id)
      .single()
    if (deal) {
      await supabase
        .from('deals')
        .update({
          quantity_claimed: Math.max(0, deal.quantity_claimed - 1),
          claim_count: Math.max(0, (deal.claim_count ?? 0) - 1),
          updated_at: new Date().toISOString(),
        })
        .eq('id', claim.deal_id)
    }

    return { success: true }
  } catch (e) {
    console.warn('[dealService] cancelClaim failed', e)
    return { error: 'Gagal membatalkan klaim' }
  }
}

// ── Fetch buyer's claimed deals ─────────────────────────────────────────────

export async function fetchMyDeals(buyerId) {
  if (!supabase) {
    return demoClaims
      .filter(c => c.buyer_id === buyerId)
      .map(c => ({
        ...c,
        deal: DEMO_DEALS.find(d => d.id === c.deal_id) ?? null,
      }))
  }

  try {
    const { data, error } = await supabase
      .from('deal_claims')
      .select('*, deal:deal_id (*)')
      .eq('buyer_id', buyerId)
      .order('claimed_at', { ascending: false })
    if (error || !data) return []
    return data
  } catch {
    return []
  }
}

// ── Fetch seller's deals ────────────────────────────────────────────────────

export async function fetchSellerDeals(sellerId) {
  if (!supabase) {
    return DEMO_DEALS.filter(d => d.seller_id === sellerId)
  }

  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return data
  } catch {
    return []
  }
}

// ── Redeem deal ─────────────────────────────────────────────────────────────

export async function redeemDeal(claimId) {
  if (!supabase) {
    const claim = demoClaims.find(c => c.id === claimId)
    if (!claim) return { error: 'Klaim tidak ditemukan' }
    if (claim.status !== 'active') return { error: 'Klaim sudah tidak aktif' }
    claim.status = 'redeemed'
    claim.redeemed_at = new Date().toISOString()
    return { success: true }
  }

  try {
    const { data: claim, error: fetchErr } = await supabase
      .from('deal_claims')
      .select('status')
      .eq('id', claimId)
      .single()
    if (fetchErr || !claim) return { error: 'Klaim tidak ditemukan' }
    if (claim.status !== 'active') return { error: 'Klaim sudah tidak aktif' }

    const { error } = await supabase
      .from('deal_claims')
      .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
      .eq('id', claimId)
    if (error) throw error

    return { success: true }
  } catch (e) {
    console.warn('[dealService] redeemDeal failed', e)
    return { error: 'Gagal redeem deal' }
  }
}
