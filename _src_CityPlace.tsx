/**
 * City Place Card – 1:1 layout clone of Beauty Home Service card (FacialPlaceHomeCard).
 * Same UI structure, CSS classes, spacing, icon placement, hover effects, shadows, responsive behavior.
 * Used for: Massage Places, Facial Places, Beauty Places (City Places tab).
 */

import React, { useState, useEffect } from 'react';
import type { Place, Analytics } from '../types';
import { getDisplayRating, formatRating } from '../utils/ratingUtils';
import DistanceDisplay from './DistanceDisplay';
import { bookingService } from '../lib/bookingService';
import { isDiscountActive } from '../utils/therapistCardHelpers';
import SocialSharePopup from './SocialSharePopup';
import { shareLinkService } from '../lib/services/shareLinkService';
import { Share2, Calendar, Clock } from 'lucide-react';
import { VERIFIED_BADGE_IMAGE_URL } from '../constants/appConstants';
import { isBookingUseAdminCountry, normalizeWhatsAppToDigits } from '../config/whatsappCountryPrefix';
import { getMassagePlaceCardImage } from '../constants/massagePlaceCardImages';

const DEFAULT_PLACE_IMAGE = 'https://ik.imagekit.io/7grri5v7d/facial%202.png?updatedAt=1766551253328';

/** Fallback when pool is empty (profile always uses place.mainImage). */
const MASSAGE_PLACE_LISTING_CARD_IMAGE = 'https://ik.imagekit.io/7grri5v7d/ma%201.png';

/** Branch icon shown to the right of the Open button on massage city places home card. */
const BRANCH_ICON_URL = 'https://ik.imagekit.io/7grri5v7d/branch%206s.png';

/** Map language name (from dashboard) to flag emoji. Only show when member selects languages in dashboard. */
const LANGUAGE_FLAG_MAP: Record<string, string> = {
  english: '🇬🇧', en: '🇬🇧',
  indonesian: '🇮🇩', id: '🇮🇩', 'bahasa indonesia': '🇮🇩',
  mandarin: '🇨🇳', chinese: '🇨🇳', zh: '🇨🇳',
  japanese: '🇯🇵', ja: '🇯🇵',
  korean: '🇰🇷', ko: '🇰🇷',
  thai: '🇹🇭', th: '🇹🇭',
  vietnamese: '🇻🇳', vi: '🇻🇳',
  spanish: '🇪🇸', es: '🇪🇸',
  french: '🇫🇷', fr: '🇫🇷',
  german: '🇩🇪', de: '🇩🇪',
  portuguese: '🇵🇹', pt: '🇵🇹',
  italian: '🇮🇹', it: '🇮🇹',
  russian: '🇷🇺', ru: '🇷🇺',
  arabic: '🇸🇦', ar: '🇸🇦',
  dutch: '🇳🇱', nl: '🇳🇱',
  hindi: '🇮🇳', hi: '🇮🇳',
  malay: '🇲🇾', ms: '🇲🇾',
};
function getLanguageFlag(lang: string): string {
  if (!lang || typeof lang !== 'string') return '🌐';
  const key = lang.trim().toLowerCase();
  return LANGUAGE_FLAG_MAP[key] || '🌐';
}

export type CityPlaceCategory = 'massage' | 'facial' | 'beauty';

/** Admin WhatsApp for Indonesia booking flow (send to admin; admin coordinates). */
const ADMIN_WHATSAPP_DIGITS = '6281392000050';

interface CityPlaceCardProps {
    place: Place | Record<string, any>;
    category: CityPlaceCategory;
    onClick: (place: Place | Record<string, any>) => void;
    onIncrementAnalytics: (metric: keyof Analytics) => void;
    userLocation?: { lat: number; lng: number } | null;
    /** When 'profile', card shows Book Now + Menu prices; container tap shows fingerprint and Book Now heartbeat. */
    variant?: 'listing' | 'profile';
    /** User/country code for booking: Indonesia (ID) → WhatsApp to admin; others → direct to place WhatsApp. */
    userCountryCode?: string;
}

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20">
        <path fill="currentColor" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

/** Main/hero image for banner and gallery. Use for card top image and photo strip. */
function getPlaceMainImage(place: any): string {
    return (
        place?.mainImage ||
        place?.image ||
        place?.main_image ||
        place?.profilePicture ||
        place?.profile_image ||
        DEFAULT_PLACE_IMAGE
    );
}

