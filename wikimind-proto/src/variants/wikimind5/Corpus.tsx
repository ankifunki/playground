import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { AUTO, CORPUS_TOTAL, INVENTORY, READS, SPOT, TOTALS } from './data'
import { Icon } from './Icon'
import { Ago } from './Job'
import { RM } from './logic'
import { useW } from './store'

const fmt = (n: number) => Math.round(n).toLocaleString()
const AUTOS = INVENTORY[1], PRACTICES = INVENTORY[INVENTORY.length - 1]
type Seg = 'own' | 'ready' | 'complete' | 'current' | 'unknown' | 'person'
const ORDER: Seg[] = ['own', 'ready', 'complete', 'current', 'unknown', 'person']
/** What each part of the bar is, said where the reader is looking (on hover or tap), instead of in a legend. */
const SAYS: Record<Seg, string> = {
  own: 'of the work runs on its own', ready: 'is proven and needs your OK', complete: `waits while ${AUTO.confirming} practices are confirmed`,
  current: `waits while ${TOTALS.stale} out-of-date pages are re-checked`, unknown: 'waits on answers to open questions', person: 'stays with a person, by your policy',
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
 * It never reaches 100% by design, because Northwind's policy keeps some decisions with a person.
 */
export function Corpus() {
  const w = useW(), a = w.auto
  const [hi, setHi] = useState<Seg[] | null>(null)
  const [tip, setTip] = useState<{ s: Seg; x: number } | null>(null)
  const bar = useRef<HTMLDivElement>(null)
  const [slack, setSlack] = useState(READS[0].n)
  const on = useRef(w.wireOn); on.current = w.wireOn
  const own = useTween(a.own, w.replayN)
  const cleared = a.own + a.ready
  // They are still reading.
  useEffect(() => {
    const t = window.setInterval(() => { if (on.current) setSlack((n) => n + 1 + Math.floor(Math.random() * 3)) }, 2200)
    return () => window.clearInterval(t)
  }, [])

  const ticks = ORDER.flatMap((s) => Array.from({ length: a[s] }, () => s))
  const lit = (s: Seg) => !hi || hi.includes(s)
  const hover = (h: Seg[] | null) => ({ onMouseEnter: () => setHi(h), onMouseLeave: () => setHi(null), onFocus: () => setHi(h), onBlur: () => setHi(null) })
  const toAsks = () => document.getElementById('asking-col')?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' })
  // The bar explains itself: point at a part to name it, tap it to see its proof.
  const segAt = (e: React.PointerEvent | React.MouseEvent) => {
    const r = bar.current!.getBoundingClientRect(), i = Math.max(0, Math.min(99, Math.floor(((e.clientX - r.left) / r.width) * 100)))
    const s = ticks[i], start = ticks.indexOf(s), mid = ((start + a[s] / 2) / 100) * r.width
    return { s, x: Math.max(150, Math.min(r.width - 150, mid)) }
  }
  const point = (e: React.PointerEvent) => { const t = segAt(e); setTip(t); setHi([t.s]) }
  const leave = () => { setTip(null); setHi(null) }
  const open = (e: React.MouseEvent) => {
    const { s } = segAt(e)
    if (s === 'ready' || s === 'person' || s === 'complete' || s === 'current') w.openProof(s, e.currentTarget as HTMLElement)
    else if (s === 'unknown') toAsks()
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
        <div className="kn-pol" style={{ left: 100 - a.person + '%' }}>
          <button {...hover(['person'])} onClick={(e) => w.openProof('person', e.currentTarget)}><b>{a.person}%</b> stays with a person, by your policy</button>
        </div>
        <div className="kn-bar" key={w.replayN} ref={bar} onPointerMove={point} onPointerDown={point} onPointerLeave={leave} onClick={open}
          role="img" aria-label={`${a.own}% runs on its own, ${a.ready}% is proven and needs your OK, ${a.complete + a.current + a.unknown}% is held back by gaps in what the agents know, ${a.person}% stays with a person by policy.`}>
          {ticks.map((s, i) => <i key={i} data-s={s} className={lit(s) ? '' : 'dim'} style={{ '--i': i } as React.CSSProperties} />)}
        </div>
        {tip && <div className="kn-tip" style={{ left: tip.x }} aria-hidden="true"><b>{a[tip.s]}%</b> {SAYS[tip.s]}</div>}
      </div>

      <div className="kn-q">
        <button {...hover(['complete'])} onClick={(e) => w.openProof('complete', e.currentTarget)}>
          <span className="tk">Is it complete?</span>
          <b>{AUTOS.have} of {AUTOS.of}</b>
          <span>automations in Salesforce explained, plus {PRACTICES.have} unwritten practices found so far</span>
          <span className="kn-hold"><i data-s="complete" /><span><b>{a.complete}%</b> of the work waits while {AUTO.confirming} practices are confirmed</span></span>
          <span className="kn-more">What’s covered</span>
        </button>
        <button {...hover(['own', 'ready'])} onClick={(e) => w.openProof('right', e.currentTarget)}>
          <span className="tk">Is it right?</span>
          <b>{SPOT.held} of {SPOT.checks}</b>
          <span>facts held up when {SPOT.by.split(' ')[0]} spot-checked them this month</span>
          <span className="kn-hold"><i data-s="own" /><span><b>{cleared}%</b> of the work is cleared to run alone</span></span>
          <span className="kn-more">The {SPOT.checks - SPOT.held} corrections</span>
        </button>
        <button {...hover(['current'])} onClick={(e) => w.openProof('current', e.currentTarget)}>
          <span className="tk">Is it current?</span>
          <b>Within a day</b>
          <span>every page re-read against its sources, last one <Ago prefix="" /></span>
          <span className="kn-hold"><i data-s="current" /><span><b>{a.current}%</b> of the work waits while {TOTALS.stale} out-of-date pages are re-checked</span></span>
          <span className="kn-more">What’s flagged</span>
        </button>
        <button {...hover(['unknown'])} onClick={toAsks}>
          <span className="tk">What doesn’t it know?</span>
          <b>{w.asks} questions</b>
          <span>the agents are asking people right now, instead of guessing</span>
          <span className="kn-hold"><i data-s="unknown" /><span><b>{a.unknown}%</b> of the work waits on their answers</span></span>
          <span className="kn-more">Who they’re asking</span>
        </button>
      </div>

      <p className="kn-foot">
        <span className="kn-pile" aria-hidden="true">{READS.map((r) => <span key={r.what} className="pt"><Icon name={r.icon} size={12} /></span>)}</span>
        <span>Built by the agents from {fmt(slack)} Slack messages, {fmt(READS[1].n)} tickets, six years of Salesforce changes, {READS[3].n} meetings and {READS[4].n} documents: {fmt(CORPUS_TOTAL)} pages, none typed by a person.</span>
      </p>
    </section>
  )
}
