import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// ECHO Commerce — data layer
// All functions gracefully return demo data on Supabase error / missing table
// ─────────────────────────────────────────────────────────────────────────────

// ── Demo fallbacks ──────────────────────────────────────────────────────────
export const DEMO_PRODUCTS = [
  {
    id: 'demo-1', name: 'Wireless Earbuds Pro', price: 49.99, currency: 'USD',
    category: 'Electronics', stock: 12, active: true,
    image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasd.png',
    description: 'Crystal clear sound, 24hr battery.',
  },
  {
    id: 'demo-2', name: 'Leather Crossbody Bag', price: 89.00, currency: 'USD',
    category: 'Fashion', stock: 5, active: true,
    image: 'https://ik.imagekit.io/nepgaxllc/Romantic%20sunset%20lakeside%20embrace.png',
    description: 'Genuine leather, minimalist design.',
  },
  {
    id: 'demo-3', name: 'Aromatherapy Candle Set', price: 24.99, currency: 'USD',
    category: 'Wellness', stock: 30, active: true,
    image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasdsdasdaasdasdasdasd.png',
    description: 'Hand-poured soy wax, 6 scents.',
  },
  {
    id: 'demo-4', name: 'Handmade Ceramic Mug', price: 18.50, currency: 'USD',
    category: 'Handmade', stock: 8, active: false,
    image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasdsdasdaasdasd.png',
    description: '400ml, dishwasher safe.',
  },
  {
    id: 'demo-5', name: 'Organic Face Serum', price: 34.00, currency: 'USD',
    category: 'Beauty', stock: 20, active: true,
    image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasd.png',
    description: 'Vitamin C + hyaluronic acid.',
  },
  {
    id: 'demo-6', name: 'Bamboo Desk Organiser', price: 29.95, currency: 'USD',
    category: 'Home', stock: 15, active: true,
    image: 'https://ik.imagekit.io/nepgaxllc/Romantic%20sunset%20lakeside%20embrace.png',
    description: 'Eco-friendly, 6 compartments.',
  },
]

export const DEMO_ORDERS = [
  { id: 'ord-001', product: 'Wireless Earbuds Pro', buyer: 'Sarah M.', qty: 1, total: 49.99, status: 'pending',  time: '2 min ago' },
  { id: 'ord-002', product: 'Leather Crossbody Bag', buyer: 'James K.', qty: 1, total: 89.00, status: 'confirmed', time: '14 min ago' },
  { id: 'ord-003', product: 'Aromatherapy Candle Set', buyer: 'Priya N.', qty: 2, total: 49.98, status: 'shipped', time: '1 hr ago' },
]

export const DEMO_STATS = {
  views: 342, cartAdds: 28, whatsappClicks: 19, orders: 7,
}

// ── Business profile ─────────────────────────────────────────────────────────
export async function fetchBusiness(userId) {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error) return null
    return data
  } catch { return null }
}

export async function saveBusiness(userId, payload) {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .upsert({ user_id: userId, ...payload }, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    return data
  } catch { return null }
}

// ── Products ─────────────────────────────────────────────────────────────────
export async function fetchProducts(userId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error || !data) return DEMO_PRODUCTS
    return data.length ? data : DEMO_PRODUCTS
  } catch { return DEMO_PRODUCTS }
}

export async function toggleProductActive(productId, active) {
  try {
    await supabase.from('products').update({ active }).eq('id', productId)
  } catch { /* noop */ }
}

export async function saveProduct(userId, product) {
  try {
    const payload = { ...product, user_id: userId }
    if (product.id && !product.id.startsWith('demo-')) {
      const { data } = await supabase.from('products').update(payload).eq('id', product.id).select().single()
      return data
    } else {
      const { id: _id, ...rest } = payload
      void _id
      const { data } = await supabase.from('products').insert(rest).select().single()
      return data
    }
  } catch { return null }
}

export async function deleteProduct(productId) {
  try {
    await supabase.from('products').delete().eq('id', productId)
  } catch { /* noop */ }
}

// ── Orders ───────────────────────────────────────────────────────────────────
export async function fetchOrders(userId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
    if (error || !data) return DEMO_ORDERS
    return data.length ? data : DEMO_ORDERS
  } catch { return DEMO_ORDERS }
}

export async function updateOrderStatus(orderId, status) {
  try {
    await supabase.from('orders').update({ status }).eq('id', orderId)
  } catch { /* noop */ }
}

// ── Stats ────────────────────────────────────────────────────────────────────
export async function fetchStats(userId) {
  try {
    const { data, error } = await supabase
      .from('commerce_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error || !data) return DEMO_STATS
    return data
  } catch { return DEMO_STATS }
}
