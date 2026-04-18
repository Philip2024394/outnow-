import { useState } from 'react'
import { createPortal } from 'react-dom'
import { TextField, NumberField, PillSelect, ToggleField, TextArea, Row, Section, ImageUploader, PriceFields, PreviewCard, BuyNowFields, FormFooter, ProgressBar, ChecklistField } from '../components/FormFields'
import styles from '../rentalFormStyles.module.css'

const TYPES = ['Villa', 'Apartment', 'House', 'Room', 'Studio', 'Kos', 'Guesthouse', 'Cabin']
const AMENITIES = ['WiFi', 'AC', 'Kitchen', 'Parking', 'Pool', 'TV', 'Washer', 'Hot Water', 'Fridge', 'Balcony', 'Garden', 'BBQ', 'Security', 'CCTV', 'Gym', 'Workspace']

export default function PropertyListingForm({ open, onClose, onSubmit }) {
  const [step, setStep] = useState(0)
  const [mainImage, setMainImage] = useState('')
  const [thumbs, setThumbs] = useState([])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [propType, setPropType] = useState('')
  const [bedrooms, setBedrooms] = useState('1')
  const [bathrooms, setBathrooms] = useState('1')
  const [maxGuests, setMaxGuests] = useState('2')
  const [amenities, setAmenities] = useState([])
  const [cleaningFee, setCleaningFee] = useState('')
  const [minStay, setMinStay] = useState('1')
  const [checkIn, setCheckIn] = useState('14:00')
  const [checkOut, setCheckOut] = useState('12:00')
  const [petFriendly, setPetFriendly] = useState(false)
  const [smoking, setSmoking] = useState(false)
  const [partyAllowed, setPartyAllowed] = useState(false)
  const [daily, setDaily] = useState('')
  const [weekly, setWeekly] = useState('')
  const [monthly, setMonthly] = useState('')
  const [deposit, setDeposit] = useState('')
  const [lateFee, setLateFee] = useState('')
  const [buyNow, setBuyNow] = useState(false)
  const [buyNowPrice, setBuyNowPrice] = useState('')
  const [negotiable, setNegotiable] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null
  const tags = [propType, `${bedrooms} BR`, `${bathrooms} BA`, `${maxGuests} guests`, petFriendly && 'Pet Friendly', ...amenities.slice(0, 3)].filter(Boolean)
  const priceChange = (k, v) => { if (k === 'daily') setDaily(v); if (k === 'weekly') setWeekly(v); if (k === 'monthly') setMonthly(v); if (k === 'deposit') setDeposit(v); if (k === 'lateFee') setLateFee(v) }

  const handleSubmit = async () => {
    setSubmitting(true)
    await onSubmit?.({ category: 'Property', title, description: desc, city, image: mainImage, images: [mainImage, ...thumbs].filter(Boolean), price_day: Number(daily), price_week: Number(weekly), price_month: Number(monthly), buy_now: buyNow ? { price: Number(buyNowPrice), negotiable } : null, extra_fields: { propType, address, bedrooms, bathrooms, maxGuests, amenities, cleaningFee, minStay, checkIn, checkOut, petFriendly, smoking, partyAllowed, deposit, lateFee } })
    setSubmitting(false); setStep(4)
  }

  return createPortal(
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <div className={styles.headerTitle}><span className={styles.headerName}>🏠 Property</span><span className={styles.headerSub}>{['Photos & Info','Details','Pricing','Preview','Done'][step]}</span></div>
        <span className={styles.stepBadge}>{Math.min(step + 1, 4)}/4</span>
      </div>
      <ProgressBar current={step} total={4} />
      <div className={styles.content}>
        {step === 4 && <div className={styles.done}><span className={styles.doneIcon}>🎉</span><h2 className={styles.doneTitle}>Listed!</h2><p className={styles.doneSub}>Your property rental is live.</p><button className={styles.doneBtn} onClick={onClose}>Done</button></div>}
        {step === 0 && <div className={styles.form}>
          <Section icon="📸" title="Photos" sub="Showcase your property" /><ImageUploader mainImage={mainImage} thumbImages={thumbs} onSetMain={setMainImage} onAddThumb={u => setThumbs(p => [...p, u])} onRemoveThumb={i => setThumbs(p => p.filter((_, j) => j !== i))} onRemoveMain={() => setMainImage('')} />
          <Section icon="📝" title="Basic Info" /><TextField label="Title" value={title} onChange={setTitle} placeholder="e.g. Beachfront Villa 3BR - Seminyak" required /><TextArea label="Description" value={desc} onChange={setDesc} placeholder="Describe your property — views, neighborhood, unique features..." rows={4} /><TextField label="City / Area" value={city} onChange={setCity} placeholder="Seminyak, Bali" required /><TextArea label="Full Address" value={address} onChange={setAddress} placeholder="Street, area, postal code" rows={2} />
        </div>}
        {step === 1 && <div className={styles.form}>
          <Section icon="🏠" title="Property Details" />
          <PillSelect label="Property Type" value={propType} onChange={setPropType} options={TYPES} required />
          <Row><NumberField label="Bedrooms" value={bedrooms} onChange={setBedrooms} /><NumberField label="Bathrooms" value={bathrooms} onChange={setBathrooms} /></Row>
          <NumberField label="Max Guests" value={maxGuests} onChange={setMaxGuests} />
          <ChecklistField label="Amenities" options={AMENITIES} selected={amenities} onChange={setAmenities} />
          <Section icon="📋" title="Rules & Policies" />
          <Row><TextField label="Check-in Time" value={checkIn} onChange={setCheckIn} type="time" /><TextField label="Check-out Time" value={checkOut} onChange={setCheckOut} type="time" /></Row>
          <NumberField label="Minimum Stay (nights)" value={minStay} onChange={setMinStay} />
          <NumberField label="Cleaning Fee (Rp)" value={cleaningFee} onChange={setCleaningFee} placeholder="0 = no fee" />
          <ToggleField label="🐾 Pet Friendly" value={petFriendly} onChange={setPetFriendly} />
          <ToggleField label="🚬 Smoking Allowed" value={smoking} onChange={setSmoking} />
          <ToggleField label="🎉 Party Allowed" value={partyAllowed} onChange={setPartyAllowed} />
        </div>}
        {step === 2 && <div className={styles.form}><PriceFields daily={daily} weekly={weekly} monthly={monthly} deposit={deposit} lateFee={lateFee} onChange={priceChange} />
            <BuyNowFields enabled={buyNow} onToggle={setBuyNow} price={buyNowPrice} onPriceChange={setBuyNowPrice} negotiable={negotiable} onNegotiableChange={setNegotiable} /></div>}
        {step === 3 && <div className={styles.form}><PreviewCard title={title} city={city} category="Property" subType={propType} price={daily} image={mainImage} tags={tags} /></div>}
      </div>
      {step < 4 && <FormFooter step={step} onNext={() => step === 3 ? handleSubmit() : setStep(s => s + 1)} onDraft={() => {}} canNext={step === 0 ? !!title : step === 1 ? !!propType : step === 2 ? !!daily : true} submitting={submitting} nextLabel={step === 3 ? 'Publish' : undefined} />}
    </div>, document.body
  )
}
