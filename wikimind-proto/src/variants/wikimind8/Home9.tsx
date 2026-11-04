import { AgentsOverview, GrantBtn } from './Agents'
import { AG, type AgentId } from './data'
import { HomeLive, HomeSources, useRun } from './Home'
import { Icon, type IconName } from './Icon'
import { Ag } from './Live'
import { ComingUp } from './NewsHome'
import { PathBar } from './Page'
import { GAPS, useW, type Gap } from './store'
import { Toc, type TocItem } from './Toc'

/*
 * Wikimind 9's Home. For the CIO first: what Asoka runs and what holds it back, as Wikimind 8's stat cards, with the
 * access gaps as controls (Wikimind 4's, restyled). Then Asoka live, in Wikimind 5's paradigm: what it changed, what
 * it learned and what it is asking people, three columns that follow the demo. Then 8b's view of what Asoka knows and
 * runs, by job, and what's coming up. A chip nav under the top bar moves within the page, like a page's On this page.
 */

const SECTIONS: TocItem[] = [
  { id: 'h-today', t: 'Asoka today' },
  { id: 'h-live', t: 'Changed, learned, asking' },
  { id: 'h-jobs', t: 'By job' },
  { id: 'h-up', t: 'Coming up' },
]

/** The CIO's cards: the path to full automation, then reliability, how much Asoka runs, and the gaps it can't close alone. */
function TodayCards() {
  const w = useW(), run = useRun()
  const gapNames = run.open.map((g) => `${GAPS[g].t} (${GAPS[g].scope})`).join(', ') || 'none'
  return (
    <>
      <PathBar own={run.own} ask={run.ask} gaps={gapNames} card label={false} />
      <div className="home-3">
        <div className="hc"><span className="tk">Reliability</span><b>98.6%</b><p>matched a person on 1,912 decisions in 30 days</p><button className="wl" onClick={() => w.openMisses('all')}>See the 3 misses</button></div>
        <div className="hc"><span className="tk">Asoka runs</span><b className="num">{run.own}%</b><p>of Rippling’s Salesforce admin work, up from 51% in September</p></div>
        <div className="hc gaps9">
          <span className="tk">Gaps</span><b className="num">{run.blocked}%</b>
          <p>{run.blocked ? 'blocked until Asoka gets access. Dev approves each grant.' : 'Nothing is blocked by access.'}</p>
          <ul>{(Object.keys(GAPS) as Gap[]).map((g) => (
            <li key={g} className={w.access[g]}>
              <span><b>{GAPS[g].t}</b><small>{GAPS[g].scope} · {GAPS[g].job} job · {GAPS[g].pts}% of the work</small></span>
              <GrantBtn g={g} label="Request" />
            </li>
          ))}</ul>
        </div>
      </div>
    </>
  )
}

type Item = { key: string; title: string; dek: string; ag: AgentId; src?: IconName[]; open: () => void; who?: string }

