import type React from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AUTO, CORPUS_TOTAL, INVENTORY, READS, SPOT } from './data'
import { Icon } from './Icon'
import { RM } from './logic'
import { useW } from './store'

const fmt = (n: number) => Math.round(n).toLocaleString()
const AUTOS = INVENTORY[1]
type Seg = 'own' | 'ready' | 'complete' | 'current' | 'unknown' | 'shadow'
const ORDER: Seg[] = ['own', 'ready', 'complete', 'current', 'unknown', 'shadow']
/** Three looks, three statuses: what you see is what it means. The reasons behind "not yet" live in its drawer. */
type State = 'own' | 'ready' | 'notyet'
const NOTYET: Seg[] = ['complete', 'current', 'unknown', 'shadow']
const stateOf = (s: Seg): State => (s === 'own' || s === 'ready' ? s : 'notyet')
const MEMBERS: Record<State, Seg[]> = { own: ['own'], ready: ['ready'], notyet: NOTYET }
const SAYS: Record<State, string> = { own: 'runs on its own', ready: 'is proven and needs your OK', notyet: 'not yet' }

/**
 * The lines, drawn as one SVG so they sit on whole pixels and keep an even rhythm at any density.
 * Upright and crisp for runs-on-its-own and not-yet; true diagonals for proven-and-waiting.
 */
export function Lines({ ticks, lit, h }: { ticks: string[]; lit?: (s: never) => boolean; h: number }) {
  const ref = useRef<SVGSVGElement>(null), [W, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current?.parentElement; if (!el) return
    const set = () => setW(Math.floor(el.clientWidth)); set()
    const ro = new ResizeObserver(set); ro.observe(el); return () => ro.disconnect()
  }, [])
  const N = ticks.length, step = W / N, sk = Math.min(10, h * 0.3)
  return (
    <svg ref={ref} className="kn-lines" width={W || undefined} height={h} viewBox={`0 0 ${W || 1} ${h}`} aria-hidden="true">
      {W > 0 && ticks.map((s, i) => {
        const x = Math.round(i * step + step / 2) + 0.5, cls = lit && !lit(s as never) ? 'dim' : undefined, d = { animationDelay: Math.round((i / N) * 700) + 'ms' }
        return s === 'ready'
          ? <line key={i} data-s={s} className={cls} x1={x + sk / 2} y1={0} x2={x - sk / 2} y2={h} style={d} />
          : <line key={i} data-s={s} className={cls} x1={x} y1={0} x2={x} y2={h} shapeRendering="crispEdges" style={d} />
      })}
    </svg>
  )
}

/** Requests per line: 10, or 25 on narrow screens so the lines stay distinct. */
function useUnit() {
  const q = () => (typeof matchMedia !== 'undefined' && matchMedia('(max-width: 640px)').matches ? 25 : 10)
  const [u, setU] = useState(q)
  useEffect(() => { const m = matchMedia('(max-width: 640px)'), f = () => setU(q()); m.addEventListener('change', f); return () => m.removeEventListener('change', f) }, [])
  return u
}

/** Eases a number to its target: from zero on mount and whenever `from0` changes (the tour replays it). */
function useTween(to: number, from0: number) {
  const [v, setV] = useState(RM ? to : 0), cur = useRef(RM ? to : 0)
  const run = (a: number) => {
    if (RM) { cur.current = to; setV(to); return }
    const t0 = performance.now(), d = 1100
    let raf = 0
    const step = (t: number) => { const p = Math.min(1, (t - t0) / d), x = a + (to - a) * (1 - Math.pow(1 - p, 3)); cur.current = x; setV(x); if (p < 1) raf = requestAnimationFrame(step) }
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf)
  }
  useEffect(() => run(cur.current), [to])
  useEffect(() => { if (from0) return run(0) }, [from0])
  return Math.round(v)
}

/**
 * The anchor of Home, in the CIO's terms: how much of Northwind's Salesforce admin work the agents are trusted to run
 * on their own, and what holds the rest back. One tick is 1% of last month's requests. The four questions below are
 * the levers: accuracy clears work to run alone, and gaps in completeness, currency and open questions hold it back.
 * The goal is 100%: the grey part is the hardest work, still done by people while the agents shadow it and earn it.
 */
