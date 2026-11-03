import type React from 'react'
import { useEffect, useState } from 'react'
import { useVariantCss } from '../../useVariantCss'
import { AG, AGENTS, ago, PAGES, SPACES, type AgentId } from './data'
import { Icon } from './Icon'
import { Ag, LivePulse, Sources } from './Live'
import { Omni } from './Omni'
import { Trace } from './Trace'
import { TRACE } from './traces'
import { Approvals, PathBar, Stub } from './Page'
import { Tour } from './Tour'
import { Provider, useW } from './store'
import css from './styles.css?inline'

/** Left sidebar: the workspace, search, and one space per agent with its pages. A page an agent is writing shows it. */
function Sidebar() {
  const w = useW(), [q, setQ] = useState(''), [open, setOpen] = useState<Record<string, boolean>>({ approvals: true, integrations: true })
  const editingPage = w.presence?.page
  return (
    <nav className={'sb' + (w.nav ? ' open' : '')} aria-label="Workspace">
      <div className="sb-ws"><span className="sb-logo">R</span><span><b>Rippling</b><small>Wikimind · kept by 6 agents</small></span><button className="ib sb-x" onClick={() => w.setNav(false)} aria-label="Close pages"><Icon name="x" size={15} /></button></div>
      <label className="sb-q"><Icon name="search" size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 1,284 pages" /></label>
      <button className={'sb-i' + (w.page === 'home' ? ' on' : '')} onClick={() => w.go('home')}><Icon name="house" size={15} />Home</button>
      <button className="sb-i" onClick={() => w.setRail(true)}><Icon name="activity" size={15} />Live activity<span className="sb-n">{w.acts.length}</span></button>
      <div className="sb-l">Groves</div>
      {SPACES.map((s) => {
        const pages = s.pages.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()))
        if (q && !pages.length) return null
        const isOpen = q ? true : open[s.ag]
        const busy = w.presence?.ag === s.ag
        return (
          <div key={s.ag} className="sb-sp">
            <button className="sb-h" aria-expanded={isOpen} onClick={() => setOpen((o) => ({ ...o, [s.ag]: !o[s.ag] }))}>
              <span className={'sb-ch' + (isOpen ? ' open' : '')}><Icon name="chevron-right" size={12} /></span>
              <Ag id={s.ag} size={18} /><span className="sb-t">{AG[s.ag].name} grove</span>
              {busy ? <span className="sb-busy" title="Writing now"><Icon name="pencil-line" size={12} /></span> : <span className="sb-c">{s.total}</span>}
            </button>
            {isOpen && pages.map((p) => (
              <button key={p.id} className={'sb-p' + (w.page === p.id ? ' on' : '') + (editingPage === p.id ? ' live' : '')} onClick={() => w.go(p.id)}>
                <Icon name="file" size={14} /><span>{p.title}</span>{editingPage === p.id && <i className="sb-pulse" aria-label="being written now" />}
              </button>
            ))}
          </div>
        )
      })}
      <p className="sb-foot">Each agent writes and keeps its own grove.</p>
    </nav>
  )
}

