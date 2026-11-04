import { useEffect, useMemo, useRef, useState } from 'react'
import { AG, AGENTS, ago, SPACES, type AgentId } from './data'
import { MiniBar, REL } from './Home'
import { Icon } from './Icon'
import { Ag, LivePulse } from './Live'
import { RM, useW } from './store'

/*
 * Wikimind 8b: every agent's full picture in one place. A strip of totals (each one a filter), one row per agent with
 * what it knows (its pages as tiles), what it runs on its own, its reliability and what it is doing right now, and a
 * profile per agent in the right panel to dig deeper. Demo data.
 */

export type St = 'ver' | 'cur' | 'old' | 'ask'
export const STATE: Record<St, string> = { ver: 'Verified by a person', cur: 'Current, re-read today', old: 'Out of date', ask: 'Open question' }
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x) }

/** Questions each agent is asking people right now. */
function questions(ag: AgentId, renewalAnswered: boolean, cpqFixed: boolean) {
  const q: Record<AgentId, { q: string; who: string }[]> = {
    approvals: [...(renewalAnswered ? [] : [{ q: 'Do flat renewals skip approval on purpose?', who: 'Asking Maria Okafor' }]), { q: 'Do EMEA deals go to the regional director first?', who: 'Watching for the next deal' }],
    access: [],
    security: [{ q: 'Who owns the Okta sign-in policy now?', who: 'Asking IT' }],
    finance: [{ q: 'Should invoice mismatches under $50 be corrected automatically?', who: 'Asking Dana Ruiz' }],
    integrations: cpqFixed ? [] : [{ q: 'Why do multi-currency quotes fail to sync?', who: 'Asking Ben Ito' }],
    support: [{ q: 'Is the data-loss escalation rule official?', who: 'Asking Kim in Support' }],
  }
  return q[ag]
}
const BLOCKERS: Partial<Record<AgentId, string>> = { security: 'Okta sign-in logs, from IT', finance: 'NetSuite write access, from Finance' }
type Job = { t: string; st: 'own' | 'ask' | 'people'; n: number }
const JOBS: Record<AgentId, Job[]> = {
  approvals: [{ t: 'Route large deals to approvers', st: 'own', n: 412 }, { t: 'Flat renewals over $100,000', st: 'ask', n: 14 }, { t: 'Discounts over 20%', st: 'people', n: 56 }],
  access: [{ t: 'New-hire Salesforce users', st: 'own', n: 96 }, { t: 'License seat reclaims', st: 'ask', n: 60 }, { t: 'Admin-rights grants', st: 'people', n: 8 }],
  security: [{ t: 'Sign-in alert triage', st: 'own', n: 240 }, { t: 'Access review prep', st: 'ask', n: 2 }, { t: 'Device wipes', st: 'people', n: 5 }],
  finance: [{ t: 'Invoice mismatch detection', st: 'own', n: 180 }, { t: 'Invoice corrections', st: 'ask', n: 42 }, { t: 'Payments', st: 'people', n: 30 }],
  integrations: [{ t: 'CPQ and NetSuite sync monitoring', st: 'own', n: 1200 }, { t: 'Sync retries', st: 'ask', n: 38 }, { t: 'Integration config changes', st: 'people', n: 4 }],
  support: [{ t: 'Case triage', st: 'own', n: 410 }, { t: 'Escalations to engineering', st: 'ask', n: 36 }, { t: 'Data-loss escalations', st: 'people', n: 11 }],
}
const JOB_ST = { own: 'Runs on its own', ask: 'Asks a person first', people: 'People decide; it shadows' }
const MISSES: Record<AgentId, number> = { approvals: 1, access: 1, security: 1, finance: 0, integrations: 0, support: 0 }
const NEWEST: Record<AgentId, string> = {
  approvals: 'Re-read Discount approvals against Salesforce', access: 'Updated Deal Desk: Priya Shah now leads it', security: 'Removed 14 stale API users from Access reviews',
  finance: 'Linked 3 invoice mismatches to NetSuite records', integrations: 'Asked Ben Ito why multi-currency quotes fail', support: 'Linked 3 cases to the data-loss escalation rule',
}

/** Every grove's pages as states (seeded, stable). Named pages sit first; open-question tiles match the questions. */
export function useGroves() {
  const w = useW(), answered = w.renewal === 'answered', fixed = w.cpq === 'fixed'
  return useMemo(() => SPACES.map((s, g) => {
    const qn = questions(s.ag, answered, fixed).length
    const askAt = new Set(Array.from({ length: qn }, (_, j) => s.pages.length + 3 + Math.floor(rnd(g * 77 + j) * (s.total - s.pages.length - 4))))
    const tiles = Array.from({ length: s.total }, (_, i): { st: St; page?: (typeof s.pages)[number] } => {
      const page = s.pages[i]
      if (page) return { st: 'ver', page }
      if (askAt.has(i)) return { st: 'ask' }
      const r = rnd(g * 1000 + i)
      return { st: r < 0.48 ? 'ver' : r < 0.92 ? 'cur' : 'old' }
    })
    const counts: Record<St, number> = { ver: 0, cur: 0, old: 0, ask: 0 }
    tiles.forEach((t) => counts[t.st]++)
    return { ...s, tiles, counts }
  }), [answered, fixed])
}

