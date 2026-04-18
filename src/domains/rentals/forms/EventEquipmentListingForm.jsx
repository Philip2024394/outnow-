import { useState } from 'react'
import { createPortal } from 'react-dom'
import { TextField, NumberField, PillSelect, ToggleField, TextArea, Row, Section, ImageUploader, PriceFields, PreviewCard, BuyNowFields, FormFooter, ProgressBar } from '../components/FormFields'
import styles from '../rentalFormStyles.module.css'

const TYPES = ['Sound System / PA', 'Lighting Rig', 'Stage / Platform', 'Tables & Chairs', 'Tent / Canopy', 'Decoration Set', 'Projector & Screen', 'Photo Booth', 'Catering Equipment', 'Generator']
const POWER = ['No Power Needed', '220V Standard', '3-Phase', 'Generator Included']

export default function EventEquipmentListingForm({ open, onClose, onSubmit }) {
  const [step, setStep] = useState(0)
  const [mainImage, setMainImage] = useState('')
  const [thumbs, setThumbs] = useState([])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [city, setCity] = useState('')
  const [equipType, setEquipType] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [power, setPower] = useState('')
  const [setupIncl, setSetupIncl] = useState(false)
  const [setupFee, setSetupFee] = useState('')
  const [deliveryIncl, setDeliveryIncl] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState('')
  const [techIncl, setTechIncl] = useState(false)
  const [techFee, setTechFee] = useState('')
  const [insuranceAvail, setInsuranceAvail] = useState(false)
  const [damageDep, setDamageDep] = useState('')
  const [cleaningFee, setCleaningFee] = useState('')
  const [capacity, setCapacity] = useState('')
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
  const tags = [equipType, power !== 'No Power Needed' && power, setupIncl && 'Setup Incl.', techIncl && 'Technician', deliveryIncl && 'Delivery', capacity && `${capacity} capacity`].filter(Boolean)
  const priceChange = (k, v) => { if (k === 'daily') setDaily(v); if (k === 'weekly') setWeekly(v); if (k === 'monthly') setMonthly(v); if (k === 'deposit') setDeposit(v); if (k === 'lateFee') setLateFee(v) }

  const handleSubmit = async () => {
    setSubmitting(true)
    await onSubmit?.({ category: 'Event Equipment', title, description: desc, city, image: mainImage, images: [mainImage, ...thumbs].filter(Boolean), price_day: Number(daily), price_week: Number(weekly), price_month: Number(monthly), buy_now: buyNow ? { price: Number(buyNowPrice), negotiable } : null, extra_fields: { equipType, brand, model, power, setupIncl, setupFee, deliveryIncl, deliveryFee, techIncl, techFee, insuranceAvail, damageDep, cleaningFee, capacity, deposit, lateFee } })
    setSubmitting(false); setStep(4)
  }

  return createPortal(
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <div className={styles.headerTitle}><span className={styles.headerName}>🎉 Event Equipment</span><span className={styles.headerSub}>{['Photos & Info','Details','Pricing','Preview','Done'][step]}</span></div>
        <span className={styles.stepBadge}>{Math.min(step + 1, 4)}/4</span>
      </div>
      <ProgressBar current={step} total={4} />
      <div className={styles.content}>
        {step === 4 && <div className={styles.done}><span className={styles.doneIcon}>🎉</span><h2 className={styles.doneTitle}>Listed!</h2><p className={styles.doneSub}>Your event equipment rental is live.</p><button className={styles.doneBtn} onClick={onClose}>Done</button></div>}
        {step === 0 && <div className={styles.form}>
          <Section icon="📸" title="Photos" /><ImageUploader mainImage={mainImage} thumbImages={thumbs} onSetMain={setMainImage} onAddThumb={u => setThumbs(p => [...p, u])} onRemoveThumb={i => setThumbs(p => p.filter((_, j) => j !== i))} onRemoveMain={() => setMainImage('')} />
          <Section icon="📝" title="Basic Info" /><TextField label="Title" value={title} onChange={setTitle} placeholder="e.g. 5000W PA System + DJ Setup" required /><TextArea label="Description" value={desc} onChange={setDesc} rows={3} /><TextField label="City" value={city} onChange={setCity} required />
        </div>}
        {step === 1 && <div className={styles.form}>
          <Section icon="🎉" title="Equipment Details" />
          <PillSelect label="Equipment Type" value={equipType} onChange={setEquipType} options={TYPES} required />
          <Row><TextField label="Brand" value={brand} onChange={setBrand} /><TextField label="Model" value={model} onChange={setModel} /></Row>
          <PillSelect label="Power Requirements" value={power} onChange={setPower} options={POWER} />
          <TextField label="Capacity / Coverage" value={capacity} onChange={setCapacity} placeholder="e.g. 200 people, 10x20m" />
          <Section icon="🔧" title="Services & Fees" />
          <ToggleField label="🔧 Setup & Teardown Included" value={setupIncl} onChange={setSetupIncl} />
          {setupIncl && <NumberField label="Setup Fee (Rp)" value={setupFee} onChange={setSetupFee} placeholder="0 = free" />}
          <ToggleField label="🚚 Delivery Included" value={deliveryIncl} onChange={setDeliveryIncl} />
          {deliveryIncl && <NumberField label="Delivery Fee (Rp)" value={deliveryFee} onChange={setDeliveryFee} placeholder="0 = free" />}
          <ToggleField label="👨‍🔧 Technician / Operator" value={techIncl} onChange={setTechIncl} />
          {techIncl && <NumberField label="Technician Fee (Rp)" value={techFee} onChange={setTechFee} placeholder="Per event" />}
          <ToggleField label="🛡️ Insurance Available" value={insuranceAvail} onChange={setInsuranceAvail} />
          <Row><NumberField label="Damage Deposit (Rp)" value={damageDep} onChange={setDamageDep} placeholder="500000" /><NumberField label="Cleaning Fee (Rp)" value={cleaningFee} onChange={setCleaningFee} placeholder="0" /></Row>
        </div>}
        {step === 2 && <div className={styles.form}><PriceFields daily={daily} weekly={weekly} monthly={monthly} deposit={deposit} lateFee={lateFee} onChange={priceChange} />
            <BuyNowFields enabled={buyNow} onToggle={setBuyNow} price={buyNowPrice} onPriceChange={setBuyNowPrice} negotiable={negotiable} onNegotiableChange={setNegotiable} /></div>}
        {step === 3 && <div className={styles.form}><PreviewCard title={title} city={city} category="Event" subType={equipType} price={daily} image={mainImage} tags={tags} /></div>}
      </div>
      {step < 4 && <FormFooter step={step} onNext={() => step === 3 ? handleSubmit() : setStep(s => s + 1)} onDraft={() => {}} canNext={step === 0 ? !!title : step === 1 ? !!equipType : step === 2 ? !!daily : true} submitting={submitting} nextLabel={step === 3 ? 'Publish' : undefined} />}
    </div>, document.body
  )
}
