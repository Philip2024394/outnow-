import { useEffect, useRef, useState, useCallback } from 'react'
import styles from './FleetIntelTab.module.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

// ── Yogyakarta Zones (12) ──────────────────────────────────────────────────────
const ZONES = [
  { id:'z1',  name:'Malioboro',          slug:'malioboro',          lat:-7.7925, lng:110.3658, radius:0.6,  type:'commercial',  demandLevel:'busy',   driverCount:3, orderCount:8, avgWait:'4m' },
  { id:'z2',  name:'Prawirotaman',       slug:'prawirotaman',       lat:-7.8125, lng:110.3650, radius:0.5,  type:'nightlife',   demandLevel:'surge',  driverCount:1, orderCount:6, avgWait:'8m' },
  { id:'z3',  name:'UGM Campus',         slug:'ugm-campus',         lat:-7.7713, lng:110.3776, radius:0.8,  type:'campus',      demandLevel:'normal', driverCount:4, orderCount:3, avgWait:'2m' },
  { id:'z4',  name:'Kota Baru',          slug:'kota-baru',          lat:-7.7820, lng:110.3758, radius:0.4,  type:'residential', demandLevel:'normal', driverCount:2, orderCount:2, avgWait:'3m' },
  { id:'z5',  name:'Tugu Station',       slug:'tugu-station',       lat:-7.7891, lng:110.3614, radius:0.4,  type:'commercial',  demandLevel:'busy',   driverCount:2, orderCount:5, avgWait:'5m' },
  { id:'z6',  name:'Alun-Alun Selatan',  slug:'alun-alun-selatan',  lat:-7.8120, lng:110.3580, radius:0.5,  type:'nightlife',   demandLevel:'busy',   driverCount:1, orderCount:4, avgWait:'6m' },
  { id:'z7',  name:'Jalan Kaliurang',    slug:'jalan-kaliurang',    lat:-7.7500, lng:110.3850, radius:0.9,  type:'campus',      demandLevel:'low',    driverCount:5, orderCount:1, avgWait:'1m' },
  { id:'z8',  name:'Amplaz/Ambarukmo',   slug:'amplaz-ambarukmo',   lat:-7.7835, lng:110.4020, radius:0.5,  type:'commercial',  demandLevel:'normal', driverCount:3, orderCount:3, avgWait:'3m' },
  { id:'z9',  name:'Seturan',            slug:'seturan',            lat:-7.7650, lng:110.4100, radius:0.6,  type:'nightlife',   demandLevel:'surge',  driverCount:0, orderCount:5, avgWait:'12m' },
  { id:'z10', name:'Jakal North',        slug:'jakal-north',        lat:-7.7350, lng:110.3900, radius:0.7,  type:'nightlife',   demandLevel:'low',    driverCount:2, orderCount:0, avgWait:'0m' },
  { id:'z11', name:'Condongcatur',       slug:'condongcatur',       lat:-7.7550, lng:110.3950, radius:0.6,  type:'residential', demandLevel:'dead',   driverCount:3, orderCount:0, avgWait:'0m' },
  { id:'z12', name:'Kotagede',           slug:'kotagede',           lat:-7.8200, lng:110.3950, radius:0.5,  type:'residential', demandLevel:'dead',   driverCount:1, orderCount:0, avgWait:'0m' },
]

