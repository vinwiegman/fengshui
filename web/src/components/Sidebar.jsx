import React from 'react'
import { CATEGORIES, DEFAULT_ITEM_SIZES } from '../data/rooms.js'

const LockIcon = ({ locked }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    {locked
      ? <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      : <path d="M8 11V7a4 4 0 0 1 7.6-1.7" />}
  </svg>
)

export default function Sidebar({ furniture, selectedId, onSelect, onToggleMovable, onAdd, readOnly }) {
  return (
    <aside className="panel">
      <div className="panel-section">
        <div className="panel-title">Furniture · {furniture.length}</div>
        <div className="furn-list">
          {furniture.map((item) => (
            <button
              key={item.id}
              className={`furn-row${item.id === selectedId ? ' selected' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <span className="furn-swatch" style={{ background: CATEGORIES[item.category]?.color }} />
              <span className="furn-name">{item.label || CATEGORIES[item.category]?.label}</span>
              <span className="furn-dims">{item.width.toFixed(1)}×{item.depth.toFixed(1)}</span>
              {!readOnly && (
                <span
                  className="furn-lock"
                  title={item.movable ? 'Movable — click to fix in place' : 'Fixed — click to make movable'}
                  style={{ color: item.movable ? 'var(--ink-3)' : 'var(--warn)' }}
                  onClick={(e) => { e.stopPropagation(); onToggleMovable(item.id) }}
                >
                  <LockIcon locked={!item.movable} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {!readOnly && (
        <div className="panel-section">
          <div className="panel-title">Add furniture</div>
          <div className="palette">
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button key={key} className="palette-item" onClick={() => onAdd(key, DEFAULT_ITEM_SIZES[key])}>
                <span className="furn-swatch" style={{ background: cat.color }} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
