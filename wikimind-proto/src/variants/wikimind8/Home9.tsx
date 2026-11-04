import type React from 'react'
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AgentsOverview, GrantBtn } from './Agents'
import { AG, type AgentId } from './data'
import { HomeLive, HomeSources, MovingFocus, RulesCard, useRun } from './Home'
import { Icon, type IconName } from './Icon'
import { Ag } from './Live'
import { Stories, Today } from './NewsHome'
import { PathBar } from './Page'
import { GAPS, useW, type Gap } from './store'
import { Toc, type TocItem } from './Toc'

/*
 * Wikimind 9's Home. For the CIO first: what Asoka runs and what holds it back, as Wikimind 8's stat cards, with the
 * access gaps as controls (Wikimind 4's, restyled). Then Asoka live, in Wikimind 5's paradigm: what it changed, what
 * it learned and what it is asking people, three columns that follow the demo. Then 8b's view of what Asoka knows and
 * runs, by job, and what's coming up. A chip nav under the top bar moves within the page, like a page's On this page.
 */


/**
 * Status, one card: the path to full automation, then Reliability and Gaps and access side by side under a hairline,
 * split by a thin vertical rule (stacked when the module is narrow). The bar already says how much Asoka runs.
 */
function StatusMod() {
  const run = useRun()
  const gapNames = run.open.map((g) => `${GAPS[g].t} (${GAPS[g].scope})`).join(', ') || 'none'
  return (
    <div className="home-card st9">
      <PathBar own={run.own} ask={run.ask} gaps={gapNames} label={false} />
      <div className="st9-row"><RelCard /><GapsCarousel blocked={run.blocked} /></div>
    </div>
  )
}
function RelCard() {
  const w = useW()
  return <div className="hc"><div className="gc-h"><span className="tk">Reliability</span></div><b>98.6%</b><p>matched a person on 1,912 decisions in 30 days</p><button className="wl" onClick={() => w.openMisses('all')}>See the 3 misses</button></div>
}

/**
 * Coming up, around readiness: each event says what Asoka will do and how ready it is (verified rules or steps, as
 * segments), with the one thing missing and the action that closes it. Ready means nothing is missing. It follows the
 * demo: Maria's answer readies quarter-end close; granting Okta sign-in logs readies the access review.
 */
