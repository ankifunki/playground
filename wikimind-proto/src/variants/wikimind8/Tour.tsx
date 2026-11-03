import { useEffect, useLayoutEffect, useState } from 'react'
import { Icon } from './Icon'
import { useW } from './store'

type Step = { page: string; sel: string; t: string; b: string; go?: (w: ReturnType<typeof useW>) => void }
/** The 1-minute tour (Wikimind 5): the CIO's impressions from the brief, one at a time, each pointing at its proof. */
const STEPS: Step[] = [
  { page: 'home', sel: '.home h1', t: 'Assembled automatically', b: 'Six agents wrote every page from Slack, tickets and six years of Salesforce changes, and keep it current. Nobody typed it.' },
  { page: 'home', sel: '.path.card', t: 'Where automation stands', b: '64% runs on its own. The rest asks a person first or waits on a named gap.' },
  { page: 'home', sel: '.sb', t: 'Every agent keeps a grove', b: 'Like a Confluence space, kept by one agent. A page being written shows in the tree.', go: (w) => w.setNav(true) },
  { page: 'discount-approvals', sel: '.byline', t: 'A page you can check', b: 'Who keeps it, who verified it, when it was last checked, and how much runs on its own.', go: (w) => w.setNav(false) },
  { page: 'discount-approvals', sel: '.hwk', t: 'How it works, played', b: 'A real deal, replayed in Salesforce from today’s config. The agent takes 4 seconds; people take the rest.' },
  { page: 'discount-approvals', sel: '#b-who-fin', t: 'It notices change', b: 'Salesforce just changed. The agent rewrites the rule in place; Dana’s verification is withdrawn until she re-checks.', go: (w) => w.change() },
  { page: 'discount-approvals', sel: '.rail', t: 'Proof for every sentence', b: 'Open any block’s trace: what was seen, the reasoning, the edit, and who verified it.', go: (w) => w.openTrace('who-fin') },
  { page: 'discount-approvals', sel: '.om-bar', t: 'Ask any agent', b: 'Type / to pick an agent. Nothing is guessed: unknowns go to a person.', go: (w) => { w.setRail(false); w.openTrace(null) } },
]

export function Tour() {
  const w = useW(), i = w.tour, [box, setBox] = useState<DOMRect | null>(null), [ready, setReady] = useState(false)
  const st = i === null ? null : STEPS[i]
  useEffect(() => {
    if (!st) return
    setReady(false)
    if (w.page !== st.page) w.go(st.page)
    // Move first, then show: scroll to the target, wait for the scroll and any panel to settle, then fade the card in place.
    const t = window.setTimeout(() => { st.go?.(w); const el = document.querySelector(st.sel); if (el && !el.closest('.rail,.sb,.om')) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 120)
    const r = window.setTimeout(() => setReady(true), 720)
    return () => { window.clearTimeout(t); window.clearTimeout(r) }
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!st) return
    let raf = 0
    // Track the target only once it has settled (and afterwards, if the reader scrolls), never mid-scroll.
    const f = () => { if (ready) { const el = document.querySelector(st.sel); const r = el ? el.getBoundingClientRect() : null; setBox((b) => (b && r && Math.abs(b.top - r.top) < .5 && Math.abs(b.left - r.left) < .5 && Math.abs(b.height - r.height) < .5 ? b : r)) } raf = requestAnimationFrame(f) }
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf)
  }, [i, ready]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (i === null) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') w.setTour(null); if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft' && i > 0) w.setTour(i - 1) }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  })
  if (!st || i === null) return null
  const next = () => (i < STEPS.length - 1 ? w.setTour(i + 1) : w.setTour(null))
  const W = 340, below = box ? box.bottom + 210 < innerHeight : true
  const left = box ? Math.max(16, Math.min(innerWidth - W - 16, box.left + box.width / 2 - W / 2)) : innerWidth / 2 - W / 2
  const top = box ? (below ? Math.min(innerHeight - 220, box.bottom + 14) : Math.max(16, box.top - 14 - 190)) : innerHeight / 2 - 100
  return (
    <>
      {box && ready && <div className="tour-ring" style={{ left: box.left - 6, top: box.top - 6, width: box.width + 12, height: box.height + 12 }} />}
      <div className={'tour-card' + (ready ? ' on' : '')} role="dialog" aria-label={st.t} style={{ left, top, width: W }} key={i}>
        <span className="tk">{i + 1} of {STEPS.length}</span>
        <b>{st.t}</b>
        <p>{st.b}</p>
        <div className="tour-f">
          <span className="tour-dots">{STEPS.map((_, n) => <i key={n} className={n === i ? 'on' : n < i ? 'done' : ''} />)}</span>
          <button className="tour-x" onClick={() => w.setTour(null)}>Skip</button>
          {i > 0 && <button className="ib" onClick={() => w.setTour(i - 1)} aria-label="Back"><Icon name="arrow-right" size={14} /></button>}
          <button className="btn primary tour-n" onClick={next}>{i < STEPS.length - 1 ? 'Next' : 'Done'}</button>
        </div>
      </div>
    </>
  )
}
