import { useEffect, useMemo, useRef, useState } from 'react'
import { AG, AGENTS, ago, SPACES, type AgentId } from './data'
import { MiniBar, ownWord, useRun } from './Home'
import { Icon } from './Icon'
import { Ag, LiveNum, LivePulse } from './Live'
import { GAPS, RM, useW, type Gap } from './store'

/*
 * Wikimind 8b: every job's full picture in one place. A strip of totals (each one a filter), one row per job with
 * what it knows (its pages as tiles), what it runs on its own, its reliability and what it is doing right now, and a
 * profile per job in the right panel to dig deeper. Demo data.
 */

export type St = 'ver' | 'cur' | 'old' | 'ask'
export const STATE: Record<St, string> = { ver: 'Verified by a person', cur: 'Current, re-read today', old: 'Out of date', ask: 'Open question' }
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x) }

/** Questions each job is asking people right now. */
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
/** Why each open question was raised, and what Asoka does until it is answered. Demo data. */
export const QCTX: Record<string, { ag: AgentId; person: string; since: string; saw: string; meanwhile: string; go?: string; block?: string }> = {
  'Do flat renewals skip approval on purpose?': { ag: 'approvals', person: 'Maria Okafor, RevOps', since: 'Oct 27', saw: '14 renewals over $100,000 skipped approval last quarter, and no rule explains it.', meanwhile: 'Asoka asks a person before letting a flat renewal skip approval.', block: 'renew' },
  'Who owns the Okta sign-in policy now?': { ag: 'security', person: 'IT', since: 'Nov 1', saw: 'The policy’s owner left in September; three changes since have no named approver.', meanwhile: 'Asoka won’t suggest changes to the policy until it knows who approves them.', go: 'login-policies' },
  'Should invoice mismatches under $50 be corrected automatically?': { ag: 'finance', person: 'Dana Ruiz', since: 'Oct 30', saw: '31 of the last 42 mismatches were under $50, and each was fixed the same way by hand.', meanwhile: 'Asoka flags every mismatch to Finance ops; nothing is corrected automatically.', go: 'invoices' },
  'Why do multi-currency quotes fail to sync?': { ag: 'integrations', person: 'Ben Ito', since: 'Oct 31', saw: '412 errors since a CPQ update on Oct 29; single-currency quotes still sync.', meanwhile: 'Multi-currency discounts don’t reach quotes; Asoka flags each one to Integrations.', block: 'cfg-cpq' },
  'Is the data-loss escalation rule official?': { ag: 'support', person: 'Kim in Support', since: 'Oct 29', saw: '11 of 11 cases that mention data loss were escalated by hand, whatever their priority.', meanwhile: 'Asoka follows the practice and marks it unofficial on the page.', go: 'case-escalation' },
}
const BLOCKERS: Partial<Record<AgentId, string>> = { security: 'Okta sign-in logs, from IT', finance: 'NetSuite write access, from Finance' }
/** The access gap behind each blocker, which Wikimind 9 can grant. */
const BLOCK_GAP: Partial<Record<AgentId, Gap>> = { security: 'okta', finance: 'netsuite' }
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
const JOB_ST9 = { own: 'Asoka runs it', ask: 'Asoka asks a person first', people: 'People decide; Asoka shadows' }
const MISSES: Record<AgentId, number> = { approvals: 1, access: 1, security: 1, finance: 0, integrations: 0, support: 0 }
const NEWEST: Record<AgentId, string> = {
  approvals: 'Re-read Discount approvals against Salesforce', access: 'Updated Deal Desk: Priya Shah now leads it', security: 'Removed 14 stale API users from Access reviews',
  finance: 'Linked 3 invoice mismatches to NetSuite records', integrations: 'Asked Ben Ito why multi-currency quotes fail', support: 'Linked 3 cases to the data-loss escalation rule',
}

/** Every grove's pages as states (seeded, stable). Named pages sit first; open-question tiles match the questions. */
/** Short names for the Jobs row's blocker chip, so it stays on one line. */
const CHIP: Record<Gap, string> = { okta: 'Okta logs', netsuite: 'NetSuite' }
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

