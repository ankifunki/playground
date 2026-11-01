import { useW } from './store'

/** A small trend line. Values are drawn left to right, newest last. */
function Spark({ v, label }: { v: number[]; label: string }) {
  const W = 96, H = 26, lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1
  const pts = v.map((x, i) => `${((i / (v.length - 1)) * W).toFixed(1)},${(H - 3 - ((x - lo) / r) * (H - 6)).toFixed(1)}`)
  const last = pts[pts.length - 1].split(',')
  return (
    <svg className="tsp" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={label}>
      <polyline points={pts.join(' ')} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.6} fill="currentColor" />
    </svg>
  )
}

const MISSES: [string, string, string][] = [
  ['Oct 21', 'Reset a contractor’s password without checking with their manager.', 'Contractors now go through their manager first.'],
  ['Oct 9', 'Closed a failed-login alert as VPN noise. It was a real attempt.', 'Monday spikes are no longer assumed safe.'],
  ['Sep 30', 'Added a contractor to an internal channel.', 'Contractors get the template channels only.'],
]

/**
 * Home leads with trust: how reliable Asoka is, how much already runs on its own,
 * and what blocks the rest. Numbers are demo data.
 */
export function TrustVectors() {
  const w = useW(), { auto, asks, blocked } = w.tvNums, t = w.tv
  const btn = (step: string, label: string, on: () => void) =>
    step === 'idle' ? <button className="tgl press" onClick={on}>{label}</button> : step === 'sent' ? <span className="tdone wait">Sent to Dev</span> : <span className="tdone">Done</span>
  return (
    <section className="trust3" aria-label="How far you can trust Asoka">
      <div className="tpath">
        <div className="tml"><b>Path to full automation</b><span>{auto}% runs on its own</span></div>
        <div className="tbar3" role="img" aria-label={`${auto}% runs on its own, ${asks}% asks a person first, ${blocked}% blocked by gaps or access`}>
          <i className="a" style={{ flexBasis: auto + '%' }} /><i className="p" style={{ flexBasis: asks + '%' }} /><i className="b" style={{ flexBasis: blocked + '%' }} />
          <span className="tfc" aria-hidden="true">Full automation</span>
        </div>
        <div className="tleg3"><span><i className="a" />Runs on its own {auto}%</span><span><i className="p" />Asks a person first {asks}%</span><span><i className="b" />Blocked by gaps or access {blocked}%</span></div>
      </div>
      <div className="tvs">
        <div className="tv">
          <div className="tk">Reliability</div>
          <div className="tn"><b>98.6%</b><Spark v={[97.1, 97.4, 97.9, 98.0, 98.3, 98.2, 98.6]} label="Reliability over the last 7 weeks, rising to 98.6%" /></div>
          <p>matched what a person would do, across 1,912 decisions in 30 days. 3 were reversed.</p>
          <button className="wl" onClick={w.tvMiss} aria-expanded={t.miss}>{t.miss ? 'Hide the misses' : 'See the 3 misses'}</button>
          {t.miss && <ul className="tmini">{MISSES.map(([d, what, fix]) => <li key={d}><span className="tk">{d}</span><span>{what}<small>Since then: {fix}</small></span></li>)}</ul>}
        </div>
        <div className="tv">
          <div className="tk">Automation</div>
          <div className="tn"><b>{auto}%</b><Spark v={[51, 54, 55, 58, 60, 62, auto]} label={`Share running without a person, up from 51% in September to ${auto}%`} /></div>
          <p>runs without a person, up from 51% in September.</p>
          {t.hand !== 'done' ? (
            <div className="tvb"><span><b>License seats</b><small>58 of 60 matched your call. Ready to hand over.</small></span>{btn(t.hand, 'Hand it over', w.tvHand)}</div>
          ) : (
            <div className="tnext"><span className="tdone">License seats handed over</span><small>Next: offboarding, after 8 more clean runs.</small></div>
          )}
        </div>
        <div className="tv">
          <div className="tk">Gaps and access</div>
          <div className="tn"><b>{blocked}%</b></div>
          <p>blocked by what Asoka can’t reach or doesn’t know yet.</p>
          <ul className="tmini">
            <li><span><b>Okta sign-in logs, read</b><small>Blocks 4% of security work.</small></span>{btn(t.acc.okta, 'Grant', () => w.tvAcc('okta'))}</li>
            <li><span><b>NetSuite, write</b><small>Blocks 2% of finance work.</small></span>{btn(t.acc.netsuite, 'Grant', () => w.tvAcc('netsuite'))}</li>
            <li><span><b>Why flat renewals skip approval</b><small>{w.learned ? 'Maria answered. Resolved.' : 'Asked Maria Okafor in RevOps.'}</small></span>{w.learned ? <span className="tdone">Done</span> : <button className="tgl press" onClick={() => w.go('page', { tab: 'talk' })}>Follow</button>}</li>
          </ul>
          <small className="tfoot">Close every gap and up to 81% could run on its own.</small>
        </div>
      </div>
    </section>
  )
}
