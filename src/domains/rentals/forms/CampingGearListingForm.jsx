import { useState } from 'react'
import { createPortal } from 'react-dom'
import { TextField, NumberField, PillSelect, ToggleField, TextArea, Row, Section, ImageUploader, PriceFields, PreviewCard, BuyNowFields, FormFooter, ProgressBar, ChecklistField } from '../components/FormFields'
import styles from '../rentalFormStyles.module.css'

const TYPES = ['Tent', 'Sleeping Bag', 'Backpack', 'Camping Stove', 'Cooler', 'Camp Chair', 'Hammock', 'Tarp / Shelter', 'Lantern', 'Full Camping Set']
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair']
const SEASON = ['3-Season', '4-Season', 'Summer Only']
const WATERPROOF = ['1000mm', '2000mm', '3000mm', '5000mm+', 'Not Rated']
const TENT_CAPACITY = ['1 Person', '2 Person', '3 Person', '4 Person', '6 Person', '8+ Person']
const ACCESSORIES = ['Stakes', 'Poles', 'Stuff Sack', 'Rainfly', 'Footprint', 'Repair Kit', 'Pump', 'Compression Sack']

export default function CampingGearListingForm({ open, onClose, onSubmit }) {
  const [step, setStep] = useState(0)
  const [mainImage, setMainImage] = useState('')
  const [thumbs, setThumbs] = useState([])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [city, setCity] = useState('')
  const [gearType, setGearType] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [capacity, setCapacity] = useState('')
  const [condition, setCondition] = useState('Good')
  const [season, setSeason] = useState('')
  const [waterproof, setWaterproof] = useState('')
  const [weight, setWeight] = useState('')
  const [accessories, setAccessories] = useState([])
  const [cleaningFee, setCleaningFee] = useState('')
  const [damageDep, setDamageDep] = useState('')
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
  const tags = [gearType, condition, capacity, season, waterproof !== 'Not Rated' && waterproof, weight && `${weight}kg`].filter(Boolean)
  const priceChange = (k, v) => { if (k === 'daily') setDaily(v); if (k === 'weekly') setWeekly(v); if (k === 'monthly') setMonthly(v); if (k === 'deposit') setDeposit(v); if (k === 'lateFee') setLateFee(v) }

  const handleSubmit = async () => {
    setSubmitting(true)
    await onSubmit?.({ category: 'Camping Gear', title, description: desc, city, image: mainImage, images: [mainImage, ...thumbs].filter(Boolean), price_day: Number(daily), price_week: Number(weekly), price_month: Number(monthly), buy_now: buyNow ? { price: Number(buyNowPrice), negotiable } : null, extra_fields: { gearType, brand, model, capacity, condition, season, waterproof, weight, accessories, cleaningFee, damageDep, deposit, lateFee } })
    setSubmitting(false); setStep(4)
  }

  return createPortal(
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <div className={styles.headerTitle}><span className={styles.headerName}>⛺ Camping Gear</span><span className={styles.headerSub}>{['Photos & Info','Details','Pricing','Preview','Done'][step]}</span></div>
        <span className={styles.stepBadge}>{Math.min(step + 1, 4)}/4</span>
      </div>
      <ProgressBar current={step} total={4} />
      <div className={styles.content}>
        {step === 4 && <div className={styles.done}><span className={styles.doneIcon}>🎉</span><h2 className={styles.doneTitle}>Listed!</h2><p className={styles.doneSub}>Your camping gear rental is live.</p><button className={styles.doneBtn} onClick={onClose}>Done</button></div>}
        {step === 0 && <div className={styles.form}>
          <Section icon="📸" title="Photos" /><ImageUploader mainImage={mainImage} thumbImages={thumbs} onSetMain={setMainImage} onAddThumb={u => setThumbs(p => [...p, u])} onRemoveThumb={i => setThumbs(p => p.filter((_, j) => j !== i))} onRemoveMain={() => setMainImage('')} />
          <Section icon="📝" title="Basic Info" /><TextField label="Title" value={title} onChange={setTitle} placeholder="e.g. 4-Person Tent + Sleeping Bags" required /><TextArea label="Description" value={desc} onChange={setDesc} rows={3} /><TextField label="City" value={city} onChange={setCity} required />
        </div>}
        {step === 1 && <div className={styles.form}>
          <Section icon="⛺" title="Gear Details" />
          <PillSelect label="Gear Type" value={gearType} onChange={setGearType} options={TYPES} required />
          <Row><TextField label="Brand" value={brand} onChange={setBrand} /><TextField label="Model" value={model} onChange={setModel} /></Row>
          <PillSelect label="Condition" value={condition} onChange={setCondition} options={CONDITIONS} />
          {(gearType === 'Tent' || gearType === 'Full Camping Set') && <>
            <PillSelect label="Capacity" value={capacity} onChange={setCapacity} options={TENT_CAPACITY} />
            <PillSelect label="Season Rating" value={season} onChange={setSeason} options={SEASON} />
            <PillSelect label="Waterproof Rating" value={waterproof} onChange={setWaterproof} options={WATERPROOF} />
          </>}
          <NumberField label="Weight (kg)" value={weight} onChange={setWeight} placeholder="2.5" />
          <ChecklistField label="Included Accessories" options={ACCESSORIES} selected={accessories} onChange={setAccessories} />
          <Section icon="💰" title="Fees" />
          <Row><NumberField label="Cleaning Fee (Rp)" value={cleaningFee} onChange={setCleaningFee} placeholder="0" /><NumberField label="Damage Deposit (Rp)" value={damageDep} onChange={setDamageDep} placeholder="200000" /></Row>
        </div>}
        {step === 2 && <div className={styles.form}><PriceFields daily={daily} weekly={weekly} monthly={monthly} deposit={deposit} lateFee={lateFee} onChange={priceChange} />
            <BuyNowFields enabled={buyNow} onToggle={setBuyNow} price={buyNowPrice} onPriceChange={setBuyNowPrice} negotiable={negotiable} onNegotiableChange={setNegotiable} /></div>}
        {step === 3 && <div className={styles.form}><PreviewCard title={title} city={city} category="Camping" subType={gearType} price={daily} image={mainImage} tags={tags} /></div>}
      </div>
      {step < 4 && <FormFooter step={step} onNext={() => step === 3 ? handleSubmit() : setStep(s => s + 1)} onDraft={() => {}} canNext={step === 0 ? !!title : step === 1 ? !!gearType : step === 2 ? !!daily : true} submitting={submitting} nextLabel={step === 3 ? 'Publish' : undefined} />}
    </div>, document.body
  )
}
