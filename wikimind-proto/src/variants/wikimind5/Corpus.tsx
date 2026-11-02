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
const GAPS: Seg[] = ['complete', 'current', 'unknown']

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

/** Weekly share running on its own since September, ending at today's value. 1.5px trend. */
function Spark({ pts }: { pts: number[] }) {
  const W = 120, H = 36, lo = 45, hi = 75
  const xy = pts.map((p, i) => [(i / (pts.length - 1)) * (W - 6) + 3, H - 3 - ((p - lo) / (hi - lo)) * (H - 6)])
  const [ex, ey] = xy[xy.length - 1]
  return (
    <svg className="kn-spark" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
      <polyline points={xy.map((p) => p.join(',')).join(' ')} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={ex} cy={ey} r="3" fill="currentColor" />
    </svg>
  )
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
  const [slack, setSlack] = useState(READS[0].n)
  const on = useRef(w.wireOn); on.current = w.wireOn
  const own = useTween(a.own, w.replayN)
  const gaps = a.complete + a.current + a.unknown, reach = 100 - a.person, cleared = a.own + a.ready
  // They are still reading.
  useEffect(() => {
    const t = window.setInterval(() => { if (on.current) setSlack((n) => n + 1 + Math.floor(Math.random() * 3)) }, 2200)
    return () => window.clearInterval(t)
  }, [])

  const ticks = ORDER.flatMap((s) => Array.from({ length: a[s] }, () => s))
  const lit = (s: Seg) => !hi || hi.includes(s)
  const hover = (h: Seg[] | null) => ({ onMouseEnter: () => setHi(h), onMouseLeave: () => setHi(null), onFocus: () => setHi(h), onBlur: () => setHi(null) })
  const toAsks = () => document.getElementById('asking-col')?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' })
  const trend = [...AUTO.trend.slice(0, -1), a.own]

  return (
    <section className="kn" id="corpus" aria-label="Trusted to run on its own">
      <div className="kn-top">
        <div className="kn-head">
          <span className="tk">Trusted to run on its own</span>
          <div className="kn-num"><b className="kn-big">{own}%</b><span className="kn-what">of Northwind’s Salesforce admin work</span></div>
          <small>A person undid {AUTO.undone} of the last {fmt((AUTO.requests * AUTO.own) / 100)} requests the agents ran alone.</small>
        </div>
        <div className="kn-trend"><Spark pts={trend} /><span className="tk">Up from {AUTO.sept}% in September</span></div>
      </div>

      <div className="kn-meter">
        <div className="kn-reach" style={{ left: reach + '%' }}><span className="tk">{reach}% is the most it can reach</span></div>
        <div className="kn-bar" key={w.replayN} role="img" aria-label={`${a.own}% runs on its own, ${a.ready}% is proven and needs your OK, ${gaps}% is held back by gaps in what the agents know, ${a.person}% stays with a person by policy.`}>
          {ticks.map((s, i) => <i key={i} data-s={s} className={lit(s) ? '' : 'dim'} style={{ '--i': i } as React.CSSProperties} />)}
        </div>
        <div className="kn-key">
          <div {...hover(['own'])}><span className="kn-sw" data-s="own" /><span>Runs on its own<b>{a.own}%</b></span></div>
          <button {...hover(['ready'])} onClick={(e) => w.openProof('ready', e.currentTarget)} disabled={a.ready === 0 && w.hand === 'idle'}>
            <span className="kn-sw" data-s="ready" /><span>Proven, needs your OK<b>{a.ready}%</b></span>
            {(a.ready > 0 || w.hand === 'sent') && <span className="kn-more">{w.hand === 'sent' ? 'Asking Dev…' : 'Hand it over'}</span>}
          </button>
          <div {...hover(GAPS)}><span className="kn-sw" data-s="complete" /><span>Held back by gaps<b>{gaps}%</b></span></div>
          <button {...hover(['person'])} onClick={(e) => w.openProof('person', e.currentTarget)}>
            <span className="kn-sw" data-s="person" /><span>Stays with a person<b>{a.person}%</b></span><span className="kn-more">By policy</span>
          </button>
        </div>
      </div>

      <div className="kn-q">
        <button {...hover(['complete'])} onClick={(e) => w.openProof('complete', e.currentTarget)}>
          <span className="tk">Is it complete?</span>
          <b>{AUTOS.have} of {AUTOS.of}</b>
          <span>automations in Salesforce explained, plus {PRACTICES.have} unwritten practices found so far</span>
          <span className="kn-hold"><i data-s="complete" />Holds back {a.complete}%</span>
          <span className="kn-more">What’s covered</span>
        </button>
        <button {...hover(['own', 'ready'])} onClick={(e) => w.openProof('right', e.currentTarget)}>
          <span className="tk">Is it right?</span>
          <b>{SPOT.held} of {SPOT.checks}</b>
          <span>facts held up when {SPOT.by.split(' ')[0]} spot-checked them this month</span>
          <span className="kn-hold"><i data-s="own" />Cleared {cleared}% to run alone</span>
          <span className="kn-more">The {SPOT.checks - SPOT.held} corrections</span>
        </button>
        <button {...hover(['current'])} onClick={(e) => w.openProof('current', e.currentTarget)}>
          <span className="tk">Is it current?</span>
          <b>Within a day</b>
          <span>every page re-read against its sources, last one <Ago prefix="" />. {TOTALS.stale} look out of date</span>
          <span className="kn-hold"><i data-s="current" />Holds back {a.current}%</span>
          <span className="kn-more">What’s flagged</span>
        </button>
        <button {...hover(['unknown'])} onClick={toAsks}>
          <span className="tk">What doesn’t it know?</span>
          <b>{w.asks} questions</b>
          <span>the agents are asking people right now, instead of guessing</span>
          <span className="kn-hold"><i data-s="unknown" />Holds back {a.unknown}%</span>
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
