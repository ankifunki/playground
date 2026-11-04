import type React from 'react'
import { useEffect, useState } from 'react'
import { useVariantCss } from '../../useVariantCss'
import { AG, AGENTS, ago, PAGES, SPACES, type AgentId } from './data'
import { Icon } from './Icon'
import { Ag, LiveNum, LivePulse, Sources } from './Live'
import { Omni } from './Omni'
import { Trace } from './Trace'
import { TRACE } from './traces'
import { Approvals, Stub } from './Page'
import { Home } from './Home'
import { NewsHome } from './NewsHome'
import { AgentProfile } from './Agents'
import { Misses } from './Misses'
import { AllPages } from './Pages'
import { Tour } from './Tour'
import { Provider, useW } from './store'
import css from './styles.css?inline'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'

type Look = 'current' | 'b'
/** Which look: today's, or Direction B (Calibrated instrument). ?look=b or the top-bar switch; remembered. */
function useLook(): [Look, () => void] {
  const [look, setLook] = useState<Look>(() => {
    const u = new URLSearchParams(location.search).get('look')
    if (u === 'b' || u === 'current') return u
    try { return localStorage.getItem('wm8-look') === 'b' ? 'b' : 'current' } catch { return 'current' }
  })
  useEffect(() => {
    if (look === 'b') document.documentElement.dataset.look = 'b'; else delete document.documentElement.dataset.look
    try { localStorage.setItem('wm8-look', look) } catch { /* private mode */ }
    return () => { delete document.documentElement.dataset.look }
  }, [look])
  return [look, () => setLook((l) => (l === 'b' ? 'current' : 'b'))]
}

/** Left sidebar: the workspace, search, and one space per agent with its pages. A page an agent is writing shows it. */
function Sidebar() {
  const w = useW(), [q, setQ] = useState(''), [open, setOpen] = useState<Record<string, boolean>>({ approvals: true, integrations: true })
  const editingPage = w.presence?.page
  return (
    <nav className={'sb' + (w.nav ? ' open' : '')} aria-label="Workspace">
      <div className="sb-ws"><span className="sb-logo">R</span><span><b>Rippling</b><small>Wikimind · kept by 6 agents</small></span><button className="ib sb-x" onClick={() => w.setNav(false)} aria-label="Close pages"><Icon name="x" size={16} /></button></div>
      <label className="sb-q"><Icon name="search" size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { w.setSearch(q.trim()); w.go('all'); setQ('') } }} placeholder="Search 1,284 pages" aria-label="Search pages: Enter searches what they say" /></label>
      <button className={'sb-i' + (w.page === 'home' ? ' on' : '')} onClick={() => w.go('home')}><Icon name="house" size={16} />Home</button>
      <button className={'sb-i' + (w.page === 'all' ? ' on' : '')} onClick={() => { w.setSearch(''); w.go('all') }}><Icon name="library" size={16} />All pages<span className="sb-n">1,284</span></button>
      <button className="sb-i" onClick={() => w.setRail(true)}><Icon name="activity" size={16} />Live activity<span className="sb-n"><LiveNum value={w.acts.length} /></span></button>
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
    </nav>
  )
}