export function Corpus() {
  const w = useW(), a = w.auto
  const [hi, setHi] = useState<Seg[] | null>(null)
  const [tip, setTip] = useState<{ s: State; x: number } | null>(null)
  const bar = useRef<HTMLDivElement>(null)
  const own = useTween(a.own, w.replayN)
  const share: Record<State, number> = { own: a.own, ready: a.ready, notyet: a.complete + a.current + a.unknown + a.shadow }

  // One line per 10 completed requests from the last 30 days (20 on phones, so lines never merge). Shares stay in %.
  const unit = useUnit(), lines = (pct: number) => Math.round((pct * AUTO.requests) / 100 / unit)
  const ticks = ORDER.flatMap((s) => Array.from({ length: lines(a[s]) }, () => s)), N = ticks.length
  const lit = (s: Seg) => !hi || hi.includes(s)
  const hover = (h: Seg[] | null) => ({ onMouseEnter: () => setHi(h), onMouseLeave: () => setHi(null), onFocus: () => setHi(h), onBlur: () => setHi(null) })
  const toAsks = () => document.getElementById('asking-col')?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' })
  // Point at a part to name it, tap it to open what's behind it.
  const segAt = (e: React.PointerEvent | React.MouseEvent) => {
    const r = bar.current!.getBoundingClientRect(), i = Math.max(0, Math.min(N - 1, Math.floor(((e.clientX - r.left) / r.width) * N)))
    const s = stateOf(ticks[i]), start = ticks.findIndex((t) => stateOf(t) === s), count = ticks.filter((t) => stateOf(t) === s).length, mid = ((start + count / 2) / N) * r.width
    return { s, x: Math.max(120, Math.min(r.width - 120, mid)) }
  }
  const point = (e: React.PointerEvent) => { const t = segAt(e); setTip(t); setHi(MEMBERS[t.s]) }
  const leave = () => { setTip(null); setHi(null) }
  const open = (e: React.MouseEvent) => {
    const { s } = segAt(e)
    if (s === 'ready' || s === 'notyet') w.openProof(s, e.currentTarget as HTMLElement)
  }

  return (
    <section className="kn" id="corpus" aria-label="Trusted to run on its own">
      <div className="kn-top">
        <div className="kn-head">
          <span className="tk">Trusted to run on its own</span>
          <div className="kn-num"><b className="kn-big">{own}%</b><span className="kn-what">of Northwind’s Salesforce admin work</span></div>
          <small>A person undid {AUTO.undone} of the last {fmt((AUTO.requests * AUTO.own) / 100)} requests the agents ran alone.
            {w.hand === 'sent' ? <span className="kn-ready on"> Asking Dev to hand over {a.ready}% more…</span>
              : a.ready > 0 && <> <button className="kn-ready" {...hover(['ready'])} onClick={(e) => w.openProof('ready', e.currentTarget)}>{a.ready}% more is ready to hand over</button></>}
          </small>
        </div>
      </div>

      <div className="kn-meter">
        <div className="kn-ny" style={{ left: a.own + a.ready + '%' }}>
          <button {...hover(NOTYET)} onClick={(e) => w.openProof('notyet', e.currentTarget)}><b>{share.notyet}%</b> not yet</button>
        </div>
        <div className={'kn-bar' + (hi ? ' hl' : '')} key={w.replayN} ref={bar} onPointerMove={point} onPointerDown={point} onPointerLeave={leave} onClick={open}
          role="img" aria-label={`${a.own}% runs on its own, ${a.ready}% is proven and needs your OK, ${share.notyet}% not yet.`}>
          <Lines ticks={ticks} lit={lit} h={40} />
        </div>
        {tip && <div className="kn-tip" style={{ left: tip.x }} aria-hidden="true"><b>{share[tip.s]}%</b> {SAYS[tip.s]} · {fmt((share[tip.s] * AUTO.requests) / 100)} requests</div>}
        <p className="kn-unit">Each line is {unit} of the {fmt(AUTO.requests)} requests completed in the last 30 days.</p>
      </div>

      <div className="kn-q">
        <button {...hover(['complete'])} onClick={(e) => w.openProof('complete', e.currentTarget)}>
          <span className="tk">Is it complete?</span>
          <span className="kn-st"><b>{AUTOS.have} of {AUTOS.of}</b><span>automations explained</span></span>
          <span className="kn-more">What’s covered</span>
        </button>
        <button {...hover(['own', 'ready'])} onClick={(e) => w.openProof('right', e.currentTarget)}>
          <span className="tk">Is it right?</span>
          <span className="kn-st"><b>{SPOT.held} of {SPOT.checks}</b><span>checks held up this month</span></span>
          <span className="kn-more">The {SPOT.checks - SPOT.held} corrections</span>
        </button>
        <button {...hover(['current'])} onClick={(e) => w.openProof('current', e.currentTarget)}>
          <span className="tk">Is it current?</span>
          <span className="kn-st"><b>Daily</b><span>every page re-read against its sources</span></span>
          <span className="kn-more">What’s out of date</span>
        </button>
        <button {...hover(['unknown'])} onClick={toAsks}>
          <span className="tk">What doesn’t it know?</span>
          <span className="kn-st"><b>{w.asks}</b><span>open questions, being asked now</span></span>
          <span className="kn-more">Who they’re asking</span>
        </button>
      </div>

    </section>
  )
}

/** What the agents built it from, in the masthead: proof it was assembled automatically, not the anchor. Slack keeps ticking. */
export function Built() {
  const w = useW()
  const [slack, setSlack] = useState(READS[0].n)
  const on = useRef(w.wireOn); on.current = w.wireOn
  useEffect(() => {
    const t = window.setInterval(() => { if (on.current) setSlack((n) => n + 1 + Math.floor(Math.random() * 3)) }, 2200)
    return () => window.clearInterval(t)
  }, [])
  return (
    <p className="hm-built">
      <span className="kn-pile" aria-hidden="true">{READS.map((r) => <span key={r.what} className="pt"><Icon name={r.icon} size={12} /></span>)}</span>
      <span>Built by 6 agents from {fmt(slack)} Slack messages, {fmt(READS[1].n)} tickets, six years of Salesforce changes, {READS[3].n} meetings and {READS[4].n} documents: {fmt(CORPUS_TOTAL)} pages, none typed by a person.</span>
    </p>
  )
}
