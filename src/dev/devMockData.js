/**
 * DEV PANEL — Mock data constants
 * Used by DevPanel.jsx for previewing components with realistic data.
 */

export const MOCK_USER = {
  id: 'dev-u1',
  displayName: 'Sophie',
  age: 27,
  photoURL: 'https://ik.imagekit.io/nepgaxllc/uk1.png',
  bio: 'Love a good cocktail bar and terrible karaoke 🎤',
  area: 'Bali',
  city: 'Denpasar',
}

const MOCK_CONV_BASE = {
  id: 'dev-conv-1',
  status: 'active',
  unread: 0,
  isUserA: true,
  messages: [
    { id: 'm1', fromMe: false, text: 'Hey! How are you?', time: Date.now() - 60000 },
    { id: 'm2', fromMe: true,  text: 'Doing great, thanks! You?', time: Date.now() - 30000, read: true },
    { id: 'm3', fromMe: false, text: 'Amazing! Want to meet up?', time: Date.now() - 10000 },
  ],
}

export const MOCK_CONVS = {
  dating: { ...MOCK_CONV_BASE, id: 'dev-conv-dating', displayName: 'Sophie', age: 26, area: 'Bali', emoji: '💕', photoURL: 'https://ik.imagekit.io/nepgaxllc/uk1.png' },
  market: { ...MOCK_CONV_BASE, id: 'dev-conv-market', displayName: 'Bali Crafts Co.', area: 'Ubud', emoji: '🛍️', photoURL: null },
  food:   { ...MOCK_CONV_BASE, id: 'dev-conv-food',   displayName: 'Warung Sari', area: 'Seminyak', emoji: '🍽️', photoURL: null },
}

export const MOCK_RESTAURANT = {
  id: 'dev-r1',
  name: 'Warung Sari Rasa',
  cuisine_type: 'Javanese',
  rating: 4.8,
  lat: -8.409518, lng: 115.188919,
  menu_items: [
    { id: 'mi1', name: 'Nasi Gudeg Komplit', price: 32000, is_available: true, image: 'https://ik.imagekit.io/nepgaxllc/Traditional%20Javanese%20feast%20on%20banana%20leaves.png' },
    { id: 'mi2', name: 'Soto Ayam Kampung', price: 25000, is_available: true, image: null },
    { id: 'mi3', name: 'Tempe Bacem',       price: 12000, is_available: true, image: null },
    { id: 'mi4', name: 'Es Teh Manis',      price: 8000,  is_available: true, image: null },
    { id: 'mi5', name: 'Bakmi Jawa Goreng', price: 28000, is_available: true, image: null },
    { id: 'mi6', name: 'Klepon',            price: 15000, is_available: false, image: null },
  ],
}

export const MOCK_FOOD_ORDER = {
  id: 'dev-order-1',
  cash_ref: 'FD-7X2K',
  status: 'driver_heading',
  restaurant_name: 'Warung Sari Rasa',
  restaurant_id: 'dev-r1',
  restaurant_bank_name: 'BCA',
  restaurant_bank_account: '1234567890',
  restaurant_bank_holder: 'Warung Sari Rasa',
  driver_name: 'Budi Santoso',
  driver_vehicle: 'Honda Vario · Blue',
  driver_plate: 'AB 1234 XY',
  driver_phone: '+6281234567890',
  recipient_name: 'Rina',
  subtotal: 57000,
  delivery_fee: 15000,
  total: 72000,
  payment_deadline: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
  items: [
    { name: 'Nasi Gudeg Komplit', qty: 1, price: 32000 },
    { name: 'Soto Ayam Kampung',  qty: 1, price: 25000 },
  ],
}

export const MOCK_INCOMING_BOOKING = {
  id: 'BOOK_DEV_001',
  pickup_location:  'Jl. Malioboro No. 12, Yogyakarta',
  dropoff_location: 'Prambanan Temple, Sleman',
  fare:             28000,
  distance_km:      4.2,
  created_at:       new Date().toISOString(),
  expires_at:       new Date(Date.now() + 45 * 1000).toISOString(),
  status:           'pending',
  passenger: { display_name: 'Rina Kartika', rating: 4.8, photo_url: null },
}

export const MOCK_DRIVER_ORDER = {
  ...MOCK_FOOD_ORDER,
  pickup_code: 'AB3X7K',
  items: MOCK_FOOD_ORDER.items,
}

export const MOCK_DRIVER = {
  id: 'dev-driver-1',
  display_name: 'Budi Santoso',
  vehicle_model: 'Honda Vario',
  vehicle_color: 'Blue',
  plate_prefix: 'AB 1234 XY',
  rating: 4.9,
  etaMin: 5,
  total_trips: 1234,
  years_experience: 3,
  acceptance_rate: 98,
  languages: ['id', 'en'],
  photo_url: null,
}

export const MOCK_ORDER_CARD_MARKET = {
  type: 'marketplace',
  ref: '#SHOP_98765432',
  sellerName: 'Bali Crafts Co.',
  sellerId: 'dev-seller-1',
  items: [
    { name: 'Handwoven Rattan Bag', variantStr: 'Natural / M', qty: 1, price: 185000 },
    { name: 'Batik Tote',           variantStr: 'Blue',         qty: 2, price: 95000  },
  ],
  subtotal: 375000,
  deliveryFee: 25000,
  total: 400000,
  notes: 'Please wrap as gift',
  status: 'pending',
  updatedAt: new Date().toISOString(),
}