/** The tiles of one grove; a few light up at a time as the agent reads them (DOM classes, no re-render). */
function Tiles({ tiles, size = 'm' }: { tiles: { st: St; page?: { id: string; title: string } }[]; size?: 's' | 'm' }) {
  const w = useW(), root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (RM) return
    const els = root.current ? [...root.current.querySelectorAll<HTMLElement>('.km-t')] : []
    if (!els.length) return
    const id = window.setInterval(() => { const el = els[Math.floor(Math.random() * els.length)]; el.classList.add('obs'); window.setTimeout(() => el.classList.remove('obs'), 1200) }, 900 + Math.random() * 600)
    return () => window.clearInterval(id)
  }, [tiles])
  const writing = w.presence?.page
  return (
    <div className={'ov-tiles ' + size} ref={root} aria-hidden="true">
      {tiles.map((t, i) => <i key={i} className={'km-t ' + t.st + (t.page && writing === t.page.id ? ' w' : '')} />)}
    </div>
  )
}

/**
 * What an agent knows, as numbers: the page count, then one line of counts by state, each with a small colour key.
 * Deliberately no chart: the row's only chart is the runs-on-its-own bar, so nothing competes with it.
 */
function Know({ counts, total }: { counts: Record<St, number>; total: number }) {
  const short: Record<St, string> = { ver: 'verified', cur: 'current', old: 'out of date', ask: 'open' }
  return (
    <span className="kn">
      <b className="num">{total.toLocaleString('en-US')}<small> pages</small></b>
      <span className="kn-l">{(['ver', 'cur', 'old', 'ask'] as St[]).filter((k) => counts[k] > 0).map((k) => (
        <span key={k} className={'kn-s ' + k} title={STATE[k]}><i className={'km-t ' + k} />{counts[k]} {short[k]}</span>
      ))}</span>
    </span>
  )
}

type Filter = null | 'ver' | 'ask' | 'block' | 'own'

