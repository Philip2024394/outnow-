/**
 * imoutnow Phase 1 Algorithm
 *
 * Scores each session so the discovery list surfaces the most
 * relevant people first. No ML — pure signal weighting.
 *
 * Max possible score: ~315
 *
 * Factors (in priority order):
 *   1. Mutual interest (both liked each other)  +80
 *   2. Live status  (Out Now > Invite > Later)   0–100
 *   3. Distance     (closer = higher)            0–80
 *   4. Activity overlap (shared interests)       0–60
 *   5. Profile quality (photo + bio)             0–25
 *   6. Has photo                                 +15
 *   7. Recent activity (started session recently)+10
 */

// ─── Status score ────────────────────────────────────────────────────────────
function statusScore(session) {
  if (session.status === 'active' || session.status === 'live') return 100
  if (session.status === 'invite_out')  return 60
  if (session.status === 'scheduled')   return 30
  return 50 // unknown / online
}

// ─── Distance score ───────────────────────────────────────────────────────────
function distanceScore(distanceKm) {
  if (distanceKm == null) return 20 // no data — neutral
  if (distanceKm < 0.1)  return 80
  if (distanceKm < 0.25) return 72
  if (distanceKm < 0.5)  return 62
  if (distanceKm < 1)    return 50
  if (distanceKm < 2)    return 38
  if (distanceKm < 5)    return 22
  if (distanceKm < 10)   return 12
  return 5
}

// ─── Activity overlap score ───────────────────────────────────────────────────
function activityScore(session, mySession) {
  if (!mySession) return 0
  const mine   = new Set([
    ...(mySession.activities   ?? []),
    ...(mySession.activityType ? [mySession.activityType] : []),
  ])
  const theirs = [
    ...(session.activities   ?? []),
    ...(session.activityType ? [session.activityType] : []),
  ]
  if (mine.size === 0 || theirs.length === 0) return 0
  const matches = theirs.filter(a => mine.has(a)).length
  return Math.min(matches * 20, 60)
}

// ─── Profile quality score ────────────────────────────────────────────────────
function profileScore(session) {
  let s = 0
  if (session.photoURL || session.photos?.length) s += 15
  if (session.bio?.trim())                        s += 10
  return s
}

// ─── Recency score ────────────────────────────────────────────────────────────
// Reward sessions that started recently (fresh energy on the app)
function recencyScore(session) {
  if (!session.startedAtMs) return 0
  const minutesAgo = (Date.now() - session.startedAtMs) / 60000
  if (minutesAgo < 10)  return 10
  if (minutesAgo < 30)  return 7
  if (minutesAgo < 60)  return 4
  return 0
}

// ─── Main scorer ─────────────────────────────────────────────────────────────
/**
 * @param {object} session     — the profile to score
 * @param {object} mySession   — the current user's own session (for activity overlap)
 * @param {Set}    mutualSet   — Set of session IDs that are mutual interests
 * @returns {number}           — higher = more relevant
 */
export function scoreSession(session, mySession, mutualSet = new Set()) {
  const mutual   = mutualSet.has(session.id) ? 80 : 0
  const status   = statusScore(session)
  const distance = distanceScore(session.distanceKm)
  const activity = activityScore(session, mySession)
  const profile  = profileScore(session)
  const recency  = recencyScore(session)

  return mutual + status + distance + activity + profile + recency
}

/**
 * Sort a sessions array by relevance score, highest first.
 * Mutual interests always float to the top regardless of other signals.
 */
export function sortByRelevance(sessions, mySession, mutualSet = new Set()) {
  return [...sessions].sort((a, b) =>
    scoreSession(b, mySession, mutualSet) - scoreSession(a, mySession, mutualSet)
  )
}

/**
 * Debug helper — returns a breakdown for each factor.
 * Usage: console.table(explainScore(session, mySession, mutualSet))
 */
export function explainScore(session, mySession, mutualSet = new Set()) {
  return {
    displayName: session.displayName,
    mutual:      mutualSet.has(session.id) ? 80 : 0,
    status:      statusScore(session),
    distance:    distanceScore(session.distanceKm),
    activity:    activityScore(session, mySession),
    profile:     profileScore(session),
    recency:     recencyScore(session),
    total:       scoreSession(session, mySession, mutualSet),
  }
}
