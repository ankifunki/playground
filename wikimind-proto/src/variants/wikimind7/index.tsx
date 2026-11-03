import { useEffect, useState } from 'react'
import '@fontsource-variable/schibsted-grotesk'
import '@fontsource/dm-mono/400.css'
import { useVariantCss } from '../../useVariantCss'
import { AG, AGENTS, ago, PAGES, SPACES, type AgentId } from './data'
import { Icon } from './Icon'
import { Ag } from './Live'
import { Omni } from './Omni'
import { Trace } from './Trace'
import { TRACE } from './traces'
import { Approvals, Stub } from './Page'
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
  const w = useW(), [openId, setOpenId] = useState<number | null>(null)
  return (
    <aside className={'rail' + (w.rail ? ' open' : '')} aria-label="Live activity">
      <div className="rail-h">
        {w.trace ? <span className="rail-t"><button className="ib" onClick={() => w.openTrace(null)} aria-label="Back to live activity"><Icon name="chevron-down" size={15} /></button>Trace</span>
          : <span className="rail-t"><i className={w.playing ? 'on' : ''} aria-hidden="true" />Live activity</span>}
        <button className="ib" onClick={() => { w.setRail(false); w.openTrace(null) }} aria-label="Close"><Icon name="x" size={15} /></button>
      </div>
      {w.trace ? <div className="rail-sc"><Trace id={w.trace} /></div> : <>
      <ol>
        {w.acts.map((a) => {
          // One level deeper: why it happened, where it came from, what it said before. From the live edit, else the block's trace.
          const y = a.block ? w.why[a.block] : undefined, base = a.block ? TRACE[a.block] : undefined
          const lastStep = base ? [...base.steps, ...(w.extra[a.block!] || [])].slice(-1)[0] : undefined
          const detail = y ? { t: y.t, src: y.src, before: y.before } : lastStep ? { t: lastStep.t, src: lastStep.src, before: lastStep.before } : null
          const open = openId === a.id
          return (
            <li key={a.id} className={(a.id > 0 && w.now - a.at < 6000 ? 'in' : '') + (open ? ' open' : '')}>
              {a.ag === 'person' ? <span className="rail-p" aria-hidden="true"><Icon name="user" size={12} /></span> : <Ag id={a.ag} size={22} />}
              <span className="rail-m">
                <span className="rail-x"><b>{a.ag === 'person' ? a.who : AG[a.ag].name}</b> {a.t.charAt(0).toLowerCase() + a.t.slice(1)}</span>
                <small>{ago((w.now - a.at) / 1000)} · <button className="wl" onClick={() => (a.block ? w.jump(a.block) : w.go(a.page))}>{PAGES[a.page].title}</button></small>
                {open && detail && (
                  <span className="rail-d">
                    <span className="rail-dt">{detail.t}</span>
                    {detail.src && <span className="rail-ds">{detail.src}</span>}
                    {detail.before && <span className="rail-db"><span className="tk">Before</span><del>{detail.before}</del></span>}
                    {a.block && TRACE[a.block] && <button className="wl rail-full" onClick={() => w.openTrace(a.block!)}>Full trace</button>}
                  </span>
                )}
              </span>
              {detail && <button className={'ib rail-ch' + (open ? ' open' : '')} onClick={() => setOpenId(open ? null : a.id)} aria-expanded={open} aria-label={open ? 'Hide details' : 'Show details'}><Icon name="chevron-right" size={14} /></button>}
            </li>
          )
        })}
      </ol>
      <p className="rail-demo"><span className="tk">Demo</span><button className="wl" onClick={w.replay}>Replay live updates</button></p>
      </>}
    </aside>
  )
}

/** Workspace home, Confluence-style: what is happening now, the spaces, and what was updated recently. */
function Home() {
  const w = useW()
  return (
    <article className="doc home">
      <h1>Northwind</h1>
      <p className="home-l">1,284 pages about Northwind’s Salesforce and how the company really runs it, written and kept current by six agents. Nobody types here; you read, and the agents show their work.</p>
      <h2>Happening now</h2>
      <ol className="home-now">
        {w.acts.slice(0, 5).map((a) => (
          <li key={a.id}>
            {a.ag === 'person' ? <span className="rail-p" aria-hidden="true"><Icon name="user" size={12} /></span> : <Ag id={a.ag} size={22} />}
            <span className="rail-x"><b>{a.ag === 'person' ? a.who : AG[a.ag].name}</b> {a.t.charAt(0).toLowerCase() + a.t.slice(1)}</span>
            <button className="wl" onClick={() => (a.block ? w.jump(a.block) : w.go(a.page))}>{PAGES[a.page].title}</button>
            <small>{ago((w.now - a.at) / 1000)}</small>
          </li>
        ))}
      </ol>
      <h2>Spaces</h2>
      <div className="home-sp">
        {SPACES.map((s) => (
          <button key={s.ag} className={'home-c' + (w.presence?.ag === s.ag ? ' busy' : '')} onClick={() => w.go(s.pages[0].id)}>
            <Ag id={s.ag} size={28} />
            <b>{AG[s.ag].name}</b>
            <small>{AG[s.ag].job}</small>
            <span className="home-cm">{w.presence?.ag === s.ag ? <><Icon name="pencil-line" size={12} />Writing {w.presence.label}</> : `${s.total} pages`}</span>
          </button>
        ))}
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
export default function Wikimind7() {
  useVariantCss(css)
  return <Provider><Shell /></Provider>
}