// ── Demo Drivers (20) ───────────────────────────────────────────────────────────
const DEMO_DRIVERS = [
  { id:'d1',  name:'Budi Santoso',      callsign:'INDOO 4578', type:'bike', lat:-7.7930, lng:110.3662, status:'busy',    rating:4.9, trips:312, phone:'+62811100001', currentZone:'Malioboro',        bikeBrand:'Honda Beat',    plate:'AB 1234 CD', photo:'https://i.pravatar.cc/80?img=1' },
  { id:'d2',  name:'Rudi Hartono',      callsign:'INDOO 3201', type:'car',  lat:-7.7920, lng:110.3650, status:'online',  rating:4.7, trips:541, phone:'+62811100002', currentZone:'Malioboro',        bikeBrand:'Toyota Avanza', plate:'AB 5678 EF', photo:'https://i.pravatar.cc/80?img=2' },
  { id:'d3',  name:'Agus Prasetyo',     callsign:'INDOO 1189', type:'bike', lat:-7.7935, lng:110.3670, status:'online',  rating:4.8, trips:198, phone:'+62811100003', currentZone:'Malioboro',        bikeBrand:'Yamaha NMAX',   plate:'AB 9012 GH', photo:'https://i.pravatar.cc/80?img=3' },
  { id:'d4',  name:'Wahyu Setiawan',    callsign:'INDOO 7745', type:'bike', lat:-7.8130, lng:110.3645, status:'busy',    rating:4.6, trips:427, phone:'+62811100004', currentZone:'Prawirotaman',     bikeBrand:'Honda Vario',   plate:'AB 3456 IJ', photo:'https://i.pravatar.cc/80?img=4' },
  { id:'d5',  name:'Doni Firmansyah',   callsign:'INDOO 5520', type:'bike', lat:-7.7710, lng:110.3780, status:'online',  rating:4.5, trips:89,  phone:'+62811100005', currentZone:'UGM Campus',       bikeBrand:'Suzuki Satria', plate:'AB 7890 KL', photo:'https://i.pravatar.cc/80?img=5' },
  { id:'d6',  name:'Hendra Wijaya',     callsign:'INDOO 9932', type:'car',  lat:-7.7720, lng:110.3770, status:'online',  rating:4.9, trips:673, phone:'+62811100006', currentZone:'UGM Campus',       bikeBrand:'Daihatsu Xenia', plate:'AB 2345 MN', photo:'https://i.pravatar.cc/80?img=6' },
  { id:'d7',  name:'Eko Purwanto',      callsign:'INDOO 6678', type:'bike', lat:-7.7700, lng:110.3790, status:'online',  rating:4.3, trips:156, phone:'+62811100007', currentZone:'UGM Campus',       bikeBrand:'Honda Scoopy',  plate:'AB 6789 OP', photo:'https://i.pravatar.cc/80?img=7' },
  { id:'d8',  name:'Fajar Nugroho',     callsign:'INDOO 2201', type:'bike', lat:-7.7715, lng:110.3785, status:'busy',    rating:4.8, trips:245, phone:'+62811100008', currentZone:'UGM Campus',       bikeBrand:'Yamaha Aerox',  plate:'AB 0123 QR', photo:'https://i.pravatar.cc/80?img=8' },
  { id:'d9',  name:'Gilang Ramadhan',   callsign:'INDOO 4412', type:'car',  lat:-7.7825, lng:110.3755, status:'online',  rating:4.7, trips:388, phone:'+62811100009', currentZone:'Kota Baru',        bikeBrand:'Honda Brio',    plate:'AB 4567 ST', photo:'https://i.pravatar.cc/80?img=9' },
  { id:'d10', name:'Hari Wibowo',       callsign:'INDOO 8890', type:'bike', lat:-7.7815, lng:110.3760, status:'online',  rating:4.4, trips:102, phone:'+62811100010', currentZone:'Kota Baru',        bikeBrand:'Honda Beat',    plate:'AB 8901 UV', photo:'https://i.pravatar.cc/80?img=10' },
  { id:'d11', name:'Irfan Hidayat',     callsign:'INDOO 1567', type:'bike', lat:-7.7895, lng:110.3610, status:'busy',    rating:4.6, trips:267, phone:'+62811100011', currentZone:'Tugu Station',     bikeBrand:'Yamaha MX King', plate:'AB 2345 WX', photo:'https://i.pravatar.cc/80?img=11' },
  { id:'d12', name:'Joko Susanto',      callsign:'INDOO 3345', type:'car',  lat:-7.7888, lng:110.3620, status:'online',  rating:4.8, trips:512, phone:'+62811100012', currentZone:'Tugu Station',     bikeBrand:'Toyota Calya',  plate:'AB 6789 YZ', photo:'https://i.pravatar.cc/80?img=12' },
  { id:'d13', name:'Kurniawan Adi',     callsign:'INDOO 7723', type:'bike', lat:-7.8115, lng:110.3585, status:'online',  rating:4.2, trips:78,  phone:'+62811100013', currentZone:'Alun-Alun Selatan', bikeBrand:'Honda Vario',  plate:'AB 0123 AB', photo:'https://i.pravatar.cc/80?img=13' },
  { id:'d14', name:'Lukman Hakim',      callsign:'INDOO 5501', type:'bike', lat:-7.7495, lng:110.3845, status:'online',  rating:4.7, trips:334, phone:'+62811100014', currentZone:'Jalan Kaliurang', bikeBrand:'Suzuki Nex',    plate:'AB 4567 CD', photo:'https://i.pravatar.cc/80?img=14' },
  { id:'d15', name:'Muhamad Rizki',     callsign:'INDOO 9988', type:'car',  lat:-7.7510, lng:110.3860, status:'online',  rating:4.9, trips:601, phone:'+62811100015', currentZone:'Jalan Kaliurang', bikeBrand:'Suzuki Ertiga', plate:'AB 8901 EF', photo:'https://i.pravatar.cc/80?img=15' },
  { id:'d16', name:'Nanda Pratama',     callsign:'INDOO 2278', type:'bike', lat:-7.7505, lng:110.3855, status:'online',  rating:4.5, trips:187, phone:'+62811100016', currentZone:'Jalan Kaliurang', bikeBrand:'Honda PCX',     plate:'AB 2345 GH', photo:'https://i.pravatar.cc/80?img=16' },
  { id:'d17', name:'Oscar Widodo',      callsign:'INDOO 6634', type:'bike', lat:-7.7490, lng:110.3840, status:'offline', rating:4.3, trips:56,  phone:'+62811100017', currentZone:'Jalan Kaliurang', bikeBrand:'Yamaha Mio',    plate:'AB 6789 IJ', photo:'https://i.pravatar.cc/80?img=17' },
  { id:'d18', name:'Pandu Saputra',     callsign:'INDOO 4456', type:'bike', lat:-7.7515, lng:110.3870, status:'online',  rating:4.6, trips:223, phone:'+62811100018', currentZone:'Jalan Kaliurang', bikeBrand:'Honda Genio',   plate:'AB 0123 KL', photo:'https://i.pravatar.cc/80?img=18' },
  { id:'d19', name:'Qomar Fahri',       callsign:'INDOO 8812', type:'car',  lat:-7.7555, lng:110.3955, status:'online',  rating:4.4, trips:145, phone:'+62811100019', currentZone:'Condongcatur',    bikeBrand:'Daihatsu Sigra', plate:'AB 4567 MN', photo:'https://i.pravatar.cc/80?img=19' },
  { id:'d20', name:'Rizal Maulana',     callsign:'INDOO 1145', type:'bike', lat:-7.7545, lng:110.3945, status:'online',  rating:4.8, trips:398, phone:'+62811100020', currentZone:'Condongcatur',    bikeBrand:'Yamaha NMAX',   plate:'AB 8901 OP', photo:'https://i.pravatar.cc/80?img=20' },
]