/** The overview: totals (each a filter) and one row per agent. Clicking a row opens the agent's profile. */
export function AgentsOverview() {
  const w = useW(), groves = useGroves(), [filter, setFilter] = useState<Filter>(null)
  const answered = w.renewal === 'answered', fixed = w.cpq === 'fixed'
  const total = groves.reduce((n, g) => n + g.total, 0), ver = groves.reduce((n, g) => n + g.counts.ver, 0)
  const qs = AGENTS.reduce((n, a) => n + questions(a.id, answered, fixed).length, 0), blockers = Object.keys(BLOCKERS).length
  const stats: { k: Filter; n: string; t: string }[] = [
    { k: null, n: total.toLocaleString('en-US'), t: 'pages, all written by agents' },
    { k: 'ver', n: ver.toLocaleString('en-US'), t: 'verified by a person' },
    { k: null, n: '64%', t: 'of the work runs on its own' },
    { k: null, n: '98.6%', t: 'reliability, 3 misses in 30 days' },
    { k: 'ask', n: String(qs), t: 'open questions to people' },
    { k: 'block', n: String(blockers), t: 'blockers' },
  ]
  return (
    <section className={'home-card ov' + (filter ? ' f-' + filter : '')} aria-label="What each agent knows and runs">
      <div className="nh-h"><h2>What each agent knows and runs</h2><span className="tk">Select an agent for its full profile</span></div>
      <ul className="ov-sum">
        {stats.map((s) => (
          <li key={s.t}>
            {s.k ? <button className={filter === s.k ? 'on' : ''} aria-pressed={filter === s.k} onClick={() => setFilter(filter === s.k ? null : s.k)}><b className="num">{s.n}</b><span>{s.t}</span></button>
              : <div><b className="num">{s.n}</b><span>{s.t}</span></div>}
          </li>
        ))}
      </ul>
      <div className="ov-head" aria-hidden="true"><span>Agent</span><span>What it knows</span><span>Runs on its own</span><span>Reliability</span><span>Right now</span></div>
      <ul className="ov-rows">
        {AGENTS.map((a) => {
          const g = groves.find((x) => x.ag === a.id)!, r = REL[a.id], q = questions(a.id, answered, fixed), live = w.presence?.ag === a.id
          const now = live && w.presence ? <><LivePulse />Writing {w.presence.label}</> : q[0]?.who.startsWith('Asking') ? <><Icon name="circle-help" size={12} />{q[0].who}</> : BLOCKERS[a.id] ? <><Icon name="lock" size={12} />Needs {BLOCKERS[a.id]!.split(',')[0]}</> : <>{NEWEST[a.id]}</>
          return (
            <li key={a.id} className={(q.length ? 'has-ask ' : '') + (BLOCKERS[a.id] ? 'has-block ' : '') + (w.agent === a.id ? 'on' : '')}>
              <button onClick={() => w.openAgent(w.agent === a.id ? null : a.id)} aria-expanded={w.agent === a.id}>
                <span className="ov-ag"><Ag id={a.id} size={28} /><span><b>{a.name}</b><small>{a.job}</small></span></span>
                <span className="ov-kb"><Know counts={g.counts} total={g.total} /></span>
                <span className="ov-own"><MiniBar own={r.own} ask={r.ask} /><span className="num">{r.own}%<small className="ov-k"> on its own</small></span></span>
                <span className="ov-rel num">{r.rel.toFixed(1)}%<small className="ov-k"> reliable</small></span>
                <span className={'ov-now' + (live ? ' live' : '')}>{now}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** A 30-day reliability trend: one 1.5px line, seeded around the agent's figure. */
function Spark({ ag, rel }: { ag: AgentId; rel: number }) {
  const pts = Array.from({ length: 30 }, (_, i) => Math.min(100, rel - 0.8 + (i / 29) * 0.8 + (rnd(ag.length * 31 + i) - 0.5) * 0.6))
  const lo = Math.min(...pts) - 0.2, hi = Math.max(...pts) + 0.2, W = 120, H = 28
  const d = pts.map((v, i) => `${i ? 'L' : 'M'} ${(i / 29) * W} ${H - ((v - lo) / (hi - lo)) * H}`).join(' ')
  return <svg className="ap-spark" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true"><path d={d} /></svg>
}

/** One agent's profile, in the right panel: what it knows, what it runs, what it needs, and what it did recently. */
export function AgentProfile({ id }: { id: AgentId }) {
  const w = useW(), a = AG[id], r = REL[id], g = useGroves().find((x) => x.ag === id)!
  const q = questions(id, w.renewal === 'answered', w.cpq === 'fixed'), acts = w.acts.filter((x) => x.ag === id).slice(0, 4)
  return (
    <div className="ap">
      <div className="ap-h">
        <Ag id={id} size={28} />
        <div><b>{a.name} agent</b><small>{a.job}</small></div>
      </div>
      <dl className="ap-stats">
        <div><dt className="tk">Pages</dt><dd className="num">{g.total}</dd></div>
        <div><dt className="tk">Runs on its own</dt><dd className="num">{r.own}%</dd></div>
        <div><dt className="tk">Reliability</dt><dd className="num">{r.rel.toFixed(1)}%</dd></div>
      </dl>

      <section>
        <h3>What it knows</h3>
        <div className="ap-know">
        <ul className="ap-counts">{(Object.keys(STATE) as St[]).map((k) => <li key={k}><i className={'km-t ' + k} />{STATE[k]}<span className="num">{g.counts[k]}</span></li>)}</ul></div>
        {g.pages.length > 0 && <ul className="ap-list">{g.pages.map((p) => <li key={p.id}><button className="wl" onClick={() => w.go(p.id)}>{p.title}</button><small>re-read {ago(p.re)}</small></li>)}</ul>}
        {q.length > 0 && <><h4 className="tk">Open questions</h4><ul className="ap-list">{q.map((x) => <li key={x.q}><span>{x.q}</span><small>{x.who}</small></li>)}</ul></>}
      </section>

      <section>
        <h3>What it runs</h3>
        <MiniBar own={r.own} ask={r.ask} />
        <div className="ap-ring"><span><b className="num">{r.own}%</b> runs on its own · {r.ask}% asks a person first · {100 - r.own - r.ask}% people decide</span></div>
        <ul className="ap-jobs">{JOBS[id].map((j) => <li key={j.t} className={j.st}><span>{j.t}</span><small>{JOB_ST[j.st]} · {j.n.toLocaleString('en-US')} in 30 days</small></li>)}</ul>
        <div className="ap-rel"><span><b className="num">{r.rel.toFixed(1)}%</b> matched a person · {MISSES[id] ? `${MISSES[id]} miss` : 'no misses'} in 30 days</span><Spark ag={id} rel={r.rel} /></div>
      </section>

      <section>
        <h3>What it needs</h3>
        <ul className="ap-list">{r.needs.map((n) => <li key={n}><span>{n}</span></li>)}</ul>
      </section>

      <section>
        <h3>Recently</h3>
        <ul className="ap-list">{acts.length ? acts.map((x) => <li key={x.id}><span>{x.t}</span><small>{ago((w.now - x.at) / 1000)}</small></li>) : <li><span>{NEWEST[id]}</span></li>}</ul>
      </section>

      <div className="ap-foot"><button className="btn soft" onClick={() => w.go(g.pages[0].id)}>Go to the {a.name} grove<Icon name="arrow-right" size={16} /></button></div>
    </div>
  )
}