function Readiness() {
  const w = useW()
  const answered = w.renewal === 'answered', okta = w.access.okta === 'done'
  type Ev = { key: string; when: string; ag: AgentId; title: string; will: string; n: number; of: number; unit: string; missing?: React.ReactNode; open?: () => void }
  const evs: Ev[] = [
    { key: 'qe', when: 'Nov 11 · in 5 business days', ag: 'approvals', title: 'Quarter-end close', will: 'Logs the deals Deal Desk approves in #deal-desk, and flags any over 35% that skip the CRO.',
      n: answered ? 4 : 3, of: 4, unit: 'rules verified', open: () => w.go('quarter-end'),
      missing: answered ? undefined : <>Do flat renewals skip approval on purpose? <span className="rd-who">Asking Maria Okafor</span></> },
    { key: 'ar', when: 'Nov 15', ag: 'security', title: 'Access review', will: 'Lists admin and API users idle for 90 days and drafts the removals for IT to approve.',
      n: okta ? 2 : 1, of: 2, unit: 'sources connected', open: () => w.go('access-reviews'),
      missing: okta ? undefined : <span className="rd-act">Needs Okta sign-in logs<GrantBtn g="okta" label="Request" /></span> },
    { key: 'ns', when: 'Waiting on Dev', ag: 'integrations', title: 'NetSuite sync retries', will: 'Retries a failed sync once, then flags it to Integrations with the error.',
      n: 1, of: 2, unit: 'approvals', open: () => w.go('cpq-sync'), missing: <>Dev to approve the retry policy <span className="rd-who">asked Nov 2</span></> },
  ]
  return (
    <section className="home-card rd" aria-label="Coming up">
      <ol>
        {evs.map((e) => {
          const ready = e.n >= e.of, state = ready ? 'Ready' : e.key === 'ns' ? 'Waiting' : e.n >= e.of - 1 && e.key === 'qe' ? 'Almost ready' : 'Blocked'
          return (
            <li key={e.key} className={ready ? 'ok' : 'gap'}>
              <span className="rd-when tk">{e.when}</span>
              <button className="rd-t" onClick={e.open}><b>{e.title}</b><span className={'rd-st ' + (ready ? 'ok' : 'warn')}>{state}</span></button>
              <p className="rd-will">{e.will}</p>
              <span className="rd-meter" aria-label={`${e.n} of ${e.of} ${e.unit}`}><span className="rd-seg" aria-hidden="true">{Array.from({ length: e.of }, (_, i) => <i key={i} className={i < e.n ? 'on' : ''} />)}</span>{e.n} of {e.of} {e.unit}</span>
              {e.missing && <p className="rd-miss">{e.missing}</p>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/**
 * The Gaps card as Wikimind 4's carousel: one access gap at a time, a pager in the header ("1 of 2" and two round
 * buttons), so the card keeps the height of its neighbours. Arrow keys page when it has focus.
 */
function GapsCarousel({ blocked }: { blocked: number }) {
  const w = useW(), keys = Object.keys(GAPS) as Gap[], [i, setI] = useState(0), g = keys[i], n = keys.length
  const go = (d: number) => setI((x) => (x + d + n) % n)
  return (
    <div className="hc gaps9">
      <div className="gc-h"><span className="tk">Gaps and access</span>
        <span className="gc-pg" role="group" aria-label="Gaps and access"><span className="tk num">{i + 1} of {n}</span>
          <button className="gc-b" onClick={() => go(-1)} aria-label="Previous gap"><Icon name="chevron-right" size={14} /></button>
          <button className="gc-b" onClick={() => go(1)} aria-label="Next gap"><Icon name="chevron-right" size={14} /></button></span>
      </div>
      <b className="num">{blocked}%</b>
      <p>{blocked ? 'blocked until Asoka gets access' : 'nothing is blocked by access'}</p>
      <div className={'gc-it ' + w.access[g]} key={g} tabIndex={0} aria-roledescription="slide" aria-label={`Gap ${i + 1} of ${n}: ${GAPS[g].t}`}
        onKeyDown={(e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1) }}>
        <span><button className="gc-name" onClick={() => w.openBlocker(g)}>{GAPS[g].t}</button><small>{GAPS[g].scope} · {GAPS[g].job} · {GAPS[g].pts}%</small></span>
        <GrantBtn g={g} label="Request" />
      </div>
    </div>
  )
}

type Item = { key: string; title: string; dek: string; ag: AgentId; src?: IconName[]; open: () => void; who?: string }

/** Asoka live, in three columns: what it changed, what it learned, what it is asking people. They follow the demo. */
export type FeedId = 'ch' | 'le' | 'as'
export const FEED_LABEL: Record<FeedId, string> = { ch: 'Changed', le: 'Learned', as: 'Asking people' }
/** The three update feeds: what Asoka changed, learned and is asking people. Newest first; they follow the demo. */
export function useFeeds(): Record<FeedId, Item[]> {
  const w = useW()
  const changed: Item[] = [
    ...(w.fin === 25 ? [{ key: 'fin', title: 'Finance now signs off over 25%, not 20%', dek: `Priya Shah changed Large Deal Approval. Who approves rewritten; Dana Ruiz ${w.verify === 'checking' ? 'is re-checking it' : 'verified it again'}.`, ag: 'approvals' as AgentId, src: ['cloud' as IconName], open: () => w.jump('who-fin') }] : []),
    w.cpq === 'failing'
      ? { key: 'cpq', title: 'CPQ quote sync is failing for multi-currency deals', dek: '412 errors since a CPQ update on Oct 29. Asked Ben Ito why.', ag: 'integrations', src: ['cloud'], open: () => w.jump('cfg-cpq') }
      : { key: 'cpq-ok', title: 'CPQ quote sync is fixed', dek: 'Ben Ito corrected the currency mapping; the next 40 quotes synced.', ag: 'integrations', src: ['cloud'], open: () => w.jump('cfg-cpq') },
    { key: 'dd', title: 'Priya Shah now leads Deal Desk', dek: 'From the org chart and #announcements. 6 pages updated.', ag: 'access', src: ['hash'], open: () => w.go('license-seats') },
    { key: 'sla', title: 'New rule: high-priority cases need an SLA', dek: 'Validation rule Priority_Requires_SLA, added yesterday.', ag: 'support', src: ['cloud'], open: () => w.go('case-escalation') },
    { key: 'cro', title: 'Discounts over 35% now go straight to the CRO', dek: 'The CRO threshold moved from 40% to 35% on Oct 28. Who approves rewritten.', ag: 'approvals', src: ['cloud'], open: () => w.jump('who-cro') },
    { key: 'seats', title: '14 unused Sales Cloud seats reclaimed', dek: 'No sign-in for 30 days; each owner was told first.', ag: 'access', src: ['cloud'], open: () => w.go('license-seats') },
    { key: 'api', title: '14 stale API users removed in the access review', dek: 'From the quarterly review; IT approved the list.', ag: 'security', src: ['cloud', 'ticket'], open: () => w.go('access-reviews') },
  ]
  const learned: Item[] = [
    ...(w.renewal === 'answered' ? [{ key: 'renew', title: 'Flat renewals skip approval on purpose', dek: 'Maria Okafor confirmed it in Slack: policy since 2023.', ag: 'approvals' as AgentId, src: ['hash' as IconName], open: () => w.jump('renew') }] : []),
    { key: 'qe', title: 'At quarter end, large deals are approved in Slack before Salesforce', dek: `${w.qe[0]} of the last ${w.qe[1]} quarter ends. Not in any policy.`, ag: 'approvals', src: ['hash', 'video'], open: () => w.jump('qe') },
    { key: 'exp', title: 'Approval requests expire after 14 days because of two stale-price deals', dek: 'The reason lived only in a 2024 #revops thread.', ag: 'approvals', src: ['cloud', 'hash'], open: () => w.jump('r-exp') },
    { key: 'loss', title: 'Cases that mention data loss are escalated by hand, whatever their priority', dek: '11 of 11 cases. Confirmed by Kim in Support.', ag: 'support', src: ['ticket'], open: () => w.go('case-escalation') },
    { key: 'inv-own', title: 'Invoice mismatches go to Finance ops, not the deal owner', dek: 'Every mismatch in 6 months was fixed by Finance ops.', ag: 'finance', src: ['ticket'], open: () => w.go('invoices') },
    { key: 'mfa', title: 'Every Salesforce profile has required MFA since March', dek: 'From the login policy history; no exceptions since.', ag: 'security', src: ['cloud'], open: () => w.go('login-policies') },
  ]
  const asking: Item[] = [
    ...(w.renewal === 'asking' ? [{ key: 'renew-q', title: 'Do flat renewals skip approval on purpose?', dek: 'Maria Okafor, RevOps · asked Oct 27', ag: 'approvals' as AgentId, open: () => w.jump('renew') }] : []),
    ...(w.cpq === 'failing' ? [{ key: 'cpq-q', title: 'Why do multi-currency quotes fail to sync?', dek: 'Ben Ito, Integrations · asked 2 days ago', ag: 'integrations' as AgentId, open: () => w.jump('cfg-cpq') }] : []),
    { key: 'emea', title: 'Do EMEA deals really go to Sofia first?', dek: 'Seen once · waiting for the next EMEA deal', ag: 'approvals', open: () => w.go('discount-approvals') },
    { key: 'okta', title: 'Who owns the Okta sign-in policy now?', dek: 'IT · asked Nov 1', ag: 'security', open: () => w.go('login-policies') },
    { key: 'inv', title: 'Should invoice mismatches under $50 be fixed automatically?', dek: 'Dana Ruiz · asked Oct 30', ag: 'finance', open: () => w.go('invoices') },
    { key: 'loss-q', title: 'Is the data-loss escalation rule official?', dek: 'Kim in Support · asked Oct 29', ag: 'support', open: () => w.go('case-escalation') },
    { key: 'seat-q', title: 'Should seats of contractors be reclaimed after 14 days?', dek: 'Priya Shah · asked Oct 25', ag: 'access', open: () => w.go('license-seats') },
  ]
  return { ch: changed, le: learned, as: asking }
}

const FEED_IC: Record<FeedId, IconName> = { ch: 'pencil-line', le: 'eye', as: 'circle-help' }
/** One feed item: title, description, then the job and its sources. */
function FeedItem({ it }: { it: Item }) {
  return (
    <button onClick={it.open}>
      <b>{it.title}</b>
      <span className="lv-d">{it.dek}</span>
      <span className="lv-f">{AG[it.ag].name}{it.src && <span className="lv-src" aria-label={`Sources: ${it.src.join(', ')}`}>{it.src.map((s) => <Icon key={s} name={s} size={12} />)}</span>}</span>
    </button>
  )
}

/** A whole feed, in the right panel ("Learn more" on its column). */
export function FeedPanel({ id }: { id: FeedId }) {
  const items = useFeeds()[id]
  return (
    <div className="ap lv one fd">
      <div className="ms-h"><span className="tk">Updates</span><b>{FEED_LABEL[id]}</b><p>{items.length} {id === 'as' ? 'questions Asoka is asking people' : id === 'le' ? 'things Asoka learned this month' : 'changes this week'}, newest first.</p></div>
      <ul>{items.map((it) => <li key={it.key}><FeedItem it={it} /></li>)}</ul>
    </div>
  )
}

/** One updates column on Home: the newest three, and Learn more for the rest. */
function LiveColumn({ only }: { only: FeedId }) {
  const w = useW(), f = useFeeds(), changed = f.ch, learned = f.le, asking = f.as

  const cols: { k: string; ic: IconName; label: string; items: Item[]; n?: number }[] = [
    { k: 'ch', ic: 'pencil-line', label: 'Changed', items: changed.slice(0, 3) },
    { k: 'le', ic: 'eye', label: 'Learned', items: learned.slice(0, 3) },
    { k: 'as', ic: 'circle-help', label: 'Asking people', items: asking.slice(0, 3), n: asking.length },
  ]
  return (
    <div className="lv one">
      {cols.filter((c) => c.k === only).map((c) => (
        <section key={c.k} className="lv-col" aria-label={c.label}>
          <div className="lv-h"><Icon name={c.ic} size={16} /><span className="tk">{c.label}</span>{c.n !== undefined && <span className="tk lv-n num">{c.n}</span>}</div>
          <ul>{c.items.map((it) => <li key={it.key}><FeedItem it={it} /></li>)}</ul>
          <button className="wl lv-more" onClick={() => w.openFeed(c.k as FeedId)}>More<Icon name="arrow-right" size={14} /></button>
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
type ModId = 'status' | 'changed' | 'learned' | 'asking' | 'jobs' | 'up' | 'moving' | 'rules' | 'counts' | 'stories'
const MODS: Record<ModId, { t: string; nav: string; title?: string; body: () => ReactNode }> = {
  status: { t: 'Status', nav: 'Status', body: () => <StatusMod /> },
  changed: { t: 'Changed', nav: 'Changed', body: () => <LiveColumn only="ch" /> },
  learned: { t: 'Learned', nav: 'Learned', body: () => <LiveColumn only="le" /> },
  asking: { t: 'Asking people', nav: 'Asking people', body: () => <LiveColumn only="as" /> },
  jobs: { t: 'Jobs', nav: 'Jobs', body: () => <AgentsOverview /> },
  up: { t: 'Coming up', nav: 'Coming up', body: () => <Readiness /> },
  moving: { t: 'What’s moving and In focus', nav: 'What’s moving', body: () => <MovingFocus /> },
  rules: { t: 'Unwritten rules', nav: 'Unwritten rules Asoka found', body: () => <RulesCard /> },
  counts: { t: 'Today’s counts', nav: 'Observed, learned, rewrote today', body: () => <Today /> },
  stories: { t: 'Today’s stories', nav: 'Today’s stories', body: () => <Stories /> },
}
/** Modules that read as one section in the nav. */
const GROUP: Partial<Record<ModId, string>> = { status: 'Status', jobs: 'Jobs', up: 'Coming up', changed: 'Updates', learned: 'Updates', asking: 'Updates' }
/** Widths on the page's 12-column grid come from where a module is dropped, never from a setting. */
type W = 4 | 6 | 8 | 12
type Slot = { id: ModId; w: W }
const DEFAULT: Slot[] = [
  { id: 'status', w: 12 },
  { id: 'changed', w: 4 }, { id: 'learned', w: 4 }, { id: 'asking', w: 4 }, { id: 'jobs', w: 12 }, { id: 'up', w: 12 },
]
const SUGGEST: Record<ModId, W> = { status: 12, changed: 4, learned: 4, asking: 4, jobs: 12, up: 12, moving: 12, rules: 6, counts: 12, stories: 12 }
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

/** Rows as the grid packs them: modules fill left to right and wrap when the next one doesn't fit in 12 columns. */
function rows(l: Slot[]): number[][] {
  const out: number[][] = []; let sum = 13
  l.forEach((x, i) => { if (sum + x.w > 12) { out.push([i]); sum = x.w } else { out[out.length - 1].push(i); sum += x.w } })
  return out
}
const SHARE: Record<number, W> = { 1: 12, 2: 6, 3: 4 }
type Zone = 'left' | 'right' | 'top' | 'bottom'
/**
 * Where a dragged module lands. Dropped on a module's left or right edge, it joins that module's row and the row
 * shares the width equally (½ + ½, or ⅓ each); on its top or bottom half, it takes a full row above or below. The row it
 * left, if that row was full, closes up: the modules that stay share its width.
 */
function place(l: Slot[], drag: ModId, target: ModId, zone: Zone): Slot[] {
  const src = rows(l).find((r) => r.some((i) => l[i].id === drag))!.map((i) => l[i])
  const srcFull = src.reduce((n, x) => n + x.w, 0) === 12
  let a = l.filter((x) => x.id !== drag).map((x) => ({ ...x }))
  if (srcFull && src.length > 1) { const stay = src.filter((x) => x.id !== drag); stay.forEach((x) => { const y = a.find((z) => z.id === x.id)!; y.w = SHARE[stay.length] || y.w }) }
  const rs = rows(a), row = rs.find((r) => r.some((i) => a[i].id === target))!, ti = a.findIndex((x) => x.id === target)
  const moving: Slot = { id: drag, w: 12 }
  if ((zone === 'left' || zone === 'right') && row.length < 3) {
    const ids = new Set([...row.map((i) => a[i].id), drag]), w = SHARE[ids.size]
    a.splice(zone === 'left' ? ti : ti + 1, 0, moving)
    return a.map((x) => (ids.has(x.id) ? { ...x, w } : x))
  }
  a.splice(zone === 'top' || zone === 'left' ? row[0] : row[row.length - 1] + 1, 0, moving)
  return a
}

export function Home9() {
  const [layout, setLayout] = useState<Slot[]>(readLayout), [edit, setEdit] = useState(false)
  const [drag, setDrag] = useState<ModId | null>(null), [over, setOver] = useState<{ id: ModId; zone: Zone } | null>(null)
  const [moved, setMoved] = useState<ModId | null>(null), flash = useRef(0)
  useEffect(() => { try { localStorage.setItem('wm9-home', JSON.stringify(layout)) } catch { /* private mode */ } }, [layout])
  const mark = (id: ModId) => { setMoved(id); window.clearTimeout(flash.current); flash.current = window.setTimeout(() => setMoved(null), 900) }
  const move = (id: ModId, to: number) => { setLayout((o) => { const it = o.find((x) => x.id === id)!, a = o.filter((x) => x.id !== id); a.splice(Math.max(0, Math.min(a.length, to)), 0, it); return a }); mark(id) }
  const hide = (id: ModId) => setLayout((o) => o.filter((x) => x.id !== id))
  const add = (id: ModId) => { setLayout((o) => [...o, { id, w: SUGGEST[id] }]); mark(id) }
  const shelf = ALL.filter((id) => !layout.some((x) => x.id === id))
  // While dragging, the page shows the layout as it would be if you let go now.
  const view = drag && over && over.id !== drag ? place(layout, drag, over.id, over.zone) : layout
  // One link per section, not per module: modules sharing a row (or a group like Status) can't be jumped to apart.
  const nav: TocItem[] = useMemo(() => {
    const out: TocItem[] = []
    rows(layout).forEach((r) => { const id = layout[r[0]].id, t = GROUP[id] || MODS[id].nav; if (out[out.length - 1]?.t !== t) out.push({ id: 'sec-' + id, t }) })
    return out
  }, [layout.map((x) => x.id + x.w).join()]) // eslint-disable-line react-hooks/exhaustive-deps
  // Section titles, as on a page: one before each row that starts a new section (Status, Updates, Jobs, Coming up).
  const heads = new Map<number, string>(); let last = ''
  rows(view).forEach((r) => { const id = view[r[0]].id, t = GROUP[id] || MODS[id].t; if (t !== last) heads.set(r[0], t); last = t })
  const end = (commit: boolean) => { if (commit && drag && over && over.id !== drag) { setLayout(view); mark(drag) } setDrag(null); setOver(null) }
  const zoneOf = (e: React.DragEvent, el: HTMLElement): Zone => {
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
    return x < 0.25 ? 'left' : x > 0.75 ? 'right' : y < 0.5 ? 'top' : 'bottom'
  }
  return (
    <article className={'doc home wide h9' + (edit ? ' h9-edit' : '') + (drag ? ' h9-dragging' : '')}>
      <p className="home-k">Rippling</p>
      <h1>Asoka runs Rippling’s Salesforce processes, with proof.</h1>
      <HomeLive />
      <div className="h9-bar">
        {layout.length > 0 && <Toc items={nav} />}
      </div>
      {edit && (
        <div className="h9-tools" role="region" aria-label="Customize Home">
          <div className="h9-tools-h">
            <span><b>Customize Home</b>Drag any module. Drop it on another’s side to share the row, or above or below for a full row.</span>
            <span className="h9-tools-b"><button className="btn ghost" onClick={() => setLayout(DEFAULT)}>Reset</button><button className="btn primary" onClick={() => setEdit(false)}>Done</button></span>
          </div>
          {shelf.length > 0 && <div className="h9-shelf"><span className="tk">Add a module</span>{shelf.map((id) => <button key={id} onClick={() => add(id)}><Icon name="plus" size={14} />{MODS[id].t}</button>)}</div>}
        </div>
      )}
      <div className="h9-grid" onDragOver={(e) => { if (drag) e.preventDefault() }} onDrop={(e) => { e.preventDefault(); end(true) }}>
        {view.map(({ id, w }, i) => {
          const m = MODS[id], ghost = drag === id, head = heads.get(i)
          const cls = 'h9-s w' + w + (ghost ? ' ghost' : '') + (moved === id ? ' moved' : '')
          return (<Fragment key={id}>
            {head && <h2 className="h9-sh" id={'sec-' + id} key={'t-' + id}>{head}</h2>}
            <section id={'h-' + id} className={cls} draggable
              onDragStart={(e) => { setDrag(id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); e.dataTransfer.setDragImage(e.currentTarget, 40, 20) }}
              onDragOver={(e) => {
                if (!drag) return; e.preventDefault(); if (id === drag) return
                const z = zoneOf(e, e.currentTarget); if (over?.id !== id || over.zone !== z) setOver({ id, zone: z })
              }}
              onDragEnd={() => end(false)}>
              {ghost && <div className="h9-slot" aria-hidden="true"><span>{m.t}</span></div>}
              {/* Hover shows only the grab cue; Customize adds hide. Order is also movable from the keyboard there. */}
              <div className="h9-ctl" role="toolbar" aria-label={`${m.t}: arrange`}>
                <span className="h9-grip" aria-hidden="true" title="Drag to move"><Icon name="grip-vertical" size={16} /></span>
                {edit && <>
                  <button className="ib" onClick={() => move(id, i - 1)} disabled={i === 0} aria-label={`Move ${m.t} earlier`}><Icon name="chevron-up" size={16} /></button>
                  <button className="ib" onClick={() => move(id, i + 1)} disabled={i === view.length - 1} aria-label={`Move ${m.t} later`}><Icon name="chevron-down" size={16} /></button>
                  <button className="ib" onClick={() => hide(id)} aria-label={`Hide ${m.t}`} title="Hide"><Icon name="eye-off" size={16} /></button>
                </>}
              </div>
              <div className="h9-body">{m.title && <h2 className="h9-t">{m.title}</h2>}{m.body()}</div>
            </section>
          </Fragment>)
        })}
      </div>
      {!layout.length && <p className="h9-empty">Home is empty. <button className="wl" onClick={() => setEdit(true)}>Add a module</button></p>}
      <HomeSources />
    </article>
  )
}
