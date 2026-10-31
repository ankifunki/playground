import { useEffect, useRef } from 'react'
import { KIND, PREV, refFor } from './data'
import { Icon } from './Icon'
import { useW, type Pop } from './store'

function Body({ p }: { p: Pop }) {
  const w = useW()
  const close = <button className="px press" onClick={w.closePop} aria-label="Close" title="Close"><Icon name="x" size={16} /></button>
  if (p.kind === 'prev') {
    const [kind, text] = PREV[p.name] || ['Article', p.name + '.']
    return (
      <div className="pc">
        <div className="pk">{kind}</div><div className="pq" style={{ fontWeight: 500 }}>{p.name}</div><div className="pu">{text}</div>
        <div style={{ fontSize: 13, color: 'var(--ink2)' }}>Prototype: only Opportunity approvals has a full page.</div>
        {close}
      </div>
    )
  }
  const r = refFor(p.n), ver = !!r.v
  return (
    <div className="pc">
      <div className="pk">Source {p.n}: {KIND[r.k]}, {r.src}, {r.d}{r.check && <>. <span style={{ color: 'var(--warn)' }}>{r.check}</span></>}</div>
      <div className="pq">“{r.q}”</div>
      <div className="pu">{r.u}</div>
      <div className="chain" aria-label="How Asoka learned this"><span className="y">Observed</span><i>›</i><span className="y">Reflected</span><i>›</i><span className="y">Written</span><i>›</i><span className={ver ? 'y' : 'n'}>{ver ? 'Verified' : 'Not verified yet'}</span></div>
      {ver && <div style={{ fontSize: 13, color: 'var(--ok)', fontWeight: 600, marginBottom: 8 }}>✓ Verified by {r.v}</div>}
      {p.away && <button className="wl" onClick={() => w.showSrc(p.n)} style={{ marginRight: 18 }}>Show on page</button>}
      <button className="wl" onClick={w.toHistory}>See it in Changes</button>
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
      <div ref={el} className={'pop' + (w.pop ? ' on' : '')} id="pop" role="dialog" aria-modal="true" aria-label="Source">{last.current && <Body p={last.current} />}</div>
    </>
  )
}
