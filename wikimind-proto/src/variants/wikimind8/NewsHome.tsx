import { useEffect, useMemo, useRef, useState } from 'react'
import { AG, AGENTS, ago, SPACES, type AgentId } from './data'
import { Thresholds } from './Flow'
import { AgentsOverview } from './Agents'
import { HomeLive, HomeSources, RulesCard } from './Home'
import { Icon } from './Icon'
import { Ag } from './Live'
import { RM, useW } from './store'

/*
 * Wikimind 8b: Home as the brief's front page (Spec 6.2), between Wikipedia's home page and a newspaper's front page.
 * What the agents saw, learned and changed today first; the scale and aliveness of what they know as one living map;
 * what is coming up; browse by grove; and only then what the agents run on their own.
 */

/** Today: what the agents observed, learned and rewrote. Observed ticks while you watch; live events move the others. */
function Today() {
  const w = useW(), [t0] = useState(w.now)
  const observed = 1240 + Math.floor((w.now - t0) / 1600)
  const learned = 6 + (w.renewal === 'answered' ? 1 : 0)
  const rewrote = 23 + Object.keys(w.why).length
  const cells = [
    { k: 'Observed', n: observed.toLocaleString('en-US'), s: 'changes in Salesforce, Slack and tickets' },
    { k: 'Learned', n: String(learned), s: 'unwritten rules and answers from people' },
    { k: 'Rewrote', n: String(rewrote), s: 'pages, each with the reason and a trace' },
  ]
  return (
    <section className="nh-today" aria-label="Today">
      {cells.map((c) => <div key={c.k}><span className="tk">{c.k} today</span><b className="num" key={c.n}>{c.n}</b><span>{c.s}</span></div>)}
    </section>
  )
}

/** The lead story (today's biggest change) and three smaller stories. All of them follow the live demo. */
function Stories() {
  const w = useW(), moved = w.fin === 25, when = w.why['who-fin'] ? ago((w.now - w.why['who-fin'].at) / 1000) : 'Oct 28'
  const lead = moved
    ? { kick: `Changed in Salesforce · ${when}`, title: 'Finance now signs off on discounts over 25%, not 20%',
      dek: <>Priya Shah changed Large Deal Approval. The Approvals agent rewrote Who approves and the flow on Discount approvals; Dana Ruiz {w.verify === 'checking' ? 'is re-checking it' : 'verified it again'}.</>,
      thr: <Thresholds fin={25} />, go: 'who-fin', cta: 'Read Who approves' }
    : { kick: 'Changed in Salesforce · Oct 28', title: 'Discounts over 35% now go straight to the CRO',
      dek: <>The CRO threshold moved from 40% to 35%. The Approvals agent rewrote the rule and 3 other pages within the hour; Dana Ruiz verified it.</>,
      thr: <Thresholds fin={w.fin} />, go: 'who-cro', cta: 'Read Who approves' }
  const side: { ag: AgentId; kick: string; title: string; dek: string; open: () => void; tone?: string }[] = [
    w.cpq === 'failing'
      ? { ag: 'integrations', kick: 'Integrations · since Oct 29', title: 'CPQ quote sync is failing for multi-currency deals', dek: 'Single-currency quotes still sync. Asking Ben Ito why.', open: () => w.jump('cfg-cpq'), tone: 'warn' }
      : { ag: 'integrations', kick: 'Integrations · just now', title: 'CPQ quote sync is fixed', dek: 'Ben Ito corrected the currency mapping; the next 40 quotes synced.', open: () => w.jump('cfg-cpq') },
    w.renewal === 'asking'
      ? { ag: 'approvals', kick: 'Approvals · asking since Oct 27', title: 'Do flat renewals skip approval on purpose?', dek: '14 renewals over $100,000 skipped it. Asking Maria Okafor.', open: () => w.jump('renew'), tone: 'warn' }
      : { ag: 'approvals', kick: 'Approvals · just now', title: 'Flat renewals skip approval on purpose', dek: 'Maria Okafor confirmed it: policy since 2023.', open: () => w.jump('renew') },
    { ag: 'access', kick: 'Access · 4 min ago', title: 'Priya Shah now leads Deal Desk', dek: 'Approval routing and License seats updated to match.', open: () => w.go('license-seats') },
  ]
  return (
    <section className="nh-news" aria-label="Today's stories">
      <article className="nh-lead" key={lead.title}>
        <span className="tk">{lead.kick}</span>
        <h2>{lead.title}</h2>
        <p>{lead.dek}</p>
        <div className="nh-thr">{lead.thr}</div>
        <button className="btn soft" onClick={() => w.jump(lead.go)}>{lead.cta}<Icon name="arrow-right" size={16} /></button>
      </article>
      <ul className="nh-side">
        {side.map((s) => (
          <li key={s.title} className={s.tone || ''}>
            <button onClick={s.open}>
              <span className="tk"><Ag id={s.ag} size={16} />{s.kick}</span>
              <b>{s.title}</b>
              <span>{s.dek}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Coming up: the processes and priorities the agents are preparing for. */
function ComingUp() {
  const w = useW()
  const items: { when: string; ag: AgentId; title: string; dek: string; go: string }[] = [
    { when: 'Nov 11 · in 5 business days', ag: 'approvals', title: 'Quarter-end close', dek: 'Approvals usually triple. Deal Desk approves in #deal-desk first; the Approvals agent logs them after.', go: 'quarter-end' },
    { when: 'Nov 15', ag: 'security', title: 'Access review due', dek: 'Admin and API users. The last review removed 14 stale API users.', go: 'access-reviews' },
    { when: 'Waiting on Dev', ag: 'integrations', title: 'Retry policy for NetSuite sync', dek: 'The Integrations agent retries failed syncs once Dev approves it.', go: 'cpq-sync' },
  ]
  return (
    <section className="home-card nh-up">
      <div className="nh-h"><h2>Coming up</h2><span className="tk">What the agents are preparing for</span></div>
      <ol>
        {items.map((it) => (
          <li key={it.title}><button onClick={() => w.go(it.go)}>
            <span className="tk">{it.when}</span>
            <b><Ag id={it.ag} size={16} />{it.title}</b>
            <span>{it.dek}</span>
          </button></li>
        ))}
      </ol>
    </section>
  )
}

/** Wikimind 8b's Home: the front page. */
export function NewsHome() {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <article className="doc home wide nh">
      <p className="home-k">Rippling · {date}</p>
      <h1>What changed in Rippling’s Salesforce and processes today, and what the agents learned.</h1>
      <HomeLive />
      <Today />
      <Stories />
      <AgentsOverview />
      <ComingUp />
      <RulesCard />
      <HomeSources />
    </article>
  )
}
