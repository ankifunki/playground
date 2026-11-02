import { useEffect, useRef, useState } from 'react'
import { CORPUS_TOTAL, INVENTORY, READS, SPOT, TOTALS } from './data'
import { Icon } from './Icon'
import { Ago } from './Job'
import { RM } from './logic'
import { useW } from './store'

const fmt = (n: number) => Math.round(n).toLocaleString()
const AUTOS = INVENTORY[1], PRACTICES = INVENTORY[INVENTORY.length - 1]

/**
 * What the agents know, in a form a CIO can repeat: what they read, what they wrote, and four plain questions
 * (complete, right, current, still learning), each answered with something checkable and opening its proof.
 * No "% checked": in a system that keeps learning, that number falls as it learns, and its 100% would mean
 * people reviewing everything.
 */
export function Corpus() {
  const w = useW()
  const [k, setK] = useState(RM ? 1 : 0)
  const [slack, setSlack] = useState(READS[0].n)
  const on = useRef(w.wireOn); on.current = w.wireOn

  // Counts rise from zero when the card first appears, and again when the tour asks (it was all written by agents).
  const countUp = () => {
    if (RM) { setK(1); return }
    const t0 = performance.now(), d = 1400
    const step = (t: number) => { const p = Math.min(1, (t - t0) / d); setK(1 - Math.pow(1 - p, 3)); if (p < 1) requestAnimationFrame(step) }
    setK(0); requestAnimationFrame(step)
  }
  useEffect(countUp, [])
  useEffect(() => { if (w.replayN) countUp() }, [w.replayN])
  // They are still reading.
  useEffect(() => {
    const t = window.setInterval(() => { if (on.current) setSlack((n) => n + 1 + Math.floor(Math.random() * 3)) }, 2200)
    return () => window.clearInterval(t)
  }, [])

  const toAsks = () => document.getElementById('asking-col')?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' })
  return (
    <section className="kn" id="corpus" aria-label="What the agents know">
      <div className="kn-flow">
        <div className="kn-read">
          <span className="tk">The agents read</span>
          <ul>{READS.map((r, i) => (
            <li key={r.what}><span className="pt"><Icon name={r.icon} size={14} /></span><b>{fmt((i === 0 ? slack : r.n) * k)}</b> {r.what}</li>
          ))}</ul>
        </div>
        <div className="kn-arrow" aria-hidden="true"><i /><Icon name="arrow-right" size={18} /></div>
        <div className="kn-wrote">
          <span className="tk">and wrote</span>
          <b className="kn-big">{fmt(CORPUS_TOTAL * k)}</b>
          <span className="kn-what">pages on how Northwind actually runs</span>
          <small>Most in the first week after the sources were connected on Oct 2. Nobody typed them.</small>
        </div>
      </div>

      <div className="kn-q">
        <button onClick={(e) => w.openProof('complete', e.currentTarget)}>
          <span className="tk">Is it complete?</span>
          <b>{AUTOS.have} of {AUTOS.of}</b>
          <span>automations in Salesforce explained, plus {PRACTICES.have} unwritten practices found so far</span>
          <span className="kn-more">What’s covered</span>
        </button>
        <button onClick={(e) => w.openProof('right', e.currentTarget)}>
          <span className="tk">Is it right?</span>
          <b>{SPOT.held} of {SPOT.checks}</b>
          <span>facts held up when {SPOT.by.split(' ')[0]} spot-checked them this month</span>
          <span className="kn-more">The {SPOT.checks - SPOT.held} corrections</span>
        </button>
        <button onClick={(e) => w.openProof('current', e.currentTarget)}>
          <span className="tk">Is it current?</span>
          <b>Within a day</b>
          <span>every page re-read against its sources, last one <Ago prefix="" />. {TOTALS.stale} look out of date</span>
          <span className="kn-more">What’s flagged</span>
        </button>
        <button onClick={toAsks}>
          <span className="tk">What doesn’t it know?</span>
          <b>{w.asks} questions</b>
          <span>the agents are asking people right now, instead of guessing</span>
          <span className="kn-more">Who they’re asking</span>
        </button>
      </div>
    </section>
  )
}
