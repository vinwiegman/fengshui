import {
  footprint, rasterize, rectsOverlap, frontClearanceRect,
  rectInsidePolygon, pointInPolygon, dist, CELL,
} from './geometry.js'

const LARGE = new Set(['bed', 'wardrobe', 'sofa', 'desk', 'bookshelf', 'dresser', 'tv_stand'])
const KEY_DESTINATIONS = new Set(['bed', 'desk', 'wardrobe', 'sofa', 'dresser', 'bookshelf'])

// ---- Term: open space -------------------------------------------------------
// Rewards free floor area, weighted toward one large connected region.
function openSpaceScore(grid, occ) {
  let free = 0
  let floor = 0
  for (let i = 0; i < occ.length; i++) {
    if (occ[i] >= 1) floor++
    if (occ[i] === 1) free++
  }
  if (floor === 0) return 0
  const largest = largestFreeRegion(grid, occ)
  return 0.5 * (free / floor) + 0.5 * (largest / floor)
}

function largestFreeRegion(grid, occ) {
  const seen = new Uint8Array(occ.length)
  const stack = []
  let best = 0
  for (let start = 0; start < occ.length; start++) {
    if (occ[start] !== 1 || seen[start]) continue
    let size = 0
    stack.push(start)
    seen[start] = 1
    while (stack.length) {
      const idx = stack.pop()
      size++
      const r = Math.floor(idx / grid.cols)
      const c = idx % grid.cols
      const neighbors = [
        r > 0 ? idx - grid.cols : -1,
        r < grid.rows - 1 ? idx + grid.cols : -1,
        c > 0 ? idx - 1 : -1,
        c < grid.cols - 1 ? idx + 1 : -1,
      ]
      for (const n of neighbors) {
        if (n >= 0 && occ[n] === 1 && !seen[n]) {
          seen[n] = 1
          stack.push(n)
        }
      }
    }
    if (size > best) best = size
  }
  return best
}

// ---- Term: walking paths ----------------------------------------------------
// BFS over free cells from the door; every key furniture item must be
// reachable at a cell adjacent to its footprint.
function walkingScore(grid, occ, room, furniture) {
  const door = (room.openings || []).find((o) => o.type === 'door')
  if (!door) return 1
  const startC = Math.min(grid.cols - 1, Math.max(0, Math.floor((door.position[0] - grid.minX) / CELL)))
  const startR = Math.min(grid.rows - 1, Math.max(0, Math.floor((door.position[1] - grid.minY) / CELL)))
  const start = nearestFreeCell(grid, occ, startR, startC)
  if (start < 0) return 0

  const reach = new Uint8Array(occ.length)
  const queue = [start]
  reach[start] = 1
  let head = 0
  while (head < queue.length) {
    const idx = queue[head++]
    const r = Math.floor(idx / grid.cols)
    const c = idx % grid.cols
    const neighbors = [
      r > 0 ? idx - grid.cols : -1,
      r < grid.rows - 1 ? idx + grid.cols : -1,
      c > 0 ? idx - 1 : -1,
      c < grid.cols - 1 ? idx + 1 : -1,
    ]
    for (const n of neighbors) {
      if (n >= 0 && occ[n] === 1 && !reach[n]) {
        reach[n] = 1
        queue.push(n)
      }
    }
  }

  const targets = furniture.filter((f) => KEY_DESTINATIONS.has(f.category))
  if (targets.length === 0) return 1
  let reachable = 0
  for (const item of targets) {
    if (itemIsReachable(grid, occ, reach, footprint(item))) reachable++
  }
  return reachable / targets.length
}

function nearestFreeCell(grid, occ, r0, c0) {
  for (let radius = 0; radius < Math.max(grid.rows, grid.cols); radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const r = r0 + dr
        const c = c0 + dc
        if (r >= 0 && r < grid.rows && c >= 0 && c < grid.cols && occ[r * grid.cols + c] === 1) {
          return r * grid.cols + c
        }
      }
    }
  }
  return -1
}

function itemIsReachable(grid, occ, reach, rect) {
  const c0 = Math.max(0, Math.floor((rect.x - grid.minX) / CELL) - 1)
  const c1 = Math.min(grid.cols - 1, Math.ceil((rect.x + rect.w - grid.minX) / CELL))
  const r0 = Math.max(0, Math.floor((rect.y - grid.minY) / CELL) - 1)
  const r1 = Math.min(grid.rows - 1, Math.ceil((rect.y + rect.h - grid.minY) / CELL))
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (reach[r * grid.cols + c]) return true
    }
  }
  return false
}

