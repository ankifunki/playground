import { useEffect, useRef, useState } from 'react'
import { AG, DEALS, money } from './data'
import { Icon } from './Icon'
import { RM, useW } from './store'
import { Chip } from './Live'

type Route = 'none' | 'mgr' | 'fin' | 'cro'
type Tok = { id: number; d: (typeof DEALS)[number]; r: Route; e: number }

/* Geometry, in viewBox units (820 x 330). Tokens follow these routes; nodes sit on top of them. */
const BASE = 'M62 140 L344 140'
const YES = BASE + ' L462 140'
const PATHS: Record<Route, string> = {
  none: BASE + ' L344 296 L688 296 C740 296 766 260 766 164 L766 140',
  mgr: YES + ' C525 140 520 50 548 50 L688 50 C740 50 766 80 766 116 L766 140',
  fin: YES + ' L766 140',
  cro: YES + ' C525 140 520 230 548 230 L688 230 C740 230 766 200 766 164 L766 140',
}
const EDGES: { k: string; d: string; on: Route[] }[] = [
  { k: 'a', d: 'M120 140 L148 140', on: ['none', 'mgr', 'fin', 'cro'] },
  { k: 'b', d: 'M284 140 L304 140', on: ['none', 'mgr', 'fin', 'cro'] },
  { k: 'no', d: 'M344 172 L344 296 L548 296', on: ['none'] },
  { k: 'yes', d: 'M384 140 L422 140', on: ['mgr', 'fin', 'cro'] },
  { k: 'm1', d: 'M502 140 C525 140 520 50 548 50', on: ['mgr'] },
  { k: 'f1', d: 'M502 140 L548 140', on: ['fin'] },
  { k: 'c1', d: 'M502 140 C525 140 520 230 548 230', on: ['cro'] },
  { k: 'm2', d: 'M688 50 C740 50 766 80 766 116', on: ['mgr'] },
  { k: 'f2', d: 'M688 140 L716 140', on: ['fin'] },
  { k: 'c2', d: 'M688 230 C740 230 766 200 766 164', on: ['cro'] },
  { k: 'n2', d: 'M688 296 C740 296 766 260 766 164', on: ['none'] },
]
const DUR = 4600, GAP = 1700

const routeOf = (d: { amt: number; disc: number }, fin: number): Route => (d.amt <= 100000 ? 'none' : d.disc <= fin ? 'mgr' : d.disc <= 35 ? 'fin' : 'cro')

function Box({ x, y, w, h, a, b, cls = '', hot }: { x: number; y: number; w: number; h: number; a: string; b?: string; cls?: string; hot?: boolean }) {
  return (
    <g className={'fl-node ' + cls + (hot ? ' hot' : '')}>
      <rect x={x} y={y} width={w} height={h} rx={8} />
      <text className="fl-a" x={x + w / 2} y={y + (b ? h / 2 - 3 : h / 2 + 5)} textAnchor="middle">{a}</text>
      {b && <text className="fl-b" x={x + w / 2} y={y + h / 2 + 14} textAnchor="middle">{b}</text>}
    </g>
  )
}
function Diamond({ cx, cy, a, b, hot }: { cx: number; cy: number; a: string; b?: string; hot?: boolean }) {
  return (
    <g className={'fl-node fl-dia' + (hot ? ' hot' : '')}>
      <path d={`M${cx} ${cy - 32} L${cx + 40} ${cy} L${cx} ${cy + 32} L${cx - 40} ${cy} Z`} />
      <text className="fl-a sm" x={cx} y={b ? cy - 2 : cy + 4} textAnchor="middle">{a}</text>
      {b && <text className="fl-a sm" x={cx} y={cy + 13} textAnchor="middle">{b}</text>}
    </g>
  )
}

/**
 * How it works, as a live diagram of the agent's flow with its conditional routes. Real deals (sped up) leave
 * "Negotiation", the Approvals agent checks them, and each takes the route its size and discount send it down: no
 * approval, the sales manager, the manager then Finance, or the CRO. The route a deal takes lights up, the node it
 * reaches pulses, and the caption says why. Pause to read; tap a route to see the rule. When Salesforce changes,
 * the threshold on the diagram is rewritten in place, with the same "edited" chip as any block.
 */