/** Asoka live, in three columns: what it changed, what it learned, what it is asking people. They follow the demo. */
function LiveColumns() {
  const w = useW()
  const changed: Item[] = [
    ...(w.fin === 25 ? [{ key: 'fin', title: 'Finance now signs off over 25%, not 20%', dek: `Priya Shah changed Large Deal Approval. Who approves rewritten; Dana Ruiz ${w.verify === 'checking' ? 'is re-checking it' : 'verified it again'}.`, ag: 'approvals' as AgentId, src: ['cloud' as IconName], open: () => w.jump('who-fin') }] : []),
    w.cpq === 'failing'
      ? { key: 'cpq', title: 'CPQ quote sync is failing for multi-currency deals', dek: '412 errors since a CPQ update on Oct 29. Asked Ben Ito why.', ag: 'integrations', src: ['cloud'], open: () => w.jump('cfg-cpq') }
      : { key: 'cpq-ok', title: 'CPQ quote sync is fixed', dek: 'Ben Ito corrected the currency mapping; the next 40 quotes synced.', ag: 'integrations', src: ['cloud'], open: () => w.jump('cfg-cpq') },
    { key: 'dd', title: 'Priya Shah now leads Deal Desk', dek: 'From the org chart and #announcements. 6 pages updated.', ag: 'access', src: ['hash'], open: () => w.go('license-seats') },
    { key: 'sla', title: 'New rule: high-priority cases need an SLA', dek: 'Validation rule Priority_Requires_SLA, added yesterday.', ag: 'support', src: ['cloud'], open: () => w.go('case-escalation') },
  ]
  const learned: Item[] = [
    ...(w.renewal === 'answered' ? [{ key: 'renew', title: 'Flat renewals skip approval on purpose', dek: 'Maria Okafor confirmed it in Slack: policy since 2023.', ag: 'approvals' as AgentId, src: ['hash' as IconName], open: () => w.jump('renew') }] : []),
    { key: 'qe', title: 'At quarter end, large deals are approved in Slack before Salesforce', dek: `${w.qe[0]} of the last ${w.qe[1]} quarter ends. Not in any policy.`, ag: 'approvals', src: ['hash', 'video'], open: () => w.jump('qe') },
    { key: 'exp', title: 'Approval requests expire after 14 days because of two stale-price deals', dek: 'The reason lived only in a 2024 #revops thread.', ag: 'approvals', src: ['cloud', 'hash'], open: () => w.jump('r-exp') },
    { key: 'loss', title: 'Cases that mention data loss are escalated by hand, whatever their priority', dek: '11 of 11 cases. Confirmed by Kim in Support.', ag: 'support', src: ['ticket'], open: () => w.go('case-escalation') },
  ]
  const asking: Item[] = [
    ...(w.renewal === 'asking' ? [{ key: 'renew-q', title: 'Do flat renewals skip approval on purpose?', dek: 'Maria Okafor, RevOps · asked Oct 27', ag: 'approvals' as AgentId, open: () => w.jump('renew') }] : []),
    ...(w.cpq === 'failing' ? [{ key: 'cpq-q', title: 'Why do multi-currency quotes fail to sync?', dek: 'Ben Ito, Integrations · asked 2 days ago', ag: 'integrations' as AgentId, open: () => w.jump('cfg-cpq') }] : []),
    { key: 'emea', title: 'Do EMEA deals really go to Sofia first?', dek: 'Seen once · waiting for the next EMEA deal', ag: 'approvals', open: () => w.go('discount-approvals') },
    { key: 'okta', title: 'Who owns the Okta sign-in policy now?', dek: 'IT · asked Nov 1', ag: 'security', open: () => w.go('login-policies') },
    { key: 'inv', title: 'Should invoice mismatches under $50 be fixed automatically?', dek: 'Dana Ruiz · asked Oct 30', ag: 'finance', open: () => w.go('invoices') },
  ]
  const cols: { k: string; ic: IconName; label: string; items: Item[]; n?: number }[] = [
    { k: 'ch', ic: 'pencil-line', label: 'Changed', items: changed.slice(0, 3) },
    { k: 'le', ic: 'eye', label: 'Learned', items: learned.slice(0, 3) },
    { k: 'as', ic: 'circle-help', label: 'Asking people', items: asking.slice(0, 3), n: asking.length + 4 },
  ]
  return (
    <div className="lv">
      {cols.map((c) => (
        <section key={c.k} className="lv-col" aria-label={c.label}>
          <div className="lv-h"><Icon name={c.ic} size={16} /><span className="tk">{c.label}</span>{c.n !== undefined && <span className="tk lv-n num">{c.n}</span>}</div>
          <ul>{c.items.map((it) => (
            <li key={it.key}><button onClick={it.open}>
              <b>{it.title}</b>
              <span className="lv-d">{it.dek}</span>
              <span className="lv-f"><Ag id={it.ag} size={24} /><span className="lv-j">{AG[it.ag].name}</span>{it.src && <span className="lv-src" aria-hidden="true">{it.src.map((s) => <i key={s}><Icon name={s} size={12} /></i>)}</span>}</span>
            </button></li>
          ))}</ul>
        </section>
      ))}
    </div>
  )
}

export function Home9() {
  return (
    <article className="doc home wide h9">
      <p className="home-k">Rippling</p>
      <h1>What Asoka runs today, and what still needs people.</h1>
      <HomeLive />
      <Toc items={SECTIONS} chips />
      <section id="h-today" className="h9-s"><h2 className="h9-t">Asoka today</h2><TodayCards /></section>
      <section id="h-live" className="h9-s"><h2 className="h9-t">Changed, learned and asking</h2><LiveColumns /></section>
      <section id="h-jobs" className="h9-s"><AgentsOverview /></section>
      <section id="h-up" className="h9-s"><ComingUp /></section>
      <HomeSources />
    </article>
  )
}
