import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import { useMySession } from '@/hooks/useMySession'
import { useCoins } from '@/hooks/useCoins'
import { ACTIVITY_TYPES, ACTIVITY_CATEGORIES } from '@/firebase/collections'
import { LOOKING_FOR_OPTIONS, LANGUAGE_FLAGS, subCategoryText, getSearchKeywords } from '@/utils/lookingForLabels'
import LookingForSheet from '@/components/ui/LookingForSheet'
import CuisineSheet, { WORLD_CUISINES } from '@/components/ui/CuisineSheet'
import TradeRoleSheet, { TRADE_ROLE_GROUPS } from '@/components/ui/TradeRoleSheet'
import ShopTypeSheet, { SHOP_TYPE_OPTIONS } from '@/components/ui/ShopTypeSheet'
import DatingPickerSheet from '@/components/ui/DatingPickerSheet'
import LanguagePickerSheet from '@/components/ui/LanguagePickerSheet'
import { getCategoryCopy } from '@/constants/categoryCopy'
import Toast from '@/components/ui/Toast'
import { saveProfile, uploadAvatar, uploadGalleryPhoto, deleteAccount, exportMyData } from '@/services/profileService'
import { signOut, sendPasswordReset } from '@/services/authService'
import { endSession } from '@/services/sessionService'
import GoOutSetup from './GoOutSetup'
import UpgradeSheet from '@/components/premium/UpgradeSheet'
import { clearPhotoViewCount } from '@/services/photoNudgeService'
import { useIpCountry } from '@/hooks/useIpCountry'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import styles from './ProfileScreen.module.css'

import DriverDocumentUpload from '@/components/driver/DriverDocumentUpload'
import OnlineToggle from '@/components/driver/OnlineToggle'
import DriverIncomingBooking from '@/components/driver/DriverIncomingBooking'
import DriverTripScreen from '@/components/driver/DriverTripScreen'
import DriverEarningsScreen from '@/components/driver/DriverEarningsScreen'
import RestaurantDashboard from '@/components/restaurant/RestaurantDashboard'
import { fetchDriverPendingBooking } from '@/services/bookingService'
import SideDrawer from '@/components/ui/SideDrawer'
import MicroShop from '@/components/ui/MicroShop'
import MicroShopEditor from '@/components/ui/MicroShopEditor'

const EU_COUNTRIES = new Set([
  'Austria','Belgium','Bulgaria','Croatia','Cyprus','Czech Republic','Denmark',
  'Estonia','Finland','France','Germany','Greece','Hungary','Ireland','Italy',
  'Latvia','Lithuania','Luxembourg','Malta','Netherlands','Poland','Portugal',
  'Romania','Slovakia','Slovenia','Spain','Sweden','Norway','Iceland','Switzerland',
])

const ASIA_COUNTRIES = new Set([
  'India','Pakistan','Bangladesh','Sri Lanka','Nepal','Myanmar','Cambodia',
  'Vietnam','Thailand','Malaysia','Indonesia','Philippines','Singapore',
  'Japan','South Korea','China','Mongolia','Kazakhstan','Kyrgyzstan',
  'Uzbekistan','Azerbaijan','Georgia','Armenia','Lebanon','Jordan','Iraq','Iran',
])

function getRegionPricing(country) {
  if (!country) return { display: '$1.99', note: 'USD' }
  if (country === 'United Kingdom')       return { display: '£1.99', note: 'GBP' }
  if (country === 'Australia')            return { display: 'A$1.99', note: 'AUD' }
  if (EU_COUNTRIES.has(country))          return { display: '€1.99', note: 'EUR' }
  if (ASIA_COUNTRIES.has(country))        return { display: '$1.50', note: 'USD' }
  return { display: '$1.99', note: 'USD' }
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_MB    = 5
const MAX_BYTES = MAX_MB * 1024 * 1024

// { name, flag } — flag is the emoji flag for the country
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

function validateFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `"${file.name}" can't be uploaded. Accepted formats: JPG, PNG, WEBP.`
  }
  if (file.size > MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1)
    return `"${file.name}" is ${mb}MB — maximum file size is ${MAX_MB}MB.`
  }
  return null
}

// ── Inline help tip ──────────────────────────────────────────────────────────
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

