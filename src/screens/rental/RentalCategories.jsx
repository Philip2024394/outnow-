import { useState } from 'react'
import styles from '../RentalSearchScreen.module.css'

const CATEGORY_TILES = [
  { id: 'Vehicles',      label: 'Vehicles',       img: 'https://ik.imagekit.io/nepgaxllc/bbbc-removebg-preview.png', desc: 'Cars, Motorcycles & Trucks', filter: ['Cars', 'Motorcycles'], bg: 'https://ik.imagekit.io/nepgaxllc/Scooter%20ride%20to%20the%20rental%20lot.png?updatedAt=1776105148434', tagline: 'Find your perfect ride' },
  { id: 'Property',      label: 'Property',       img: 'https://ik.imagekit.io/nepgaxllc/bbbcd-removebg-preview.png', desc: 'Villas, Kos & Rooms',   filter: ['Property'], bg: null, tagline: 'Stay anywhere you want' },
  { id: 'Fashion',       label: 'Fashion',        img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2020,%202026,%2007_01_55%20AM.png', desc: 'Kebaya, Suits & More',   filter: ['Fashion'], bg: null, tagline: 'Dress for every occasion' },
  { id: 'Electronics',   label: 'Electronics',    img: 'https://ik.imagekit.io/nepgaxllc/bbbcddddgf-removebg-preview.png', desc: 'Cameras, Laptops & Gear',filter: ['Electronics'], bg: null, tagline: 'Gear up without buying' },
  { id: 'Audio & Sound', label: 'Audio & Sound',  img: 'https://ik.imagekit.io/nepgaxllc/bbbcdddd-removebg-preview.png', desc: 'Speakers, DJ & PA',      filter: ['Audio & Sound'], bg: null, tagline: 'Sound for every event' },
  { id: 'Party & Event', label: 'Party & Event',  img: 'https://ik.imagekit.io/nepgaxllc/bbbcddd-removebg-preview.png', desc: 'Tents, Decor & Catering',filter: ['Party & Event'], bg: null, tagline: 'Make your event perfect' },
]

export { CATEGORY_TILES }

export default function RentalCategories({ onSelect, onBack, onDashboard }) {
  const [selectedId, setSelectedId] = useState(null)
  const handleSelect = (c) => {
    setSelectedId(c.id)
    setTimeout(() => onSelect(c), 2000)
  }
  return (
    <div className={styles.catPage}>
      <div className={styles.catHeader}>
        <div>
          <h1 className={styles.catHeroTitle}><span style={{ background: 'linear-gradient(90deg, #fff 0%, #fff 58%, #8DC63F 58%, #8DC63F 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>INDOO</span> DONE DEAL</h1>
          <p className={styles.catHeroSub}>Rentals & Sales across Indonesia</p>
        </div>
        <button onClick={onBack} style={{ width:36, height:36, borderRadius:'50%', background:'#8DC63F', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 10px rgba(0,0,0,0.3)', flexShrink:0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      </div>
      <div className={styles.catGrid}>
        {[
          { ...CATEGORY_TILES[0], icon: null, heroImg: 'https://ik.imagekit.io/nepgaxllc/bbbc-removebg-preview.png', accent: '#8DC63F', count: '2,400+', rating: 4.8, descOverride: 'Cars, Motorcycles, Trucks & Buses' },
          { ...CATEGORY_TILES[1], icon: null, heroImg: 'https://ik.imagekit.io/nepgaxllc/bbbcd-removebg-preview.png', accent: '#8DC63F', count: '850+', rating: 4.7, descOverride: 'Villa, House, Factory & Kos' },
          { ...CATEGORY_TILES[2], icon: null, heroImg: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2020,%202026,%2007_01_55%20AM.png', accent: '#8DC63F', count: '320+', rating: 4.9 },
          { ...CATEGORY_TILES[3], icon: null, heroImg: 'https://ik.imagekit.io/nepgaxllc/bbbcddddgf-removebg-preview.png', accent: '#8DC63F', count: '180+', rating: 4.6 },
          { ...CATEGORY_TILES[4], icon: null, heroImg: 'https://ik.imagekit.io/nepgaxllc/bbbcdddd-removebg-preview.png', accent: '#8DC63F', count: '95+', rating: 4.8 },
          { ...CATEGORY_TILES[5], icon: null, heroImg: 'https://ik.imagekit.io/nepgaxllc/bbbcddd-removebg-preview.png', accent: '#8DC63F', count: '210+', rating: 4.7 },
        ].map(c => (
          <button key={c.id} onClick={() => !selectedId && handleSelect(c)} style={{
            position: 'relative', display: 'flex', flexDirection: 'row', alignItems: 'center',
            padding: '20px 16px', width: '100%', minHeight: 130,
            background: selectedId === c.id ? 'rgba(141,198,63,0.06)' : 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: selectedId === c.id ? '2px solid #8DC63F' : '1.5px solid rgba(141,198,63,0.08)',
            borderRadius: 20,
            cursor: selectedId ? 'default' : 'pointer', fontFamily: 'inherit', textAlign: 'left',
            overflow: 'hidden', transition: 'all 0.3s',
            boxShadow: selectedId === c.id ? '0 0 20px rgba(141,198,63,0.2), inset 0 1px 0 rgba(141,198,63,0.1)' : 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)',
            opacity: selectedId && selectedId !== c.id ? 0 : 1,
            transform: selectedId && selectedId !== c.id ? 'scale(0.95)' : 'scale(1)',
          }}>
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1.5, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.3), transparent)', pointerEvents: 'none' }} />
            <span style={{ position: 'absolute', top: 12, right: 14, padding: '3px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.2)', fontSize: 11, fontWeight: 800, color: '#8DC63F', zIndex: 2 }}>{c.count}</span>
            <div style={{ flex: 1, minWidth: 0, zIndex: 1, paddingRight: 10 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>{c.label} {c.rating && <span style={{ fontSize: 13, fontWeight: 800, color: '#FFD700' }}>{'\u2605'} {c.rating}</span>}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, lineHeight: 1.4, marginBottom: 8 }}>{c.descOverride || c.desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>Browse</span>
              </div>
            </div>
            <div style={{ width: 195, height: 165, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 30 }}>
              <img src={c.heroImg || c.img} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }} />
            </div>
            <div style={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(141,198,63,0.05)', filter: 'blur(25px)', pointerEvents: 'none' }} />
          </button>
        ))}
      </div>
    </div>
  )
}