// ── Landmarks (30+) ─────────────────────────────────────────────────────────────
const LANDMARKS = [
  { id:'lm1',  name:'Boshe VVIP Club',          category:'nightclub',          lat:-7.7828, lng:110.3880, description:'Premier nightclub on Jl. Magelang' },
  { id:'lm2',  name:'Liquid Next Level',         category:'nightclub',          lat:-7.7660, lng:110.4095, description:'Seturan area nightclub & lounge' },
  { id:'lm3',  name:"Hugo's Cafe",               category:'nightclub',          lat:-7.8110, lng:110.3655, description:'Live music venue in Prawirotaman' },
  { id:'lm4',  name:'UGM (Universitas Gadjah Mada)', category:'university',     lat:-7.7713, lng:110.3776, description:'Top university in Yogyakarta' },
  { id:'lm5',  name:'UNY (Universitas Negeri Yogyakarta)', category:'university', lat:-7.7725, lng:110.3862, description:'State university, Karangmalang' },
  { id:'lm6',  name:'UII (Universitas Islam Indonesia)', category:'university',  lat:-7.7370, lng:110.4180, description:'Private Islamic university, Sleman' },
  { id:'lm7',  name:'Ambarukmo Plaza',           category:'mall',               lat:-7.7835, lng:110.4020, description:'Major shopping mall, Jl. Laksda Adisucipto' },
  { id:'lm8',  name:'Malioboro Mall',             category:'mall',               lat:-7.7932, lng:110.3648, description:'Shopping mall on Jl. Malioboro' },
  { id:'lm9',  name:'Hartono Mall',               category:'mall',               lat:-7.7475, lng:110.4050, description:'Large mall in northern Yogya' },
  { id:'lm10', name:'Jogja City Mall',            category:'mall',               lat:-7.7568, lng:110.3770, description:'Modern mall near Jakal' },
  { id:'lm11', name:'Pasar Beringharjo',          category:'market',             lat:-7.7978, lng:110.3656, description:'Historic traditional market on Malioboro' },
  { id:'lm12', name:'Pasar Kranggan',             category:'market',             lat:-7.7980, lng:110.3720, description:'Traditional market, Kota Baru area' },
  { id:'lm13', name:'Stasiun Tugu',               category:'station',            lat:-7.7891, lng:110.3614, description:'Main Yogyakarta railway station' },
  { id:'lm14', name:'Stasiun Lempuyangan',        category:'station',            lat:-7.7920, lng:110.3785, description:'Secondary railway station' },
  { id:'lm15', name:'Bandara Adisucipto',         category:'station',            lat:-7.7882, lng:110.4317, description:'Yogyakarta airport (domestic)' },
  { id:'lm16', name:'Kraton Yogyakarta',          category:'mosque',             lat:-7.8052, lng:110.3640, description:'Sultan palace & cultural center' },
  { id:'lm17', name:'Taman Sari Water Castle',    category:'park',               lat:-7.8100, lng:110.3592, description:'Historic royal garden' },
  { id:'lm18', name:'Masjid Agung Kauman',        category:'mosque',             lat:-7.8025, lng:110.3595, description:'Grand mosque near Kraton' },
  { id:'lm19', name:'Stadion Maguwoharjo',        category:'stadium',            lat:-7.7540, lng:110.4230, description:'Main football stadium, Sleman' },
  { id:'lm20', name:'Stadion Mandala Krida',      category:'stadium',            lat:-7.8015, lng:110.3840, description:'City center stadium' },
  { id:'lm21', name:'Jl. Prawirotaman Food Row',  category:'restaurant_cluster', lat:-7.8128, lng:110.3660, description:'Backpacker food & bar street' },
  { id:'lm22', name:'Jl. Kaliurang KM5 Food',     category:'restaurant_cluster', lat:-7.7600, lng:110.3850, description:'Student food stalls & cafes' },
  { id:'lm23', name:'Gudeg Yu Djum',              category:'restaurant_cluster', lat:-7.7830, lng:110.3750, description:'Iconic gudeg restaurant' },
  { id:'lm24', name:'Sheraton Mustika Hotel',      category:'hotel_area',         lat:-7.7830, lng:110.4060, description:'5-star hotel, Adisucipto area' },
  { id:'lm25', name:'Hyatt Regency Yogyakarta',   category:'hotel_area',         lat:-7.7628, lng:110.3945, description:'Luxury hotel, north Yogya' },
  { id:'lm26', name:'Hotel Tentrem',              category:'hotel_area',         lat:-7.7845, lng:110.3690, description:'Premium hotel, city center' },
  { id:'lm27', name:'Phoenix Hotel',              category:'hotel_area',         lat:-7.7920, lng:110.3640, description:'Heritage hotel on Malioboro' },
  { id:'lm28', name:'Taman Pintar',               category:'park',               lat:-7.8002, lng:110.3660, description:'Science park for families' },
  { id:'lm29', name:'Kebun Binatang Gembira Loka', category:'park',              lat:-7.8050, lng:110.3950, description:'Yogyakarta zoo' },
  { id:'lm30', name:'Seturan Entertainment Strip', category:'nightclub',         lat:-7.7655, lng:110.4110, description:'Bars and clubs in Seturan' },
  { id:'lm31', name:'UPN Veteran Yogyakarta',     category:'university',         lat:-7.7635, lng:110.4090, description:'Veterans university, Seturan' },
  { id:'lm32', name:'STIE YKPN',                  category:'university',         lat:-7.7565, lng:110.4020, description:'Business school, Seturan area' },
]

// ── Demo Bookings (8 active) ────────────────────────────────────────────────────
const DEMO_BOOKINGS = [
  { id:'bk1', customerName:'Rina Sari',       lat:-7.7928, lng:110.3665, type:'bike', destination:'Pasar Beringharjo',  waiting:'3m',  photo:'https://i.pravatar.cc/80?img=21' },
  { id:'bk2', customerName:'Andika Putra',    lat:-7.8118, lng:110.3648, type:'bike', destination:'Hotel Tentrem',      waiting:'7m',  photo:'https://i.pravatar.cc/80?img=22' },
  { id:'bk3', customerName:'Dewi Kusuma',     lat:-7.7895, lng:110.3608, type:'car',  destination:'Ambarukmo Plaza',    waiting:'2m',  photo:'https://i.pravatar.cc/80?img=23' },
  { id:'bk4', customerName:'Bagus Wicaksono', lat:-7.7940, lng:110.3660, type:'bike', destination:'UGM Campus',         waiting:'5m',  photo:'https://i.pravatar.cc/80?img=24' },
  { id:'bk5', customerName:'Citra Ayu',       lat:-7.7660, lng:110.4105, type:'bike', destination:'Hartono Mall',       waiting:'9m',  photo:'https://i.pravatar.cc/80?img=25' },
  { id:'bk6', customerName:'Eka Pratiwi',     lat:-7.7645, lng:110.4098, type:'car',  destination:'Tugu Station',       waiting:'11m', photo:'https://i.pravatar.cc/80?img=26' },
  { id:'bk7', customerName:'Faisal Rahman',   lat:-7.8125, lng:110.3575, type:'bike', destination:'Prawirotaman',       waiting:'4m',  photo:'https://i.pravatar.cc/80?img=27' },
  { id:'bk8', customerName:'Gita Permata',    lat:-7.7838, lng:110.4025, type:'car',  destination:'Bandara Adisucipto', waiting:'1m',  photo:'https://i.pravatar.cc/80?img=28' },
]