/** The top bar: where you are, who is on this page right now, the activity rail. Below it, presence when an agent is editing. */
function Top() {
  const w = useW(), p = w.page === 'home' ? null : PAGES[w.page]
  const here: AgentId[] = p ? (p.id === 'discount-approvals' ? ['approvals', 'finance', 'integrations'] : [p.ag]) : AGENTS.map((a) => a.id)
  const pr = w.presence && (w.page === 'home' || w.presence.page === w.page) ? w.presence : null
  return (
    <div className="top">
      <div className="top-r">
        <button className="ib top-menu" onClick={() => w.setNav(!w.nav)} aria-label={w.nav ? 'Hide pages' : 'Show pages'} aria-pressed={w.nav}><span className="hb" aria-hidden="true"><i /><i /><i /></span></button>
        <div className="crumb">
          {p ? <><button onClick={() => w.go('home')}>Rippling</button><Icon name="chevron-right" size={12} /><span className="crumb-sp"><Ag id={p.ag} size={16} />{AG[p.ag].name} grove</span><Icon name="chevron-right" size={12} /><b>{p.title}</b></> : <b>Home</b>}
        </div>
        <div className={'here' + (pr ? ' live' : '')}>
          <button className="cap" onClick={() => pr && w.jump(pr.block)} disabled={!pr} aria-label={pr ? `${AG[pr.ag].name} agent is writing ${pr.label}: watch it` : `${here.length} agents on this page`}>
            <span className="here-p">{(pr ? [pr.ag, ...here.filter((x) => x !== pr.ag)] : here).map((id, i) => <span key={id} className={'here-a' + (pr && i === 0 ? ' w' : '')}><Ag id={id} size={24} /></span>)}</span>
            <span className="cap-t" aria-hidden={!pr}>{pr && <><b>{AG[pr.ag].name}</b> writing <b>{pr.label}</b>{w.page === 'home' && <> · {PAGES[pr.page].title}</>}<Icon name="arrow-right" size={13} /></>}</span>
            {!pr && <span className="here-t">{here.length === 1 ? '1 agent here' : `${here.length} agents here`}</span>}
          </button>
        </div>
        <button className="ib top-act" onClick={() => w.setRail(!w.rail)} aria-label="Live activity" aria-pressed={w.rail}><Icon name="activity" size={16} /></button>
      </div>
    </div>
  )
}

/** The right rail: live activity across the workspace, newest first. Each item links to the block it changed. */
function Rail() {
  const w = useW(), [from, setFrom] = useState(false)
  return (
    <aside className={'rail' + (w.rail ? ' open' : '')} aria-label="Live activity">
      <div className="rail-h">
        {w.trace ? <span className="rail-t"><button className="ib rail-back" onClick={() => { setFrom(false); w.openTrace(null) }} aria-label="Back to live activity"><Icon name="chevron-right" size={15} /></button><span className="rail-crumb">{from && <span>Live activity</span>}Trace</span></span>
          : <span className="rail-t"><LivePulse on={w.playing} />Live activity</span>}
        <button className="ib" onClick={() => { w.setRail(false); w.openTrace(null) }} aria-label="Close"><Icon name="x" size={15} /></button>
      </div>
      {w.trace ? <div className="rail-sc rail-push" key={w.trace}><Trace id={w.trace} /></div> : <div className="rail-list rail-pop">
      <ol>
        {w.acts.map((a) => {
          return (
            <li key={a.id} className={a.id > 0 && w.now - a.at < 6000 ? 'in' : ''}>
              {a.ag === 'person' ? <span className="rail-p" aria-hidden="true"><Icon name="user" size={12} /></span> : <Ag id={a.ag} size={22} />}
              <span className="rail-m">
                <span className="rail-x"><b>{a.ag === 'person' ? a.who : AG[a.ag].name}</b> {a.t.charAt(0).toLowerCase() + a.t.slice(1)}</span>
                <small>{ago((w.now - a.at) / 1000)} · <button className="wl" onClick={() => (a.block ? w.jump(a.block) : w.go(a.page))}>{PAGES[a.page].title}</button></small>
              </span>
              {a.block && TRACE[a.block] && <button className="ib rail-ch" onClick={() => { setFrom(true); w.openTrace(a.block!) }} aria-label="Open the trace"><Icon name="chevron-right" size={15} /></button>}
            </li>
          )
        })}
      </ol>
      <p className="rail-demo"><span className="tk">Demo</span><button className="wl" onClick={w.replay}>Replay live updates</button></p>
      </div>}
    </aside>
  )
}

