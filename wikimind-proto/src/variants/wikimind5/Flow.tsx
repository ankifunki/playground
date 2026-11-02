import { useEffect, useRef, useState } from 'react'
import { Ag } from './agents'
import { Icon } from './Icon'
import { RM } from './logic'
import { useW } from './store'

/**
 * How it works, as a simple animated diagram: the four steps a discount approval takes, with where the time goes.
 * Steps light up in turn and the connector between them fills; it loops while on screen. Reduced motion shows it all lit.
 */
export function HowFlow() {
  const w = useW(), root = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState(RM ? 4 : 0), [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = root.current; if (!el || !('IntersectionObserver' in window)) { setSeen(true); return }
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.3 })
    io.observe(el); return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (RM || !seen) return
    const t = window.setInterval(() => setAt((a) => (a >= 5 ? 0 : a + 1)), 1100)
    return () => window.clearInterval(t)
  }, [seen])
  const steps = [
    { k: 'rep', icon: <Icon name="user" size={16} />, t: 'Rep moves the deal', s: 'to Negotiation' },
    { k: 'ag', icon: <Ag id="approvals" size={32} />, t: 'Approvals agent checks it', s: 'amount and discount against the rules' },
    { k: 'ap', icon: <Icon name="user" size={16} />, t: 'Routes it to approvers', s: `manager · + Finance over ${w.fin}% · CRO over 35%` },
    { k: 'ok', icon: <Icon name="lock-open" size={16} />, t: 'Approved', s: 'the record unlocks' },
  ]
  const legs = ['instant', 'seconds', '~3 h 40 m']
  return (
    <div className="hf" ref={root}>
      <div className="hf-stat"><span className="tk">Time to completion</span><b>3 h 40 m</b><span>median, from the rep’s request to approved. Most finish in under four hours.</span></div>
      <ol className="hf-flow" aria-label="How a discount approval works">
        {steps.map((s, i) => (
          <li key={s.k} className={'hf-s' + (at > i ? ' on' : '') + (at === i + 1 ? ' cur' : '')}>
            <span className={'hf-ic' + (s.k === 'ag' ? ' ag' : '')}>{s.icon}</span>
            <span className="hf-t"><b>{s.t}</b><small>{s.s}</small></span>
            {i < legs.length && <span className={'hf-leg' + (at > i + 1 ? ' on' : '')} aria-hidden="true"><i /><em className="tk">{legs[i]}</em></span>}
          </li>
        ))}
      </ol>
    </div>
  )
}
