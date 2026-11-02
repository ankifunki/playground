import type React from 'react'
import { useEffect, useRef } from 'react'
import { Ag, agentFor } from './agents'
import { Pile, Prov } from './Claim'
import { AREAS, AUTO, CT_LABEL, INVENTORY, PAGES, PREV, SPOT, STALE_EG, TOTALS } from './data'
import { Icon } from './Icon'
import { useW, type Pop } from './store'

function Body({ p }: { p: Pop }) {
  const w = useW()
  const close = <button className="px press" onClick={w.closePop} aria-label="Close" title="Close"><Icon name="x" size={16} /></button>
  if (p.kind === 'proof') {
    if (p.k === 'complete') return (
      <div className="pc">
        <div className="pk">Is it complete?</div>
        <div className="pq">Everything that exists in Northwind’s Salesforce is explained. Unwritten practice has no total, so it’s counted, not given a percentage.</div>
        <ul className="pf-inv">{INVENTORY.map((r) => (
          <li key={r.what}><span>{r.what}</span><b>{r.of === null ? `${r.have} found` : `${r.have} of ${r.of}`}</b>{r.note && <small>{r.note}</small>}</li>
        ))}</ul>
        {close}
      </div>
    )
    if (p.k === 'right') return (
      <div className="pc">
        <div className="pk">Is it right?</div>
        <div className="pq">{SPOT.held} of {SPOT.checks} facts held up when {SPOT.by} spot-checked them this month. These are the {SPOT.checks - SPOT.held} that didn’t, and what replaced them.</div>
        <ul className="pf-fix">{SPOT.fixes.map((f) => (
          <li key={f.wrote}><div className="pf-h"><Ag id={f.ag} name /><span className="tk">{f.when}</span></div><del>{f.wrote}</del><span>{f.right}</span></li>
        ))}</ul>
        <div className="pnote">After each correction the agent re-checks similar facts on other pages.</div>
        {close}
      </div>
    )
    if (p.k === 'ready') {
      // What is proven and waiting: the base items until they are handed over, then Maria's flat renewals once she answers.
      const items = [...(w.handed === 0 ? AUTO.readyItems.map((x) => ({ ...x, n: 2 })) : []), ...(w.learned && w.handed < AUTO.ready + 1 ? [{ ...AUTO.readyLearned, n: 1 }] : [])]
      return (
        <div className="pc">
          <div className="pk">Proven, needs your OK</div>
          {items.length ? <>
            <div className="pq">The agents ran these alongside a person and matched what they did. Dev approves before any agent does more on its own.</div>
            <ul className="pf-fix pf-ready">{items.map((x) => (
              <li key={x.what}><div className="pf-h"><Ag id={x.ag} name /><span className="tk">{x.n}% of the work</span></div><b>{x.what}</b><span>{x.proof}</span></li>
            ))}</ul>
            <div className="pf-act">
              <button className="qbtn pri press" onClick={w.handOver} disabled={w.hand === 'sent'}>{w.hand === 'sent' ? 'Asking Dev…' : 'Ask Dev to hand it over'}</button>
            </div>
          </> : <div className="pq">Nothing is waiting. Everything proven so far already runs on its own.</div>}
          {close}
        </div>
      )
    }
    if (p.k === 'notyet') {
      // Everything grey on the bar, with its reason. Two kinds: the agents are missing something, or they are still earning it.
      const a = w.auto, gaps = a.complete + a.current + a.unknown
      const go = (k: 'complete' | 'current', e: React.MouseEvent<HTMLButtonElement>) => w.openProof(k, e.currentTarget)
      return (
        <div className="pc">
          <div className="pk">Not yet · {gaps + a.shadow}% of the work</div>
          <div className="pq">Still done by people, for one of two reasons: the agents are missing something, or they are still earning it.</div>
          <div className="pf-sec"><span className="tk">Missing something</span><span className="tk">{gaps}%</span></div>
          <ul className="pf-inv">
            <li><span>Waits while {AUTO.confirming} unwritten practices are confirmed <button className="wl" onClick={(e) => go('complete', e)}>See them</button></span><b>{a.complete}%</b></li>
            <li><span>Waits while {TOTALS.stale} out-of-date pages are re-checked <button className="wl" onClick={(e) => go('current', e)}>See them</button></span><b>{a.current}%</b></li>
            <li><span>Waits on answers to {w.asks} open questions <button className="wl" onClick={() => { w.closePop(); document.getElementById('asking-col')?.scrollIntoView({ block: 'center' }) }}>See who</button></span><b>{a.unknown}%</b></li>
          </ul>
          <div className="pf-sec"><span className="tk">Still earning it</span><span className="tk">{a.shadow}%</span></div>
          <div className="pnote">The agents prepare each one and compare it with what the person decided. When their record is strong enough, it moves to proven and you can hand it over.</div>
          <ul className="pf-fix pf-ready">{AUTO.shadowing.map((x) => (
            <li key={x.what}><div className="pf-h"><Ag id={x.ag} name /><span className="tk">{x.n}% of the work</span></div><b>{x.what}</b><span>{x.record}</span></li>
          ))}</ul>
          {close}
        </div>
      )
    }
    return (
      <div className="pc">
        <div className="pk">Is it current?</div>
        <div className="pq">Every page is re-read against its sources at least once a day. {TOTALS.stale} look out of date because a source went quiet or changed; each waits for someone to confirm.</div>
        <ul className="pf-fix">{STALE_EG.map((x) => <li key={x.t}><b>{x.t}</b><span>{x.why}</span></li>)}</ul>
        <div className="pnote">and {TOTALS.stale - STALE_EG.length} more, each with the agent that owns it.</div>
        {close}
      </div>
    )
  }
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
      <div ref={el} className={'pop' + (w.pop ? ' on' : '')} id="pop" role="dialog" aria-modal="true" aria-label={w.pop?.kind === 'prev' ? 'Preview' : 'Where this came from'}>{last.current && <Body p={last.current} />}</div>
    </>
  )
}
