import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { claimsOf, cl, DOMAINS, dom, proc, PROCS, type Proc } from './data'
import { camFor, levelFromCam, links, RM, type Cam } from './logic'
import { Chev, FindOut, StLine } from './parts'
import { useW } from './store'

const camTransform = (c: Cam) => `translate(200px,200px) scale(${c.s}) translate(${-c.x}px,${-c.y}px)`

/** Semantic zoom: company → area → process → claim. Pinch, wheel, drag and double-tap move the camera directly for smoothness. */
export function MapView() {
  const w = useW(), m = w.map
  const svg = useRef<SVGSVGElement>(null), g = useRef<SVGGElement>(null)
  const cam = useRef<Cam>(w.camReq.cam), dragged = useRef(0)
  const [lim, setLim] = useState({ min: w.camReq.cam.s <= 1.001, max: w.camReq.cam.s >= 34 })
  const zoomBy = useRef<(f: number) => void>(() => {})
  const latest = useRef(w); latest.current = w

  const apply = (anim: boolean) => { const el = g.current; if (!el) return; el.style.transition = anim && !RM ? '' : 'none'; el.style.transform = camTransform(cam.current); const min = cam.current.s <= 1.001, max = cam.current.s >= 34; setLim((l) => (l.min === min && l.max === max ? l : { min, max })) }
  useLayoutEffect(() => { cam.current = w.camReq.cam; apply(w.camReq.anim) }, [w.camReq.n])

  useEffect(() => {
    const sv = svg.current; if (!sv) return
    const pts: Record<number, { x: number; y: number }> = {}
    let start: { cam: Cam; p: { x: number; y: number }; dist?: number } | null = null, moved = false, lastTap = 0, snapT = 0
    const vb = (e: { clientX: number; clientY: number }) => { const r = sv.getBoundingClientRect(); return { x: ((e.clientX - r.left) * 400) / r.width, y: ((e.clientY - r.top) * 400) / r.height } }
    const world = (p: { x: number; y: number }) => ({ x: (p.x - 200) / cam.current.s + cam.current.x, y: (p.y - 200) / cam.current.s + cam.current.y })
    const sync = () => latest.current.levelChanged(levelFromCam(cam.current))
    // After a gesture inside a process, settle back onto it if the reader drifted.
    const snapSoon = () => {
      clearTimeout(snapT)
      snapT = window.setTimeout(() => {
        const mm = latest.current.map
        if (mm.lvl !== 2 || !mm.proc) return
        const t = camFor(mm), p = proc(mm.proc)!
        if (Math.abs(t.s - cam.current.s) / t.s > 0.08 || Math.hypot(t.x - cam.current.x, t.y - cam.current.y) > p.r * 0.3) { cam.current = t; apply(true) }
      }, 420)
    }
    const zoomAt = (p: { x: number; y: number }, f: number) => {
      const wp = world(p), ns = Math.max(0.8, Math.min(34, cam.current.s * f))
      cam.current = { s: ns, x: wp.x - (p.x - 200) / ns, y: wp.y - (p.y - 200) / ns }; apply(false); sync(); snapSoon()
    }
    const hideHint = () => latest.current.setHint(false)
    // + and −: zoom around the centre of the map; − settles on the full overview when it gets close.
    zoomBy.current = (f: number) => {
      hideHint()
      const ns = Math.max(1, Math.min(34, cam.current.s * f))
      cam.current = ns <= 1.15 ? { x: 200, y: 200, s: 1 } : { ...cam.current, s: ns }
      apply(true); sync()
    }
    const down = (e: PointerEvent) => {
      pts[e.pointerId] = vb(e); moved = false; start = { cam: { ...cam.current }, p: vb(e) }
      const k = Object.keys(pts); if (k.length === 2) start.dist = Math.hypot(pts[+k[0]].x - pts[+k[1]].x, pts[+k[0]].y - pts[+k[1]].y)
    }
    const move = (e: PointerEvent) => {
      if (!pts[e.pointerId] || !start) return
      const p = vb(e), prev = pts[e.pointerId]; pts[e.pointerId] = p; const k = Object.keys(pts)
      if (k.length === 2 && start.dist) { const a = pts[+k[0]], b = pts[+k[1]], dist = Math.hypot(a.x - b.x, a.y - b.y); zoomAt({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, dist / start.dist); start.dist = dist; moved = true; hideHint(); return }
      if (k.length === 1) {
        if (!moved && Math.hypot(p.x - start.p.x, p.y - start.p.y) < 6) return
        if (!moved) { try { sv.setPointerCapture(e.pointerId) } catch { /* not capturable */ } }
        moved = true; sv.classList.add('drag'); hideHint()
        cam.current = { ...cam.current, x: cam.current.x - (p.x - prev.x) / cam.current.s, y: cam.current.y - (p.y - prev.y) / cam.current.s }; apply(false); sync()
      }
    }
    const up = (e: PointerEvent) => {
      const wasMove = moved; if (wasMove) { snapSoon(); dragged.current = Date.now() }
      delete pts[e.pointerId]; sv.classList.remove('drag')
      if (!wasMove && e.type === 'pointerup') { const now = Date.now(); if (now - lastTap < 300) { zoomAt(vb(e), 2); dragged.current = Date.now(); lastTap = 0 } else lastTap = now }
      if (!Object.keys(pts).length) moved = false
    }
    const leave = (e: PointerEvent) => { if (pts[e.pointerId] && e.pointerType === 'mouse') up(e) }
    const wheel = (e: WheelEvent) => { e.preventDefault(); hideHint(); zoomAt(vb(e), Math.exp(-e.deltaY * 0.0022)) }
    sv.addEventListener('pointerdown', down); sv.addEventListener('pointermove', move); sv.addEventListener('pointerup', up); sv.addEventListener('pointercancel', up); sv.addEventListener('pointerleave', leave)
    sv.addEventListener('wheel', wheel, { passive: false })
    return () => { clearTimeout(snapT); sv.removeEventListener('pointerdown', down); sv.removeEventListener('pointermove', move); sv.removeEventListener('pointerup', up); sv.removeEventListener('pointercancel', up); sv.removeEventListener('pointerleave', leave); sv.removeEventListener('wheel', wheel) }
  }, [])

  // Taps right after a drag are part of the drag, not a selection.
  const tap = (f: () => void) => () => { if (Date.now() - dragged.current < 250) return; f() }
  const L = useMemo(links, [])

  return (
    <>
      <div className="mapv"><div className="mapbox">
        <svg id="msvg" ref={svg} viewBox="0 0 400 400" data-lvl={m.lvl} role="img" aria-label="Zoomable map of everything Asoka knows. Pinch or scroll to zoom, drag to move.">
          <g className="cam" id="cam" ref={g} style={{ transform: camTransform(cam.current) }}>
            {Object.entries(L).map(([k, n]) => {
              const [a, b] = k.split('|').map(dom), dx = b.x - a.x, dy = b.y - a.y, dl = Math.hypot(dx, dy), ux = dx / dl, uy = dy / dl
              const ax = a.x + ux * (a.r + 3), ay = a.y + uy * (a.r + 3), bx = b.x - ux * (b.r + 3), by = b.y - uy * (b.r + 3), mx = (ax + bx) / 2 - uy * 14, my = (ay + by) / 2 + ux * 14
              return <path key={k} className="lk" d={`M${ax.toFixed(1)} ${ay.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`} fill="none" stroke="var(--accent)" strokeOpacity={0.35} strokeWidth={(1.2 + n * 0.8).toFixed(1)} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            })}
            {DOMAINS.map((d) => {
              const dark = d.cov < 0.55, fs = (12 * d.r) / 150
              return (
                <g key={d.id} className={'dm' + (m.dom === d.id ? ' on' : '')} data-d={d.id}>
                  <circle className="dc" onClick={tap(() => w.setLvl(1, d.id, null))} cx={d.x} cy={d.y} r={d.r} style={{ fill: dark ? 'var(--panel2)' : `color-mix(in srgb,var(--accent) ${Math.round(10 + 16 * d.cov)}%,var(--bg))` }} stroke={dark ? 'var(--ink2)' : 'var(--accent)'} strokeOpacity={dark ? 0.6 : 0.45} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeDasharray={dark ? '5 4' : undefined} />
                  <text className="lab l0" x={d.x} y={d.y + d.r + 15} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--ink)" strokeWidth={3}>{d.n}</text>
                  {PROCS.filter((p) => p.d === d.id).map((p) => <ProcNode key={p.id} p={p} px={d.x + p.dx} py={d.y + p.dy} fs={fs} on={m.proc === p.id} sel={m.claim} tap={tap} />)}
                </g>
              )
            })}
          </g>
        </svg>
        <div className="zbtns zpm" role="group" aria-label="Zoom">
          <button className="zb press" onClick={() => zoomBy.current(1.8)} disabled={lim.max} aria-label="Zoom in" title="Zoom in">+</button>
          <button className="zb press" onClick={() => zoomBy.current(1 / 1.8)} disabled={lim.min} aria-label="Zoom out" title="Zoom out">−</button>
        </div>
        <div className="mhint" style={{ opacity: w.hint ? 1 : 0 }}>Pinch or scroll to zoom. Drag to move.</div>
      </div></div>
      <div className="mcap" id="mcap"><Caption /></div>
    </>
  )
}

