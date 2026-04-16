import React, { useState, useEffect } from 'react';
import type { Place, Analytics } from '../types';
import { parsePricing, parseMassageTypes, parseLanguages } from '../utils/appwriteHelpers';
import { getDisplayRating, formatRating } from '../utils/ratingUtils';
import { bookingService, reviewService } from '../lib/appwriteService';
import { logger } from '../utils/logger';
import AnonymousReviewModal from './AnonymousReviewModal';
import SocialSharePopup from './SocialSharePopup';
import { getAuthAppUrl } from '../utils/therapistCardHelpers';
import { discountStyles, isDiscountActive } from '../constants/cardConstants.tsx';
import { useChatProvider } from '../hooks/useChatProvider';
import PlaceHeader from '../modules/massage-place/PlaceHeader';
import PlaceProfile from '../modules/massage-place/PlaceProfile';
import PlaceServices from '../modules/massage-place/PlaceServices';
import PlacePricing from '../modules/massage-place/PlacePricing';

interface FacialPlaceCardProps {
    place: Place;
    onRate: (place: Place) => void;
    onSelectPlace: (place: Place) => void;
    onNavigate?: (page: string) => void;
    onIncrementAnalytics: (metric: keyof Analytics) => void;
    onShowRegisterPrompt?: () => void;
    isCustomerLoggedIn?: boolean;
    activeDiscount?: { percentage: number; expiresAt: Date } | null;
    t: any;
    userLocation?: { lat: number; lng: number } | null;
}

