import { useEffect, useRef } from 'react'
import { Icon } from './Icon'
import { RM } from './logic'
import { useW, type View, type W } from './store'

/**
 * The guided demo, for a CIO watching a walkthrough. Each step maps to an impression the brief asks for
 * (assembled automatically, provably accurate, continuously curated, refines itself) and drives the real UI.
 */
type Step = { v: View; sel: string; t: string; b: string; run?: (w: W) => void }
const STEPS: Step[] = [
  { v: 'home', sel: '#corpus', t: 'Assembled automatically', b: 'Six agents wrote all 1,284 pages by watching Northwind’s Slack, Salesforce, Jira and meetings. Each square is a page. It lights up when an agent updates it.' },
  { v: 'home', sel: '#lead', t: 'What changed, at a glance', b: 'Like a front page: the biggest change in Northwind’s Salesforce, written up by the agent that noticed it, with its sources.' },
  { v: 'page', sel: '#s-lead', t: 'Proof, not claims', b: 'With Evidence on, every sentence shows what it came from. Green was checked by Dana, a sysadmin. Amber is still unconfirmed.', run: (w) => w.setLens(true) },
  { v: 'page', sel: '#sim', t: 'Anyone can see how it works', b: 'Try a deal and watch its real route, step by step. The demo is generated from the rules on the page and the live Salesforce setup.', run: (w) => { w.setLens(false); w.tryDeal(240000, 28) } },
  { v: 'page', sel: '#cfg-sentence', t: 'It keeps itself current', b: 'Priya just changed Finance review in Salesforce. The agent rewrites the sentence, withdraws the old verification, and asks Dana to re-check.', run: (w) => { w.setLens(true); if (w.cfg === 'idle') w.observeChange(); else w.showCfg() } },
  { v: 'page', sel: '#renewal', t: 'It closes its own gaps', b: 'When something doesn’t add up, the agent asks the person who knows. Maria’s answer rewrites the page and becomes a source.', run: (w) => { w.setLens(false); if (w.learned) w.showRenewal(); else w.learn() } },
  { v: 'page', sel: '#s-used', t: 'It’s what the agents cite', b: 'When an agent pushes back in Slack or routes a deal, it links here to justify it. This page was cited 214 times this month.' },
]

export function Tour() {
  const w = useW(), i = w.tour, fn = useRef(w)
  fn.current = w
  useEffect(() => {
    if (i === null) return
    const s = STEPS[i], W = fn.current
    if (W.view !== s.v) W.go(s.v)
    let el: Element | null = null
    const t1 = window.setTimeout(() => {
      s.run?.(fn.current)
      el = document.querySelector(s.sel)
      if (el) { el.classList.add('tour-spot'); if (!s.run) el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' }) }
    }, W.view !== s.v ? 260 : 40)
    // Some steps rewrite the DOM; re-find the target once it settles.
    const t2 = window.setTimeout(() => { const e2 = document.querySelector(s.sel); if (e2 && e2 !== el) { el?.classList.remove('tour-spot'); el = e2; e2.classList.add('tour-spot') } }, 900)
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); el?.classList.remove('tour-spot'); document.querySelectorAll('.tour-spot').forEach((e) => e.classList.remove('tour-spot')) }
  }, [i])
  useEffect(() => {
    if (i === null) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') fn.current.endTour() }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [i])
  if (i === null) return null
  const s = STEPS[i], last = i === STEPS.length - 1
  return (
    <div className="tour" role="dialog" aria-label="Guided tour" aria-live="polite">
      <div className="tour-c">
        <div className="tour-h">
          <span className="tk">Tour · {i + 1} of {STEPS.length}</span>
          <span className="tour-dots" aria-hidden="true">{STEPS.map((_, j) => <i key={j} className={j === i ? 'cur' : j < i ? 'done' : ''} />)}</span>
          <button className="ibtn sm" onClick={w.endTour} aria-label="End the tour" title="End the tour"><Icon name="x" size={16} /></button>
        </div>
        <p className="tour-t">{s.t}</p>
        <p className="tour-b">{s.b}</p>
        <div className="tour-a">
          <button className="qbtn press" onClick={() => w.setTour(Math.max(0, i - 1))} disabled={i === 0}>Back</button>
          <button className="qbtn pri press" onClick={() => (last ? w.endTour() : w.setTour(i + 1))}>{last ? 'Finish' : 'Next'}</button>
        </div>
      </div>
    </div>
  )
}
