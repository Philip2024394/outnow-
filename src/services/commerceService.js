import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// ECHO Commerce — data layer
// All functions gracefully return demo data on Supabase error / missing table
// ─────────────────────────────────────────────────────────────────────────────

// ── Demo fallbacks ──────────────────────────────────────────────────────────
export const DEMO_PRODUCTS = [
  {
    id: 'demo-1', name: 'Wireless Earbuds Pro', price: 350000, currency: 'IDR',
    category: 'Leather Handbags', stock: 12, active: true, isNew: true,
    image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaa.png',
    description: 'Crystal clear sound, 24hr battery, IPX5 waterproof. Compatible with Android & iOS.',
    variants: {
      color: ['Black', 'White', 'Navy'],
    },
  },
  {
    id: 'demo-2', name: 'Leather Crossbody Bag', price: 1200000, currency: 'IDR',
    category: 'Leather Handbags', stock: 5, active: true, isNew: true,
    image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaasss.png',
    description: 'Genuine full-grain leather, brass hardware, adjustable strap. Handcrafted in Jakarta.',
    specs: {
      Material:   'Full-grain leather',
      Style:      'Crossbody',
      'Made by':  'Handmade',
      Condition:  'New',
      Closure:    'Magnetic snap',
      Hardware:   'Brass',
      Interior:   'Fully lined, 3 pockets, 1 zip pocket',
      Strap:      'Adjustable & removable, 55–120 cm',
      Dimensions: '26 × 18 × 8 cm',
      Origin:     'Jakarta, Indonesia',
    },
    variants: {
      color: [
        { label: 'Tan',        image: 'https://ik.imagekit.io/nepgaxllc/UntitledxcvzcvzxcvzxcASDASDfasdfsd.png' },
        { label: 'Black',      image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasd.png' },
        { label: 'Cognac',     image: 'https://ik.imagekit.io/nepgaxllc/Romantic%20sunset%20lakeside%20embrace.png' },
        { label: 'Dark Brown', image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasdsdasdaasdasd.png' },
      ],
    },
  },
  {
    id: 'demo-3', name: 'Leather Tote Bag', price: 850000, currency: 'IDR',
    category: 'Leather Handbags', stock: 8, active: true,
    image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaassssdasdcxc.png',
    description: 'Hand-poured soy wax, 6 scents. Burns for 40+ hours. Gift-box ready.',
    variants: {
      scent: ['Vanilla', 'Jasmine', 'Sandalwood', 'Citrus', 'Rose', 'Oud'],
    },
  },
  {
    id: 'demo-4', name: 'Slim Card Wallet', price: 320000, currency: 'IDR',
    category: 'Leather Wallets', stock: 20, active: true, isNew: true,
    image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaassssdasdcxcasdasda.png',
    description: 'Slim genuine leather card wallet. Holds 6 cards + cash pocket.',
    specs: {
      Material:    'Top-grain leather',
      Style:       'Card holder',
      'Made by':   'Handmade',
      Condition:   'New',
      'Card slots': '6',
      'Coin pocket': 'No',
      Closure:     'Open top',
      Dimensions:  '10 × 7 × 0.6 cm',
      Origin:      'Jakarta, Indonesia',
    },
    variants: {
      color: [
        { label: 'Black',  image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasd.png' },
        { label: 'Tan',    image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasdsdasdaasdasd.png' },
        { label: 'Brown',  image: 'https://ik.imagekit.io/nepgaxllc/Romantic%20sunset%20lakeside%20embrace.png' },
      ],
    },
  },
  {
    id: 'demo-5', name: 'Bifold Leather Wallet', price: 450000, currency: 'IDR',
    category: 'Leather Wallets', stock: 15, active: true,
    image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaassssdasdcxcasdasdadfssdf.png',
    description: 'Classic bifold with 8 card slots, ID window and bill compartment.',
    specs: {
      Material:    'Full-grain leather',
      Style:       'Bifold',
      'Made by':   'Machine-stitched, hand-finished',
      Condition:   'New',
      'Card slots': '8',
      'ID window': 'Yes',
      'Bill compartment': 'Yes',
      'Coin pocket': 'No',
      Closure:     'Open fold',
      Dimensions:  '11 × 9.5 × 1.2 cm',
      Origin:      'Jakarta, Indonesia',
    },
    variants: {
      color: [
        { label: 'Black',  image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasd.png' },
        { label: 'Cognac', image: 'https://ik.imagekit.io/nepgaxllc/Romantic%20sunset%20lakeside%20embrace.png' },
      ],
    },
  },
  {
    id: 'demo-6', name: 'Leather Keychain', price: 95000, currency: 'IDR',
    category: 'Accessories', stock: 40, active: true,
    image: 'https://ik.imagekit.io/nepgaxllc/Untitledzxczxczxczx.png',
    description: 'Hand-stitched leather keychain. Personalised initials available.',
    variants: {
      color: ['Tan', 'Black', 'Dark Brown'],
    },
  },
]

export const DEMO_ORDERS = [
  { id: 'ord-001', product: 'Wireless Earbuds Pro',     buyer: 'Sari M.',   qty: 1, total: 350000,  status: 'pending',   time: '2 min ago' },
  { id: 'ord-002', product: 'Leather Crossbody Bag',    buyer: 'Budi K.',   qty: 1, total: 1200000, status: 'confirmed', time: '14 min ago' },
  { id: 'ord-003', product: 'Aromatherapy Candle Set',  buyer: 'Dewi N.',   qty: 2, total: 370000,  status: 'shipped',   time: '1 hr ago' },
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
