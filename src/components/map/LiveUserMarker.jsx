import { OverlayViewF } from '@react-google-maps/api'
import { activityEmoji, ACTIVITY_TYPES } from '@/firebase/collections'
import { formatCountdown } from '@/utils/formatCountdown'

const VIBE_EMOJI = {
  party:      '🎉',
  chill:      '😎',
  networking: '💼',
  dates:      '❤️',
  workout:    '💪',
  culture:    '🎨',
}

const MAKER_CATEGORIES = [
  'buy_sell', 'fresh_produce', 'agri_goods', 'fashion', 'electronics', 'vehicles',
  'property', 'hardware', 'tools_equip', 'antiques', 'import_export',
  'trades', 'auto_repair', 'cleaning', 'garden', 'security', 'laundry', 'tailoring',
  'childcare', 'eldercare', 'pet_care', 'transport',
  'healthcare', 'beauty', 'fitness_pt', 'mental_health', 'alt_medicine',
  'veterinary', 'pharmacy',
  'catering', 'restaurant', 'hotel_accom', 'tourism_guide', 'event_planning', 'bar_nightclub',
  'creative', 'content_creator', 'music_perform', 'writing', 'fashion_design', 'art_craft',
  'business', 'technology', 'legal', 'engineering', 'sales_leads', 'consulting',
  'real_estate', 'marketing', 'media_pro',
  'hiring', 'freelance', 'manufacturing', 'mining',
  'education', 'coaching',
]

const MAKER_DEFAULT_IMG = 'https://ik.imagekit.io/nepgaxllc/UntitledsdfasdfdddfsdfsdzxcZXcxxx.png'

/**
 * Custom map marker rendered as a React component via OverlayView.
 *
 * Visual variants (applied as CSS class modifiers):
 *  live-marker--mutual    purple ring — both sides have expressed interest
 *  live-marker--vip       gold ring + crown — Business / VIP / Premium tier
 *  live-marker--invite    yellow ring — invite_out status (no exact location)
 *  live-marker--scheduled dashed orange ring — scheduled / out later
 *
 * New:
 *  live-marker__crown     👑 floating above avatar for VIP users
 *  live-marker__vibe      vibe emoji floating at top-left of avatar
 */
export default function LiveUserMarker({ session, isMutual, onClick }) {
  const position = {
    lat: session.fuzzedLat ?? session.lat,
    lng: session.fuzzedLng ?? session.lng,
  }

  const emoji      = activityEmoji(session.activityType)
  const initial    = (session.displayName ?? 'U')[0].toUpperCase()
  const isMaker    = MAKER_CATEGORIES.includes(session.lookingFor) ||
                     ACTIVITY_TYPES.find(a => a.id === session.activityType)?.category === 'handmade'
  const avatarSrc  = session.photoURL || (isMaker ? MAKER_DEFAULT_IMG : null)
  const countdown  = session.status === 'active' ? formatCountdown(session.expiresAtMs) : null

  // Tier flags
  const isVip      = ['vip', 'business'].includes(session.tier)
  const isPremium  = session.tier === 'premium'

  // Status-based ring
  const isInvite    = session.status === 'invite_out'
  const isScheduled = session.status === 'scheduled'

  // Vibe badge (only show if not shown in activity badge to avoid crowding)
  const vibeEmoji = session.vibe ? VIBE_EMOJI[session.vibe] : null

  const markerClass = [
    'live-marker',
    isMutual    ? 'live-marker--mutual'    : '',
    isVip       ? 'live-marker--vip'       : '',
    isInvite    ? 'live-marker--invite'    : '',
    isScheduled ? 'live-marker--scheduled' : '',
  ].filter(Boolean).join(' ')

  const statusLabel = isScheduled
    ? `${session.displayName ?? 'Someone'} is going out later`
    : isInvite
    ? `${session.displayName ?? 'Someone'} wants an invite out`
    : `${session.displayName ?? 'Someone'} is out now`

  return (
    <OverlayViewF
      position={position}
      mapPaneName="overlayMouseTarget"
      getPixelPositionOffset={(w, h) => ({ x: -w / 2, y: -h / 2 })}
    >
      <div
        className={markerClass}
        onClick={onClick}
        role="button"
        aria-label={statusLabel}
      >
        {/* Crown for VIP / Business tier */}
        {(isVip || isPremium) && (
          <div className="live-marker__crown" aria-hidden="true">👑</div>
        )}

        {/* Vibe indicator (top-left corner) */}
        {vibeEmoji && (
          <div className="live-marker__vibe" aria-hidden="true">{vibeEmoji}</div>
        )}

        <div className="live-marker__pulse" />
        <div className="live-marker__pulse-slow" />

        <div className="live-marker__avatar">
          {avatarSrc ? (
            <img src={avatarSrc} alt={session.displayName ?? 'User'} />
          ) : (
            <div className="live-marker__avatar--fallback">{initial}</div>
          )}
        </div>

        {/* Activity emoji badge */}
        <div className="live-marker__activity">{emoji}</div>

        {/* Countdown pill — only for active sessions */}
        {countdown && (
          <div className="live-marker__countdown">{countdown}</div>
        )}
      </div>
    </OverlayViewF>
  )
}
