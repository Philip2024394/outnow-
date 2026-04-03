/**
 * Prevents map markers from overlapping by spreading any that are too close
 * into a horizontal row, centered on their group's midpoint.
 *
 * Uses connected-component grouping so chains of close markers are all
 * spread together, not just pairwise.
 *
 * @param {Array}  items        - array of session/venue objects
 * @param {string} latKey       - key holding latitude  (e.g. 'lat' or 'fuzzedLat')
 * @param {string} lngKey       - key holding longitude (e.g. 'lng' or 'fuzzedLng')
 * @param {number} thresholdDeg - center-to-center distance (degrees) that counts as overlapping
 * @param {number} spacingDeg   - horizontal gap (degrees) between spread marker centres
 * @returns {Array} new array with adjusted lat/lng — originals are NOT mutated
 */
export function spreadMarkers(
  items,
  latKey      = 'lat',
  lngKey      = 'lng',
  thresholdDeg = 0.005,
  spacingDeg   = 0.0055,
) {
  if (!items || items.length <= 1) return items ?? []

  const n = items.length

  // Build overlap adjacency
  const overlaps = Array.from({ length: n }, () => new Set())
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dlat = Math.abs(items[i][latKey] - items[j][latKey])
      const dlng = Math.abs(items[i][lngKey] - items[j][lngKey])
      if (dlat < thresholdDeg && dlng < thresholdDeg) {
        overlaps[i].add(j)
        overlaps[j].add(i)
      }
    }
  }

  // Connected components via BFS
  const visited = new Set()
  const groups  = []
  for (let i = 0; i < n; i++) {
    if (visited.has(i)) continue
    const group = []
    const queue = [i]
    visited.add(i)
    while (queue.length) {
      const curr = queue.shift()
      group.push(curr)
      for (const nb of overlaps[curr]) {
        if (!visited.has(nb)) { visited.add(nb); queue.push(nb) }
      }
    }
    groups.push(group)
  }

  // Clone and apply offsets
  const result = items.map(item => ({ ...item }))
  for (const group of groups) {
    if (group.length <= 1) continue

    // Centre of mass
    const cLat = group.reduce((s, i) => s + items[i][latKey], 0) / group.length
    const cLng = group.reduce((s, i) => s + items[i][lngKey], 0) / group.length

    // Lay out in a horizontal row centred on (cLat, cLng)
    const half = (group.length - 1) * spacingDeg / 2
    group.forEach((idx, pos) => {
      result[idx][latKey] = cLat
      result[idx][lngKey] = cLng - half + pos * spacingDeg
    })
  }

  return result
}
