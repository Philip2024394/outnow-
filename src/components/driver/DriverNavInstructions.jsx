/**
 * DriverNavInstructions — Ultimate navigation HUD overlay.
 *
 * Top: compact direction card with large maneuver arrow, distance countdown,
 *      time-to-turn, and "Then" next-step preview.
 * Bottom: trip dashboard bar with progress, ETA, remaining distance, mute.
 */
import { toggleNavMute, isNavMuted } from '@/utils/navAudio'
import { useState, useEffect, useRef } from 'react'

// SVG arrow icons for precise maneuver rendering
const ManeuverSVG = ({ maneuver, size = 32, color = '#8DC63F' }) => {
  const s = size
  const props = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' }

  switch (maneuver) {
    case 'turn-left':
      return <svg {...props}><path d="M15 19V9H9"/><polyline points="3 15 9 9 15 9"/></svg>
    case 'turn-right':
      return <svg {...props}><path d="M9 19V9h6"/><polyline points="21 15 15 9 9 9"/></svg>
    case 'turn-slight-left':
      return <svg {...props}><path d="M14 20V10L7 4"/><polyline points="3 8 7 4 11 8"/></svg>
    case 'turn-slight-right':
      return <svg {...props}><path d="M10 20V10l7-6"/><polyline points="13 8 17 4 21 8"/></svg>
    case 'turn-sharp-left':
      return <svg {...props}><path d="M16 20V12L6 8"/><polyline points="2 12 6 8 10 12"/></svg>
    case 'turn-sharp-right':
      return <svg {...props}><path d="M8 20V12l10-4"/><polyline points="14 12 18 8 22 12"/></svg>
    case 'uturn-left':
      return <svg {...props}><path d="M9 14l-4-4 4-4"/><path d="M5 10h9a4 4 0 010 8h-1"/></svg>
    case 'uturn-right':
      return <svg {...props}><path d="M15 14l4-4-4-4"/><path d="M19 10h-9a4 4 0 000 8h1"/></svg>
    case 'roundabout-left':
    case 'roundabout-right':
      return <svg {...props}><circle cx="12" cy="10" r="4"/><path d="M12 14v6"/><path d="M16 10l2-2"/></svg>
    case 'merge':
      return <svg {...props}><path d="M6 4l6 6 6-6"/><path d="M12 10v10"/></svg>
    case 'fork-left':
      return <svg {...props}><path d="M14 20V10L7 4"/><path d="M17 4v16"/></svg>
    case 'fork-right':
      return <svg {...props}><path d="M10 20V10l7-6"/><path d="M7 4v16"/></svg>
    case 'keep-left':
      return <svg {...props}><path d="M14 20V6L8 2"/><polyline points="4 6 8 2 12 6"/></svg>
    case 'keep-right':
      return <svg {...props}><path d="M10 20V6l6-4"/><polyline points="12 6 16 2 20 6"/></svg>
    default: // straight
      return <svg {...props}><path d="M12 20V4"/><polyline points="6 10 12 4 18 10"/></svg>
  }
}

// Small inline icon for "Then" preview
const SmallManeuver = ({ maneuver }) => <ManeuverSVG maneuver={maneuver} size={16} color="rgba(141,198,63,0.6)" />

function fmtDist(m) {
  if (m == null) return '—'
  return m > 999 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
}

function fmtTimeSec(sec) {
  if (sec == null) return ''
  if (sec < 60) return `${sec}s`
  return `${Math.ceil(sec / 60)} min`
}

// Alert icon by type
const AlertIcon = ({ icon }) => {
  switch (icon) {
    case 'arrived':
      return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    case 'uturn':
      return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M9 14l-4-4 4-4"/><path d="M5 10h9a4 4 0 010 8h-1"/></svg>
    case 'reroute':
      return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    default:
      return <ManeuverSVG maneuver={icon} size={22} color="#fff" />
  }
}

// Alert background color by type
function alertBg(type) {
  if (type === 'arrived') return 'linear-gradient(135deg, #22C55E, #16A34A)'
  if (type === 'warning') return 'linear-gradient(135deg, #EF4444, #DC2626)'
  return 'linear-gradient(135deg, #3B82F6, #2563EB)' // turn
}

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

