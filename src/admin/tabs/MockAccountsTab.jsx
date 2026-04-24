/**
 * MockAccountsTab — Admin creates mock users, drivers, vendors, restaurants, food items, deals
 * Full seeding control for all modules
 */
import { useState } from 'react'

const fmtRp = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID')

const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
const btnStyle = { padding: '10px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }
const labelStyle = { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }
const sectionStyle = { padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }

const SECTIONS = [
  { id: 'user', label: 'User Account', icon: '👤' },
  { id: 'driver', label: 'Driver Account', icon: '🏍️' },
  { id: 'vendor', label: 'Vendor / Restaurant', icon: '🍽️' },
  { id: 'menu', label: 'Food Menu Items', icon: '🍔' },
  { id: 'deal', label: 'Deal Hunt Post', icon: '🔥' },
  { id: 'promo', label: 'Promo Code', icon: '🏷️' },
]

export default function MockAccountsTab() {
  const [section, setSection] = useState('user')
  const [toast, setToast] = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  // ── User form ──
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userCity, setUserCity] = useState('Yogyakarta')
  const [userVerified, setUserVerified] = useState(true)

  const createUser = () => {
    if (!userName.trim()) return
    const users = JSON.parse(localStorage.getItem('indoo_mock_users') || '[]')
    users.push({ id: `user-${Date.now()}`, display_name: userName.trim(), email: userEmail.trim(), phone: userPhone.trim(), city: userCity, is_verified: userVerified, created_at: new Date().toISOString(), status: 'active' })
    localStorage.setItem('indoo_mock_users', JSON.stringify(users))
    setUserName(''); setUserEmail(''); setUserPhone('')
    showToast(`User "${userName.trim()}" created`)
  }

  // ── Driver form ──
  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [driverVehicle, setDriverVehicle] = useState('Honda Beat')
  const [driverPlate, setDriverPlate] = useState('')
  const [driverType, setDriverType] = useState('bike_ride')

  const createDriver = () => {
    if (!driverName.trim()) return
    const drivers = JSON.parse(localStorage.getItem('indoo_mock_drivers') || '[]')
    drivers.push({ id: `driver-${Date.now()}`, display_name: driverName.trim(), phone: driverPhone.trim(), vehicle_model: driverVehicle, vehicle_plate: driverPlate.trim(), vehicle_type: driverType, rating: 4.8, total_trips: 0, status: 'approved', is_online: false, created_at: new Date().toISOString() })
    localStorage.setItem('indoo_mock_drivers', JSON.stringify(drivers))
    setDriverName(''); setDriverPhone(''); setDriverPlate('')
    showToast(`Driver "${driverName.trim()}" created`)
  }

  // ── Vendor form ──
  const [vendorName, setVendorName] = useState('')
  const [vendorCuisine, setVendorCuisine] = useState('Indonesian')
  const [vendorAddress, setVendorAddress] = useState('')
  const [vendorPhone, setVendorPhone] = useState('')
  const [vendorType, setVendorType] = useState('restaurant')
  const [vendorBank, setVendorBank] = useState('BCA')
  const [vendorAccount, setVendorAccount] = useState('')

  const createVendor = () => {
    if (!vendorName.trim()) return
    const vendors = JSON.parse(localStorage.getItem('indoo_mock_vendors') || '[]')
    vendors.push({ id: `rest-${Date.now()}`, name: vendorName.trim(), cuisine_type: vendorCuisine, address: vendorAddress.trim(), phone: vendorPhone.trim(), vendor_type: vendorType, bank: { name: vendorBank, account_number: vendorAccount, account_holder: vendorName.trim() }, status: 'approved', rating: 4.5, review_count: 0, is_open: true, created_at: new Date().toISOString() })
    localStorage.setItem('indoo_mock_vendors', JSON.stringify(vendors))
    setVendorName(''); setVendorAddress(''); setVendorPhone(''); setVendorAccount('')
    showToast(`Restaurant "${vendorName.trim()}" created`)
  }

  // ── Menu item form ──
  const [menuName, setMenuName] = useState('')
  const [menuPrice, setMenuPrice] = useState('')
  const [menuCategory, setMenuCategory] = useState('Main')
  const [menuDesc, setMenuDesc] = useState('')
  const [menuRestId, setMenuRestId] = useState('')

  const createMenuItem = () => {
    if (!menuName.trim() || !menuPrice) return
    const items = JSON.parse(localStorage.getItem('indoo_mock_menu_items') || '[]')
    items.push({ id: `item-${Date.now()}`, name: menuName.trim(), price: Number(menuPrice), category: menuCategory, description: menuDesc.trim(), restaurant_id: menuRestId.trim() || 'rest-demo', is_available: true, created_at: new Date().toISOString() })
    localStorage.setItem('indoo_mock_menu_items', JSON.stringify(items))
    setMenuName(''); setMenuPrice(''); setMenuDesc('')
    showToast(`Menu item "${menuName.trim()}" created`)
  }

  // ── Deal form ──
  const [dealTitle, setDealTitle] = useState('')
  const [dealOriginal, setDealOriginal] = useState('')
  const [dealPrice, setDealPrice] = useState('')
  const [dealCategory, setDealCategory] = useState('food')
  const [dealQty, setDealQty] = useState('10')
  const [dealAddress, setDealAddress] = useState('')

  const createDeal = () => {
    if (!dealTitle.trim() || !dealOriginal || !dealPrice) return
    const deals = JSON.parse(localStorage.getItem('indoo_public_deals') || '[]')
    deals.unshift({ id: `DEAL-${Date.now().toString(36).toUpperCase()}`, title: dealTitle.trim(), original_price: Number(dealOriginal), deal_price: Number(dealPrice), discount_pct: Math.round((1 - Number(dealPrice) / Number(dealOriginal)) * 100), category: dealCategory, quantity: Number(dealQty), address: dealAddress.trim(), status: 'active', images: [], whatsapp: '', created_at: new Date().toISOString(), seller_id: 'admin', view_count: 0, claim_count: 0 })
    localStorage.setItem('indoo_public_deals', JSON.stringify(deals))
    setDealTitle(''); setDealOriginal(''); setDealPrice(''); setDealAddress('')
    showToast(`Deal "${dealTitle.trim()}" posted (active)`)
  }

  // ── Promo code form ──
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState('')
  const [promoType, setPromoType] = useState('percent')
  const [promoMinOrder, setPromoMinOrder] = useState('25000')
  const [promoMaxDiscount, setPromoMaxDiscount] = useState('15000')
  const [promoExpiry, setPromoExpiry] = useState('2026-12-31')

  const createPromo = () => {
    if (!promoCode.trim() || !promoDiscount) return
    const promos = JSON.parse(localStorage.getItem('indoo_admin_promos') || '[]')
    promos.push({ code: promoCode.toUpperCase().trim(), discount: Number(promoDiscount), type: promoType, minOrder: Number(promoMinOrder), maxDiscount: Number(promoMaxDiscount), expires: promoExpiry, usageLimit: 999, label: `Admin: ${promoCode.toUpperCase().trim()}`, created_at: new Date().toISOString() })
    localStorage.setItem('indoo_admin_promos', JSON.stringify(promos))
    setPromoCode(''); setPromoDiscount('')
    showToast(`Promo code "${promoCode.toUpperCase().trim()}" created`)
  }

  return (
    <div style={{ padding: 28, maxWidth: 800 }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>🛠️ Mock Accounts & Data</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>Create test data for any module — appears immediately in the app</p>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{ ...btnStyle, background: section === s.id ? '#8DC63F' : 'rgba(255,255,255,0.06)', color: section === s.id ? '#000' : 'rgba(255,255,255,0.5)', border: section === s.id ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* USER */}
      {section === 'user' && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>👤 Create User Account</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><span style={labelStyle}>Full Name</span><input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Budi Santoso" style={inputStyle} /></div>
            <div><span style={labelStyle}>Email</span><input value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="budi@email.com" style={inputStyle} /></div>
            <div><span style={labelStyle}>Phone</span><input value={userPhone} onChange={e => setUserPhone(e.target.value)} placeholder="081234567890" style={inputStyle} /></div>
            <div><span style={labelStyle}>City</span><input value={userCity} onChange={e => setUserCity(e.target.value)} style={inputStyle} /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <input type="checkbox" checked={userVerified} onChange={e => setUserVerified(e.target.checked)} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Verified account</span>
          </div>
          <button onClick={createUser} style={{ ...btnStyle, background: '#8DC63F', color: '#000', marginTop: 16, width: '100%' }}>Create User</button>
        </div>
      )}

      {/* DRIVER */}
      {section === 'driver' && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>🏍️ Create Driver Account</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><span style={labelStyle}>Driver Name</span><input value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Agus Prasetyo" style={inputStyle} /></div>
            <div><span style={labelStyle}>Phone</span><input value={driverPhone} onChange={e => setDriverPhone(e.target.value)} placeholder="081234567890" style={inputStyle} /></div>
            <div><span style={labelStyle}>Vehicle</span><input value={driverVehicle} onChange={e => setDriverVehicle(e.target.value)} style={inputStyle} /></div>
            <div><span style={labelStyle}>Plate</span><input value={driverPlate} onChange={e => setDriverPlate(e.target.value)} placeholder="AB 1234 XY" style={inputStyle} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {['bike_ride', 'car_taxi'].map(t => (
              <button key={t} onClick={() => setDriverType(t)} style={{ ...btnStyle, background: driverType === t ? '#8DC63F' : 'rgba(255,255,255,0.06)', color: driverType === t ? '#000' : '#fff', border: driverType === t ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                {t === 'bike_ride' ? '🏍️ Bike' : '🚗 Car'}
              </button>
            ))}
          </div>
          <button onClick={createDriver} style={{ ...btnStyle, background: '#8DC63F', color: '#000', marginTop: 16, width: '100%' }}>Create Driver</button>
        </div>
      )}

      {/* VENDOR */}
      {section === 'vendor' && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>🍽️ Create Vendor / Restaurant</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><span style={labelStyle}>Restaurant Name</span><input value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder="Warung Enak" style={inputStyle} /></div>
            <div><span style={labelStyle}>Cuisine Type</span><input value={vendorCuisine} onChange={e => setVendorCuisine(e.target.value)} style={inputStyle} /></div>
            <div><span style={labelStyle}>Address</span><input value={vendorAddress} onChange={e => setVendorAddress(e.target.value)} placeholder="Jl. Malioboro 45" style={inputStyle} /></div>
            <div><span style={labelStyle}>Phone</span><input value={vendorPhone} onChange={e => setVendorPhone(e.target.value)} style={inputStyle} /></div>
            <div><span style={labelStyle}>Bank</span><input value={vendorBank} onChange={e => setVendorBank(e.target.value)} style={inputStyle} /></div>
            <div><span style={labelStyle}>Account Number</span><input value={vendorAccount} onChange={e => setVendorAccount(e.target.value)} style={inputStyle} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {['restaurant', 'street_vendor'].map(t => (
              <button key={t} onClick={() => setVendorType(t)} style={{ ...btnStyle, background: vendorType === t ? '#8DC63F' : 'rgba(255,255,255,0.06)', color: vendorType === t ? '#000' : '#fff', border: vendorType === t ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                {t === 'restaurant' ? '🍽️ Restaurant' : '🛒 Street Vendor'}
              </button>
            ))}
          </div>
          <button onClick={createVendor} style={{ ...btnStyle, background: '#8DC63F', color: '#000', marginTop: 16, width: '100%' }}>Create Restaurant</button>
        </div>
      )}

      {/* MENU ITEMS */}
      {section === 'menu' && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>🍔 Create Food Menu Item</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><span style={labelStyle}>Item Name</span><input value={menuName} onChange={e => setMenuName(e.target.value)} placeholder="Nasi Goreng Spesial" style={inputStyle} /></div>
            <div><span style={labelStyle}>Price (Rp)</span><input type="number" value={menuPrice} onChange={e => setMenuPrice(e.target.value)} placeholder="25000" style={inputStyle} /></div>
            <div><span style={labelStyle}>Category</span><select value={menuCategory} onChange={e => setMenuCategory(e.target.value)} style={inputStyle}><option>Main</option><option>Sides</option><option>Drinks</option><option>Desserts</option><option>Snacks</option></select></div>
            <div><span style={labelStyle}>Restaurant ID</span><input value={menuRestId} onChange={e => setMenuRestId(e.target.value)} placeholder="rest-demo" style={inputStyle} /></div>
          </div>
          <div style={{ marginTop: 12 }}><span style={labelStyle}>Description</span><textarea value={menuDesc} onChange={e => setMenuDesc(e.target.value)} placeholder="Describe the dish..." style={{ ...inputStyle, height: 60, resize: 'none' }} /></div>
          <button onClick={createMenuItem} style={{ ...btnStyle, background: '#8DC63F', color: '#000', marginTop: 16, width: '100%' }}>Create Menu Item</button>
        </div>
      )}

      {/* DEAL */}
      {section === 'deal' && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>🔥 Post Deal (Admin — auto-approved)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><span style={labelStyle}>Deal Title</span><input value={dealTitle} onChange={e => setDealTitle(e.target.value)} placeholder="Fresh Durian Season" style={inputStyle} /></div>
            <div><span style={labelStyle}>Category</span><select value={dealCategory} onChange={e => setDealCategory(e.target.value)} style={inputStyle}><option value="food">Food</option><option value="marketplace">Marketplace</option><option value="fashion">Fashion</option><option value="electronics">Electronics</option><option value="services">Services</option><option value="other">Other</option></select></div>
            <div><span style={labelStyle}>Original Price</span><input type="number" value={dealOriginal} onChange={e => setDealOriginal(e.target.value)} placeholder="100000" style={inputStyle} /></div>
            <div><span style={labelStyle}>Deal Price</span><input type="number" value={dealPrice} onChange={e => setDealPrice(e.target.value)} placeholder="65000" style={inputStyle} /></div>
            <div><span style={labelStyle}>Quantity</span><input type="number" value={dealQty} onChange={e => setDealQty(e.target.value)} style={inputStyle} /></div>
            <div><span style={labelStyle}>Pickup Address</span><input value={dealAddress} onChange={e => setDealAddress(e.target.value)} placeholder="Jl. Malioboro 45" style={inputStyle} /></div>
          </div>
          {dealOriginal && dealPrice && Number(dealPrice) < Number(dealOriginal) && (
            <div style={{ marginTop: 8, padding: '6px 12px', borderRadius: 8, background: 'rgba(141,198,63,0.1)' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#8DC63F' }}>{Math.round((1 - Number(dealPrice) / Number(dealOriginal)) * 100)}% OFF</span>
            </div>
          )}
          <button onClick={createDeal} style={{ ...btnStyle, background: '#8DC63F', color: '#000', marginTop: 16, width: '100%' }}>Post Deal (Live Immediately)</button>
        </div>
      )}

      {/* PROMO CODE */}
      {section === 'promo' && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>🏷️ Create Promo Code</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><span style={labelStyle}>Code</span><input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="INDOO50" style={inputStyle} /></div>
            <div><span style={labelStyle}>Discount Value</span><input type="number" value={promoDiscount} onChange={e => setPromoDiscount(e.target.value)} placeholder="15" style={inputStyle} /></div>
            <div><span style={labelStyle}>Type</span><select value={promoType} onChange={e => setPromoType(e.target.value)} style={inputStyle}><option value="percent">Percent (%)</option><option value="flat">Flat (Rp)</option><option value="free_delivery">Free Delivery</option></select></div>
            <div><span style={labelStyle}>Min Order (Rp)</span><input type="number" value={promoMinOrder} onChange={e => setPromoMinOrder(e.target.value)} style={inputStyle} /></div>
            <div><span style={labelStyle}>Max Discount (Rp)</span><input type="number" value={promoMaxDiscount} onChange={e => setPromoMaxDiscount(e.target.value)} style={inputStyle} /></div>
            <div><span style={labelStyle}>Expires</span><input type="date" value={promoExpiry} onChange={e => setPromoExpiry(e.target.value)} style={inputStyle} /></div>
          </div>
          <button onClick={createPromo} style={{ ...btnStyle, background: '#8DC63F', color: '#000', marginTop: 16, width: '100%' }}>Create Promo Code</button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', borderRadius: 12, background: '#8DC63F', color: '#000', fontSize: 14, fontWeight: 800, zIndex: 10000, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
