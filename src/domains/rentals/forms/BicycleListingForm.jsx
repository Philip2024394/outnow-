import { useState } from 'react'
import { createPortal } from 'react-dom'
import { TextField, NumberField, PillSelect, ToggleField, TextArea, Row, Section, ImageUploader, PriceFields, PreviewCard, BuyNowFields, FormFooter, ProgressBar } from '../components/FormFields'
import styles from '../rentalFormStyles.module.css'

const TYPES = ['Mountain Bike', 'Road Bike', 'City Bike', 'E-Bike', 'Folding Bike', 'BMX', 'Touring Bike']
const FRAME = ['XS', 'S', 'M', 'L', 'XL']
const WHEEL = ['16"', '20"', '24"', '26"', '27.5"', '29"', '700c']
const BRAKE = ['Disc (Hydraulic)', 'Disc (Mechanical)', 'Rim', 'Coaster']

export default function BicycleListingForm({ open, onClose, onSubmit }) {
  const [step, setStep] = useState(0)
  const [mainImage, setMainImage] = useState('')
  const [thumbs, setThumbs] = useState([])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [city, setCity] = useState('')
  const [bikeType, setBikeType] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [frameSize, setFrameSize] = useState('')
  const [wheelSize, setWheelSize] = useState('')
  const [gears, setGears] = useState('')
  const [brakeType, setBrakeType] = useState('')
  const [helmet, setHelmet] = useState(false)
  const [lock, setLock] = useState(false)
  const [lights, setLights] = useState(false)
  const [repairKit, setRepairKit] = useState(false)
  const [childSeat, setChildSeat] = useState(false)
  const [delivery, setDelivery] = useState(false)
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
  const tags = [bikeType, wheelSize, gears && `${gears} speed`, helmet && 'Helmet', lock && 'Lock', delivery && 'Delivery'].filter(Boolean)
  const priceChange = (k, v) => { if (k === 'daily') setDaily(v); if (k === 'weekly') setWeekly(v); if (k === 'monthly') setMonthly(v); if (k === 'deposit') setDeposit(v); if (k === 'lateFee') setLateFee(v) }

  const handleSubmit = async () => {
    setSubmitting(true)
    await onSubmit?.({ category: 'Bicycles', title, description: desc, city, image: mainImage, images: [mainImage, ...thumbs].filter(Boolean), price_day: Number(daily), price_week: Number(weekly), price_month: Number(monthly), buy_now: buyNow ? { price: Number(buyNowPrice), negotiable } : null, extra_fields: { bikeType, brand, model, frameSize, wheelSize, gears, brakeType, helmet, lock, lights, repairKit, childSeat, delivery, deposit, lateFee } })
    setSubmitting(false); setStep(4)
  }

  return createPortal(
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <div className={styles.headerTitle}><span className={styles.headerName}>🚲 Bicycle</span><span className={styles.headerSub}>{['Photos & Info','Specifications','Pricing','Preview','Done'][step]}</span></div>
        <span className={styles.stepBadge}>{Math.min(step + 1, 4)}/4</span>
      </div>
      <ProgressBar current={step} total={4} />
      <div className={styles.content}>
        {step === 4 && <div className={styles.done}><span className={styles.doneIcon}>🎉</span><h2 className={styles.doneTitle}>Listed!</h2><p className={styles.doneSub}>Your bicycle rental is live.</p><button className={styles.doneBtn} onClick={onClose}>Done</button></div>}
        {step === 0 && <div className={styles.form}>
          <Section icon="📸" title="Photos" /><ImageUploader mainImage={mainImage} thumbImages={thumbs} onSetMain={setMainImage} onAddThumb={u => setThumbs(p => [...p, u])} onRemoveThumb={i => setThumbs(p => p.filter((_, j) => j !== i))} onRemoveMain={() => setMainImage('')} />
          <Section icon="📝" title="Basic Info" /><TextField label="Title" value={title} onChange={setTitle} placeholder="e.g. Giant ATX Mountain Bike" required /><TextArea label="Description" value={desc} onChange={setDesc} placeholder="Condition, usage..." rows={3} /><TextField label="City" value={city} onChange={setCity} placeholder="Bali" required />
        </div>}
        {step === 1 && <div className={styles.form}>
          <Section icon="🚲" title="Specifications" />
          <PillSelect label="Bike Type" value={bikeType} onChange={setBikeType} options={TYPES} required />
          <Row><TextField label="Brand" value={brand} onChange={setBrand} placeholder="Giant" /><TextField label="Model" value={model} onChange={setModel} placeholder="ATX 27.5" /></Row>
          <Row><PillSelect label="Frame Size" value={frameSize} onChange={setFrameSize} options={FRAME} /><PillSelect label="Wheel Size" value={wheelSize} onChange={setWheelSize} options={WHEEL} /></Row>
          <Row><NumberField label="Gears / Speeds" value={gears} onChange={setGears} placeholder="21" /><PillSelect label="Brake Type" value={brakeType} onChange={setBrakeType} options={BRAKE} /></Row>
          <Section icon="✨" title="Included" />
          <ToggleField label="⛑️ Helmet Included" value={helmet} onChange={setHelmet} />
          <ToggleField label="🔒 Lock Included" value={lock} onChange={setLock} />
          <ToggleField label="💡 Lights Included" value={lights} onChange={setLights} />
          <ToggleField label="🔧 Repair Kit" value={repairKit} onChange={setRepairKit} />
          <ToggleField label="👶 Child Seat Available" value={childSeat} onChange={setChildSeat} />
          <ToggleField label="🚚 Delivery Available" value={delivery} onChange={setDelivery} />
        </div>}
        {step === 2 && <div className={styles.form}><PriceFields daily={daily} weekly={weekly} monthly={monthly} deposit={deposit} lateFee={lateFee} onChange={priceChange} />
            <BuyNowFields enabled={buyNow} onToggle={setBuyNow} price={buyNowPrice} onPriceChange={setBuyNowPrice} negotiable={negotiable} onNegotiableChange={setNegotiable} /></div>}
        {step === 3 && <div className={styles.form}><PreviewCard title={title} city={city} category="Bicycle" subType={bikeType} price={daily} image={mainImage} tags={tags} /></div>}
      </div>
      {step < 4 && <FormFooter step={step} onNext={() => step === 3 ? handleSubmit() : setStep(s => s + 1)} onDraft={() => {}} canNext={step === 0 ? !!title : step === 1 ? !!bikeType : step === 2 ? !!daily : true} submitting={submitting} nextLabel={step === 3 ? 'Publish' : undefined} />}
    </div>, document.body
  )
}