// Inject styles if they don't exist (same as massage place card)
if (typeof document !== 'undefined' && !document.getElementById('facial-place-discount-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'facial-place-discount-styles';
    styleSheet.textContent = discountStyles;
    document.head.appendChild(styleSheet);
}

const FacialPlaceCard: React.FC<FacialPlaceCardProps> = ({
    place,
    onRate,
    onSelectPlace,
    onNavigate,
    onIncrementAnalytics,
    onShowRegisterPrompt,
    isCustomerLoggedIn = false,
    activeDiscount,
    t: _t,
    userLocation
}) => {
    const { addNotification } = useChatProvider();
    const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showSharePopup, setShowSharePopup] = useState(false);
    const [discountTimeLeft, setDiscountTimeLeft] = useState<string>('');
    const [showPriceListModal, setShowPriceListModal] = useState(false);
    const [menuData, setMenuData] = useState<any[]>([]);
    const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<{ url: string; title: string; description: string } | null>(null);

    const [bookingsCount, setBookingsCount] = useState<number>(() => {
        try {
            if ((place as any).analytics) {
                const parsed = JSON.parse((place as any).analytics);
                if (parsed && typeof parsed.bookings === 'number') return parsed.bookings;
            }
        } catch {}
        return 0;
    });

    useEffect(() => {
        const loadBookingsCount = async () => {
            try {
                const providerId = String((place as any).id || (place as any).$id || '');
                if (!providerId) return;
                const docs = await bookingService.getByProvider(providerId, 'place');
                if (Array.isArray(docs)) setBookingsCount(docs.length);
            } catch {
                // silent
            }
        };
        loadBookingsCount();
    }, [place]);

    const joinedDateRaw = (place as any).activeMembershipDate || (place as any).membershipStartDate || (place as any).$createdAt;
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

    useEffect(() => {
        if (!activeDiscount) return;
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = activeDiscount.expiresAt.getTime() - now;
            if (distance < 0) {
                setDiscountTimeLeft('EXPIRED');
                clearInterval(interval);
                return;
            }
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setDiscountTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }, 1000);
        return () => clearInterval(interval);
    }, [activeDiscount]);

    const handleAnonymousReviewSubmit = async (reviewData: {
        name: string;
        whatsappNumber: string;
        rating: number;
        providerId: string | number;
        providerType: 'therapist' | 'place';
    }) => {
        try {
            await reviewService.createAnonymous({
                providerType: reviewData.providerType,
                providerId: String(reviewData.providerId),
                providerName: place.name,
                rating: reviewData.rating,
                reviewerName: reviewData.name,
                whatsappNumber: reviewData.whatsappNumber
            });
            setShowReviewModal(false);
            alert('Thank you for your review! 🌟');
            setTimeout(async () => {
                try {
                    const { softRecover } = await import('../utils/softNavigation');
                    softRecover();
                } catch {
                    window.location.reload();
                }
            }, 1000);
        } catch (error) {
            logger.error('Error submitting review:', error);
            throw error;
        }
    };

    const parsedPricing = parsePricing(place.pricing) || { "60": 0, "90": 0, "120": 0 };
    const pricing = {
        "60": parsedPricing["60"] * 1000,
        "90": parsedPricing["90"] * 1000,
        "120": parsedPricing["120"] * 1000
    };

    const formatPrice = (price: number | string): string => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        if (!numPrice || numPrice === 0 || isNaN(numPrice)) return "Contact";
        let priceInThousands = Math.round(numPrice / 1000);
        if (priceInThousands < 100) priceInThousands = 100;
        else if (priceInThousands > 999) priceInThousands = 999;
        return `${priceInThousands}k`;
    };

    const getMainImage = () => {
        if ((place as any).mainImage) return (place as any).mainImage;
        const images = (place as any).images;
        if (Array.isArray(images) && images.length > 0) return images[0];
        return 'https://ik.imagekit.io/7grri5v7d/balineese%20massage%20indonisea.png?updatedAt=1761918521382';
    };
    const mainImage = getMainImage();

    const amenities = (place as any).amenities || [];
    const displayAmenities = Array.isArray(amenities) ? amenities.slice(0, 3) : [];

    const rawDescription = (place as any).description || '';
    const description = rawDescription && rawDescription.trim().length > 0
        ? rawDescription.trim()
        : `Professional Facial Place. Create or update your profile description to help customers understand your services.`;

    const parsedfacialTypes = parseMassageTypes((place as any).facialTypes) || [];
    const facialTypesDisplay = Array.isArray(parsedfacialTypes) ? parsedfacialTypes.slice(0, 6) : [];

    const parsedLanguages = parseLanguages((place as any).languages) || [];
    const languagesDisplay = Array.isArray(parsedLanguages) ? parsedLanguages.slice(0, 5) : [];

    const yearsOfExperience = (() => {
        const direct = (place as any).yearsOfExperience;
        if (typeof direct === 'number' && direct > 0) return direct;
        try {
            const startRaw = (place as any).activeMembershipDate || (place as any).membershipStartDate;
            if (!startRaw) return undefined;
            const startDate = new Date(startRaw);
            if (isNaN(startDate.getTime())) return undefined;
            const years = (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
            return years >= 1 ? Math.floor(years) : undefined;
        } catch { return undefined; }
    })();

    // Gallery photos: same shape as massage place (url, title, description)
    const galleryPhotos = (() => {
        const gallery = (place as any).galleryImages || (place as any).galleryPhotos || (place as any).photos || [];
        let list: { url: string; title: string; description: string }[] = [];
        if (Array.isArray(gallery)) {
            list = gallery.slice(0, 4).map((item: any) => ({
                url: (item.imageUrl || item.url || '').trim() || mainImage,
                title: item.header || item.caption || item.title || 'Photo',
                description: item.description || item.caption || ''
            }));
        }
        if (list.length === 0) {
            list = [
                { url: mainImage, title: 'Treatment Room', description: 'Professional facial and skin care environment.' },
            ];
        }
        return list;
    })();

    const handleViewDetails = () => {
        logger.debug('FacialPlaceCard - View Details clicked', { placeName: place.name, placeId: place.$id || place.id });
        onIncrementAnalytics('views');
        onSelectPlace(place);
        if (onNavigate) {
            logger.debug('Navigating to facial-place-profile');
            setTimeout(() => onNavigate('facial-place-profile'), 0);
        } else {
            logger.error('onNavigate is not defined');
        }
    };

    const displayRating = (place.averageRating ?? 0) > 0
        ? Number((place.averageRating ?? 0).toFixed(1))
        : (place.staticRating || 4.8);

    return (
        <>
            <style>{`
                @keyframes priceRimFade {
                    0%, 100% { border-color: rgb(251, 146, 60); box-shadow: 0 0 0 2px rgba(251, 146, 60, 0.3), 0 4px 6px -1px rgba(251, 146, 60, 0.5); }
                    50% { border-color: rgba(251, 146, 60, 0.3); box-shadow: 0 0 0 2px rgba(251, 146, 60, 0.1), 0 4px 6px -1px rgba(251, 146, 60, 0.2); }
                }
                .price-rim-fade { animation: priceRimFade 2s ease-in-out infinite; }
            `}</style>

            {/* External meta bar – same layout and colors as MassagePlaceCard */}
            <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-[11px] text-gray-600 font-medium flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {joinedDisplay}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        localStorage.setItem('selectedPortalType', 'facial_place');
                        localStorage.setItem('selected_membership_plan', 'pro');
                        window.location.href = `${getAuthAppUrl()}/signup`;
                    }}
                    className="text-[11px] text-green-600 font-semibold flex items-center gap-1 hover:text-green-700 hover:underline transition-colors cursor-pointer"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Facial Spa Join Free
                </button>
            </div>

            <div
                onClick={handleViewDetails}
                className="w-full bg-white rounded-xl shadow-lg border border-gray-200 border-t-4 border-t-amber-400 overflow-hidden relative active:shadow-xl transition-all touch-manipulation pb-8 cursor-pointer hover:shadow-xl"
            >
                <PlaceHeader
                    place={place}
                    mainImage={mainImage}
                    displayRating={displayRating}
                    onNavigate={onNavigate}
                    formatRating={formatRating}
                    getDisplayRating={getDisplayRating}
                    t={_t}
                    onShare={() => setShowSharePopup(true)}
                    activeDiscount={activeDiscount}
                    discountTimeLeft={discountTimeLeft}
                />

                {/* Location – below image, same as MassagePlaceCard */}
                <div className="px-4 mt-2 mb-1 flex justify-end">
                    <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-700">{(place.location || 'Bali').split(',')[0].trim()}</span>
                    </div>
                </div>

                <PlaceProfile place={place} mainImage={mainImage} userLocation={userLocation} />

                <PlaceServices
                    place={place}
                    description={description}
                    isDiscountActive={isDiscountActive}
                    activeDiscount={activeDiscount}
                    galleryPhotos={galleryPhotos}
                    massageTypesDisplay={facialTypesDisplay}
                    languagesDisplay={languagesDisplay}
                    yearsOfExperience={yearsOfExperience ?? 0}
                    displayAmenities={displayAmenities}
                    t={_t}
                    onGalleryPhotoClick={(photo) => setSelectedGalleryPhoto(photo)}
                    onNavigate={onNavigate}
                    setShowPriceListModal={setShowPriceListModal}
                    amenities={amenities}
                />

                <PlacePricing
                    place={place}
                    pricing={pricing}
                    displayRating={displayRating}
                    formatPrice={formatPrice}
                    t={_t}
                    addNotification={addNotification}
                    onIncrementAnalytics={onIncrementAnalytics}
                    menuData={menuData}
                />

                {/* Terms and Conditions – same as MassagePlaceCard */}
                <div className="text-center mt-3 px-4">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const baseUrl = window.location.origin;
                            const isSharedProfile = window.location.pathname.includes('/share/');
                            if (isSharedProfile) {
                                window.open(`${baseUrl}/mobile-terms-and-conditions?returnTo=${encodeURIComponent(window.location.href)}`, '_blank');
                            } else {
                                window.open(`${baseUrl}/mobile-terms-and-conditions`, '_blank');
                            }
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 underline font-medium cursor-pointer bg-transparent border-none p-0"
                    >
                        Terms And Conditions
                    </button>
                </div>

                {/* Directory link – same layout as MassagePlaceCard, Facial Types */}
                {onNavigate && (
                    <div className="flex justify-center items-center gap-2 mt-3 px-1 pt-3 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onNavigate('facialTypes');
                            }}
                            title={_t?.home?.facialDirectoryTitle || 'Go to Facial Types Directory'}
                            className="flex items-center gap-1 text-xs text-gray-700 hover:text-gray-900 font-semibold transition-colors"
                        >
                            <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m0 0l-3.5 3.5M16 7l-3.5 3.5M5 12h14M5 16h14" />
                            </svg>
                            <span>{_t?.home?.facialDirectory || 'Facial Types'}</span>
                        </button>
                    </div>
                )}
            </div>

            {showReviewModal && (
                <AnonymousReviewModal
                    providerName={place.name}
                    providerId={place.$id || place.id}
                    providerType="place"
                    providerImage={(place as any).mainImage || mainImage}
                    onClose={() => setShowReviewModal(false)}
                    onSubmit={handleAnonymousReviewSubmit}
                />
            )}

            {showLoginRequiredModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowLoginRequiredModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Login Required</h3>
                            <p className="text-gray-600 mb-6">Please register or login to leave a review.</p>
                            <button
                                onClick={() => {
                                    setShowLoginRequiredModal(false);
                                    onShowRegisterPrompt?.();
                                }}
                                className="w-full px-4 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors min-h-[44px] touch-manipulation active:bg-orange-700"
                            >
                                Register / Login
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SocialSharePopup
                isOpen={showSharePopup}
                onClose={() => setShowSharePopup(false)}
                title={place.name}
                description={`Discover ${place.name} on IndaStreet! ${place.description || 'Professional facial and beauty services.'}`}
                url={window.location.href}
                type="facial"
            />
        </>
    );
};

export default FacialPlaceCard;
