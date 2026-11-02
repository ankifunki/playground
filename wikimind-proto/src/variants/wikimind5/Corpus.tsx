import type React from 'react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AG } from './agents'
import { AREA_PCT, AREAS, CORPUS_TOTAL, CT_LABEL, DAYS, PAGES } from './data'
import { Icon } from './Icon'
import { RM } from './logic'
import { useW } from './store'

/** Every page as one square. Rendered once; live updates, replay and hover are applied straight to the DOM. */
const Cells = memo(function Cells() {
  return <>{PAGES.map((c, i) => c.main
    ? <button key={i} className={'cp-c cp-ok main a' + c.area} data-i={i} data-d={c.day} aria-label={'Open ' + c.title} />
    : <span key={i} className={'cp-c cp-' + c.tier + ' a' + c.area} data-i={i} data-d={c.day} />)}</>
})

const START = Date.now() - DAYS * 864e5
const dayLabel = (d: number) => (d >= DAYS ? 'Today' : new Date(START + d * 864e5).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
const CUM = Array.from({ length: DAYS + 1 }, (_, d) => PAGES.filter((p) => p.day <= d).length)

type Hov = { i: number; x: number; y: number; lines: [number, number][]; W: number; H: number }

/**
 * Everything the agents know: a flat set of linked pages (no folders), each a square coloured by how far a
 * person has checked it. Squares light up as agents update them. Hover one to see what it links to; replay
 * shows how the whole thing was assembled after the sources were connected.
 */
export function Corpus() {
  const w = useW(), box = useRef<HTMLDivElement>(null), cells = useRef<HTMLElement[]>([])
  const count = useRef<HTMLSpanElement>(null), recent = useRef<number[]>([])
  const [hov, setHov] = useState<Hov | null>(null)
  const [flt, setFlt] = useState<number | null>(null)
  const [rep, setRep] = useState<{ day: number; playing: boolean } | null>(null)
  const live = useRef(true); live.current = w.wireOn && !rep
  const wr = useRef(w); wr.current = w

  useEffect(() => { cells.current = Array.from(box.current?.querySelectorAll<HTMLElement>('.cp-c') || []) }, [])
  // Live: a couple of pages update every second; now and then one is verified.
  useEffect(() => {
    const t = window.setInterval(() => {
      if (!live.current || !cells.current.length) return
      for (let k = 0; k < 2; k++) {
        const c = cells.current[Math.floor(Math.random() * cells.current.length)]
        c.classList.remove('pz'); void c.offsetWidth; c.classList.add('pz')
        window.setTimeout(() => c.classList.remove('pz'), 1600)
        if (c.classList.contains('cp-obs') && Math.random() < 0.25) c.classList.replace('cp-obs', 'cp-ok')
      }
      const now = Date.now(); recent.current = [...recent.current.filter((x) => now - x < 60000), now, now]
      if (count.current) count.current.textContent = String(recent.current.length)
    }, 1100)
    return () => window.clearInterval(t)
  }, [])
  // Replay: hide pages written after the current day, and step through the days.
  useEffect(() => {
    cells.current.forEach((c) => c.classList.toggle('cp-hid', !!rep && +c.dataset.d! > rep.day))
    if (!rep?.playing) return
    if (rep.day >= DAYS) { setRep({ day: DAYS, playing: false }); return }
    const t = window.setTimeout(() => setRep((r) => (r ? { ...r, day: r.day + 1 } : r)), RM ? 120 : 210)
    return () => window.clearTimeout(t)
  }, [rep])
  useEffect(() => { if (w.replayN) { setHov(null); setRep({ day: 0, playing: true }) } }, [w.replayN])

  const unlight = () => cells.current.forEach((c) => c.classList.remove('cp-lk', 'cp-on'))
  const onOver = useCallback((e: React.MouseEvent) => {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return
    const el = (e.target as HTMLElement).closest<HTMLElement>('.cp-c'), b = box.current
    if (!el || !b || el.classList.contains('cp-hid')) return
    const i = +el.dataset.i!, br = b.getBoundingClientRect(), mid = (n: HTMLElement): [number, number] => { const r = n.getBoundingClientRect(); return [r.left - br.left + r.width / 2, r.top - br.top + r.height / 2] }
    unlight(); el.classList.add('cp-on')
    const lines = PAGES[i].links.map((j) => { const c = cells.current[j]; c?.classList.add('cp-lk'); return c ? mid(c) : null }).filter(Boolean) as [number, number][]
    const [x, y] = mid(el)
    setHov({ i, x, y, lines, W: br.width, H: br.height })
  }, [])
  const onLeave = useCallback(() => { unlight(); setHov(null) }, [])
  const onClick = useCallback((e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.cp-c'); if (!el || el.classList.contains('cp-hid')) return
    const i = +el.dataset.i!
    if (PAGES[i].main) wr.current.go('page'); else wr.current.openCell(i)
  }, [])

  const tip = useMemo(() => {
    if (!hov) return null
    const c = PAGES[hov.i], a = AREAS[c.area], left = Math.max(110, Math.min(hov.W - 110, hov.x))
    return { c, a, left, top: hov.y }
  }, [hov])

  return (
    <section className="cp" id="corpus" aria-label="Everything the agents know">
      <div className="cp-h">
        <h2>Everything the agents know</h2>
        {rep ? (
          <div className="cp-rep" role="group" aria-label="Replay how it was built">
            <button className="sim-play sm" onClick={() => setRep((r) => (r ? (r.day >= DAYS ? { day: 0, playing: true } : { ...r, playing: !r.playing }) : r))} aria-label={rep.playing ? 'Pause' : rep.day >= DAYS ? 'Replay again' : 'Play'}><Icon name={rep.playing ? 'pause' : rep.day >= DAYS ? 'rotate-ccw' : 'play'} size={14} /></button>
            <input type="range" min={0} max={DAYS} value={rep.day} onChange={(e) => setRep({ day: +e.target.value, playing: false })} aria-label="Day" style={{ '--p': (rep.day / DAYS) * 100 + '%' } as React.CSSProperties} />
            <span className="cp-day"><b>{dayLabel(rep.day)}</b> · {CUM[rep.day].toLocaleString()} pages{rep.day === 0 ? ' · Slack, Salesforce, Jira and meetings connected' : ''}</span>
            <button className="ibtn sm" onClick={() => setRep(null)} aria-label="Back to today" title="Back to today"><Icon name="x" size={14} /></button>
          </div>
        ) : (
          <div className="cp-n">
            <span><b>{CORPUS_TOTAL.toLocaleString()}</b> pages · <b>{w.obs.toLocaleString()}</b> observations this week · <b><span ref={count}>0</span></b> updated in the last minute</span>
            <button className="cp-play" onClick={() => { setHov(null); setRep({ day: 0, playing: true }) }}><Icon name="play" size={12} />Watch it being built</button>
          </div>
        )}
      </div>
      <div className="cp-f" role="group" aria-label="Highlight an area">
        <button className={flt === null ? 'on' : ''} aria-pressed={flt === null} onClick={() => setFlt(null)}>All</button>
        {AREAS.map((a, i) => <button key={a.name} className={flt === i ? 'on' : ''} aria-pressed={flt === i} onClick={() => setFlt(flt === i ? null : i)}>{a.name}<span>{AREA_PCT[i]}%</span></button>)}
      </div>
      <div className="cp-box" ref={box}>
        <div className="cp-g" data-a={flt ?? ''} onMouseOver={onOver} onMouseLeave={onLeave} onClick={onClick}><Cells /></div>
        {hov && (
          <svg className="cp-ln" width={hov.W} height={hov.H} aria-hidden="true">
            {hov.lines.map(([x, y], k) => <line key={k} x1={hov.x} y1={hov.y} x2={x} y2={y} />)}
          </svg>
        )}
        {tip && (
          <div className="cp-tip" style={{ left: tip.left, top: tip.top }} role="tooltip">
            <b>{tip.c.title}</b>
            <span className="tk">{tip.a.name} · {AG[tip.a.ag].name} agent</span>
            <span className={'cp-tt cp-t-' + tip.c.tier}>{CT_LABEL[tip.c.tier]} · updated {tip.c.upd}</span>
            <span className="tk">Links to {tip.c.links.length} pages</span>
          </div>
        )}
      </div>
      <div className="cp-leg"><span><i className="cp-ok" />Checked by a person</span><span><i className="cp-obs" />Written from what agents saw</span><span><i className="cp-stale" />Stale</span><span><i className="cp-warn" />Unconfirmed</span><span><i className="cp-open" />Open question</span><span><i className="cp-now" />Updating now</span></div>
    </section>
  )
}
