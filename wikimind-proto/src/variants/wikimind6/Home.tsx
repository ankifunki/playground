import { QaSlot } from './Answer'
import { AG, AGENTS, Ag, type AgentId } from './agents'
import { Pile } from './Claim'
import { Built } from './Corpus'
import { Proof, Today } from './Today'
import { Thresholds } from './Thresholds'
import { ASKS, CHANGED, LEARNED, type Story } from './data'
import { Icon } from './Icon'
import { Ago } from './Job'
import { whoStr } from './logic'
import { useW } from './store'

const DATE = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

/** The lead story: the biggest change in Northwind's Salesforce. It is replaced live when a new change lands. */
function Lead() {
  const w = useW(), live = w.cfg !== 'idle'
  return (
    <article className="hm-lead" id="lead">
      <div className="hm-k">
        {live ? <span className="tk ago"><span className="pdot" />Just now</span> : <span className="tk">Oct 28</span>}
        <span className="tk">Changed in Salesforce</span>
      </div>
      <h2>{live ? 'Finance now reviews discounts over 25%, not 20%' : 'Discounts over 35% now go straight to the CRO'}</h2>
      <p className="hm-deck">{live
        ? 'Priya Shah changed the approval step a moment ago. The Approvals agent saw it, rewrote Discount approvals, and asked Dana to re-check.'
        : 'The CRO threshold dropped from 40%. The Approvals agent rewrote 4 pages and has routed 23 deals by the new rule since.'}</p>
      <Thresholds fin={w.fin} was={live ? { at: 20, label: 'Finance over 20%' } : { at: 40, label: 'CRO over 40%' }} />
      <div className="hm-by">
        <Ag id="approvals" name />
        <span className={'hm-ver' + (live && w.cfg === 'changed' ? ' wait' : '')}>{live ? (w.cfg === 'changed' ? 'Dana is re-checking' : 'Verified by Dana just now') : 'Verified by Dana Ruiz'}</span>
        <Pile ns={live ? [15] : [3, 12]} />
        <button className="wl" onClick={() => (live ? w.showCfg() : w.showClaims([3, 12]))}>Read it on the page</button>
      </div>
    </article>
  )
}

/** The live wire: what each agent is doing right now. Pausable. */
function Wire() {
  const w = useW()
  return (
    <aside className="hm-wire" aria-label="Live">
      <div className="hm-wh"><span className={'hm-live' + (w.wireOn ? '' : ' off')}><Icon name="radio" size={16} />{w.wireOn ? 'Live' : 'Paused'}</span>
        <button className="ibtn sm" onClick={w.toggleWire} aria-label={w.wireOn ? 'Pause live updates' : 'Resume live updates'} title={w.wireOn ? 'Pause' : 'Resume'}><Icon name={w.wireOn ? 'pause' : 'play'} size={14} /></button></div>
      <ol>{w.wire.map((x, i) => (
        <li key={x.id} className={i === 0 && x.id > 0 ? 'in' : ''}>
          <Ag id={x.ag} />
          <span><span className="hm-wt">{x.t}</span><small><b className="agw">{AG[x.ag].name}</b> · {i === 0 ? 'just now' : `${i * 5}s ago`} · <button className="wl" onClick={(e) => (x.page === 'Discount approvals' ? (x.ns ? w.showClaims(x.ns) : w.go('page')) : w.openPrev(x.page, e.currentTarget))}>{x.page}</button></small></span>
        </li>
      ))}</ol>
    </aside>
  )
}

/** The one live line under the headline: the latest thing an agent did, as it happens (Wikimind 4's hero line). */
function HeroLive() {
  const w = useW(), last = w.wire[0]
  if (!last) return null
  return (
    <p className="td-live" key={last.id}>
      <i className="hm-pulse" aria-hidden="true" /><Ag id={last.ag} />
      <span className="td-lt"><b className="agw">{AG[last.ag].name}</b> {last.t.charAt(0).toLowerCase() + last.t.slice(1)}</span>
      <button className="wl" onClick={(e) => (last.page === 'Discount approvals' ? w.go('page') : w.openPrev(last.page, e.currentTarget))}>{last.page}</button>
    </p>
  )
}

