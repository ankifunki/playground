import type React from 'react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AG, ago, type AgentId } from './data'
import { Icon } from './Icon'
import { RM, useW } from './store'
import { TRACE } from './traces'

/** A job's mark: a square indigo tile, optionally with its name. */
export function Ag({ id, name, size = 22 }: { id: AgentId; name?: boolean; size?: number }) {
  const a = AG[id]
  return (
    <span className={'ag' + (name ? ' named' : '')} title={a.name + ' job'}>
      <span className="ag-t" style={{ width: size, height: size }}><Icon name={a.icon} size={Math.round(size * 0.29) * 2} /></span>
      {name && <span className="ag-n">Asoka · {a.name}</span>}
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

/** The chip on anything a job changed: who and when. It opens the block's trace, like clicking the block itself. */
export function Chip({ id }: { id: string }) {
  const w = useW(), y = w.why[id]
  if (!y || !w.proof) return null
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
  if (!TRACE[id] || !w.proof) return {}
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
    <div id={'b-' + id} className={'blk ' + cls + (editing ? ' editing' : '') + (w.trace === id ? ' traced' : '') + (TRACE[id] && w.proof ? ' trc' : '')}>
      {editing && <span className="cursor" aria-live="polite"><Ag id={w.presence!.ag} size={14} /><span>{AG[w.presence!.ag].name}</span><i className="cursor-dots" aria-hidden="true"><b /><b /><b /></i></span>}
      <div className="blk-c" {...target}>{children}</div>
    </div>
  )
}

/**
 * A number that changes while you watch. Only the characters that changed move: like an odometer, the old digit rolls up
 * and out while the new one rises into place, then holds the accent colour for a moment and fades back to the text
 * colour. Characters are compared from the right (1,240 to 1,242 rolls only the last digit). Never on first render;
 * clocks don't use it. Reduced motion keeps the colour and drops the roll.
 */
export function LiveNum({ value }: { value: string | number }) {
  const cur = String(value), prev = useRef(cur)
  const [state, setState] = useState<{ n: number; old: (string | null)[] }>({ n: 0, old: [] })
  useEffect(() => {
    if (prev.current === cur) return
    const a = prev.current, len = cur.length
    // For each character: the character it replaces, or null when it didn't change.
    const old = cur.split('').map((ch, i) => { const j = a.length - (len - i); const was = j < 0 ? '' : a[j]; return was === ch ? null : was })
    prev.current = cur
    setState((x) => ({ n: x.n + 1, old }))
    // Drop the outgoing digits on a timer as well as on animationend: in a background tab or in Safari the event can
    // be missed, and a stray old digit would stay drawn above the number.
    const id = window.setTimeout(() => setState((x) => ({ ...x, old: x.old.map((o) => (o === null ? null : '')) })), 700)
    return () => window.clearTimeout(id)
  }, [cur])
  if (!state.n) return <span className="ln">{cur}</span>
  return (
    <span className="ln" key={state.n}>
      {cur.split('').map((ch, i) => state.old[i] === null || state.old[i] === undefined
        ? <span key={i}>{ch}</span>
        : <span key={i} className="ln-r ln-c">{state.old[i] && <span className="ln-o" aria-hidden="true">{state.old[i]}</span>}<span className="ln-n">{ch}</span></span>)}
    </span>
  )
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


export type AsokaState = 'idle' | 'reading' | 'thinking' | 'writing' | 'asking' | 'waiting'
const AS_TITLE: Record<AsokaState, string> = { idle: 'Asoka', reading: 'Asoka is reading', thinking: 'Asoka is thinking', writing: 'Asoka is writing', asking: 'Asoka is asking a person', waiting: 'Asoka is waiting' }
let asokaN = 0
/**
 * Asoka's mark: an ink shape with an open ring cut out of it, so it stands on its own on any background. The shape is
 * the state, morphed by CSS (every shape is six cubic segments): a triangle when idle, a page when reading (the ring
 * drifts), a circle when thinking (the ring's gap turns), a slanted block when writing (the ring pulses), a diamond
 * when asking a person (the ring lifts), a low block when waiting (it fades). Browsers without CSS path morphing keep
 * the triangle. Reduced motion keeps it still. Use it once per view, not per row.
 */
export function Asoka({ size = 20, state = 'idle', label }: { size?: number; state?: AsokaState; label?: string }) {
  const [id] = useState(() => 'asoka-m' + ++asokaN)
  return (
    <svg className={'asoka ' + state} data-state={state} width={size} height={size} viewBox="0 0 24 24" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <title>{label || AS_TITLE[state]}</title>
      <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="#fff" />
        <g className="asoka-eye"><circle cx="12" cy="14.6" r="3" fill="none" stroke="#000" strokeWidth="2" /></g>
      </mask>
      <path className="asoka-tri" d="M12 3.4C13.57 6.17 15.13 8.93 16.7 11.7C18.27 14.47 19.83 17.23 21.4 20C18.27 20 15.13 20 12 20C8.87 20 5.73 20 2.6 20C4.17 17.23 5.73 14.47 7.3 11.7C8.87 8.93 10.43 6.17 12 3.4Z" mask={`url(#${id})`} />
    </svg>
  )
}