/** Profile/avatar image for the round profile circle. Do not use for hero banner. */
function getPlaceProfileImage(place: any): string {
    return (
        place?.profilePicture ||
        place?.profile_image ||
        place?.logo ||
        place?.mainImage ||
        place?.image ||
        place?.main_image ||
        DEFAULT_PLACE_IMAGE
    );
}

function getShareEntityType(category: CityPlaceCategory): 'place' | 'facial' {
    if (category === 'facial') return 'facial';
    return 'place';
}

function getMetaBarLabel(category: CityPlaceCategory): string {
    switch (category) {
        case 'massage': return 'Massage Spa';
        case 'facial': return 'Beauty Portal';
        case 'beauty': return 'Beauty Salon';
        default: return 'City Place';
    }
}

function getCategoryBadgeText(category: CityPlaceCategory): string {
    switch (category) {
        case 'massage': return 'Massage spa · Visit us';
        case 'facial': return 'Facial clinic · Visit us';
        case 'beauty': return 'Beauty salon · Visit us';
        default: return 'Visit us';
    }
}

function getTreatmentsLabel(place: any, category: CityPlaceCategory): string {
    switch (category) {
        case 'massage': return (place as any).services || 'All Massage Types';
        case 'facial': return (place as any).treatments || 'Facial & Beauty Services';
        case 'beauty': return (place as any).treatments || (place as any).services || 'Beauty Services';
        default: return 'Services';
    }
}

function getTreatmentRowTitle(category: CityPlaceCategory, label: string, key: string): string {
    if (category === 'massage') return `Massage · ${label}`;
    if (category === 'facial' || category === 'beauty') return label;
    return label;
}

