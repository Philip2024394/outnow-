import { useState } from 'react'
import { createPortal } from 'react-dom'
import { TextField, NumberField, SelectField, PillSelect, ToggleField, TextArea, Row, Section, ImageUploader, PriceFields, PreviewCard, BuyNowFields, FormFooter, ProgressBar } from '../components/FormFields'
import styles from '../rentalFormStyles.module.css'

const TRANS = ['Automatic', 'Manual', 'CVT']
const FUEL_TYPE = ['Petrol', 'Diesel', 'Electric', 'Hybrid']
const FUEL_POLICY = ['Full to Full', 'Pay Per Use', 'Fuel Included']
const INSURANCE = ['Fully Insured', 'CDW Available', 'Not Insured']
const LICENSE = ['SIM A', 'International License']
const COLORS = ['Black', 'White', 'Red', 'Blue', 'Silver', 'Grey', 'Brown', 'Green', 'Custom']
const SEATS = ['2', '4', '5', '7', '8', '9', '12', '16']

export default function CarListingForm({ open, onClose, onSubmit }) {
  const [step, setStep] = useState(0)
  const [mainImage, setMainImage] = useState('')
  const [thumbs, setThumbs] = useState([])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [city, setCity] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [trans, setTrans] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [seats, setSeats] = useState('5')
  const [color, setColor] = useState([])
  const [plateNo, setPlateNo] = useState('')
  const [insurance, setInsurance] = useState('')
  const [fuelPolicy, setFuelPolicy] = useState('')
  const [delivery, setDelivery] = useState(false)
  const [childSeat, setChildSeat] = useState(false)
  const [gps, setGps] = useState(false)
  const [bluetooth, setBluetooth] = useState(false)
  const [backupCam, setBackupCam] = useState(false)
  const [parkingSensors, setParkingSensors] = useState(false)
  const [withDriver, setWithDriver] = useState(false)
  const [driverFee, setDriverFee] = useState('')
  const [minAge, setMinAge] = useState('21')
  const [license, setLicense] = useState('')
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

  const tags = [trans, fuelType, `${seats} seats`, insurance, withDriver && 'With Driver', gps && 'GPS', delivery && 'Delivery'].filter(Boolean)
  const priceChange = (k, v) => { if (k === 'daily') setDaily(v); if (k === 'weekly') setWeekly(v); if (k === 'monthly') setMonthly(v); if (k === 'deposit') setDeposit(v); if (k === 'lateFee') setLateFee(v) }

  const handleSubmit = async () => {
    setSubmitting(true)
    await onSubmit?.({
      category: 'Cars', title, description: desc, city, image: mainImage,
      images: [mainImage, ...thumbs].filter(Boolean),
      price_day: Number(daily), price_week: Number(weekly), price_month: Number(monthly),
      buy_now: buyNow ? { price: Number(buyNowPrice), negotiable } : null, extra_fields: { make, model, year, transmission: trans, fuelType, seats, colors: color, plateNo, insurance, fuelPolicy, delivery, childSeat, gps, bluetooth, backupCam, parkingSensors, withDriver, driverFee, minAge, license, deposit, lateFee },
    })
    setSubmitting(false); setStep(5)
  }

  return createPortal(
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className={styles.headerTitle}>
          <span className={styles.headerName}>🚗 Car Rental</span>
          <span className={styles.headerSub}>{['Photos','Specifications','Extras','Pricing','Preview','Done'][step]}</span>
        </div>
        <span className={styles.stepBadge}>{Math.min(step + 1, 5)}/5</span>
      </div>
      <ProgressBar current={step} total={5} />

      <div className={styles.content}>
        {step === 5 && <div className={styles.done}><span className={styles.doneIcon}>🎉</span><h2 className={styles.doneTitle}>Listing Published!</h2><p className={styles.doneSub}>Your car rental is now live.</p><button className={styles.doneBtn} onClick={onClose}>Done</button></div>}

        {step === 0 && (
          <div className={styles.form}>
            <Section icon="📸" title="Photos" sub="Cover photo + gallery" />
            <ImageUploader mainImage={mainImage} thumbImages={thumbs} onSetMain={setMainImage} onAddThumb={u => setThumbs(p => [...p, u])} onRemoveThumb={i => setThumbs(p => p.filter((_, j) => j !== i))} onRemoveMain={() => setMainImage('')} />
            <Section icon="📝" title="Basic Info" />
            <TextField label="Listing Title" value={title} onChange={setTitle} placeholder="e.g. Toyota Avanza 2022 - Self Drive" required />
            <TextArea label="Description" value={desc} onChange={setDesc} placeholder="Describe your car — condition, features, experience..." rows={4} />
            <TextField label="City / Location" value={city} onChange={setCity} placeholder="e.g. Bali, Jakarta" required />
          </div>
        )}

        {step === 1 && (
          <div className={styles.form}>
            <Section icon="🚗" title="Car Specifications" />
            <Row><TextField label="Make" value={make} onChange={setMake} placeholder="Toyota" required /><TextField label="Model" value={model} onChange={setModel} placeholder="Avanza" required /></Row>
            <Row><NumberField label="Year" value={year} onChange={setYear} placeholder="2022" /><PillSelect label="Seats" value={seats} onChange={setSeats} options={SEATS} /></Row>
            <PillSelect label="Transmission" value={trans} onChange={setTrans} options={TRANS} required />
            <PillSelect label="Fuel Type" value={fuelType} onChange={setFuelType} options={FUEL_TYPE} required />
            <TextField label="Plate Number" value={plateNo} onChange={setPlateNo} placeholder="B 1234 ABC" />
            <Section icon="🎨" title="Colors" />
            <div className={styles.checkGrid}>
              {COLORS.map(c => { const a = color.includes(c); return <button key={c} className={`${styles.checkItem} ${a ? styles.checkItemActive : ''}`} onClick={() => setColor(p => a ? p.filter(x => x !== c) : [...p, c])}><span className={`${styles.checkBox} ${a ? styles.checkBoxActive : ''}`}>{a ? '✓' : ''}</span><span className={styles.checkLabel}>{c}</span></button> })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.form}>
            <Section icon="🛡️" title="Insurance & Policy" />
            <PillSelect label="Insurance" value={insurance} onChange={setInsurance} options={INSURANCE} required />
            <PillSelect label="Fuel Policy" value={fuelPolicy} onChange={setFuelPolicy} options={FUEL_POLICY} required />
            <PillSelect label="License Required" value={license} onChange={setLicense} options={LICENSE} />
            <NumberField label="Minimum Driver Age" value={minAge} onChange={setMinAge} placeholder="21" />
            <Section icon="🚐" title="Driver Option" />
            <ToggleField label="With Driver Available" value={withDriver} onChange={setWithDriver} />
            {withDriver && <NumberField label="Driver Fee Per Day (Rp)" value={driverFee} onChange={setDriverFee} placeholder="200000" />}
            <Section icon="✨" title="Features" />
            <ToggleField label="🚚 Delivery to Hotel/Airport" value={delivery} onChange={setDelivery} />
            <ToggleField label="👶 Child Seat Available" value={childSeat} onChange={setChildSeat} />
            <ToggleField label="📍 GPS / Navigation" value={gps} onChange={setGps} />
            <ToggleField label="🔊 Bluetooth / AUX" value={bluetooth} onChange={setBluetooth} />
            <ToggleField label="📷 Backup Camera" value={backupCam} onChange={setBackupCam} />
            <ToggleField label="📡 Parking Sensors" value={parkingSensors} onChange={setParkingSensors} />
          </div>
        )}

        {step === 3 && <div className={styles.form}><PriceFields daily={daily} weekly={weekly} monthly={monthly} deposit={deposit} lateFee={lateFee} onChange={priceChange} />
            <BuyNowFields enabled={buyNow} onToggle={setBuyNow} price={buyNowPrice} onPriceChange={setBuyNowPrice} negotiable={negotiable} onNegotiableChange={setNegotiable} /></div>}
        {step === 4 && <div className={styles.form}><PreviewCard title={title} city={city} category="Car" subType={`${make} ${model}`} price={daily} image={mainImage} tags={tags} /></div>}
      </div>

      {step < 5 && <FormFooter step={step} onNext={() => step === 4 ? handleSubmit() : setStep(s => s + 1)} onDraft={() => {}} canNext={step === 0 ? !!title : step === 1 ? !!(make && trans) : step === 3 ? !!daily : true} submitting={submitting} nextLabel={step === 4 ? 'Publish Listing' : undefined} />}
    </div>,
    document.body
  )
}