export default function DriverNavInstructions({
  currentStep, nextStep, distToNextTurn, etaMin, arrived, durationText,
  speedKmh = 0, remainingKm, tripProgress = 0, timeToTurnSec, navAlerts = [],
  passenger, fare, phase, pickupAddress, dropoffAddress, footerVisible = true,
}) {
  const [muted, setMuted] = useState(isNavMuted())

  const handleMuteToggle = () => {
    const newMuted = toggleNavMute()
    setMuted(newMuted)
  }

  // Arrived banner
  if (arrived) {
    return (
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        padding: '20px 16px',
        background: 'linear-gradient(135deg, rgba(141,198,63,0.95), rgba(100,160,30,0.95))',
        backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        boxShadow: '0 4px 24px rgba(141,198,63,0.4)',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#000' }}>You have arrived!</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.5)' }}>Destination reached</div>
        </div>
      </div>
    )
  }

  // Turn is approaching (under 100m)
  const turnApproaching = currentStep && distToNextTurn != null && distToNextTurn < 100

  return (
    <>
      {/* ── Top direction card ── */}
      {currentStep && (<div style={{
        position: 'absolute', top: 12, left: 12, right: 12, zIndex: 20,
        borderRadius: 16,
        background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(20px)',
        border: `1.5px solid ${turnApproaching ? 'rgba(245,197,24,0.5)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: turnApproaching
          ? '0 4px 30px rgba(245,197,24,0.25)'
          : '0 4px 24px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}>
        {/* Main instruction row */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 14px 10px' }}>
          {/* Large maneuver arrow */}
          <div style={{
            width: 56, height: 56, borderRadius: 14, flexShrink: 0,
            background: turnApproaching
              ? 'rgba(245,197,24,0.15)'
              : 'rgba(141,198,63,0.1)',
            border: `1.5px solid ${turnApproaching ? 'rgba(245,197,24,0.3)' : 'rgba(141,198,63,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s',
          }}>
            <ManeuverSVG
              maneuver={currentStep.maneuver}
              size={34}
              color={turnApproaching ? '#F5C518' : '#8DC63F'}
            />
          </div>

          {/* Instruction + street name */}
          <div style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
            <div style={{
              fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {currentStep.instruction}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontWeight: 600 }}>
              {currentStep.distanceText}
            </div>
          </div>

          {/* Distance + time to turn */}
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
            <div style={{
              fontSize: 22, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1,
              color: turnApproaching ? '#F5C518' : '#8DC63F',
            }}>
              {fmtDist(distToNextTurn)}
            </div>
            {timeToTurnSec != null && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginTop: 3 }}>
                {fmtTimeSec(timeToTurnSec)}
              </div>
            )}
          </div>
        </div>

        {/* "Then" next step preview */}
        {nextStep && (
          <div style={{
            padding: '8px 14px 10px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.02)',
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: 1 }}>THEN</span>
            <SmallManeuver maneuver={nextStep.maneuver} />
            <span style={{
              fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            }}>
              {nextStep.instruction}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', flexShrink: 0, fontWeight: 700 }}>
              {nextStep.distanceText}
            </span>
          </div>
        )}
      </div>)}

      {/* ── Bottom footer: customer + trip dashboard ── */}
      {footerVisible && (
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
        background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {/* Progress bar */}
        <div style={{
          height: 3,
          background: 'rgba(255,255,255,0.06)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            width: `${tripProgress}%`,
            background: 'linear-gradient(90deg, #6ba020, #8DC63F, #a8e650)',
            borderRadius: '0 2px 2px 0',
            transition: 'width 1s ease',
          }} />
        </div>

        {/* Customer + locations row */}
        {passenger && (
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            {/* Customer profile row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Avatar */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: '#1a1a1a', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid rgba(141,198,63,0.3)',
              }}>
                {passenger.photo_url
                  ? <img src={passenger.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 16, fontWeight: 800, color: '#8DC63F' }}>{passenger.display_name?.[0]?.toUpperCase() ?? '?'}</span>
                }
              </div>

              {/* Name + phase */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {passenger.display_name ?? 'Passenger'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: 1 }}>
                  {phase === 'going_to_pickup' && 'Heading to pickup'}
                  {phase === 'arrived' && 'Waiting for passenger'}
                  {phase === 'in_progress' && 'Ride in progress'}
                </div>
              </div>

              {/* Fare */}
              {fare != null && (
                <div style={{
                  padding: '4px 10px', borderRadius: 8,
                  background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.2)',
                }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#8DC63F' }}>{fmtRp(fare)}</span>
                </div>
              )}

              {/* Mute button */}
              <button onClick={handleMuteToggle} style={{
                width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer',
                background: muted ? 'rgba(239,68,68,0.12)' : 'rgba(141,198,63,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {muted ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
                )}
              </button>
            </div>

            {/* Pickup & Drop-off locations */}
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 4 }}>
              {/* Pickup */}
              {pickupAddress && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: 'rgba(141,198,63,0.15)', border: '2px solid #8DC63F',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8DC63F' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5, lineHeight: 1 }}>PICKUP</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pickupAddress}
                    </div>
                  </div>
                </div>
              )}

              {/* Connector line */}
              {pickupAddress && dropoffAddress && (
                <div style={{ width: 2, height: 10, background: 'rgba(255,255,255,0.1)', marginLeft: 9, borderRadius: 1 }} />
              )}

              {/* Drop-off */}
              {dropoffAddress && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    background: 'rgba(239,68,68,0.15)', border: '2px solid #EF4444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: 2, background: '#EF4444' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5, lineHeight: 1 }}>DROP-OFF</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dropoffAddress}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px 12px',
        }}>
          {/* ETA */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#8DC63F', lineHeight: 1, fontFamily: 'monospace' }}>
              {etaMin ?? '—'}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginTop: 3 }}>MIN</div>
          </div>

          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />

          {/* Remaining distance */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1, fontFamily: 'monospace' }}>
              {remainingKm != null ? `${remainingKm}` : '—'}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginTop: 3 }}>KM LEFT</div>
          </div>

          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />

          {/* Trip progress */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1, fontFamily: 'monospace' }}>
              {tripProgress}%
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginTop: 3 }}>DONE</div>
          </div>
        </div>
      </div>
      )}

      {/* ── Navigation alert toasts ── */}
      {navAlerts.length > 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 35, display: 'flex', flexDirection: 'column', gap: 8,
          pointerEvents: 'none', width: '85%', maxWidth: 360,
        }}>
          {navAlerts.slice(-3).map((alert, i) => {
            const age = Date.now() - alert.ts
            const fadeIn = age < 300
            const fadeOut = age > 3500
            return (
              <div key={alert.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px', borderRadius: 16,
                background: alertBg(alert.type),
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                opacity: fadeOut ? 0.3 : fadeIn ? 0.8 : 1,
                transform: fadeIn ? 'translateY(10px) scale(0.95)' : 'translateY(0) scale(1)',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(12px)',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <AlertIcon icon={alert.icon} />
                </div>
                <span style={{
                  fontSize: 15, fontWeight: 800, color: '#fff',
                  textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  lineHeight: 1.3,
                }}>
                  {alert.message}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
