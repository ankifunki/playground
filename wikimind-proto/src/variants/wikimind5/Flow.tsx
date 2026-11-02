import { useEffect, useRef, useState } from 'react'
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
    { t: 'Rep moves the deal', s: 'to Negotiation', ic: 'user' },
    { t: 'Agent checks and routes it', s: 'against the rules, in seconds', ic: 'stamp' },
    { t: 'People approve', s: `manager, + Finance over ${w.fin}%, CRO over 35%`, ic: 'user' },
    { t: 'Record unlocks', s: 'the deal moves on', ic: 'lock-open' },
  ]
  const legs = ['', '4 s', '~3 h 40 m']
  return (
    <div className="hf" ref={root}>
      <div className="hf-stat"><span className="tk">The agent’s part</span><b>4 seconds</b><span>to check a deal against the rules and route it. The rest is people approving: about 3 h 40 m.</span></div>
      <ol className="hf-flow" aria-label="How a discount approval works">
        {steps.map((st, i) => (
          <li key={st.t} className={'hf-s' + (at > i ? ' on' : '') + (i === 1 ? ' agent' : '')}>
            <span className="hf-dot" aria-hidden="true"><Icon name={st.ic} size={14} /></span>
            {i < legs.length && <span className={'hf-leg' + (at > i + 1 ? ' on' : '')} aria-hidden="true"><i />{legs[i] && <em className="tk">{legs[i]}</em>}</span>}
            <span className="hf-t"><b>{st.t}</b><small>{st.s}</small></span>
          </li>
        ))}
      </ol>
    </div>
  )
}
