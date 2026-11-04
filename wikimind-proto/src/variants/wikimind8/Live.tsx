import type React from 'react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AG, ago, type AgentId } from './data'
import { Icon } from './Icon'
import { RM, useW } from './store'
import { TRACE } from './traces'

/** An agent's mark: a square indigo tile, optionally with its name. */
export function Ag({ id, name, size = 22 }: { id: AgentId; name?: boolean; size?: number }) {
  const a = AG[id]
  return (
    <span className={'ag' + (name ? ' named' : '')} title={a.name + ' agent'}>
      <span className="ag-t" style={{ width: size, height: size }}><Icon name={a.icon} size={Math.round(size * 0.29) * 2} /></span>
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

/** The chip on anything an agent changed: who and when. It opens the block's trace, like clicking the block itself. */
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
/**
 * Anything with a trace opens it when clicked: the whole sentence, block or table row is the target, so there is no
 * separate icon to find. Hover shows the highlighter; clicks on links, buttons and inputs inside keep their own job.
 */
export function useTraceTarget(id: string) {
  const w = useW()
  if (!TRACE[id]) return {}
  const open = () => w.openTrace(w.trace === id ? null : id)
  return {
    tabIndex: 0, title: 'See why',
    onClick: (e: React.MouseEvent) => { if ((e.target as HTMLElement).closest('button,a,input,label,.chip')) return; e.stopPropagation(); open() },
    onKeyDown: (e: React.KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); open() } },
  }
}

export function Block({ id, children, cls = '' }: { id: string; children: ReactNode; cls?: string }) {
  const w = useW(), editing = w.presence?.block === id, target = useTraceTarget(id)
  return (
    <div id={'b-' + id} className={'blk ' + cls + (editing ? ' editing' : '') + (w.trace === id ? ' traced' : '') + (TRACE[id] ? ' trc' : '')}>
      {editing && <span className="cursor" aria-live="polite"><Ag id={w.presence!.ag} size={14} /><span>{AG[w.presence!.ag].name}</span><i className="cursor-dots" aria-hidden="true"><b /><b /><b /></i></span>}
      <div className="blk-c" {...target}>{children}</div>
    </div>
  )
}

/**
 * A number that changes while you watch: on each change it shows in the accent colour, then fades back to the text
 * colour, so a live update draws the eye once without staying loud. Never on first render. Clocks don't use it.
 */
export function LiveNum({ value }: { value: string | number }) {
  const prev = useRef(value), [n, setN] = useState(0)
  useEffect(() => { if (prev.current !== value) { prev.current = value; setN((x) => x + 1) } }, [value])
  return <span key={n} className={'ln' + (n ? ' on' : '')}>{value}</span>
}

/** The live mark: a small radio icon with a slow, soft pulse ring. Used wherever something is happening right now. */
export function LivePulse({ on = true }: { on?: boolean }) {
  return <span className={'lp' + (on ? ' on' : '')} aria-hidden="true"><Icon name="radio" size={12} /></span>
}

/** Sources as an icon pile with a summary (Wikimind 4's footer). Each icon names its source on hover. */
export function Sources({ items, children }: { items: { ic: 'hash' | 'ticket' | 'cloud' | 'video' | 'file-text'; name: string }[]; children: React.ReactNode }) {
  return (
    <footer className="srcs">
      <span className="srcs-p">{items.map((x) => <span key={x.name} className="srcs-i" tabIndex={0} data-tip={x.name} aria-label={x.name}><Icon name={x.ic} size={12} /></span>)}</span>
      <p>{children}</p>
    </footer>
  )
}

