/**
 * RentalListingScreen — create a rental listing across all categories.
 * Categories: Vehicles, Property, Fashion, Electronics, Audio & Sound, Party & Event
 */
import { useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import styles from './RentalListingScreen.module.css'

const CATEGORIES = [
  {
    id: 'Motorcycles', label: 'Motorcycles', icon: '🏍️',
    img: 'https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237',
    desc: 'List your motorbike for daily or weekly rental',
    items: ['Matic', 'Sport', 'Trail', 'Classic', 'Cruiser', 'Adventure'],
    fields: ['brand','model','year','cc','color','plateNo','helmets','fuel'],
  },
  {
    id: 'Cars', label: 'Cars', icon: '🚗',
    img: 'https://ik.imagekit.io/nepgaxllc/Sporty%20green%20and%20black%20hatchback.png?updatedAt=1775634925566',
    desc: 'Rent out cars with or without driver',
    items: ['City Car', 'MPV', 'SUV', 'Sedan', 'Hatchback', 'Van', 'Premium'],
    fields: ['brand','model','year','cc','color','plateNo','seats','fuel','driver'],
  },
  {
    id: 'Trucks', label: 'Trucks', icon: '🚛',
    img: 'https://ik.imagekit.io/nepgaxllc/asdasdasssss-removebg-preview.png',
    desc: 'Pickup, box truck, flatbed for cargo & moving',
    items: ['Pickup', 'Box Truck', 'Flatbed', 'Double Cab', 'Dump Truck'],
    fields: ['brand','model','year','payload','plateNo','fuel','driver'],
  },
  {
    id: 'Buses', label: 'Buses & Minibus', icon: '🚌',
    img: 'https://ik.imagekit.io/nepgaxllc/asdasdasssssddd-removebg-preview.png',
    desc: 'Group travel — minibus, coach, shuttle',
    items: ['Minibus 16 seat', 'Coach 30+ seat', 'Shuttle', 'Tourist Bus'],
    fields: ['brand','model','year','seats','plateNo','fuel','driver'],
  },
  {
    id: 'Property', label: 'Property', icon: '🏠',
    img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2001_31_24%20AM.png',
    desc: 'Villas, kos, apartments, rooms — daily to monthly',
    items: ['Villa', 'Kos', 'Apartment', 'Room', 'House', 'Studio', 'Warehouse'],
    fields: ['propertyType','bedrooms','bathrooms','amenities','address'],
  },
  {
    id: 'Fashion', label: 'Fashion', icon: '👗',
    img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2001_44_22%20AM.png',
    desc: 'Kebaya, suits, gowns, costumes for events',
    items: ['Kebaya', 'Suit / Tuxedo', 'Wedding Gown', 'Batik Set', 'Costume', 'Traditional Dress'],
    fields: ['size','material','occasion','dryClean'],
  },
  {
    id: 'Electronics', label: 'Electronics', icon: '📷',
    img: null,
    desc: 'Cameras, laptops, projectors, drones',
    items: ['DSLR Camera', 'Mirrorless', 'Laptop', 'Projector', 'Drone', 'GoPro', 'Gimbal'],
    fields: ['brand','model','condition','includes'],
  },
  {
    id: 'Audio & Sound', label: 'Audio & Sound', icon: '🔊',
    img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2001_50_12%20AM.png',
    desc: 'Speakers, PA systems, DJ equipment',
    items: ['PA System', 'DJ Setup', 'Speaker Set', 'Wireless Mic', 'Mixer', 'Subwoofer'],
    fields: ['brand','power','includes','operator'],
  },
  {
    id: 'Party & Event', label: 'Party & Event', icon: '🎉',
    img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2001_29_12%20AM.png',
    desc: 'Tents, tables, decor, catering equipment',
    items: ['Tent', 'Table & Chair Set', 'Stage', 'Lighting', 'Decor', 'Catering Equipment'],
    fields: ['itemType','capacity','setupIncluded','includes'],
  },
]

const PROPERTY_TYPES = ['Villa', 'Kos', 'Apartment', 'Room', 'House', 'Studio']
const FUEL_OPTIONS = ['Excluded', 'Included', 'Full-to-Full']
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair']

export default function RentalListingScreen({ open, onClose, onSubmit }) {
  const { user, userProfile } = useAuth()
  const [step, setStep] = useState('category') // category | details | pricing | done
  const [category, setCategory] = useState(null)

  // Common fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mainImage, setMainImage] = useState('')
  const [thumbImages, setThumbImages] = useState([])
  const [city, setCity] = useState('')
  const [subType, setSubType] = useState('')
  const [features, setFeatures] = useState('')
  const [delivery, setDelivery] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState('')
  const [insurance, setInsurance] = useState(false)
  const [insuranceFee, setInsuranceFee] = useState('')
  const [minRental, setMinRental] = useState('1')
  const [deposit, setDeposit] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  // Pricing
  const [priceDaily, setPriceDaily] = useState('')
  const [priceWeekly, setPriceWeekly] = useState('')
  const [priceMonthly, setPriceMonthly] = useState('')
  const [condition, setCondition] = useState('Good')

  // Vehicle fields
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [cc, setCc] = useState('')
  const [color, setColor] = useState('')
  const [plateNo, setPlateNo] = useState('')
  const [seats, setSeats] = useState('5')
  const [payload, setPayload] = useState('')
  const [helmets, setHelmets] = useState('2')
  const [fuel, setFuel] = useState('Excluded')
  const [withDriver, setWithDriver] = useState(false)
  const [driverDaily, setDriverDaily] = useState('')

  // Property fields
  const [propertyType, setPropertyType] = useState('Villa')
  const [bedrooms, setBedrooms] = useState('1')
  const [bathrooms, setBathrooms] = useState('1')
  const [amenities, setAmenities] = useState('')
  const [address, setAddress] = useState('')

  // Fashion fields
  const [size, setSize] = useState('')
  const [material, setMaterial] = useState('')
  const [occasion, setOccasion] = useState('')
  const [dryClean, setDryClean] = useState(false)

  // Equipment fields
  const [power, setPower] = useState('')
  const [includes, setIncludes] = useState('')
  const [operator, setOperator] = useState(false)
  const [itemType, setItemType] = useState('')
  const [capacity, setCapacity] = useState('')
  const [setupIncluded, setSetupIncluded] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const catConfig = CATEGORIES.find(c => c.id === category)
  const hasField = (f) => catConfig?.fields?.includes(f)

  const handleAddThumb = () => {
    const url = prompt('Paste thumbnail image URL:')
    if (url?.trim()) setThumbImages(prev => [...prev, url.trim()])
  }

  const handleSubmit = async () => {
    if (!title.trim() || !priceDaily) return
    setSubmitting(true)
    const listing = {
      category,
      sub_category: subType,
      title: title.trim(),
      description: description.trim(),
      images: [mainImage, ...thumbImages].filter(Boolean),
      image: mainImage || thumbImages[0] || null,
      city: city.trim() || userProfile?.city || '',
      price_day: Number(priceDaily) || 0,
      price_week: Number(priceWeekly) || 0,
      price_month: Number(priceMonthly) || 0,
      condition,
      owner_type: 'owner',
      status: 'active',
      features: features.split(',').map(f => f.trim()).filter(Boolean),
      extra_fields: {
        brand, model, year, cc, color, plateNo, seats, payload, helmets, fuel,
        withDriver, driverDaily, propertyType, bedrooms, bathrooms, amenities, address,
        size, material, occasion, dryClean, power, includes, operator, itemType, capacity, setupIncluded,
        delivery_available: delivery, delivery_fee: deliveryFee, insurance, insurance_fee: insuranceFee,
        min_rental_days: minRental, deposit, whatsapp,
      },
    }
    await onSubmit?.(listing)
    setSubmitting(false)
    setStep('done')
  }

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => {
          if (step === 'details') setStep('category')
          else if (step === 'pricing') setStep('details')
          else onClose()
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className={styles.title}>
          {step === 'category' && 'List a Rental'}
          {step === 'details' && `${catConfig?.icon} ${catConfig?.label}`}
          {step === 'pricing' && 'Set Pricing'}
          {step === 'done' && 'Listed!'}
        </h1>
        <span className={styles.stepBadge}>
          {step === 'category' ? '1/3' : step === 'details' ? '2/3' : step === 'pricing' ? '3/3' : '✓'}
        </span>
      </div>

      <div className={styles.content}>

        {/* ═══ STEP 1: Pick category ═══ */}
        {step === 'category' && (
          <div className={styles.catList}>
            {CATEGORIES.map(c => (
              <button key={c.id} className={`${styles.catBanner} ${category === c.id ? styles.catBannerActive : ''}`} onClick={() => setCategory(c.id)}>
                <div className={styles.catBannerLeft}>
                  <span className={styles.catBannerTitle}>{c.label}</span>
                  <span className={styles.catBannerDesc}>{c.desc}</span>
                </div>
                {c.img
                  ? <img src={c.img} alt={c.label} className={styles.catBannerImg} />
                  : <span className={styles.catBannerEmoji}>{c.icon}</span>
                }
              </button>
            ))}
            {/* Expandable items list under selected category */}
            {category && (
              <div className={styles.catItemsWrap}>
                <span className={styles.catItemsTitle}>What you can list in {CATEGORIES.find(c => c.id === category)?.label}:</span>
                <div className={styles.catItemsList}>
                  {CATEGORIES.find(c => c.id === category)?.items.map(item => (
                    <span key={item} className={styles.catItem}>• {item}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 2: Details ═══ */}
        {step === 'details' && (
          <div className={styles.form}>
            {/* ── Section: Images ── */}
            <div className={styles.section}>
              <span className={styles.sectionTitle}>📸 Photos</span>
              <span className={styles.sectionSub}>Main image appears as the cover on your rental card</span>
            </div>

            {/* Main image hero */}
            <div className={styles.mainImageWrap}>
              {mainImage ? (
                <div className={styles.mainImagePreview}>
                  <img src={mainImage} alt="Main" className={styles.mainImageImg} />
                  <button className={styles.mainImageRemove} onClick={() => setMainImage('')}>✕ Remove</button>
                  <span className={styles.mainImageBadge}>COVER PHOTO</span>
                </div>
              ) : (
                <button className={styles.mainImageAdd} onClick={() => { const u = prompt('Paste main cover image URL:'); if (u?.trim()) setMainImage(u.trim()) }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span className={styles.mainImageAddTitle}>Add Cover Photo</span>
                  <span className={styles.mainImageAddSub}>This image shows on your rental card</span>
                </button>
              )}
            </div>

            {/* Thumbnail gallery */}
            <div className={styles.thumbRow}>
              {thumbImages.map((img, i) => (
                <div key={i} className={styles.thumbCard}>
                  <img src={img} alt="" className={styles.thumbImg} />
                  <button className={styles.thumbRemove} onClick={() => setThumbImages(prev => prev.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
              {thumbImages.length < 8 && (
                <button className={styles.thumbAdd} onClick={handleAddThumb}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>Add</span>
                </button>
              )}
            </div>

            {/* ── Section: Basic Info ── */}
            <div className={styles.section}>
              <span className={styles.sectionTitle}>📝 Basic Info</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Listing Title *</label>
              <input className={styles.input} value={title} onChange={e => setTitle(e.target.value)} placeholder={`e.g. ${catConfig?.label} for rent in Bali`} />
            </div>

            {/* Sub-type selector */}
            {catConfig?.items?.length > 0 && (
              <div className={styles.field}>
                <label className={styles.label}>Type</label>
                <div className={styles.pillRow}>
                  {catConfig.items.map(t => (
                    <button key={t} className={`${styles.pill} ${subType === t ? styles.pillActive : ''}`} onClick={() => setSubType(t)}>{t}</button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <textarea className={styles.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your item in detail — condition, usage, what makes it special..." rows={4} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>City / Location *</label>
              <input className={styles.input} value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Yogyakarta, Bali" />
            </div>

            {/* ── Section: Category-Specific Details ── */}
            <div className={styles.section}>
              <span className={styles.sectionTitle}>{catConfig?.icon} {catConfig?.label} Details</span>
            </div>

            {/* Vehicle fields */}
            {hasField('brand') && (
              <div className={styles.row}>
                <div className={styles.field}><label className={styles.label}>Brand *</label><input className={styles.input} value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Honda" /></div>
                <div className={styles.field}><label className={styles.label}>Model *</label><input className={styles.input} value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. Beat" /></div>
              </div>
            )}
            {hasField('year') && (
              <div className={styles.row}>
                <div className={styles.field}><label className={styles.label}>Year</label><input className={styles.input} value={year} onChange={e => setYear(e.target.value)} placeholder="2024" type="number" /></div>
                {hasField('cc') && <div className={styles.field}><label className={styles.label}>Engine (CC)</label><input className={styles.input} value={cc} onChange={e => setCc(e.target.value)} placeholder="150" type="number" /></div>}
              </div>
            )}
            {hasField('color') && (
              <div className={styles.row}>
                <div className={styles.field}><label className={styles.label}>Color</label><input className={styles.input} value={color} onChange={e => setColor(e.target.value)} placeholder="Black" /></div>
                {hasField('plateNo') && <div className={styles.field}><label className={styles.label}>Plate Number</label><input className={styles.input} value={plateNo} onChange={e => setPlateNo(e.target.value)} placeholder="AB 1234 CD" /></div>}
              </div>
            )}
            {hasField('seats') && <div className={styles.field}><label className={styles.label}>Seats</label><input className={styles.input} value={seats} onChange={e => setSeats(e.target.value)} type="number" /></div>}
            {hasField('payload') && <div className={styles.field}><label className={styles.label}>Payload Capacity</label><input className={styles.input} value={payload} onChange={e => setPayload(e.target.value)} placeholder="2.5 ton" /></div>}
            {hasField('helmets') && <div className={styles.field}><label className={styles.label}>Helmets Included</label><input className={styles.input} value={helmets} onChange={e => setHelmets(e.target.value)} type="number" /></div>}
            {hasField('fuel') && (
              <div className={styles.field}>
                <label className={styles.label}>Fuel Policy</label>
                <div className={styles.pillRow}>{FUEL_OPTIONS.map(f => <button key={f} className={`${styles.pill} ${fuel === f ? styles.pillActive : ''}`} onClick={() => setFuel(f)}>{f}</button>)}</div>
              </div>
            )}
            {hasField('driver') && (
              <div className={styles.field}>
                <label className={styles.label}>Driver Option</label>
                <div className={styles.pillRow}>
                  <button className={`${styles.pill} ${!withDriver ? styles.pillActive : ''}`} onClick={() => setWithDriver(false)}>Self Drive</button>
                  <button className={`${styles.pill} ${withDriver ? styles.pillActive : ''}`} onClick={() => setWithDriver(true)}>With Driver</button>
                </div>
                {withDriver && <input className={styles.input} value={driverDaily} onChange={e => setDriverDaily(e.target.value)} placeholder="Driver fee per day (Rp)" style={{ marginTop: 8 }} />}
              </div>
            )}

            {/* Property fields */}
            {hasField('propertyType') && (
              <div className={styles.field}>
                <label className={styles.label}>Property Type</label>
                <div className={styles.pillRow}>{PROPERTY_TYPES.map(t => <button key={t} className={`${styles.pill} ${propertyType === t ? styles.pillActive : ''}`} onClick={() => setPropertyType(t)}>{t}</button>)}</div>
              </div>
            )}
            {hasField('bedrooms') && (
              <div className={styles.row}>
                <div className={styles.field}><label className={styles.label}>Bedrooms</label><input className={styles.input} value={bedrooms} onChange={e => setBedrooms(e.target.value)} type="number" /></div>
                <div className={styles.field}><label className={styles.label}>Bathrooms</label><input className={styles.input} value={bathrooms} onChange={e => setBathrooms(e.target.value)} type="number" /></div>
              </div>
            )}
            {hasField('amenities') && <div className={styles.field}><label className={styles.label}>Amenities</label><input className={styles.input} value={amenities} onChange={e => setAmenities(e.target.value)} placeholder="AC, WiFi, Pool, Parking, Kitchen..." /></div>}
            {hasField('address') && <div className={styles.field}><label className={styles.label}>Full Address</label><textarea className={styles.textarea} value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, area, city, postal code" rows={2} /></div>}

            {/* Fashion fields */}
            {hasField('size') && <div className={styles.field}><label className={styles.label}>Size Available</label><input className={styles.input} value={size} onChange={e => setSize(e.target.value)} placeholder="S / M / L / XL or custom" /></div>}
            {hasField('material') && <div className={styles.field}><label className={styles.label}>Material</label><input className={styles.input} value={material} onChange={e => setMaterial(e.target.value)} placeholder="Silk, Cotton, Beludru, Lace..." /></div>}
            {hasField('occasion') && <div className={styles.field}><label className={styles.label}>Best For</label><input className={styles.input} value={occasion} onChange={e => setOccasion(e.target.value)} placeholder="Wedding, Engagement, Formal..." /></div>}
            {hasField('dryClean') && (
              <div className={styles.field}>
                <label className={styles.label}>Dry Clean Included?</label>
                <div className={styles.pillRow}>
                  <button className={`${styles.pill} ${!dryClean ? styles.pillActive : ''}`} onClick={() => setDryClean(false)}>No</button>
                  <button className={`${styles.pill} ${dryClean ? styles.pillActive : ''}`} onClick={() => setDryClean(true)}>Yes — included</button>
                </div>
              </div>
            )}

            {/* Equipment fields */}
            {hasField('power') && <div className={styles.field}><label className={styles.label}>Power Output (Watts)</label><input className={styles.input} value={power} onChange={e => setPower(e.target.value)} placeholder="5000" /></div>}
            {hasField('includes') && <div className={styles.field}><label className={styles.label}>What's Included</label><input className={styles.input} value={includes} onChange={e => setIncludes(e.target.value)} placeholder="Mixer, mic x4, cables, stand..." /></div>}
            {hasField('operator') && (
              <div className={styles.field}>
                <label className={styles.label}>Operator / Technician</label>
                <div className={styles.pillRow}>
                  <button className={`${styles.pill} ${!operator ? styles.pillActive : ''}`} onClick={() => setOperator(false)}>Not included</button>
                  <button className={`${styles.pill} ${operator ? styles.pillActive : ''}`} onClick={() => setOperator(true)}>Included</button>
                </div>
              </div>
            )}
            {hasField('itemType') && <div className={styles.field}><label className={styles.label}>Item Type</label><input className={styles.input} value={itemType} onChange={e => setItemType(e.target.value)} placeholder="Tent 10x20m, Stage 4x6m..." /></div>}
            {hasField('capacity') && <div className={styles.field}><label className={styles.label}>Capacity</label><input className={styles.input} value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="200 people" /></div>}
            {hasField('setupIncluded') && (
              <div className={styles.field}>
                <label className={styles.label}>Setup & Teardown</label>
                <div className={styles.pillRow}>
                  <button className={`${styles.pill} ${!setupIncluded ? styles.pillActive : ''}`} onClick={() => setSetupIncluded(false)}>Self setup</button>
                  <button className={`${styles.pill} ${setupIncluded ? styles.pillActive : ''}`} onClick={() => setSetupIncluded(true)}>Included</button>
                </div>
              </div>
            )}

            {/* ── Section: Condition & Features ── */}
            <div className={styles.section}>
              <span className={styles.sectionTitle}>✨ Condition & Features</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Condition</label>
              <div className={styles.pillRow}>{CONDITIONS.map(c => <button key={c} className={`${styles.pill} ${condition === c ? styles.pillActive : ''}`} onClick={() => setCondition(c)}>{c}</button>)}</div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Features / Highlights</label>
              <input className={styles.input} value={features} onChange={e => setFeatures(e.target.value)} placeholder="GPS, Bluetooth, Helmet, Insurance..." />
              <span className={styles.hint}>Comma-separated — shown as tags on your card</span>
            </div>

            {/* ── Section: Services ── */}
            <div className={styles.section}>
              <span className={styles.sectionTitle}>🚚 Services & Extras</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Delivery Available?</label>
              <div className={styles.pillRow}>
                <button className={`${styles.pill} ${!delivery ? styles.pillActive : ''}`} onClick={() => setDelivery(false)}>Pickup only</button>
                <button className={`${styles.pill} ${delivery ? styles.pillActive : ''}`} onClick={() => setDelivery(true)}>Delivery available</button>
              </div>
              {delivery && <input className={styles.input} value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} placeholder="Delivery fee (Rp) or 'Free'" style={{ marginTop: 8 }} />}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Insurance Add-on?</label>
              <div className={styles.pillRow}>
                <button className={`${styles.pill} ${!insurance ? styles.pillActive : ''}`} onClick={() => setInsurance(false)}>No</button>
                <button className={`${styles.pill} ${insurance ? styles.pillActive : ''}`} onClick={() => setInsurance(true)}>Yes</button>
              </div>
              {insurance && <input className={styles.input} value={insuranceFee} onChange={e => setInsuranceFee(e.target.value)} placeholder="Insurance fee per day (Rp)" style={{ marginTop: 8 }} />}
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Min Rental (days)</label>
                <input className={styles.input} value={minRental} onChange={e => setMinRental(e.target.value)} type="number" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Deposit (Rp)</label>
                <input className={styles.input} value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="0" />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>WhatsApp Number</label>
              <input className={styles.input} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="08123456789" type="tel" />
              <span className={styles.hint}>Renters can contact you directly</span>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Pricing ═══ */}
        {step === 'pricing' && (
          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Price per Day (Rp) *</label>
              <input className={styles.input} value={priceDaily} onChange={e => setPriceDaily(e.target.value.replace(/\D/g, ''))} placeholder="150000" inputMode="numeric" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Price per Week (Rp)</label>
              <input className={styles.input} value={priceWeekly} onChange={e => setPriceWeekly(e.target.value.replace(/\D/g, ''))} placeholder="900000" inputMode="numeric" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Price per Month (Rp)</label>
              <input className={styles.input} value={priceMonthly} onChange={e => setPriceMonthly(e.target.value.replace(/\D/g, ''))} placeholder="3000000" inputMode="numeric" />
            </div>
          </div>
        )}

        {/* ═══ DONE ═══ */}
        {step === 'done' && (
          <div className={styles.done}>
            <span className={styles.doneIcon}>🎉</span>
            <h2 className={styles.doneTitle}>Listing Created!</h2>
            <p className={styles.doneSub}>Your {catConfig?.label} rental is now live. Renters can find it in the browse section.</p>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        )}
      </div>

      {/* Footer */}
      {step === 'category' && category && (
        <div className={styles.footer}>
          <button className={styles.nextBtn} onClick={() => setStep('details')}>
            Next: Add Details →
          </button>
        </div>
      )}
      {step === 'details' && (
        <div className={styles.footer}>
          <button className={styles.nextBtn} onClick={() => setStep('pricing')} disabled={!title.trim()}>
            Next: Set Pricing →
          </button>
        </div>
      )}
      {step === 'pricing' && (
        <div className={styles.footer}>
          <button className={styles.nextBtn} onClick={handleSubmit} disabled={!priceDaily || submitting}>
            {submitting ? 'Publishing...' : 'Publish Listing'}
          </button>
        </div>
      )}
    </div>
  )
}
