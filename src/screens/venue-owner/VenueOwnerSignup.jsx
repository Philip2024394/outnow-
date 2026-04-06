import { useState } from 'react'
import styles from './VenueOwnerSignup.module.css'

const VENUE_TYPES = ['Bar', 'Pub', 'Restaurant', 'Café', 'Wine Bar', 'Cocktail Bar', 'Club', 'Bowling Alley', 'Other']
const SERVES_DRINKS = ['Beer', 'Wine', 'Cocktails', 'Spirits', 'Non-Alcoholic', 'Coffee', 'Soft Drinks']
const SERVES_FOOD   = ['Full Menu', 'Snacks & Sharing', 'Pizza', 'Burgers / Fast Food', 'Fine Dining', 'Brunch', 'Vegan Options', 'Late Night Food']
const AMENITIES     = ['Free WiFi', 'Pool / Billiards Table', 'Dart Board', 'Board Games', 'Live Music', 'Sports TV', 'Karaoke', 'Outdoor Seating / Beer Garden', 'Private Hire Available', 'Accessible / Wheelchair']
const FOOD_DEALS    = ['Buy 1 Get 1 Free', 'Eat All You Can', 'Free Drink With Food', 'Happy Hour', 'Set Menu Deal', 'Student Discount', 'Group Discount']

function Section({ title, children }) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  )
}

