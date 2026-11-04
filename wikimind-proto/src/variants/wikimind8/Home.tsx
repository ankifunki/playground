import { useState } from 'react'
import { AG, AGENTS, ago, PAGES, SPACES, type AgentId } from './data'
import { Icon } from './Icon'
import { Ag, Asoka, LiveNum, Sources } from './Live'
import { PathBar } from './Page'
import { GAPS, useW, type Gap } from './store'

/** Home (Wikimind 4's front page): a plain headline with one live line, the path to automation, three trust cards, the jobs, what's moving beside the page in focus, unwritten rules and the spaces. Read-only. */
/** Each job's path to automation, and what is blocking or needed for the rest. Demo data. */
export const REL: Record<AgentId, { rel: number; own: number; ask: number; tag?: string; needs: string[] }> = {
  approvals: { rel: 99.0, own: 52, ask: 38, tag: 'Asking Maria', needs: ['Maria Okafor: confirm flat renewals skip approval on purpose (asked Oct 27)', 'One more EMEA deal, to confirm regional-director routing', 'Discounts over 20%: 30 more decisions that match a person'] },
  access: { rel: 98.1, own: 78, ask: 18, needs: ['Seat reclaims: 2 more decisions that match a person', 'Admin rights stay with people, by policy'] },
  security: { rel: 97.4, own: 41, ask: 40, tag: 'Needs Okta logs', needs: ['IT: grant read access to Okta sign-in logs (asked Nov 1)', 'Device wipes: shadow 20 more'] },
  finance: { rel: 99.3, own: 58, ask: 34, needs: ['Finance: grant NetSuite write access, to fix the invoice mismatches it finds', 'Payments stay with people, by policy'] },
  integrations: { rel: 98.4, own: 70, ask: 22, tag: 'Asking Ben Ito', needs: ['Ben Ito: explain why multi-currency CPQ quotes fail', 'Dev: approve a retry policy for NetSuite sync'] },
  support: { rel: 98.9, own: 74, ask: 22, needs: ['Kim (Support): confirm the data-loss escalation rule'] },
}

/**
 * The live picture of what Asoka runs: each granted access gap moves its job's share and the overall share up, and
 * the blocked share down. Wikimind 8 / 8b never grant, so this is the static demo data there.
 */
export function useRun() {
  const w = useW()
  const done = (Object.keys(GAPS) as Gap[]).filter((g) => w.access[g] === 'done')
  const rel = Object.fromEntries(Object.entries(REL).map(([k, r]) => {
    const add = done.filter((g) => GAPS[g].ag === k).reduce((n, g) => n + GAPS[g].jobPts, 0)
    return [k, { ...r, own: r.own + add, needs: r.needs.filter((n) => !done.some((g) => n.includes(GAPS[g].t))) }]
  })) as typeof REL
  const pts = done.reduce((n, g) => n + GAPS[g].pts, 0)
  const open = (Object.keys(GAPS) as Gap[]).filter((g) => w.access[g] !== 'done')
  return { rel, own: 64 + pts, ask: 29, blocked: 7 - pts, open, done }
}
/** How a share Asoka runs is said: Wikimind 9 names Asoka; 8 and 8b say "runs on its own". */
export const ownWord = (v9: boolean) => (v9 ? { label: 'Run by Asoka', short: 'by Asoka', line: 'run by Asoka', legend: 'Asoka runs it' } : { label: 'Runs on its own', short: 'on its own', line: 'runs on its own', legend: 'Runs on its own' })

/** A mini path bar: 4px bars, 2px gaps, one bar per 2.5% of the work. */
export function MiniBar({ own, ask }: { own: number; ask: number }) {
  const n = 40, o = Math.round(n * own / 100), a = Math.round(n * ask / 100)
  return <span className="mini-bar" aria-label={`${own}% on its own, ${ask}% asks first, ${100 - own - ask}% blocked`}>{Array.from({ length: n }, (_, i) => <i key={i} className={i < o ? 'own' : i < o + a ? 'ask' : 'gap'} />)}</span>
}

