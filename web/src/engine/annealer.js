import { buildRoomMask, polygonBounds } from './geometry.js'
import { isFeasible } from './constraints.js'
import { scoreLayout } from './objectives.js'

function cloneFurniture(furniture) {
  return furniture.map((f) => ({ ...f, position: [...f.position] }))
}

function randomGaussian() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const snap = (v) => Math.round(v / 0.05) * 0.05

// Simulated annealing over positions + 90° rotations of movable furniture.
// Hard constraints are never traded away: infeasible proposals are rejected.
export async function optimizeLayout({ room, furniture, weights, iterations = 9000, onProgress }) {
  const grid = buildRoomMask(room.boundary)
  const bounds = polygonBounds(room.boundary)
  const original = cloneFurniture(furniture)
  const movable = furniture.map((f, i) => (f.movable ? i : -1)).filter((i) => i >= 0)

  let current = cloneFurniture(furniture)
  let currentScore = scoreLayout(room, grid, current, weights, original)
  let best = cloneFurniture(current)
  let bestScore = currentScore

  if (movable.length === 0) return { furniture: best, score: bestScore, original }

  const T0 = 0.28
  const CHUNK = 400

  for (let iter = 0; iter < iterations; iter++) {
    const T = T0 * Math.pow(0.001 / T0, iter / iterations) // geometric cooling
    const idx = movable[Math.floor(Math.random() * movable.length)]
    const item = current[idx]
    const prev = { position: [...item.position], rotation: item.rotation }

    const move = Math.random()
    if (move < 0.55) {
      const sigma = 0.15 + 1.1 * (T / T0)
      item.position = [
        snap(item.position[0] + randomGaussian() * sigma),
        snap(item.position[1] + randomGaussian() * sigma),
      ]
    } else if (move < 0.75) {
      item.rotation = (item.rotation + (Math.random() < 0.5 ? 90 : 270)) % 360
    } else {
      // Teleport: jump anywhere in the room to escape local optima.
      item.position = [
        snap(bounds.minX + Math.random() * (bounds.maxX - bounds.minX)),
        snap(bounds.minY + Math.random() * (bounds.maxY - bounds.minY)),
      ]
      if (Math.random() < 0.5) item.rotation = (item.rotation + 90) % 360
    }

    if (!isFeasible(room, current)) {
      item.position = prev.position
      item.rotation = prev.rotation
      continue
    }

    const nextScore = scoreLayout(room, grid, current, weights, original)
    const delta = nextScore.total - currentScore.total
    if (delta >= 0 || Math.random() < Math.exp(delta / T)) {
      currentScore = nextScore
      if (nextScore.total > bestScore.total) {
        bestScore = nextScore
        best = cloneFurniture(current)
      }
    } else {
      item.position = prev.position
      item.rotation = prev.rotation
    }

    if (iter % CHUNK === 0) {
      onProgress?.(iter / iterations)
      await new Promise((resolve) => setTimeout(resolve, 0)) // keep UI responsive
    }
  }

  onProgress?.(1)
  return { furniture: best, score: bestScore, original }
}
