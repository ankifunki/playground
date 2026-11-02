import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
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

/**
 * The margin chip on anything an agent changed: who, when, and on tap, why, from what, and what it said before.
 * The popover is portalled to the body with fixed positioning, so no scroll container or table can clip it; it opens
 * below the chip (above it when there is no room) and closes on scroll, Esc or a click outside.
 */
export function Chip({ id }: { id: string }) {
  const w = useW(), y = w.why[id], [at, setAt] = useState<{ x: number; y: number; up: boolean } | null>(null)
  const btn = useRef<HTMLButtonElement>(null), pop = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!at) return
    const y0 = scrollY
    const close = (e: Event) => { if (e.type === 'scroll' && Math.abs(scrollY - y0) < 40) return; if (e.type === 'keydown' && (e as KeyboardEvent).key !== 'Escape') return; if (e.type === 'mousedown' && (pop.current?.contains(e.target as Node) || btn.current?.contains(e.target as Node))) return; setAt(null) }
    document.addEventListener('mousedown', close); addEventListener('scroll', close); addEventListener('resize', close); addEventListener('keydown', close)
    return () => { document.removeEventListener('mousedown', close); removeEventListener('scroll', close); removeEventListener('resize', close); removeEventListener('keydown', close) }
  }, [at])
  if (!y) return null
  const s = (w.now - y.at) / 1000, recent = s < 8
  const toggle = () => {
    if (at) return setAt(null)
    const r = btn.current!.getBoundingClientRect(), W = Math.min(320, innerWidth - 24)
    setAt({ x: Math.max(12, Math.min(r.right - W, innerWidth - W - 12)), y: r.bottom + 220 > innerHeight ? r.top - 8 : r.bottom + 8, up: r.bottom + 220 > innerHeight })
  }
  return (
    <span className="chip-w">
      <button ref={btn} className={'chip' + (recent ? ' new' : '')} onClick={toggle} aria-expanded={!!at}>
        <Ag id={y.ag} size={16} /><span>Edited {recent ? 'just now' : ago(s)}</span>
      </button>
      {at && createPortal(
        <span ref={pop} className={'pop w7-pop' + (at.up ? ' up' : '')} role="dialog" aria-label="Why this changed" style={{ left: at.x, top: at.y }}>
          <span className="pop-h"><Ag id={y.ag} name size={20} /><span className="tk">{ago(s)}</span></span>
          <span className="pop-l">Why</span><span className="pop-v">{y.t}</span>
          <span className="pop-l">From</span><span className="pop-v">{y.src}</span>
          <span className="pop-l">Before</span><span className="pop-v"><del>{y.before}</del></span>
        </span>, document.body)}
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