/** Home (Wikimind 4's front page, at Wikimind 4's width): headline and live line, path to automation, three cards, the jobs (each expands to what blocks it), what's moving beside the page in focus, unwritten rules, and the sources footer. Read-only. */
/** The live line (the newest thing any job did) and the tour button. */
export function HomeLive() {
  const w = useW(), last = w.acts[0]
  return (
    <>
      <div className="home-row">
        {last && <p className="liveln"><Asoka size={20} state={w.presence ? 'writing' : w.now - last.at > 4000 ? 'idle' : last.kind === 'read' ? 'reading' : last.kind === 'ask' ? 'asking' : last.kind === 'edit' ? 'writing' : 'idle'} /><span><b>{last.ag === 'person' ? last.who : 'Asoka'}</b> {last.t.charAt(0).toLowerCase() + last.t.slice(1)}</span></p>}
        {w.v9 ? <button className="btn primary tour-b" onClick={() => w.go('gen')}><Icon name="play" size={12} />Watch Asoka in action</button>
          : <button className="btn primary tour-b" onClick={() => w.setTour(0)}><Icon name="play" size={12} />Take the 1-minute tour</button>}
      </div>
    </>
  )
}

/** Path to full automation and the three read-only cards: reliability, automation, gaps. */
export function AutomationCards() {
  const w = useW()
  return (
    <>
      <PathBar own={64} ask={29} gaps="Okta sign-in logs, NetSuite write access" card label={false} />
      <div className="home-3">
        <div className="hc"><span className="tk">Reliability</span><b>98.6%</b><p>matched a person on 1,912 decisions in 30 days</p><button className="wl pf" onClick={() => w.openMisses('all')}>See the 3 misses</button></div>
        <div className="hc"><span className="tk">Automation</span><b>64%</b><p>runs on its own, up from 51% in September</p></div>
        <div className="hc"><span className="tk">Gaps</span><b>7%</b><p>blocked until they get Okta sign-in logs and NetSuite write access</p></div>
      </div>
    </>
  )
}

/** The jobs: each row has reliability, a mini path bar and whom it is asking, and expands to what it needs. */
export function AgentsCard() {
  const w = useW(), [open, setOpen] = useState<AgentId | null>(null)
  return (
    <>
      <section className="home-card">
        <div className="home-ch"><h2>The jobs</h2><span className="tk">6 jobs</span></div>
        <ul className="ags8">{AGENTS.map((a) => {
          const r = REL[a.id], isOpen = open === a.id, sp = SPACES.find((s) => s.ag === a.id)!
          return (
            <li key={a.id} className={isOpen ? 'open' : ''}>
              <button className="ags8-r" onClick={() => setOpen(isOpen ? null : a.id)} aria-expanded={isOpen}>
                <span className="ag-row"><Ag id={a.id} size={30} /><span><b>{a.name}</b><small>{a.job}</small></span></span>
                <span className="ags8-c"><span className="tk">Reliability</span><span className="num">{r.rel.toFixed(1)}%</span></span>
                <span className="ags8-c own"><span className="tk">Path to automation</span><span className="ags8-b"><MiniBar own={r.own} ask={r.ask} /><span className="num">{r.own}%</span></span></span>
                <span className="ags8-t">{(a.id !== 'approvals' || !w.why['renew']) && r.tag && <span className="ask-tag">{r.tag}</span>}</span>
                <span className="ags8-ch" aria-hidden="true"><Icon name="chevron-down" size={16} /></span>
              </button>
              <div className="ags8-x" inert={!isOpen}><div>
                <div className="ags8-d">
                  <span className="tk">To run more on its own</span>
                  <ul>{r.needs.map((n) => <li key={n}>{n}</li>)}</ul>
                  <button className="btn soft ags8-go" onClick={() => w.go(sp.pages[0].id)}>Go to the {a.name} grove<span>{sp.total} pages</span><Icon name="arrow-right" size={14} /></button>
                </div>
              </div></div>
            </li>
          )
        })}</ul>
      </section>
    </>
  )
}

