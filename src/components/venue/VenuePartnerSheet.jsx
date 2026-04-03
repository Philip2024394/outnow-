import { useEffect, useRef, useState } from 'react'
import styles from './VenuePartnerSheet.module.css'

const OFFER_LABELS = {
  percent_off:    '% Off',
  bogo:           'Buy 1 Get 1',
  free_item:      'Free Item',
  fixed_off:      '£ Off',
  happy_hour:     'Happy Hour',
  early_bird:     'Early Bird',
  free_entry:     'Free Entry',
  loyalty:        'Loyalty',
  welcome_drink:  'Welcome Drink',
  group_deal:     'Group Deal',
  free_upgrade:   'Free Upgrade',
  tasting:        'Free Tasting',
}

const COUNTRIES = [
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'US', flag: '🇺🇸', name: 'United States'  },
  { code: 'AE', flag: '🇦🇪', name: 'UAE'             },
  { code: 'IE', flag: '🇮🇪', name: 'Ireland'         },
  { code: 'AU', flag: '🇦🇺', name: 'Australia'       },
  { code: 'CA', flag: '🇨🇦', name: 'Canada'          },
]

export default function VenuePartnerSheet({ open, venue, venues = [], onSelectVenue, onClose, sessions = [] }) {
  const sheetRef    = useRef(null)
  const startYRef   = useRef(null)
  const currentYRef = useRef(0)
  const dropRef     = useRef(null)
  const [imgIdx, setImgIdx]               = useState(0)
  const [countryFilter, setCountryFilter] = useState('GB')
  const [countryOpen, setCountryOpen]     = useState(false)

  useEffect(() => { setImgIdx(0) }, [venue?.id])

  // Close country dropdown on outside click
  useEffect(() => {
    if (!countryOpen) return
    function handle(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setCountryOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [countryOpen])

  // Swipe down to dismiss
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const onTouchStart = (e) => { startYRef.current = e.touches[0].clientY }
    const onTouchMove  = (e) => {
      if (startYRef.current === null) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0) {
        currentYRef.current = delta
        sheet.style.transform = `translateY(${delta}px)`
        sheet.style.transition = 'none'
      }
    }
    const onTouchEnd = () => {
      sheet.style.transition = ''
      if (currentYRef.current > 100) onClose?.()
      else sheet.style.transform = ''
      currentYRef.current = 0
      startYRef.current   = null
    }
    sheet.addEventListener('touchstart', onTouchStart, { passive: true })
    sheet.addEventListener('touchmove',  onTouchMove,  { passive: true })
    sheet.addEventListener('touchend',   onTouchEnd)
    return () => {
      sheet.removeEventListener('touchstart', onTouchStart)
      sheet.removeEventListener('touchmove',  onTouchMove)
      sheet.removeEventListener('touchend',   onTouchEnd)
    }
  }, [open, onClose])

  const images  = venue?.images ?? []
  const offers  = venue?.offers ?? []

  // Who's at this venue right now
  const hereNow = sessions.filter(s => s.venueId === venue?.id && s.status === 'active')

  // Filtered + sorted venue list (featured first)
  const filteredVenues = venues
    .filter(v => !v.country || v.country === countryFilter)
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
  const featuredVenues = filteredVenues.filter(v => v.featured)
  const regularVenues  = filteredVenues.filter(v => !v.featured)

  const currentCountry = COUNTRIES.find(c => c.code === countryFilter) ?? COUNTRIES[0]

  return (
    <>
      {open && <div className={styles.backdrop} onClick={onClose} />}
      <div ref={sheetRef} className={`${styles.sheet} ${open ? styles.open : ''}`}>

        <div className={styles.handle} onClick={onClose} />

        {/* ── LIST VIEW ── */}
        {!venue && (
          <div className={styles.body}>

            {/* Header row: title + country dropdown */}
            <div className={styles.listHeader}>
              <div>
                <h2 className={styles.listTitle}>Partner Venues</h2>
                <p className={styles.listSub}>Show your profile to claim exclusive offers</p>
              </div>
              <div className={styles.countryWrap} ref={dropRef}>
                <button className={styles.countryPill} onClick={() => setCountryOpen(o => !o)}>
                  <span>{currentCountry.flag}</span>
                  <span className={styles.countryPillName}>{currentCountry.name}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {countryOpen && (
                  <ul className={styles.countryDropdown}>
                    {COUNTRIES.map(c => (
                      <li key={c.code}>
                        <button
                          className={`${styles.countryOption} ${c.code === countryFilter ? styles.countryOptionActive : ''}`}
                          onClick={() => { setCountryFilter(c.code); setCountryOpen(false) }}
                        >
                          <span>{c.flag}</span>
                          <span>{c.name}</span>
                          {c.code === countryFilter && <span className={styles.countryCheck}>✓</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Featured venues */}
            {featuredVenues.length > 0 && (
              <>
                <div className={styles.sectionLabel}>⭐ Featured</div>
                {featuredVenues.map(v => (
                  <button key={v.id} className={`${styles.venueListItem} ${styles.venueListItemFeatured}`} onClick={() => onSelectVenue(v)}>
                    <div className={styles.venueListLeft}>
                      <span className={styles.venueListEmoji}>{v.emoji}</span>
                      <div>
                        <div className={styles.venueListName}>{v.name} <span className={styles.featuredBadge}>FEATURED</span></div>
                        <div className={styles.venueListCat}>{v.category}</div>
                      </div>
                    </div>
                    <div className={styles.venueListRight}>
                      <span className={styles.venueListDiscount}>{v.minDiscount}%+ off</span>
                      <span className={styles.venueListOffers}>{v.offers?.length ?? 0} offers ›</span>
                    </div>
                  </button>
                ))}
              </>
            )}

            {/* Regular venues */}
            {regularVenues.length > 0 && (
              <>
                {featuredVenues.length > 0 && <div className={styles.sectionLabel}>All Venues</div>}
                {regularVenues.map(v => (
                  <button key={v.id} className={styles.venueListItem} onClick={() => onSelectVenue(v)}>
                    <div className={styles.venueListLeft}>
                      <span className={styles.venueListEmoji}>{v.emoji}</span>
                      <div>
                        <div className={styles.venueListName}>{v.name}</div>
                        <div className={styles.venueListCat}>{v.category}</div>
                      </div>
                    </div>
                    <div className={styles.venueListRight}>
                      <span className={styles.venueListDiscount}>{v.minDiscount}%+ off</span>
                      <span className={styles.venueListOffers}>{v.offers?.length ?? 0} offers ›</span>
                    </div>
                  </button>
                ))}
              </>
            )}

            {filteredVenues.length === 0 && (
              <p className={styles.emptyMsg}>No venues in {currentCountry.name} yet — check back soon.</p>
            )}
          </div>
        )}

        {/* ── DETAIL VIEW ── */}
        {venue && (
          <>
            {images.length > 0 && (
              <div className={styles.gallery}>
                <img src={images[imgIdx]} alt={venue.name} className={styles.galleryImg} />
                {venue.featured
                  ? <div className={styles.partnerBadgeFeatured}>⭐ FEATURED PARTNER</div>
                  : <div className={styles.partnerBadge}>⭐ IMOUTNOW Partner</div>
                }
                <div className={styles.discountBadge}>{venue.minDiscount}%+ off</div>
                {images.length > 1 && (
                  <div className={styles.imgDots}>
                    {images.map((_, i) => (
                      <button
                        key={i}
                        className={`${styles.imgDot} ${i === imgIdx ? styles.imgDotActive : ''}`}
                        onClick={() => setImgIdx(i)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className={styles.body}>
              <div className={styles.venueHeader}>
                <span className={styles.venueEmoji}>{venue.emoji}</span>
                <div className={styles.venueMeta}>
                  <h2 className={styles.venueName}>{venue.name}</h2>
                  <span className={styles.venueCategory}>{venue.category}</span>
                </div>
              </div>
              {venue.tagline && <p className={styles.tagline}>"{venue.tagline}"</p>}
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}>📍</span>
                <span className={styles.infoText}>{venue.address}</span>
              </div>
              {venue.phone && (
                <div className={styles.infoRow}>
                  <span className={styles.infoIcon}>📞</span>
                  <a href={`tel:${venue.phone}`} className={styles.infoLink}>{venue.phone}</a>
                </div>
              )}
              {venue.website && (
                <div className={styles.infoRow}>
                  <span className={styles.infoIcon}>🌐</span>
                  <span className={styles.infoText}>{venue.website}</span>
                </div>
              )}

              {/* Who's here now */}
              {hereNow.length > 0 && (
                <>
                  <div className={styles.divider} />
                  <div className={styles.hereNowRow}>
                    <span className={styles.hereNowDot} />
                    <span className={styles.hereNowLabel}>{hereNow.length} {hereNow.length === 1 ? 'person' : 'people'} here from the app right now</span>
                  </div>
                  <div className={styles.hereNowAvatars}>
                    {hereNow.map(s => (
                      <div key={s.id} className={styles.hereNowUser}>
                        <div className={styles.hereNowAvatar}>
                          {s.photoURL
                            ? <img src={s.photoURL} alt={s.displayName} className={styles.hereNowAvatarImg} />
                            : <span>{(s.displayName ?? 'U')[0]}</span>
                          }
                        </div>
                        <span className={styles.hereNowName}>{s.displayName}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className={styles.divider} />
              <h3 className={styles.sectionTitle}>🎁 Exclusive Offers</h3>
              <p className={styles.sectionSub}>Show your IMOUTNOW profile to claim</p>
              {offers.map(offer => (
                <div key={offer.id} className={styles.offerCard}>
                  <div className={styles.offerTop}>
                    <span className={styles.offerEmoji}>{offer.emoji}</span>
                    <div className={styles.offerMeta}>
                      <span className={styles.offerType}>{OFFER_LABELS[offer.type] ?? offer.type}</span>
                      <span className={styles.offerTitle}>{offer.title}</span>
                    </div>
                  </div>
                  <p className={styles.offerDetail}>{offer.detail}</p>
                  <div className={styles.offerFooter}>
                    <span className={styles.offerTime}>🕐 {offer.validTimes}</span>
                    <span className={styles.offerClaim}>Show profile →</span>
                  </div>
                </div>
              ))}
              <p className={styles.partnerSince}>⭐ IMOUTNOW Partner since {venue.partnerSince}</p>
            </div>
          </>
        )}

      </div>
    </>
  )
}
