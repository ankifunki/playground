import type React from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
import { ARRIVAL, CHANGES, KIND, refFor, type Mark } from './data'
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
  const fromLink = (e: React.SyntheticEvent) => !!(e.target as HTMLElement).closest('button')
  return (
    <span
      ref={ref}
      className={'cl' + (on ? ' on' : '') + (on && w.blame!.pinned ? ' pin' : '') + (arr ? ' arr' : '') + (cls ? ' ' + cls : '')}
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

/** Where a sentence came from: each source, whether a person checked it, and what it replaced. */
export function Prov({ ns }: { ns: number[] }) {
  return (
    <div className="prov">
      {ns.map((n) => {
        const r = refFor(n), ch = CHANGES[n]
        return (
          <div className="pv" key={n}>
            <div className="pvk">{KIND[r.k]} · {r.d}</div>
            <div className="pvs">{r.src}</div>
            <div className="pvq">“{r.q}”</div>
            <div className="pvu">{r.u}</div>
            <div className={'pvst ' + (r.v ? 'ok' : r.check ? 'warn' : '')}>{r.v ? `Verified by ${r.v}` : r.check || 'Not checked by a person yet'}</div>
            {ch && <div className="pvch"><span className="pvk">Changed {ch.d}</span><del>{ch.was}</del><small>{ch.why}</small></div>}
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
  // Measured from the margin's own parent (the page grid): a child's layout effect runs before the parent's ref is set.
  const root = () => self.current?.parentElement || null
  const [marks, setMarks] = useState<M[]>([])
  const [noteTop, setNoteTop] = useState(0)
  useLayoutEffect(() => {
    const r = root(); if (!r) return
    const measure = () => {
      const base = r.getBoundingClientRect().top
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
    if (w.blame && r) setNoteTop(lineTop(w.blame.el, r.getBoundingClientRect().top))
  }, [w.blame])
  const b = w.blame
  return (
    <div className="margin" ref={self}>
      {marks.map((m) => (
        <button key={m.t + m.ns.join()} className={'mk ' + m.tone + (b && b.el === m.el ? ' gone' : '')} style={{ top: m.top }} onClick={() => w.pinBlame(m.ns, m.el)}>{m.t}</button>
      ))}
      {b && (
        <div className={'note' + (b.pinned ? ' pin' : '')} style={{ top: noteTop }} key={b.ns.join()}>
          <div className="nh"><span>Where this came from</span>{b.pinned ? <button className="wl" onClick={w.clearBlame}>Close</button> : <small>Click the sentence to keep this open</small>}</div>
          <Prov ns={b.ns} />
        </div>
      )}
    </div>
  )
}
