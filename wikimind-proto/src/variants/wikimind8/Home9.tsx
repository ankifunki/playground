import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AgentsOverview, GrantBtn } from './Agents'
import { AG, type AgentId } from './data'
import { HomeLive, HomeSources, MovingFocus, RulesCard, useRun } from './Home'
import { Icon, type IconName } from './Icon'
import { Ag } from './Live'
import { ComingUp, Stories, Today } from './NewsHome'
import { PathBar } from './Page'
import { GAPS, useW, type Gap } from './store'
import { Toc, type TocItem } from './Toc'

/*
 * Wikimind 9's Home. For the CIO first: what Asoka runs and what holds it back, as Wikimind 8's stat cards, with the
 * access gaps as controls (Wikimind 4's, restyled). Then Asoka live, in Wikimind 5's paradigm: what it changed, what
 * it learned and what it is asking people, three columns that follow the demo. Then 8b's view of what Asoka knows and
 * runs, by job, and what's coming up. A chip nav under the top bar moves within the page, like a page's On this page.
 */


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

/*
 * Customize Home: every section is a module. Customize opens an edit mode where each module collapses to a card with
 * a grip (drag to reorder; arrow buttons do the same from the keyboard) and a hide control; hidden and extra modules
 * wait on a shelf to be added back. The layout is kept in this browser (localStorage `wm9-home`); Reset restores it.
 * The chip nav follows the order and what is shown.
 */
type ModId = 'today' | 'live' | 'jobs' | 'up' | 'moving' | 'rules' | 'counts' | 'stories'
const MODS: Record<ModId, { t: string; nav: string; title?: string; body: () => ReactNode }> = {
  today: { t: 'Asoka today', nav: 'Asoka today', title: 'Asoka today', body: () => <TodayCards /> },
  live: { t: 'Changed, learned and asking', nav: 'Changed, learned, asking', title: 'Changed, learned and asking', body: () => <LiveColumns /> },
  jobs: { t: 'What Asoka knows and runs, by job', nav: 'By job', body: () => <AgentsOverview /> },
  up: { t: 'Coming up', nav: 'Coming up', body: () => <ComingUp /> },
  moving: { t: 'What’s moving and In focus', nav: 'What’s moving', body: () => <MovingFocus /> },
  rules: { t: 'Unwritten rules', nav: 'Unwritten rules', body: () => <RulesCard /> },
  counts: { t: 'Today’s counts: observed, learned, rewrote', nav: 'Today', body: () => <Today /> },
  stories: { t: 'Today’s stories', nav: 'Stories', body: () => <Stories /> },
}
/** Widths on the page's 12-column grid: a third, a half, two thirds, or the full width. Phones stack everything. */
type W = 4 | 6 | 8 | 12
const SIZES: { w: W; label: string; name: string }[] = [{ w: 4, label: '⅓', name: 'a third' }, { w: 6, label: '½', name: 'half' }, { w: 8, label: '⅔', name: 'two thirds' }, { w: 12, label: 'Full', name: 'full width' }]
type Slot = { id: ModId; w: W }
const DEFAULT: Slot[] = [{ id: 'today', w: 12 }, { id: 'live', w: 12 }, { id: 'jobs', w: 12 }, { id: 'up', w: 12 }]
const SUGGEST: Record<ModId, W> = { today: 12, live: 12, jobs: 12, up: 12, moving: 12, rules: 6, counts: 6, stories: 8 }
const ALL = Object.keys(MODS) as ModId[]
function readLayout(): Slot[] {
  try {
    const v = JSON.parse(localStorage.getItem('wm9-home') || 'null')
    if (Array.isArray(v)) {
      const slots = v.map((x) => (typeof x === 'string' ? { id: x, w: 12 } : x)).filter((x) => ALL.includes(x.id) && [4, 6, 8, 12].includes(x.w))
      if (slots.length === v.length) return slots as Slot[]
    }
  } catch { /* private mode */ }
  return DEFAULT
}