// ---- Term: wall alignment ---------------------------------------------------
// Large furniture should have its back against a wall: sample points just
// beyond each side; a side "hugs" a wall when those points leave the room.
function wallAlignScore(room, furniture) {
  const large = furniture.filter((f) => LARGE.has(f.category))
  if (large.length === 0) return 1
  let aligned = 0
  for (const item of large) {
    const rect = footprint(item)
    const gap = 0.18
    const sides = [
      [[rect.x + rect.w / 2, rect.y - gap]],
      [[rect.x + rect.w / 2, rect.y + rect.h + gap]],
      [[rect.x - gap, rect.y + rect.h / 2]],
      [[rect.x + rect.w + gap, rect.y + rect.h / 2]],
    ]
    const hugsWall = sides.some((pts) => pts.every(([px, py]) => !pointInPolygon(px, py, room.boundary)))
    if (hugsWall) aligned++
  }
  return aligned / large.length
}

// ---- Term: functional relations ---------------------------------------------
const RELATION_RULES = [
  { a: 'nightstand', b: 'bed', maxDist: 1.2, label: 'nightstand beside bed' },
  { a: 'chair', b: 'desk', maxDist: 1.0, label: 'chair at desk' },
  { a: 'coffee_table', b: 'sofa', maxDist: 1.4, label: 'coffee table by sofa' },
  { a: 'tv_stand', b: 'sofa', maxDist: 4.0, minDist: 1.5, label: 'TV visible from sofa' },
]

function functionalScore(room, furniture) {
  const byCat = {}
  for (const f of furniture) (byCat[f.category] ||= []).push(f)
  let total = 0
  let satisfied = 0

  for (const rule of RELATION_RULES) {
    for (const a of byCat[rule.a] || []) {
      const partners = byCat[rule.b] || []
      if (partners.length === 0) continue
      total++
      const d = Math.min(...partners.map((b) => dist(a.position, b.position)))
      if (d <= rule.maxDist && (!rule.minDist || d >= rule.minDist)) satisfied++
    }
  }

  // Desk near a window (natural light).
  const windows = (room.openings || []).filter((o) => o.type === 'window')
  for (const desk of byCat.desk || []) {
    if (windows.length === 0) continue
    total++
    const d = Math.min(...windows.map((w) => dist(desk.position, w.position)))
    if (d <= 1.6) satisfied++
  }

  // Wardrobe / bookshelf / dresser fronts must stay usable.
  const others = furniture
  for (const item of furniture) {
    if (!['wardrobe', 'bookshelf', 'dresser'].includes(item.category)) continue
    total++
    const front = frontClearanceRect(item, 0.6)
    const blocked = others.some((o) => o.id !== item.id && rectsOverlap(front, footprint(o)))
    const inRoom = rectInsidePolygon(front, room.boundary)
    if (!blocked && inRoom) satisfied++
  }

  return total === 0 ? 1 : satisfied / total
}

// ---- Term: movement cost ----------------------------------------------------
function movementCost(original, furniture, roomDiag) {
  let cost = 0
  const byId = Object.fromEntries(original.map((f) => [f.id, f]))
  for (const f of furniture) {
    const before = byId[f.id]
    if (!before) continue
    cost += dist(before.position, f.position) / roomDiag
    if (((before.rotation - f.rotation) % 360 + 360) % 360 !== 0) cost += 0.08
  }
  return Math.min(1, cost)
}

// ---- Combined score ---------------------------------------------------------
export const OBJECTIVE_PRESETS = {
  minimal: {
    name: 'Minimal changes',
    tagline: 'Improve the room while moving as little as possible',
    weights: { openSpace: 0.6, walking: 0.8, wallAlign: 0.4, functional: 0.6, movement: 2.2 },
  },
  space: {
    name: 'Maximum open space',
    tagline: 'Free up the largest connected floor area',
    weights: { openSpace: 2.4, walking: 0.8, wallAlign: 0.8, functional: 0.4, movement: 0.1 },
  },
  functional: {
    name: 'Best functional layout',
    tagline: 'Optimize how the room works day to day',
    weights: { openSpace: 0.8, walking: 1.2, wallAlign: 0.8, functional: 2.2, movement: 0.15 },
  },
}

export function scoreLayout(room, grid, furniture, weights, original) {
  const rects = furniture.map(footprint)
  const occ = rasterize(grid, rects)
  const roomDiag = Math.hypot(
    grid.cols * CELL,
    grid.rows * CELL,
  )
  const terms = {
    openSpace: openSpaceScore(grid, occ),
    walking: walkingScore(grid, occ, room, furniture),
    wallAlign: wallAlignScore(room, furniture),
    functional: functionalScore(room, furniture),
    movement: original ? movementCost(original, furniture, roomDiag) : 0,
  }
  const total =
    weights.openSpace * terms.openSpace +
    weights.walking * terms.walking +
    weights.wallAlign * terms.wallAlign +
    weights.functional * terms.functional -
    weights.movement * terms.movement
  return { total, terms }
}