/** The tiles of one grove; a few light up at a time as the job reads them (DOM classes, no re-render). */
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
 * What a job knows, as numbers: the page count, then one line of counts by state, each with a small colour key.
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

type Filter = null | 'ver' | 'ask' | 'block' | 'own' | 'rel'

/** The overview: totals (each a filter) and one row per job. Clicking a row opens the job's profile. */
export function AgentsOverview() {
  const w = useW(), groves = useGroves(), [filter, setFilter] = useState<Filter>(null), run = useRun(), ow = ownWord(w.v9)
  // A blocker is gone once its access is granted (Wikimind 9).
  const blocked = (id: AgentId) => !!BLOCKERS[id] && !(BLOCK_GAP[id] && w.access[BLOCK_GAP[id]!] === 'done')
  const answered = w.renewal === 'answered', fixed = w.cpq === 'fixed'
  const total = groves.reduce((n, g) => n + g.total, 0), ver = groves.reduce((n, g) => n + g.counts.ver, 0)
  const qs = AGENTS.reduce((n, a) => n + questions(a.id, answered, fixed).length, 0), blockers = AGENTS.filter((a) => blocked(a.id)).length
  const stats: { k: Filter; n: string; t: string }[] = [
    { k: null, n: total.toLocaleString('en-US'), t: 'pages' },
    { k: null, n: ver.toLocaleString('en-US'), t: 'verified by a person' },
    // Wikimind 9's Status card already shows how much Asoka runs and its reliability, so the totals leave them out.
    ...(w.v9 ? [] : [{ k: null, n: `${run.own}%`, t: ow.line }, { k: 'rel' as Filter, n: '98.6%', t: 'reliability' }]),
    { k: 'ask', n: String(qs), t: 'open questions' },
    { k: 'block', n: String(blockers), t: 'blockers' },
  ]
  return (
    <section className={'home-card ov' + (filter ? ' f-' + filter : '')} aria-label={w.v9 ? 'Jobs' : 'What Asoka knows and runs, by job'}>
      {!w.v9 && <div className="nh-h"><h2>What Asoka knows and runs, by job</h2></div>}
      <ul className={'ov-sum' + (w.v9 ? ' four' : '')}>
        {stats.map((s) => (
          <li key={s.t}>
            {s.k === 'rel' ? <button className="pf-b" onClick={() => w.openMisses('all')} aria-label="Reliability 98.6%: see the 3 misses"><b className="num"><LiveNum value={s.n} /></b><span>{s.t} · 3 misses</span></button>
              : s.k ? <button className={filter === s.k ? 'on' : ''} aria-pressed={filter === s.k} onClick={() => setFilter(filter === s.k ? null : s.k)}><b className="num"><LiveNum value={s.n} /></b><span>{s.t}</span></button>
              : <div><b className="num"><LiveNum value={s.n} /></b><span>{s.t}</span></div>}
          </li>
        ))}
      </ul>
      <div className="ov-head" aria-hidden="true"><span>Job</span><span>{ow.label}</span><span>Reliability</span><span>{w.v9 ? 'Actions' : 'Right now'}</span></div>
      <ul className="ov-rows">
        {AGENTS.map((a) => {
          const g = groves.find((x) => x.ag === a.id)!, r = run.rel[a.id], q = questions(a.id, answered, fixed), live = w.presence?.ag === a.id
          // Wikimind 9: a blocker shows first, as a clear chip that opens its panel (handled in the row's click).
          const bk = w.v9 && blocked(a.id) ? BLOCK_GAP[a.id] : undefined
          const now = bk ? <span className="ov-blk" data-blk={bk}><Icon name="lock" size={12} />Blocked · {CHIP[bk]}<Icon name="chevron-right" size={12} /></span> : live && w.presence ? <><LivePulse />Writing {w.presence.label}</> : q[0]?.who.startsWith('Asking') ? (w.v9 && QCTX[q[0].q] ? <span className="ov-qc" data-q={q[0].q}><Icon name="circle-help" size={12} />{q[0].who}<Icon name="chevron-right" size={12} /></span> : <><Icon name="circle-help" size={12} />{q[0].who}</>) : blocked(a.id) ? <><Icon name="lock" size={12} />Needs {BLOCKERS[a.id]!.split(',')[0]}</> : null
          return (
            <li key={a.id} className={(q.length ? 'has-ask ' : '') + (blocked(a.id) ? 'has-block ' : '') + (w.agent === a.id ? 'on' : '')}>
              <button onClick={(e) => { const b = (e.target as HTMLElement).closest('[data-blk]'); if (b) { w.openBlocker(b.getAttribute('data-blk') as Gap); return } const qq = (e.target as HTMLElement).closest('[data-q]'); if (qq) { w.openQuestion(qq.getAttribute('data-q')); return } w.openAgent(w.agent === a.id ? null : a.id) }} aria-expanded={w.agent === a.id}>
                <span className="ov-ag"><Ag id={a.id} size={28} /><span><b>{a.name}</b><small className="num">{g.total} pages{g.counts.old ? <> · <span className="ov-x">{g.counts.old} out of date</span></> : null}{q.length ? <> · <span className={'ov-x' + (w.v9 && q.some((x) => QCTX[x.q]) ? ' ov-xq' : '')} data-q={w.v9 ? q.find((x) => QCTX[x.q])?.q : undefined}>{q.length} open {q.length === 1 ? 'question' : 'questions'}</span></> : null}</small></span></span>
                <span className="ov-own"><MiniBar own={r.own} ask={r.ask} /><span className="num">{r.own}%<small className="ov-k"> {ow.short}</small></span></span>
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

/** A 30-day reliability trend: one 1.5px line, seeded around the job's figure. */
function Spark({ ag, rel }: { ag: AgentId; rel: number }) {
  const pts = Array.from({ length: 30 }, (_, i) => Math.min(100, rel - 0.8 + (i / 29) * 0.8 + (rnd(ag.length * 31 + i) - 0.5) * 0.6))
  const lo = Math.min(...pts) - 0.2, hi = Math.max(...pts) + 0.2, W = 120, H = 28
  const d = pts.map((v, i) => `${i ? 'L' : 'M'} ${(i / 29) * W} ${H - ((v - lo) / (hi - lo)) * H}`).join(' ')
  return <svg className="ap-spark" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true"><path d={d} /></svg>
}

/** One job's profile, in the right panel: what it knows, what it runs, what it needs, and what it did recently. */
export function AgentProfile({ id }: { id: AgentId }) {
  const w = useW(), a = AG[id], run = useRun(), r = run.rel[id], g = useGroves().find((x) => x.ag === id)!, ow = ownWord(w.v9), gap = BLOCK_GAP[id]
  const q = questions(id, w.renewal === 'answered', w.cpq === 'fixed'), acts = w.acts.filter((x) => x.ag === id).slice(0, 4)
  return (
    <div className="ap">
      <div className="ap-h">
        <Ag id={id} size={28} />
        <div><b>{a.name} job</b><small>{a.job}</small></div>
      </div>
      <dl className="ap-stats">
        <div><dt className="tk">Pages</dt><dd className="num">{g.total}</dd></div>
        <div><dt className="tk">{ow.label}</dt><dd className="num">{r.own}%</dd></div>
        <div><dt className="tk">Reliability</dt><dd className="num">{r.rel.toFixed(1)}%</dd></div>
      </dl>

      <section>
        <h3>What it knows</h3>
        <div className="ap-know">
        <ul className="ap-counts">{(Object.keys(STATE) as St[]).map((k) => <li key={k}><i className={'km-t ' + k} />{STATE[k]}<span className="num">{g.counts[k]}</span></li>)}</ul></div>
        {g.pages.length > 0 && <ul className="ap-list">{g.pages.map((p) => <li key={p.id}><button className="wl" onClick={() => w.go(p.id)}>{p.title}</button><small>re-read {ago(p.re)}</small></li>)}</ul>}
        {q.length > 0 && <><h4 className="tk">Open questions</h4><ul className="ap-list">{q.map((x) => <li key={x.q}>{w.v9 && QCTX[x.q] ? <button className="wl" onClick={() => w.openQuestion(x.q)}>{x.q}</button> : <span>{x.q}</span>}<small>{x.who}</small></li>)}</ul></>}
      </section>

      <section>
        <h3>What it runs</h3>
        <MiniBar own={r.own} ask={r.ask} />
        <div className="ap-ring"><span><b className="num">{r.own}%</b> {ow.line} · {r.ask}% asks a person first · {100 - r.own - r.ask}% people decide</span></div>
        <ul className="ap-jobs">{JOBS[id].map((j) => <li key={j.t} className={j.st}><span>{j.t}</span><small>{(w.v9 ? JOB_ST9 : JOB_ST)[j.st]} · {j.n.toLocaleString('en-US')} in 30 days</small></li>)}</ul>
        <div className="ap-rel"><span><b className="num">{r.rel.toFixed(1)}%</b> matched a person · {MISSES[id] ? <button className="wl pf" onClick={() => w.openMisses(id)}>{MISSES[id]} miss</button> : 'no misses'} in 30 days</span><Spark ag={id} rel={r.rel} /></div>
      </section>

      <section>
        <h3>What it needs</h3>
        <ul className="ap-list">{r.needs.map((n) => <li key={n}><span>{n}</span>{w.v9 && gap && n.includes(GAPS[gap].t) && <span className="bk-row"><GrantBtn g={gap} /><button className="wl" onClick={() => w.openBlocker(gap)}>Why it’s blocked</button></span>}</li>)}</ul>
        {w.v9 && gap && w.access[gap] === 'done' && <p className="gr-done"><Icon name="circle-check" size={14} />{GAPS[gap].t} granted · {GAPS[gap].jobPts} more points Asoka runs</p>}
      </section>

      <section>
        <h3>Recently</h3>
        <ul className="ap-list">{acts.length ? acts.map((x) => <li key={x.id}><span>{x.t}</span><small>{ago((w.now - x.at) / 1000)}</small></li>) : <li><span>{NEWEST[id]}</span></li>}</ul>
      </section>

      <div className="ap-foot"><button className="btn soft" onClick={() => w.go(g.pages[0].id)}>Go to the {a.name} grove<Icon name="arrow-right" size={16} /></button></div>
    </div>
  )
}

/** Wikimind 4's access control, in the new button style: request, Dev approves, granted. */
export function GrantBtn({ g, label = 'Request access' }: { g: Gap; label?: string }) {
  const w = useW(), st = w.access[g]
  if (st === 'done') return <span className="gr-ok"><Icon name="circle-check" size={14} />Granted</span>
  return (
    <button className={'btn soft gr-b' + (st === 'asking' ? ' busy' : '')} onClick={() => w.grant(g)} disabled={st === 'asking'} aria-live="polite">
      {st === 'asking' ? <><i className="gr-spin" aria-hidden="true" />Asking Dev to approve</> : <><Icon name="key" size={14} />{label}</>}
    </button>
  )
}

/**
 * One access blocker in the right panel: what Asoka can't do without it, what granting it changes (the job's share
 * and the whole), who grants it, and the action pinned at the foot: Request access (Dev approves), or ask the owner in
 * Slack. Opened from a job's Blocked chip, its profile's needs, and the Gaps card.
 */
export function BlockerPanel({ g }: { g: Gap }) {
  const w = useW(), x = GAPS[g], st = w.access[g], run = useRun(), r = run.rel[x.ag], [asked, setAsked] = useState(false)
  const done = st === 'done'
  return (
    <div className="ap bk">
      <div className="ap-h"><Ag id={x.ag} size={28} /><div><b>{done ? `${x.t} granted` : `Needs ${x.t}`}</b><small>{x.job} job · {x.scope} access · {done ? 'unblocked' : x.since}</small></div></div>
      <section><h3>{done ? 'What changed' : 'Why it’s blocked'}</h3><p>{done ? `Asoka now runs ${r.own}% of ${x.job} work, ${x.jobPts} points more.` : x.why}</p></section>
      {!done && <section><h3>What unblocking does</h3>
        <dl className="bk-n"><div><dt className="tk">{x.job}</dt><dd className="num">{r.own}% → {r.own + x.jobPts}%</dd></div><div><dt className="tk">All of Asoka</dt><dd className="num">{run.own}% → {run.own + x.pts}%</dd></div></dl>
        <p>{x.after}</p></section>}
      <section><h3>Who grants it</h3><p>{x.owner}. Dev approves every grant before Asoka uses it.</p></section>
      <div className="ap-foot bk-foot">
        {done ? <span className="gr-ok"><Icon name="circle-check" size={14} />Granted · Dev approved</span> : <>
          <GrantBtn g={g} label="Request access" />
          {asked ? <span className="bk-asked"><Icon name="circle-check" size={14} />Asked in Slack</span>
            : <button className="btn ghost" onClick={() => { setAsked(true); w.log({ ag: x.ag, t: `Asked ${x.owner.split(' ·')[0]} in Slack for ${x.t} (${x.scope})`, page: 'discount-approvals', kind: 'ask' }) }}>{x.ask}</button>}
        </>}
      </div>
    </div>
  )
}

/**
 * One open question in the right panel: the question, who Asoka is asking and since when, what it saw that raised it,
 * and what it does until it's answered. Actions pinned at the foot: remind the person in Slack, or answer it yourself
 * (Asoka still checks your answer with them). Opened from a job's Asking chip or open-question count, and its profile.
 */
export function QuestionPanel({ q }: { q: string }) {
  const w = useW(), c = QCTX[q], first = c.person.split(/[ ,]/)[0]
  const [reminded, setReminded] = useState(false), [writing, setWriting] = useState(false), [text, setText] = useState(''), [sent, setSent] = useState(false)
  const answered = q.startsWith('Do flat renewals') && w.renewal === 'answered'
  return (
    <div className="ap bk">
      <div className="ap-h"><Ag id={c.ag} size={28} /><div><b>{q}</b><small>{AG[c.ag].name} job · asking {c.person} since {c.since}</small></div></div>
      {answered ? <section><h3>Answered</h3><p>Maria Okafor confirmed it in Slack: policy since 2023. Asoka wrote it into the page.</p></section> : <>
        <section><h3>What Asoka saw</h3><p>{c.saw}</p></section>
        <section><h3>Until it’s answered</h3><p>{c.meanwhile}</p></section>
      </>}
      {(c.block || c.go) && <button className="wl bk-link" onClick={() => (c.block ? w.jump(c.block) : w.go(c.go!))}>Open it on the page<Icon name="arrow-right" size={14} /></button>}
      {!answered && <div className="ap-foot bk-foot">
        {sent ? <span className="bk-asked"><Icon name="circle-check" size={14} />Answer sent. Asoka will check it with {first}.</span>
          : writing ? <form className="bk-ans" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; setSent(true); w.log({ ag: c.ag, t: `Got an answer from you on “${q}”; checking it with ${first}`, page: 'discount-approvals', kind: 'ask' }) }}>
              <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your answer" aria-label="Your answer" autoFocus />
              <span><button className="btn primary" type="submit" disabled={!text.trim()}>Send</button><button className="btn ghost" type="button" onClick={() => setWriting(false)}>Cancel</button></span>
            </form>
          : <>
            {reminded ? <span className="bk-asked"><Icon name="circle-check" size={14} />Reminded {first}</span>
              : <button className="btn soft" onClick={() => { setReminded(true); w.log({ ag: c.ag, t: `Reminded ${c.person} in Slack: “${q}”`, page: 'discount-approvals', kind: 'ask' }) }}><Icon name="message-circle" size={14} />Remind {first} in Slack</button>}
            <button className="btn ghost" onClick={() => setWriting(true)}>Answer it yourself</button>
          </>}
      </div>}
    </div>
  )
}