export function Flow() {
  const w = useW(), fin = w.fin
  const refs = useRef<Partial<Record<Route, SVGPathElement | null>>>({})
  const [toks, setToks] = useState<Tok[]>([]), [last, setLast] = useState<{ d: Tok['d']; r: Route } | null>(null)
  const [counts, setCounts] = useState<Record<Route, number>>({ none: 31, mgr: 58, fin: 26, cro: 9 })
  const [pick, setPick] = useState<Route | null>(null)
  const st = useRef({ t: 0, next: 300, n: 0, fin })
  st.current.fin = fin

  const live = useRef<Tok[]>([]), [, setFrame] = useState(0)
  useEffect(() => {
    if (!w.playing) return
    let raf = 0, prev = performance.now()
    const step = (now: number) => {
      const dt = Math.min(64, now - prev); prev = now
      const s = st.current; s.t += dt
      const moved = live.current.map((k) => ({ ...k, e: k.e + dt }))
      const done = moved.filter((k) => k.e >= DUR)
      if (done.length) setCounts((c) => { const n = { ...c }; done.forEach((k) => { n[k.r] += 1 }); return n })
      live.current = moved.filter((k) => k.e < DUR)
      if (s.t >= s.next) {
        const d = DEALS[s.n % DEALS.length], r = routeOf(d, s.fin)
        live.current.push({ id: s.n, d, r, e: 0 }); s.n++; s.next = s.t + GAP
        window.setTimeout(() => setLast({ d, r }), DUR * 0.32)
      }
      setToks(live.current); setFrame((f) => f + 1)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [w.playing])

  // Which routes are lit: the ones tokens are on right now, or the one you picked.
  const lit = new Set<Route>(pick ? [pick] : [])
  const pos = (k: Tok) => {
    const p = refs.current[k.r]; if (!p) return null
    const L = p.getTotalLength(), q = p.getPointAtLength((k.e / DUR) * L)
    return q
  }
  const at = (r: Route) => toks.some((k) => k.r === r && k.e / DUR > 0.55 && k.e / DUR < 0.8)
  const agentHot = toks.some((k) => k.e / DUR > 0.12 && k.e / DUR < 0.3)
  const ed = w.why['flow']
  const why = (r: Route, d?: { amt: number; disc: number }) => r === 'none' ? `${d ? money(d.amt) : '$100k or less'} is not over $100,000, so no approval is needed`
    : r === 'mgr' ? `${d ? d.disc + '%' : `Up to ${fin}%`} is ${d ? `not over ${fin}%` : 'off'}, so the sales manager approves alone`
      : r === 'fin' ? `${d ? d.disc + '%' : `${fin}% to 35%`} is over ${fin}%, so Finance approves after the sales manager`
        : `${d ? d.disc + '%' : 'Over 35%'} is over 35%, so the CRO approves directly`
  const toggle = (r: Route) => { setPick((p) => (p === r ? null : r)); w.setPlaying(false) }

  return (
    <div className="fl" id="b-flow">
      <div className="fl-h">
        <span className="fl-live"><i className={w.playing ? 'on' : ''} aria-hidden="true" />{w.playing ? 'Live · deals routing now' : 'Paused'}<small>sped up</small></span>
        <span className="fl-ctl">
          {ed && <Chip id="flow" />}
          <button className="fl-play" onClick={() => { setPick(null); w.setPlaying(!w.playing) }} aria-label={w.playing ? 'Pause the flow' : 'Play the flow'}><Icon name={w.playing ? 'pause' : 'play'} size={13} />{w.playing ? 'Pause' : 'Play'}</button>
        </span>
      </div>
      <div className="fl-scroll">
        <svg viewBox="0 0 820 330" role="img" aria-label={`Discount approval flow: deals over $100,000 are checked by the Approvals agent and routed by discount: up to ${fin}% the sales manager, ${fin}% to 35% the manager then Finance, over 35% the CRO; the record then unlocks.`}>
          {(Object.keys(PATHS) as Route[]).map((r) => <path key={r} ref={(el) => { refs.current[r] = el }} d={PATHS[r]} className="fl-ghost" />)}
          {EDGES.map((e) => <path key={e.k} d={e.d} className={'fl-e' + (e.on.some((r) => lit.has(r)) ? ' lit' : '')} />)}
          <text className={'fl-lab' + (lit.has('none') || toks.some((k) => k.r === 'none' && k.e / DUR > 0.3) ? ' lit' : '')} x={354} y={236}>No · $100k or less</text>
          <text className={'fl-lab' + ([...lit].some((r) => r !== 'none') || toks.some((k) => k.r !== 'none' && k.e / DUR > 0.3 && k.e / DUR < 0.5) ? ' lit' : '')} x={403} y={130} textAnchor="middle">Yes</text>
          {toks.map((k) => { const p = refs.current[k.r]; if (!p) return null; const L = p.getTotalLength(), f = k.e / DUR
            return <path key={'t' + k.id} d={PATHS[k.r]} className="fl-trail" style={{ strokeDasharray: `${L} ${L}`, strokeDashoffset: L * (1 - f), opacity: f > 0.85 ? (1 - f) / 0.15 : 1 }} /> })}
          {toks.map((k) => { const q = pos(k); return q && <g key={k.id} className="fl-tok" transform={`translate(${q.x} ${q.y})`}><circle r={9} className="halo" /><circle r={4.5} /></g> })}
          <Box x={4} y={116} w={116} h={48} a="Deal moves to" b="Negotiation" cls="start" />
          <Box x={148} y={116} w={136} h={48} a="Approvals agent" b="checks the deal" cls="agent" hot={agentHot} />
          <Diamond cx={344} cy={140} a="Over" b="$100k?" />
          <Diamond cx={462} cy={140} a="Discount?" />
          <g onClick={() => toggle('mgr')} className="fl-hit"><Box x={548} y={28} w={140} h={44} a="Sales manager" b={`up to ${fin}%`} hot={at('mgr')} cls={'route' + (ed ? ' edited' : '')} /></g>
          <g onClick={() => toggle('fin')} className="fl-hit"><Box x={548} y={118} w={140} h={44} a="Manager, then Finance" b={`${fin}% to 35%`} hot={at('fin')} cls={'route' + (ed ? ' edited' : '')} /></g>
          <g onClick={() => toggle('cro')} className="fl-hit"><Box x={548} y={208} w={140} h={44} a="CRO" b="over 35%" hot={at('cro')} cls="route" /></g>
          <g onClick={() => toggle('none')} className="fl-hit"><Box x={548} y={276} w={140} h={40} a="No approval needed" hot={at('none')} cls="route" /></g>
          <Box x={716} y={116} w={100} h={48} a="Record" b="unlocks" cls="end" />
          {(['mgr', 'fin', 'cro', 'none'] as Route[]).map((r) => {
            const y = { mgr: 22, fin: 112, cro: 202, none: 270 }[r]
            return <text key={r} className="fl-cnt" x={688} y={y} textAnchor="end">{counts[r]} this month</text>
          })}
        </svg>
      </div>
      <p className="fl-hint">Swipe to follow the routes</p>
      <p className="fl-cap" aria-live="polite" key={pick ?? last?.d.name ?? 'idle'}>
        {pick ? <><b>{{ none: 'No approval needed', mgr: 'Sales manager', fin: 'Manager, then Finance', cro: 'CRO' }[pick]}.</b> {why(pick)}. <button className="wl" onClick={() => { setPick(null); w.setPlaying(true) }}>Back to live</button></>
          : last ? <><span className="fl-ag">{AG.approvals.name} agent</span> routed <b>{last.d.name}</b> ({money(last.d.amt)} at {last.d.disc}% off): {why(last.r, last.d)}.</>
            : <>Deals leave Negotiation and take the route their size and discount send them down. Tap a route to see its rule.</>}
      </p>
    </div>
  )
}