export const MOCK_ORDER_CARD_FOOD = {
  type: 'restaurant',
  ref: '#MAKAN_12345678',
  sellerName: 'Warung Sari Rasa',
  sellerId: 'dev-r1',
  items: [
    { name: 'Nasi Gudeg Komplit', qty: 2, price: 28000 },
    { name: 'Es Teh Manis',       qty: 2, price: 5000  },
  ],
  subtotal: 66000,
  deliveryFee: 15000,
  total: 81000,
  notes: 'Extra krecek please',
  status: 'confirmed',
  updatedAt: new Date().toISOString(),
}

export const MOCK_CONV_ORDER_MARKET = {
  ...MOCK_CONVS.market,
  id: 'dev-conv-order-market',
  messages: [
    { id: 'om1', fromMe: true, orderCard: MOCK_ORDER_CARD_MARKET, time: Date.now() - 5000 },
  ],
}

export const MOCK_CONV_ORDER_FOOD = {
  ...MOCK_CONVS.food,
  id: 'dev-conv-order-food',
  messages: [
    { id: 'of1', fromMe: true, orderCard: MOCK_ORDER_CARD_FOOD, time: Date.now() - 5000 },
  ],
}

export const MOCK_SELLER = {
  id: 'dev-seller-1',
  displayName: 'Dewi Hartono',
  brandName: 'Bali Crafts Co.',
  bio: 'Handmade rattan bags, batik and natural fibre goods crafted in Ubud. Every piece is one-of-a-kind.',
  photoURL: null,
  city: 'Ubud',
  country: 'Indonesia',
  lookingFor: 'handmade',
  productCondition: 'new',
  bizWhatsapp: null,
  instagram: 'balicraftsco',
  seller_plan: 'standard',
  openTime: '9:00 AM',
  closeTime: '6:00 PM',
}

export const MOCK_CONV_SELLER_LOCKED = {
  ...MOCK_CONVS.market,
  id: 'dev-conv-seller-locked',
  messages: [
    { id: 'sl1', fromMe: false, text: 'Hi, is the bag still available?', time: Date.now() - 120000 },
    { id: 'sl2', fromMe: true,  text: 'Yes it is! Want to place an order?', time: Date.now() - 90000, read: true },
    { id: 'sl3', fromMe: false, text: "Great, I'll take the tan one please.", time: Date.now() - 60000 },
    { id: 'sl4', fromMe: true, orderCard: {
      type: 'marketplace', ref: '#SHOP_11223344',
      sellerName: 'Bali Crafts Co.', sellerId: 'dev-seller-1',
      items: [{ name: 'Leather Crossbody Bag', variantStr: 'Tan', qty: 1, price: 1200000 }],
      subtotal: 1200000, deliveryFee: 25000, total: 1225000,
      status: 'complete', updatedAt: new Date().toISOString(),
    }, time: Date.now() - 30000 },
  ],
}

export const MOCK_CONV_COMMISSION_PENDING = {
  ...MOCK_CONVS.market,
  id: 'dev-conv-commission-pending',
  messages: [
    { id: 'cp1', fromMe: false, text: 'Payment done, thank you!', time: Date.now() - 45000 },
    { id: 'cp2', fromMe: true, orderCard: {
      type: 'marketplace', ref: '#SHOP_55667788',
      sellerName: 'Bali Crafts Co.', sellerId: 'dev-seller-1',
      items: [{ name: 'Slim Card Wallet', variantStr: 'Black', qty: 2, price: 320000 }],
      subtotal: 640000, deliveryFee: 15000, total: 655000,
      status: 'complete', updatedAt: new Date().toISOString(),
    }, time: Date.now() - 60000 },
  ],
}

export const MOCK_COMPLETED_BOOKING = {
  ...MOCK_INCOMING_BOOKING,
  id: 'BOOK_DEV_END_001',
  fare: 28000,
  status: 'in_progress',
}

export const MOCK_DRIVER_COMMISSIONS = [
  { id: 'dc1', orderRef: '#RIDE_11223344', fare: 28000, amount: 2800 },
  { id: 'dc2', orderRef: '#RIDE_55667788', fare: 35000, amount: 3500 },
  { id: 'dc3', orderRef: '#RIDE_99001122', fare: 22000, amount: 2200 },
]

export const MOCK_REST_ORDER_COD = {
  id: 'dev-rest-order-1',
  ref: '#MAKAN_00000001',
  buyerName: 'Rina Kartika',
  paymentMethod: 'cod',
  items: [
    { name: 'Nasi Gudeg Komplit', qty: 2, price: 28000 },
    { name: 'Es Teh Manis',       qty: 2, price: 5000  },
  ],
  total: 66000,
  finalTotal: 66000,
  notes: 'Extra krecek please',
}

export const MOCK_REST_ORDER_BANK = {
  ...MOCK_REST_ORDER_COD,
  id: 'dev-rest-order-2',
  ref: '#MAKAN_00000002',
  paymentMethod: 'bank_transfer',
  grossTotal: 66000,
  discountAmount: 1980,
  finalTotal: 64020,
  proofUrl: null,
}

export const MOCK_BANK_CARD_BASE = {
  bankName: 'BCA',
  accountNumber: '1234 5678 90',
  accountHolder: 'Warung Sari Rasa',
  grossTotal: 66000,
  discountAmount: 1980,
  finalTotal: 64020,
  orderRef: '#MAKAN_00000002',
  restaurantName: 'Warung Sari Rasa',
}
