import { useEffect, useMemo, useRef, useState } from 'react'
import { AG, AGENTS, ago, SPACES, type AgentId } from './data'
import { Thresholds } from './Flow'
import { AgentsCard, AutomationCards, HomeLive, HomeSources, RulesCard } from './Home'
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

/* The knowledge map: every page as one tile, grouped by grove. Each tile's look is one named state. */
type St = 'ver' | 'cur' | 'old' | 'ask'
const STATE: Record<St, string> = { ver: 'Verified by a person', cur: 'Current, re-read today', old: 'Out of date', ask: 'Open question' }
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x) }
const pick = (r: number): St => (r < 0.46 ? 'ver' : r < 0.86 ? 'cur' : r < 0.94 ? 'old' : 'ask')

function KnowledgeMap() {
  const w = useW(), root = useRef<HTMLDivElement>(null)
  // One fixed state per tile (seeded), so the map is stable between renders. Named pages sit first in their grove.
  const groves = useMemo(() => SPACES.map((s, g) => ({ ...s, tiles: Array.from({ length: s.total }, (_, i) => {
    const page = s.pages[i]
    const st: St = page?.id === 'renewals' ? 'ask' : page?.id === 'cpq-sync' ? 'ask' : page ? 'ver' : pick(rnd(g * 1000 + i))
    return { st, page }
  }) })), [])
  const counts = useMemo(() => { const c: Record<St, number> = { ver: 0, cur: 0, old: 0, ask: 0 }; groves.forEach((g) => g.tiles.forEach((t) => c[t.st]++)); return c }, [groves])
  // Alive: tiles light up as an agent reads them. Done on the DOM so 1,284 tiles never re-render.
  useEffect(() => {
    if (RM) return
    const tiles = root.current ? [...root.current.querySelectorAll<HTMLElement>('.km-t')] : []
    if (!tiles.length) return
    const id = window.setInterval(() => {
      for (let k = 0; k < 3; k++) {
        const el = tiles[Math.floor(Math.random() * tiles.length)]
        el.classList.add('obs'); window.setTimeout(() => el.classList.remove('obs'), 1200)
      }
    }, 420)
    return () => window.clearInterval(id)
  }, [])
  const writing = w.presence?.page
  return (
    <section className="home-card nh-map" aria-label="Every page the agents keep">
      <div className="nh-h"><h2>{(1284).toLocaleString('en-US')} pages, as the agents know them</h2><span className="tk">One tile per page · lit as an agent reads it</span></div>
      <div className="km" ref={root}>
        {groves.map((g) => (
          <div key={g.ag} className="km-g">
            <button className="km-gh" onClick={() => w.go(g.pages[0].id)}><Ag id={g.ag} size={20} /><b>{AG[g.ag].name} grove</b><span>{g.total} pages</span></button>
            <div className="km-f">
              {g.tiles.map((t, i) => t.page
                ? <button key={i} className={'km-t ' + t.st + (writing === t.page.id ? ' w' : '')} title={`${t.page.title} · ${STATE[t.st]}`} aria-label={t.page.title} onClick={() => w.go(t.page!.id)} />
                : <i key={i} className={'km-t ' + t.st} title={`${AG[g.ag].name} grove · ${STATE[t.st]}`} />)}
            </div>
          </div>
        ))}
      </div>
      <ul className="km-l">
        {(Object.keys(STATE) as St[]).map((k) => <li key={k}><i className={'km-t ' + k} />{STATE[k]}<span className="num">{counts[k].toLocaleString('en-US')}</span></li>)}
        <li><i className="km-t cur obs-k" />Being read now</li>
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

/** Browse by grove: each agent's grove with its size, freshness and newest change. */
const NEWEST: Record<AgentId, { t: string; re: string }> = {
  approvals: { t: 'Re-read Discount approvals against Salesforce', re: '4 s ago' },
  access: { t: 'Updated Deal Desk: Priya Shah now leads it', re: '4 min ago' },
  security: { t: 'Removed 14 stale API users from Access reviews', re: '20 min ago' },
  finance: { t: 'Linked 3 invoice mismatches to NetSuite records', re: '45 min ago' },
  integrations: { t: 'Asked Ben Ito why multi-currency quotes fail', re: '1 min ago' },
  support: { t: 'Linked 3 cases to the data-loss escalation rule', re: '7 min ago' },
}
function Groves() {
  const w = useW()
  return (
    <section className="nh-groves" aria-label="Browse by grove">
      <div className="nh-h"><h2>Browse by grove</h2><span className="tk">Each agent keeps one</span></div>
      <ul>
        {AGENTS.map((a) => { const sp = SPACES.find((s) => s.ag === a.id)!, n = NEWEST[a.id], live = w.presence?.ag === a.id; return (
          <li key={a.id}><button onClick={() => w.go(sp.pages[0].id)}>
            <Ag id={a.id} size={28} />
            <span className="nh-gt"><b>{a.name} grove</b><small>{sp.total} pages · re-read {n.re}</small><span>{live && w.presence ? `Writing ${w.presence.label} now` : n.t}</span></span>
            <Icon name="arrow-right" size={16} />
          </button></li>
        ) })}
      </ul>
    </section>
  )
}

/** Wikimind 8b's Home: the front page. */
export function NewsHome() {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <article className="doc home wide nh">
      <p className="home-k">Rippling · {date}</p>
      <h1>What the agents saw, learned and changed today.</h1>
      <HomeLive />
      <Today />
      <Stories />
      <KnowledgeMap />
      <ComingUp />
      <RulesCard />
      <Groves />
      <div className="nh-h nh-sep"><h2>What the agents run on their own</h2><span className="tk">And what they still need</span></div>
      <AutomationCards />
      <AgentsCard />
      <HomeSources />
    </article>
  )
}