/** What's moving beside the page in focus. */
export function MovingFocus() {
  const w = useW()
  return (
    <>
      <div className="home-2">
        <section className="home-card">
          <div className="home-ch"><h2>What’s moving</h2><span className="tk"><LiveNum value={w.acts.length} /> today</span></div>
          <ol className="mv8">{w.acts.slice(0, 6).map((a) => (
            <li key={a.id} className={a.id > 0 && w.now - a.at < 6000 ? 'in' : ''}>
              <span className="mv8-ic" aria-hidden="true"><Icon name={a.kind === 'edit' ? 'pencil-line' : a.kind === 'ask' ? 'circle-help' : a.kind === 'verify' ? 'circle-check' : 'eye'} size={14} /></span>
              <span><button className="mv8-t" onClick={() => (a.block ? w.jump(a.block) : w.go(a.page))}>{a.t}</button><small><b>{a.ag === 'person' ? a.who : AG[a.ag].name}</b> · {PAGES[a.page].title} · {ago((w.now - a.at) / 1000)}</small></span>
            </li>))}</ol>
        </section>
        <section className="home-card focus">
          <span className="tk">In focus</span>
          <h2>Discount approvals</h2>
          <p>Deals over $100,000 need approval before Negotiation. The discount decides who approves.</p>
          <span className="focus-by"><Ag id="approvals" name size={20} /><span>5 of 8 verified · rewritten Oct 28</span></span>
          <button className="btn soft focus-cta" onClick={() => w.go('discount-approvals')}><span>See who approves your deal</span><Icon name="arrow-right" size={16} /></button>
        </section>
      </div>
    </>
  )
}

/** Unwritten rules Asoka found. */
export function RulesCard() {
  return (
    <>
      <section className="home-card">
        <span className="tk">Unwritten rules Asoka found</span>
        <ul className="rules8 cols">
          <li><b>At quarter end, large deals are approved in Slack before Salesforce.</b><small>Approvals · 9 #deal-desk threads</small></li>
          <li><b>Approval requests expire after 14 days, since two deals closed on six-week-old prices.</b><small>Approvals · #revops, 2024</small></li>
          <li><b>Cases that mention data loss get escalated by hand, whatever their priority.</b><small>Support · 11 of 11 cases</small></li>
        </ul>
      </section>
    </>
  )
}

/** The sources footer: an icon pile and a one-line summary of the corpus. */
export function HomeSources() {
  const w = useW()
  return (
    <>
      <Sources items={[{ ic: 'hash', name: 'Slack: 48,210 messages' }, { ic: 'ticket', name: 'Tickets: 1,912' }, { ic: 'cloud', name: 'Salesforce: six years of changes' }, { ic: 'video', name: 'Meetings: 214' }, { ic: 'file-text', name: 'Documents: 380' }]}>
        <b>1,284 pages</b> written by Asoka across 6 jobs from <b>3,912</b> observations this week. None typed by a person.
      </Sources>
      <p className="home-demo"><span className="tk">Demo</span><button className="wl" onClick={w.arriveSlack}>Arrive from a Slack citation</button><span className="tk">S</span><button className="wl" onClick={() => w.go('gen')}>Watch Asoka in action</button></p>
    </>
  )
}

/** Home (Wikimind 4's front page, at Wikimind 4's width): headline and live line, path to automation, three cards, the
 * jobs (each expands to what blocks it), what's moving beside the page in focus, unwritten rules, and the sources footer. */
export function Home() {
  return (
    <article className="doc home wide">
      <p className="home-k">Rippling</p>
      <h1>What runs on its own today, and what still needs people.</h1>
      <HomeLive />
      <AutomationCards />
      <AgentsCard />
      <MovingFocus />
      <RulesCard />
      <HomeSources />
    </article>
  )
}
