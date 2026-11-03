import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AG, ago, type AgentId } from './data'
import { Icon } from './Icon'
import { RM, useW } from './store'

/** An agent's mark: a square indigo tile, optionally with its name. */
export function Ag({ id, name, size = 22 }: { id: AgentId; name?: boolean; size?: number }) {
  const a = AG[id]
  return (
    <span className={'ag' + (name ? ' named' : '')} title={a.name + ' agent'}>
      <span className="ag-t" style={{ width: size, height: size }}><Icon name={a.icon} size={Math.round(size * 0.58)} /></span>
      {name && <span className="ag-n">{a.name} agent</span>}
    </span>
  )
}

/**
 * Text that rewrites itself when the knowledge changes: the new sentence fades in over the old one, then keeps a soft
 * highlight for a moment so you can see what changed.
 */
export function LiveText({ text, id }: { text: string; id?: string }) {
  const prev = useRef(text), [n, setN] = useState(0), [fresh, setFresh] = useState(false)
  useEffect(() => {
    if (prev.current === text) return
    prev.current = text; setN((x) => x + 1); setFresh(true)
    const t = window.setTimeout(() => setFresh(false), 2600); return () => window.clearTimeout(t)
  }, [text])
  return <><span key={n} className={'lt' + (n ? ' in' : '') + (fresh ? ' fresh' : '')}>{text}</span>{id && <Chip id={id} />}</>
}

/** The chip on anything an agent changed: who and when. It opens the block's trace, like every "Why?" on the page. */
export function Chip({ id }: { id: string }) {
  const w = useW(), y = w.why[id]
  if (!y) return null
  const s = (w.now - y.at) / 1000, recent = s < 8
  return (
    <span className="chip-w">
      <button className={'chip' + (recent ? ' new' : '')} onClick={() => w.openTrace(id)} aria-label={`Edited ${recent ? 'just now' : ago(s)}: see why`}>
        <span>Edited {recent ? 'just now' : ago(s)}</span>
      </button>
    </span>
  )
}

/** The one affordance for "why should I trust this?": a handle in the block's gutter that opens its trace. */
export function Why({ id }: { id: string }) {
  const w = useW()
  return <button className={'why' + (w.trace === id ? ' on' : '')} onClick={() => w.openTrace(w.trace === id ? null : id)} aria-label="See why: the trace behind this" title="See why"><Icon name="trace" size={15} /></button>
}

/** A page block. While an agent edits it, its cursor flag sits in the gutter and the block is outlined; afterwards the chip stays in the margin. */
export function Block({ id, children, cls = '' }: { id: string; children: ReactNode; cls?: string }) {
  const w = useW(), editing = w.presence?.block === id
  return (
    <div id={'b-' + id} className={'blk ' + cls + (editing ? ' editing' : '') + (w.trace === id ? ' traced' : '')}>
      <Why id={id} />
      {editing && <span className="cursor" aria-live="polite"><Ag id={w.presence!.ag} size={14} /><span>{AG[w.presence!.ag].name}</span><i className="cursor-dots" aria-hidden="true"><b /><b /><b /></i></span>}
      <div className="blk-c">{children}</div>
    </div>
  )
}

/** The live mark: a small radio icon with a slow, soft pulse ring. Used wherever something is happening right now. */
export function LivePulse({ on = true }: { on?: boolean }) {
  return <span className={'lp' + (on ? ' on' : '')} aria-hidden="true"><Icon name="radio" size={13} /></span>
}
