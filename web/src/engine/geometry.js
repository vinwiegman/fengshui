// All coordinates are in meters. Rotations are restricted to 0/90/180/270.

export function footprint(item) {
  const r = ((item.rotation % 360) + 360) % 360
  const swap = r === 90 || r === 270
  const w = swap ? item.depth : item.width
  const h = swap ? item.width : item.depth
  return { x: item.position[0] - w / 2, y: item.position[1] - h / 2, w, h }
}

export function rectsOverlap(a, b, eps = 0.004) {
  return (
    a.x + eps < b.x + b.w &&
    b.x + eps < a.x + a.w &&
    a.y + eps < b.y + b.h &&
    b.y + eps < a.y + a.h
  )
}

export function pointInPolygon(px, py, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

// Sample a 3x3 grid of points over the rect; all must lie inside the polygon.
export function rectInsidePolygon(rect, poly) {
  for (let i = 0; i <= 2; i++) {
    for (let j = 0; j <= 2; j++) {
      const px = rect.x + (rect.w * i) / 2
      const py = rect.y + (rect.h * j) / 2
      if (!pointInPolygon(px, py, poly)) return false
    }
  }
  return true
}

export function polygonBounds(poly) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of poly) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return { minX, minY, maxX, maxY }
}

export const CELL = 0.1 // occupancy-grid resolution in meters

// Boolean occupancy mask of the room interior at CELL resolution.
export function buildRoomMask(boundary) {
  const b = polygonBounds(boundary)
  const cols = Math.max(1, Math.round((b.maxX - b.minX) / CELL))
  const rows = Math.max(1, Math.round((b.maxY - b.minY) / CELL))
  const mask = new Uint8Array(cols * rows)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = b.minX + (c + 0.5) * CELL
      const py = b.minY + (r + 0.5) * CELL
      if (pointInPolygon(px, py, boundary)) mask[r * cols + c] = 1
    }
  }
  return { mask, cols, rows, minX: b.minX, minY: b.minY }
}

// Mark cells covered by furniture footprints on top of the room mask.
// Returns Uint8Array: 0 = outside room, 1 = free floor, 2 = occupied.
export function rasterize(grid, rects) {
  const occ = Uint8Array.from(grid.mask)
  for (const rect of rects) {
    const c0 = Math.max(0, Math.floor((rect.x - grid.minX) / CELL))
    const c1 = Math.min(grid.cols - 1, Math.ceil((rect.x + rect.w - grid.minX) / CELL) - 1)
    const r0 = Math.max(0, Math.floor((rect.y - grid.minY) / CELL))
    const r1 = Math.min(grid.rows - 1, Math.ceil((rect.y + rect.h - grid.minY) / CELL) - 1)
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (occ[r * grid.cols + c] === 1) occ[r * grid.cols + c] = 2
      }
    }
  }
  return occ
}

// The rectangle a door needs to stay clear, extending into the room.
export function doorClearanceRect(opening, boundary) {
  const depth = Math.max(opening.width, 0.8)
  const [x, y] = opening.position
  const b = polygonBounds(boundary)
  // Determine inward direction from which wall the door sits on.
  const dLeft = Math.abs(x - b.minX)
  const dRight = Math.abs(b.maxX - x)
  const dTop = Math.abs(y - b.minY)
  const dBottom = Math.abs(b.maxY - y)
  const min = Math.min(dLeft, dRight, dTop, dBottom)
  if (min === dTop) return { x: x - opening.width / 2, y, w: opening.width, h: depth }
  if (min === dBottom) return { x: x - opening.width / 2, y: y - depth, w: opening.width, h: depth }
  if (min === dLeft) return { x, y: y - opening.width / 2, w: depth, h: opening.width }
  return { x: x - depth, y: y - opening.width / 2, w: depth, h: opening.width }
}

// Rect in front of an item's "front" edge (front = +depth direction after rotation).
export function frontClearanceRect(item, depth = 0.6) {
  const r = ((item.rotation % 360) + 360) % 360
  const [x, y] = item.position
  if (r === 0) return { x: x - item.width / 2, y: y + item.depth / 2, w: item.width, h: depth }
  if (r === 180) return { x: x - item.width / 2, y: y - item.depth / 2 - depth, w: item.width, h: depth }
  if (r === 90) return { x: x - item.depth / 2 - depth, y: y - item.width / 2, w: depth, h: item.width }
  return { x: x + item.depth / 2, y: y - item.width / 2, w: depth, h: item.width }
}

export function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}
