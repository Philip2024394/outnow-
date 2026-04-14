/**
 * ProfileBioSection — bio text, DOB, name, country/city, interests (Let's Meet With),
 * looking-for trigger, languages, star sign, height, deal breakers, voice intro,
 * mood light, search tags, and all Maker/business fields (brand, price, market,
 * business hours, trade role, cuisine, target audience, shop type).
 *
 * All state is managed in ProfileScreen and passed as props. This component
 * renders controlled fields only — no local state except UI-only toggles that
 * live in the sheet components themselves.
 *
 * // TODO: split into smaller per-category sections when dependencies are untangled
 */
import { useRef } from 'react'
import { ACTIVITY_TYPES, ACTIVITY_CATEGORIES } from '@/firebase/collections'
import { LOOKING_FOR_OPTIONS, LANGUAGE_FLAGS, subCategoryText } from '@/utils/lookingForLabels'
import { TRADE_ROLE_GROUPS } from '@/components/ui/TradeRoleSheet'
import { WORLD_CUISINES } from '@/components/ui/CuisineSheet'
import { SHOP_TYPE_OPTIONS } from '@/components/ui/ShopTypeSheet'
import { getCategoryCopy } from '@/constants/categoryCopy'
import DriverDocumentUpload from '@/components/driver/DriverDocumentUpload'
import OnlineToggle from '@/components/driver/OnlineToggle'
import styles from '../ProfileScreen.module.css'

// ── Inline help tip (self-contained UI widget) ───────────────────────────────
import { useState, useCallback, useEffect } from 'react'

function HelpTip({ text }) {
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)

  const toggle = useCallback(() => {
    setOpen(p => {
      if (!p) {
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setOpen(false), 6000)
      }
      return !p
    })
  }, [])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <span className={helpStyles.wrap}>
      <button className={helpStyles.btn} onClick={toggle} aria-label="Help" type="button">?</button>
      {open && <span className={helpStyles.tip}>{text}</span>}
    </span>
  )
}