// Inline CSS object for HelpTip — keeps it self-contained
const helpStyles = {
  wrap:  { display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative', verticalAlign: 'middle' },
  btn:   { width: 18, height: 18, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)', color: '#8DC63F', fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1, fontFamily: 'inherit', padding: 0 },
  tip:   { position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 60, background: '#1c1c1c', border: '1px solid rgba(141,198,63,0.25)', borderRadius: 12, padding: '10px 13px', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, whiteSpace: 'normal', width: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' },
}

// ── Required field validation ─────────────────────────────────────────────────
function validateProfile({ name, dobDay, dobMonth, dobYear, country, city }) {
  if (!name.trim())                          return 'Please enter your display name so others can find you.'
  if (!dobDay || !dobMonth || !dobYear)      return 'Please complete your date of birth — you must be 18 or over to use Hangger.'
  if (!country)                              return 'Please select your country so we can show you to the right people.'
  if (!city.trim())                          return 'Please add your city or area — without it you won\'t appear in map searches near you.'
  return null
}

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

const LANGUAGES = [
  'English', 'Mandarin', 'Hindi', 'Spanish', 'French', 'Arabic', 'Bengali',
  'Portuguese', 'Russian', 'Urdu', 'Indonesian', 'Filipino', 'Vietnamese',
  'Thai', 'Malay', 'Japanese', 'Korean', 'Turkish', 'Italian', 'German',
  'Dutch', 'Polish', 'Ukrainian', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
  'Swahili', 'Amharic', 'Yoruba', 'Zulu', 'Tamil', 'Telugu', 'Punjabi',
  'Burmese', 'Khmer', 'Lao', 'Sinhala', 'Nepali', 'Georgian', 'Armenian',
  'Hebrew', 'Persian', 'Pashto', 'Somali', 'Hausa',
].sort()

const STATUS_CONFIG = {
  live:      { label: "I'M OUT NOW",   cls: 'bannerLive',      dot: 'dotLive'      },
  scheduled: { label: "I'M OUT LATER", cls: 'bannerScheduled', dot: 'dotScheduled' },
  online:    { label: "I'M ONLINE",    cls: 'bannerOnline',    dot: 'dotOnline'    },
}

export default function ProfileScreen({ onClose, onboarding = false }) {
  const { user, userProfile } = useAuth()
  const { session: mySession } = useMySession()
  const { earn } = useCoins()
  const ipCountry = useIpCountry()
  const pricing = getRegionPricing(ipCountry)

  const [selectedActivity, setSelectedActivity] = useState(
    userProfile?.activities?.[0] ?? null
  )
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [name,    setName]    = useState(userProfile?.displayName ?? user?.displayName ?? 'You')
  const [country,        setCountry]        = useState(userProfile?.country ?? '')
  const [city,           setCity]           = useState(userProfile?.city ?? '')
  const [lookingFor,     setLookingFor]     = useState(userProfile?.lookingFor ?? '')
  const [subCategory,   setSubCategory]   = useState(userProfile?.subCategory ?? null)
  const [bio,            setBio]            = useState(userProfile?.bio ?? '')
  const [relationshipGoal, setRelationshipGoal] = useState(userProfile?.relationshipGoal ?? '')
  const [starSign,         setStarSign]         = useState(userProfile?.starSign ?? '')
  const [starSignOpen,     setStarSignOpen]     = useState(false)
  const [relGoalOpen,      setRelGoalOpen]      = useState(false)
  const [langPickerOpen,   setLangPickerOpen]   = useState(false)
  const [speakingNative, setSpeakingNative] = useState(userProfile?.speakingNative ?? (userProfile?.country ? (COUNTRY_NATIVE_LANGUAGE[userProfile.country] ?? '') : ''))
  const [speakingSecond, setSpeakingSecond] = useState(userProfile?.speakingSecond ?? '')
  // Driver vehicle details
  // ── Driver booking state ────────────────────────────────────────────────────
  const [incomingBooking,  setIncomingBooking]  = useState(null)   // pending booking object
  const [activeTrip,       setActiveTrip]       = useState(null)   // accepted booking object
  const [earningsOpen,        setEarningsOpen]        = useState(false)
  const [restaurantDashOpen,  setRestaurantDashOpen]  = useState(false)
  const driverId = user?.uid ?? user?.id

  // Poll for incoming/active booking every 5s when driver is approved
  useEffect(() => {
    if (!userProfile?.is_driver) return
    const poll = async () => {
      const booking = await fetchDriverPendingBooking(driverId)
      if (!booking) return
      if (booking.status === 'pending')     setIncomingBooking(prev => prev?.id === booking.id ? prev : booking)
      if (booking.status === 'accepted' || booking.status === 'in_progress') {
        setIncomingBooking(null)
        setActiveTrip(prev => prev?.id === booking.id ? prev : booking)
      }
    }
    poll()
    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [userProfile?.is_driver, driverId])

  const [driverAge,     setDriverAge]     = useState(userProfile?.driver_age     ?? '')
  const [vehicleModel,  setVehicleModel]  = useState(userProfile?.vehicle_model  ?? '')
  const [vehicleYear,   setVehicleYear]   = useState(userProfile?.vehicle_year   ?? '')
  const [vehicleColor,  setVehicleColor]  = useState(userProfile?.vehicle_color  ?? '')
  const [platePrefix,   setPlatePrefix]   = useState(userProfile?.plate_prefix   ?? '')
  const [priceMin,      setPriceMin]      = useState(userProfile?.priceMin ?? '')
  const [priceMax,      setPriceMax]      = useState(userProfile?.priceMax ?? '')
  const [market,        setMarket]        = useState(userProfile?.market ?? '')
  const [brandName,     setBrandName]     = useState(userProfile?.brandName ?? '')

  const DEFAULT_HOURS = { open: '', close: '', closed: false }
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const [businessHours, setBusinessHours] = useState(
    userProfile?.businessHours ?? Object.fromEntries(DAYS.map(d => [d, { ...DEFAULT_HOURS }]))
  )
  const updateHour = (day, field, value) =>
    setBusinessHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  const [tradeRole,     setTradeRole]     = useState(userProfile?.tradeRole ?? '')
  const [cuisineType,   setCuisineType]   = useState(userProfile?.cuisineType ?? null)
  const [cuisineOpen,   setCuisineOpen]   = useState(false)
  const [tradeRoleOpen, setTradeRoleOpen] = useState(false)
  const [shopType,      setShopType]      = useState(userProfile?.shopType ?? null)
  const [shopTypeOpen,  setShopTypeOpen]  = useState(false)
  const [targetAudience, setTargetAudience] = useState(userProfile?.targetAudience ?? [])
  const [instagramHandle, setInstagramHandle] = useState(userProfile?.instagram ?? '')
  const [tiktokHandle,    setTiktokHandle]    = useState(userProfile?.tiktok ?? '')
  const [facebookHandle,  setFacebookHandle]  = useState(userProfile?.facebook ?? '')
  const [websiteUrl,      setWebsiteUrl]      = useState(userProfile?.website ?? '')
  const [youtubeHandle,   setYoutubeHandle]   = useState(userProfile?.youtube ?? '')
  const [tags,          setTags]          = useState(userProfile?.tags ?? [])
  const [tagInput,      setTagInput]      = useState('')

  // Status buttons
  const [pendingStatus,   setPendingStatus]   = useState(null) // 'im_out' | 'invite_out' | 'later_out'
  const [particles,       setParticles]       = useState([])
  const [showGoOutSetup,  setShowGoOutSetup]  = useState(false)
  const [showUpgrade,     setShowUpgrade]     = useState(false)
  const isFirstSave = !userProfile?.lookingFor

  // Tab: 'profile' | 'verified' | 'shop'
  const [profileTab, setProfileTab] = useState('profile')
  const tier = userProfile?.tier ?? 'free'
  const hasShop = tier === 'premium' || tier === 'business'
  // Per-link confirm state (link opened in new tab = confirmed)
  const [confirmedLinks, setConfirmedLinks] = useState({})
  // Looking-for sheet
  const [lookingForOpen, setLookingForOpen] = useState(false)
  // Self-contained account drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [photoTipsOpen, setPhotoTipsOpen] = useState(false)
  const [drawerSigningOut, setDrawerSigningOut] = useState(false)
  const [deleteStep, setDeleteStep] = useState(null)   // null | 'confirm' | 'deleting'
  const [exportingData, setExportingData] = useState(false)
  const [resetPwStep, setResetPwStep] = useState(null) // null | 'sent'
  const { permission, requestPermission } = usePushNotifications()
  const [notifOn, setNotifOn] = useState(permission === 'granted')
  // DOB — parsed from stored "YYYY-MM-DD" string
  const parseDob = (dobStr) => {
    if (!dobStr) return { day: '', month: '', year: '' }
    const [y, m, d] = dobStr.split('-')
    return { day: String(parseInt(d, 10)), month: String(parseInt(m, 10)), year: y }
  }
  const initDob = parseDob(userProfile?.dob)
  const [dobDay,   setDobDay]   = useState(initDob.day)
  const [dobMonth, setDobMonth] = useState(initDob.month)
  const [dobYear,  setDobYear]  = useState(initDob.year)
  const [saving, setSaving] = useState(false)

  // Main photo
  const [photoURL,      setPhotoURL]      = useState(userProfile?.photoURL ?? user?.photoURL ?? null)
  const [photoFile,     setPhotoFile]     = useState(null)
  const [photoOffsetX,  setPhotoOffsetX]  = useState(userProfile?.photoOffsetX ?? 50)
  const [photoOffsetY,  setPhotoOffsetY]  = useState(userProfile?.photoOffsetY ?? 50)
  const [photoZoom,     setPhotoZoom]     = useState(userProfile?.photoZoom ?? 1)
  const [photoEditOpen, setPhotoEditOpen] = useState(false)

  // Extra gallery photos (4 slots)
  const [extraPhotos,     setExtraPhotos]     = useState(
    userProfile?.extraPhotos?.length ? [...userProfile.extraPhotos, null, null, null, null].slice(0, 4) : [null, null, null, null]
  )
  const [extraPhotoFiles, setExtraPhotoFiles] = useState([null, null, null, null])

  // Country typeahead
  const [countryQuery, setCountryQuery] = useState(userProfile?.country ?? '')
  const [countryOpen,  setCountryOpen]  = useState(false)
  const countryRef = useRef(null)

  // Toast
  const [toast, setToast] = useState(null)

  // File inputs
  const mainInputRef = useRef(null)
  const extra0 = useRef(null)
  const extra1 = useRef(null)
  const extra2 = useRef(null)
  const extra3 = useRef(null)
  const extraInputRefs = [extra0, extra1, extra2, extra3]

  const filteredCountries = countryQuery.length > 0
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(countryQuery.toLowerCase())).slice(0, 8)
    : COUNTRIES.slice(0, 8)

  // Close country dropdown on outside click
  useEffect(() => {
    function onOut(e) {
      if (countryRef.current && !countryRef.current.contains(e.target)) {
        setCountryOpen(false)
      }
    }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [])

  // Re-sync when userProfile loads
  useEffect(() => {
    if (!userProfile) return
    setName(userProfile.displayName ?? user?.displayName ?? 'You')
    const pd = parseDob(userProfile.dob)
    setDobDay(pd.day); setDobMonth(pd.month); setDobYear(pd.year)
    setCountry(userProfile.country ?? '')
    setCountryQuery(userProfile.country ?? '')
    setCity(userProfile.city ?? '')
    setLookingFor(userProfile.lookingFor ?? '')
    setSubCategory(userProfile.subCategory ?? null)
    setBio(userProfile.bio ?? '')
    setSpeakingNative(userProfile.speakingNative ?? (userProfile.country ? (COUNTRY_NATIVE_LANGUAGE[userProfile.country] ?? '') : ''))
    setSpeakingSecond(userProfile.speakingSecond ?? '')
    setPriceMin(userProfile.priceMin ?? '')
    setPriceMax(userProfile.priceMax ?? '')
    setMarket(userProfile.market ?? '')
    setBrandName(userProfile.brandName ?? '')
    setTradeRole(userProfile.tradeRole ?? '')
    setCuisineType(userProfile.cuisineType ?? null)
    setShopType(userProfile.shopType ?? null)
    setTargetAudience(userProfile.targetAudience ?? [])
    setBusinessHours(userProfile.businessHours ?? Object.fromEntries(DAYS.map(d => [d, { ...DEFAULT_HOURS }])))
    setTags(userProfile.tags ?? [])
    setPhotoURL(userProfile.photoURL ?? null)
    setPhotoOffsetX(userProfile.photoOffsetX ?? 50)
    setPhotoOffsetY(userProfile.photoOffsetY ?? 50)
    setPhotoZoom(userProfile.photoZoom ?? 1)
    setSelectedActivity(userProfile.activities?.[0] ?? null)
    const ep = userProfile.extraPhotos ?? []
    setExtraPhotos([ep[0] ?? null, ep[1] ?? null, ep[2] ?? null, ep[3] ?? null])
  }, [userProfile]) // eslint-disable-line

  function showToast(msg) {
    setToast({ message: msg, type: 'error' })
  }

  async function handleDrawerSignOut() {
    setDrawerSigningOut(true)
    try {
      if (mySession?.id) await endSession(mySession.id)
      await signOut()
      setDrawerOpen(false)
    } catch {
      setToast({ message: 'Could not sign out. Try again.', type: 'error' })
    }
    setDrawerSigningOut(false)
  }

  async function handleNotifToggle() {
    if (notifOn) {
      setNotifOn(false)
    } else {
      const result = await requestPermission()
      if (result === 'granted') setNotifOn(true)
    }
  }

  function handleMainPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateFile(file)
    if (err) { showToast(err); e.target.value = ''; return }
    setPhotoFile(file)
    setPhotoURL(URL.createObjectURL(file))
    setPhotoOffsetX(50); setPhotoOffsetY(50); setPhotoZoom(1)
    setPhotoEditOpen(true)
    clearPhotoViewCount(user?.id)
    e.target.value = ''
  }

  function handleExtraPhoto(idx, e) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateFile(file)
    if (err) { showToast(err); e.target.value = ''; return }
    setExtraPhotos(prev => { const n = [...prev]; n[idx] = URL.createObjectURL(file); return n })
    setExtraPhotoFiles(prev => { const n = [...prev]; n[idx] = file; return n })
    e.target.value = ''
  }

  // All commerce, service, professional & hiring categories — require photo + show business fields
  const MAKER_CATEGORIES = [
    // Buying & Selling
    'buy_sell', 'fresh_produce', 'agri_goods', 'fashion', 'electronics', 'vehicles',
    'property', 'tools_equip', 'antiques', 'import_export',
    // Trades & Home Services
    'trades', 'auto_repair', 'cleaning', 'garden', 'security', 'laundry', 'tailoring',
    'childcare', 'eldercare', 'pet_care', 'transport',
    // Health & Wellness
    'healthcare', 'beauty', 'fitness_pt', 'mental_health', 'alt_medicine', 'veterinary', 'pharmacy',
    // Food, Hospitality & Events
    'catering', 'restaurant', 'hotel_accom', 'tourism_guide', 'event_planning', 'bar_nightclub',
    // Creative & Media
    'creative', 'content_creator', 'music_perform', 'music', 'photography', 'writing', 'fashion_design', 'art_craft',
    // Retail (additional)
    'handmade', 'craft_supplies', 'vintage', 'hardware', 'wellness',
    // Professional & Business
    'business', 'technology', 'legal', 'engineering', 'sales_leads', 'consulting',
    'real_estate', 'marketing', 'media_pro',
    // Work & Employment (commercial)
    'hiring', 'freelance', 'domestic_work', 'agri_work', 'manufacturing', 'mining',
    // Education
    'education', 'coaching',
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

  function handleStatusClick(status) {
    if (MAKER_CATEGORIES.includes(lookingFor) && !photoURL && extraPhotos.every(p => !p)) {
      showToast('You must add at least 1 photo before posting your profile.')
      return
    }
    setPendingStatus(status)
    triggerParticles(status)
  }

  function triggerParticles(type) {
    const chars = type === 'im_out'     ? ['❤️','💕','💗','💖']
                : type === 'invite_out' ? ['💌','💕','❤️','💝']
                :                        ['🕐','⏰','🕑','🕒']
    const newP = Array.from({ length: 14 }, (_, i) => ({
      id:    Date.now() + i,
      char:  chars[i % chars.length],
      left:  `${4 + (i * 6.5) % 88}%`,
      dur:   `${1.1 + (i * 0.12) % 0.7}s`,
      delay: `${(i * 0.07) % 0.55}s`,
    }))
    setParticles(newP)
    setTimeout(() => setParticles([]), 2200)
  }

  const handleDone = async () => {
    const validationError = validateProfile({ name, dobDay, dobMonth, dobYear, country, city })
    if (validationError) { showToast(validationError); return }
    setSaving(true)
    try {
      if (photoFile && user?.id) {
        const url = await uploadAvatar(user.id, photoFile)
        if (url) setPhotoURL(url)
        earn('PROFILE_PHOTO')
      }

      const savedExtra = [...extraPhotos]
      for (let i = 0; i < 4; i++) {
        if (extraPhotoFiles[i] && user?.id) {
          const url = await uploadGalleryPhoto(user.id, extraPhotoFiles[i], i)
          if (url) savedExtra[i] = url
        }
      }
      setExtraPhotos(savedExtra)
      setExtraPhotoFiles([null, null, null, null])

      const dob = (dobYear && dobMonth && dobDay)
        ? `${dobYear}-${String(dobMonth).padStart(2,'0')}-${String(dobDay).padStart(2,'0')}`
        : null
      // Merge auto-keywords from category selection into tags
      const autoKeywords = getSearchKeywords(lookingFor, subCategory)
      const mergedTags = [...new Set([...tags, ...autoKeywords])]

      await saveProfile({
        userId:      user?.id,
        displayName: name,
        dob,
        bio,
        city,
        country,
        activities:  selectedActivity ? [selectedActivity] : [],
        lookingFor,
        subCategory,
        speakingNative,
        speakingSecond,
        priceMin,
        priceMax,
        market,
        brandName,
        tradeRole,
        shopType,
        cuisineType,
        targetAudience,
        businessHours,
        tags: mergedTags,
        instagramHandle,
        tiktokHandle,
        facebookHandle,
        websiteUrl,
        youtubeHandle,
        extraPhotos: savedExtra,
        photoOffsetX,
        photoOffsetY,
        photoZoom,
        relationshipGoal: lookingFor === 'dating' ? relationshipGoal : undefined,
        starSign:         lookingFor === 'dating' ? starSign         : undefined,
        driver_age:    (lookingFor === 'car_taxi' || lookingFor === 'bike_ride') ? (Number(driverAge) || null)  : undefined,
        vehicle_model: (lookingFor === 'car_taxi' || lookingFor === 'bike_ride') ? (vehicleModel.trim() || null) : undefined,
        vehicle_year:  (lookingFor === 'car_taxi' || lookingFor === 'bike_ride') ? (Number(vehicleYear) || null) : undefined,
        vehicle_color: (lookingFor === 'car_taxi' || lookingFor === 'bike_ride') ? (vehicleColor.trim() || null) : undefined,
        plate_prefix:  (lookingFor === 'car_taxi' || lookingFor === 'bike_ride') ? (platePrefix.trim().toUpperCase() || null) : undefined,
      })
      if (bio.trim().length > 0)       earn('BIO_WRITTEN')
      if (selectedActivity)            earn('ACTIVITIES_SET')
      // After successful save, open the go-out setup if user selected a status
      if (pendingStatus) setShowGoOutSetup(true)
      // isFirstSave: stay on profile tab
    } catch { /* silent */ }
    setSaving(false)
    setPhotoFile(null)
  }

  const statusKey = mySession?.status === 'active'    ? 'live'
                  : mySession?.status === 'scheduled' ? 'scheduled'
                  : 'online'
  const status = STATUS_CONFIG[statusKey]


  return (
    <>
    <div className={styles.screen}>


      {/* ── Side Drawer for Settings ── */}
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
          <h2 style={{marginTop: 0, marginBottom: 20, color: '#fff', fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px'}}>Dashboard</h2>
          
          {/* Profile Section */}
          <button style={{width: '100%', padding: '14px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 15, fontWeight: 600, marginBottom: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}} onMouseEnter={(e) => {e.target.style.background = '#252525'; e.target.style.borderColor = '#353535'; e.target.style.boxShadow = '0 4px 16px rgba(141,198,63,0.15)';}} onMouseLeave={(e) => {e.target.style.background = '#1a1a1a'; e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';}}><span style={{display: 'inline-block', marginRight: 10}}>👤</span>View My Profile</button>
          <button onClick={() => setDrawerOpen(false)} style={{width: '100%', padding: '14px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 15, fontWeight: 600, marginBottom: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}} onMouseEnter={(e) => {e.target.style.background = '#252525'; e.target.style.borderColor = '#353535'; e.target.style.boxShadow = '0 4px 16px rgba(141,198,63,0.15)';}} onMouseLeave={(e) => {e.target.style.background = '#1a1a1a'; e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';}}><span style={{display: 'inline-block', marginRight: 10}}>📸</span>Edit Photos</button>
          
          <hr style={{border: 0, borderTop: '1px solid rgba(141,198,63,0.15)', margin: '12px 0'}} />
          
          {/* Account Section */}
          <button style={{width: '100%', padding: '14px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 15, fontWeight: 600, marginBottom: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}} onMouseEnter={(e) => {e.target.style.background = '#252525'; e.target.style.borderColor = '#353535'; e.target.style.boxShadow = '0 4px 16px rgba(141,198,63,0.15)';}} onMouseLeave={(e) => {e.target.style.background = '#1a1a1a'; e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';}}><span style={{display: 'inline-block', marginRight: 10}}>⚙️</span>Account Settings</button>
          <button style={{width: '100%', padding: '14px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 15, fontWeight: 600, marginBottom: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}} onMouseEnter={(e) => {e.target.style.background = '#252525'; e.target.style.borderColor = '#353535'; e.target.style.boxShadow = '0 4px 16px rgba(141,198,63,0.15)';}} onMouseLeave={(e) => {e.target.style.background = '#1a1a1a'; e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';}}><span style={{display: 'inline-block', marginRight: 10}}>🔒</span>Privacy & Security</button>
          <button onClick={() => { showToast('Push notifications can be toggled in your device settings'); setDrawerOpen(false); }} style={{width: '100%', padding: '14px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 15, fontWeight: 600, marginBottom: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}} onMouseEnter={(e) => {e.target.style.background = '#252525'; e.target.style.borderColor = '#353535'; e.target.style.boxShadow = '0 4px 16px rgba(141,198,63,0.15)';}} onMouseLeave={(e) => {e.target.style.background = '#1a1a1a'; e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';}}><span style={{display: 'inline-block', marginRight: 10}}>🔔</span>Notifications</button>
          
          <hr style={{border: 0, borderTop: '1px solid rgba(141,198,63,0.15)', margin: '12px 0'}} />
          
          {/* Support Section */}
          <button onClick={() => { showToast('Help & Support page coming soon'); setDrawerOpen(false); }} style={{width: '100%', padding: '14px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 15, fontWeight: 600, marginBottom: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}} onMouseEnter={(e) => {e.target.style.background = '#252525'; e.target.style.borderColor = '#353535'; e.target.style.boxShadow = '0 4px 16px rgba(141,198,63,0.15)';}} onMouseLeave={(e) => {e.target.style.background = '#1a1a1a'; e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';}}><span style={{display: 'inline-block', marginRight: 10}}>❓</span>Help & Support</button>
          <button onClick={() => { showToast("Hangger v0.1.0 — who's hanging near you?"); setDrawerOpen(false); }} style={{width: '100%', padding: '14px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 15, fontWeight: 600, marginBottom: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}} onMouseEnter={(e) => {e.target.style.background = '#252525'; e.target.style.borderColor = '#353535'; e.target.style.boxShadow = '0 4px 16px rgba(141,198,63,0.15)';}} onMouseLeave={(e) => {e.target.style.background = '#1a1a1a'; e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';}}><span style={{display: 'inline-block', marginRight: 10}}>ℹ️</span>About Hangger</button>
          
          <hr style={{border: 0, borderTop: '1px solid rgba(141,198,63,0.15)', margin: '12px 0'}} />
          
          {/* Action Section */}
          <button onClick={() => setDrawerOpen(false)} style={{width: '100%', padding: '14px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}} onMouseEnter={(e) => {e.target.style.background = '#252525'; e.target.style.borderColor = '#353535'; e.target.style.boxShadow = '0 4px 16px rgba(141,198,63,0.15)';}} onMouseLeave={(e) => {e.target.style.background = '#1a1a1a'; e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';}}><span style={{display: 'inline-block', marginRight: 8}}>✕</span>Close</button>
        </div>
      </SideDrawer>

      {/* ── Toast ── */}
      <Toast
        message={toast?.message}
        type="error"
        onDismiss={() => setToast(null)}
        duration={4500}
      />

      {/* ── Upload Profile heading ── */}
      <div className={styles.uploadHeadingRow}>
        <div className={styles.uploadHeadingText}>
          <span className={styles.uploadHeadingTitle}>UPLOAD Profile</span>
          <span className={styles.uploadHeadingSub}>Please view images terms and conditions</span>
        </div>
      </div>


      <div className={styles.scroll}>

        {/* ── Joined the app for — floating, no container ── */}
        <div className={styles.joinedWrap}>
          <span className={styles.joinedHeading}>Joined the app for</span>
          <button
            type="button"
            className={styles.lookingForTrigger}
            onClick={() => setLookingForOpen(true)}
          >
            {lookingFor
              ? (() => {
                  const opt = LOOKING_FOR_OPTIONS.find(o => o.value === lookingFor)
                  if (!opt) return 'I\'m here for…'
                  const subLabel = subCategory ? subCategoryText(lookingFor, subCategory) : null
                  return (
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{opt.emoji}</span>
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

        {/* ── Photo grid ── */}
        <div className={styles.photoSection} style={{ position: 'relative' }}>

          {/* Photo tips help button — top right of container */}
          <button className={styles.photoTipsBtn} onClick={() => setPhotoTipsOpen(true)} aria-label="Photo guidelines">
            ?
          </button>

          {/* Photo tips centered modal */}
          {photoTipsOpen && (
            <div className={styles.photoTipsBackdrop} onClick={() => setPhotoTipsOpen(false)}>
              <div className={styles.photoTipsModal} onClick={e => e.stopPropagation()}>
                <div className={styles.photoTipsHeader}>
                  <span className={styles.photoTipsTitle}>Image Guidelines</span>
                  <button className={styles.photoTipsClose} onClick={() => setPhotoTipsOpen(false)}>✕</button>
                </div>
                <ul className={styles.photoTipsList}>
                  <li>No cap or hat — your full head must be visible</li>
                  <li>No sunglasses — eyes must be clearly visible</li>
                  <li>Direct front-facing view — look straight at the camera</li>
                  <li>Clear, plain background — no bright sunlight or sun rays behind you</li>
                  <li>No other people in the image — solo photo only</li>
                  <li>Well-lit, sharp image — blurry or dark photos will be rejected</li>
                </ul>
                <p className={styles.photoTipsNote}>Profiles that do not meet these requirements may be removed or suspended by our team.</p>
                <button className={styles.photoTipsDone} onClick={() => setPhotoTipsOpen(false)}>Got it</button>
              </div>
            </div>
          )}

          <div className={styles.photoSectionHeader}>
            <div className={styles.photoSectionLeft}>
              <div className={styles.photoSectionTitleRow}>
                <span className={styles.photoSectionTitle}>Create Profile</span>
                <HelpTip text="Your main photo appears on the map — make it clear and friendly. Add up to 4 extra photos so matches can get a better sense of who you are. Accepted: JPG, PNG, WEBP. Max 5MB each." />
              </div>
              <span className={styles.photoSectionSub}>Let's Get Your Profile Setup</span>
            </div>
          </div>

          {/* Main photo slot */}
          <div className={styles.mainSlot} onClick={() => mainInputRef.current?.click()}>
            <img
              src={photoURL || 'https://ik.imagekit.io/nepgaxllc/sdfasdfasdf.png'}
              alt="Main"
              className={styles.mainSlotImg}
              style={photoURL ? {
                objectPosition: `${photoOffsetX}% ${photoOffsetY}%`,
                transform: `scale(${photoZoom})`,
                transformOrigin: `${photoOffsetX}% ${photoOffsetY}%`,
              } : {
                objectPosition: 'top center',
              }}
            />
            {!photoURL && (
              <div className={styles.slotDefaultOverlay}>
                <span className={styles.slotDefaultLabel}>Tap to add your photo</span>
              </div>
            )}
            {/* Camera overlay button */}
            <div className={styles.mainSlotOverlay}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <input ref={mainInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: 'none' }} onChange={handleMainPhoto} />
          </div>

          {/* Driver photo requirement notice */}
          {(lookingFor === 'bike_ride' || lookingFor === 'car_taxi') && (
            <div className={styles.driverPhotoNotice}>
              <span className={styles.driverPhotoNoticeIcon}>⚠️</span>
              <span className={styles.driverPhotoNoticeText}>
                Clear front-facing photo required — no hat, no sunglasses, full face visible. This is your driver ID photo seen by customers.
              </span>
            </div>
          )}

          {/* 4 thumbnail slots — hidden for drivers */}
          {lookingFor !== 'bike_ride' && lookingFor !== 'car_taxi' && (
            <div className={styles.thumbsRow}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={styles.thumbSlot} onClick={() => extraInputRefs[i].current?.click()}>
                  {extraPhotos[i]
                    ? <img src={extraPhotos[i]} alt={`Photo ${i + 2}`} className={styles.thumbImg} />
                    : <span className={styles.thumbPlus}>+</span>
                  }
                  <input
                    ref={extraInputRefs[i]}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    style={{ display: 'none' }}
                    onChange={e => handleExtraPhoto(i, e)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* File format hint */}
          <p className={styles.fileHint}>
            Accepted: JPG · PNG · WEBP &nbsp;·&nbsp; Max {MAX_MB}MB per photo
          </p>

          {photoURL && (
            <button className={styles.adjustBtn} onClick={() => setPhotoEditOpen(true)}>
              Adjust main photo position
            </button>
          )}
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
              disabled={false}
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

          {/* Bio */}
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
              disabled={false}
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
            {/* Existing tag chips */}
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
            {/* Tag input */}
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

          {/* Driver document upload + online toggle — car or bike service */}
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

          {/* Dating profile fields — only shown for dating category */}
          {lookingFor === 'dating' && (
            <>
              {/* Relationship goal */}
              <div className={styles.fieldRow}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Looking for</label>
                  <HelpTip text="What kind of connection are you hoping to make? Be honest — it helps everyone find the right match." />
                </div>
                <button
                  type="button"
                  className={styles.lookingForTrigger}
                  onClick={() => setRelGoalOpen(true)}
                >
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

              {/* Star sign */}
              <div className={styles.fieldRow}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Star Sign</label>
                  <HelpTip text="Your star sign is shown on your dating profile — optional but adds a personal touch." />
                </div>
                <button
                  type="button"
                  className={styles.lookingForTrigger}
                  onClick={() => setStarSignOpen(true)}
                >
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
            </>
          )}

          {/* Maker / Craft profile fields — only shown for relevant categories */}
          {MAKER_CATEGORIES.includes(lookingFor) && (
            <>
              <div className={styles.fieldRow}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>I am here to</label>
                  <HelpTip text="Are you selling products or services, buying, or both? This helps people understand your intent straight away." />
                </div>
                <button
                  type="button"
                  className={styles.lookingForTrigger}
                  onClick={() => setTradeRoleOpen(true)}
                >
                  {tradeRole
                    ? (() => {
                        const opt = TRADE_ROLE_GROUPS.flatMap(g => g.options).find(o => o.value === tradeRole)
                        return opt
                          ? <span>{opt.emoji} {opt.label}</span>
                          : <span>{tradeRole}</span>
                      })()
                    : <span className={styles.lookingForPlaceholder}>Tap to choose…</span>
                  }
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
              {/* ── Page / Tab Type — categories that support shop/services/menu ── */}
              {getCategoryCopy(lookingFor).pageType !== null && (
                <div className={styles.fieldRow}>
                  <div className={styles.fieldLabelRow}>
                    <label className={styles.fieldLabel}>Profile Tab Type</label>
                    <HelpTip text="Choose what your profile tab shows visitors — your products, services, or a menu." />
                  </div>
                  <button
                    type="button"
                    className={styles.lookingForTrigger}
                    onClick={() => setShopTypeOpen(true)}
                  >
                    {(() => {
                      const effective = shopType ?? getCategoryCopy(lookingFor).pageType
                      const opt = SHOP_TYPE_OPTIONS.find(o => o.value === effective)
                      return opt
                        ? <span>{opt.emoji} {opt.label}</span>
                        : <span className={styles.lookingForPlaceholder}>Tap to choose…</span>
                    })()}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {shopType && (
                    <button
                      type="button"
                      className={styles.brandQuickBtn}
                      onClick={() => setShopType(null)}
                    >↩ Reset to default</button>
                  )}
                </div>
              )}

              {/* ── Cuisine Type — food & hospitality categories ── */}
              {['restaurant','catering','bar_nightclub','hotel_accom','fresh_produce','food_drink'].includes(lookingFor) && (
                <div className={styles.fieldRow}>
                  <div className={styles.fieldLabelRow}>
                    <label className={styles.fieldLabel}>Cuisine Type</label>
                    <HelpTip text="Let people know what type of food or cuisine you specialise in." />
                  </div>
                  <button
                    type="button"
                    className={styles.lookingForTrigger}
                    onClick={() => setCuisineOpen(true)}
                  >
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
                    <button
                      type="button"
                      className={styles.brandQuickBtn}
                      onClick={() => setCuisineType(null)}
                    >✕ Clear</button>
                  )}
                </div>
              )}

              {/* ── Target Audience — craft, handmade, art ── */}
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
                  <input
                    className={styles.fieldInput}
                    value={priceMin}
                    onChange={e => setPriceMin(e.target.value)}
                    placeholder="Min price"
                    maxLength={30}
                  />
                  <span className={styles.priceRangeSep}>–</span>
                  <input
                    className={styles.fieldInput}
                    value={priceMax}
                    onChange={e => setPriceMax(e.target.value)}
                    placeholder="Max price"
                    maxLength={30}
                  />
                </div>
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Market</label>
                  <HelpTip text="Let people know whether you sell locally, export internationally, or both." />
                </div>
                <div className={styles.selectWrap}>
                  <select
                    className={styles.fieldSelect}
                    value={market}
                    onChange={e => setMarket(e.target.value)}
                  >
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

              {/* ── Business Hours ── */}
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
                            <input
                              type="time"
                              className={styles.hoursInput}
                              value={h.open}
                              onChange={e => updateHour(day, 'open', e.target.value)}
                            />
                            <span className={styles.hoursSep}>–</span>
                            <input
                              type="time"
                              className={styles.hoursInput}
                              value={h.close}
                              onChange={e => updateHour(day, 'close', e.target.value)}
                            />
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

              {/* Social links moved to Get Verified tab */}
            </>
          )}
        </div>

        {/* ── Let's Meet With — accordion ── */}
        {lookingFor && !MAKER_CATEGORIES.includes(lookingFor) && lookingFor !== 'car_taxi' && lookingFor !== 'bike_ride' && <div className={styles.section}>
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
        </div>}

        {/* ── Online status ── */}
        <div className={styles.section}>
          <div className={styles.sectionLabelRow}>
            <span className={styles.sectionLabel}>Set Your Status</span>
            <HelpTip text="Let people know if you're ready to meet. I'm Out — you're out right now. Invite Out — you want someone to invite you out. Later Out — set a time for when you'll be going out." />
          </div>
          <p className={styles.activityHint}>Let people know you're available — your status is set when you save your profile</p>

          {/* Particle container */}
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
              {/* I'm Out */}
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

              {/* Invite Out */}
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

              {/* Later Out */}
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

          {/* Selected status confirmation note */}
          {pendingStatus && (
            <p className={styles.statusSelectedNote}>
              {pendingStatus === 'im_out'     && '🚀 You\'ll be set live — save your profile to continue to location setup'}
              {pendingStatus === 'invite_out' && '💌 You\'ll appear as wanting an invite — save your profile to confirm'}
              {pendingStatus === 'later_out'  && '🕐 You\'re going out later — save your profile to set your time & place'}
            </p>
          )}
        </div>

        {/* ── Save button ── */}
        {profileTab === 'profile' && (
          <div className={styles.saveRow}>
            <button className={styles.saveBtn} onClick={handleDone} disabled={saving}>
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
            <button
              style={{ background: 'none', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.25)', fontSize: 11, padding: '6px 12px', cursor: 'pointer', fontFamily: 'monospace', marginTop: 8, width: '100%' }}
              onClick={() => setProfileTab('verified')}
            >
              🛠 Dev: preview Get Verified page
            </button>
          </div>
        )}

      </div>

      {/* ── Get Verified Tab ── */}
      {profileTab === 'verified' && (() => {
        const SOCIAL_LINKS = [
          { key: 'instagram', label: 'Instagram', placeholder: 'your_username', value: instagramHandle, set: setInstagramHandle, color: '#8B0000',
            getUrl: v => `https://instagram.com/${v}`,
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
          },
          { key: 'tiktok', label: 'TikTok', placeholder: 'your_username', value: tiktokHandle, set: setTiktokHandle, color: '#010101',
            getUrl: v => `https://tiktok.com/@${v}`,
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.05a8.16 8.16 0 004.77 1.52V7.12a4.85 4.85 0 01-1-.43z"/></svg>,
          },
          { key: 'facebook', label: 'Facebook', placeholder: 'page name or URL', value: facebookHandle, set: setFacebookHandle, color: '#1877F2',
            getUrl: v => `https://facebook.com/${v}`,
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
          },
          { key: 'youtube', label: 'YouTube', placeholder: '@channel or handle', value: youtubeHandle, set: setYoutubeHandle, color: '#FF0000',
            getUrl: v => `https://youtube.com/${v.startsWith('@') ? v : '@' + v}`,
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
          },
          { key: 'website', label: 'Website', placeholder: 'https://yoursite.com', value: websiteUrl, set: setWebsiteUrl, color: '#8DC63F',
            getUrl: v => v.startsWith('http') ? v : `https://${v}`,
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
          },
        ]
        const hasAnyLink     = SOCIAL_LINKS.some(l => l.value.trim())
        const hasAnyConfirmed = SOCIAL_LINKS.some(l => l.value.trim() && confirmedLinks[l.key])
        const spotsTotal = 10000
        const spotsTaken = 8241
        const spotsLeft  = spotsTotal - spotsTaken
        const barPct     = Math.round((spotsTaken / spotsTotal) * 100)

        return (
          <div className={styles.verifiedScroll}>

            {/* ── Hero ── */}
            <div className={styles.vHero}>
              <span className={styles.vHeroTitle}>0% Commission</span>
              <p className={styles.vHeroSub}>
                hangger.app never takes a cut — no commission on sales, no fee when contact changes hands.
                Get verified and your account is fully live, open for business, and completely yours.
              </p>
            </div>

            {/* ── Benefits ── */}
            <div className={styles.vBenefits}>
              {[
                'Verified badge on your profile',
                'Social media links shown to all buyers',
                'Higher listing on hangger.app',
                'Local buyers message you free — no unlock fee',
                'No commission, ever',
              ].map(b => (
                <div key={b} className={styles.vBenefitRow}>
                  <span className={styles.vBenefitCheck}>✓</span>
                  <span className={styles.vBenefitText}>{b}</span>
                </div>
              ))}
            </div>

            {/* ── Divider ── */}
            <div className={styles.vDivider} />

            {/* ── Seats ── */}
            <div className={styles.vSeats}>
              <div className={styles.vSeatsTop}>
                <span className={styles.vSeatCount}>{spotsLeft.toLocaleString()}</span>
                <span className={styles.vSeatLabel}> founding seats remaining</span>
              </div>
              <div className={styles.vBar}>
                <div className={styles.vBarFill} style={{ width: `${barPct}%` }} />
              </div>
              <p className={styles.vSeatSub}>Window closing fast — {spotsTaken.toLocaleString()} of {spotsTotal.toLocaleString()} seats filled</p>
            </div>

            {/* ── Price ── */}
            <div className={styles.vPrice}>
              <span className={styles.vPriceAmount}>{pricing.display}</span>
              <span className={styles.vPricePer}>/mo</span>
              <span className={styles.vPriceTag}>Full premium · Price locked 3 years</span>
            </div>

            {/* ── Divider ── */}
            <div className={styles.vDivider} />

            {/* ── Social links ── */}
            <div className={styles.vSocialSection}>
              <p className={styles.vSocialTitle}>Your Social Links</p>
              <p className={styles.vSocialHint}>Add one or all — edit and update any time. Tap Confirm to verify each link works.</p>
              <div className={styles.vSocialList}>
                {SOCIAL_LINKS.map(({ key, label, placeholder, value, set, color, getUrl, icon }) => (
                  <div key={key} className={styles.vSocialRow}>
                    <div className={styles.vSocialIcon} style={{ background: color }}>{icon}</div>
                    <div className={styles.vSocialInputWrap}>
                      <span className={styles.vSocialName}>{label}</span>
                      <input
                        className={styles.vSocialInput}
                        value={value}
                        onChange={e => { set(e.target.value); setConfirmedLinks(p => ({ ...p, [key]: false })) }}
                        placeholder={placeholder}
                        maxLength={100}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                      />
                    </div>
                    {value.trim() && (
                      <button
                        className={`${styles.vConfirmBtn} ${confirmedLinks[key] ? styles.vConfirmBtnDone : ''}`}
                        type="button"
                        onClick={() => {
                          window.open(getUrl(value.trim()), '_blank', 'noopener')
                          setConfirmedLinks(p => ({ ...p, [key]: true }))
                        }}
                      >
                        {confirmedLinks[key] ? '✓' : 'Confirm'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Divider ── */}
            <div className={styles.vDivider} />

            {/* ── Action buttons ── */}
            <div className={styles.vActions}>
              {hasAnyConfirmed ? (
                <button
                  className={styles.vGetVerifiedBtn}
                  onClick={() => {
                    showToast('Payment coming soon — we\'ll notify you when it\'s live.')
                    if (onboarding) setTimeout(() => onClose?.(), 1800)
                  }}
                >
                  Get Verified — {pricing.display}/mo
                </button>
              ) : hasAnyLink ? (
                <button className={styles.vGetVerifiedBtnWaiting} disabled>
                  Confirm a link above to continue
                </button>
              ) : (
                <button className={styles.vGetVerifiedBtnWaiting} disabled>
                  Add a social link above to get verified
                </button>
              )}
              <button
                className={styles.vPassBtn}
                onClick={() => {
                  if (onboarding) { onClose?.() }
                  else { setProfileTab('profile'); showToast('No problem — your basic profile is live.') }
                }}
              >
                {onboarding ? 'Continue to App →' : 'Pass Offer — Stay on Basic'}
              </button>
              <p className={styles.vFootnote}>No commission · No price increases · Cancel any time</p>
            </div>

          </div>
        )
      })()}

      {/* ── Shop Tab ── */}
      {profileTab === 'shop' && hasShop && (
        <MicroShopEditor
          userId={user?.uid ?? user?.id}
          tier={tier}
          visible={profileTab === 'shop'}
        />
      )}

      {/* ── Go Out Setup overlay ── */}
      {showGoOutSetup && (
        <GoOutSetup
          pendingStatus={pendingStatus}
          activityType={selectedActivity}
          userCity={city}
          onDone={() => { setShowGoOutSetup(false); onClose?.() }}
          onSkip={() => { setShowGoOutSetup(false); onClose?.() }}
        />
      )}
      <UpgradeSheet
        open={showUpgrade}
        onClose={() => { setShowUpgrade(false); onClose?.() }}
        showToast={showToast}
        lookingFor={lookingFor}
      />

      {/* ── Shop / page type sheet ── */}
      <ShopTypeSheet
        open={shopTypeOpen}
        value={shopType ?? getCategoryCopy(lookingFor).pageType}
        onChange={setShopType}
        onClose={() => setShopTypeOpen(false)}
      />

      {/* ── Trade role sheet ── */}
      <TradeRoleSheet
        open={tradeRoleOpen}
        value={tradeRole}
        onChange={setTradeRole}
        onClose={() => setTradeRoleOpen(false)}
      />

      {/* ── Cuisine picker sheet ── */}
      <CuisineSheet
        open={cuisineOpen}
        value={cuisineType}
        onChange={setCuisineType}
        onClose={() => setCuisineOpen(false)}
      />

      {/* ── Language picker sheet ── */}
      <LanguagePickerSheet
        open={langPickerOpen}
        value={speakingSecond}
        exclude={speakingNative}
        onChange={setSpeakingSecond}
        onClose={() => setLangPickerOpen(false)}
      />

      {/* ── Dating: relationship goal sheet ── */}
      <DatingPickerSheet
        open={relGoalOpen}
        title="Looking for…"
        subtitle="What kind of connection are you hoping to make?"
        options={DATING_REL_GOAL_OPTIONS}
        value={relationshipGoal}
        onChange={setRelationshipGoal}
        onClose={() => setRelGoalOpen(false)}
      />

      {/* ── Dating: star sign sheet ── */}
      <DatingPickerSheet
        open={starSignOpen}
        title="Star Sign"
        subtitle="Choose your zodiac sign"
        options={DATING_STAR_SIGNS}
        value={starSign}
        onChange={setStarSign}
        onClose={() => setStarSignOpen(false)}
      />

      {/* ── Looking For sheet ── */}
      <LookingForSheet
        open={lookingForOpen}
        value={lookingFor}
        subValue={subCategory}
        onChange={(main, sub) => { setLookingFor(main); setSubCategory(sub ?? null) }}
        onClose={() => setLookingForOpen(false)}
      />

      {/* ── Account Drawer (self-contained portal) ── */}
      {drawerOpen && createPortal(
        <div className={styles.drawerOverlay}>
          <div className={styles.drawerBackdrop} onClick={() => setDrawerOpen(false)} />
          <div className={styles.drawerPanel}>
            {/* Header */}
            <div className={styles.drawerHeader}>
              <div className={styles.drawerHeaderUser}>
                <div className={styles.drawerAvatar}>
                  {userProfile?.photoURL
                    ? <img src={userProfile.photoURL} alt="" className={styles.drawerAvatarImg} />
                    : <span className={styles.drawerAvatarInitial}>{(userProfile?.displayName ?? 'Y')[0].toUpperCase()}</span>
                  }
                </div>
                <div>
                  <div className={styles.drawerName}>{userProfile?.displayName ?? 'You'}</div>
                  <div className={styles.drawerEmail}>{user?.email ?? ''}</div>
                </div>
              </div>
              <button className={styles.drawerCloseBtn} onClick={() => setDrawerOpen(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className={styles.drawerContent}>
              {/* Notifications toggle */}
              <button className={styles.drawerRow} onClick={handleNotifToggle}>
                <span className={styles.drawerRowIcon}>🔔</span>
                <div className={styles.drawerRowText}>
                  <span className={styles.drawerRowLabel}>Push Notifications</span>
                  <span className={styles.drawerRowSub}>{notifOn ? 'On — tap to disable' : 'Off — tap to enable'}</span>
                </div>
                <div className={`${styles.drawerToggle} ${notifOn ? styles.drawerToggleOn : ''}`}>
                  <div className={styles.drawerToggleThumb} />
                </div>
              </button>

              {/* Privacy */}
              <button className={styles.drawerRow} onClick={() => setToast({ message: 'Privacy controls coming soon.', type: 'error' })}>
                <span className={styles.drawerRowIcon}>🔒</span>
                <div className={styles.drawerRowText}>
                  <span className={styles.drawerRowLabel}>Privacy Controls</span>
                  <span className={styles.drawerRowSub}>Manage what others can see</span>
                </div>
                <svg className={styles.drawerRowArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>

              {/* Blocked users */}
              <button className={styles.drawerRow} onClick={() => setToast({ message: 'Block list coming soon.', type: 'error' })}>
                <span className={styles.drawerRowIcon}>🚫</span>
                <div className={styles.drawerRowText}>
                  <span className={styles.drawerRowLabel}>Blocked Users</span>
                  <span className={styles.drawerRowSub}>Manage people you've blocked</span>
                </div>
                <svg className={styles.drawerRowArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>

              {/* Safety */}
              <button className={styles.drawerRow} onClick={() => setToast({ message: 'Always meet in a public place. Trust your instincts.', type: 'error' })}>
                <span className={styles.drawerRowIcon}>🛡️</span>
                <div className={styles.drawerRowText}>
                  <span className={styles.drawerRowLabel}>Safety Centre</span>
                  <span className={styles.drawerRowSub}>Tips for staying safe while out</span>
                </div>
                <svg className={styles.drawerRowArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>

              {/* About */}
              <button className={styles.drawerRow} onClick={() => setToast({ message: "Hangger v0.1.0 — who's hanging near you?", type: 'error' })}>
                <span className={styles.drawerRowIcon}>ℹ️</span>
                <div className={styles.drawerRowText}>
                  <span className={styles.drawerRowLabel}>About Hangger</span>
                  <span className={styles.drawerRowSub}>Version 0.1.0</span>
                </div>
              </button>

              {/* Download my data — GDPR Art. 20 */}
              <button
                className={styles.drawerRow}
                onClick={async () => {
                  setExportingData(true)
                  try { await exportMyData(user?.id) }
                  catch { setToast({ message: 'Export failed — try again', type: 'error' }) }
                  finally { setExportingData(false) }
                }}
                disabled={exportingData}
              >
                <span className={styles.drawerRowIcon}>📥</span>
                <div className={styles.drawerRowText}>
                  <span className={styles.drawerRowLabel}>{exportingData ? 'Preparing download…' : 'Download My Data'}</span>
                  <span className={styles.drawerRowSub}>GDPR export — all your data as JSON</span>
                </div>
              </button>

              {/* Reset password (email users only) */}
              {user?.email && (
                <button
                  className={styles.drawerRow}
                  onClick={async () => {
                    try {
                      await sendPasswordReset(user.email)
                      setResetPwStep('sent')
                      setTimeout(() => setResetPwStep(null), 6000)
                    } catch (e) {
                      setToast({ message: e.message, type: 'error' })
                    }
                  }}
                >
                  <span className={styles.drawerRowIcon}>🔑</span>
                  <div className={styles.drawerRowText}>
                    <span className={styles.drawerRowLabel}>
                      {resetPwStep === 'sent' ? '✅ Reset link sent!' : 'Reset Password'}
                    </span>
                    <span className={styles.drawerRowSub}>
                      {resetPwStep === 'sent' ? `Check ${user.email}` : 'Send a reset link to your email'}
                    </span>
                  </div>
                </button>
              )}

              {/* Sign out */}
              <div className={styles.drawerDivider} />
              <button className={`${styles.drawerRow} ${styles.drawerRowDanger}`} onClick={handleDrawerSignOut} disabled={drawerSigningOut}>
                <span className={styles.drawerRowIcon}>🚪</span>
                <div className={styles.drawerRowText}>
                  <span className={styles.drawerRowLabel}>{drawerSigningOut ? 'Signing out…' : 'Sign Out'}</span>
                  <span className={styles.drawerRowSub}>Your listing drops from the map instantly</span>
                </div>
              </button>

              {/* Delete account — GDPR Art. 17 */}
              <div className={styles.drawerDivider} />
              {deleteStep === null && (
                <button
                  className={`${styles.drawerRow} ${styles.drawerRowDanger}`}
                  onClick={() => setDeleteStep('confirm')}
                >
                  <span className={styles.drawerRowIcon}>🗑️</span>
                  <div className={styles.drawerRowText}>
                    <span className={styles.drawerRowLabel}>Delete Account</span>
                    <span className={styles.drawerRowSub}>Permanently remove all your data</span>
                  </div>
                </button>
              )}
              {deleteStep === 'confirm' && (
                <div className={styles.drawerDeleteConfirm}>
                  <p className={styles.drawerDeleteWarning}>
                    ⚠️ This permanently deletes your profile, photos, and all data. This cannot be undone.
                  </p>
                  <div className={styles.drawerDeleteBtns}>
                    <button
                      className={styles.drawerDeleteCancel}
                      onClick={() => setDeleteStep(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.drawerDeleteConfirmBtn}
                      onClick={async () => {
                        setDeleteStep('deleting')
                        try {
                          await deleteAccount(user?.id)
                          await signOut()
                        } catch (e) {
                          setDeleteStep(null)
                          setToast({ message: e.message, type: 'error' })
                        }
                      }}
                    >
                      Yes, delete everything
                    </button>
                  </div>
                </div>
              )}
              {deleteStep === 'deleting' && (
                <div className={styles.drawerRow}>
                  <span className={styles.drawerRowIcon}>⏳</span>
                  <div className={styles.drawerRowText}>
                    <span className={styles.drawerRowLabel}>Deleting your account…</span>
                    <span className={styles.drawerRowSub}>Please wait</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Photo reposition panel ── */}
      {photoEditOpen && (
        <div className={styles.photoEditPanel}>
          <div className={styles.photoEditHeader}>
            <button className={styles.photoEditHomeBtn} onClick={() => setPhotoEditOpen(false)} aria-label="Close editor">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </button>
            <span className={styles.photoEditTitle}>Photo Editor</span>
          </div>
          <div className={styles.photoEditPreviewWrap}>
            <img
              src={photoURL}
              alt="Preview"
              className={styles.photoEditPreviewImg}
              style={{
                objectPosition: `${photoOffsetX}% ${photoOffsetY}%`,
                transform: `scale(${photoZoom})`,
                transformOrigin: `${photoOffsetX}% ${photoOffsetY}%`,
              }}
            />
            <div className={styles.photoEditOverlayLabel}>
              <span className={styles.photoEditOverlayTitle}>Adjust Photo</span>
              <span className={styles.photoEditOverlaySub}>Adjust for best position</span>
            </div>
          </div>
          <div className={styles.photoEditSliders}>
            <div className={styles.photoEditSliderBlock}>
              <div className={styles.photoEditSliderHeader}>
                <span className={styles.photoEditSliderName}>HORIZONTAL</span>
                <span className={styles.photoEditSliderValue}>{photoOffsetX > 50 ? `R ${photoOffsetX - 50}` : photoOffsetX < 50 ? `L ${50 - photoOffsetX}` : 'CENTER'}</span>
              </div>
              <div className={styles.photoEditRow}>
                <span className={styles.photoEditLabel}>↔</span>
                <input type="range" min={0} max={100} value={photoOffsetX} onChange={e => setPhotoOffsetX(Number(e.target.value))} className={styles.photoEditSlider} />
              </div>
            </div>
            <div className={styles.photoEditSliderBlock}>
              <div className={styles.photoEditSliderHeader}>
                <span className={styles.photoEditSliderName}>VERTICAL</span>
                <span className={styles.photoEditSliderValue}>{photoOffsetY > 50 ? `DOWN ${photoOffsetY - 50}` : photoOffsetY < 50 ? `UP ${50 - photoOffsetY}` : 'CENTER'}</span>
              </div>
              <div className={styles.photoEditRow}>
                <span className={styles.photoEditLabel}>↕</span>
                <input type="range" min={0} max={100} value={photoOffsetY} onChange={e => setPhotoOffsetY(Number(e.target.value))} className={styles.photoEditSlider} />
              </div>
            </div>
            <div className={styles.photoEditSliderBlock}>
              <div className={styles.photoEditSliderHeader}>
                <span className={styles.photoEditSliderName}>ZOOM</span>
                <span className={styles.photoEditSliderValue}>{Math.round(photoZoom * 100)}%</span>
              </div>
              <div className={styles.photoEditRow}>
                <span className={styles.photoEditLabel}>🔍</span>
                <input type="range" min={100} max={250} value={Math.round(photoZoom * 100)} onChange={e => setPhotoZoom(Number(e.target.value) / 100)} className={styles.photoEditSlider} />
              </div>
            </div>
          </div>
          <div className={styles.photoEditFooter}>
            <p className={styles.photoEditHint}>Drag sliders to reposition · zoom in to fill the frame</p>
            <button className={styles.photoSaveBtn} onClick={() => setPhotoEditOpen(false)}>
              Save Photo
            </button>
          </div>
        </div>
      )}
    </div>

      {/* ── Driver: incoming booking modal ── */}
      {incomingBooking && !activeTrip && (
        <DriverIncomingBooking
          booking={incomingBooking}
          driverId={driverId}
          onAccepted={(booking) => { setIncomingBooking(null); setActiveTrip(booking) }}
          onDeclined={() => setIncomingBooking(null)}
        />
      )}

      {/* ── Driver: active trip screen ── */}
      {activeTrip && (
        <DriverTripScreen
          booking={activeTrip}
          driverId={driverId}
          onCompleted={() => setActiveTrip(null)}
          onClose={() => setActiveTrip(null)}
        />
      )}

      {/* ── Driver: earnings screen ── */}
      {earningsOpen && (
        <DriverEarningsScreen
          driverId={driverId}
          profile={userProfile}
          onClose={() => setEarningsOpen(false)}
        />
      )}

      {/* ── Restaurant dashboard ── */}
      {restaurantDashOpen && (
        <RestaurantDashboard
          userId={driverId}
          onClose={() => setRestaurantDashOpen(false)}
        />
      )}
    </>
  )
}