const CityPlaceCard: React.FC<CityPlaceCardProps> = ({
    place,
    category,
    onClick,
    onIncrementAnalytics,
    userLocation,
    variant = 'listing',
    userCountryCode = 'ID',
}) => {
    const mainImage =
        category === 'massage' && variant === 'listing'
            ? getMassagePlaceCardImage(String((place as any).$id ?? (place as any).id ?? ''))
            : getPlaceMainImage(place);
    const profileImage = getPlaceProfileImage(place);
    const [bookingsCount, setBookingsCount] = useState<number>(() => {
        try {
            if ((place as any).analytics) {
                const parsed = JSON.parse((place as any).analytics);
                if (parsed && typeof parsed.bookings === 'number') return parsed.bookings;
            }
        } catch {}
        return 0;
    });

    const [showSharePopup, setShowSharePopup] = useState(false);
    const [shortShareUrl, setShortShareUrl] = useState<string>('');
    const [selectedPhoto, setSelectedPhoto] = useState<{ imageUrl: string; title: string; description: string } | null>(null);
    const [showMenuSlider, setShowMenuSlider] = useState(false);
    /** Which price container is selected (massage profile): '60' | '90' | '120' | null. Fingerprint shows inside that container, Book Now heartbeat when set. */
    const [selectedPriceKey, setSelectedPriceKey] = useState<'60' | '90' | '120' | null>(null);
    /** Menu slider step: 'menu' = prices + Scheduled/Book Now; 'scheduled' = date/time picker for scheduled booking (massage only). */
    const [menuSliderStep, setMenuSliderStep] = useState<'menu' | 'scheduled'>('menu');
    const [scheduledDate, setScheduledDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
    const [scheduledTime, setScheduledTime] = useState<string>('10:00');
    const [showDepositNotice, setShowDepositNotice] = useState(false);

    const handleShareClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowSharePopup(true);
    };

    useEffect(() => {
        const loadBookingsCount = async () => {
            try {
                const placeId = String((place as any).id || (place as any).$id || '');
                if (!placeId) return;
                const count = await bookingService.getBookingsCount(placeId, 'place');
                setBookingsCount(count);
            } catch {}
        };
        loadBookingsCount();
    }, [place]);

    useEffect(() => {
        const generateShareUrl = async () => {
            try {
                const placeId = String((place as any).id || (place as any).$id || '');
                if (!placeId) return;
                const entityType = getShareEntityType(category);
                const shareLink = await shareLinkService.getByEntity(entityType, placeId);
                if (shareLink) {
                    setShortShareUrl(`https://www.indastreetmassage.com/share/${shareLink.shortId}`);
                } else {
                    const slug = (place as any).name?.replace(/\s+/g, '-').toLowerCase() || 'place';
                    const base = category === 'facial' ? '/facial' : '/place';
                    setShortShareUrl(`https://www.indastreetmassage.com${base}/${slug}`);
                }
            } catch {
                const slug = (place as any).name?.replace(/\s+/g, '-').toLowerCase() || 'place';
                const base = category === 'facial' ? '/facial' : '/place';
                setShortShareUrl(`https://www.indastreetmassage.com${base}/${slug}`);
            }
        };
        generateShareUrl();
    }, [place, category]);

    const getPricing = () => {
        const p = place as any;
        const hasValid = (p.price60 && parseInt(p.price60) > 0) || (p.price90 && parseInt(p.price90) > 0) || (p.price120 && parseInt(p.price120) > 0);
        if (hasValid) {
            return {
                "60": p.price60 ? parseInt(p.price60) * 1000 : 0,
                "90": p.price90 ? parseInt(p.price90) * 1000 : 0,
                "120": p.price120 ? parseInt(p.price120) * 1000 : 0,
            };
        }
        return { "60": 0, "90": 0, "120": 0 };
    };

    const pricing = getPricing();

    const rawRating = getDisplayRating((place as any).rating, (place as any).reviewCount);
    const effectiveRating = rawRating > 0 ? rawRating : 4.9;
    const displayRating = formatRating(effectiveRating);

    const formatPrice = (price: number) => {
        if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
        if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
        return price.toLocaleString('id-ID');
    };

    const getStatusStyles = () => {
        const statusStr = String((place as any).availability || (place as any).status || 'Busy').trim().toLowerCase();
        if (statusStr === 'available' || statusStr === 'online' || statusStr === 'open') {
            return { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Open', isAvailable: true };
        }
        return { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', label: 'Busy', isAvailable: false };
    };

    const statusStyle = getStatusStyles();

    const getInitialBookingCount = (placeId: string): number => {
        let hash = 0;
        for (let i = 0; i < placeId.length; i++) {
            hash = ((hash << 5) - hash) + placeId.charCodeAt(i);
            hash = hash & hash;
        }
        return 25 + (Math.abs(hash) % 31);
    };

    const joinedDateRaw = (place as any).membershipStartDate || (place as any).activeMembershipDate || (place as any).$createdAt;
    const joinedDisplay = (() => {
        if (!joinedDateRaw) return '—';
        try {
            const d = new Date(joinedDateRaw);
            if (isNaN(d.getTime())) return '—';
            return d.toLocaleDateString('en-GB');
        } catch {
            return '—';
        }
    })();

    const displayBookingsCount = bookingsCount === 0 ? getInitialBookingCount(String((place as any).id || (place as any).$id || '')) : bookingsCount;
    const placeName = (place as any).name || (category === 'massage' ? 'Massage Place' : category === 'facial' ? 'Facial Clinic' : 'Beauty Salon');

    return (
        <div className="relative">
            {/* External meta bar – hidden on profile; on listing show joined date + category label */}
            {variant !== 'profile' && (
            <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-[11px] text-gray-600 font-medium flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {joinedDisplay}
                </span>
                <span className="text-[11px] text-pink-600 font-semibold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {getMetaBarLabel(category)}
                </span>
            </div>
            )}

            <div
                onClick={() => {
                    if (typeof onClick === 'function') {
                        onClick(place);
                        onIncrementAnalytics('views');
                    }
                }}
                className="bg-white rounded-2xl overflow-visible border border-slate-200 hover:border-orange-200 hover:shadow-xl transition-all duration-300 cursor-pointer group"
            >
                {/* Image Container – same height/ratio as Beauty Home Service card. Top amber line: same as profile page main image. */}
                <div className="relative rounded-t-2xl pt-2 bg-white overflow-visible">
                    {/* Top amber line – same as MassagePlaceProfilePage hero: rounded-t-2xl to match container */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 opacity-90 pointer-events-none rounded-t-2xl" />
                    <div className="relative h-56 overflow-hidden bg-transparent rounded-t-2xl" style={{ minHeight: '224px' }}>
                    <img
                        src={mainImage}
                        alt={placeName}
                        className="w-full h-full object-cover rounded-t-2xl"
                        style={{ aspectRatio: '400/224', minHeight: '224px' }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_PLACE_IMAGE;
                        }}
                    />

                    {/* Amber line over main image – same as massage city profile */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-amber-500 pointer-events-none rounded-b-2xl" />

                    <div className="absolute top-3 left-3 shadow-lg flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5">
                        <StarIcon className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-bold text-white">{displayRating}</span>
                    </div>

                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                        {displayBookingsCount}+ {displayBookingsCount === 1 ? 'treatment' : 'treatments'}
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleShareClick(e); }}
                        className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/70 transition-all z-10"
                        title="Share"
                        aria-label="Share"
                    >
                        <Share2 className="w-4 h-4 text-white" strokeWidth={2.5} aria-hidden />
                    </button>

                    {isDiscountActive(place as any) && (
                        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 backdrop-blur-sm animate-pulse">
                            <span className="text-xs font-bold text-white">{(place as any).discountPercentage}% OFF</span>
                        </div>
                    )}

                    {variant !== 'profile' && category !== 'massage' && (
                        <div className="absolute bottom-3 left-3 bg-orange-500/90 text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow-md">
                            {getCategoryBadgeText(category)}
                        </div>
                    )}
                    </div>
                </div>

                {/* Location display – same style */}
                <div className="px-4 mt-3 flex flex-col items-end">
                    <div className="flex items-center gap-1 text-xs text-black font-medium">
                        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="truncate max-w-[200px] sm:max-w-none">
                            {(place as any).address || (place as any).location || (place as any).city || 'Location'}
                        </span>
                    </div>
                    <div className="text-xs text-orange-500 mt-1 font-medium">
                        {(place as any).city ? `Serves ${(place as any).city} area` : (place as any).address || (place as any).location ? `Serves ${String((place as any).address || (place as any).location || '').split(',')[0].trim() || 'this'} area` : 'View profile for location'}
                    </div>
                </div>

                {/* Profile Section – overlapping main image by ~30%, same as Beauty Home Service card */}
                <div className="px-4 -mt-[115px] pb-4 relative z-30 overflow-visible pointer-events-none">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 relative z-30">
                            <div className="w-[100px] h-[100px] sm:w-[110px] sm:h-[110px] md:w-[120px] md:h-[120px] rounded-full overflow-hidden relative">
                                <img
                                    className="w-full h-full object-cover pointer-events-auto border-4 border-white rounded-full"
                                    src={profileImage}
                                    alt={placeName}
                                    loading="lazy"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = DEFAULT_PLACE_IMAGE;
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Name and Status – same offset ml-[75px]; overflow-visible + high z so branch image is not covered */}
                <div className="px-4 mt-[2px] mb-3 relative z-50 overflow-visible">
                    <div className="mb-2 ml-[75px]">
                        <div className="flex items-center gap-2">
                            {(() => {
                                const hasVerifiedBadge = (place as any).verifiedBadge || (place as any).isVerified;
                                const hasBankDetails = (place as any).bankName && (place as any).accountName && (place as any).accountNumber;
                                const hasKtpUploaded = (place as any).ktpPhotoUrl;
                                const shouldShowBadge = hasVerifiedBadge || (hasBankDetails && hasKtpUploaded);
                                return shouldShowBadge && (
                                    <img
                                        src={VERIFIED_BADGE_IMAGE_URL}
                                        alt="Verified"
                                        className="w-5 h-5 flex-shrink-0"
                                        title="Verified - Complete Profile"
                                    />
                                );
                            })()}
                            <h3 className="text-lg font-bold text-gray-900 truncate">{placeName}</h3>
                        </div>
                    </div>
                    <div className="overflow-visible flex justify-start items-center gap-2 ml-[75px] relative w-full">
                        <div className={`inline-flex items-center px-2.5 rounded-full font-medium whitespace-nowrap ${statusStyle.bg} ${statusStyle.text}`} style={{ paddingTop: '0px', paddingBottom: '0px', lineHeight: '1', fontSize: '10px', transform: 'scaleY(0.9)' }}>
                            <span className="relative inline-flex mr-1.5" style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px' }}>
                                <span className={`absolute rounded-full ${statusStyle.dot} ${statusStyle.isAvailable ? '' : 'animate-pulse'} z-10`} style={{ width: '8px', height: '8px', left: '12px', top: '12px' }} />
                                {statusStyle.isAvailable && (
                                    <React.Fragment>
                                        <span className="absolute rounded-full bg-green-400 opacity-75 animate-ping" style={{ width: '20px', height: '20px', left: '6px', top: '6px' }} />
                                        <span className="absolute rounded-full bg-green-300 opacity-50 animate-ping" style={{ width: '28px', height: '28px', left: '2px', top: '2px', animationDuration: '1.5s' }} />
                                    </React.Fragment>
                                )}
                            </span>
                            <span className="text-xs">{statusStyle.label}</span>
                        </div>
                        {category === 'massage' && (
                            <div
                                className="absolute top-1/2 right-0 flex items-center justify-end pointer-events-none overflow-visible"
                                style={{
                                    zIndex: 10,
                                    transform: 'translateY(calc(-50% + 13px))',
                                    right: 62
                                }}
                            >
                                <img
                                    src={BRANCH_ICON_URL}
                                    alt=""
                                    className="w-[236px] h-[236px] sm:w-[348px] sm:h-[348px] object-contain object-right flex-shrink-0"
                                    loading="lazy"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Focus note – City Place = visit location */}
                <div className="mx-4 mb-1">
                    <p className="text-xs text-orange-600 font-medium">
                        {getMetaBarLabel(category)} · Visit our location
                    </p>
                </div>

                {/* Clinic photos strip – click thumbnail to open popup with image, title, description */}
                {(() => {
                    const placeName = (place as any).name || getMetaBarLabel(category);
                    const defaultDescription = (place as any).description ? String((place as any).description).slice(0, 80) + ((place as any).description?.length > 80 ? '…' : '') : `${getMetaBarLabel(category)} – Visit our location.`;
                    const photoItems: { imageUrl: string; title: string; description: string }[] = [];
                    const seen = new Set<string>();
                    const add = (imageUrl: string, title: string, description: string) => {
                        if (!imageUrl || seen.has(imageUrl)) return;
                        seen.add(imageUrl);
                        photoItems.push({ imageUrl, title, description });
                    };
                    add(mainImage, placeName, defaultDescription);
                    const gallery = (place as any).galleryImages;
                    if (Array.isArray(gallery)) {
                        gallery.forEach((g: any) => {
                            const url = g?.imageUrl || g?.url;
                            if (!url) return;
                            add(url, g?.header || g?.title || placeName, g?.description || defaultDescription);
                        });
                    }
                    if (Array.isArray((place as any).images)) {
                        (place as any).images.forEach((u: string) => u && add(u, placeName, defaultDescription));
                    }
                    const unique = photoItems.slice(0, 5);
                    if (unique.length === 0) return null;
                    return (
                        <div className="mx-4 mb-2">
                            <p className="text-[10px] font-semibold text-slate-600 mb-1.5">Photos</p>
                            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
                                {unique.map((item, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedPhoto(item);
                                        }}
                                        className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hover:border-amber-400 focus:border-amber-400 focus:outline-none"
                                    >
                                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* Treatments / Services row – same layout */}
                <div className="mx-4 mb-2">
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-800 flex-shrink-0 font-medium">
                            <span className="font-bold text-gray-900">Treatments:</span> {getTreatmentsLabel(place as any, category)}
                        </p>
                    </div>
                </div>

                {/* Description */}
                {(place as any).description && (
                    <div className="mx-4 mb-3">
                        <p className="text-sm text-gray-900 leading-5 break-words whitespace-normal line-clamp-2 text-left font-medium">
                            {(place as any).description}
                        </p>
                    </div>
                )}

                {/* Languages spoken – only when member has selected in dashboard (profile only, with flags) */}
                {variant === 'profile' && Array.isArray((place as any).languagesSpoken) && (place as any).languagesSpoken.length > 0 && (
                    <div className="mx-4 mb-3">
                        <p className="text-[10px] font-semibold text-slate-600 mb-1.5">Languages spoken</p>
                        <div className="flex flex-wrap gap-2 items-center">
                            {(place as any).languagesSpoken.map((lang: string, i: number) => (
                                <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                                    <span className="text-base leading-none" aria-hidden>{getLanguageFlag(lang)}</span>
                                    <span>{lang}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* PRICE CONTAINER — thumbnail left, duration row, price row */}
                <div className="mx-4 mb-4">
                    <div className="flex items-start gap-4 mt-3">
                        <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border-2 border-amber-200">
                            <img
                                src={profileImage}
                                alt={placeName}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_PLACE_IMAGE; }}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="grid grid-cols-3 text-sm font-medium text-gray-500 mb-1">
                                <div className="whitespace-nowrap">60 min</div>
                                <div className="whitespace-nowrap">90 min</div>
                                <div className="whitespace-nowrap">120 min</div>
                            </div>
                            <div className="grid grid-cols-3 text-base font-semibold text-gray-900">
                                <div className="whitespace-nowrap">{pricing['60'] > 0 ? formatPrice(pricing['60']) : '—'}</div>
                                <div className="whitespace-nowrap">{pricing['90'] > 0 ? formatPrice(pricing['90']) : '—'}</div>
                                <div className="whitespace-nowrap">{pricing['120'] > 0 ? formatPrice(pricing['120']) : '—'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Book Now + Menu prices (profile) or View Profile + Menu prices (listing) */}
                <div className="mx-4 mb-3 flex gap-2">
                    {variant === 'profile' ? (
                        <>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const placeName = (place as any).name || getMetaBarLabel(category);
                                    const placeId = String((place as any).id ?? (place as any).$id ?? '');
                                    const p60  = pricing['60']  > 0 ? `60 min – IDR ${formatPrice(pricing['60'])}` : null;
                                    const p90  = pricing['90']  > 0 ? `90 min – IDR ${formatPrice(pricing['90'])}` : null;
                                    const p120 = pricing['120'] > 0 ? `120 min – IDR ${formatPrice(pricing['120'])}` : null;
                                    const durLine = [p60, p90, p120].filter(Boolean).join(' / ');
                                    const useAdmin = isBookingUseAdminCountry(userCountryCode);
                                    let waNumber: string;
                                    let text: string;
                                    if (useAdmin) {
                                        waNumber = ADMIN_WHATSAPP_DIGITS;
                                        text = [
                                            `Hi IndaStreet Admin, I would like to book a massage at ${placeName}.`,
                                            placeId ? `Place ID: ${placeId}` : '',
                                            durLine ? `Duration & Price: ${durLine}` : '',
                                            `Please coordinate my visit. Thank you.`,
                                        ].filter(Boolean).join('\n');
                                    } else {
                                        const raw = (place as any).whatsappNumber ?? (place as any).whatsappnumber ?? '';
                                        const digits = normalizeWhatsAppToDigits(raw);
                                        if (!digits) {
                                            window.alert('This place has no WhatsApp number saved.');
                                            return;
                                        }
                                        waNumber = digits;
                                        text = [
                                            `Hi, I would like to book a massage at ${placeName}.`,
                                            durLine ? `Duration & Price: ${durLine}` : '',
                                            `Thank you.`,
                                        ].filter(Boolean).join('\n');
                                    }
                                    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm bg-amber-500 hover:bg-amber-600 text-white transition-colors ${selectedPriceKey ? 'book-now-heartbeat' : ''}`}
                                aria-label="Book Now"
                            >
                                Book Now
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuSliderStep('menu');
                                    setShowMenuSlider(true);
                                }}
                                className="flex-1 py-2.5 rounded-lg font-semibold text-sm border-2 border-amber-500 text-amber-600 hover:bg-amber-50 transition-colors"
                                aria-label="Menu prices"
                            >
                                Menu prices
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (typeof onClick === 'function') {
                                        const placeWithType = (place as any).type ? place : { ...(place as any), type: category };
                                        onClick(placeWithType);
                                    }
                                }}
                                className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                                aria-label="View profile"
                            >
                                View Profile
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuSliderStep('menu');
                                    setShowMenuSlider(true);
                                }}
                                className="flex-1 py-2.5 rounded-lg font-semibold text-sm border-2 border-amber-500 text-amber-600 hover:bg-amber-50 transition-colors"
                                aria-label="Menu prices"
                            >
                                Menu prices
                            </button>
                        </>
                    )}
                </div>

                {/* Menu slider – slide-up panel: Scheduled / Book Now (massage) + place menu (60/90/120) */}
                {showMenuSlider && (
                    <div
                        className="fixed inset-0 z-[10001] flex flex-col justify-end"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Menu prices"
                    >
                        <div className="absolute inset-0 bg-black/50" onClick={() => { setShowMenuSlider(false); setMenuSliderStep('menu'); setShowDepositNotice(false); }} aria-hidden />
                        <div className="relative bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-2xl z-10">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {menuSliderStep === 'scheduled' ? 'Select date & time' : `${(place as any).name || getMetaBarLabel(category)} – Menu`}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => { setShowMenuSlider(false); setMenuSliderStep('menu'); setShowDepositNotice(false); }}
                                    className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center"
                                    aria-label="Close"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-4 space-y-3">
                                {menuSliderStep === 'scheduled' ? (
                                    /* Scheduled: date + time picker, then 30% deposit notice for Indonesia */
                                    <>
                                        <p className="text-sm text-gray-600">Choose your preferred date and time for the massage.</p>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                                <input
                                                    type="date"
                                                    value={scheduledDate}
                                                    min={new Date().toISOString().slice(0, 10)}
                                                    onChange={(e) => setScheduledDate(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                                <input
                                                    type="time"
                                                    value={scheduledTime}
                                                    onChange={(e) => setScheduledTime(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                        {isBookingUseAdminCountry(userCountryCode) && (
                                            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                                                <p className="text-sm font-semibold text-amber-900">⚠️ 30% deposit required</p>
                                                <p className="text-xs text-amber-800 mt-1">A 30% deposit is required for all scheduled massage. Payable to admin for confirmation of booking. (Indonesia only)</p>
                                            </div>
                                        )}
                                        {showDepositNotice ? (
                                            <div className="bg-amber-100 border-2 border-amber-400 rounded-xl p-4">
                                                <p className="text-sm font-bold text-amber-900">30% deposit is required for all scheduled massage. Payable to admin for confirmation of booking.</p>
                                                <p className="text-xs text-amber-800 mt-2">You will be redirected to WhatsApp to confirm your booking.</p>
                                            </div>
                                        ) : null}
                                        <div className="flex gap-2 pt-2">
                                            {!showDepositNotice && isBookingUseAdminCountry(userCountryCode) ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowDepositNotice(true)}
                                                    className="flex-1 py-3 rounded-lg font-semibold bg-amber-500 hover:bg-amber-600 text-white"
                                                >
                                                    I understand, continue
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const placeName = (place as any).name || getMetaBarLabel(category);
                                                        const useAdmin = isBookingUseAdminCountry(userCountryCode);
                                                        let waNumber: string;
                                                        let text: string;
                                                        const dateStr = new Date(scheduledDate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                                        if (useAdmin) {
                                                            waNumber = ADMIN_WHATSAPP_DIGITS;
                                                            text = `Hi IndaStreet Admin, I would like to schedule a massage at ${placeName} on ${dateStr} at ${scheduledTime}. I understand 30% deposit is required, payable to admin for confirmation of booking. Thank you.`;
                                                        } else {
                                                            const raw = (place as any).whatsappNumber ?? (place as any).whatsappnumber ?? '';
                                                            const digits = normalizeWhatsAppToDigits(raw);
                                                            if (!digits) {
                                                                window.alert('This place has no WhatsApp number saved.');
                                                                return;
                                                            }
                                                            waNumber = digits;
                                                            text = `Hi, I would like to schedule a massage at ${placeName} on ${dateStr} at ${scheduledTime}. Thank you.`;
                                                        }
                                                        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
                                                        setShowMenuSlider(false);
                                                        setMenuSliderStep('menu');
                                                        setShowDepositNotice(false);
                                                    }}
                                                    className="flex-1 py-3 rounded-lg font-semibold bg-amber-500 hover:bg-amber-600 text-white"
                                                >
                                                    Confirm & open WhatsApp
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => { setMenuSliderStep('menu'); setShowDepositNotice(false); }}
                                                className="py-3 px-4 rounded-lg font-semibold border-2 border-gray-300 text-gray-700"
                                            >
                                                Back
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* For massage city places: Scheduled and Book Now at top */}
                                        {category === 'massage' && (
                                            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-200">
                                                <button
                                                    type="button"
                                                    onClick={() => setMenuSliderStep('scheduled')}
                                                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-800 font-semibold hover:bg-amber-100"
                                                >
                                                    <Calendar className="w-5 h-5" />
                                                    Scheduled
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowMenuSlider(false);
                                                        const placeName = (place as any).name || getMetaBarLabel(category);
                                                        const placeId = String((place as any).id ?? (place as any).$id ?? '');
                                                        const p60  = pricing['60']  > 0 ? `60 min – IDR ${formatPrice(pricing['60'])}` : null;
                                                        const p90  = pricing['90']  > 0 ? `90 min – IDR ${formatPrice(pricing['90'])}` : null;
                                                        const p120 = pricing['120'] > 0 ? `120 min – IDR ${formatPrice(pricing['120'])}` : null;
                                                        const durLine = [p60, p90, p120].filter(Boolean).join(' / ');
                                                        const useAdmin = isBookingUseAdminCountry(userCountryCode);
                                                        let waNumber: string;
                                                        let text: string;
                                                        if (useAdmin) {
                                                            waNumber = ADMIN_WHATSAPP_DIGITS;
                                                            text = [
                                                                `Hi IndaStreet Admin, I would like to book a massage at ${placeName}.`,
                                                                placeId ? `Place ID: ${placeId}` : '',
                                                                durLine ? `Duration & Price: ${durLine}` : '',
                                                                `Please coordinate my visit. Thank you.`,
                                                            ].filter(Boolean).join('\n');
                                                        } else {
                                                            const raw = (place as any).whatsappNumber ?? (place as any).whatsappnumber ?? '';
                                                            const digits = normalizeWhatsAppToDigits(raw);
                                                            if (!digits) {
                                                                window.alert('This place has no WhatsApp number saved.');
                                                                return;
                                                            }
                                                            waNumber = digits;
                                                            text = [
                                                                `Hi, I would like to book a massage at ${placeName}.`,
                                                                durLine ? `Duration & Price: ${durLine}` : '',
                                                                `Thank you.`,
                                                            ].filter(Boolean).join('\n');
                                                        }
                                                        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
                                                    }}
                                                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                                                >
                                                    <Clock className="w-5 h-5" />
                                                    Book Now
                                                </button>
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-600">{getTreatmentsLabel(place as any, category)}</p>
                                        {[
                                            { label: '60 min', key: '60' as const },
                                            { label: '90 min', key: '90' as const },
                                            { label: '120 min', key: '120' as const },
                                        ].map(({ label, key }) => (
                                            <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-orange-50 border border-orange-200">
                                                <span className="font-medium text-gray-900">{getTreatmentRowTitle(category, label, key)}</span>
                                                <span className="text-sm font-semibold text-gray-800">{pricing[key] > 0 ? `IDR ${formatPrice(pricing[key])}` : 'Contact'}</span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer: distance */}
                <div className="mx-4 pb-4 flex items-center">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        {userLocation && (
                            <DistanceDisplay
                                userLocation={userLocation}
                                providerLocation={{
                                    lat: parseFloat(String((place as any).lat || (place as any).latitude || 0)),
                                    lng: parseFloat(String((place as any).lng || (place as any).longitude || 0))
                                }}
                                className="text-slate-600"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Thumbnail popup – only back page blurred; popup image and content sharp */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-xl flex items-center justify-center p-4"
                    onClick={() => setSelectedPhoto(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Photo view"
                >
                    <div
                        className="relative max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute top-3 right-3 z-10 w-10 h-10 bg-amber-500 hover:bg-amber-600 rounded-full flex items-center justify-center transition-colors border border-amber-400/50"
                            aria-label="Close"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="relative w-full bg-black/40">
                            <img
                                src={selectedPhoto.imageUrl}
                                alt={selectedPhoto.title}
                                className="w-full max-h-[60vh] object-contain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = DEFAULT_PLACE_IMAGE;
                                }}
                            />
                        </div>
                        <div className="p-4 border-t border-white/10">
                            <div className="flex items-center gap-3 mb-2">
                                <img
                                    src={profileImage}
                                    alt=""
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white/30 flex-shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_PLACE_IMAGE; }}
                                />
                                <h3 className="text-lg font-bold text-white truncate min-w-0">{selectedPhoto.title}</h3>
                            </div>
                            <p className="text-sm text-gray-300 line-clamp-3">{selectedPhoto.description}</p>
                        </div>
                    </div>
                </div>
            )}

            <SocialSharePopup
                isOpen={showSharePopup}
                onClose={() => setShowSharePopup(false)}
                title={placeName}
                description={(place as any).description || `Professional ${getMetaBarLabel(category).toLowerCase()} services`}
                url={shortShareUrl}
                type={category === 'facial' ? 'facial' : 'place'}
            />
        </div>
    );
};

export default CityPlaceCard;
