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
 * Text that rewrites itself when the knowledge changes: the old words are struck through and fade, the new ones are
 * typed in behind a caret, then the sentence glows for a moment. Reduced motion swaps it with a fade.
 */
export function LiveText({ text }: { text: string }) {
  const prev = useRef(text), [anim, setAnim] = useState<{ old: string; n: number } | null>(null), [fresh, setFresh] = useState(false)
  useEffect(() => {
    if (prev.current === text) return
    const old = prev.current; prev.current = text
    if (RM) { setFresh(true); const t = window.setTimeout(() => setFresh(false), 2500); return () => window.clearTimeout(t) }
    setAnim({ old, n: 0 })
    let n = 0
    const t = window.setInterval(() => {
      n += 2
      if (n >= text.length) { window.clearInterval(t); setAnim(null); setFresh(true); window.setTimeout(() => setFresh(false), 2600) }
      else setAnim({ old, n })
    }, 26)
    return () => window.clearInterval(t)
  }, [text])
  if (anim) return <span className="lt"><del className="lt-old">{anim.old}</del> <span className="lt-new">{text.slice(0, anim.n)}<i className="lt-caret" aria-hidden="true" /></span></span>
  return <span className={'lt' + (fresh ? ' fresh' : '')}>{text}</span>
}

/** The margin chip on anything an agent changed: who, when, and on tap, why, from what, and what it said before. */
export function Chip({ id }: { id: string }) {
  const w = useW(), y = w.why[id], [open, setOpen] = useState(false), ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const f = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', f); return () => document.removeEventListener('mousedown', f)
  }, [open])
  if (!y) return null
  const s = (w.now - y.at) / 1000, recent = s < 8
  return (
    <span className="chip-w" ref={ref}>
      <button className={'chip' + (recent ? ' new' : '')} onClick={() => setOpen(!open)} aria-expanded={open}>
        <Ag id={y.ag} size={16} /><span>Edited {recent ? 'just now' : ago(s)}</span>
      </button>
      {open && (
        <span className="pop" role="dialog" aria-label="Why this changed">
          <span className="pop-h"><Ag id={y.ag} name size={20} /><span className="tk">{ago(s)}</span></span>
          <span className="pop-l">Why</span><span className="pop-v">{y.t}</span>
          <span className="pop-l">From</span><span className="pop-v">{y.src}</span>
          <span className="pop-l">Before</span><span className="pop-v"><del>{y.before}</del></span>
        </span>
      )}
    </span>
  )
}

/** A page block. While an agent edits it, its cursor flag sits in the gutter and the block is outlined; afterwards the chip stays in the margin. */
export function Block({ id, children, cls = '' }: { id: string; children: ReactNode; cls?: string }) {
  const w = useW(), editing = w.presence?.block === id
  return (
    <div id={'b-' + id} className={'blk ' + cls + (editing ? ' editing' : '')}>
      {editing && <span className="cursor" aria-live="polite"><Ag id={w.presence!.ag} size={16} /><span>{AG[w.presence!.ag].name} agent is writing</span></span>}
      <div className="blk-c">{children}</div>
      <span className="blk-m"><Chip id={id} /></span>
    </div>
  )
}