/** What each agent knows: pages it keeps, how much a person has checked, when it last re-read, whom it is asking. */
const KNOWS: Record<AgentId, { pages: number; checked: number; ask?: string }> = {
  approvals: { pages: 386, checked: 71, ask: 'Asking Maria' }, access: { pages: 153, checked: 77 }, security: { pages: 142, checked: 64, ask: 'Asking Sam Lee' },
  finance: { pages: 174, checked: 84 }, integrations: { pages: 193, checked: 46, ask: 'Asking Ben Ito' }, support: { pages: 236, checked: 66 },
}
function Agents() {
  const w = useW()
  return (
    <section className="hm-card hm-ags" aria-label="The agents">
      <div className="hm-ch"><h2>The agents</h2><span className="tk">6 agents, one job each</span></div>
      <table>
        <thead><tr><th>Agent</th><th>Pages kept</th><th>Checked by a person</th><th>Asking</th></tr></thead>
        <tbody>{AGENTS.map((a) => {
          const k = KNOWS[a.id], ask = a.id === 'approvals' && w.learned ? undefined : k.ask
          return (
            <tr key={a.id}>
              <td><span className="hm-agn"><Ag id={a.id} size={32} /><span><b>{a.name}</b><small>{a.job}</small></span></span></td>
              <td className="num">{k.pages}</td>
              <td><span className="hm-chk"><span className="hm-chk-b"><i style={{ width: k.checked + '%' }} /></span><span className="num">{k.checked}%</span></span></td>
              <td>{ask && <span className="hm-mk">{ask}</span>}</td>
            </tr>
          )
        })}</tbody>
      </table>
    </section>
  )
}

/** One feed, Wikimind 4 style: what changed and what the agents are asking, an icon and one line each. */
function Moving() {
  const w = useW()
  type Row = { k: string; ic: 'pencil-line' | 'circle-help'; t: string; ag: AgentId; m: string; go: (el: HTMLElement) => void; fresh?: boolean }
  const rows: Row[] = [
    ...w.newQs.map((x): Row => ({ k: 'q' + x.id, ic: 'circle-help', t: x.q, ag: x.agent, m: x.resolved ? `${x.who} answered just now` : `Asking ${whoStr(x)}`, go: () => w.showQa(x.qaId), fresh: x.fresh })),
    ...CHANGED.map((s): Row => ({ k: s.t, ic: 'pencil-line', t: s.t, ag: s.ag, m: s.s, go: (el) => (s.sec ? w.go('page', { sec: s.sec }) : w.openPrev(s.page!, el)) })),
    ...ASKS.map((a, i): Row => ({ k: a.q, ic: 'circle-help', t: a.q, ag: a.ag, m: i === 0 && w.learned ? 'Maria Okafor answered; the page was rewritten' : a.who === 'Watching' ? a.s : `${a.who}, ${a.s}`,
      go: (el) => (i === 0 ? (w.learned ? w.showRenewal() : w.go('page', { sec: 'practice' })) : a.sec ? w.go('page', { sec: a.sec }) : w.openPrev(a.page!, el)) })),
  ]
  return (
    <section className="hm-card hm-mv" id="asking-col" aria-label="What's moving">
      <div className="hm-ch"><h2>What’s moving</h2><span className="tk">Asking people <span id="n-asks">{w.asks}</span></span></div>
      <ul>{rows.map((r) => (
        <li key={r.k} className={r.fresh ? 'in' : ''}>
          <span className={'hm-ic' + (r.ic === 'circle-help' ? ' q' : '')} aria-hidden="true"><Icon name={r.ic} size={14} /></span>
          <span><button className="hm-mt" onClick={(e) => r.go(e.currentTarget)}>{r.t}</button><small><b className="agw">{AG[r.ag].name}</b> · {r.m}</small></span>
        </li>
      ))}</ul>
    </section>
  )
}

/** What the agents learned that nobody had written down. */
function Rules() {
  const w = useW()
  return (
    <section className="hm-card hm-rl" aria-label="Unwritten rules the agents found">
      <div className="hm-ch"><h2>Unwritten rules they found</h2></div>
      <ul>{LEARNED.map((s) => (
        <li key={s.t}>
          <button className="hm-rt" onClick={(e) => (s.sec ? (s.ns ? w.showClaims(s.ns) : w.go('page', { sec: s.sec })) : w.openPrev(s.page!, e.currentTarget))}>{s.t}</button>
          <small><b className="agw">{AG[s.ag].name}</b> · {s.s}</small>
        </li>
      ))}</ul>
    </section>
  )
}

export function Home() {
  const w = useW()
  return (
    <div className="page enter hm">
      <div className="hm-hero">
        <p className="hm-kick"><span className="tk">{DATE}</span><span>Northwind, as the agents understand it</span></p>
        <h1>What the agents know about Northwind, and how you can check it.</h1>
        <div className="hm-hrow">
          <HeroLive />
          <button className="hm-tour press" onClick={w.startTour}><Icon name="play" size={14} />Take the 1-minute tour</button>
        </div>
      </div>
      <QaSlot where="home" sec="home" />
      <Today />
      <div className="hm-top">
        <Lead />
        <Wire />
      </div>
      <Proof />
      <Agents />
      <div className="hm-two">
        <Moving />
        <Rules />
      </div>
      <p className="hm-all"><button className="wl crumb-all" onClick={(e) => w.openPages(e.currentTarget)}>All 1,284 pages</button><span className="tk">no folders; any page links to any other</span></p>
      <Built />
      <p className="demo"><span className="tk">Demo</span><button className="wl" onClick={w.arrive}>Arrive from Slack</button><button className="wl" onClick={w.startTour}>Take the tour</button></p>
    </div>
  )
}