/** Home (Wikimind 4's front page): a plain headline with one live line, the path to automation, three trust cards, the agents, what's moving beside the page in focus, unwritten rules and the spaces. Read-only. */
/** Each agent's path to automation, and what is blocking or needed for the rest. Demo data. */
const REL: Record<AgentId, { rel: number; own: number; ask: number; tag?: string; needs: string[] }> = {
  approvals: { rel: 99.0, own: 52, ask: 38, tag: 'Asking Maria', needs: ['Maria Okafor: confirm flat renewals skip approval on purpose (asked Oct 27)', 'One more EMEA deal, to confirm regional-director routing', 'Discounts over 20%: 30 more decisions that match a person'] },
  access: { rel: 98.1, own: 78, ask: 18, needs: ['Seat reclaims: 2 more decisions that match a person', 'Admin rights stay with people, by policy'] },
  security: { rel: 97.4, own: 41, ask: 40, tag: 'Needs Okta logs', needs: ['IT: grant read access to Okta sign-in logs (asked Nov 1)', 'Device wipes: shadow 20 more'] },
  finance: { rel: 99.3, own: 58, ask: 34, needs: ['Finance: grant NetSuite write access, to fix the invoice mismatches it finds', 'Payments stay with people, by policy'] },
  integrations: { rel: 98.4, own: 70, ask: 22, tag: 'Asking Ben Ito', needs: ['Ben Ito: explain why multi-currency CPQ quotes fail', 'Dev: approve a retry policy for NetSuite sync'] },
  support: { rel: 98.9, own: 74, ask: 22, needs: ['Kim (Support): confirm the data-loss escalation rule'] },
}

/** A mini path bar: 3px square bars, 3px gaps, one bar per 2.5% of the work. */
function MiniBar({ own, ask }: { own: number; ask: number }) {
  const n = 40, o = Math.round(n * own / 100), a = Math.round(n * ask / 100)
  return <span className="mini" aria-label={`${own}% on its own, ${ask}% asks first, ${100 - own - ask}% blocked`}>{Array.from({ length: n }, (_, i) => <i key={i} className={i < o ? 'own' : i < o + a ? 'ask' : 'gap'} />)}</span>
}

