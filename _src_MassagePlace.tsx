// 🎯 AUTO-FIXED: Mobile scroll architecture violations (1 fixes)
import React, { useState, useEffect } from 'react';
import type { Place, Analytics } from '../types';
import { parsePricing, parseCoordinates, parseMassageTypes, parseLanguages } from '../utils/appwriteHelpers';
import { getDisplayRating, getDisplayReviewCount, formatRating } from '../utils/ratingUtils';
import { bookingService, reviewService } from '../lib/appwriteService';
import { logger } from '../utils/logger';
// import { placesMenusService } from '../lib/appwrite/services/placesMenus.service'; // TODO: Service doesn't exist yet
import { BookNowButton } from './BookNowButton';
import DistanceDisplay from './DistanceDisplay';
import AnonymousReviewModal from './AnonymousReviewModal';
import SocialSharePopup from './SocialSharePopup';
import MassagePlaceJoinPopup from './MassagePlaceJoinPopup';
import { getAuthAppUrl, getUniqueMenuItemsByName, getUniqueMassageTypes } from '../utils/therapistCardHelpers';
import { getSampleMenuItems } from '../utils/samplePriceUtils';
import { StarIcon, discountStyles, isDiscountActive, getDynamicSpacing, generatePlaceShareableURL } from '../constants/cardConstants.tsx';
import { useChatProvider } from '../hooks/useChatProvider';
import { VERIFIED_BADGE_IMAGE_URL } from '../constants/appConstants';

// Extracted components
import PlaceHeader from '../modules/massage-place/PlaceHeader';
import PlaceProfile from '../modules/massage-place/PlaceProfile';
import PlaceServices from '../modules/massage-place/PlaceServices';
import PlacePricing from '../modules/massage-place/PlacePricing';

