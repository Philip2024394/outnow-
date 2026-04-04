import { OverlayViewF } from '@react-google-maps/api'
import { activityEmoji, ACTIVITY_TYPES } from '@/firebase/collections'

/**
 * Custom map marker rendered as a React component via OverlayView.
 * Shows: avatar with pulse ring + activity emoji badge.
 * isMutual = both sides expressed interest → purple ring instead of green.
 */
export default function LiveUserMarker({ session, isMutual, onClick }) {
  const position = {
    lat: session.fuzzedLat ?? session.lat,
    lng: session.fuzzedLng ?? session.lng,
  }

  const emoji = activityEmoji(session.activityType)
  const initial = (session.displayName ?? 'U')[0].toUpperCase()
  const MAKER_CATEGORIES = ['handmade', 'craft_supplies', 'property', 'professional']
  const activityCategory = ACTIVITY_TYPES.find(a => a.id === session.activityType)?.category
  const isMaker = MAKER_CATEGORIES.includes(session.lookingFor) || activityCategory === 'handmade'

  return (
    <OverlayViewF
      position={position}
      mapPaneName="overlayMouseTarget"
      getPixelPositionOffset={(w, h) => ({ x: -w / 2, y: -h / 2 })}
    >
      <div
        className={['live-marker', isMutual ? 'live-marker--mutual' : ''].filter(Boolean).join(' ')}
        onClick={onClick}
        role="button"
        aria-label={`${session.displayName ?? 'Someone'} is out now`}
      >
        <div className="live-marker__pulse" />
        <div className="live-marker__pulse-slow" />
        <div className="live-marker__avatar">
          {session.photoURL ? (
            <img src={session.photoURL} alt={session.displayName ?? 'User'} />
          ) : isMaker ? (
            <div className="live-marker__avatar--maker">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
                <line x1="16" y1="8" x2="2" y2="22"/>
                <line x1="17.5" y1="15" x2="9" y2="15"/>
              </svg>
            </div>
          ) : (
            <div className="live-marker__avatar--fallback">{initial}</div>
          )}
        </div>
        <div className="live-marker__activity">{emoji}</div>
      </div>
    </OverlayViewF>
  )
}
