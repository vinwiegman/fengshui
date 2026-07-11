import React, { useRef, useState, useCallback } from 'react'
import { polygonBounds, footprint } from '../engine/geometry.js'
import { CATEGORIES } from '../data/rooms.js'

const SCALE = 120 // px per meter
const WALL = 0.14 // wall thickness in meters
const PAD = 0.45 // padding around the room in meters

function wallSideAt(position, bounds) {
  const [x, y] = position
  const d = [
    ['top', Math.abs(y - bounds.minY)],
    ['bottom', Math.abs(bounds.maxY - y)],
    ['left', Math.abs(x - bounds.minX)],
    ['right', Math.abs(bounds.maxX - x)],
  ]
  d.sort((a, b) => a[1] - b[1])
  return d[0][0]
}

function Opening({ opening, bounds }) {
  const side = wallSideAt(opening.position, bounds)
  const [x, y] = opening.position
  const w = opening.width
  const horizontal = side === 'top' || side === 'bottom'
  const t = WALL + 0.02

  if (opening.type === 'window') {
    return (
      <g>
        <rect
          x={(horizontal ? x - w / 2 : x - t / 2) * SCALE}
          y={(horizontal ? y - t / 2 : y - w / 2) * SCALE}
          width={(horizontal ? w : t) * SCALE}
          height={(horizontal ? t : w) * SCALE}
          fill="#fff"
        />
        <line
          x1={(horizontal ? x - w / 2 : x) * SCALE}
          y1={(horizontal ? y : y - w / 2) * SCALE}
          x2={(horizontal ? x + w / 2 : x) * SCALE}
          y2={(horizontal ? y : y + w / 2) * SCALE}
          stroke="#8fb4d9"
          strokeWidth={4}
        />
      </g>
    )
  }

  // Door: gap in the wall plus a swing arc into the room.
  const inward = side === 'top' ? [0, 1] : side === 'bottom' ? [0, -1] : side === 'left' ? [1, 0] : [-1, 0]
  const along = horizontal ? [1, 0] : [0, 1]
  const hx = x - (along[0] * w) / 2
  const hy = y - (along[1] * w) / 2
  const tipX = hx + along[0] * 0 + inward[0] * w
  const tipY = hy + along[1] * 0 + inward[1] * w
  const endX = hx + along[0] * w
  const endY = hy + along[1] * w
  const sweep = inward[0] * along[1] - inward[1] * along[0] > 0 ? 0 : 1

  return (
    <g>
      <rect
        x={(horizontal ? x - w / 2 : x - t / 2) * SCALE}
        y={(horizontal ? y - t / 2 : y - w / 2) * SCALE}
        width={(horizontal ? w : t) * SCALE}
        height={(horizontal ? t : w) * SCALE}
        fill="#fff"
      />
      <path
        d={`M ${endX * SCALE} ${endY * SCALE} A ${w * SCALE} ${w * SCALE} 0 0 ${sweep} ${tipX * SCALE} ${tipY * SCALE}`}
        fill="none"
        stroke="#c4beb2"
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      <line
        x1={hx * SCALE} y1={hy * SCALE}
        x2={tipX * SCALE} y2={tipY * SCALE}
        stroke="#8a8478"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </g>
  )
}

function FurnitureShape({ item, selected, violating, ghost, interactive, dragging, onPointerDown }) {
  const color = CATEGORIES[item.category]?.color || '#999'
  const [cx, cy] = item.position
  const w = item.width * SCALE
  const d = item.depth * SCALE
  const rot = ((item.rotation % 360) + 360) % 360
  const labelFlip = rot === 90 || rot === 270 ? -rot : -rot

  return (
    <g
      className={`furniture-item${dragging ? ' dragging' : ''}${item.movable ? '' : ' fixed'}`}
      transform={`translate(${cx * SCALE} ${cy * SCALE}) rotate(${rot})`}
      onPointerDown={interactive ? (e) => onPointerDown(e, item) : undefined}
      opacity={ghost ? 0.32 : 1}
      style={{ transition: dragging ? 'none' : 'opacity 150ms' }}
    >
      <rect
        x={-w / 2} y={-d / 2} width={w} height={d}
        rx={Math.min(9, w / 5, d / 5)}
        fill={ghost ? 'none' : color}
        fillOpacity={ghost ? 0 : 0.88}
        stroke={violating ? '#b3261e' : selected ? '#4f46e5' : ghost ? '#a29c90' : 'rgba(0,0,0,0.28)'}
        strokeWidth={violating || selected ? 2.5 : 1.2}
        strokeDasharray={ghost ? '5 4' : 'none'}
      />
      {!ghost && (
        <line
          x1={-w / 2 + 5} y1={d / 2 - 4} x2={w / 2 - 5} y2={d / 2 - 4}
          stroke="rgba(255,255,255,0.55)" strokeWidth={2} strokeLinecap="round"
        />
      )}
      {!ghost && w > 42 && d > 26 && (
        <g transform={`rotate(${labelFlip})`}>
          <text
            textAnchor="middle" dominantBaseline="central"
            fontSize={Math.min(12, w / 6)}
            fontWeight={600} fill="#fff"
            style={{ pointerEvents: 'none', userSelect: 'none', letterSpacing: '0.01em' }}
          >
            {item.label || CATEGORIES[item.category]?.label}
          </text>
        </g>
      )}
      {!item.movable && !ghost && (
        <g transform={`rotate(${labelFlip}) translate(${0} ${-d / 2 + 11})`}>
          <text textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.8)" style={{ pointerEvents: 'none' }}>fixed</text>
        </g>
      )}
    </g>
  )
}