interface MassagePlaceCardProps {
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

// Inject styles if they don't exist
if (typeof document !== 'undefined' && !document.getElementById('massage-place-discount-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'massage-place-discount-styles';
    styleSheet.textContent = discountStyles;
    document.head.appendChild(styleSheet);
}

const MassagePlaceCard: React.FC<MassagePlaceCardProps> = ({ 
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
    // Chat provider for notifications
    const { addNotification } = useChatProvider();
    
    const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showSharePopup, setShowSharePopup] = useState(false);
    const [showJoinPopup, setShowJoinPopup] = useState(false);
    const [discountTimeLeft, setDiscountTimeLeft] = useState<string>('');
    const [showPriceListModal, setShowPriceListModal] = useState(false);
    const [menuData, setMenuData] = useState<any[]>([]);
    const [selectedServiceIndex, setSelectedServiceIndex] = useState<number | null>(null);
    const [selectedDuration, setSelectedDuration] = useState<'60' | '90' | '120' | null>(null);
    const [arrivalCountdown, setArrivalCountdown] = useState<number>(3600); // 1 hour in seconds
    const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<{url: string; title: string; description: string} | null>(null);
    // Orders count derived from persisted analytics JSON or actual bookings
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
                if (Array.isArray(docs)) {
                    setBookingsCount(docs.length);
                }
            } catch (e) {
                // silent
            }
        };
        loadBookingsCount();
    }, [place]);

    // Load menu data when price list modal opens
    // TODO: Re-enable when placesMenusService is created
    /*
    useEffect(() => {
        const loadMenu = async () => {
            try {
                if (showPriceListModal) {
                    const placeId = String(place.$id || place.id);
                    console.log('🍽️ Loading menu for place:', placeId);
                    
                    try {
                        const menuDoc = await placesMenusService.getByPlaceId(placeId);
                        console.log('📄 Menu document received:', menuDoc);
                        
                        if (menuDoc?.menuData) {
                            console.log('📄 Raw menuData:', menuDoc.menuData);
                            const parsed = JSON.parse(menuDoc.menuData);
                            console.log('📄 Parsed menuData:', parsed);
                            setMenuData(Array.isArray(parsed) ? parsed : []);
                            console.log('✅ Menu items loaded:', parsed.length);
                        } else {
                            console.log('ℹ️ No menu data found - using fallback pricing');
                            setMenuData([]);
                        }
                    } catch (error: any) {
                        console.log('ℹ️ Menu collection not available - using fallback pricing:', error.message);
                        setMenuData([]);
                    }
                }
            } catch (outerError) {
                console.error('❌ Outer error in loadMenu:', outerError);
                setMenuData([]);
            }
        };
        
        loadMenu().catch(error => {
            console.error('❌ Unhandled promise rejection:', error);
        });
    }, [showPriceListModal, place]);
    */

    // Countdown timer for price list modal
    useEffect(() => {
        if (!showPriceListModal) {
            setArrivalCountdown(3600); // Reset when modal closes
            return;
        }
        const interval = setInterval(() => {
            setArrivalCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [showPriceListModal]);

    const formatCountdown = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
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
    
    // Countdown timer for active discount
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
    


    // Handle anonymous review submission
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
            
            // Soft refresh to show updated rating without losing state
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
    
    // Parse pricing - multiply by 1000 to get full IDR amounts for consistent display
    const parsedPricing = parsePricing(place.pricing) || { "60": 0, "90": 0, "120": 0 };
    const pricing = {
        "60": parsedPricing["60"] * 1000,
        "90": parsedPricing["90"] * 1000,
        "120": parsedPricing["120"] * 1000
    };
    
    // Price formatting function matching TherapistCard format (XXXk)
    const formatPrice = (price: number | string): string => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        
        if (!numPrice || numPrice === 0 || isNaN(numPrice)) {
            return "Contact"; // Show "Contact" instead of "0k" when no price is set
        }
        
        // Convert to thousands and ensure 3-digit format (100-999)
        let priceInThousands = Math.round(numPrice / 1000);
        
        // Ensure 3-digit display (100k-999k range)
        if (priceInThousands < 100) {
            priceInThousands = 100; // Minimum 100k
        } else if (priceInThousands > 999) {
            priceInThousands = 999; // Maximum 999k for 4-char display
        }
        
        // Always return exactly 4 characters: 3 digits + "k"
        return `${priceInThousands}k`;
    };
    
    // Get main image
    const mainImage = (place as any).mainImage || 'https://ik.imagekit.io/7grri5v7d/balineese%20massage%20indonisea.png?updatedAt=1761918521382';
    
    // Get amenities if available
    const amenities = (place as any).amenities || [];
    const displayAmenities = Array.isArray(amenities) ? amenities.slice(0, 3) : [];

    // Dynamic data sourcing for description & specializations
    const rawDescription = (place as any).description || '';
    const description = rawDescription && rawDescription.trim().length > 0
        ? rawDescription.trim()
        : `Professional massage place. Create or update your profile description to help customers understand your services.`;

    const parsedMassageTypes = parseMassageTypes((place as any).massageTypes) || [];
    const massageTypesDisplay = Array.isArray(parsedMassageTypes) && parsedMassageTypes.length > 0 
        ? getUniqueMassageTypes(parsedMassageTypes).slice(0, 6) 
        : ['Traditional Balinese', 'Deep Tissue', 'Swedish', 'Aromatherapy', 'Hot Stone']; // Mock data

    const parsedLanguages = parseLanguages((place as any).languages) || [];
    // Always include Indonesian as standard, only show other languages if explicitly set
    const baseLanguages = parsedLanguages.length > 0 ? parsedLanguages : ['Indonesian'];
    const languagesDisplay = Array.isArray(baseLanguages) ? baseLanguages.slice(0, 5) : ['Indonesian'];

    // Gallery photos - parse from place data with mock data for demonstration
    const galleryPhotos = (() => {
        try {
            const photos = (place as any).galleryPhotos || (place as any).photos || [];
            let parsedPhotos = [] as any;
            
            if (typeof photos === 'string') {
                const parsed = JSON.parse(photos);
                parsedPhotos = Array.isArray(parsed) ? parsed.slice(0, 4) : [];
            } else {
                parsedPhotos = Array.isArray(photos) ? photos.slice(0, 4) : [];
            }
            
            // Add mock data if no photos exist (for demonstration)
            if (parsedPhotos.length === 0) { parsedPhotos = [
                    {
                        url: 'https://ik.imagekit.io/7grri5v7d/balineese%20massage%20indonisea.png?updatedAt=1761918521382',
                        title: 'Relaxing Treatment Room',
                        description: 'Our peaceful treatment rooms are designed with your comfort in mind. Each room features ambient lighting, comfortable massage beds, and a serene atmosphere perfect for your relaxation journey. We maintain the highest standards of cleanliness and hygiene.'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500',
                        title: 'Professional Massage Therapists',
                        description: 'Our team of certified massage therapists brings years of experience and expertise. Each therapist is trained in various massage techniques including traditional Balinese, Swedish, deep tissue, and aromatherapy massage to provide you with the best experience.'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1552693673-1bf958298935?w=500',
                        title: 'Reception & Waiting Area',
                        description: 'Welcome to our modern reception area where our friendly staff will greet you. Enjoy complimentary herbal tea while you wait in our comfortable lounge. We ensure your visit starts with a warm welcome and ends with complete satisfaction.'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500',
                        title: 'Premium Spa Amenities',
                        description: 'We provide premium spa amenities including luxurious towels, aromatic oils, and shower facilities. Our commitment to quality extends to every detail of your spa experience, ensuring you leave feeling refreshed and rejuvenated.'
                    }
                ];
            }
            
            return parsedPhotos;
        } catch {
            // Return mock data on error
            return [
                {
                    url: 'https://ik.imagekit.io/7grri5v7d/balineese%20massage%20indonisea.png?updatedAt=1761918521382',
                    title: 'Relaxing Treatment Room',
                    description: 'Our peaceful treatment rooms are designed with your comfort in mind. Each room features ambient lighting, comfortable massage beds, and a serene atmosphere perfect for your relaxation journey.'
                },
                {
                    url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500',
                    title: 'Professional Massage Therapists',
                    description: 'Our team of certified massage therapists brings years of experience and expertise. Each therapist is trained in various massage techniques to provide you with the best experience.'
                },
                {
                    url: 'https://images.unsplash.com/photo-1552693673-1bf958298935?w=500',
                    title: 'Reception & Waiting Area',
                    description: 'Welcome to our modern reception area where our friendly staff will greet you. Enjoy complimentary herbal tea while you wait in our comfortable lounge.'
                },
                {
                    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500',
                    title: 'Premium Spa Amenities',
                    description: 'We provide premium spa amenities including luxurious towels, aromatic oils, and shower facilities for your complete relaxation.'
                }
            ];
        }
    })();

    // Years of experience: prefer explicit yearsOfExperience, fallback to membership duration, then mock data
    const yearsOfExperience = (() => {
        const direct = (place as any).yearsOfExperience;
        if (typeof direct === 'number' && direct > 0) return direct;
        try {
            const startRaw = (place as any).activeMembershipDate || (place as any).membershipStartDate;
            if (!startRaw) return 5; // Mock data: 5 years
            const startDate = new Date(startRaw);
            if (isNaN(startDate.getTime())) return 5; // Mock data: 5 years
            const diffMs = Date.now() - startDate.getTime();
            const years = diffMs / (1000 * 60 * 60 * 24 * 365);
            return years >= 1 ? Math.floor(years) : 5; // Mock data: 5 years
        } catch { return 5; } // Mock data: 5 years
    })();



    const handleViewDetails = () => {
        logger.debug('🏨 MassagePlaceCard - View Details clicked:', {
            place: place,
            placeName: place.name,
            placeId: place.id || (place as any).$id,
            onNavigate: !!onNavigate,
            onSelectPlace: !!onSelectPlace
        });
        
        onIncrementAnalytics('views');
        
        // Set selected place first
        onSelectPlace(place);
        
        // Update URL using SEO-optimized shareable link
        const profileUrl = generatePlaceShareableURL(place);
        const path = new URL(profileUrl).pathname;
        window.history.pushState({}, '', path);
        
        // Use setTimeout to ensure state update completes before navigation
        if (onNavigate) {
            logger.debug('🏨 Navigating to massage-place-profile');
            setTimeout(() => {
                onNavigate('massage-place-profile');
            }, 0);
        } else {
            logger.error('❌ onNavigate is not defined!');
        }
    };

    // Calculate display rating (same as therapist card)
    const displayRating = (place.averageRating ?? 0) > 0
        ? Number((place.averageRating ?? 0).toFixed(1))
        : (place.staticRating || 4.8);

    return (
        <>
            {/* CSS Animation Styles */}
            <style>{`
                @keyframes priceRimFade {
                    0%, 100% { 
                        border-color: rgb(251, 146, 60);
                        box-shadow: 0 0 0 2px rgba(251, 146, 60, 0.3), 0 4px 6px -1px rgba(251, 146, 60, 0.5);
                    }
                    50% { 
                        border-color: rgba(251, 146, 60, 0.3);
                        box-shadow: 0 0 0 2px rgba(251, 146, 60, 0.1), 0 4px 6px -1px rgba(251, 146, 60, 0.2);
                    }
                }

                .price-rim-fade {
                    animation: priceRimFade 2s ease-in-out infinite;
                }
            `}</style>
        
            {/* External meta bar (Joined Date / Free) */}
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
                        setShowJoinPopup(true);
                    }}
                    className="text-[11px] text-green-600 font-semibold flex items-center gap-1 hover:text-green-700 hover:underline transition-colors cursor-pointer"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Massage Spa Join Free
                </button>
            </div>
            <div 
                onClick={handleViewDetails}
                className="w-full bg-white rounded-xl shadow-lg border border-gray-200 border-t-4 border-t-amber-400 overflow-hidden relative active:shadow-xl transition-all touch-manipulation pb-8 cursor-pointer hover:shadow-xl"
            >
                {/* Header Section - Extracted to PlaceHeader Component */}
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

            {/* Location - Below image on the right side */}
            <div className="px-4 mt-2 mb-1 flex justify-end">
                <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-700">{(place.location || 'Bali').split(',')[0].trim()}</span>
                </div>
            </div>
            
            {/* Profile Section - Extracted to PlaceProfile Component */}
            <PlaceProfile 
                place={place}
                mainImage={mainImage}
                userLocation={userLocation}
                parseCoordinates={parseCoordinates}
            />

            {/* Services Section - Extracted to PlaceServices Component */}
            <PlaceServices 
                place={place}
                description={description}
                isDiscountActive={isDiscountActive}
                activeDiscount={activeDiscount}
                galleryPhotos={galleryPhotos}
                massageTypesDisplay={massageTypesDisplay}
                languagesDisplay={languagesDisplay}
                yearsOfExperience={yearsOfExperience}
                displayAmenities={displayAmenities}
                t={_t}
                onGalleryPhotoClick={(photo) => setSelectedGalleryPhoto(photo)}
                onNavigate={onNavigate}
                setShowPriceListModal={setShowPriceListModal}
                amenities={amenities}
            />

            {/* Pricing Section - Extracted to PlacePricing Component */}
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

            {/* Terms and Conditions Link - Below booking buttons */}
            <div className="text-center mt-3 px-4">
                <button 
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const isSharedProfile = window.location.pathname.includes('/share/');
                        const baseUrl = window.location.origin;
                        if (isSharedProfile) {
                            const currentUrl = window.location.href;
                            window.open(`${baseUrl}/mobile-terms-and-conditions?returnTo=${encodeURIComponent(currentUrl)}`, '_blank');
                        } else {
                            window.open(`${baseUrl}/mobile-terms-and-conditions`, '_blank');
                        }
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline font-medium cursor-pointer bg-transparent border-none p-0"
                >
                    Terms And Conditions
                </button>
            </div>

            {/* Massage Directory Link */}
            {onNavigate && (
                <div className="flex justify-center items-center gap-2 mt-3 px-1 pt-3 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onNavigate('massageTypes');
                        }}
                        title={_t?.home?.massageDirectoryTitle || 'Go to Massage Directory'}
                        className="flex items-center gap-1 text-xs text-gray-700 hover:text-gray-900 font-semibold transition-colors"
                    >
                        <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m0 0l-3.5 3.5M16 7l-3.5 3.5M5 12h14M5 16h14" />
                        </svg>
                        <span>{_t?.home?.massageDirectory || 'Massage Directory'}</span>
                    </button>
                </div>
            )}
            </div>
            
            {/* Price List Bottom Sheet Slider */}
            {showPriceListModal && (
                <div
                    className="fixed inset-0 z-[9999] bg-black bg-opacity-50 transition-opacity duration-300"
                    onClick={() => setShowPriceListModal(false)}
                >
                    <style>{`
                        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                    `}</style>
                    <div
                        className="absolute bottom-0 left-0 right-0 h-full w-full bg-white transform transition-transform duration-300 ease-out"
                        style={{ animation: 'slideUp 0.3s ease-out forwards' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header - Orange gradient with profile & rating */}
                        <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-orange-500 to-orange-600 sticky top-0">
                            <div className="flex items-center gap-3 flex-1">
                                <img
                                    src={(place as any).profilePicture || (place as any).mainImage || '/default-place.jpg'}
                                    alt={place.name}
                                    className="w-11 h-11 rounded-full border-2 border-white object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/default-place.jpg'; }}
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        {/* Verified Badge - Show if manually verified, admin verified, has KTP uploaded, or has complete profile */}
                                        {(() => {
                                            const hasVerifiedBadge = (place as any).isVerified || (place as any).verifiedBadge || (place as any).ktpVerified;
                                            const hasBankDetails = place.bankName && place.accountName && place.accountNumber;
                                            const hasKtpUploaded = (place as any).ktpPhotoUrl;
                                            const shouldShowBadge = hasVerifiedBadge || (hasBankDetails && hasKtpUploaded);
                                            
                                            return shouldShowBadge && (
                                                <img 
                                                    src={VERIFIED_BADGE_IMAGE_URL}
                                                    alt="Verified"
                                                    className="w-4 h-4 flex-shrink-0"
                                                    title="Verified Massage Place - Complete Profile"
                                                />
                                            );
                                        })()}
                                        <h2 className="text-lg font-bold text-white leading-tight">{place.name}</h2>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <StarIcon className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                                        <span className="font-bold text-black bg-white/90 rounded px-1.5 py-0.5 shadow-sm">{formatRating(getDisplayRating(place.rating, place.reviewCount))}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPriceListModal(false)}
                                className="flex items-center justify-center w-8 h-8 bg-black/70 hover:bg-black rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Pricing Header Row */}
                        <div className="px-4 py-2 flex items-center justify-between">
                            <div className="text-sm sm:text-base font-bold text-gray-900">Service Prices</div>
                            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-orange-800 font-semibold">
                                <span className="hidden sm:inline">Preparation Time • ~1 hour</span>
                                <span className="sm:hidden">Preparation Time • ~1h</span>
                                <span className="px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                                    {formatCountdown(arrivalCountdown)}
                                </span>
                            </div>
                        </div>

                        {/* Price List Content - Scrollable. Connected to dashboard menu when paid/has data; 4 sample items when free plan or no menu. */}
                        <div className="flex-1  p-4" style={{ height: 'calc(100vh - 180px)' }}>
                            {(() => {
                                const placeId = String((place as any).$id ?? (place as any).id ?? '');
                                const rawMenu = menuData.length > 0 ? menuData : getSampleMenuItems(placeId, 4).map((item) => ({
                                    serviceName: item.name,
                                    name: item.name,
                                    price60: Math.round(item.price60 / 1000),
                                    price90: Math.round(item.price90 / 1000),
                                    price120: Math.round(item.price120 / 1000),
                                }));
                                const uniqueMenu = getUniqueMenuItemsByName(rawMenu);
                                return uniqueMenu.length > 0 ? (
                                <div className="bg-white rounded-lg border border-orange-200 overflow-hidden shadow-lg">
                                    {/* Table Header - Hidden on mobile */}
                                    <div className="hidden sm:grid grid-cols-12 gap-2 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-2 text-xs font-semibold text-orange-700 border-b border-orange-200">
                                        <div className="col-span-4">Service</div>
                                        <div className="col-span-2 text-center">60m</div>
                                        <div className="col-span-2 text-center">90m</div>
                                        <div className="col-span-2 text-center">120m</div>
                                        <div className="col-span-2 text-center">Action</div>
                                    </div>

                                    {/* Table Rows */}
                                    <div className="divide-y divide-orange-100">
                                        {uniqueMenu.map((service: any, index: number) => {
                                            const isRowSelected = selectedServiceIndex === index;

                                            return (
                                                <div key={index} className={`transition-colors ${
                                                    isRowSelected ? 'bg-orange-50 border-l-4 border-orange-500' : 'hover:bg-orange-50'
                                                }`}>
                                                    {/* Mobile Layout: Service name on top, prices below */}
                                                    <div className="sm:hidden px-3 py-3">
                                                        {/* Service Name */}
                                                        <div className="mb-3">
                                                            <div className="font-medium text-sm text-gray-900">{service.serviceName || service.name || 'Service'}</div>
                                                            {service.description && (
                                                                <div className="text-xs text-gray-500 mt-1">{service.description}</div>
                                                            )}
                                                        </div>

                                                        {/* Price buttons in row */}
                                                        <div className="grid grid-cols-8 gap-2 items-end">
                                                            {['60', '90', '120'].map((duration) => (
                                                                <div key={duration} className="col-span-2">
                                                                    <div className="text-[10px] text-gray-600 text-center mb-1 font-semibold">{duration}m</div>
                                                                    {service[`price${duration}`] ? (
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedServiceIndex(index);
                                                                                setSelectedDuration(duration as '60' | '90' | '120');
                                                                            }}
                                                                            className={`w-full px-1 py-1.5 rounded text-[10px] transition-all border-2 ${
                                                                                isRowSelected && selectedDuration === duration
                                                                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold border-transparent shadow-lg'
                                                                                    : 'bg-white text-gray-800 border-orange-200 hover:border-orange-400 hover:bg-orange-50'
                                                                            }`}
                                                                        >
                                                                            <span className="block truncate">
                                                                                {(Number(service[`price${duration}`]) * 1000).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                                            </span>
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-400 text-center block">-</span>
                                                                    )}
                                                                </div>
                                                            ))}

                                                            {/* Action Button */}
                                                            <div className="col-span-2">
                                                                <div className="text-[10px] text-transparent text-center mb-1">-</div>
                                                                <BookNowButton
                                                                    className={`w-full px-1 py-1 min-h-0 rounded-lg transition-colors [&_img]:max-h-7 ${
                                                                        isRowSelected && selectedDuration
                                                                            ? 'cursor-pointer'
                                                                            : 'opacity-50 cursor-not-allowed pointer-events-none'
                                                                    }`}
                                                                    onClick={(e) => {
                                                                        if (isRowSelected && selectedDuration) {
                                                                            e.stopPropagation();
                                                                            setShowPriceListModal(false);
                                                                            onSelectPlace(place);
                                                                        }
                                                                    }}
                                                                    disabled={!isRowSelected || !selectedDuration}
                                                                    ariaLabel={_t?.home?.bookNow || 'Book'}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Desktop/Tablet Layout: Original grid */}
                                                    <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-3 items-center">
                                                        {/* Service Name */}
                                                        <div className="col-span-4 min-w-0">
                                                            <div className="font-medium text-sm text-gray-900 truncate">{service.serviceName || service.name || 'Service'}</div>
                                                            {service.description && (
                                                                <div className="text-xs text-gray-500 mt-1 truncate">{service.description}</div>
                                                            )}
                                                        </div>

                                                        {/* Price buttons */}
                                                        {['60', '90', '120'].map((duration) => (
                                                            <div key={duration} className="col-span-2 flex flex-col items-center gap-1 min-w-0">
                                                                {service[`price${duration}`] ? (
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedServiceIndex(index);
                                                                            setSelectedDuration(duration as '60' | '90' | '120');
                                                                        }}
                                                                        className={`w-full px-1 py-1 rounded text-xs transition-all border-2 min-w-0 overflow-hidden ${
                                                                            isRowSelected && selectedDuration === duration
                                                                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold border-transparent shadow-lg'
                                                                                : 'bg-white text-gray-800 border-orange-200 hover:border-orange-400 hover:bg-orange-50'
                                                                        }`}
                                                                    >
                                                                        <span className="block truncate w-full">
                                                                            {(Number(service[`price${duration}`]) * 1000).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                                        </span>
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">-</span>
                                                                )}
                                                            </div>
                                                        ))}

                                                        {/* Action Buttons */}
                                                        <div className="col-span-2 text-center min-w-0 flex items-center justify-center">
                                                            <BookNowButton
                                                                className={`w-full px-2 py-1 min-h-0 rounded-lg transition-colors [&_img]:max-h-7 ${
                                                                    isRowSelected && selectedDuration ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed pointer-events-none'
                                                                }`}
                                                                onClick={(e) => {
                                                                    if (isRowSelected && selectedDuration) {
                                                                        e.stopPropagation();
                                                                        setShowPriceListModal(false);
                                                                        onSelectPlace(place);
                                                                    }
                                                                }}
                                                                disabled={!isRowSelected || !selectedDuration}
                                                                ariaLabel={_t?.home?.bookNow || 'Book'}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                // Fallback pricing when menu data fails to load
                                <div className="bg-white rounded-lg border border-orange-200 overflow-hidden shadow-lg">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-12 gap-2 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-2 text-xs font-semibold text-orange-700 border-b border-orange-200">
                                        <div className="col-span-4">Service</div>
                                        <div className="col-span-2 text-center">60 Min</div>
                                        <div className="col-span-2 text-center">90 Min</div>
                                        <div className="col-span-2 text-center">120 Min</div>
                                        <div className="col-span-2 text-center">Action</div>
                                    </div>

                                    {/* Fallback Service Row */}
                                    <div className="divide-y divide-orange-100">
                                        <div className="grid grid-cols-12 gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 hover:bg-orange-50 items-center">
                                            {/* Service Name */}
                                            <div className="col-span-4 min-w-0">
                                                <div className="font-medium text-xs sm:text-sm text-gray-900 truncate">Traditional Massage</div>
                                                <div className="text-[10px] sm:text-xs text-gray-500 mt-1 truncate">Traditional therapeutic massage</div>
                                            </div>

                                            {/* Pricing grid: 60/90/120 on one line, prices directly under */}
                                            <div className="col-span-6">
                                                <div className="grid grid-cols-3 gap-x-2 gap-y-1 items-start justify-items-center text-center">
                                                    <span className="text-[10px] font-semibold text-gray-700 whitespace-nowrap">60min</span>
                                                    <span className="text-[10px] font-semibold text-gray-700 whitespace-nowrap">90min</span>
                                                    <span className="text-[10px] font-semibold text-gray-700 whitespace-nowrap">120min</span>
                                                    {(['60', '90', '120'] as const).map((duration) => {
                                                        const price = pricing[duration];
                                                        const isSelected = selectedServiceIndex === 0 && selectedDuration === duration;
                                                        return price > 0 ? (
                                                            <button
                                                                key={duration}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedServiceIndex(0);
                                                                    setSelectedDuration(duration);
                                                                }}
                                                                className={`w-full px-1 py-1 rounded text-[9px] sm:text-xs transition-all border-2 whitespace-nowrap ${
                                                                    isSelected
                                                                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold border-transparent shadow-lg'
                                                                        : 'bg-white text-gray-800 border-orange-200 hover:border-orange-400 hover:bg-orange-50'
                                                                }`}
                                                            >
                                                                {formatPrice(price)}
                                                            </button>
                                                        ) : (
                                                            <span key={duration} className="text-xs text-gray-400">-</span>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="col-span-2 text-center min-w-0 flex items-center justify-center">
                                                <BookNowButton
                                                    className={`w-full px-1 sm:px-2 py-1 min-h-0 rounded-lg transition-colors [&_img]:max-h-7 ${
                                                        selectedServiceIndex === 0 && selectedDuration ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed pointer-events-none'
                                                    }`}
                                                    onClick={(e) => {
                                                        if (selectedServiceIndex === 0 && selectedDuration) {
                                                            e.stopPropagation();
                                                            setShowPriceListModal(false);
                                                            onSelectPlace(place);
                                                        }
                                                    }}
                                                    disabled={selectedServiceIndex !== 0 || !selectedDuration}
                                                    ariaLabel={_t?.home?.bookNow || 'Book'}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                            })()}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Anonymous Review Modal */}
            {showReviewModal && (
                <AnonymousReviewModal
                    providerName={place.name}
                    providerId={place.$id || place.id}
                    providerType="place"
                    providerImage={(place as any).mainImage || 'https://ik.imagekit.io/7grri5v7d/balineese%20massage%20indonisea.png?updatedAt=1761918521382'}
                    onClose={() => setShowReviewModal(false)}
                    onSubmit={handleAnonymousReviewSubmit}
                />
            )}

            {/* Login Required Modal */}
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
            
            <style>{`
                @keyframes coin-fall-1 {
                    0% { transform: translateY(-120px) rotate(0deg); opacity: 0; }
                    10% { opacity: 0.8; }
                    90% { transform: translateY(85px) rotate(360deg); opacity: 0.8; }
                    100% { transform: translateY(90px) rotate(360deg); opacity: 0.6; }
                }
                @keyframes coin-fall-2 {
                    0% { transform: translateY(-120px) rotate(0deg); opacity: 0; }
                    10% { opacity: 0.8; }
                    90% { transform: translateY(88px) rotate(360deg); opacity: 0.8; }
                    100% { transform: translateY(93px) rotate(360deg); opacity: 0.6; }
                }
                @keyframes coin-fall-3 {
                    0% { transform: translateY(-120px) rotate(0deg); opacity: 0; }
                    10% { opacity: 0.8; }
                    90% { transform: translateY(82px) rotate(360deg); opacity: 0.8; }
                    100% { transform: translateY(87px) rotate(360deg); opacity: 0.6; }
                }
                @keyframes coin-fall-4 {
                    0% { transform: translateY(-120px) rotate(0deg); opacity: 0; }
                    10% { opacity: 0.8; }
                    90% { transform: translateY(86px) rotate(360deg); opacity: 0.8; }
                    100% { transform: translateY(91px) rotate(360deg); opacity: 0.6; }
                }
                @keyframes coin-fall-5 {
                    0% { transform: translateY(-120px) rotate(0deg); opacity: 0; }
                    10% { opacity: 0.8; }
                    90% { transform: translateY(84px) rotate(360deg); opacity: 0.8; }
                    100% { transform: translateY(89px) rotate(360deg); opacity: 0.6; }
                }
                @keyframes coin-fall-6 {
                    0% { transform: translateY(-120px) rotate(0deg); opacity: 0; }
                    10% { opacity: 0.8; }
                    90% { transform: translateY(87px) rotate(360deg); opacity: 0.8; }
                    100% { transform: translateY(92px) rotate(360deg); opacity: 0.6; }
                }
                @keyframes coin-float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-3px); }
                }
                .animate-coin-fall-1 { animation: coin-fall-1 3s ease-in forwards, coin-float 2s ease-in-out 3s infinite; }
                .animate-coin-fall-2 { animation: coin-fall-2 3s ease-in forwards, coin-float 2s ease-in-out 3.3s infinite; }
                .animate-coin-fall-3 { animation: coin-fall-3 3s ease-in forwards, coin-float 2s ease-in-out 3.6s infinite; }
                .animate-coin-fall-4 { animation: coin-fall-4 3s ease-in forwards, coin-float 2s ease-in-out 3.9s infinite; }
                .animate-coin-fall-5 { animation: coin-fall-5 3s ease-in forwards, coin-float 2s ease-in-out 4.2s infinite; }
                .animate-coin-fall-6 { animation: coin-fall-6 3s ease-in forwards, coin-float 2s ease-in-out 4.5s infinite; }
            `}</style>

        <SocialSharePopup
            isOpen={showSharePopup}
            onClose={() => setShowSharePopup(false)}
            title={place.name}
            description={`Check out ${place.name} on IndaStreet! ${place.description || 'Amazing massage place with great services.'}`}
            url={window.location.href}
            type="place"
        />

        {/* Report Profile Section - Footer Area */}
        <div className="text-center mt-4 mb-4 px-4">
            <button 
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onNavigate) {
                        onNavigate('contact');
                    } else {
                        window.location.href = '/contact';
                    }
                }}
                className="inline-flex flex-col items-center cursor-pointer bg-transparent border-none p-0"
            >
                <span className="text-sm font-bold text-red-600 hover:text-red-700">Report Profile</span>
                <span className="text-xs text-gray-500 mt-0.5">Violates Stated Standards</span>
            </button>
        </div>
        
        <MassagePlaceJoinPopup
            isOpen={showJoinPopup}
            onClose={() => setShowJoinPopup(false)}
            onNavigate={onNavigate}
        />

        {/* Gallery Photo Enlarged Modal */}
        {selectedGalleryPhoto && (
            <div
                className="fixed inset-0 z-[10000] bg-black bg-opacity-90 flex items-center justify-center p-4"
                onClick={() => setSelectedGalleryPhoto(null)}
            >
                <div
                    className="relative max-w-4xl w-full bg-white rounded-lg overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setSelectedGalleryPhoto(null)}
                        className="absolute top-3 right-3 z-10 w-10 h-10 bg-black/70 hover:bg-black rounded-full flex items-center justify-center transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Image */}
                    <div className="w-full bg-gray-100">
                        <img
                            src={selectedGalleryPhoto.url}
                            alt={selectedGalleryPhoto.title}
                            className="w-full max-h-[70vh] object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://ik.imagekit.io/7grri5v7d/balineese%20massage%20indonisea.png?updatedAt=1761918521382';
                            }}
                        />
                    </div>

                    {/* Header and Description */}
                    <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600">
                        <h3 className="text-xl font-bold text-white mb-2">{selectedGalleryPhoto.title}</h3>
                        {selectedGalleryPhoto.description && (
                            <p className="text-sm text-white/90 leading-relaxed line-clamp-4">
                                {selectedGalleryPhoto.description.slice(0, 350)}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default MassagePlaceCard;
// Force rebuild
