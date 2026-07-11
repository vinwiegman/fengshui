import { footprint, rectsOverlap, rectInsidePolygon, doorClearanceRect } from './geometry.js'

// Hard constraints. A layout is only feasible when this returns an empty list.
export function checkConstraints(room, furniture) {
  const violations = []
  const rects = furniture.map((f) => ({ item: f, rect: footprint(f) }))

  for (const { item, rect } of rects) {
    if (!rectInsidePolygon(rect, room.boundary)) {
      violations.push({
        type: 'outside',
        itemId: item.id,
        message: `${item.label || item.category} extends outside the room`,
      })
    }
  }

  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      if (rectsOverlap(rects[i].rect, rects[j].rect)) {
        violations.push({
          type: 'overlap',
          itemId: rects[i].item.id,
          otherId: rects[j].item.id,
          message: `${rects[i].item.label || rects[i].item.category} overlaps ${rects[j].item.label || rects[j].item.category}`,
        })
      }
    }
  }

  for (const opening of room.openings || []) {
    if (opening.type !== 'door') continue
    const clearance = doorClearanceRect(opening, room.boundary)
    for (const { item, rect } of rects) {
      if (rectsOverlap(clearance, rect)) {
        violations.push({
          type: 'door',
          itemId: item.id,
          message: `${item.label || item.category} blocks the door`,
        })
      }
    }
  }

  return violations
}

export function isFeasible(room, furniture) {
  return checkConstraints(room, furniture).length === 0
}
