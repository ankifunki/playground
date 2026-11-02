import { useEffect, useRef } from 'react'
import { Ag, agentFor } from './agents'
import { Pile, Prov } from './Claim'
import { AREAS, CT_LABEL, PAGES, PREV } from './data'
import { Icon } from './Icon'
import { useW, type Pop } from './store'

function Body({ p }: { p: Pop }) {
  const w = useW()
  const close = <button className="px press" onClick={w.closePop} aria-label="Close" title="Close"><Icon name="x" size={16} /></button>
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
        <div className="pk">{kind}</div><div className="pq" style={{ fontWeight: 500 }}>{p.name}</div><div className="pu">{text}</div>
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
