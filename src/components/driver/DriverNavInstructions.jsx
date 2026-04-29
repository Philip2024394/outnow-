/**
 * DriverNavInstructions — floating turn-by-turn instruction panel.
 * Shows current maneuver, distance to next turn, and ETA.
 */
import { toggleNavMute, isNavMuted } from '@/utils/navAudio'
import { useState } from 'react'

const MANEUVER_ICONS = {
  'turn-left': '↰',
  'turn-right': '↱',
  'turn-slight-left': '↖',
  'turn-slight-right': '↗',
  'turn-sharp-left': '⬅',
  'turn-sharp-right': '➡',
  'uturn-left': '↩',
  'uturn-right': '↪',
  'merge': '⤵',
  'fork-left': '⑂',
  'fork-right': '⑂',
  'roundabout-left': '↺',
  'roundabout-right': '↻',
  'straight': '↑',
  'ramp-left': '↗',
  'ramp-right': '↗',
  'keep-left': '↖',
  'keep-right': '↗',
}

function getManeuverIcon(maneuver) {
  return MANEUVER_ICONS[maneuver] || '↑'
}

export default function DriverNavInstructions({ currentStep, nextStep, distToNextTurn, etaMin, arrived, durationText }) {
  const [muted, setMuted] = useState(isNavMuted())

  const handleMuteToggle = () => {
    const newMuted = toggleNavMute()
    setMuted(newMuted)
  }

  if (arrived) {
    return (
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        padding: '16px', background: 'rgba(141,198,63,0.95)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 28 }}>🏁</span>
        <span style={{ fontSize: 18, fontWeight: 900, color: '#000' }}>You have arrived!</span>
      </div>
    )
  }

  if (!currentStep) return null

  return (
    <>
      {/* Top instruction bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(141,198,63,0.2)',
        padding: '12px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Maneuver icon */}
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(141,198,63,0.15)', border: '1.5px solid rgba(141,198,63,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, color: '#8DC63F', flexShrink: 0,
          }}>
            {getManeuverIcon(currentStep.maneuver)}
          </div>

          {/* Instruction text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 15, fontWeight: 800, color: '#fff',
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {currentStep.instruction}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {currentStep.distanceText}
            </div>
          </div>

          {/* Distance to turn */}
          {distToNextTurn != null && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#8DC63F', fontFamily: 'monospace' }}>
                {distToNextTurn > 999 ? `${(distToNextTurn / 1000).toFixed(1)}km` : `${distToNextTurn}m`}
              </div>
            </div>
          )}
        </div>

        {/* Next step preview */}
        {nextStep && (
          <div style={{
            marginTop: 8, padding: '6px 10px', borderRadius: 8,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 14, color: 'rgba(141,198,63,0.6)' }}>
              {getManeuverIcon(nextStep.maneuver)}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Then: {nextStep.instruction}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto', flexShrink: 0 }}>
              {nextStep.distanceText}
            </span>
          </div>
        )}
      </div>

      {/* Bottom ETA bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(141,198,63,0.15)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#8DC63F' }}>
            {etaMin ? `${etaMin} min` : durationText || '—'}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>ETA</div>
        </div>

        {/* Mute button */}
        <button onClick={handleMuteToggle} style={{
          width: 40, height: 40, borderRadius: '50%',
          background: muted ? 'rgba(239,68,68,0.15)' : 'rgba(141,198,63,0.15)',
          border: `1.5px solid ${muted ? 'rgba(239,68,68,0.3)' : 'rgba(141,198,63,0.3)'}`,
          color: muted ? '#EF4444' : '#8DC63F',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {muted ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
          )}
        </button>
      </div>
    </>
  )
}
