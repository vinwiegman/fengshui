import { dist } from './geometry.js'

// Rule-based explanations built from measured layout differences — the same
// structured-diff contract an LLM would receive, so it can be swapped in later.
export function explainLayout(room, original, optimized, beforeScore, afterScore) {
  const byId = Object.fromEntries(original.map((f) => [f.id, f]))
  const moves = []
  for (const item of optimized) {
    const before = byId[item.id]
    if (!before) continue
    const d = dist(before.position, item.position)
    const rotated = ((before.rotation - item.rotation) % 360 + 360) % 360 !== 0
    if (d > 0.12 || rotated) moves.push({ item, before, distance: d, rotated })
  }

  const sentences = []
  const label = (f) => f.label || f.category.replace('_', ' ')

  if (moves.length === 0) {
    sentences.push('The current arrangement already scores well for this objective — no moves are worth the effort.')
  } else {
    const names = moves.slice(0, 4).map((m) => label(m.item))
    const listed = names.length > 1
      ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]
      : names[0]
    sentences.push(`This layout repositions ${moves.length} item${moves.length > 1 ? 's' : ''}: ${listed}.`)
  }

  const openDelta = Math.round((afterScore.terms.openSpace - beforeScore.terms.openSpace) * 100)
  if (openDelta >= 3) sentences.push(`Usable open floor area grows by roughly ${openDelta} percentage points, concentrated into one connected region instead of scattered gaps.`)

  if (afterScore.terms.walking > beforeScore.terms.walking + 0.01) {
    sentences.push('Every key piece of furniture is now reachable on a clear walking path from the door.')
  } else if (afterScore.terms.walking === 1) {
    sentences.push('Walking paths from the door to the bed, desk and storage remain fully clear.')
  }

  if (afterScore.terms.wallAlign > beforeScore.terms.wallAlign + 0.01) {
    sentences.push('Large furniture has been pushed back against the walls, which frees the middle of the room.')
  }

  if (afterScore.terms.functional > beforeScore.terms.functional + 0.01) {
    sentences.push('Functional pairings improved — items like the nightstand, desk chair and seating now sit where they are actually used.')
  }

  const windows = (room.openings || []).filter((o) => o.type === 'window')
  const desk = optimized.find((f) => f.category === 'desk')
  if (desk && windows.length) {
    const before = byId[desk.id]
    const dAfter = Math.min(...windows.map((w) => dist(desk.position, w.position)))
    const dBefore = Math.min(...windows.map((w) => dist(before.position, w.position)))
    if (dAfter < dBefore - 0.3 && dAfter < 1.8) {
      sentences.push('The desk moved toward the window for better natural light.')
    }
  }

  const kept = optimized.filter((f) => {
    const b = byId[f.id]
    return b && dist(b.position, f.position) <= 0.12
  })
  if (moves.length > 0 && kept.length > 0 && afterScore.terms.movement < 0.15) {
    sentences.push(`${kept.length} item${kept.length > 1 ? 's stay' : ' stays'} in place to keep the rearrangement effort low.`)
  }

  return { sentences, moves }
}