function MultiSelect({ options, selected, onChange }) {
  const toggle = (opt) => {
    onChange(selected.includes(opt)
      ? selected.filter(o => o !== opt)
      : [...selected, opt]
    )
  }
  return (
    <div className={styles.chips}>
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          className={`${styles.chip} ${selected.includes(opt) ? styles.chipActive : ''}`}
          onClick={() => toggle(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default function VenueOwnerSignup({ onClose, onSubmit, plan = 'premium' }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    plan,
    name: '', address: '', city: '', postcode: '',
    type: '', openTime: '', closeTime: '',
    contact: '', email: '', instagram: '', website: '',
    drinks: [], food: [], amenities: [], deals: [],
    discountType: '', discountPercent: '',
    description: '',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const isStep1Valid = form.name && form.address && form.type
  const isStep2Valid = form.openTime && form.closeTime
  const isStep3Valid = form.email

  const handleSubmit = () => {
    onSubmit?.(form)
  }

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={step === 1 ? onClose : () => setStep(s => s - 1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className={styles.headerMid}>
          <span className={styles.headerTitle}>List Your Venue</span>
          <span className={styles.headerStep}>Step {step} of 3 · {plan === 'premium' ? '⭐ Premium' : 'Basic'}</span>
        </div>
        <div className={styles.stepDots}>
          {[1,2,3].map(n => <div key={n} className={`${styles.dot} ${step >= n ? styles.dotActive : ''}`} />)}
        </div>
      </div>

      <div className={styles.content}>

        {/* ── STEP 1: Basic details ── */}
        {step === 1 && (
          <>
            <Section title="Your Venue Details">
              <Field label="Venue Name *">
                <input className={styles.input} placeholder="e.g. The Neon Tap" value={form.name} onChange={e => set('name', e.target.value)} />
              </Field>
              <Field label="Address *">
                <input className={styles.input} placeholder="Street address" value={form.address} onChange={e => set('address', e.target.value)} />
              </Field>
              <div className={styles.row2}>
                <Field label="City *">
                  <input className={styles.input} placeholder="London" value={form.city} onChange={e => set('city', e.target.value)} />
                </Field>
                <Field label="Postcode">
                  <input className={styles.input} placeholder="W1A 1AA" value={form.postcode} onChange={e => set('postcode', e.target.value)} />
                </Field>
              </div>
              <Field label="Type of Venue *">
                <div className={styles.chips}>
                  {VENUE_TYPES.map(t => (
                    <button
                      key={t} type="button"
                      className={`${styles.chip} ${form.type === t ? styles.chipActive : ''}`}
                      onClick={() => set('type', t)}
                    >{t}</button>
                  ))}
                </div>
              </Field>
            </Section>

            <Section title="Short Description">
              <textarea
                className={styles.textarea}
                placeholder="Tell people what makes your venue special... (max 200 characters)"
                maxLength={200}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
              />
              <span className={styles.charCount}>{form.description.length}/200</span>
            </Section>
          </>
        )}

        {/* ── STEP 2: What you offer ── */}
        {step === 2 && (
          <>
            <Section title="Opening Hours">
              <div className={styles.row2}>
                <Field label="Opens">
                  <input type="time" className={styles.input} value={form.openTime} onChange={e => set('openTime', e.target.value)} />
                </Field>
                <Field label="Closes">
                  <input type="time" className={styles.input} value={form.closeTime} onChange={e => set('closeTime', e.target.value)} />
                </Field>
              </div>
            </Section>

            <Section title="Drinks Served">
              <MultiSelect options={SERVES_DRINKS} selected={form.drinks} onChange={v => set('drinks', v)} />
            </Section>

            <Section title="Food Served">
              <MultiSelect options={SERVES_FOOD} selected={form.food} onChange={v => set('food', v)} />
            </Section>

            <Section title="Amenities & Features">
              <MultiSelect options={AMENITIES} selected={form.amenities} onChange={v => set('amenities', v)} />
            </Section>

            <Section title="Current Deals">
              <MultiSelect options={FOOD_DEALS} selected={form.deals} onChange={v => set('deals', v)} />
            </Section>

            <Section title="Hangger Exclusive Discount (Optional)">
              <p className={styles.fieldHint}>Shown on your venue profile to every user who opens it — drives visits.</p>
              <div className={styles.row2}>
                <Field label="Discount %">
                  <input className={styles.input} type="number" placeholder="e.g. 15" min="1" max="100"
                    value={form.discountPercent} onChange={e => set('discountPercent', e.target.value)} />
                </Field>
                <Field label="Applies to">
                  <input className={styles.input} placeholder="e.g. Drinks, Food" value={form.discountType} onChange={e => set('discountType', e.target.value)} />
                </Field>
              </div>
            </Section>
          </>
        )}

        {/* ── STEP 3: Contact & launch ── */}
        {step === 3 && (
          <>
            <Section title="Contact Details">
              <Field label="Email Address *">
                <input className={styles.input} type="email" placeholder="you@yourvenue.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </Field>
              <Field label="Phone Number">
                <input className={styles.input} type="tel" placeholder="+44 7700 900000" value={form.contact} onChange={e => set('contact', e.target.value)} />
              </Field>
              <Field label="Instagram Handle">
                <input className={styles.input} placeholder="@yourvenue" value={form.instagram} onChange={e => set('instagram', e.target.value)} />
              </Field>
              <Field label="Website">
                <input className={styles.input} placeholder="https://yourvenue.com" value={form.website} onChange={e => set('website', e.target.value)} />
              </Field>
            </Section>

            {/* Summary */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}>
                <span className={styles.summaryIcon}>📍</span>
                <div>
                  <p className={styles.summaryName}>{form.name || 'Your Venue'}</p>
                  <p className={styles.summaryType}>{form.type} · {form.city || 'London'}</p>
                </div>
              </div>
              {form.drinks.length > 0 && <p className={styles.summaryLine}>🍺 {form.drinks.join(' · ')}</p>}
              {form.food.length > 0   && <p className={styles.summaryLine}>🍕 {form.food.join(' · ')}</p>}
              {form.amenities.length > 0 && <p className={styles.summaryLine}>✨ {form.amenities.join(' · ')}</p>}
            </div>

            <div className={styles.pricingReminder}>
              {plan === 'premium'
                ? <><span className={styles.pricingBadge}>🎉 First Month Free</span><p className={styles.pricingText}>Then $10.99/month · Cancel anytime</p></>
                : <><span className={`${styles.pricingBadge} ${styles.pricingBadgeFree}`}>✓ Basic Listing — Free Forever</span><p className={styles.pricingText}>No payment needed · Upgrade anytime</p></>
              }
            </div>
          </>
        )}

      </div>

      {/* Footer CTA */}
      <div className={styles.footer}>
        {step < 3
          ? <button
              className={`${styles.nextBtn} ${(!isStep1Valid && step === 1) || (!isStep2Valid && step === 2) ? styles.nextBtnDisabled : ''}`}
              disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
              onClick={() => setStep(s => s + 1)}
            >
              Continue →
            </button>
          : <button
              className={`${styles.nextBtn} ${!isStep3Valid ? styles.nextBtnDisabled : ''}`}
              disabled={!isStep3Valid}
              onClick={handleSubmit}
            >
              🚀 Go Live — Free First Month
            </button>
        }
      </div>
    </div>
  )
}
