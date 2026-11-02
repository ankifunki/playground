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

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=<>/\\'
const rnd = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]

/**
 * Text that rewrites itself when the knowledge changes, decoded letter by letter: a coloured lead letter sweeps left to
 * right, a short tail of scrambling glyphs behind it, the new text settled before it, the old text still waiting after
 * it. Then the sentence glows for a moment. Reduced motion swaps it with a fade.
 */
export function LiveText({ text }: { text: string }) {
  const prev = useRef(text), [anim, setAnim] = useState<{ old: string; i: number; g: string[] } | null>(null), [fresh, setFresh] = useState(false)
  useEffect(() => {
    if (prev.current === text) return
    const old = prev.current; prev.current = text
    if (RM) { setFresh(true); const t = window.setTimeout(() => setFresh(false), 2500); return () => window.clearTimeout(t) }
    let i = 0
    const t = window.setInterval(() => {
      i += 1
      if (i > text.length + TAIL) { window.clearInterval(t); setAnim(null); setFresh(true); window.setTimeout(() => setFresh(false), 2400); return }
      setAnim({ old, i, g: Array.from({ length: TAIL }, rnd) })
    }, 24)
    return () => window.clearInterval(t)
  }, [text])
  if (anim) {
    const { old, i, g } = anim, lead = Math.min(i, text.length), from = Math.max(0, i - TAIL)
    const settled = text.slice(0, from)
    // Positions from..lead scramble (the newest one is the coloured lead); beyond the lead, the old text remains.
    const scr: string[] = []
    for (let k = from; k < lead; k++) scr.push(text[k] === ' ' ? ' ' : g[k - from])
    const rest = old.slice(lead)
    return (
      <span className="lt" aria-label={text}>
        <span aria-hidden="true">{settled}{scr.map((c, k) => <span key={k} className={'lt-g' + (k === scr.length - 1 ? ' lead' : '')}>{c}</span>)}<span className="lt-old">{rest}</span></span>
      </span>
    )
  }
  return <span className={'lt' + (fresh ? ' fresh' : '')}>{text}</span>
}
const TAIL = 4

/** The chip on anything an agent changed: who and when. It opens the block's trace, like every "Why?" on the page. */
export function Chip({ id }: { id: string }) {
  const w = useW(), y = w.why[id]
  if (!y) return null
  const s = (w.now - y.at) / 1000, recent = s < 8
  return (
    <span className="chip-w">
      <button className={'chip' + (recent ? ' new' : '')} onClick={() => w.openTrace(id)} aria-label={`Edited ${recent ? 'just now' : ago(s)}: see why`}>
        <Ag id={y.ag} size={16} /><span>Edited {recent ? 'just now' : ago(s)}</span>
      </button>
    </span>
  )
}

/** The one affordance for "why should I trust this?": a handle in the block's gutter that opens its trace. */
export function Why({ id }: { id: string }) {
  const w = useW()
  return <button className={'why' + (w.trace === id ? ' on' : '')} onClick={() => w.openTrace(w.trace === id ? null : id)} aria-label="Why: see the trace"><Icon name="git-branch" size={13} /><span>Why?</span></button>
}

/** A page block. While an agent edits it, its cursor flag sits in the gutter and the block is outlined; afterwards the chip stays in the margin. */
export function Block({ id, children, cls = '' }: { id: string; children: ReactNode; cls?: string }) {
  const w = useW(), editing = w.presence?.block === id
  return (
    <div id={'b-' + id} className={'blk ' + cls + (editing ? ' editing' : '') + (w.trace === id ? ' traced' : '')}>
      <Why id={id} />
      {editing && <span className="cursor" aria-live="polite"><Ag id={w.presence!.ag} size={14} /><span>{AG[w.presence!.ag].name}</span><i className="cursor-dots" aria-hidden="true"><b /><b /><b /></i></span>}
      <div className="blk-c">{children}</div>
      <span className="blk-m"><Chip id={id} /></span>
    </div>
  )
}