export function Home9() {
  const [layout, setLayout] = useState<Slot[]>(readLayout), [edit, setEdit] = useState(false)
  const [drag, setDrag] = useState<ModId | null>(null), [over, setOver] = useState<{ id: ModId; after: boolean; side: boolean } | null>(null)
  const [moved, setMoved] = useState<ModId | null>(null), flash = useRef(0), dragRef = useRef<ModId | null>(null)
  useEffect(() => { try { localStorage.setItem('wm9-home', JSON.stringify(layout)) } catch { /* private mode */ } }, [layout])
  const mark = (id: ModId) => { setMoved(id); window.clearTimeout(flash.current); flash.current = window.setTimeout(() => setMoved(null), 900) }
  const move = (id: ModId, to: number) => { setLayout((o) => { const it = o.find((x) => x.id === id)!, a = o.filter((x) => x.id !== id); a.splice(Math.max(0, Math.min(a.length, to)), 0, it); return a }); mark(id) }
  const resize = (id: ModId, w: W) => { setLayout((o) => o.map((x) => (x.id === id ? { ...x, w } : x))); mark(id) }
  const hide = (id: ModId) => setLayout((o) => o.filter((x) => x.id !== id))
  const add = (id: ModId) => { setLayout((o) => [...o, { id, w: SUGGEST[id] }]); mark(id) }
  const shelf = ALL.filter((id) => !layout.some((x) => x.id === id))
  const navKey = layout.map((x) => x.id).join(',')
  const nav: TocItem[] = useMemo(() => layout.map((x) => ({ id: 'h-' + x.id, t: MODS[x.id].nav })), [navKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const drop = () => {
    const d = dragRef.current
    if (d && over && d !== over.id) {
      const it = layout.find((x) => x.id === d)!, a = layout.filter((x) => x.id !== d), i = a.findIndex((x) => x.id === over.id)
      a.splice(over.after ? i + 1 : i, 0, it); setLayout(a); mark(d)
    }
    dragRef.current = null; setDrag(null); setOver(null)
  }
  return (
    <article className={'doc home wide h9' + (edit ? ' h9-edit' : '')}>
      <p className="home-k">Rippling</p>
      <h1>What Asoka runs today, and what still needs people.</h1>
      <HomeLive />
      <div className="h9-bar">
        {!edit && layout.length > 0 && <Toc items={nav} chips />}
        {!edit && <button className="btn ghost h9-cust" onClick={() => setEdit(true)}><Icon name="sliders" size={14} />Customize</button>}
      </div>
      {edit && (
        <div className="h9-tools" role="region" aria-label="Customize Home">
          <div className="h9-tools-h">
            <span><b>Customize Home</b>Drag modules to reorder, size them on the grid, or hide what you don’t need.</span>
            <span className="h9-tools-b"><button className="btn ghost" onClick={() => setLayout(DEFAULT)}>Reset</button><button className="btn primary" onClick={() => setEdit(false)}>Done</button></span>
          </div>
          {shelf.length > 0 && <div className="h9-shelf"><span className="tk">Add a module</span>{shelf.map((id) => <button key={id} onClick={() => add(id)}><Icon name="plus" size={14} />{MODS[id].t}</button>)}</div>}
        </div>
      )}
      <div className="h9-grid">
        {layout.map(({ id, w }, i) => {
          const m = MODS[id]
          const cls = 'h9-s w' + w + (edit ? ' h9-m' : '') + (drag === id ? ' dragging' : '') + (moved === id ? ' moved' : '') + (over?.id === id && drag !== id ? (over.after ? ' drop-after' : ' drop-before') + (over.side ? ' side' : '') : '')
          return (
            <section key={id} id={'h-' + id} className={cls}
              draggable={edit} onDragStart={(e) => { dragRef.current = id; setDrag(id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id) }}
              onDragOver={(e) => {
                if (!dragRef.current) return; e.preventDefault()
                // Beside a narrow module, drop to its left or right; above or below a full-width one.
                const r = e.currentTarget.getBoundingClientRect(), side = w < 12
                setOver({ id, side, after: side ? e.clientX > r.left + r.width / 2 : e.clientY > r.top + r.height / 2 })
              }}
              onDrop={(e) => { e.preventDefault(); drop() }} onDragEnd={() => { dragRef.current = null; setDrag(null); setOver(null) }}>
              {edit && (
                <div className="h9-mh">
                  <span className="h9-grip" aria-hidden="true"><Icon name="grip-vertical" size={16} /></span>
                  <b>{m.t}</b>
                  <span className="h9-sz" role="group" aria-label={`Size of ${m.t}`}>{SIZES.map((z) => <button key={z.w} className={z.w === w ? 'on' : ''} aria-pressed={z.w === w} aria-label={z.name} title={z.name} onClick={() => resize(id, z.w)}>{z.label}</button>)}</span>
                  <span className="h9-mb">
                    <button className="ib" onClick={() => move(id, i - 1)} disabled={i === 0} aria-label={`Move ${m.t} earlier`}><Icon name="chevron-up" size={16} /></button>
                    <button className="ib" onClick={() => move(id, i + 1)} disabled={i === layout.length - 1} aria-label={`Move ${m.t} later`}><Icon name="chevron-down" size={16} /></button>
                    <button className="ib" onClick={() => hide(id)} aria-label={`Hide ${m.t}`} title="Hide"><Icon name="eye-off" size={16} /></button>
                  </span>
                </div>
              )}
              <div className="h9-body" inert={edit}>{m.title && <h2 className="h9-t">{m.title}</h2>}{m.body()}</div>
            </section>
          )
        })}
      </div>
      {!layout.length && <p className="h9-empty">Home is empty. <button className="wl" onClick={() => { setEdit(true) }}>Add a module</button></p>}
      <HomeSources />
    </article>
  )
}
