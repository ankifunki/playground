import { useEffect, useState } from 'react'
import { useVariantCss } from '../../useVariantCss'
import { AG, AGENTS, ago, PAGES, SPACES, type AgentId } from './data'
import { Icon } from './Icon'
import { Ag, LivePulse } from './Live'
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
      <div className="sb-ws"><span className="sb-logo">N</span><span><b>Northwind</b><small>Wikimind · kept by 6 agents</small></span></div>
      <label className="sb-q"><Icon name="search" size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 1,284 pages" /></label>
      <button className={'sb-i' + (w.page === 'home' ? ' on' : '')} onClick={() => w.go('home')}><Icon name="house" size={15} />Home</button>
      <button className="sb-i" onClick={() => w.setRail(true)}><Icon name="activity" size={15} />Live activity<span className="sb-n">{w.acts.length}</span></button>
      <div className="sb-l">Spaces</div>
      {SPACES.map((s) => {
        const pages = s.pages.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()))
        if (q && !pages.length) return null
        const isOpen = q ? true : open[s.ag]
        const busy = w.presence?.ag === s.ag
        return (
          <div key={s.ag} className="sb-sp">
            <button className="sb-h" aria-expanded={isOpen} onClick={() => setOpen((o) => ({ ...o, [s.ag]: !o[s.ag] }))}>
              <span className={'sb-ch' + (isOpen ? ' open' : '')}><Icon name="chevron-right" size={12} /></span>
              <Ag id={s.ag} size={18} /><span className="sb-t">{AG[s.ag].name}</span>
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
      <p className="sb-foot">No folders, no typing: each agent writes and keeps its own space.</p>
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
          {p ? <><button onClick={() => w.go('home')}>Northwind</button><Icon name="chevron-right" size={12} /><span className="crumb-sp"><Ag id={p.ag} size={16} />{AG[p.ag].name}</span><Icon name="chevron-right" size={12} /><b>{p.title}</b></> : <b>Home</b>}
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
const REL: Record<AgentId, { rel: number; own: number; ask?: string }> = {
  approvals: { rel: 99.0, own: 52, ask: 'Asking Maria' }, access: { rel: 98.1, own: 78 }, security: { rel: 97.4, own: 41, ask: 'Needs Okta logs' },
  finance: { rel: 99.3, own: 58 }, integrations: { rel: 98.4, own: 70, ask: 'Asking Ben Ito' }, support: { rel: 98.9, own: 74 },
}
function Home() {
  const w = useW(), last = w.acts[0]
  return (
    <article className="doc home">
      <p className="home-k">Northwind, as the agents understand it</p>
      <h1>What you can trust the agents with today, and what they still need.</h1>
      <div className="home-row">
        {last && <p className="liveln"><LivePulse /><span><b>{last.ag === 'person' ? last.who : AG[last.ag].name}</b> {last.t.charAt(0).toLowerCase() + last.t.slice(1)}</span></p>}
        <button className="tour-b" onClick={() => w.setTour(0)}><Icon name="play" size={13} />Take the 1-minute tour</button>
      </div>
      <PathBar own={64} ask={29} gaps="Okta sign-in logs, NetSuite write access" card />
      <div className="home-3">
        <div className="hc"><span className="tk">Reliability</span><b>98.6%</b><p>matched a person across 1,912 decisions in 30 days</p><button className="wl" onClick={() => w.go('discount-approvals')}>See the 3 misses</button></div>
        <div className="hc"><span className="tk">Automation</span><b>64%</b><p>runs on its own, up from 51% in September</p></div>
        <div className="hc"><span className="tk">Gaps</span><b>7%</b><p>blocked by missing access or knowledge: Okta sign-in logs, NetSuite write access</p></div>
      </div>
      <section className="home-card">
        <div className="home-ch"><h2>The agents</h2><span className="tk">6 agents, one job each</span></div>
        <table className="ag-t8"><tbody>{AGENTS.map((a) => (
          <tr key={a.id}>
            <td><span className="ag-row"><Ag id={a.id} size={30} /><span><b>{a.name}</b><small>{a.job}</small></span></span></td>
            <td><span className="tk">Reliability</span><span className="num">{REL[a.id].rel.toFixed(1)}%</span></td>
            <td className="own"><span className="tk">On its own</span><span className="own-b"><i style={{ width: REL[a.id].own + '%' }} /></span><span className="num">{REL[a.id].own}%</span></td>
            <td className="ask">{(a.id !== 'approvals' || !w.why['renew']) && REL[a.id].ask && <span className="ask-tag">{REL[a.id].ask}</span>}</td>
          </tr>))}</tbody></table>
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
          <p>How Northwind reviews large deals before they move to Negotiation. Any deal over $100,000 needs approval, and who approves depends on the discount. 212 approvals watched this quarter.</p>
          <span className="focus-by"><Ag id="approvals" name size={20} /><span>5 of 8 verified · rewritten Oct 28</span></span>
          <button className="wl" onClick={() => w.go('discount-approvals')}>Open the page</button>
        </section>
      </div>
      <div className="home-2">
        <section className="home-card">
          <span className="tk">Unwritten rules the agents found</span>
          <ul className="rules8">
            <li><b>At quarter end, large deals are approved in Slack before Salesforce.</b><small>Approvals · 9 #deal-desk threads</small></li>
            <li><b>Approval requests expire after 14 days because two deals once closed on six-week-old prices.</b><small>Approvals · #revops, 2024</small></li>
            <li><b>Cases that mention data loss get escalated by hand, whatever their priority.</b><small>Support · 11 of 11 cases</small></li>
          </ul>
        </section>
        <section className="home-card">
          <span className="tk">Spaces</span>
          <div className="areas8">{SPACES.map((s) => (
            <button key={s.ag} className={w.presence?.ag === s.ag ? 'busy' : ''} onClick={() => w.go(s.pages[0].id)}>
              <b>{AG[s.ag].name}</b><small>{w.presence?.ag === s.ag ? <><LivePulse />writing now</> : `${s.total} pages`}</small>
            </button>))}</div>
        </section>
      </div>
    </article>
  )
}

function Shell() {
  const w = useW()
  // Floating panels sit below the variant bar until it scrolls away.
  useEffect(() => {
    const f = () => document.documentElement.style.setProperty('--vtop', Math.max(12, 76 - scrollY) + 'px')
    f(); addEventListener('scroll', f, { passive: true }); return () => { removeEventListener('scroll', f); document.documentElement.style.removeProperty('--vtop') }
  }, [])
  return (
    <div className={'w7' + (w.nav ? ' nav-on' : '') + (w.rail ? ' rail-on' : '')}>
      <Sidebar />
      {w.nav && <button className="scrim" aria-label="Close pages" onClick={() => w.setNav(false)} />}
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
