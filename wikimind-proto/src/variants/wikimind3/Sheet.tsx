import { useEffect, useRef } from 'react'
import { KIND, PREV, refFor } from './data'
import { KICON, Pile, Tile } from './Pile'
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
        <div className="pnote">Prototype: only Opportunity approvals has a full page.</div>
        {close}
      </div>
    )
  }
  return (
    <div className="pc">
      <div className="pk">{p.ns.length > 1 ? <Pile ns={p.ns} /> : null}</div>
      {p.ns.map((n) => {
        const r = refFor(n), ver = !!r.v
        return (
          <div className="psrc" key={n} id={'pop-ref-' + n}>
            <div className="pvh"><Tile icon={KICON[r.k]} label={KIND[r.k]} ok={ver} warn={!!r.check} /><span className="pvs">{r.src}</span><span className="pvk">{r.d}</span></div>
            <div className="pq">“{r.q}”</div>
            <div className="chain" aria-label="How Asoka learned this"><span className="y">Observed</span><i>›</i><span className="y">Written</span><i>›</i><span className={ver ? 'y' : r.check ? 'w' : 'n'}>{ver ? `Verified · ${r.v}` : r.check || 'Not checked yet'}</span></div>
          </div>
        )
      })}
      <div className="pacts">
        {p.away && <button className="wl" onClick={() => w.showSrc(p.ns[0])}>Show on page</button>}
        <button className="wl" onClick={w.toHistory}>See it in Changes</button>
      </div>
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