// ── Demo Nudges ─────────────────────────────────────────────────────────────────
const DEMO_NUDGES = [
  { id:'n1', time:'2 min ago',  target:'Lukman Hakim',        message:'Prawirotaman is surging, head south for priority dispatch.', status:'delivered' },
  { id:'n2', time:'8 min ago',  target:'Zone: Seturan',       message:'5 orders waiting, 0 drivers! Rebalance needed urgently.',    status:'delivered' },
  { id:'n3', time:'15 min ago', target:'Nanda Pratama',       message:'Your zone is quiet. Jl. Malioboro has high activity.',       status:'read' },
  { id:'n4', time:'32 min ago', target:'Zone: Jalan Kaliurang', message:'Event tonight at Boshe VVIP, expect high demand.',         status:'read' },
  { id:'n5', time:'1 hr ago',   target:'Rizal Maulana',       message:'Condongcatur is dead. Move to Seturan for orders.',          status:'delivered' },
]

const NUDGE_TEMPLATES = [
  'Area {zone} is busy, move closer for priority dispatch.',
  'Your zone is quiet. {zone} has activity — head there now.',
  'Event tonight at {place}, expect high demand after 9 PM.',
  'Surge pricing active in {zone}. Higher earnings available.',
  'Low driver coverage in {zone}. Be the first to claim orders.',
]

// ── Helpers ─────────────────────────────────────────────────────────────────────
function drift(base, amount = 0.001) {
  return base + (Math.random() - 0.5) * amount
}

const ZONE_COLORS = {
  surge:  { fill: '#FF4444', fillOpacity: 0.12, border: '#FF4444' },
  busy:   { fill: '#FFB800', fillOpacity: 0.10, border: '#FFB800' },
  normal: { fill: '#00FF9D', fillOpacity: 0.06, border: '#00FF9D' },
  low:    { fill: '#888888', fillOpacity: 0.04, border: '#888888' },
  dead:   { fill: '#444444', fillOpacity: 0.03, border: '#555555' },
}

const LANDMARK_ICONS = {
  nightclub: '\uD83C\uDFB5',
  university: '\uD83C\uDF93',
  mall: '\uD83C\uDFEC',
  market: '\uD83D\uDED2',
  station: '\uD83D\uDE82',
  hotel_area: '\uD83C\uDFE8',
  mosque: '\uD83D\uDD4C',
  park: '\uD83C\uDF33',
  stadium: '\u26BD',
  restaurant_cluster: '\uD83C\uDF7D',
}

const DEMAND_ORDER = ['surge', 'busy', 'normal', 'low', 'dead']

function sortedZones() {
  return [...ZONES].sort((a, b) => DEMAND_ORDER.indexOf(a.demandLevel) - DEMAND_ORDER.indexOf(b.demandLevel))
}

