import { useState } from 'react'
import { createPortal } from 'react-dom'
import { TextField, NumberField, PillSelect, ToggleField, TextArea, Row, Section, ImageUploader, PriceFields, PreviewCard, BuyNowFields, FormFooter, ProgressBar, ChecklistField } from '../components/FormFields'
import styles from '../rentalFormStyles.module.css'

const TYPES = ['Portable Table', 'Stationary Table', 'Massage Chair', 'Hot Stone Set', 'Accessories Kit']
const MATERIAL = ['Wood', 'Aluminum', 'Steel', 'Mixed']
const PADDING = ['2 inch', '3 inch', '4 inch', '5 inch']
const ACCESSORIES = ['Face Cradle', 'Armrest', 'Bolster', 'Carrying Case', 'Head Rest', 'Sheet Set', 'Oil Warmer', 'Towel Set']

export default function MassageEquipmentListingForm({ open, onClose, onSubmit }) {
  const [step, setStep] = useState(0)
  const [mainImage, setMainImage] = useState('')
  const [thumbs, setThumbs] = useState([])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [city, setCity] = useState('')
  const [equipType, setEquipType] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [weightCapacity, setWeightCapacity] = useState('')
  const [foldable, setFoldable] = useState(false)
  const [carryCase, setCarryCase] = useState(false)
  const [material, setMaterial] = useState('')
  const [padding, setPadding] = useState('')
  const [accessories, setAccessories] = useState([])
  const [delivery, setDelivery] = useState(false)
  const [setup, setSetup] = useState(false)
  const [cleaningFee, setCleaningFee] = useState('')
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
  const tags = [equipType, material, foldable && 'Foldable', carryCase && 'Carry Case', delivery && 'Delivery', setup && 'Setup Included'].filter(Boolean)
  const priceChange = (k, v) => { if (k === 'daily') setDaily(v); if (k === 'weekly') setWeekly(v); if (k === 'monthly') setMonthly(v); if (k === 'deposit') setDeposit(v); if (k === 'lateFee') setLateFee(v) }

  const handleSubmit = async () => {
    setSubmitting(true)
    await onSubmit?.({ category: 'Massage Equipment', title, description: desc, city, image: mainImage, images: [mainImage, ...thumbs].filter(Boolean), price_day: Number(daily), price_week: Number(weekly), price_month: Number(monthly), buy_now: buyNow ? { price: Number(buyNowPrice), negotiable } : null, extra_fields: { equipType, brand, model, weightCapacity, foldable, carryCase, material, padding, accessories, delivery, setup, cleaningFee, deposit, lateFee } })
    setSubmitting(false); setStep(4)
  }

  return createPortal(
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <div className={styles.headerTitle}><span className={styles.headerName}>💆 Massage Equipment</span><span className={styles.headerSub}>{['Photos & Info','Details','Pricing','Preview','Done'][step]}</span></div>
        <span className={styles.stepBadge}>{Math.min(step + 1, 4)}/4</span>
      </div>
      <ProgressBar current={step} total={4} />
      <div className={styles.content}>
        {step === 4 && <div className={styles.done}><span className={styles.doneIcon}>🎉</span><h2 className={styles.doneTitle}>Listed!</h2><p className={styles.doneSub}>Your massage equipment rental is live.</p><button className={styles.doneBtn} onClick={onClose}>Done</button></div>}
        {step === 0 && <div className={styles.form}>
          <Section icon="📸" title="Photos" /><ImageUploader mainImage={mainImage} thumbImages={thumbs} onSetMain={setMainImage} onAddThumb={u => setThumbs(p => [...p, u])} onRemoveThumb={i => setThumbs(p => p.filter((_, j) => j !== i))} onRemoveMain={() => setMainImage('')} />
          <Section icon="📝" title="Basic Info" /><TextField label="Title" value={title} onChange={setTitle} placeholder="e.g. Portable Massage Table" required /><TextArea label="Description" value={desc} onChange={setDesc} rows={3} /><TextField label="City" value={city} onChange={setCity} placeholder="Bali" required />
        </div>}
        {step === 1 && <div className={styles.form}>
          <Section icon="💆" title="Equipment Details" />
          <PillSelect label="Equipment Type" value={equipType} onChange={setEquipType} options={TYPES} required />
          <Row><TextField label="Brand" value={brand} onChange={setBrand} placeholder="Earthlite" /><TextField label="Model" value={model} onChange={setModel} /></Row>
          <NumberField label="Weight Capacity (kg)" value={weightCapacity} onChange={setWeightCapacity} placeholder="250" />
          <PillSelect label="Material" value={material} onChange={setMaterial} options={MATERIAL} />
          <PillSelect label="Padding Thickness" value={padding} onChange={setPadding} options={PADDING} />
          <ChecklistField label="Accessories Included" options={ACCESSORIES} selected={accessories} onChange={setAccessories} />
          <Section icon="✨" title="Services" />
          <ToggleField label="📦 Foldable / Portable" value={foldable} onChange={setFoldable} />
          <ToggleField label="🧳 Carrying Case Included" value={carryCase} onChange={setCarryCase} />
          <ToggleField label="🚚 Delivery Available" value={delivery} onChange={setDelivery} />
          <ToggleField label="🔧 Setup Included" value={setup} onChange={setSetup} />
          <NumberField label="Cleaning Fee (Rp)" value={cleaningFee} onChange={setCleaningFee} placeholder="0 = no fee" />
        </div>}
        {step === 2 && <div className={styles.form}><PriceFields daily={daily} weekly={weekly} monthly={monthly} deposit={deposit} lateFee={lateFee} onChange={priceChange} />
            <BuyNowFields enabled={buyNow} onToggle={setBuyNow} price={buyNowPrice} onPriceChange={setBuyNowPrice} negotiable={negotiable} onNegotiableChange={setNegotiable} /></div>}
        {step === 3 && <div className={styles.form}><PreviewCard title={title} city={city} category="Massage Equipment" subType={equipType} price={daily} image={mainImage} tags={tags} /></div>}
      </div>
      {step < 4 && <FormFooter step={step} onNext={() => step === 3 ? handleSubmit() : setStep(s => s + 1)} onDraft={() => {}} canNext={step === 0 ? !!title : step === 1 ? !!equipType : step === 2 ? !!daily : true} submitting={submitting} nextLabel={step === 3 ? 'Publish' : undefined} />}
    </div>, document.body
  )
}
