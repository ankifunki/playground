import { AG, Ag } from './agents'
import { INVENTORY, SPOT, TOTALS } from './data'
import { useW } from './store'

const fmt = (n: number) => Math.round(n).toLocaleString()
const AUTOS = INVENTORY[1]

/** Today's counts, derived from what has happened live so they move while you watch. */
export function useToday() {
  const w = useW(), ticks = Math.max(0, w.wire[0]?.id ?? 0)
  return {
    observed: 1240 + ticks * 3,
    learned: 6 + (w.learned ? 1 : 0),
    rewrote: 23 + (w.cfg !== 'idle' ? 1 : 0) + (w.learned ? 1 : 0),
  }
}

/**
 * The anchor of Home: the knowledge, live. What the agents observed, learned and rewrote today, each opening the list
 * behind it, and the latest thing they did, as it happens. Read-only.
 */
export function Today() {
  const w = useW(), t = useToday(), last = w.wire[0]
  return (
    <section className="td" id="corpus" aria-label="Today">
      <span className="tk">Today, so far</span>
      <div className="td-n">
        <button onClick={(e) => w.openProof('observed', e.currentTarget)}><b>{fmt(t.observed)}</b><span>changes observed</span><span className="td-sub">in Salesforce, Slack, tickets and meetings</span></button>
        <button onClick={(e) => w.openProof('learnt', e.currentTarget)}><b>{t.learned}</b><span>things learned</span><span className="td-sub">practice nobody had written down</span></button>
        <button onClick={(e) => w.openProof('rewrote', e.currentTarget)}><b>{t.rewrote}</b><span>pages rewritten</span><span className="td-sub">to match what changed</span></button>
      </div>
      {last && <p className="td-live" key={last.id}><span className="pdot" /><Ag id={last.ag} /><span className="td-lt"><b className="agw">{AG[last.ag].name}</b> {last.t.charAt(0).toLowerCase() + last.t.slice(1)}</span><span className="tk">just now</span></p>}
    </section>
  )
}

/** Proof that the knowledge can be trusted: four questions about the knowledge itself, each opening its evidence. */
export function Proof() {
  const w = useW()
  const toAsks = () => document.getElementById('asking-col')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  return (
    <section className="pr" aria-label="Can you trust it?">
      <h2 className="pr-h">Can you trust it?</h2>
      <div className="kn-q">
        <button onClick={(e) => w.openProof('complete', e.currentTarget)}>
          <span className="tk">Is it complete?</span>
          <span className="kn-st"><b>{AUTOS.have} of {AUTOS.of}</b><span>automations in Salesforce explained</span></span>
          <span className="kn-more">What’s covered</span>
        </button>
        <button onClick={(e) => w.openProof('right', e.currentTarget)}>
          <span className="tk">Is it right?</span>
          <span className="kn-st"><b>{SPOT.held} of {SPOT.checks}</b><span>facts held up when a sysadmin checked</span></span>
          <span className="kn-more">The {SPOT.checks - SPOT.held} corrections</span>
        </button>
        <button onClick={(e) => w.openProof('current', e.currentTarget)}>
          <span className="tk">Is it current?</span>
          <span className="kn-st"><b>Daily</b><span>every page re-read; {TOTALS.stale} flagged out of date</span></span>
          <span className="kn-more">What’s out of date</span>
        </button>
        <button onClick={toAsks}>
          <span className="tk">What doesn’t it know?</span>
          <span className="kn-st"><b>{w.asks}</b><span>questions the agents are asking people</span></span>
          <span className="kn-more">Who they’re asking</span>
        </button>
      </div>
    </section>
  )
}
