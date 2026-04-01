import { OverlayViewF } from '@react-google-maps/api'
import { activityEmoji } from '@/firebase/collections'

/**
 * Custom map marker rendered as a React component via OverlayView.
 * Shows: avatar with pulse ring + activity emoji badge.
 * isMutual = both sides expressed interest → purple ring instead of green.
 */
export default function LiveUserMarker({ session, isMutual, onClick }) {
  const position = {
    lat: session.fuzzedLat,
    lng: session.fuzzedLng,
  }

  const emoji = activityEmoji(session.activityType)
  const initial = (session.displayName ?? 'U')[0].toUpperCase()

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
          ) : (
            <div className="live-marker__avatar--fallback">{initial}</div>
          )}
        </div>
        <div className="live-marker__activity">{emoji}</div>
      </div>
    </OverlayViewF>
  )
}
