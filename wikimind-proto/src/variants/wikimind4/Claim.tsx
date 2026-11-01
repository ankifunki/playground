import type React from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
import { ARRIVAL, CHANGES, KIND, refFor, type Mark, type RefKind } from './data'
import { Icon, type IconName } from './Icon'
import { Ag, agentFor } from './agents'
import { useW } from './store'

const fine = () => window.matchMedia('(hover:hover) and (pointer:fine)').matches

/**
 * A sentence that knows where it came from. On wide screens, hovering or focusing it shows its sources in the
 * margin and a click pins them; on narrow screens a tap opens the same card in the bottom sheet.
 * Solid sentences carry no visible mark. Only changed or uncertain ones get a margin note (`mark`).
 */
export function C({ ns, mark, cls, children }: { ns: number[]; mark?: Mark; cls?: string; children: React.ReactNode }) {
  const w = useW(), ref = useRef<HTMLSpanElement>(null)
  const on = !!w.blame && !!ref.current && w.blame.el === ref.current
  const arr = w.arrival && ns.some((n) => ARRIVAL.ns.includes(n))
  const lit = !!w.flash && ns.some((n) => w.flash!.includes(n))
  const fromLink = (e: React.SyntheticEvent) => !!(e.target as HTMLElement).closest('button')
  return (
    <span
      ref={ref}
      className={'cl' + (on ? ' on' : '') + (on && w.blame!.pinned ? ' pin' : '') + (arr ? ' arr' : '') + (lit ? ' hlsent' : '') + (cls ? ' ' + cls : '')}
      data-ns={ns.join(',')} data-mark={mark?.t} data-tone={mark?.tone}
      tabIndex={0} role="button"
      onMouseEnter={(e) => fine() && w.hoverBlame(ns, e.currentTarget)}
      onMouseLeave={() => fine() && w.hoverBlame(null)}
      onFocus={(e) => { if (e.currentTarget.matches(':focus-visible')) w.hoverBlame(ns, e.currentTarget) }}
      onBlur={() => w.hoverBlame(null)}
      onClick={(e) => { if (!fromLink(e)) w.pinBlame(ns, e.currentTarget) }}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !fromLink(e)) { e.preventDefault(); w.pinBlame(ns, e.currentTarget) } }}
    >{children}</span>
  )
}

export const KICON: Record<RefKind, IconName> = { doc: 'file-text', sf: 'cloud', jira: 'ticket', slack: 'hash', meet: 'video', watch: 'eye', talk: 'message-circle' }
/** Feed kinds on Home, in the same icon language as sources. */
export const FICON: Record<string, IconName> = { Slack: 'hash', Salesforce: 'cloud', Jira: 'ticket', Meeting: 'video', Watched: 'eye', Integration: 'plug', Verified: 'badge-check' }

/** A single source-kind tile. Verified sources carry a small green dot. */
export function Tile({ icon, label, ok }: { icon: IconName; label: string; ok?: boolean }) {
  return <span className={'pt' + (ok ? ' v' : '')} title={label}><Icon name={icon} size={14} /></span>
}

/** Sources as an overlapping pile of icons instead of a list of names. The full list is in the label. */
export function Pile({ ns, max = 5 }: { ns: number[]; max?: number }) {
  const refs = ns.map(refFor).filter(Boolean)
  const label = refs.length + (refs.length === 1 ? ' source: ' : ' sources: ') + refs.map((r) => `${KIND[r.k]}, ${r.src}${r.v ? ', verified' : ''}`).join('; ')
  return (
    <span className="pile" role="img" aria-label={label} title={label}>
      {refs.slice(0, max).map((r, i) => <span key={i} className={'pt' + (r.v ? ' v' : '')} style={{ '--i': i } as React.CSSProperties}><Icon name={KICON[r.k]} size={14} /></span>)}
      {refs.length > max && <span className="pt more" style={{ '--i': max } as React.CSSProperties}>+{refs.length - max}</span>}
    </span>
  )
}

/** Where a sentence came from: each source, whether a person checked it, and what it replaced. */
export function Prov({ ns }: { ns: number[] }) {
  return (
    <div className="prov">
      {ns.map((n) => {
        const r = refFor(n), ch = CHANGES[n]
        return (
          <div className="pv" key={n}>
            <div className="pvh"><Tile icon={KICON[r.k]} label={KIND[r.k]} ok={!!r.v} /><span className="pvs">{r.src}</span><span className="pvk">{r.d}</span></div>
            <div className="pvq">“{r.q}”</div>
            <div className={'pvst ' + (r.v ? 'ok' : r.check ? 'warn' : '')}>{r.v ? `Verified · ${r.v}` : r.check || 'Not checked yet'}</div>
            {ch && <div className="pvch"><span className="pvk">Changed {ch.d} by {agentFor([n]).name}</span><del>{ch.was}</del></div>}
          </div>
        )
      })}
    </div>
  )
}

type M = { top: number; t: string; tone: string; el: HTMLElement; ns: number[] }
const nsOf = (el: HTMLElement) => (el.dataset.ns || '').split(',').map(Number)
const lineTop = (el: HTMLElement, base: number) => (el.getClientRects()[0] || el.getBoundingClientRect()).top - base

/**
 * The margin beside the page, like git blame: quiet marks on the sentences that need attention,
 * and the full provenance of whichever sentence is under the pointer or pinned.
 */
export function Margin() {
  const w = useW(), self = useRef<HTMLDivElement>(null)
  // Positions are measured against the margin itself (it starts level with the article); the page grid is observed for resizes.
  const root = () => self.current?.parentElement || null
  const top0 = () => self.current!.getBoundingClientRect().top
  const [marks, setMarks] = useState<M[]>([])
  const [noteTop, setNoteTop] = useState(0)
  useLayoutEffect(() => {
    const r = root(); if (!r) return
    const measure = () => {
      const base = top0()
      let last = -Infinity
      setMarks(Array.from(r.querySelectorAll<HTMLElement>('.cl[data-mark]')).map((el) => {
        const top = Math.max(lineTop(el, base), last + 32); last = top
        return { top, t: el.dataset.mark!, tone: el.dataset.tone || 'info', el, ns: nsOf(el) }
      }))
    }
    measure()
    const ro = new ResizeObserver(measure); ro.observe(r)
    return () => ro.disconnect()
  }, [w.learned, w.qas, w.arrival])
  useLayoutEffect(() => {
    const r = root()
    if (w.blame && r) setNoteTop(lineTop(w.blame.el, top0()))
  }, [w.blame])
  const b = w.blame
  return (
    <div className="margin" ref={self}>
      {marks.map((m) => (
        <button key={m.t + m.ns.join()} className={'mk ' + m.tone + (b && b.el === m.el ? ' gone' : '')} style={{ top: m.top }} onClick={() => w.pinBlame(m.ns, m.el)}>{m.t}</button>
      ))}
      {b && (
        <div className={'note' + (b.pinned ? ' pin' : '')} style={{ top: noteTop }} key={b.ns.join()}>
          <div className="nh"><Ag id={agentFor(b.ns).id} name />{b.ns.length > 1 && <Pile ns={b.ns} />}<span className="sp2" />{b.pinned && <button className="ibtn sm" onClick={w.clearBlame} aria-label="Close" title="Close"><Icon name="x" size={16} /></button>}</div>
          <Prov ns={b.ns} />
        </div>
      )}
    </div>
  )
}
