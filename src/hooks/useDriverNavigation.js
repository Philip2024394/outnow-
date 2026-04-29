/**
 * useDriverNavigation — orchestrates in-app driver navigation.
 * Fetches route, tracks GPS, advances steps, detects off-route, triggers audio.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { getNavigationRoute } from '@/utils/googleDirections'
import { haversineKm } from '@/utils/distance'
import { speakInstruction, speakArrival, speakReroute, cancelSpeech } from '@/utils/navAudio'

const GPS_INTERVAL = 5000 // 5 seconds
const STEP_ADVANCE_METERS = 30 // advance step when within 30m
const OFF_ROUTE_METERS = 100 // re-route if >100m from polyline
const REROUTE_COOLDOWN = 15000 // min 15s between reroutes

/**
 * Calculate minimum distance from a point to a polyline (array of {lat,lng}).
 */
function distToPolyline(point, path) {
  let minDist = Infinity
  for (const p of path) {
    const d = haversineKm(point.lat, point.lng, p.lat, p.lng) * 1000
    if (d < minDist) minDist = d
  }
  return minDist
}

/**
 * Calculate bearing between two points in degrees.
 */
function calcBearing(from, to) {
  const dLng = ((to.lng - from.lng) * Math.PI) / 180
  const lat1 = (from.lat * Math.PI) / 180
  const lat2 = (to.lat * Math.PI) / 180
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

export default function useDriverNavigation(destination, enabled = true) {
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [driverPos, setDriverPos] = useState(null)
  const [bearing, setBearing] = useState(0)
  const [isOffRoute, setIsOffRoute] = useState(false)
  const [etaMin, setEtaMin] = useState(null)
  const [distToNextTurn, setDistToNextTurn] = useState(null)
  const [arrived, setArrived] = useState(false)

  const watchRef = useRef(null)
  const lastRerouteRef = useRef(0)
  const prevPosRef = useRef(null)
  const announcedStepRef = useRef(-1)

  // Fetch route
  const fetchRoute = useCallback(async (originLat, originLng) => {
    if (!destination?.lat || !originLat) return
    setLoading(true)
    const navRoute = await getNavigationRoute(originLat, originLng, destination.lat, destination.lng)
    if (navRoute) {
      setRoute(navRoute)
      setCurrentStepIdx(0)
      setIsOffRoute(false)
      setArrived(false)
      announcedStepRef.current = -1
    }
    setLoading(false)
  }, [destination?.lat, destination?.lng])

  // Initial route fetch + GPS watch
  useEffect(() => {
    if (!enabled || !destination?.lat) return

    let cancelled = false

    // Get initial position and fetch route
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setDriverPos(coords)
        fetchRoute(coords.lat, coords.lng)
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )

    // Start GPS watch
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (cancelled) return
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }

        // Calculate bearing from previous position
        if (prevPosRef.current) {
          const dist = haversineKm(prevPosRef.current.lat, prevPosRef.current.lng, coords.lat, coords.lng) * 1000
          if (dist > 5) { // only update bearing if moved >5m
            setBearing(calcBearing(prevPosRef.current, coords))
            prevPosRef.current = coords
          }
        } else {
          prevPosRef.current = coords
        }

        setDriverPos(coords)
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    )

    return () => {
      cancelled = true
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current)
      cancelSpeech()
    }
  }, [enabled, destination?.lat, destination?.lng, fetchRoute])

  // Process position updates — advance steps, detect off-route
  useEffect(() => {
    if (!route || !driverPos || arrived) return

    const { steps, decodedPath } = route

    // Check distance to destination
    const distToDest = haversineKm(driverPos.lat, driverPos.lng, destination.lat, destination.lng) * 1000
    if (distToDest < 30) {
      setArrived(true)
      speakArrival()
      return
    }

    // Check if off-route
    const distFromRoute = distToPolyline(driverPos, decodedPath)
    if (distFromRoute > OFF_ROUTE_METERS) {
      setIsOffRoute(true)
      const now = Date.now()
      if (now - lastRerouteRef.current > REROUTE_COOLDOWN) {
        lastRerouteRef.current = now
        speakReroute()
        fetchRoute(driverPos.lat, driverPos.lng)
      }
    } else {
      setIsOffRoute(false)
    }

    // Advance step if close to next step's start location
    if (steps && currentStepIdx < steps.length) {
      const nextStepStart = steps[currentStepIdx]?.endLocation
      if (nextStepStart) {
        const distToStep = haversineKm(driverPos.lat, driverPos.lng, nextStepStart.lat, nextStepStart.lng) * 1000
        setDistToNextTurn(Math.round(distToStep))

        if (distToStep < STEP_ADVANCE_METERS && currentStepIdx < steps.length - 1) {
          setCurrentStepIdx(prev => prev + 1)
        }
      }
    }

    // Calculate ETA based on remaining distance
    const remainingKm = haversineKm(driverPos.lat, driverPos.lng, destination.lat, destination.lng)
    const speed = 20 // avg 20 km/h in Yogyakarta
    setEtaMin(Math.max(1, Math.ceil((remainingKm / speed) * 60)))

  }, [driverPos, route, currentStepIdx, destination, arrived, fetchRoute])

  // Announce current step via audio
  useEffect(() => {
    if (!route?.steps || arrived) return
    const step = route.steps[currentStepIdx]
    if (step && currentStepIdx !== announcedStepRef.current) {
      announcedStepRef.current = currentStepIdx
      speakInstruction(step.instruction)
    }
  }, [currentStepIdx, route, arrived])

  const currentStep = route?.steps?.[currentStepIdx] || null
  const nextStep = route?.steps?.[currentStepIdx + 1] || null

  return {
    route,
    loading,
    driverPos,
    bearing,
    currentStep,
    nextStep,
    currentStepIdx,
    totalSteps: route?.steps?.length || 0,
    etaMin,
    distToNextTurn,
    isOffRoute,
    arrived,
    refetchRoute: () => driverPos && fetchRoute(driverPos.lat, driverPos.lng),
  }
}
