import type React from 'react'
import { memo, useCallback, useEffect, useRef } from 'react'
import { AREAS, CELLS, CORPUS_TOTAL } from './data'
import { useW } from './store'

/** The grid itself never re-renders: live updates are applied straight to the DOM. */
const Grid = memo(function Grid({ onMain }: { onMain: () => void }) {
  return (
    <div className="cp-areas">
      {AREAS.map((a, ai) => (
        <div className="cp-a" key={a.name} style={{ flexGrow: a.n } as React.CSSProperties}>
          <div className="cp-ah"><b>{a.name}</b><span className="tk">{a.n}</span></div>
          <div className="cp-g">
            {CELLS[ai].map((c, i) => c.main
              ? <button key={i} className="cp-c cp-ok main" onClick={onMain} title={c.title} aria-label={'Open ' + c.title} />
              : <span key={i} className={'cp-c cp-' + c.tier} title={c.title} />)}
          </div>
        </div>
      ))}
    </div>
  )
})

/**
 * Everything the agents know, at a glance: every page is a square, coloured by how far a person has checked it.
 * Squares light up as agents update them, and now and then one turns green when Dana verifies it.
 */
export function Corpus() {
  const w = useW(), root = useRef<HTMLDivElement>(null), recent = useRef<number[]>([]), count = useRef<HTMLSpanElement>(null), on = useRef(w.wireOn)
  on.current = w.wireOn
  const wr = useRef(w); wr.current = w
  const openMain = useCallback(() => wr.current.go('page'), [])
  useEffect(() => {
    const el = root.current; if (!el) return
    const cells = Array.from(el.querySelectorAll<HTMLElement>('.cp-c'))
    const t = window.setInterval(() => {
      if (!on.current) return
      for (let k = 0; k < 2; k++) {
        const c = cells[Math.floor(Math.random() * cells.length)]
        c.classList.remove('pz'); void c.offsetWidth; c.classList.add('pz')
        window.setTimeout(() => c.classList.remove('pz'), 1600)
        if (c.classList.contains('cp-obs') && Math.random() < 0.25) { c.classList.replace('cp-obs', 'cp-ok') }
      }
      const now = Date.now(); recent.current = [...recent.current.filter((x) => now - x < 60000), now, now]
      if (count.current) count.current.textContent = String(recent.current.length)
    }, 1100)
    return () => window.clearInterval(t)
  }, [])
  return (
    <section className="cp" id="corpus" aria-label="Everything the agents know">
      <div className="cp-h">
        <h2>Everything the agents know</h2>
        <p className="cp-n"><b>{CORPUS_TOTAL.toLocaleString()}</b> pages · <b>{w.obs.toLocaleString()}</b> observations this week · <b><span ref={count}>0</span></b> updated in the last minute</p>
      </div>
      <div className="cp-leg"><span><i className="cp-ok" />Checked by a person, 71%</span><span><i className="cp-obs" />Written from what agents saw</span><span><i className="cp-warn" />Unconfirmed</span><span><i className="cp-open" />Open question</span><span><i className="cp-now" />Updating now</span></div>
      <div ref={root}><Grid onMain={openMain} /></div>
    </section>
  )
}
