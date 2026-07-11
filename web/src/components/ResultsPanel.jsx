import React from 'react'
import FloorPlan from './FloorPlan.jsx'

const TERM_LABELS = {
  openSpace: 'Open space',
  walking: 'Walking paths',
  wallAlign: 'Wall alignment',
  functional: 'Function',
}

export default function ResultsPanel({
  scan, results, activeIndex, onView, onApply, showGhosts, onToggleGhosts, baseline,
}) {
  if (!results) return null
  const active = activeIndex != null ? results[activeIndex] : null

  return (
    <>
      <div className="panel-section">
        <div className="panel-title">Generated layouts</div>
        <div className="result-cards">
          {results.map((res, i) => {
            const deltaPct = baseline && baseline[res.key] && baseline[res.key].total !== 0
              ? Math.round(((res.score.total - baseline[res.key].total) / Math.abs(baseline[res.key].total)) * 100)
              : 0
            return (
              <button
                key={res.key}
                className={`result-card${i === activeIndex ? ' on' : ''}`}
                onClick={() => onView(i)}
              >
                <div className="result-thumb">
                  <FloorPlan room={scan.room} furniture={res.furniture} mini />
                </div>
                <div className="result-body">
                  <div className="result-head">
                    <h4>{res.name}</h4>
                    {deltaPct > 0 && <span className="result-delta">+{deltaPct}%</span>}
                  </div>
                  <div className="result-meta">
                    {res.moves.length === 0 ? 'No moves needed' : `${res.moves.length} item${res.moves.length > 1 ? 's' : ''} moved`} · all constraints satisfied
                  </div>
                  {i === activeIndex && (
                    <div className="term-bars">
                      {Object.entries(TERM_LABELS).map(([key, label]) => (
                        <div className="term-bar" key={key}>
                          <span>{label}</span>
                          <div className="bar"><div style={{ width: `${Math.round(res.score.terms[key] * 100)}%` }} /></div>
                          <span className="val">{Math.round(res.score.terms[key] * 100)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {active && (
        <div className="panel-section">
          <div className="compare-toggle">
            <button className={`btn${showGhosts ? '' : ' btn-ghost'}`} onClick={onToggleGhosts} style={{ flex: 1 }}>
              {showGhosts ? '✓ ' : ''}Show before / after
            </button>
          </div>
          <div className="explanation">
            <div className="exp-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 8h.01M12 12v4" />
              </svg>
              Why this layout works
            </div>
            {active.explanation.sentences.map((s, i) => <p key={i}>{s}</p>)}
          </div>
          <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 12 }} onClick={() => onApply(activeIndex)}>
            Apply this layout
          </button>
        </div>
      )}
    </>
  )
}