function ProcNode({ p, px, py, fs, on, sel, tap }: { p: Proc; px: number; py: number; fs: number; on: boolean; sel: string | null; tap: (f: () => void) => () => void }) {
  const w = useW(), pd = p.cov < 0.55, cs = claimsOf(p.id), R = p.r * (cs.length > 3 ? 0.6 : 0.5), cf = (11.5 * p.r) / 120
  return (
    <g className={'pr' + (on ? ' on' : '')} data-p={p.id}>
      <circle className="pc" onClick={tap(() => w.setLvl(2, p.d, p.id))} cx={px} cy={py} r={p.r} fill={pd ? 'var(--panel)' : 'var(--accent)'} fillOpacity={pd ? 1 : +(0.14 + 0.2 * p.cov).toFixed(2)} stroke={pd ? 'var(--ink2)' : 'var(--accent)'} strokeOpacity={0.55} strokeWidth={1.2} vectorEffect="non-scaling-stroke" strokeDasharray={pd ? '4 3' : undefined} />
      <text className="lab l1" x={px} y={+(py + p.r + fs * 1.25).toFixed(2)} textAnchor="middle" fontSize={+fs.toFixed(2)} fontWeight={600} fill="var(--ink)" strokeWidth={+(fs * 0.25).toFixed(2)}>{p.n}</text>
      {cs.map((c, i) => {
        const an = -Math.PI / 2 + (i * 2 * Math.PI) / cs.length, co = Math.cos(an), si = Math.sin(an), cx = px + R * co, cy = py + R * si
        const col = c.st === 'chk' ? 'var(--warn)' : c.st === 'chg' ? 'var(--accent)' : 'var(--ink)'
        let lx = px + (R + p.r * 0.12) * co, ly = py + (R + p.r * 0.12) * si + cf * 0.35
        const anc = co > 0.3 ? 'start' : co < -0.3 ? 'end' : 'middle'
        if (anc === 'middle') ly += si > 0 ? cf * 0.9 : -cf * 0.5
        lx = +lx.toFixed(2)
        return (
          <g key={c.id}>
            <g className="cc" onClick={tap(() => w.selectClaim(c.id))}>
              <circle cx={+cx.toFixed(2)} cy={+cy.toFixed(2)} r={+(p.r * 0.12).toFixed(2)} fill="transparent" />
              <circle className="cdot" data-c={c.id} cx={+cx.toFixed(2)} cy={+cy.toFixed(2)} r={+(p.r * 0.045).toFixed(2)} fill={col} stroke="var(--panel)" strokeWidth={sel === c.id ? 3 : 0} vectorEffect="non-scaling-stroke" />
            </g>
            <text className="lab l2" x={lx} y={+ly.toFixed(2)} textAnchor={anc} fontSize={+cf.toFixed(2)} fontWeight={500} fill="var(--ink)" strokeWidth={+(cf * 0.3).toFixed(2)}>{c.s}</text>
          </g>
        )
      })}
    </g>
  )
}