// ═════════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════════════════════════
export default function FleetIntelTab() {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const leafletRef = useRef(null)
  const markersRef = useRef({})
  const zoneCirclesRef = useRef([])
  const landmarkMarkersRef = useRef([])

  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)
  const [drivers, setDrivers] = useState(DEMO_DRIVERS)
  const [filters, setFilters] = useState({ bikes: true, cars: true, bookings: true, zones: true, landmarks: false })
  const [panelTab, setPanelTab] = useState('drivers')   // drivers | zones | nudge
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [showDriverModal, setShowDriverModal] = useState(null) // driver object or null
  const [nudgeTarget, setNudgeTarget] = useState('')
  const [nudgeMessage, setNudgeMessage] = useState('')
  const [nudges, setNudges] = useState(DEMO_NUDGES)
  const [showOffline, setShowOffline] = useState(false)

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalOnline = drivers.filter(d => d.status === 'online').length
  const totalBusy = drivers.filter(d => d.status === 'busy').length
  const activeOrders = DEMO_BOOKINGS.length
  const surgeZones = ZONES.filter(z => z.demandLevel === 'surge').length

  // ── Popup builders ──────────────────────────────────────────────────────────
  const driverPopupHtml = (d) => `
    <div style="font-family:system-ui;min-width:220px;color:#fff;background:#0d0d1a;border-radius:10px;overflow:hidden;">
      <div style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;gap:10px;">
        <img src="${d.photo}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid ${d.status === 'online' ? '#00FF9D' : d.status === 'busy' ? '#8B0000' : '#666'}" />
        <div>
          <div style="font-weight:800;font-size:14px">${d.type === 'bike' ? '\uD83C\uDFCD' : '\uD83D\uDE97'} ${d.name}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.5)">${d.callsign}</div>
        </div>
      </div>
      <div style="padding:10px 14px;font-size:12px;color:rgba(255,255,255,0.6);line-height:2">
        <span style="color:${d.status === 'online' ? '#00FF9D' : d.status === 'busy' ? '#FF4444' : '#666'};font-weight:700;text-transform:uppercase">${d.status}</span><br/>
        \u2B50 ${d.rating} &nbsp;\u00B7&nbsp; ${d.trips} trips<br/>
        \uD83D\uDE97 ${d.bikeBrand} &nbsp;\u00B7&nbsp; ${d.plate}<br/>
        \uD83D\uDCCD ${d.currentZone}<br/>
        \uD83D\uDCDE ${d.phone}
      </div>
      <div style="padding:8px 14px 12px;border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:6px">
        <button onclick="window.__fleetIntel_viewProfile && window.__fleetIntel_viewProfile('${d.id}')"
          style="flex:1;padding:7px 0;border:1px solid rgba(0,255,157,0.3);background:rgba(0,255,157,0.08);color:#00FF9D;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer">
          View Profile
        </button>
        <button style="flex:1;padding:7px 0;border:1px solid rgba(0,200,255,0.3);background:rgba(0,200,255,0.08);color:#00C8FF;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer">
          Send Message
        </button>
      </div>
    </div>`

  const bookingPopupHtml = (b) => `
    <div style="font-family:system-ui;min-width:210px;color:#fff;background:#0d0d1a;border-radius:10px;overflow:hidden;">
      <div style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;gap:10px;">
        <img src="${b.photo}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #FF4444" />
        <div>
          <div style="font-weight:800;font-size:14px">${b.customerName}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.5)">${b.type === 'bike' ? '\uD83C\uDFCD Bike' : '\uD83D\uDE97 Car'} booking</div>
        </div>
      </div>
      <div style="padding:10px 14px;font-size:12px;color:rgba(255,255,255,0.7);line-height:1.9">
        \u27A1 <b>${b.destination}</b><br/>
        \u23F1 Waiting: <span style="color:#FF4444;font-weight:700">${b.waiting}</span>
      </div>
    </div>`

  const zonePopupHtml = (z) => {
    const color = ZONE_COLORS[z.demandLevel]?.fill || '#888'
    return `
    <div style="font-family:system-ui;min-width:180px;color:#fff;background:#0d0d1a;border-radius:10px;overflow:hidden;">
      <div style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.08)">
        <div style="font-weight:800;font-size:14px">${z.name}</div>
        <span style="display:inline-block;margin-top:4px;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:700;
          background:${color}20;color:${color};border:1px solid ${color}40;text-transform:uppercase">${z.demandLevel}</span>
      </div>
      <div style="padding:10px 14px;font-size:12px;color:rgba(255,255,255,0.6);line-height:2">
        \uD83D\uDE97 Drivers: <b style="color:#fff">${z.driverCount}</b><br/>
        \uD83D\uDCE6 Orders: <b style="color:#fff">${z.orderCount}</b><br/>
        \u23F1 Avg Wait: <b style="color:#fff">${z.avgWait}</b><br/>
        Type: ${z.type}
      </div>
    </div>`
  }

  // ── Global callback for popup "View Profile" buttons ────────────────────────
  useEffect(() => {
    window.__fleetIntel_viewProfile = (driverId) => {
      const d = DEMO_DRIVERS.find(dr => dr.id === driverId)
      if (d) setShowDriverModal(d)
    }
    return () => { delete window.__fleetIntel_viewProfile }
  }, [])

  // ── Build map ───────────────────────────────────────────────────────────────
  const buildMap = useCallback((L) => {
    if (mapInstance.current) return

    const map = L.map(mapRef.current, {
      center: [-7.7900, 110.3850],
      zoom: 13,
      zoomControl: true,
    })

    L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
      { attribution: '\u00A9 Mapbox \u00A9 OpenStreetMap', tileSize: 512, zoomOffset: -1, maxZoom: 19 }
    ).addTo(map)

    // Zone circles
    ZONES.forEach(z => {
      const style = ZONE_COLORS[z.demandLevel] || ZONE_COLORS.normal
      const circle = L.circle([z.lat, z.lng], {
        radius: z.radius * 1000,
        fillColor: style.fill,
        fillOpacity: style.fillOpacity,
        color: style.border,
        weight: 1.5,
        opacity: 0.5,
      })
        .bindPopup(zonePopupHtml(z), { className: 'dark-popup', maxWidth: 260 })
        .addTo(map)
      zoneCirclesRef.current.push(circle)
    })

    // Driver marker helper
    const makeDriverIcon = (d) => {
      const isOnline = d.status === 'online'
      const isBusy = d.status === 'busy'
      const color = isOnline ? '#00FF9D' : isBusy ? '#8B0000' : '#666'
      const pulse = isOnline
      return L.divIcon({
        html: `<div style="
          width:18px;height:18px;border-radius:50%;
          background:${color};
          border:2px solid rgba(255,255,255,0.6);
          box-shadow:0 0 8px ${color}88;
          ${pulse ? 'animation:pulseGreen 1.6s ease-in-out infinite;' : ''}
        "></div>`,
        className: '',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })
    }

    // Driver markers
    DEMO_DRIVERS.forEach(d => {
      if (d.status === 'offline') return
      const icon = makeDriverIcon(d)
      const marker = L.marker([d.lat, d.lng], { icon })
        .bindPopup(driverPopupHtml(d), { className: 'dark-popup', maxWidth: 280 })
        .addTo(map)
      markersRef.current[d.id] = { marker, type: 'driver', data: d }
    })

    // Booking markers — red pulsing
    DEMO_BOOKINGS.forEach(b => {
      const icon = L.divIcon({
        html: `<div style="
          width:14px;height:14px;border-radius:50%;
          background:#FF4444;
          border:2px solid rgba(255,255,255,0.7);
          box-shadow:0 0 10px rgba(255,68,68,0.7);
          animation:pulseRed 1.4s ease-in-out infinite;
        "></div>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
      const marker = L.marker([b.lat, b.lng], { icon })
        .bindPopup(bookingPopupHtml(b), { className: 'dark-popup', maxWidth: 260 })
        .addTo(map)
      markersRef.current[b.id] = { marker, type: 'booking', data: b }
    })

    // Landmark markers (hidden by default, added to refs)
    LANDMARKS.forEach(lm => {
      const emoji = LANDMARK_ICONS[lm.category] || '\uD83D\uDCCD'
      const icon = L.divIcon({
        html: `<div style="
          font-size:14px;width:22px;height:22px;
          display:flex;align-items:center;justify-content:center;
          background:rgba(30,30,50,0.85);border-radius:50%;
          border:1px solid rgba(255,255,255,0.15);
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
        ">${emoji}</div>`,
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      })
      const marker = L.marker([lm.lat, lm.lng], { icon })
        .bindPopup(`
          <div style="font-family:system-ui;min-width:160px;color:#fff;background:#0d0d1a;border-radius:8px;padding:10px 14px;">
            <div style="font-size:13px;font-weight:700">${emoji} ${lm.name}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:4px">${lm.description}</div>
          </div>
        `, { className: 'dark-popup', maxWidth: 220 })
      // NOT added to map by default
      landmarkMarkersRef.current.push(marker)
    })

    mapInstance.current = map
    leafletRef.current = L
    setLoaded(true)
  }, [])

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!MAPBOX_TOKEN) { setError('Mapbox token not set (VITE_MAPBOX_TOKEN)'); return }
    if (mapInstance.current) return

    // Ensure leaflet CSS is loaded
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    import('leaflet').then(mod => buildMap(mod.default)).catch(e => setError('Failed to load map: ' + e.message))

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null }
    }
  }, [buildMap])

  // ── Driver drift every 5s ──────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      setDrivers(prev => prev.map(d => {
        if (d.status === 'offline') return d
        const updated = { ...d, lat: drift(d.lat, 0.0012), lng: drift(d.lng, 0.0012) }
        const entry = markersRef.current[d.id]
        if (entry && mapInstance.current) {
          entry.marker.setLatLng([updated.lat, updated.lng])
        }
        return updated
      }))
    }, 5000)
    return () => clearInterval(t)
  }, [])

  // ── Filter visibility ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current) return
    const map = mapInstance.current

    // Driver & booking markers
    Object.entries(markersRef.current).forEach(([, entry]) => {
      let show = false
      if (entry.type === 'driver' && entry.data.type === 'bike') show = filters.bikes
      else if (entry.type === 'driver' && entry.data.type === 'car') show = filters.cars
      else if (entry.type === 'booking') show = filters.bookings

      if (show) { if (!map.hasLayer(entry.marker)) entry.marker.addTo(map) }
      else { if (map.hasLayer(entry.marker)) map.removeLayer(entry.marker) }
    })

    // Zone circles
    zoneCirclesRef.current.forEach(c => {
      if (filters.zones) { if (!map.hasLayer(c)) c.addTo(map) }
      else { if (map.hasLayer(c)) map.removeLayer(c) }
    })

    // Landmark markers
    landmarkMarkersRef.current.forEach(m => {
      if (filters.landmarks) { if (!map.hasLayer(m)) m.addTo(map) }
      else { if (map.hasLayer(m)) map.removeLayer(m) }
    })
  }, [filters])

  // ── Zoom to driver ─────────────────────────────────────────────────────────
  const zoomToDriver = (d) => {
    const entry = markersRef.current[d.id]
    if (entry && mapInstance.current) {
      mapInstance.current.setView([d.lat, d.lng], 16)
      entry.marker.openPopup()
    }
    setSelectedDriver(d.id)
  }

  // ── Send nudge ─────────────────────────────────────────────────────────────
  const sendNudge = () => {
    if (!nudgeTarget.trim() || !nudgeMessage.trim()) return
    const newNudge = {
      id: 'n' + Date.now(),
      time: 'just now',
      target: nudgeTarget,
      message: nudgeMessage,
      status: 'sent',
    }
    setNudges(prev => [newNudge, ...prev])
    setNudgeTarget('')
    setNudgeMessage('')
  }

  // ── Imbalance alerts ──────────────────────────────────────────────────────
  const imbalancedZones = ZONES.filter(z =>
    z.orderCount > 0 && z.driverCount === 0
  )

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) return (
    <div className={styles.errorState}>
      <span className={styles.errorIcon}>{'\uD83D\uDDFA\uFE0F'}</span>
      <p className={styles.errorTitle}>Map unavailable</p>
      <p className={styles.errorDesc}>{error}</p>
      <code className={styles.errorCode}>Add VITE_MAPBOX_TOKEN to .env</code>
    </div>
  )

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div className={styles.page}>
      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div className={styles.filterBar}>
        <span className={styles.filterTitle}>Fleet Intelligence &mdash; Yogyakarta</span>

        <div className={styles.filters}>
          {[
            { key: 'bikes', label: '\uD83C\uDFCD Bikes', color: '#00FF9D' },
            { key: 'cars', label: '\uD83D\uDE97 Cars', color: '#00C8FF' },
            { key: 'bookings', label: '\uD83D\uDD34 Bookings', color: '#FF4444' },
            { key: 'zones', label: '\uD83D\uDFE2 Zones', color: '#FFB800' },
            { key: 'landmarks', label: '\uD83D\uDCCD Landmarks', color: '#A78BFA' },
          ].map(f => (
            <button
              key={f.key}
              className={`${styles.filterChip} ${filters[f.key] ? styles.filterChipOn : ''}`}
              style={filters[f.key] ? { borderColor: f.color + '60', background: f.color + '15', color: f.color } : {}}
              onClick={() => setFilters(p => ({ ...p, [f.key]: !p[f.key] }))}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className={styles.statsPills}>
          <span className={styles.statPill}><span className={styles.statDot} style={{ background: '#00FF9D' }} />{totalOnline} Online</span>
          <span className={styles.statPill}><span className={styles.statDot} style={{ background: '#8B0000' }} />{totalBusy} Busy</span>
          <span className={styles.statPill}><span className={styles.statDot} style={{ background: '#FF4444' }} />{activeOrders} Orders</span>
          <span className={styles.statPill} style={{ color: surgeZones > 0 ? '#FF4444' : undefined }}><span className={styles.statDot} style={{ background: '#FF4444' }} />{surgeZones} Surge</span>
        </div>

        <div className={styles.livePill}><span className={styles.liveDot} />LIVE</div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className={styles.mapRow}>
        {/* Map */}
        <div className={styles.mapWrap}>
          {!loaded && (
            <div className={styles.loadingOverlay}>
              <span className={styles.loadingSpinner} />
              <span className={styles.loadingText}>Loading Yogyakarta map...</span>
            </div>
          )}
          <div ref={mapRef} className={styles.map} />

          {/* Inject keyframes & dark popup styles */}
          <style>{`
            @keyframes pulseGreen {
              0%   { box-shadow: 0 0 0 0 rgba(0,255,157,0.7), 0 0 8px rgba(0,255,157,0.5); }
              70%  { box-shadow: 0 0 0 8px rgba(0,255,157,0), 0 0 8px rgba(0,255,157,0.5); }
              100% { box-shadow: 0 0 0 0 rgba(0,255,157,0), 0 0 8px rgba(0,255,157,0.5); }
            }
            @keyframes pulseRed {
              0%   { box-shadow: 0 0 0 0 rgba(255,68,68,0.7), 0 0 10px rgba(255,68,68,0.6); }
              70%  { box-shadow: 0 0 0 10px rgba(255,68,68,0), 0 0 10px rgba(255,68,68,0.6); }
              100% { box-shadow: 0 0 0 0 rgba(255,68,68,0), 0 0 10px rgba(255,68,68,0.6); }
            }
            .dark-popup .leaflet-popup-content-wrapper,
            .dark-popup .leaflet-popup-tip {
              background: #0d0d1a !important;
              border: 1px solid rgba(255,255,255,0.1) !important;
              box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
              padding: 0 !important;
              border-radius: 10px !important;
            }
            .dark-popup .leaflet-popup-content { margin: 0 !important; }
            .dark-popup .leaflet-popup-close-button {
              color: rgba(255,255,255,0.4) !important;
              font-size: 18px !important;
              right: 8px !important;
              top: 6px !important;
            }
          `}</style>
        </div>

        {/* ── Side Panel (340px) ──────────────────────────────────────────── */}
        <div className={styles.sidePanel}>
          {/* Panel tabs */}
          <div className={styles.panelTabs}>
            {[
              { key: 'drivers', label: 'Drivers' },
              { key: 'zones', label: 'Zones' },
              { key: 'nudge', label: 'Nudge Center' },
            ].map(t => (
              <button
                key={t.key}
                className={`${styles.panelTabBtn} ${panelTab === t.key ? styles.panelTabActive : ''}`}
                onClick={() => setPanelTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ─── Tab 1: Drivers ──────────────────────────────────────────── */}
          {panelTab === 'drivers' && (
            <div className={styles.panelContent}>
              <div className={styles.panelSubHeader}>
                <span>{drivers.filter(d => d.status !== 'offline').length} active drivers</span>
                <label className={styles.offlineToggle}>
                  <input
                    type="checkbox"
                    checked={showOffline}
                    onChange={() => setShowOffline(v => !v)}
                  />
                  Show offline
                </label>
              </div>
              <div className={styles.driverList}>
                {drivers
                  .filter(d => showOffline || d.status !== 'offline')
                  .map(d => {
                    const isQuiet = ZONES.find(z => z.name === d.currentZone)
                    const zoneIsQuiet = isQuiet && (isQuiet.demandLevel === 'low' || isQuiet.demandLevel === 'dead')
                    const showNudge = d.status === 'online' && zoneIsQuiet
                    return (
                      <div
                        key={d.id}
                        className={`${styles.driverRow} ${selectedDriver === d.id ? styles.driverRowActive : ''}`}
                        onClick={() => zoomToDriver(d)}
                      >
                        <span
                          className={styles.statusDot}
                          style={{
                            background: d.status === 'online' ? '#00FF9D' : d.status === 'busy' ? '#8B0000' : '#666',
                            boxShadow: `0 0 6px ${d.status === 'online' ? '#00FF9D' : d.status === 'busy' ? '#8B0000' : '#666'}`,
                          }}
                        />
                        <div className={styles.driverInfo}>
                          <span
                            className={styles.driverName}
                            onClick={(e) => { e.stopPropagation(); setShowDriverModal(d) }}
                            title="View profile"
                          >
                            {d.name}
                          </span>
                          <span className={styles.driverSub}>{d.callsign} &middot; {d.currentZone}</span>
                          <span className={styles.driverSub2}>{'\u2B50'} {d.rating} &middot; {d.trips} trips</span>
                        </div>
                        {showNudge && (
                          <button
                            className={styles.nudgeBtn}
                            onClick={(e) => {
                              e.stopPropagation()
                              setPanelTab('nudge')
                              setNudgeTarget(d.name)
                              setNudgeMessage(`Your zone (${d.currentZone}) is quiet. Nearby busy areas need drivers.`)
                            }}
                            title="Send nudge"
                          >
                            Nudge
                          </button>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* ─── Tab 2: Zones ────────────────────────────────────────────── */}
          {panelTab === 'zones' && (
            <div className={styles.panelContent}>
              {/* Imbalance alerts */}
              {imbalancedZones.length > 0 && (
                <div className={styles.alertSection}>
                  {imbalancedZones.map(z => (
                    <div key={z.id} className={styles.alertItem}>
                      <span className={styles.alertIcon}>{'\u26A0\uFE0F'}</span>
                      <span className={styles.alertText}>
                        {z.name}: {z.orderCount} order{z.orderCount > 1 ? 's' : ''}, 0 drivers
                      </span>
                      <button
                        className={styles.rebalanceBtn}
                        onClick={() => {
                          setPanelTab('nudge')
                          setNudgeTarget(`Zone: ${z.name}`)
                          setNudgeMessage(`${z.name} has ${z.orderCount} waiting orders and no drivers. Rebalance needed!`)
                        }}
                      >
                        Rebalance
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.zoneList}>
                {sortedZones().map(z => {
                  const color = ZONE_COLORS[z.demandLevel]?.fill || '#888'
                  return (
                    <div
                      key={z.id}
                      className={styles.zoneRow}
                      onClick={() => {
                        if (mapInstance.current) mapInstance.current.setView([z.lat, z.lng], 15)
                      }}
                    >
                      <div className={styles.zoneHeader}>
                        <span className={styles.zoneName}>{z.name}</span>
                        <span
                          className={styles.demandBadge}
                          style={{ background: color + '20', color, borderColor: color + '40' }}
                        >
                          {z.demandLevel}
                        </span>
                      </div>
                      <div className={styles.zoneMeta}>
                        <span>{'\uD83D\uDE97'} {z.driverCount} drivers</span>
                        <span>{'\uD83D\uDCE6'} {z.orderCount} orders</span>
                        <span>{'\u23F1'} {z.avgWait}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── Tab 3: Nudge Center ─────────────────────────────────────── */}
          {panelTab === 'nudge' && (
            <div className={styles.panelContent}>
              <div className={styles.nudgeComposer}>
                <label className={styles.nudgeLabel}>To:</label>
                <select
                  className={styles.nudgeSelect}
                  value={nudgeTarget}
                  onChange={(e) => setNudgeTarget(e.target.value)}
                >
                  <option value="">Select target...</option>
                  <optgroup label="Drivers">
                    {DEMO_DRIVERS.filter(d => d.status !== 'offline').map(d => (
                      <option key={d.id} value={d.name}>{d.name} ({d.callsign})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Zones">
                    {ZONES.map(z => (
                      <option key={z.id} value={`Zone: ${z.name}`}>{z.name} zone ({z.driverCount} drivers)</option>
                    ))}
                  </optgroup>
                </select>

                <label className={styles.nudgeLabel}>Message:</label>
                <textarea
                  className={styles.nudgeTextarea}
                  value={nudgeMessage}
                  onChange={(e) => setNudgeMessage(e.target.value)}
                  placeholder="Type your nudge message..."
                  rows={3}
                />

                <div className={styles.nudgeTemplates}>
                  <span className={styles.nudgeTemplateLabel}>Quick:</span>
                  {NUDGE_TEMPLATES.map((t, i) => (
                    <button
                      key={i}
                      className={styles.templateChip}
                      onClick={() => setNudgeMessage(t)}
                      title={t}
                    >
                      {t.slice(0, 35)}...
                    </button>
                  ))}
                </div>

                <button
                  className={styles.sendNudgeBtn}
                  onClick={sendNudge}
                  disabled={!nudgeTarget || !nudgeMessage}
                >
                  Send Nudge
                </button>
              </div>

              <div className={styles.nudgeLog}>
                <div className={styles.nudgeLogTitle}>Recent Nudges</div>
                {nudges.map(n => (
                  <div key={n.id} className={styles.nudgeItem}>
                    <div className={styles.nudgeItemHeader}>
                      <span className={styles.nudgeItemTarget}>{n.target}</span>
                      <span className={styles.nudgeItemTime}>{n.time}</span>
                    </div>
                    <div className={styles.nudgeItemMsg}>{n.message}</div>
                    <span
                      className={styles.nudgeItemStatus}
                      style={{ color: n.status === 'sent' ? '#FFB800' : n.status === 'delivered' ? '#00FF9D' : '#00C8FF' }}
                    >
                      {n.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Legend (bottom bar) ───────────────────────────────────────────── */}
      <div className={styles.legend}>
        <div className={styles.legendGroup}>
          <span className={styles.legendGroupTitle}>Zones</span>
          {Object.entries(ZONE_COLORS).map(([level, c]) => (
            <div key={level} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: c.fill, boxShadow: `0 0 4px ${c.fill}` }} />
              <span className={styles.legendLabel}>{level}</span>
            </div>
          ))}
        </div>
        <div className={styles.legendGroup}>
          <span className={styles.legendGroupTitle}>Drivers</span>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#00FF9D', boxShadow: '0 0 6px #00FF9D' }} />
            <span className={styles.legendLabel}>Online (idle)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#8B0000', boxShadow: '0 0 6px #8B0000' }} />
            <span className={styles.legendLabel}>Busy (delivering)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#666', boxShadow: '0 0 4px #666' }} />
            <span className={styles.legendLabel}>Offline</span>
          </div>
        </div>
        <div className={styles.legendGroup}>
          <span className={styles.legendGroupTitle}>Other</span>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#FF4444', boxShadow: '0 0 6px #FF4444' }} />
            <span className={styles.legendLabel}>Active booking</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendLabel} style={{ fontSize: 13 }}>
              {'\uD83C\uDFB5 \uD83C\uDF93 \uD83C\uDFEC \uD83D\uDED2 \uD83D\uDE82 \uD83C\uDFE8 \uD83D\uDD4C \uD83C\uDF33 \u26BD \uD83C\uDF7D'}
            </span>
            <span className={styles.legendLabel}>Landmarks</span>
          </div>
        </div>
      </div>

      {/* ── Driver Profile Modal ─────────────────────────────────────────── */}
      {showDriverModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDriverModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowDriverModal(null)}>{'\u2715'}</button>

            <div className={styles.modalHeader}>
              <img src={showDriverModal.photo} className={styles.modalPhoto} alt="" />
              <div>
                <div className={styles.modalName}>{showDriverModal.name}</div>
                <div className={styles.modalCallsign}>{showDriverModal.callsign}</div>
                <span
                  className={styles.modalStatusBadge}
                  style={{
                    background: showDriverModal.status === 'online' ? 'rgba(0,255,157,0.12)' : showDriverModal.status === 'busy' ? 'rgba(139,0,0,0.15)' : 'rgba(100,100,100,0.15)',
                    color: showDriverModal.status === 'online' ? '#00FF9D' : showDriverModal.status === 'busy' ? '#FF4444' : '#888',
                    borderColor: showDriverModal.status === 'online' ? '#00FF9D40' : showDriverModal.status === 'busy' ? '#FF444440' : '#88888840',
                  }}
                >
                  {showDriverModal.status}
                </span>
              </div>
            </div>

            <div className={styles.modalGrid}>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Rating</span>
                <span className={styles.modalStatVal}>{'\u2B50'} {showDriverModal.rating}</span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Total Trips</span>
                <span className={styles.modalStatVal}>{showDriverModal.trips}</span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Phone</span>
                <span className={styles.modalStatVal}>{showDriverModal.phone}</span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Vehicle</span>
                <span className={styles.modalStatVal}>{showDriverModal.bikeBrand}</span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Plate</span>
                <span className={styles.modalStatVal}>{showDriverModal.plate}</span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Current Zone</span>
                <span className={styles.modalStatVal}>{showDriverModal.currentZone}</span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Online Since</span>
                <span className={styles.modalStatVal}>08:32 AM</span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Today Earnings</span>
                <span className={styles.modalStatVal}>Rp {(Math.floor(Math.random() * 150 + 50) * 1000).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className={styles.modalSection}>
              <div className={styles.modalSectionTitle}>Recent Deliveries</div>
              {[
                { time: '10 min ago', from: 'Warung Padang, Malioboro', to: 'Jl. Solo Km 8', amount: 'Rp 18.000' },
                { time: '45 min ago', from: 'Gudeg Yu Djum', to: 'UGM Sekip', amount: 'Rp 12.000' },
                { time: '1.5 hr ago', from: 'KFC Kaliurang', to: 'Condongcatur', amount: 'Rp 22.000' },
              ].map((del, i) => (
                <div key={i} className={styles.deliveryItem}>
                  <span className={styles.deliveryTime}>{del.time}</span>
                  <span className={styles.deliveryRoute}>{del.from} {'\u2192'} {del.to}</span>
                  <span className={styles.deliveryAmount}>{del.amount}</span>
                </div>
              ))}
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.modalActionBtn}
                style={{ background: 'rgba(0,200,255,0.1)', borderColor: '#00C8FF40', color: '#00C8FF' }}
                onClick={() => {
                  setPanelTab('nudge')
                  setNudgeTarget(showDriverModal.name)
                  setShowDriverModal(null)
                }}
              >
                Send Message
              </button>
              <button
                className={styles.modalActionBtn}
                style={{ background: 'rgba(255,68,68,0.1)', borderColor: '#FF444440', color: '#FF4444' }}
              >
                Deactivate
              </button>
              <button
                className={styles.modalActionBtn}
                style={{ background: 'rgba(255,184,0,0.1)', borderColor: '#FFB80040', color: '#FFB800' }}
              >
                View History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
