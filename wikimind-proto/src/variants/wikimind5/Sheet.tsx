import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Ag, agentFor } from './agents'
import { Pile, Prov } from './Claim'
import { AREAS, AUTO, CORPUS_TOTAL, CT_LABEL, INVENTORY, PAGES, PREV, SPOT, STALE_EG, TOTALS } from './data'
import { Icon } from './Icon'
import { useW, type Pop } from './store'

function Body({ p }: { p: Pop }) {
  const w = useW()
  const close = <button className="px press" onClick={w.closePop} aria-label="Close" title="Close"><Icon name="x" size={16} /></button>
  if (p.kind === 'proof') {
    if (p.k === 'complete') return (
      <Panel k="Is it complete?" stat={`${INVENTORY[1].have} of ${INVENTORY[1].of}`} sub="automations in Salesforce explained" lede="Everything that exists in Salesforce can be counted and is covered. Unwritten practice has no total, so it’s counted, not given a percentage." close={close}>
        <Sec t="In Salesforce"><ul className="pf-inv">{INVENTORY.filter((r) => r.of !== null).map((r) => <li key={r.what}><span>{r.what}</span><b>{r.have} of {r.of}</b></li>)}</ul></Sec>
        <Sec t="Unwritten practice"><ul className="pf-inv">{INVENTORY.filter((r) => r.of === null).map((r) => <li key={r.what}><span>{r.what}</span><b>{r.have} found</b>{r.note && <small>{r.note}</small>}</li>)}</ul></Sec>
      </Panel>
    )
    if (p.k === 'right') return (
      <Panel k="Is it right?" stat={`${SPOT.held} of ${SPOT.checks}`} sub={`facts held up when ${SPOT.by} spot-checked them this month`} lede="After each correction the agent re-checks similar facts on other pages." close={close}>
        <Sec t="What was wrong, and what replaced it" n={`${SPOT.checks - SPOT.held} corrections`}>
          <ul className="pf-fix">{SPOT.fixes.map((f) => (
            <li key={f.wrote}><div className="pf-h"><Ag id={f.ag} name /><span className="tk">{f.when}</span></div><del>{f.wrote}</del><span>{f.right}</span></li>
          ))}</ul>
        </Sec>
      </Panel>
    )
    if (p.k === 'ready') {
      // What is proven and waiting: the base items until they are handed over, then Maria's flat renewals once she answers.
      const items = [...(w.handed === 0 ? AUTO.readyItems.map((x) => ({ ...x, n: 2 })) : []), ...(w.learned && w.handed < AUTO.ready + 1 ? [{ ...AUTO.readyLearned, n: 1 }] : [])]
      const pct = items.reduce((t, x) => t + x.n, 0)
      return (
        <Panel k="Proven, needs your OK" stat={`${pct}%`} sub={items.length ? 'of the work could run on its own now' : 'nothing is waiting'} lede={items.length ? 'The agents ran these alongside a person and matched what they did.' : 'Everything proven so far already runs on its own.'} close={close}
          foot={items.length ? <>
            <span className="pn-fn">Dev approves before any agent does more on its own.</span>
            <button className="qbtn pri press" onClick={w.handOver} disabled={w.hand === 'sent'}>{w.hand === 'sent' ? 'Asking Dev…' : 'Ask Dev to hand it over'}</button>
          </> : undefined}>
          {items.length > 0 && <Sec t="What would be handed over" n={`${items.length} ${items.length === 1 ? 'job' : 'jobs'}`}>
            <ul className="pf-fix pf-ready">{items.map((x) => (
              <li key={x.what}><div className="pf-h"><Ag id={x.ag} name /><span className="tk">{x.n}% of the work</span></div><b>{x.what}</b><span>{x.proof}</span></li>
            ))}</ul>
          </Sec>}
        </Panel>
      )
    }
    if (p.k === 'notyet') {
      // Everything grey on the bar, with its reason. Two kinds: the agents are missing something, or they are still earning it.
      const a = w.auto, gaps = a.complete + a.current + a.unknown
      const go = (k: 'complete' | 'current', e: React.MouseEvent<HTMLButtonElement>) => w.openProof(k, e.currentTarget)
      return (
        <Panel k="Not yet" stat={`${gaps + a.shadow}%`} sub="of the work is still done by people" lede="For one of two reasons: the agents are missing something, or they are still earning it." close={close}>
          <Sec t="Missing something" n={`${gaps}%`}>
            <ul className="pf-inv">
              <li><span>Waits while {AUTO.confirming} unwritten practices are confirmed <button className="wl" onClick={(e) => go('complete', e)}>See them</button></span><b>{a.complete}%</b></li>
              <li><span>Waits while {TOTALS.stale} out-of-date pages are re-checked <button className="wl" onClick={(e) => go('current', e)}>See them</button></span><b>{a.current}%</b></li>
              <li><span>Waits on answers to {w.asks} open questions <button className="wl" onClick={() => { w.closePop(); document.getElementById('asking-col')?.scrollIntoView({ block: 'center' }) }}>See who</button></span><b>{a.unknown}%</b></li>
            </ul>
          </Sec>
          <Sec t="Still earning it" n={`${a.shadow}%`}>
            <div className="pnote">The agents prepare each one and compare it with what the person decided. When their record is strong enough, it moves to proven and you can hand it over.</div>
            <ul className="pf-fix pf-ready">{AUTO.shadowing.map((x) => (
              <li key={x.what}><div className="pf-h"><Ag id={x.ag} name /><span className="tk">{x.n}% of the work</span></div><b>{x.what}</b><span>{x.record}</span></li>
            ))}</ul>
          </Sec>
        </Panel>
      )
    }
    return (
      <Panel k="Is it current?" stat="Daily" sub="every page is re-read against its sources" lede="When a source goes quiet or changes, the page is flagged until someone confirms it." close={close}>
        <Sec t="Out of date" n={`${TOTALS.stale} pages`}>
          <ul className="pf-fix">{STALE_EG.map((x) => <li key={x.t}><b>{x.t}</b><span>{x.why}</span></li>)}</ul>
          <div className="pnote">and {TOTALS.stale - STALE_EG.length} more, each with the agent that owns it.</div>
        </Sec>
      </Panel>
    )
  }
  if (p.kind === 'pages') return <AllPages close={close} />
  if (p.kind === 'page') {
    const c = PAGES[p.i], a = AREAS[c.area]
    return (
      <div className="pc">
        <div className="pk nh"><Ag id={a.ag} name /><span className="tk">{a.name}</span></div>
        <div className="pq">{c.title}</div>
        <div className="pgm"><span className={'tdone cp-t-' + c.tier}>{CT_LABEL[c.tier]}</span><span className="tk">Updated {c.upd} · links to {c.links.length} pages</span></div>
        <div className="pnote">Prototype: only Discount approvals has a full page.</div>
        {close}
      </div>
    )
  }
  if (p.kind === 'prev') {
    const [kind, text] = PREV[p.name] || ['Article', p.name + '.']
    return (
      <div className="pc">
        <div className="pk">{kind}</div><div className="pq">{p.name}</div><div className="pu">{text}</div>
        <div style={{ fontSize: 13, color: 'var(--ink2)' }}>Prototype: only Discount approvals has a full page.</div>
        {close}
      </div>
    )
  }
  return (
    <div className="pc">
      <div className="pk nh"><Ag id={agentFor(p.ns).id} name />{p.ns.length > 1 && <Pile ns={p.ns} />}</div>
      <Prov ns={p.ns} />
      {close}
    </div>
  )
}