/** The card under the map explains whatever level you're at. */
function Caption() {
  const w = useW(), m = w.map
  if (m.lvl === 0 || !m.dom) return (
    <div className="card"><h2>Northwind, as Asoka understands it</h2><p>Six areas and 1,284 pages. Lines show how areas depend on each other. Faded, dashed areas are where Asoka still knows little.</p>
      <div className="legend"><span><i style={{ background: 'var(--accent)', opacity: 0.3 }} />Well understood</span><span><i style={{ background: 'var(--panel2)', boxShadow: 'inset 0 0 0 1.5px var(--ink2)' }} />Asoka knows little</span></div></div>
  )
  const d = dom(m.dom)
  if (m.lvl === 1 || !m.proc) {
    const ps = PROCS.filter((p) => p.d === d.id), dk = ps.filter((p) => p.cov < 0.55)
    const out = [...new Set(ps.flatMap((p) => p.deps.map((q) => proc(q)!.d)).filter((x) => x !== d.id))]
    return (
      <div className="card"><h2>{d.n}</h2><p>Asoka understands {Math.round(d.cov * 100)}% of this area across {d.pages} pages. Tap a process to zoom in.</p>
        {dk.map((p) => <div key={p.id} className="dark"><span className="x1"><b>{p.n}</b>: Asoka knows little here.</span><FindOut k={p.id} /></div>)}
        {out.length > 0 && <div className="conn">{out.map((k) => <button key={k} className="press" onClick={() => w.flyTo(1, k, null)}>{dom(k).n} <small>connected</small></button>)}</div>}
      </div>
    )
  }
  const p = proc(m.proc)!, cs = claimsOf(p.id)
  if (m.claim) {
    const c = cl(m.claim)!
    return (
      <div className="card"><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink2)' }}>{p.n}</div>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)', lineHeight: 1.4, margin: '4px 0 2px' }}>{c.t}</p><StLine c={c} />
        <button className="openb press" onClick={() => w.openClaim(c.id)} style={{ marginTop: 12 }}><span>See why it’s true</span><Chev inherit /></button></div>
    )
  }
  const chk = cs.filter((c) => c.st !== 'solid').length, dp = p.deps.map(proc).filter(Boolean) as Proc[]
  return (
    <div className="card"><h2>{p.n}</h2><p>{p.w} {cs.length} things Asoka knows{chk ? `, ${chk} worth a look (in color)` : ''}. Tap any point.</p>
      {dp.length > 0 && <div className="conn">{dp.map((q) => <button key={q.id} className="press" onClick={() => w.flyTo(2, q.d, q.id)}>{q.n}{q.d !== p.d && <> <small>{dom(q.d).n}</small></>}</button>)}</div>}
      <button className="openb press" onClick={() => w.openProc(p.id)} style={{ marginTop: 12 }}><span>See the whole picture</span><Chev inherit /></button></div>
  )
}