/** Home (Wikimind 4's front page, at Wikimind 4's width): headline and live line, path to automation, three cards, the agents (each expands to what blocks it), what's moving beside the page in focus, unwritten rules, and the sources footer. Read-only. */
function Home() {
  const w = useW(), last = w.acts[0], [open, setOpen] = useState<AgentId | null>(null)
  return (
    <article className="doc home wide">
      <p className="home-k">Rippling, as the agents see it</p>
      <h1>What the agents run today, and what they still need.</h1>
      <div className="home-row">
        {last && <p className="liveln"><LivePulse /><span><b>{last.ag === 'person' ? last.who : AG[last.ag].name}</b> {last.t.charAt(0).toLowerCase() + last.t.slice(1)}</span></p>}
        <button className="btn primary tour-b" onClick={() => w.setTour(0)}><Icon name="play" size={13} />Take the 1-minute tour</button>
      </div>
      <PathBar own={64} ask={29} gaps="Okta sign-in logs, NetSuite write access" card />
      <div className="home-3">
        <div className="hc"><span className="tk">Reliability</span><b>98.6%</b><p>matched a person on 1,912 decisions in 30 days</p><button className="wl" onClick={() => w.go('discount-approvals')}>See the 3 misses</button></div>
        <div className="hc"><span className="tk">Automation</span><b>64%</b><p>runs on its own, up from 51% in September</p></div>
        <div className="hc"><span className="tk">Gaps</span><b>7%</b><p>blocked until they get Okta sign-in logs and NetSuite write access</p></div>
      </div>
      <section className="home-card">
        <div className="home-ch"><h2>The agents</h2><span className="tk">6 agents, one job each</span></div>
        <ul className="ags8">{AGENTS.map((a) => {
          const r = REL[a.id], isOpen = open === a.id, sp = SPACES.find((s) => s.ag === a.id)!
          return (
            <li key={a.id} className={isOpen ? 'open' : ''}>
              <button className="ags8-r" onClick={() => setOpen(isOpen ? null : a.id)} aria-expanded={isOpen}>
                <span className="ag-row"><Ag id={a.id} size={30} /><span><b>{a.name}</b><small>{a.job}</small></span></span>
                <span className="ags8-c"><span className="tk">Reliability</span><span className="num">{r.rel.toFixed(1)}%</span></span>
                <span className="ags8-c own"><span className="tk">Path to automation</span><span className="ags8-b"><MiniBar own={r.own} ask={r.ask} /><span className="num">{r.own}%</span></span></span>
                <span className="ags8-t">{(a.id !== 'approvals' || !w.why['renew']) && r.tag && <span className="ask-tag">{r.tag}</span>}</span>
                <span className="ags8-ch" aria-hidden="true"><Icon name="chevron-down" size={15} /></span>
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
      <div className="home-2">
        <section className="home-card">
          <div className="home-ch"><h2>What’s moving</h2><span className="tk">{w.acts.length} today</span></div>
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
          <button className="focus-cta" onClick={() => w.go('discount-approvals')}><span>See who approves your deal</span><Icon name="arrow-right" size={15} /></button>
        </section>
      </div>
      <section className="home-card">
        <span className="tk">Unwritten rules the agents found</span>
        <ul className="rules8 cols">
          <li><b>At quarter end, large deals are approved in Slack before Salesforce.</b><small>Approvals · 9 #deal-desk threads</small></li>
          <li><b>Approval requests expire after 14 days, since two deals closed on six-week-old prices.</b><small>Approvals · #revops, 2024</small></li>
          <li><b>Cases that mention data loss get escalated by hand, whatever their priority.</b><small>Support · 11 of 11 cases</small></li>
        </ul>
      </section>
      <Sources items={[{ ic: 'hash', name: 'Slack: 48,210 messages' }, { ic: 'ticket', name: 'Tickets: 1,912' }, { ic: 'cloud', name: 'Salesforce: six years of changes' }, { ic: 'video', name: 'Meetings: 214' }, { ic: 'file-text', name: 'Documents: 380' }]}>
        <b>1,284 pages</b> written by 6 agents from <b>3,912</b> observations this week. None typed by a person.
      </Sources>
    </article>
  )
}

function Shell() {
  const w = useW()
  // On wider screens the nav floats without a scrim: a click anywhere outside it closes it.
  useEffect(() => {
    if (!w.nav) return
    const f = (e: MouseEvent) => { const t = e.target as HTMLElement; if (!t.closest('.sb') && !t.closest('.top-menu')) w.setNav(false) }
    document.addEventListener('mousedown', f); return () => document.removeEventListener('mousedown', f)
  }, [w.nav]) // eslint-disable-line react-hooks/exhaustive-deps
  // Floating panels sit below the variant bar until it scrolls away.
  useEffect(() => {
    const f = () => document.documentElement.style.setProperty('--vtop', Math.max(12, 76 - scrollY) + 'px')
    f(); addEventListener('scroll', f, { passive: true }); return () => { removeEventListener('scroll', f); document.documentElement.style.removeProperty('--vtop') }
  }, [])
  return (
    <div className={'w7' + (w.nav ? ' nav-on' : '') + (w.rail ? ' rail-on' : '') + (w.page === 'home' ? ' pg-home' : '')}>
      <Sidebar />
      {w.nav && innerWidth < 900 && <button className="scrim" aria-label="Close pages" onClick={() => w.setNav(false)} />}
      <main className="main">
        <Top />
        {w.page === 'home' ? <Home /> : w.page === 'discount-approvals' ? <Approvals /> : <Stub id={w.page} />}
        <Omni />
        <Tour />
      </main>
      <Rail />
    </div>
  )
}

/**
 * Wikimind 7: the wiki structure decision makers know (Confluence spaces, Notion pages, properties, blocks, toggles,
 * tables), made agent first: each agent keeps a space, presence shows who is on a page, edits are announced and typed
 * in where you can see them, and How it works is a live diagram of the agent's flow with its conditional routes.
 */
export default function Wikimind8() {
  useVariantCss(css)
  return <Provider><Shell /></Provider>
}
