import { OverlayViewF } from '@react-google-maps/api'
import { activityEmoji, ACTIVITY_TYPES } from '@/firebase/collections'
import { formatCountdown } from '@/utils/formatCountdown'

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

  const MAKER_DEFAULT_IMG = 'https://ik.imagekit.io/nepgaxllc/UntitledsdfasdfdddfsdfsdzxcZXcxxx.png'
  const avatarSrc = session.photoURL || (isMaker ? MAKER_DEFAULT_IMG : null)
  const countdown = session.status === 'active' ? formatCountdown(session.expiresAtMs) : null

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
          {avatarSrc ? (
            <img src={avatarSrc} alt={session.displayName ?? 'User'} />
          ) : (
            <div className="live-marker__avatar--fallback">{initial}</div>
          )}
        </div>
        <div className="live-marker__activity">{emoji}</div>
        {countdown && (
          <div className="live-marker__countdown">{countdown}</div>
        )}
      </div>
    </OverlayViewF>
  )
}
