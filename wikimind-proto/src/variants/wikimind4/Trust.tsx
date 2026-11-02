import type React from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
import { AG, Ag, AGENTS, type AgentId } from './agents'
import { useW } from './store'

/** A small trend line. Values are drawn left to right, newest last. */
function Spark({ v, label }: { v: number[]; label: string }) {
  const W = 96, H = 26, lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1
  const pts = v.map((x, i) => `${((i / (v.length - 1)) * W).toFixed(1)},${(H - 3 - ((x - lo) / r) * (H - 6)).toFixed(1)}`)
  const last = pts[pts.length - 1].split(',')
  return (
    <svg className="tsp" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={label}>
      <polyline points={pts.join(' ')} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r={2} fill="currentColor" />
    </svg>
  )
}

const MISSES: [string, string, string, AgentId][] = [
  ['Oct 21', 'Reset a contractor’s password without checking with their manager.', 'Contractors now go through their manager first.', 'access'],
  ['Oct 9', 'Closed a failed-login alert as VPN noise. It was a real attempt.', 'Monday spikes are no longer assumed safe.', 'security'],
  ['Sep 30', 'Added a contractor to an internal channel.', 'Contractors get the template channels only.', 'access'],
]

/**
 * Bars on a fixed whole-pixel pitch, so every gap is identical: 2px bars every 5px on wide screens, every 3px on phones.
 * The count follows the width, and the row starts on a device-pixel boundary so nothing lands on a half pixel.
 */
function useBars(ref: React.RefObject<HTMLDivElement | null>) {
  const [m, setM] = useState({ n: 200, pitch: 5, shift: 0 })
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect(), dpr = devicePixelRatio || 1, pitch = r.width >= 560 ? 5 : 3
      const shift = (Math.ceil(r.left * dpr) - r.left * dpr) / dpr
      const n = Math.max(20, Math.floor((r.width - shift + pitch - 2) / pitch))
      setM((o) => (o.n === n && o.pitch === pitch && Math.abs(o.shift - shift) < 0.01 ? o : { n, pitch, shift }))
    }
    measure()
    const ro = new ResizeObserver(measure); ro.observe(el); addEventListener('resize', measure)
    return () => { ro.disconnect(); removeEventListener('resize', measure) }
  }, [ref])
  return m
}

