/**
 * useAppOverlays — centralises all overlay / modal / sheet open-state
 * declarations for AppShell.
 *
 * Rules:
 *  - Only pure boolean open/close states and their direct setters live here.
 *  - No JSX, no data-fetching, no useEffect hooks.
 *  - AppShell destructures the returned object to get the same identifiers
 *    it used before, so no other code needs to change.
 */
import { useState } from 'react'

export function useAppOverlays() {
  // ── Country / city / company browse ────────────────────────────────────────
  const [countrySearchOpen, setCountrySearchOpen] = useState(false)
  const [cityResultsOpen,   setCityResultsOpen]   = useState(false)
  const [companyPanelOpen,  setCompanyPanelOpen]  = useState(false)

  // ── Dating flows ────────────────────────────────────────────────────────────
  const [dateIdeasOpen,    setDateIdeasOpen]    = useState(false)
  const [datingIntentOpen, setDatingIntentOpen] = useState(false)
  const [datingGridOpen,   setDatingGridOpen]   = useState(false)

  // ── Ride / food ─────────────────────────────────────────────────────────────
  const [rideOpen,       setRideOpen]       = useState(false)
  const [foodOpen,       setFoodOpen]       = useState(false)
  const [foodBrowseOpen, setFoodBrowseOpen] = useState(false)

  // ── Profile-related screens ─────────────────────────────────────────────────
  const [likedMeOpen,       setLikedMeOpen]       = useState(false)
  const [likedProfilesOpen, setLikedProfilesOpen] = useState(false)
  const [settingsOpen,      setSettingsOpen]      = useState(false)
  const [notifOpen,         setNotifOpen]         = useState(false)
  const [rideHistoryOpen,   setRideHistoryOpen]   = useState(false)
  const [blockListOpen,     setBlockListOpen]     = useState(false)
  const [ratingOpen,        setRatingOpen]        = useState(false)
  const [reviewsOpen,       setReviewsOpen]       = useState(false)

  // ── Safety / upgrade / spots ────────────────────────────────────────────────
  const [sosOpen,       setSosOpen]       = useState(false)
  const [upgradeOpen,   setUpgradeOpen]   = useState(false)
  const [spotClaimOpen, setSpotClaimOpen] = useState(false)
  const [mySpotOpen,    setMySpotOpen]    = useState(false)

  // ── Session invite / discovery ──────────────────────────────────────────────
  const [inviteOutSheetOpen,  setInviteOutSheetOpen]  = useState(false)
  const [discoveryListOpen,   setDiscoveryListOpen]   = useState(false)

  // ── Vibe / news ─────────────────────────────────────────────────────────────
  const [vibeCheckOpen,    setVibeCheckOpen]    = useState(false)
  const [vibeBroadcastOpen, setVibeBroadcastOpen] = useState(false)
  const [newsOpen,          setNewsOpen]          = useState(false)

  // ── Map filter ──────────────────────────────────────────────────────────────
  const [mapFilterOpen, setMapFilterOpen] = useState(false)

  // ── Order history / incoming gifts ──────────────────────────────────────────
  const [orderHistoryOpen,   setOrderHistoryOpen]   = useState(false)
  const [incomingGiftsOpen,  setIncomingGiftsOpen]  = useState(false)

  return {
    countrySearchOpen, setCountrySearchOpen,
    cityResultsOpen,   setCityResultsOpen,
    companyPanelOpen,  setCompanyPanelOpen,
    dateIdeasOpen,     setDateIdeasOpen,
    datingIntentOpen,  setDatingIntentOpen,
    datingGridOpen,    setDatingGridOpen,
    rideOpen,          setRideOpen,
    foodOpen,          setFoodOpen,
    foodBrowseOpen,    setFoodBrowseOpen,
    likedMeOpen,       setLikedMeOpen,
    likedProfilesOpen, setLikedProfilesOpen,
    settingsOpen,      setSettingsOpen,
    notifOpen,         setNotifOpen,
    rideHistoryOpen,   setRideHistoryOpen,
    blockListOpen,     setBlockListOpen,
    ratingOpen,        setRatingOpen,
    reviewsOpen,       setReviewsOpen,
    sosOpen,           setSosOpen,
    upgradeOpen,       setUpgradeOpen,
    spotClaimOpen,     setSpotClaimOpen,
    mySpotOpen,        setMySpotOpen,
    inviteOutSheetOpen,  setInviteOutSheetOpen,
    discoveryListOpen,   setDiscoveryListOpen,
    vibeCheckOpen,       setVibeCheckOpen,
    vibeBroadcastOpen,   setVibeBroadcastOpen,
    newsOpen,            setNewsOpen,
    mapFilterOpen,       setMapFilterOpen,
    orderHistoryOpen,    setOrderHistoryOpen,
    incomingGiftsOpen,   setIncomingGiftsOpen,
  }
}