/** The top bar: where you are, who is on this page right now, the activity rail. Below it, presence when an agent is editing. */
function Top({ look, onLook }: { look: Look; onLook: () => void }) {
  const w = useW(), p = PAGES[w.page] || null
  const here: AgentId[] = p ? (p.id === 'discount-approvals' ? ['approvals', 'finance', 'integrations'] : [p.ag]) : AGENTS.map((a) => a.id)
  const pr = w.presence && (w.page === 'home' || w.presence.page === w.page) ? w.presence : null
  return (
    <div className="top">
      <div className="top-r">
        <button className="ib top-menu" onClick={() => w.setNav(!w.nav)} aria-label={w.nav ? 'Hide pages' : 'Show pages'} aria-pressed={w.nav}><span className="hb" aria-hidden="true"><i /><i /><i /></span></button>
        <div className="crumb">
          {p ? <><button onClick={() => w.go('home')}>Rippling</button><Icon name="chevron-right" size={12} /><span className="crumb-sp"><Ag id={p.ag} size={16} />{AG[p.ag].name} grove</span><Icon name="chevron-right" size={12} /><b>{p.title}</b></> : <b>{w.page === 'all' ? 'All pages' : 'Home'}</b>}
        </div>
        <div className={'here' + (pr ? ' live' : '')}>
          <button className="cap" onClick={() => pr && w.jump(pr.block)} disabled={!pr} aria-label={pr ? `${AG[pr.ag].name} agent is writing ${pr.label}: watch it` : `${here.length} agents on this page`}>
            <span className="here-p">{(pr ? [pr.ag, ...here.filter((x) => x !== pr.ag)] : here).map((id, i) => <span key={id} className={'here-a' + (pr && i === 0 ? ' w' : '')}><Ag id={id} size={pr && i === 0 ? 28 : 24} /></span>)}</span>
            <span className="cap-t" aria-hidden={!pr}>{pr && <><b>{AG[pr.ag].name}</b> writing <b>{pr.label}</b>{w.page === 'home' && <> · {PAGES[pr.page].title}</>}<Icon name="arrow-right" size={12} /></>}</span>
            {!pr && <span className="here-t">{here.length === 1 ? '1 agent here' : `${here.length} agents here`}</span>}
          </button>
        </div>
        <button className="look" onClick={onLook} aria-pressed={look === 'b'} title="Switch between today’s look and Direction B"><Icon name="sliders" size={14} /><span>Look</span><b>{look === 'b' ? 'B · Calibrated' : 'Current'}</b></button>
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
        {w.trace || w.agent || w.misses ? <span className="rail-t"><button className="ib rail-back" onClick={() => { setFrom(false); if (w.trace) w.openTrace(null); else if (w.misses) w.openMisses(null); else w.openAgent(null) }} aria-label="Back to live activity"><Icon name="chevron-right" size={16} /></button><span className="rail-crumb">{from && <span>Live activity</span>}{w.trace ? 'Trace' : w.misses ? 'Misses' : 'Agent'}</span></span>
          : <span className="rail-t"><LivePulse on={w.playing} />Live activity</span>}
        <button className="ib" onClick={() => { w.setRail(false); w.openTrace(null); w.openAgent(null); w.openMisses(null) }} aria-label="Close"><Icon name="x" size={16} /></button>
      </div>
      {w.trace ? <div className="rail-sc rail-push" key={w.trace}><Trace id={w.trace} /></div> : w.misses ? <div className="rail-sc rail-push" key={'m-' + w.misses}><Misses only={w.misses} /></div> : w.agent ? <div className="rail-sc rail-push" key={w.agent}><AgentProfile id={w.agent} /></div> : <div className="rail-list rail-pop">
      <ol>
        {w.acts.map((a) => {
          return (
            <li key={a.id} className={a.id > 0 && w.now - a.at < 6000 ? 'in' : ''}>
              {a.ag === 'person' ? <span className="rail-p" aria-hidden="true"><Icon name="user" size={12} /></span> : <Ag id={a.ag} size={22} />}
              <span className="rail-m">
                <span className="rail-x"><b>{a.ag === 'person' ? a.who : AG[a.ag].name}</b> {a.t.charAt(0).toLowerCase() + a.t.slice(1)}</span>
                <small>{ago((w.now - a.at) / 1000)} · <button className="wl" onClick={() => (a.block ? w.jump(a.block) : w.go(a.page))}>{PAGES[a.page].title}</button></small>
              </span>
              {a.block && TRACE[a.block] && w.proof && <button className="ib rail-ch" onClick={() => { setFrom(true); w.openTrace(a.block!) }} aria-label="Open the trace"><Icon name="chevron-right" size={16} /></button>}
            </li>
          )
        })}
      </ol>
      <p className="rail-demo"><span className="tk">Demo</span><button className="wl" onClick={w.replay}>Replay live updates</button></p>
      </div>}
    </aside>
  )
}

function Shell({ news }: { news?: boolean }) {
  const w = useW(), [look, toggleLook] = useLook()
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
    <div className={'w7' + (w.nav ? ' nav-on' : '') + (w.rail ? ' rail-on' : '') + (w.page === 'home' ? ' pg-home' : '') + (w.proof ? '' : ' noproof')}>
      <Sidebar />
      {w.nav && innerWidth < 900 && <button className="scrim" aria-label="Close pages" onClick={() => w.setNav(false)} />}
      <main className="main">
        <Top look={look} onLook={toggleLook} />
        {w.page === 'home' ? (news ? <NewsHome /> : <Home />) : w.page === 'all' ? <AllPages /> : w.page === 'discount-approvals' ? <Approvals /> : <Stub id={w.page} />}
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
export default function Wikimind8({ news }: { news?: boolean }) {
  useVariantCss(css)
  return <Provider><Shell news={news} /></Provider>
}