/** Each specialist agent: its job, how reliable it is, how much of its job runs on its own, and what is holding it back. */
function Agents() {
  const w = useW(), t = w.tv
  const auto: Record<AgentId, number> = { approvals: 52, access: 78 + (t.hand === 'done' ? 4 : 0), security: 41 + (t.acc.okta === 'done' ? 8 : 0), finance: 58 + (t.acc.netsuite === 'done' ? 5 : 0), integrations: 70, support: 74 }
  const hold: Partial<Record<AgentId, [string, 'warn' | 'ok']>> = {
    approvals: w.learned ? ['Maria answered', 'ok'] : ['Asking Maria', 'warn'],
    security: t.acc.okta === 'done' ? ['Okta logs granted', 'ok'] : ['Needs Okta logs', 'warn'],
    finance: t.acc.netsuite === 'done' ? ['NetSuite granted', 'ok'] : ['Needs NetSuite write', 'warn'],
    integrations: ['Asking Ben Ito', 'warn'],
  }
  if (t.hand === 'done') hold.access = ['Seats handed over', 'ok']
  return (
    <div className="agents3">
      <div className="tml"><b>The agents</b><span>{AGENTS.length} agents, one job each</span></div>
      <ul className="agl">
        {AGENTS.map((a) => (
          <li key={a.id}>
            <Ag id={a.id} size={32} />
            <span className="agnm"><b>{a.name}</b><small>{a.job}</small></span>
            <span className="agrel"><span className="tk">Reliability</span><b>{a.rel.toFixed(1)}%</b></span>
            <span className="agau"><span className="tk">On its own</span><span className="agbar"><i style={{ width: auto[a.id] + '%' }} /></span><b>{auto[a.id]}%</b></span>
            <span className="agst">{hold[a.id] && <span className={'tdone' + (hold[a.id]![1] === 'warn' ? ' wait' : '')}>{hold[a.id]![0]}</span>}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Home leads with trust: how reliable the agents are, how much already runs on its own,
 * and what blocks the rest. Numbers are demo data.
 */
export function TrustVectors() {
  const w = useW(), { auto, asks, blocked } = w.tvNums, t = w.tv
  // Runs on its own, then asks first, then blocked; each bar is an equal share of 100%.
  const track = useRef<HTMLDivElement>(null), { n: N, pitch, shift } = useBars(track), per = 100 / N
  const nA = Math.round(auto / per), nB = blocked > 0 ? Math.max(1, Math.round(blocked / per)) : 0
  const segs = Array.from({ length: N }, (_, i) => (i < nA ? 'a' : i >= N - nB ? 'b' : 'p'))
  const btn = (step: string, label: string, on: () => void) =>
    step === 'idle' ? <button className="tgl press" onClick={on}>{label}</button> : step === 'sent' ? <span className="tdone wait">Sent to Dev</span> : <span className="tdone">Done</span>
  return (
    <section className="trust3" aria-label="How far you can trust the agents">
      <div className="tpath">
        <div className="tml"><b>Path to full automation</b><span>{auto}%</span></div>
        <div className="tbar3" ref={track} role="img" aria-label={`${auto}% runs on its own, ${asks}% asks a person first, ${blocked}% blocked by gaps or access`}>
          <div className="tbars" style={{ gap: pitch - 2, marginLeft: shift }}>
            {segs.map((k, i) => <i key={i} className={k} style={{ '--d': `${Math.round((i * 700) / N)}ms` } as React.CSSProperties} />)}
            <span className="tfc" aria-hidden="true">Full automation</span>
          </div>
        </div>
        <div className="tleg3"><span><i className="a" />Runs on its own {auto}%</span><span><i className="p" />Asks a person first {asks}%</span><span><i className="b" />Blocked by gaps or access {blocked}%</span></div>
      </div>
      <div className="tvs">
        <div className="tv">
          <div className="tk">Reliability</div>
          <div className="tn"><b>98.6%</b><Spark v={[97.1, 97.4, 97.9, 98.0, 98.3, 98.2, 98.6]} label="Reliability over the last 7 weeks, rising to 98.6%" /></div>
          <p>matched a person across 1,912 decisions in 30 days</p>
          <button className="wl" onClick={w.tvMiss} aria-expanded={t.miss}>{t.miss ? 'Hide the misses' : 'See the 3 misses'}</button>
          {t.miss && <ul className="tmini">{MISSES.map(([d, what, fix, ag]) => <li key={d}><span className="tk">{d}</span><span>{what}<small><b className="agw">{AG[ag].name}</b> · since then: {fix.charAt(0).toLowerCase() + fix.slice(1)}</small></span></li>)}</ul>}
        </div>
        <div className="tv">
          <div className="tk">Automation</div>
          <div className="tn"><b>{auto}%</b><Spark v={[51, 54, 55, 58, 60, 62, auto]} label={`Share running without a person, up from 51% in September to ${auto}%`} /></div>
          <p>runs on its own, up from 51% in September</p>
          {t.hand !== 'done' ? (
            <div className="tvb"><span><b>License seats</b><small><b className="agw">Access</b> · 58 of 60 matched your call</small></span>{btn(t.hand, 'Hand it over', w.tvHand)}</div>
          ) : (
            <div className="tnext"><span className="tdone">License seats handed over</span><small><b className="agw">Access</b> · next: offboarding, after 8 clean runs</small></div>
          )}
        </div>
        <div className="tv">
          <div className="tk">Gaps and access</div>
          <div className="tn"><b>{blocked}%</b></div>
          <p>blocked by missing access or knowledge</p>
          <GapPager items={[
            { t: 'Okta sign-in logs, read', ag: 'Security', s: '4% of its work', act: btn(t.acc.okta, 'Grant', () => w.tvAcc('okta')) },
            { t: 'NetSuite, write', ag: 'Finance ops', s: '2% of its work', act: btn(t.acc.netsuite, 'Grant', () => w.tvAcc('netsuite')) },
            { t: 'Why flat renewals skip approval', ag: 'Approvals', s: w.learned ? 'Maria answered' : 'asked Maria Okafor', act: w.learned ? <span className="tdone">Done</span> : <button className="tgl press" onClick={() => w.go('page', { sec: 'practice' })}>Follow</button> },
          ]} />
          <small className="tfoot">Close every gap: up to 81% on its own</small>
        </div>
      </div>
      <Agents />
    </section>
  )
}

/** One gap at a time, in the same row style as the other cards, with previous / next and "2 of 3". Keeps the three cards the same height. */
function GapPager({ items }: { items: { t: string; ag: string; s: string; act: React.ReactNode }[] }) {
  const [i, setI] = useState(0), n = items.length, x = items[i]
  const go = (d: number) => setI((v) => (v + d + n) % n)
  return (
    <div className="tpg">
      <div className="tvb" key={i}><span><b>{x.t}</b><small><b className="agw">{x.ag}</b> · {x.s}</small></span>{x.act}</div>
      <div className="tpg-n">
        <button className="ibtn sm" onClick={() => go(-1)} aria-label="Previous gap" title="Previous"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg></button>
        <span className="tk" aria-live="polite">{i + 1} of {n}</span>
        <button className="ibtn sm" onClick={() => go(1)} aria-label="Next gap" title="Next"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg></button>
      </div>
    </div>
  )
}