const helpStyles = {
  wrap:  { display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative', verticalAlign: 'middle' },
  btn:   { width: 18, height: 18, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)', color: '#8DC63F', fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1, fontFamily: 'inherit', padding: 0 },
  tip:   { position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 60, background: '#1c1c1c', border: '1px solid rgba(141,198,63,0.25)', borderRadius: 12, padding: '10px 13px', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, whiteSpace: 'normal', width: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' },
}

// ── Country data ─────────────────────────────────────────────────────────────
const COUNTRY_NATIVE_LANGUAGE = {
  'Indonesia': 'Indonesian', 'Philippines': 'Filipino', 'Vietnam': 'Vietnamese',
  'Thailand': 'Thai', 'Malaysia': 'Malay', 'Singapore': 'English',
  'Japan': 'Japanese', 'South Korea': 'Korean', 'China': 'Mandarin',
  'India': 'Hindi', 'Pakistan': 'Urdu', 'Bangladesh': 'Bengali',
  'United Kingdom': 'English', 'United States': 'English', 'Australia': 'English',
  'Canada': 'English', 'Ireland': 'English', 'New Zealand': 'English',
  'France': 'French', 'Germany': 'German', 'Spain': 'Spanish',
  'Italy': 'Italian', 'Portugal': 'Portuguese', 'Brazil': 'Portuguese',
  'Mexico': 'Spanish', 'Argentina': 'Spanish', 'Colombia': 'Spanish',
  'Russia': 'Russian', 'Ukraine': 'Ukrainian', 'Poland': 'Polish',
  'Netherlands': 'Dutch', 'Belgium': 'Dutch', 'Sweden': 'Swedish',
  'Norway': 'Norwegian', 'Denmark': 'Danish', 'Finland': 'Finnish',
  'Turkey': 'Turkish', 'Saudi Arabia': 'Arabic', 'Egypt': 'Arabic',
  'Nigeria': 'English', 'Ghana': 'English', 'South Africa': 'English',
  'Kenya': 'Swahili', 'Ethiopia': 'Amharic', 'Tanzania': 'Swahili',
}

const COUNTRIES = [
  { name: 'Afghanistan',             flag: '🇦🇫' },
  { name: 'Albania',                 flag: '🇦🇱' },
  { name: 'Algeria',                 flag: '🇩🇿' },
  { name: 'Andorra',                 flag: '🇦🇩' },
  { name: 'Angola',                  flag: '🇦🇴' },
  { name: 'Argentina',               flag: '🇦🇷' },
  { name: 'Armenia',                 flag: '🇦🇲' },
  { name: 'Australia',               flag: '🇦🇺' },
  { name: 'Austria',                 flag: '🇦🇹' },
  { name: 'Azerbaijan',              flag: '🇦🇿' },
  { name: 'Bahamas',                 flag: '🇧🇸' },
  { name: 'Bahrain',                 flag: '🇧🇭' },
  { name: 'Bangladesh',              flag: '🇧🇩' },
  { name: 'Belarus',                 flag: '🇧🇾' },
  { name: 'Belgium',                 flag: '🇧🇪' },
  { name: 'Belize',                  flag: '🇧🇿' },
  { name: 'Benin',                   flag: '🇧🇯' },
  { name: 'Bolivia',                 flag: '🇧🇴' },
  { name: 'Bosnia and Herzegovina',  flag: '🇧🇦' },
  { name: 'Botswana',                flag: '🇧🇼' },
  { name: 'Brazil',                  flag: '🇧🇷' },
  { name: 'Brunei',                  flag: '🇧🇳' },
  { name: 'Bulgaria',                flag: '🇧🇬' },
  { name: 'Burkina Faso',            flag: '🇧🇫' },
  { name: 'Cambodia',                flag: '🇰🇭' },
  { name: 'Cameroon',                flag: '🇨🇲' },
  { name: 'Canada',                  flag: '🇨🇦' },
  { name: 'Chile',                   flag: '🇨🇱' },
  { name: 'China',                   flag: '🇨🇳' },
  { name: 'Colombia',                flag: '🇨🇴' },
  { name: 'Congo',                   flag: '🇨🇬' },
  { name: 'Costa Rica',              flag: '🇨🇷' },
  { name: 'Croatia',                 flag: '🇭🇷' },
  { name: 'Cuba',                    flag: '🇨🇺' },
  { name: 'Cyprus',                  flag: '🇨🇾' },
  { name: 'Czech Republic',          flag: '🇨🇿' },
  { name: 'Denmark',                 flag: '🇩🇰' },
  { name: 'Dominican Republic',      flag: '🇩🇴' },
  { name: 'Ecuador',                 flag: '🇪🇨' },
  { name: 'Egypt',                   flag: '🇪🇬' },
  { name: 'El Salvador',             flag: '🇸🇻' },
  { name: 'Estonia',                 flag: '🇪🇪' },
  { name: 'Ethiopia',                flag: '🇪🇹' },
  { name: 'Fiji',                    flag: '🇫🇯' },
  { name: 'Finland',                 flag: '🇫🇮' },
  { name: 'France',                  flag: '🇫🇷' },
  { name: 'Georgia',                 flag: '🇬🇪' },
  { name: 'Germany',                 flag: '🇩🇪' },
  { name: 'Ghana',                   flag: '🇬🇭' },
  { name: 'Greece',                  flag: '🇬🇷' },
  { name: 'Guatemala',               flag: '🇬🇹' },
  { name: 'Honduras',                flag: '🇭🇳' },
  { name: 'Hungary',                 flag: '🇭🇺' },
  { name: 'Iceland',                 flag: '🇮🇸' },
  { name: 'India',                   flag: '🇮🇳' },
  { name: 'Indonesia',               flag: '🇮🇩' },
  { name: 'Iran',                    flag: '🇮🇷' },
  { name: 'Iraq',                    flag: '🇮🇶' },
  { name: 'Ireland',                 flag: '🇮🇪' },
  { name: 'Israel',                  flag: '🇮🇱' },
  { name: 'Italy',                   flag: '🇮🇹' },
  { name: 'Jamaica',                 flag: '🇯🇲' },
  { name: 'Japan',                   flag: '🇯🇵' },
  { name: 'Jordan',                  flag: '🇯🇴' },
  { name: 'Kazakhstan',              flag: '🇰🇿' },
  { name: 'Kenya',                   flag: '🇰🇪' },
  { name: 'Kosovo',                  flag: '🇽🇰' },
  { name: 'Kuwait',                  flag: '🇰🇼' },
  { name: 'Kyrgyzstan',              flag: '🇰🇬' },
  { name: 'Latvia',                  flag: '🇱🇻' },
  { name: 'Lebanon',                 flag: '🇱🇧' },
  { name: 'Libya',                   flag: '🇱🇾' },
  { name: 'Lithuania',               flag: '🇱🇹' },
  { name: 'Luxembourg',              flag: '🇱🇺' },
  { name: 'Malaysia',                flag: '🇲🇾' },
  { name: 'Maldives',                flag: '🇲🇻' },
  { name: 'Malta',                   flag: '🇲🇹' },
  { name: 'Mexico',                  flag: '🇲🇽' },
  { name: 'Moldova',                 flag: '🇲🇩' },
  { name: 'Monaco',                  flag: '🇲🇨' },
  { name: 'Mongolia',                flag: '🇲🇳' },
  { name: 'Montenegro',              flag: '🇲🇪' },
  { name: 'Morocco',                 flag: '🇲🇦' },
  { name: 'Mozambique',              flag: '🇲🇿' },
  { name: 'Myanmar',                 flag: '🇲🇲' },
  { name: 'Nepal',                   flag: '🇳🇵' },
  { name: 'Netherlands',             flag: '🇳🇱' },
  { name: 'New Zealand',             flag: '🇳🇿' },
  { name: 'Nicaragua',               flag: '🇳🇮' },
  { name: 'Nigeria',                 flag: '🇳🇬' },
  { name: 'North Macedonia',         flag: '🇲🇰' },
  { name: 'Norway',                  flag: '🇳🇴' },
  { name: 'Oman',                    flag: '🇴🇲' },
  { name: 'Pakistan',                flag: '🇵🇰' },
  { name: 'Panama',                  flag: '🇵🇦' },
  { name: 'Paraguay',                flag: '🇵🇾' },
  { name: 'Peru',                    flag: '🇵🇪' },
  { name: 'Philippines',             flag: '🇵🇭' },
  { name: 'Poland',                  flag: '🇵🇱' },
  { name: 'Portugal',                flag: '🇵🇹' },
  { name: 'Qatar',                   flag: '🇶🇦' },
  { name: 'Romania',                 flag: '🇷🇴' },
  { name: 'Russia',                  flag: '🇷🇺' },
  { name: 'Rwanda',                  flag: '🇷🇼' },
  { name: 'Saudi Arabia',            flag: '🇸🇦' },
  { name: 'Senegal',                 flag: '🇸🇳' },
  { name: 'Serbia',                  flag: '🇷🇸' },
  { name: 'Singapore',               flag: '🇸🇬' },
  { name: 'Slovakia',                flag: '🇸🇰' },
  { name: 'Slovenia',                flag: '🇸🇮' },
  { name: 'Somalia',                 flag: '🇸🇴' },
  { name: 'South Africa',            flag: '🇿🇦' },
  { name: 'South Korea',             flag: '🇰🇷' },
  { name: 'Spain',                   flag: '🇪🇸' },
  { name: 'Sri Lanka',               flag: '🇱🇰' },
  { name: 'Sudan',                   flag: '🇸🇩' },
  { name: 'Sweden',                  flag: '🇸🇪' },
  { name: 'Switzerland',             flag: '🇨🇭' },
  { name: 'Syria',                   flag: '🇸🇾' },
  { name: 'Taiwan',                  flag: '🇹🇼' },
  { name: 'Tanzania',                flag: '🇹🇿' },
  { name: 'Thailand',                flag: '🇹🇭' },
  { name: 'Tunisia',                 flag: '🇹🇳' },
  { name: 'Turkey',                  flag: '🇹🇷' },
  { name: 'Uganda',                  flag: '🇺🇬' },
  { name: 'Ukraine',                 flag: '🇺🇦' },
  { name: 'United Arab Emirates',    flag: '🇦🇪' },
  { name: 'United Kingdom',          flag: '🇬🇧' },
  { name: 'United States',           flag: '🇺🇸' },
  { name: 'Uruguay',                 flag: '🇺🇾' },
  { name: 'Uzbekistan',              flag: '🇺🇿' },
  { name: 'Venezuela',               flag: '🇻🇪' },
  { name: 'Vietnam',                 flag: '🇻🇳' },
  { name: 'Yemen',                   flag: '🇾🇪' },
  { name: 'Zambia',                  flag: '🇿🇲' },
  { name: 'Zimbabwe',                flag: '🇿🇼' },
]

const DATING_REL_GOAL_OPTIONS = [
  { value: 'casual',  emoji: '😊', label: 'Casual & Fun',        sub: 'Keeping it light and fun' },
  { value: 'serious', emoji: '💍', label: 'Something Serious',   sub: 'Looking for a real connection' },
  { value: 'open',    emoji: '🌻', label: 'Open to Everything',  sub: 'Not sure yet — just seeing what happens' },
  { value: 'friends', emoji: '👋', label: 'Friends First',       sub: 'Start as friends and see where it goes' },
]

const DATING_STAR_SIGNS = [
  { value: 'Aries',       emoji: '♈', label: 'Aries',       sub: '21 Mar – 19 Apr' },
  { value: 'Taurus',      emoji: '♉', label: 'Taurus',      sub: '20 Apr – 20 May' },
  { value: 'Gemini',      emoji: '♊', label: 'Gemini',      sub: '21 May – 20 Jun' },
  { value: 'Cancer',      emoji: '♋', label: 'Cancer',      sub: '21 Jun – 22 Jul' },
  { value: 'Leo',         emoji: '♌', label: 'Leo',         sub: '23 Jul – 22 Aug' },
  { value: 'Virgo',       emoji: '♍', label: 'Virgo',       sub: '23 Aug – 22 Sep' },
  { value: 'Libra',       emoji: '♎', label: 'Libra',       sub: '23 Sep – 22 Oct' },
  { value: 'Scorpio',     emoji: '♏', label: 'Scorpio',     sub: '23 Oct – 21 Nov' },
  { value: 'Sagittarius', emoji: '♐', label: 'Sagittarius', sub: '22 Nov – 21 Dec' },
  { value: 'Capricorn',   emoji: '♑', label: 'Capricorn',   sub: '22 Dec – 19 Jan' },
  { value: 'Aquarius',    emoji: '♒', label: 'Aquarius',    sub: '20 Jan – 18 Feb' },
  { value: 'Pisces',      emoji: '♓', label: 'Pisces',      sub: '19 Feb – 20 Mar' },
]

export { COUNTRIES, COUNTRY_NATIVE_LANGUAGE, DATING_REL_GOAL_OPTIONS, DATING_STAR_SIGNS }

// All commerce/service/professional categories that unlock business fields
export const MAKER_CATEGORIES = [
  'buy_sell', 'fresh_produce', 'agri_goods', 'fashion', 'electronics', 'vehicles',
  'property', 'tools_equip', 'antiques', 'import_export',
  'trades', 'auto_repair', 'cleaning', 'garden', 'security', 'laundry', 'tailoring',
  'childcare', 'eldercare', 'pet_care', 'transport',
  'healthcare', 'beauty', 'fitness_pt', 'mental_health', 'alt_medicine', 'veterinary', 'pharmacy',
  'catering', 'restaurant', 'hotel_accom', 'tourism_guide', 'event_planning', 'bar_nightclub',
  'creative', 'content_creator', 'music_perform', 'music', 'photography', 'writing', 'fashion_design', 'art_craft',
  'handmade', 'craft_supplies', 'vintage', 'hardware', 'wellness',
  'business', 'technology', 'legal', 'engineering', 'sales_leads', 'consulting',
  'real_estate', 'marketing', 'media_pro',
  'hiring', 'freelance', 'domestic_work', 'agri_work', 'manufacturing', 'mining',
  'education', 'coaching',
]

const DEFAULT_HOURS = { open: '', close: '', closed: false }
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function ProfileBioSection({
  // Identity
  name, setName,
  dobDay, setDobDay,
  dobMonth, setDobMonth,
  dobYear, setDobYear,
  bio, setBio,
  // Location
  country, setCountry,
  countryQuery, setCountryQuery,
  countryOpen, setCountryOpen,
  countryRef,
  city, setCity,
  // Languages
  speakingNative, setSpeakingNative,
  speakingSecond,
  setLangPickerOpen,
  // Looking for
  lookingFor,
  subCategory,
  setIntentGridOpen,
  // Activity accordion
  selectedActivity, setSelectedActivity,
  expandedCategory, setExpandedCategory,
  // Dating
  relationshipGoal,
  setRelGoalOpen,
  starSign, setStarSign,
  setStarSignOpen,
  height, setHeight,
  dealBreakers, setDealBreakers,
  // Voice intro
  voiceIntroUrl, setVoiceIntroUrl,
  voiceRecording, setVoiceRecording,
  voiceProgress, setVoiceProgress,
  voiceMediaRef, voiceTimerRef,
  // Mood light
  moodLight, setMoodLight,
  // Maker / business fields
  tradeRole,
  setTradeRoleOpen,
  shopType, setShopType,
  setShopTypeOpen,
  cuisineType, setCuisineType,
  setCuisineOpen,
  targetAudience, setTargetAudience,
  brandName, setBrandName,
  priceMin, setPriceMin,
  priceMax, setPriceMax,
  market, setMarket,
  businessHours, setBusinessHours,
  // Driver fields
  driverAge, setDriverAge,
  vehicleModel, setVehicleModel,
  vehicleYear, setVehicleYear,
  vehicleColor, setVehicleColor,
  platePrefix, setPlatePrefix,
  userProfile,
  user,
  driverId,
  setEarningsOpen,
  setRestaurantDashOpen,
  // Tags
  tags, setTags,
  tagInput, setTagInput,
  // Status buttons
  pendingStatus,
  particles,
  handleStatusClick,
  mySession,
  showToast,
}) {
  const filteredCountries = countryQuery.length > 0
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(countryQuery.toLowerCase())).slice(0, 8)
    : COUNTRIES.slice(0, 8)

  const updateHour = (day, field, value) =>
    setBusinessHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))

  return (
    <>
      {/* ── Joined the app for ── */}
      <div className={styles.joinedWrap}>
        <span className={styles.joinedHeading}>Joined the app for</span>
        <button
          type="button"
          className={styles.lookingForTrigger}
          onClick={() => setIntentGridOpen(true)}
        >
          {lookingFor
            ? (() => {
                const opt = LOOKING_FOR_OPTIONS.find(o => o.value === lookingFor)
                if (!opt) return 'I\'m here for…'
                const subLabel = subCategory ? subCategoryText(lookingFor, subCategory) : null
                return (
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {opt.img
                        ? <img src={opt.img} alt={opt.label} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                        : <span>{opt.emoji}</span>
                      }
                      <span style={{ fontWeight: 700 }}>{opt.label}</span>
                    </span>
                    {subLabel && (
                      <span style={{ fontSize: 12, color: '#8DC63F', paddingLeft: 28 }}>{subLabel}</span>
                    )}
                  </span>
                )
              })()
            : <span className={styles.lookingForPlaceholder}>I'm here for… tap to choose</span>
          }
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.5 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      {/* ── Details section ── */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Your details</span>

        {/* Name */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Display Name</label>
            <HelpTip text="Shown on the map and in messages. Use your first name or a nickname — real names build more trust with matches." />
          </div>
          <input
            className={styles.fieldInput}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        {/* Date of Birth */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Date of Birth <span className={styles.requiredStar}>*</span></label>
            <HelpTip text="Required — used to confirm you're 18+ and to show your age to matches. Your exact birthday is never shared publicly." />
          </div>
          <div className={styles.dobRow}>
            <select className={styles.dobSelect} value={dobDay} onChange={e => setDobDay(e.target.value)}>
              <option value="">Day</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select className={styles.dobSelect} value={dobMonth} onChange={e => setDobMonth(e.target.value)}>
              <option value="">Month</option>
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select className={styles.dobSelect} value={dobYear} onChange={e => setDobYear(e.target.value)}>
              <option value="">Year</option>
              {Array.from({ length: 82 }, (_, i) => new Date().getFullYear() - 18 - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bio / Live feed opening text */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Bio</label>
            <HelpTip text="Tell people what makes you interesting! Profiles with a bio get 3× more messages. Keep it genuine — mention your interests, vibe, or what you're looking for." />
          </div>
          <textarea
            className={styles.bioInput}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell people what you're about…"
            rows={3}
            maxLength={350}
          />
          <span className={styles.bioCount}>{bio.length}/350</span>
          <ul className={styles.bioHints}>
            <li>This text appears on your <strong>Hangger Live</strong> feed card, visible to everyone browsing the live feed</li>
            <li>Max 350 characters including spaces</li>
            <li>Be clear and engaging — this is your first impression in the live feed</li>
          </ul>
        </div>

        {/* Country typeahead */}
        <div className={styles.fieldRow} ref={countryRef}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Country <span className={styles.requiredStar}>*</span></label>
            <HelpTip text="Required — helps us show your profile to people in the right region. Update this if you're travelling." />
          </div>
          <div className={styles.countryWrap}>
            <input
              className={styles.fieldInput}
              value={countryQuery}
              onChange={e => { setCountryQuery(e.target.value); setCountryOpen(e.target.value.length > 0) }}
              onBlur={() => setTimeout(() => setCountryOpen(false), 150)}
              placeholder="Type to search country…"
              autoComplete="off"
            />
            {countryOpen && filteredCountries.length > 0 && (
              <ul className={styles.countryDropdown}>
                {filteredCountries.map(c => (
                  <li
                    key={c.name}
                    className={styles.countryOption}
                    onMouseDown={() => {
                      setCountry(c.name)
                      setCountryQuery(c.name)
                      setCountryOpen(false)
                      setSpeakingNative(COUNTRY_NATIVE_LANGUAGE[c.name] ?? '')
                    }}
                  >
                    <span className={styles.countryFlag}>{c.flag}</span>
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Location / City */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Location <span className={styles.requiredStar}>*</span></label>
            <HelpTip text="Required — your city or area is used only to calculate distance between you and other users. It is never shown publicly. Without it you won't appear in local map searches." />
          </div>
          <input
            className={styles.fieldInput}
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Your city or area…"
          />
          <div className={styles.locationPrivacy}>
            <span className={styles.locationPrivacyIcon}>🔒</span>
            <span className={styles.locationPrivacyText}>
              Your location is <strong>never shared</strong> publicly — it is only used to calculate km distance and show you to people nearby. Not setting a location will cause errors on the map and prevent you from appearing to others near you.
            </span>
          </div>
        </div>

        {/* Search Tags */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Search Tags</label>
            <HelpTip text="Add keywords that describe what you offer or sell — e.g. 'leather handbags', 'handmade scarves', 'wedding dress'. People searching these words will find your profile. Max 10 tags." />
          </div>
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {tags.map(tag => (
                <span key={tag} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'rgba(141,198,63,0.12)', border: '1px solid rgba(141,198,63,0.35)',
                  borderRadius: 100, padding: '4px 10px',
                  fontSize: 12, fontWeight: 600, color: '#8DC63F',
                }}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                    style={{ background: 'none', border: 'none', color: 'rgba(141,198,63,0.6)', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 13 }}
                    aria-label={`Remove ${tag}`}
                  >×</button>
                </span>
              ))}
            </div>
          )}
          {tags.length < 10 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className={styles.fieldInput}
                value={tagInput}
                onChange={e => setTagInput(e.target.value.toLowerCase().slice(0, 25))}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                    e.preventDefault()
                    const t = tagInput.trim().replace(/,/g, '')
                    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
                    setTagInput('')
                  }
                }}
                placeholder="Type a tag and press Enter…"
                autoComplete="off"
              />
              <button
                type="button"
                className={styles.adjustBtn}
                style={{ flexShrink: 0, padding: '0 14px' }}
                onClick={() => {
                  const t = tagInput.trim().replace(/,/g, '')
                  if (t && !tags.includes(t)) setTags(prev => [...prev, t])
                  setTagInput('')
                }}
              >Add</button>
            </div>
          )}
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{tags.length}/10 tags</span>
        </div>

        {/* Speaking */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Speaking</label>
            <HelpTip text="Your native language is set automatically from your country. Add a second language if you speak one — it helps people know how to connect with you." />
          </div>
          <div className={styles.speakingRow}>
            <div className={styles.speakingNative}>
              <span className={styles.speakingNativeLabel}>Native</span>
              <span className={styles.speakingNativeValue}>{speakingNative ? `${LANGUAGE_FLAGS[speakingNative] ?? ''} ${speakingNative}` : '—'}</span>
            </div>
            <button
              type="button"
              className={styles.lookingForTrigger}
              style={{ flex: 1 }}
              onClick={() => setLangPickerOpen(true)}
            >
              {speakingSecond
                ? <span>{LANGUAGE_FLAGS[speakingSecond] ?? '🌐'} {speakingSecond}</span>
                : <span className={styles.lookingForPlaceholder}>+ Add second language</span>
              }
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Driver vehicle details ── */}
        {(lookingFor === 'car_taxi' || lookingFor === 'bike_ride') && (
          <div className={styles.driverVehicleSection}>
            <p className={styles.driverVehicleTitle}>
              {lookingFor === 'car_taxi' ? '🚗' : '🛵'} Your Vehicle Details
            </p>
            <div className={styles.driverVehicleGrid}>
              <label className={styles.driverVehicleLabel}>Your Age
                <input className={styles.driverVehicleInput} type="number" min="18" max="70" value={driverAge} onChange={e => setDriverAge(e.target.value)} placeholder="e.g. 28" />
              </label>
              <label className={styles.driverVehicleLabel}>{lookingFor === 'car_taxi' ? 'Car' : 'Bike'} Make & Model
                <input className={styles.driverVehicleInput} type="text" value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} placeholder={lookingFor === 'car_taxi' ? 'e.g. Toyota Avanza' : 'e.g. Honda Vario 125'} />
              </label>
              <label className={styles.driverVehicleLabel}>Year
                <input className={styles.driverVehicleInput} type="number" min="2000" max={new Date().getFullYear()} value={vehicleYear} onChange={e => setVehicleYear(e.target.value)} placeholder="e.g. 2022" />
              </label>
              <label className={styles.driverVehicleLabel}>Colour
                <input className={styles.driverVehicleInput} type="text" value={vehicleColor} onChange={e => setVehicleColor(e.target.value)} placeholder="e.g. Black" />
              </label>
              <label className={`${styles.driverVehicleLabel} ${styles.driverVehicleLabelFull}`}>Plate Number (first 4–6 characters)
                <input className={styles.driverVehicleInput} type="text" maxLength={8} value={platePrefix} onChange={e => setPlatePrefix(e.target.value.toUpperCase())} placeholder="e.g. AB 1234" />
              </label>
            </div>
            <p className={styles.driverVehicleNote}>These details are shown to passengers after booking. Save your profile to update.</p>
          </div>
        )}

        {/* Driver document upload + online toggle */}
        {(lookingFor === 'car_taxi' || lookingFor === 'bike_ride') && (
          <>
            <DriverDocumentUpload
              userId={user?.uid ?? user?.id}
              driverType={lookingFor}
            />
            {userProfile?.is_driver && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <OnlineToggle userId={driverId} />
                <button
                  onClick={() => setEarningsOpen(true)}
                  style={{
                    padding: '10px 24px', borderRadius: 12,
                    background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.3)',
                    color: '#8DC63F', fontSize: 14, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  💰 My Earnings & Trips
                </button>
              </div>
            )}
          </>
        )}

        {/* Restaurant owner section */}
        {lookingFor === 'restaurant_owner' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <p style={{ color: '#555', fontSize: 13, textAlign: 'center', margin: 0 }}>
              List your restaurant, manage your menu, and receive orders via WhatsApp.
            </p>
            <button
              onClick={() => setRestaurantDashOpen(true)}
              style={{
                width: '100%', padding: '16px', borderRadius: 14,
                background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.3)',
                color: '#F5C518', fontSize: 15, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              🍴 Open Restaurant Dashboard
            </button>
          </div>
        )}

        {/* Dating profile fields */}
        {lookingFor === 'dating' && (
          <>
            <div className={styles.fieldRow}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>Looking for</label>
                <HelpTip text="What kind of connection are you hoping to make? Be honest — it helps everyone find the right match." />
              </div>
              <button type="button" className={styles.lookingForTrigger} onClick={() => setRelGoalOpen(true)}>
                {relationshipGoal
                  ? (() => {
                      const opt = DATING_REL_GOAL_OPTIONS.find(o => o.value === relationshipGoal)
                      return opt ? <span>{opt.emoji} {opt.label}</span> : <span>{relationshipGoal}</span>
                    })()
                  : <span className={styles.lookingForPlaceholder}>Tap to choose…</span>
                }
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>Star Sign</label>
                <HelpTip text="Your star sign is shown on your dating profile — optional but adds a personal touch." />
              </div>
              <button type="button" className={styles.lookingForTrigger} onClick={() => setStarSignOpen(true)}>
                {starSign
                  ? (() => {
                      const s = DATING_STAR_SIGNS.find(o => o.value === starSign)
                      return s ? <span>{s.emoji} {s.label}</span> : <span>{starSign}</span>
                    })()
                  : <span className={styles.lookingForPlaceholder}>Tap to choose…</span>
                }
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {starSign && (
                <button type="button" className={styles.brandQuickBtn} onClick={() => setStarSign('')}>✕ Clear</button>
              )}
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>Height</label>
                <HelpTip text="Your height is shown as a chip on your dating card — optional." />
              </div>
              <input className={styles.fieldInput} value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 172 cm or 5ft 7" />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>Deal Breakers</label>
                <HelpTip text="Be upfront about what you can't compromise on — it saves everyone time." />
              </div>
              <textarea
                className={styles.fieldInput}
                value={dealBreakers}
                onChange={e => setDealBreakers(e.target.value.slice(0, 200))}
                placeholder="e.g. No smokers, must love dogs…"
                rows={3}
                style={{ resize: 'none', lineHeight: 1.5 }}
              />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{dealBreakers.length}/200</span>
            </div>
          </>
        )}

        {/* ── Voice Intro ── */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Voice Intro</label>
            <HelpTip text="Record a 7-second voice note. It plays automatically (muted) on your profile card — visitors tap to unmute. A great way to stand out." />
          </div>
          {voiceIntroUrl && !voiceRecording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <audio src={voiceIntroUrl} controls style={{ flex: 1, height: 34, borderRadius: 8 }} />
              <button
                type="button"
                onClick={() => setVoiceIntroUrl(null)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
                aria-label="Remove voice intro"
              >×</button>
            </div>
          )}
          {voiceRecording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, background: 'rgba(232,69,140,0.1)', border: '1px solid rgba(232,69,140,0.3)', borderRadius: 12, padding: '10px 14px' }}>
              <span style={{ color: '#E8458C', fontSize: 20, lineHeight: 1, animation: 'livePulse 1.5s ease-in-out infinite' }}>🎙️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Recording… {voiceProgress}s / 7s</div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(voiceProgress / 7) * 100}%`, background: '#E8458C', transition: 'width 1s linear', borderRadius: 2 }} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  voiceMediaRef.current?.stop()
                  clearInterval(voiceTimerRef.current)
                  setVoiceRecording(false)
                  setVoiceProgress(0)
                }}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}
              >Stop</button>
            </div>
          )}
          {!voiceRecording && (
            <button
              type="button"
              className={styles.adjustBtn}
              onClick={async () => {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                  const recorder = new MediaRecorder(stream)
                  const chunks = []
                  recorder.ondataavailable = e => chunks.push(e.data)
                  recorder.onstop = async () => {
                    stream.getTracks().forEach(t => t.stop())
                    const blob = new Blob(chunks, { type: 'audio/webm' })
                    const { supabase } = await import('../../lib/supabase')
                    const path = `voice-intros/${user?.id ?? 'anon'}.webm`
                    const { error } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'audio/webm' })
                    if (!error) {
                      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
                      setVoiceIntroUrl(publicUrl)
                    }
                    setVoiceRecording(false)
                    setVoiceProgress(0)
                  }
                  voiceMediaRef.current = recorder
                  recorder.start()
                  setVoiceRecording(true)
                  setVoiceProgress(0)
                  let elapsed = 0
                  voiceTimerRef.current = setInterval(() => {
                    elapsed++
                    setVoiceProgress(elapsed)
                    if (elapsed >= 7) {
                      recorder.stop()
                      clearInterval(voiceTimerRef.current)
                    }
                  }, 1000)
                } catch {
                  showToast('Microphone access is required to record a voice intro.')
                }
              }}
            >
              🎙️ {voiceIntroUrl ? 'Re-record' : 'Record 7-second intro'}
            </button>
          )}
        </div>

        {/* ── Mood Light ── */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Mood Light</label>
            <HelpTip text="A coloured glow ring around your profile card that signals your current energy. Visitors see it when they open your card." />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { value: 'warm', emoji: '🧡', label: 'Warm',  color: '#F97316' },
              { value: 'cool', emoji: '💙', label: 'Cool',  color: '#38BDF8' },
              { value: 'pink', emoji: '🩷', label: 'Pink',  color: '#F472B6' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMoodLight(moodLight === opt.value ? '' : opt.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 100,
                  background: moodLight === opt.value ? `${opt.color}22` : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${moodLight === opt.value ? opt.color : 'rgba(255,255,255,0.1)'}`,
                  color: moodLight === opt.value ? opt.color : 'rgba(255,255,255,0.55)',
                  fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                {opt.emoji} {opt.label}
                {moodLight === opt.value && <span style={{ fontSize: 11 }}>✓</span>}
              </button>
            ))}
          </div>
          {moodLight && (
            <button type="button" className={styles.brandQuickBtn} onClick={() => setMoodLight('')} style={{ marginTop: 6 }}>
              ✕ Clear mood light
            </button>
          )}
        </div>

        {/* ── Maker / business fields ── */}
        {MAKER_CATEGORIES.includes(lookingFor) && (
          <>
            <div className={styles.fieldRow}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>I am here to</label>
                <HelpTip text="Are you selling products or services, buying, or both? This helps people understand your intent straight away." />
              </div>
              <button type="button" className={styles.lookingForTrigger} onClick={() => setTradeRoleOpen(true)}>
                {tradeRole
                  ? (() => {
                      const opt = TRADE_ROLE_GROUPS.flatMap(g => g.options).find(o => o.value === tradeRole)
                      return opt ? <span>{opt.emoji} {opt.label}</span> : <span>{tradeRole}</span>
                    })()
                  : <span className={styles.lookingForPlaceholder}>Tap to choose…</span>
                }
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {getCategoryCopy(lookingFor).pageType !== null && (
              <div className={styles.fieldRow}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Profile Tab Type</label>
                  <HelpTip text="Choose what your profile tab shows visitors — your products, services, or a menu." />
                </div>
                <button type="button" className={styles.lookingForTrigger} onClick={() => setShopTypeOpen(true)}>
                  {(() => {
                    const effective = shopType ?? getCategoryCopy(lookingFor).pageType
                    const opt = SHOP_TYPE_OPTIONS.find(o => o.value === effective)
                    return opt ? <span>{opt.emoji} {opt.label}</span> : <span className={styles.lookingForPlaceholder}>Tap to choose…</span>
                  })()}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {shopType && (
                  <button type="button" className={styles.brandQuickBtn} onClick={() => setShopType(null)}>↩ Reset to default</button>
                )}
              </div>
            )}

            {['restaurant','catering','bar_nightclub','hotel_accom','fresh_produce','food_drink'].includes(lookingFor) && (
              <div className={styles.fieldRow}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Cuisine Type</label>
                  <HelpTip text="Let people know what type of food or cuisine you specialise in." />
                </div>
                <button type="button" className={styles.lookingForTrigger} onClick={() => setCuisineOpen(true)}>
                  {cuisineType
                    ? (() => {
                        const c = WORLD_CUISINES.find(x => x.value === cuisineType)
                        return c ? <span>{c.emoji} {c.label}</span> : <span>{cuisineType}</span>
                      })()
                    : <span className={styles.lookingForPlaceholder}>Select cuisine…</span>
                  }
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {cuisineType && (
                  <button type="button" className={styles.brandQuickBtn} onClick={() => setCuisineType(null)}>✕ Clear</button>
                )}
              </div>
            )}

            {['handmade','craft_supplies','art_craft','fashion','buy_sell'].includes(lookingFor) && (
              <div className={styles.fieldRow}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Target Audience</label>
                  <HelpTip text="Who are your products made for?" />
                </div>
                <div className={styles.selectWrap}>
                  <select
                    className={styles.fieldSelect}
                    value={Array.isArray(targetAudience) ? (targetAudience[0] ?? '') : (targetAudience ?? '')}
                    onChange={e => setTargetAudience(e.target.value ? [e.target.value] : [])}
                  >
                    <option value="">Select audience…</option>
                    <option value="all">All Ages</option>
                    <option value="women">Women</option>
                    <option value="men">Men</option>
                    <option value="children">Children</option>
                    <option value="gifts">Gifts</option>
                    <option value="teens">Teens</option>
                    <option value="babies">Babies &amp; Toddlers</option>
                    <option value="elderly">Elderly</option>
                    <option value="unisex">Unisex</option>
                  </select>
                  <svg className={styles.selectArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            )}

            <div className={styles.fieldRow}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>Brand Name</label>
                <HelpTip text="Type your brand name, or choose a quick option below." />
              </div>
              <input
                className={styles.fieldInput}
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                placeholder="Type your brand name…"
                maxLength={50}
              />
              <div className={styles.brandQuickRow}>
                {['Unbranded', 'On Request'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`${styles.brandQuickBtn} ${brandName === opt ? styles.brandQuickBtnActive : ''}`}
                    onClick={() => setBrandName(brandName === opt ? '' : opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>Price Range</label>
                <HelpTip text="Set a min and max price so visitors know what to expect before reaching out." />
              </div>
              <div className={styles.priceRangeRow}>
                <input className={styles.fieldInput} value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="Min price" maxLength={30} />
                <span className={styles.priceRangeSep}>–</span>
                <input className={styles.fieldInput} value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="Max price" maxLength={30} />
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>Market</label>
                <HelpTip text="Let people know whether you sell locally, export internationally, or both." />
              </div>
              <div className={styles.selectWrap}>
                <select className={styles.fieldSelect} value={market} onChange={e => setMarket(e.target.value)}>
                  <option value="">Select market…</option>
                  <option value="Local">Local</option>
                  <option value="Export">Export</option>
                  <option value="Local & Export">Local &amp; Export</option>
                </select>
                <svg className={styles.selectArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            {/* Business Hours */}
            <div className={styles.fieldRow}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>Business Hours</label>
                <HelpTip text="Set your hours for each day. Outside these hours your status shows as Invite Out automatically." />
              </div>
              <div className={styles.hoursGrid}>
                {DAYS.map(day => {
                  const h = businessHours[day] ?? DEFAULT_HOURS
                  return (
                    <div key={day} className={styles.hoursRow}>
                      <span className={`${styles.hoursDay} ${h.closed ? styles.hoursDayClosed : ''}`}>{day}</span>
                      {h.closed ? (
                        <span className={styles.hoursClosedLabel}>Closed</span>
                      ) : (
                        <>
                          <input type="time" className={styles.hoursInput} value={h.open} onChange={e => updateHour(day, 'open', e.target.value)} />
                          <span className={styles.hoursSep}>–</span>
                          <input type="time" className={styles.hoursInput} value={h.close} onChange={e => updateHour(day, 'close', e.target.value)} />
                        </>
                      )}
                      <button
                        type="button"
                        className={`${styles.hoursClosedBtn} ${h.closed ? styles.hoursClosedBtnActive : ''}`}
                        onClick={() => updateHour(day, 'closed', !h.closed)}
                      >
                        {h.closed ? 'Open' : 'Closed'}
                      </button>
                    </div>
                  )
                })}
              </div>
              <p className={styles.hoursHint}>
                Outside these hours your status will automatically show as <strong>Invite Out</strong>
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Let's Meet With accordion — non-maker, non-driver ── */}
      {lookingFor && !MAKER_CATEGORIES.includes(lookingFor) && lookingFor !== 'car_taxi' && lookingFor !== 'bike_ride' && (
        <div className={styles.section}>
          <div className={styles.sectionLabelRow}>
            <span className={styles.sectionLabel}>Let's Meet With</span>
            <HelpTip text="Pick what best describes your plans. People with matching interests will find you on the map." />
          </div>
          <div className={styles.accordionList}>
            {ACTIVITY_CATEGORIES.map(cat => {
              const items = ACTIVITY_TYPES.filter(a => a.category === cat.id)
              if (!items.length) return null
              const isOpen   = expandedCategory === cat.id
              const selected = items.find(a => a.id === selectedActivity)
              return (
                <div key={cat.id} className={`${styles.accordionItem} ${selected ? styles.accordionItemSelected : ''}`}>
                  <button
                    className={styles.accordionHeader}
                    onClick={() => setExpandedCategory(isOpen ? null : cat.id)}
                  >
                    <span className={styles.accordionLabel}>{cat.label}</span>
                    {selected && <span className={styles.accordionPick}>{selected.label}</span>}
                    <svg
                      className={`${styles.accordionChevron} ${isOpen ? styles.chevronOpen : ''}`}
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className={styles.accordionBody}>
                      {items.map(a => (
                        <button
                          key={a.id}
                          className={`${styles.accordionChip} ${selectedActivity === a.id ? styles.accordionChipActive : ''}`}
                          onClick={() => {
                            setSelectedActivity(prev => prev === a.id ? null : a.id)
                            setExpandedCategory(null)
                          }}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Set Your Status ── */}
      <div className={styles.section}>
        <div className={styles.sectionLabelRow}>
          <span className={styles.sectionLabel}>Set Your Status</span>
          <HelpTip text="Let people know if you're ready to meet. I'm Out — you're out right now. Invite Out — you want someone to invite you out. Later Out — set a time for when you'll be going out." />
        </div>
        <p className={styles.activityHint}>Let people know you're available — your status is set when you save your profile</p>

        <div className={styles.particleContainer}>
          {particles.map(p => (
            <span
              key={p.id}
              className={styles.particle}
              style={{ left: p.left, animationDuration: p.dur, animationDelay: p.delay }}
            >
              {p.char}
            </span>
          ))}

          <div className={styles.statusBtnRow}>
            <button
              className={`${styles.statusBtn} ${pendingStatus === 'im_out' ? styles.statusBtnGreen : mySession?.status === 'active' && !pendingStatus ? styles.statusBtnGreen : ''}`}
              onClick={() => handleStatusClick('im_out')}
            >
              <span className={`${styles.statusDot} ${styles.statusDotGreen}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
                </svg>
              </span>
              <span className={styles.statusBtnLabel}>I&apos;m Out</span>
            </button>
            <button
              className={`${styles.statusBtn} ${pendingStatus === 'invite_out' ? styles.statusBtnYellow : mySession?.status === 'invite_out' && !pendingStatus ? styles.statusBtnYellow : ''}`}
              onClick={() => handleStatusClick('invite_out')}
            >
              <span className={`${styles.statusDot} ${styles.statusDotYellow}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
                </svg>
              </span>
              <span className={styles.statusBtnLabel}>Invite Out</span>
            </button>
            <button
              className={`${styles.statusBtn} ${pendingStatus === 'later_out' ? styles.statusBtnOrange : mySession?.status === 'scheduled' && !pendingStatus ? styles.statusBtnOrange : ''}`}
              onClick={() => handleStatusClick('later_out')}
            >
              <span className={`${styles.statusDot} ${styles.statusDotOrange}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
                </svg>
              </span>
              <span className={styles.statusBtnLabel}>Later Out</span>
            </button>
          </div>
        </div>

        {pendingStatus && (
          <p className={styles.statusSelectedNote}>
            {pendingStatus === 'im_out'     && '🚀 You\'ll be set live — save your profile to continue to location setup'}
            {pendingStatus === 'invite_out' && '💌 You\'ll appear as wanting an invite — save your profile to confirm'}
            {pendingStatus === 'later_out'  && '🕐 You\'re going out later — save your profile to set your time & place'}
          </p>
        )}
      </div>
    </>
  )
}