function MoveArrow({ from, to }) {
  const [x1, y1] = from.map((v) => v * SCALE)
  const [x2, y2] = to.map((v) => v * SCALE)
  const mx = (x1 + x2) / 2 - (y2 - y1) * 0.18
  const my = (y1 + y2) / 2 + (x2 - x1) * 0.18
  return (
    <g style={{ pointerEvents: 'none' }}>
      <path
        d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
        fill="none" stroke="#4f46e5" strokeWidth={2.5}
        strokeDasharray="2 6" strokeLinecap="round" opacity={0.85}
        markerEnd="url(#arrowhead)"
      />
    </g>
  )
}

export default function FloorPlan({
  room, furniture, selectedId, onSelect, onMoveItem,
  violatingIds = new Set(), ghosts = null, arrows = null, mini = false,
}) {
  const svgRef = useRef(null)
  const [dragId, setDragId] = useState(null)
  const dragState = useRef(null)

  const bounds = polygonBounds(room.boundary)
  const vb = {
    x: (bounds.minX - PAD) * SCALE,
    y: (bounds.minY - PAD) * SCALE,
    w: (bounds.maxX - bounds.minX + PAD * 2) * SCALE,
    h: (bounds.maxY - bounds.minY + PAD * 2) * SCALE,
  }

  const toModel = useCallback((e) => {
    const svg = svgRef.current
    const pt = new DOMPoint(e.clientX, e.clientY)
    const p = pt.matrixTransform(svg.getScreenCTM().inverse())
    return [p.x / SCALE, p.y / SCALE]
  }, [])

  const handlePointerDown = useCallback((e, item) => {
    e.stopPropagation()
    onSelect?.(item.id)
    if (!item.movable) return
    const [mx, my] = toModel(e)
    dragState.current = { id: item.id, dx: mx - item.position[0], dy: my - item.position[1] }
    setDragId(item.id)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }, [onSelect, toModel])

  const handlePointerMove = useCallback((e) => {
    const s = dragState.current
    if (!s) return
    const [mx, my] = toModel(e)
    const snap = (v) => Math.round((v) / 0.05) * 0.05
    onMoveItem?.(s.id, [snap(mx - s.dx), snap(my - s.dy)])
  }, [onMoveItem, toModel])

  const handlePointerUp = useCallback(() => {
    dragState.current = null
    setDragId(null)
  }, [])

  const boundaryPoints = room.boundary.map(([x, y]) => `${x * SCALE},${y * SCALE}`).join(' ')
  const interactive = !mini && !!onMoveItem

  return (
    <svg
      ref={svgRef}
      className="floorplan-svg"
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerUp={interactive ? handlePointerUp : undefined}
      onPointerDown={interactive ? () => onSelect?.(null) : undefined}
    >
      <defs>
        <marker id="arrowhead" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
          <path d="M 0.5 0.5 L 6 3.5 L 0.5 6.5 z" fill="#4f46e5" />
        </marker>
        <pattern id="floorgrid" width={0.5 * SCALE} height={0.5 * SCALE} patternUnits="userSpaceOnUse">
          <path d={`M ${0.5 * SCALE} 0 L 0 0 0 ${0.5 * SCALE}`} fill="none" stroke="rgba(30,25,15,0.05)" strokeWidth="1" />
        </pattern>
      </defs>

      {/* floor */}
      <polygon points={boundaryPoints} fill="#fdfcfa" />
      <polygon points={boundaryPoints} fill="url(#floorgrid)" />
      {/* walls */}
      <polygon
        points={boundaryPoints}
        fill="none" stroke="#2b2925"
        strokeWidth={WALL * SCALE}
        strokeLinejoin="miter"
      />

      {(room.openings || []).map((o) => (
        <Opening key={o.id} opening={o} bounds={bounds} />
      ))}

      {/* ghosts of the original layout (comparison mode) */}
      {ghosts?.map((item) => (
        <FurnitureShape key={`ghost-${item.id}`} item={item} ghost />
      ))}

      {furniture.map((item) => (
        <FurnitureShape
          key={item.id}
          item={item}
          selected={item.id === selectedId}
          violating={violatingIds.has(item.id)}
          dragging={item.id === dragId}
          interactive={interactive}
          onPointerDown={handlePointerDown}
        />
      ))}

      {arrows?.map((a, i) => (
        <MoveArrow key={i} from={a.from} to={a.to} />
      ))}
    </svg>
  )
}
