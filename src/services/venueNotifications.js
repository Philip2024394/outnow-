// Venue proximity notification service
//
// Android (Capacitor native):
//   — background geolocation runs even when phone is locked
//   — fires a native push notification when within RADIUS_M of a hot venue
//
// iOS / Web (browser fallback):
//   — uses navigator.geolocation.watchPosition (only while app is open)
//   — triggers an in-app proximity banner instead of a system notification
//
// Cooldown: one alert per venue per hour so it doesn't spam

const RADIUS_M       = 200
const COOLDOWN_MS    = 60 * 60 * 1000   // 1 hour per venue
const DISTANCE_FILTER = 30               // metres — Android only, re-check every 30m moved

// Module paths in variables so Vite skips static analysis (packages only present in native builds)
const MOD_BG_GEO   = '@capacitor-community/background-geolocation'
const MOD_LOCAL_NOTIF = '@capacitor/local-notifications'

// Haversine distance in metres between two lat/lng points
function distanceMetres(lat1, lng1, lat2, lng2) {
  const R    = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// True when running inside Capacitor (Android / iOS native build)
function isNative() {
  return typeof window !== 'undefined' && !!window.Capacitor?.isNative
}

export class VenueNotificationService {
  constructor() {
    this._venues      = []
    this._notified    = new Map()   // venueId → last notified timestamp
    this._watchId     = null        // browser geolocation watchId
    this._bgWatcher   = null        // Capacitor background watcher id
    this._onAlert     = null        // callback(venue, distM) for in-app banner
  }

  // Call once on app mount.
  // onAlert(venue, distM) — called on iOS/web when nearby (show in-app banner)
  async init(onAlert) {
    this._onAlert = onAlert
    if (isNative()) {
      await this._initAndroid()
    } else {
      this._initWeb()
    }
  }

  // Update the list of active venues whenever it changes
  setVenues(venues) {
    this._venues = venues ?? []
  }

  destroy() {
    if (this._watchId !== null) {
      navigator.geolocation.clearWatch(this._watchId)
      this._watchId = null
    }
    if (this._bgWatcher && isNative()) {
      import(MOD_BG_GEO).then(({ BackgroundGeolocation }) => {
        BackgroundGeolocation.removeWatcher({ id: this._bgWatcher })
      })
    }
  }

  // ─────────────────────────────────────────────
  // Android — background geolocation + local push
  // ─────────────────────────────────────────────
  async _initAndroid() {
    try {
      const { LocalNotifications }     = await import(MOD_LOCAL_NOTIF)
      const { BackgroundGeolocation }  = await import(MOD_BG_GEO)

      // Request notification permission
      await LocalNotifications.requestPermissions()

      this._bgWatcher = await BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: 'Watching for hot venues nearby…',
          backgroundTitle:   'imoutnow',
          requestPermissions: true,
          stale: false,
          distanceFilter: DISTANCE_FILTER,
        },
        (position, error) => {
          if (error || !position) return
          this._checkProximity(position.latitude, position.longitude,
            (venue, distM) => this._sendNativeNotification(venue, distM))
        }
      )
    } catch (err) {
      // Capacitor plugins not available (e.g. running in browser during dev)
      console.warn('[VenueNotifications] Capacitor unavailable, falling back to web', err)
      this._initWeb()
    }
  }

  async _sendNativeNotification(venue, distM) {
    try {
      const { LocalNotifications } = await import(MOD_LOCAL_NOTIF)
      await LocalNotifications.schedule({
        notifications: [{
          id:         Date.now() % 2147483647,
          title:      `${venue.emoji} ${venue.name}`,
          body:       `${venue.count} ${venue.count === 1 ? 'person' : 'people'} out here — you're ${Math.round(distM)}m away`,
          smallIcon:  'ic_stat_notification',
          iconColor:  '#39FF14',
          extra:      { venueId: venue.id },
        }],
      })
    } catch (err) {
      console.warn('[VenueNotifications] Could not schedule notification', err)
    }
  }

  // ─────────────────────────────────────────────
  // iOS / Web — browser geolocation + in-app banner
  // ─────────────────────────────────────────────
  _initWeb() {
    if (!navigator?.geolocation) return
    this._watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this._checkProximity(
          pos.coords.latitude,
          pos.coords.longitude,
          (venue, distM) => this._onAlert?.(venue, distM)
        )
      },
      null,
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    )
  }

  // ─────────────────────────────────────────────
  // Shared proximity check
  // ─────────────────────────────────────────────
  _checkProximity(lat, lng, trigger) {
    this._venues.forEach(venue => {
      const dist = distanceMetres(lat, lng, venue.lat, venue.lng)
      if (dist <= RADIUS_M && this._canNotify(venue.id)) {
        this._notified.set(venue.id, Date.now())
        trigger(venue, dist)
      }
    })
  }

  _canNotify(venueId) {
    const last = this._notified.get(venueId)
    if (!last) return true
    return Date.now() - last > COOLDOWN_MS
  }
}