/** Bottom sheet for sources and previews. Keeps its last content while sliding away. */
export function Sheet() {
  const w = useW(), el = useRef<HTMLDivElement>(null), last = useRef<Pop | null>(null)
  if (w.pop) last.current = w.pop
  useEffect(() => {
    if (!w.pop) return
    const t = window.setTimeout(() => (el.current?.querySelector('.px') as HTMLElement | null)?.focus({ preventScroll: true }), 30)
    return () => window.clearTimeout(t)
  }, [w.pop])
  return (
    <>
      <div className={'scrim' + (w.pop ? ' on' : '')} onClick={w.closePop} />
      <div ref={el} className={'pop' + (w.pop ? ' on' : '')} id="pop" role="dialog" aria-modal="true" aria-label={w.pop?.kind === 'prev' ? 'Preview' : w.pop?.kind === 'pages' ? 'All pages' : 'Where this came from'}>{last.current && <Body p={last.current} />}</div>
    </>
  )
}

/** All pages: the flat corpus. One A–Z list, no folders; each row says who keeps it, how many pages it links to, and when it changed. */
const DISTINCT = (() => {
  const seen = new Map<string, number>()
  PAGES.forEach((p, i) => { if (!seen.has(p.title)) seen.set(p.title, i) })
  return [...seen.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([t, i]) => ({ t, i }))
})()
function AllPages({ close }: { close: React.ReactNode }) {
  const w = useW(), [q, setQ] = useState('')
  const rows = DISTINCT.filter((r) => r.t.toLowerCase().includes(q.trim().toLowerCase()))
  const open = (i: number) => (PAGES[i].main ? (w.closePop(), w.go('page')) : w.openCell(i))
  let last = ''
  return (
    <div className="pc ap">
      <div className="pk">All pages</div>
      <div className="pq">{CORPUS_TOTAL.toLocaleString()} pages, no folders. Any page can link to any other.</div>
      <label className="ap-s"><Icon name="search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a page" aria-label="Find a page" /></label>
      <ul className="ap-l">{rows.map((r) => {
        const c = PAGES[r.i], L0 = r.t[0].toUpperCase(), head = L0 !== last
        last = L0
        return (
          <li key={r.t}>{head && <span className="tk ap-h">{L0}</span>}
            <button onClick={() => open(r.i)}><span className="ap-t">{r.t}</span><span className="ap-m"><Ag id={AREAS[c.area].ag} />links to {c.links.length} · {c.upd}</span></button>
          </li>
        )
      })}{!rows.length && <li className="ap-none">No page called that yet.</li>}</ul>
      <div className="pnote">Prototype: lists the {DISTINCT.length} distinct titles in the demo corpus.</div>
      {close}
    </div>
  )
}

/** A side panel with structure: a header (kicker, the stat repeated, one sentence), sections with headers, and an optional footer pinned to the bottom for the action. */
function Panel({ k, stat, sub, lede, children, foot, close }: { k: string; stat: string; sub: string; lede?: string; children: React.ReactNode; foot?: React.ReactNode; close: React.ReactNode }) {
  return (
    <div className="pc panel">
      <div className="pn-h">
        <div className="pk">{k}</div>
        <p className="pn-stat"><b>{stat}</b><span>{sub}</span></p>
        {lede && <p className="pn-lede">{lede}</p>}
      </div>
      <div className="pn-b">{children}</div>
      {foot && <div className="pn-f">{foot}</div>}
      {close}
    </div>
  )
}
function Sec({ t, n, children }: { t: string; n?: string; children: React.ReactNode }) {
  return <section className="pn-s"><div className="pn-sh"><span className="tk">{t}</span>{n && <span className="tk">{n}</span>}</div>{children}</section>
}
