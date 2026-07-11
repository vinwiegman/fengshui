import React from 'react'
import { CATEGORIES } from '../data/rooms.js'

export default function Inspector({ item, onUpdate, onRotate, onDelete }) {
  if (!item) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
            <path d="M9 21V12h6v9" />
          </svg>
        </div>
        <p>Select a piece of furniture on the plan to edit its size, category and constraints.</p>
      </div>
    )
  }

  const cat = CATEGORIES[item.category]

  return (
    <div className="panel-section">
      <div className="inspector-header">
        <span className="inspector-swatch" style={{ background: cat?.color }} />
        <div>
          <div className="inspector-title">{item.label || cat?.label}</div>
          <div className="inspector-sub">
            {item.position[0].toFixed(2)} m, {item.position[1].toFixed(2)} m · {item.rotation}°
          </div>
        </div>
      </div>

      <div className="field" style={{ marginBottom: 10 }}>
        <label>Category</label>
        <select
          value={item.category}
          onChange={(e) => onUpdate(item.id, { category: e.target.value })}
        >
          {Object.entries(CATEGORIES).map(([key, c]) => (
            <option key={key} value={key}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="field-grid" style={{ marginBottom: 10 }}>
        <div className="field">
          <label>Width (m)</label>
          <input
            type="number" step="0.05" min="0.2" max="5"
            value={item.width}
            onChange={(e) => onUpdate(item.id, { width: Math.max(0.2, parseFloat(e.target.value) || 0.2) })}
          />
        </div>
        <div className="field">
          <label>Depth (m)</label>
          <input
            type="number" step="0.05" min="0.2" max="5"
            value={item.depth}
            onChange={(e) => onUpdate(item.id, { depth: Math.max(0.2, parseFloat(e.target.value) || 0.2) })}
          />
        </div>
      </div>

      <div className="field" style={{ marginBottom: 10 }}>
        <label>During optimization</label>
        <div className="seg">
          <button className={item.movable ? 'on' : ''} onClick={() => onUpdate(item.id, { movable: true })}>Movable</button>
          <button className={!item.movable ? 'on' : ''} onClick={() => onUpdate(item.id, { movable: false })}>Fixed</button>
        </div>
      </div>

      <div className="row-2">
        <button className="btn" onClick={() => onRotate(item.id)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v6h-6" />
          </svg>
          Rotate 90°
        </button>
        <button className="btn btn-danger" onClick={() => onDelete(item.id)}>Delete</button>
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 12 }}>
        Tip: press <b>R</b> to rotate, <b>Delete</b> to remove the selected item.
      </p>
    </div>
  )
}
