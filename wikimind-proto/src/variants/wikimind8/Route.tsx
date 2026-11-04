import type React from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

type Kind = 'none' | 'mgr' | 'fin' | 'cro'
type Lane = { k: Kind; label: string; gates: string[]; gx: number[] }

/** Approval minutes per gate, for the clock that races while a person approves. */
const MINS: Record<string, number> = { Manager: 70, Finance: 220, CRO: 365 }
const hm = (m: number) => `+${Math.floor(m / 60)} h ${String(Math.round(m % 60)).padStart(2, '0')} m`
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

/**
 * The route map: how a deal gets approved, played. The deal leaves the rep, reaches the Approvals job, and the path
 * forks into every route the live config allows (under $100k, up to f%, f–35%, over 35%). While the job checks, it
 * scans the routes; then the one this deal takes turns indigo and the rest fall back. The deal travels it with an
 * indigo trail; each approver is a gate it waits at while a clock races through the hours, and the gate swings open
 * green when they approve. At the end the lock opens. Nothing else moves.
 */
export function Route({ t, kind, f, okAt, end, label }: { t: number; kind: Kind; f: number; okAt: number[]; end: number; label: string }) {
  const box = useRef<HTMLDivElement>(null), view = useRef<HTMLDivElement>(null), path = useRef<SVGPathElement>(null)
  const [W, setW] = useState(640), [pts, setPts] = useState<{ l: number; x: number; y: number }[]>([]), [L, setL] = useState(1)
  const H = 216, mid = 104, ys = [44, 84, 124, 164], narrow = false
  const x0 = 20, ax = W * 0.24, fx = W * 0.36, mx = W * 0.82, xe = W - 24
  const lanes: Lane[] = [
    { k: 'none', label: 'Under $100k', gates: [], gx: [] },
    { k: 'mgr', label: `Up to ${f}%`, gates: ['Manager'], gx: [W * 0.62] },
    { k: 'fin', label: `${f}–35%`, gates: ['Manager', 'Finance'], gx: [W * 0.54, W * 0.72] },
    { k: 'cro', label: 'Over 35%', gates: ['CRO'], gx: [W * 0.62] },
  ]
  const d = (y: number) => `M ${x0} ${mid} L ${ax} ${mid} C ${ax + (fx - ax) * 0.6} ${mid}, ${ax + (fx - ax) * 0.4} ${y}, ${fx} ${y} L ${mx} ${y} C ${mx + (xe - mx) * 0.6} ${y}, ${mx + (xe - mx) * 0.4} ${mid}, ${xe} ${mid}`
  const li = lanes.findIndex((l) => l.k === kind), lane = lanes[li]

  useLayoutEffect(() => {
    const el = box.current; if (!el) return
    // Never narrower than 560px, so every label stays legible; on phones the view pans with the deal instead.
    const ro = new ResizeObserver(() => setW(Math.max(560, Math.round(el.clientWidth)))); ro.observe(el); return () => ro.disconnect()
  }, [])
  // Sample the chosen route once per layout: arc length against x, so the token and its trail follow the curve.
  useLayoutEffect(() => {
    const p = path.current; if (!p) return
    const total = p.getTotalLength(), out: { l: number; x: number; y: number }[] = []
    for (let i = 0; i <= 240; i++) { const l = (total * i) / 240, q = p.getPointAtLength(l); out.push({ l, x: q.x, y: q.y }) }
    setPts(out); setL(total)
  }, [W, kind, f])

  // Where the deal is along x at time t: to the job, hold while it checks, then gate to gate, then to the lock.
  const hold = (x0 + ax) / 2 + 4, stop = xe - 44
  const kf: { t: number; x: number }[] = [{ t: 0, x: x0 }, { t: 1800, x: hold }, { t: 4200, x: hold }]
  if (kind === 'none') kf.push({ t: end, x: stop })
  else {
    kf.push({ t: 7600, x: lane.gx[0] - 14 })
    lane.gx.forEach((gx, i) => { kf.push({ t: okAt[i], x: gx - 14 }); if (i + 1 < lane.gx.length) kf.push({ t: okAt[i] + 600, x: lane.gx[i + 1] - 14 }) })
    kf.push({ t: end, x: stop })
  }
  let x = stop
  for (let i = 0; i < kf.length - 1; i++) { const a = kf[i], b = kf[i + 1]; if (t <= b.t) { x = a.x + (b.x - a.x) * ease(Math.min(1, Math.max(0, (t - a.t) / Math.max(1, b.t - a.t)))); break } }
  if (t <= 0) x = x0
  const at = (() => { if (!pts.length) return { l: 0, x, y: mid }; let lo = 0, hi = pts.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts[m].x < x) lo = m; else hi = m } const a = pts[lo], b = pts[hi], k = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x); return { l: a.l + (b.l - a.l) * k, x, y: a.y + (b.y - a.y) * k } })()

  const chosen = t >= 4200, checking = t > 1800 && t < 4200, scan = checking && t > 2400 ? Math.floor((t - 2400) / 450) % 4 : -1
  const done = t > end + 400
  // The clock: seconds while the job works, hours racing while a person approves.
  let clock = t < 1800 ? '0 s' : t < 7600 ? `+${Math.min(4, Math.max(1, Math.round((t - 1800) / 1450)))} s` : kind === 'none' ? '+4 s' : ''
  let waiting = -1
  if (kind !== 'none' && t >= 7600) {
    const g = lane.gates
    for (let i = 0; i < g.length; i++) {
      const arrive = i === 0 ? 7600 : okAt[i - 1] + 600
      if (t < okAt[i]) { const prev = i === 0 ? 0 : MINS[g[i - 1]], k = Math.max(0, (t - arrive) / (okAt[i] - arrive)); clock = t < arrive ? hm(prev) : hm(prev + (MINS[g[i]] - prev) * k); waiting = t >= arrive ? i : -1; break }
      clock = hm(MINS[g[i]])
    }
  }

  useEffect(() => { const v = view.current; if (v && v.scrollWidth > v.clientWidth) v.scrollLeft = Math.max(0, at.x - v.clientWidth / 2) }, [at.x])

  return (
    <div className="route-view" ref={(el) => { box.current = el; view.current = el }}>
    <div className={'route' + (narrow ? ' narrow' : '')} style={{ width: W, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {lanes.map((l, i) => <path key={l.k} d={d(ys[i])} className={'rt-lane' + (chosen ? (i === li ? ' on' : ' off') : i === scan ? ' scan' : '')} />)}
        <path ref={path} d={d(ys[li])} className="rt-trail" style={{ strokeDasharray: L, strokeDashoffset: done ? 0 : Math.max(0, L - at.l) }} />
      </svg>
      {lanes.map((l, i) => (
        <span key={l.k} className={'rt-ll' + (chosen ? (i === li ? ' on' : ' off') : i === scan ? ' scan' : '')} style={{ left: fx + 8, top: ys[i] - 22 }}>{l.label}</span>
      ))}
      {lanes.map((l, i) => l.gates.map((g, j) => {
        const mine = i === li, ok = mine && t > okAt[j], wait = mine && waiting === j
        return (
          <span key={l.k + g} className={'rt-gate' + (mine && chosen ? ' mine' : chosen ? ' off' : '') + (ok ? ' ok' : wait ? ' wait' : '')} style={{ left: l.gx[j], top: ys[i] }}>
            <i />
            <small>{g}</small>
          </span>
        )
      }))}
      <span className="rt-node rt-start" style={{ left: x0, top: mid }}><small>Rep</small></span>
      <span className={'rt-node rt-agent' + (checking ? ' busy' : '')} style={{ left: ax, top: mid }}><Icon name="stamp" size={14} /><small>Asoka</small></span>
      <span className={'rt-node rt-end' + (done ? ' ok' : '')} style={{ left: xe, top: mid }}><Icon name={done ? 'lock-open' : 'lock'} size={14} /></span>
      <span className={'rt-tok' + (waiting >= 0 ? ' wait' : '') + (done ? ' gone' : '')} style={{ transform: `translate(${at.x}px, ${at.y}px)` } as React.CSSProperties}>
        <b className="rt-clock">{clock}</b>
        <span className="rt-pill">{label}</span>
      </span>
    </div>
    </div>
  )
}
