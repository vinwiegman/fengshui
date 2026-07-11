import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import FloorPlan from './components/FloorPlan.jsx'
import Sidebar from './components/Sidebar.jsx'
import Inspector from './components/Inspector.jsx'
import ResultsPanel from './components/ResultsPanel.jsx'
import { SAMPLE_ROOMS, CATEGORIES } from './data/rooms.js'
import { checkConstraints } from './engine/constraints.js'
import { buildRoomMask, dist } from './engine/geometry.js'
import { scoreLayout, OBJECTIVE_PRESETS } from './engine/objectives.js'
import { optimizeLayout } from './engine/annealer.js'
import { explainLayout } from './engine/explain.js'

const deepClone = (v) => JSON.parse(JSON.stringify(v))
const EQUAL_WEIGHTS = { openSpace: 1, walking: 1, wallAlign: 1, functional: 1, movement: 0 }

function loadScan(sample) {
  const s = deepClone(sample)
  return { id: s.id, name: s.name, purpose: s.purpose, room: { ...s.room, openings: s.openings }, furniture: s.furniture }
}

export default function App() {
  const [roomIdx, setRoomIdx] = useState(0)
  const [scan, setScan] = useState(() => loadScan(SAMPLE_ROOMS[0]))
  const [furniture, setFurniture] = useState(scan.furniture)
  const [selectedId, setSelectedId] = useState(null)
  const [step, setStep] = useState('edit')
  const [enabled, setEnabled] = useState({ minimal: true, space: true, functional: true })
  const [progress, setProgress] = useState(null)
  const [results, setResults] = useState(null)
  const [baseline, setBaseline] = useState(null)
  const [activeResult, setActiveResult] = useState(null)
  const [showGhosts, setShowGhosts] = useState(true)
  const [initialScore, setInitialScore] = useState(null)
  const fileRef = useRef(null)
  const idCounter = useRef(1000)

  const grid = useMemo(() => buildRoomMask(scan.room.boundary), [scan])
  const violations = useMemo(() => checkConstraints(scan.room, furniture), [scan, furniture])
  const violatingIds = useMemo(() => new Set(violations.map((v) => v.itemId)), [violations])

  const currentScore = useMemo(() => {
    const s = scoreLayout(scan.room, grid, furniture, EQUAL_WEIGHTS)
    return Math.round((s.total / 4) * 100)
  }, [scan, grid, furniture])

  useEffect(() => {
    if (initialScore === null) setInitialScore(currentScore)
  }, [initialScore, currentScore])

  const selectRoom = useCallback((idx) => {
    const next = loadScan(SAMPLE_ROOMS[idx])
    setRoomIdx(idx)
    setScan(next)
    setFurniture(next.furniture)
    setSelectedId(null)
    setResults(null)
    setActiveResult(null)
    setStep('edit')
    setInitialScore(null)
    setProgress(null)
  }, [])

  const moveItem = useCallback((id, position) => {
    setFurniture((fs) => fs.map((f) => (f.id === id ? { ...f, position } : f)))
  }, [])

  const updateItem = useCallback((id, patch) => {
    setFurniture((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }, [])

  const rotateItem = useCallback((id) => {
    setFurniture((fs) => fs.map((f) => (f.id === id ? { ...f, rotation: (f.rotation + 90) % 360 } : f)))
  }, [])

  const deleteItem = useCallback((id) => {
    setFurniture((fs) => fs.filter((f) => f.id !== id))
    setSelectedId((s) => (s === id ? null : s))
  }, [])

  const addItem = useCallback((category, size = [1, 0.6]) => {
    const id = `${category}_${idCounter.current++}`
    const cx = (grid.minX * 2 + grid.cols * 0.1) / 2
    const cy = (grid.minY * 2 + grid.rows * 0.1) / 2
    setFurniture((fs) => [...fs, {
      id, category, label: CATEGORIES[category]?.label,
      position: [Math.round(cx * 20) / 20, Math.round(cy * 20) / 20],
      width: size[0], depth: size[1], rotation: 0, movable: true,
    }])
    setSelectedId(id)
    setStep('edit')
  }, [grid])

  const toggleMovable = useCallback((id) => {
    setFurniture((fs) => fs.map((f) => (f.id === id ? { ...f, movable: !f.movable } : f)))
  }, [])

  // Keyboard shortcuts: R rotates, Delete removes.
  useEffect(() => {
    const onKey = (e) => {
      if (step !== 'edit' || !selectedId) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
      if (e.key === 'r' || e.key === 'R') rotateItem(selectedId)
      if (e.key === 'Delete' || e.key === 'Backspace') deleteItem(selectedId)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, selectedId, rotateItem, deleteItem])

  const runOptimize = useCallback(async () => {
    const presets = Object.entries(OBJECTIVE_PRESETS).filter(([key]) => enabled[key])
    if (presets.length === 0) return
    setProgress(0)
    setResults(null)
    setActiveResult(null)
    const original = deepClone(furniture)
    const out = []
    const base = {}
    for (let i = 0; i < presets.length; i++) {
      const [key, preset] = presets[i]
      base[key] = scoreLayout(scan.room, grid, original, preset.weights, original)
      const { furniture: optimized, score } = await optimizeLayout({
        room: scan.room,
        furniture: deepClone(original),
        weights: preset.weights,
        iterations: 6500,
        onProgress: (p) => setProgress((i + p) / presets.length),
      })
      const explanation = explainLayout(scan.room, original, optimized, base[key], score)
      out.push({ key, name: preset.name, furniture: optimized, score, explanation, moves: explanation.moves, original })
    }
    setBaseline(base)
    setResults(out)
    setActiveResult(0)
    setProgress(null)
    setStep('results')
  }, [enabled, furniture, scan, grid])

  const applyResult = useCallback((idx) => {
    setFurniture(deepClone(results[idx].furniture))
    setStep('edit')
    setSelectedId(null)
  }, [results])

  const exportJSON = useCallback(() => {
    const data = {
      id: scan.id, name: scan.name, purpose: scan.purpose,
      room: { boundary: scan.room.boundary },
      openings: scan.room.openings, furniture,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${scan.id}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }, [scan, furniture])

  const importJSON = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        const next = loadScan(data)
        setScan(next)
        setFurniture(next.furniture)
        setSelectedId(null)
        setResults(null)
        setActiveResult(null)
        setStep('edit')
        setInitialScore(null)
      } catch {
        alert('Could not parse that file as a room JSON.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  // What the canvas shows depends on the step.
  const showingResult = step === 'results' && results && activeResult != null
  const displayFurniture = showingResult ? results[activeResult].furniture : furniture
  const ghosts = showingResult && showGhosts
    ? results[activeResult].original.filter((o) => {
        const now = results[activeResult].furniture.find((f) => f.id === o.id)
        return now && dist(now.position, o.position) > 0.12
      })
    : null
  const arrows = showingResult && showGhosts
    ? results[activeResult].moves.filter((m) => m.distance > 0.12).map((m) => ({ from: m.before.position, to: m.item.position }))
    : null

  const selected = furniture.find((f) => f.id === selectedId)
  const scoreDelta = initialScore != null ? currentScore - initialScore : 0

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 12h8V3" /><path d="M14 21v-6h7" />
            </svg>
          </span>
          Roomshift
        </div>

        <select className="room-select" value={roomIdx} onChange={(e) => selectRoom(+e.target.value)}>
          {SAMPLE_ROOMS.map((r, i) => <option key={r.id} value={i}>{r.name}</option>)}
        </select>

        <nav className="steps">
          <button className={`step${step === 'edit' ? ' active' : ''}`} onClick={() => setStep('edit')}>
            <span className="step-num">1</span> Edit room
          </button>
          <button className={`step${step === 'optimize' ? ' active' : ''}`} onClick={() => setStep('optimize')}>
            <span className="step-num">2</span> Optimize
          </button>
          <button
            className={`step${step === 'results' ? ' active' : ''}${results ? ' done' : ''}`}
            onClick={() => results && setStep('results')}
            style={{ opacity: results ? 1 : 0.45, cursor: results ? 'pointer' : 'default' }}
          >
            <span className="step-num">3</span> Results
          </button>
        </nav>

        <div className="topbar-actions">
          <input ref={fileRef} type="file" accept=".json" hidden onChange={importJSON} />
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>Import</button>
          <button className="btn" onClick={exportJSON}>Export JSON</button>
        </div>
      </header>

      <div className="main">
        <Sidebar
          furniture={displayFurniture}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onToggleMovable={toggleMovable}
          onAdd={addItem}
          readOnly={showingResult}
        />

        <div className="canvas-wrap">
          <FloorPlan
            room={scan.room}
            furniture={displayFurniture}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMoveItem={showingResult ? undefined : moveItem}
            violatingIds={violatingIds}
            ghosts={ghosts}
            arrows={arrows}
          />

          <div className="violations">
            {!showingResult && violations.slice(0, 4).map((v, i) => (
              <div key={i} className="violation-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                </svg>
                {v.message}
              </div>
            ))}
            {!showingResult && violations.length === 0 && step === 'edit' && (
              <div className="violation-chip feasible-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Layout is feasible — all constraints satisfied
              </div>
            )}
          </div>

          <div className="score-pill">
            <div className="score-label">Layout score</div>
            <div className={`score-value${scoreDelta > 0 ? ' delta-up' : ''}`}>
              {showingResult
                ? Math.round((results[activeResult].score.terms.openSpace + results[activeResult].score.terms.walking + results[activeResult].score.terms.wallAlign + results[activeResult].score.terms.functional) / 4 * 100)
                : currentScore}
              <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 550 }}> / 100</span>
            </div>
            {!showingResult && scoreDelta !== 0 && (
              <div style={{ fontSize: 11.5, fontWeight: 600, color: scoreDelta > 0 ? 'var(--good)' : 'var(--warn)' }}>
                {scoreDelta > 0 ? '▲' : '▼'} {Math.abs(scoreDelta)} vs. original
              </div>
            )}
          </div>

          {step === 'edit' && (
            <div className="canvas-hint">Drag furniture to rearrange · click to select · R rotates</div>
          )}
        </div>

        <aside className="panel panel-right">
          {step === 'edit' && (
            <Inspector item={selected} onUpdate={updateItem} onRotate={rotateItem} onDelete={deleteItem} />
          )}

          {step === 'optimize' && (
            <div className="panel-section">
              <div className="panel-title">Optimization goals</div>
              <div className="objective-cards">
                {Object.entries(OBJECTIVE_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    className={`objective-card${enabled[key] ? ' on' : ''}`}
                    onClick={() => setEnabled((en) => ({ ...en, [key]: !en[key] }))}
                  >
                    <h4>{preset.name}</h4>
                    <p>{preset.tagline}</p>
                  </button>
                ))}
              </div>

              {violations.length > 0 && (
                <p style={{ fontSize: 12.5, color: 'var(--warn)', marginTop: 12 }}>
                  Fix the {violations.length} constraint issue{violations.length > 1 ? 's' : ''} in the current layout first — the optimizer needs a feasible starting point.
                </p>
              )}

              <button
                className="btn btn-primary btn-lg btn-block"
                style={{ marginTop: 14 }}
                disabled={progress !== null || Object.values(enabled).every((v) => !v)}
                onClick={runOptimize}
              >
                {progress !== null ? 'Optimizing…' : `Generate ${Object.values(enabled).filter(Boolean).length} layout${Object.values(enabled).filter(Boolean).length !== 1 ? 's' : ''}`}
              </button>

              {progress !== null && (
                <>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
                  <div className="progress-label">Simulated annealing · {Math.round(progress * 100)}% · exploring feasible arrangements</div>
                </>
              )}

              <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 14, lineHeight: 1.5 }}>
                The optimizer never violates hard constraints: furniture stays inside the room, never overlaps, and never blocks the door.
              </p>
            </div>
          )}

          {step === 'results' && (
            results ? (
              <ResultsPanel
                scan={scan}
                results={results}
                activeIndex={activeResult}
                onView={setActiveResult}
                onApply={applyResult}
                showGhosts={showGhosts}
                onToggleGhosts={() => setShowGhosts((v) => !v)}
                baseline={baseline}
              />
            ) : (
              <div className="empty-state"><p>Run the optimizer first to see generated layouts.</p></div>
            )
          )}
        </aside>
      </div>
    </div>
  )
}
